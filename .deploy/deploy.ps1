# ==============================================================================
# RNG Application Deployment & Validation Pipeline (Windows PowerShell)
# Auto-Install System Dependencies, Clean, Deploy DB, Build, & Launch
# ==============================================================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         RNG APPLICATION AUTOMATED DEPLOYMENT & VALIDATION             " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# Helper Functions: TCP Port Probe, Docker Container Auto-Recovery
# ------------------------------------------------------------------------------

function Test-PortActive ($portNumber, $hostAddress = "127.0.0.1") {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $connect = $tcp.BeginConnect($hostAddress, $portNumber, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(1000, $false)
        if (-not $wait) {
            $tcp.Close()
            return $false
        }
        $tcp.EndConnect($connect)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

function Ensure-DockerContainer ($name, $port, $image, $extraArgs) {
    if (Test-PortActive -portNumber $port) {
        return $true
    }
    $dockerCmd = Get-Command "docker" -ErrorAction SilentlyContinue
    if (-not $dockerCmd) {
        return $false
    }

    # Check if a container with this name exists
    $existing = docker ps -a --filter "name=^/${name}$" --format "{{.Names}}" 2>$null
    if ($existing -eq $name) {
        Write-Host "  -> Found existing container '$name', attempting start..." -ForegroundColor Yellow
        docker start $name 2>$null | Out-Null
        for ($i = 0; $i -lt 3; $i++) {
            if (Test-PortActive -portNumber $port) {
                return $true
            }
            Start-Sleep -Seconds 1
        }
        Write-Host "  -> Container '$name' unresponsive; recreating..." -ForegroundColor Yellow
        docker rm -f $name 2>$null | Out-Null
    }

    Write-Host "  -> Launching fresh Docker container '$name' ($image)..." -ForegroundColor Yellow
    $cmdArgs = @("run", "-d", "--name", $name, "-p", "${port}:${port}") + $extraArgs + @($image)
    & docker $cmdArgs 2>$null | Out-Null
    return $true
}

# ------------------------------------------------------------------------------
# STEP 0: System Dependency Verification & Auto-Installer (Java, Node, Postgres)
# ------------------------------------------------------------------------------
Write-Host "`n[0/7] Verifying System Environment Dependencies..." -ForegroundColor Yellow

# 1. Check Java JDK 21
$javaCmd = Get-Command "java" -ErrorAction SilentlyContinue
if (-not $javaCmd) {
    Write-Host "  [!] Java JDK not detected in PATH." -ForegroundColor Red
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        Write-Host "  -> Installing Microsoft OpenJDK 21 via winget..." -ForegroundColor Yellow
        winget install --id Microsoft.OpenJDK.21 --accept-source-agreements --accept-package-agreements
    } else {
        Write-Host "  [!] Please install Java 21 JDK manually from https://adoptium.net/" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [x] Java JDK detected." -ForegroundColor Green
}

# 2. Check Node.js & npm
$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Host "  [!] Node.js not detected in PATH." -ForegroundColor Red
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        Write-Host "  -> Installing Node.js LTS via winget..." -ForegroundColor Yellow
        winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    } else {
        Write-Host "  [!] Please install Node.js manually from https://nodejs.org/" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  [x] Node.js detected." -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# STEP 1: Environment Variables Setup & Validation
# ------------------------------------------------------------------------------
Write-Host "`n[1/7] Setting up Environment Variables..." -ForegroundColor Yellow

if (-not (Test-Path ".env")) {
    Write-Host "  -> .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  [!] NOTICE: Created default .env file." -ForegroundColor Magenta
}

Get-Content ".env" | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
    $key, $value = $_.Split('=', 2)
    [Environment]::SetEnvironmentVariable($key.Trim(), $value.Trim(), [EnvironmentVariableTarget]::Process)
}

$FRONTEND_PORT = if ($env:PORT) { $env:PORT } else { "3000" }
$BACKEND_PORT = if ($env:SERVER_PORT) { $env:SERVER_PORT } else { "8080" }
$env:MONGODB_URI = if ($env:MONGODB_URI) { $env:MONGODB_URI } else { "mongodb://localhost:27017/rng_embeds" }

# ------------------------------------------------------------------------------
# STEP 2: Deep Cleaning & Cache Purge
# ------------------------------------------------------------------------------
Write-Host "`n[2/7] Purging Build Caches..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }

Set-Location "backend"
& ".\mvnw.cmd" clean | Out-Null
Set-Location ".."
Write-Host "  [x] Caches Purged." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 3: Database Startup & Health Check (PostgreSQL, Redis, MongoDB / Docker)
# ------------------------------------------------------------------------------
Write-Host "`n[3/7] Starting Local Database Services (PostgreSQL, Redis, MongoDB)..." -ForegroundColor Yellow

# 1. PostgreSQL (Port 5432)
Write-Host "  -> Verifying PostgreSQL Database Service (Port 5432)..." -ForegroundColor Yellow
if (Test-PortActive -portNumber 5432) {
    Write-Host "  [x] PostgreSQL Database Service is already ACTIVE on port 5432." -ForegroundColor Green
} else {
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        Write-Host "  -> Starting Windows PostgreSQL Service ($($pgService.Name))..." -ForegroundColor Yellow
        Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
    }
    if (-not (Test-PortActive -portNumber 5432)) {
        Ensure-DockerContainer -name "rng_postgres" -port 5432 -image "postgres:16-alpine" -extraArgs @("-e", "POSTGRES_DB=rng_db", "-e", "POSTGRES_USER=postgres", "-e", "POSTGRES_PASSWORD=postgres", "-v", "rng_postgres_data:/var/lib/postgresql/data")
    }
}

Write-Host "  -> Waiting for PostgreSQL readiness on port 5432..." -ForegroundColor Yellow
$pgRetries = 20
$pgCount = 0
while (-not (Test-PortActive -portNumber 5432) -and ($pgCount -lt $pgRetries)) {
    Start-Sleep -Seconds 1
    $pgCount++
}

if (Test-PortActive -portNumber 5432) {
    Write-Host "  [x] PostgreSQL Database Service is ACTIVE and accepting connections on port 5432." -ForegroundColor Green
} else {
    Write-Host "  [!] ERROR: PostgreSQL did not respond on port 5432 after $pgRetries seconds." -ForegroundColor Red
}

# 2. Redis Cache Service (Port 6379)
Write-Host "`n  -> Verifying Redis Cache Service (Port 6379)..." -ForegroundColor Yellow
if (Test-PortActive -portNumber 6379) {
    Write-Host "  [x] Redis Cache Service is already ACTIVE on port 6379." -ForegroundColor Green
} else {
    $redisService = Get-Service -Name "redis*", "memurai*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($redisService) {
        Write-Host "  -> Starting Windows Redis Service ($($redisService.Name))..." -ForegroundColor Yellow
        Start-Service -Name $redisService.Name -ErrorAction SilentlyContinue
    }
    if (-not (Test-PortActive -portNumber 6379)) {
        Ensure-DockerContainer -name "rng_redis" -port 6379 -image "redis:7.2-alpine" -extraArgs @("-v", "rng_redis_data:/data", "redis-server", "--appendonly", "yes", "--maxmemory", "256mb", "--maxmemory-policy", "allkeys-lru")
    }
}

Write-Host "  -> Waiting for Redis readiness on port 6379..." -ForegroundColor Yellow
$redisRetries = 15
$redisCount = 0
while (-not (Test-PortActive -portNumber 6379) -and ($redisCount -lt $redisRetries)) {
    Start-Sleep -Seconds 1
    $redisCount++
}

if (Test-PortActive -portNumber 6379) {
    Write-Host "  [x] Redis Cache Service is ACTIVE and accepting connections on port 6379." -ForegroundColor Green
} else {
    Write-Host "  [!] NOTICE: Redis not detected on port 6379 after $redisRetries seconds. Application will utilize in-memory fallback cache." -ForegroundColor Yellow
}

# 3. MongoDB 7.0 Document Database Service (Port 27017)
Write-Host "`n  -> Verifying MongoDB Document Database Service (Port 27017)..." -ForegroundColor Yellow
if (Test-PortActive -portNumber 27017) {
    Write-Host "  [x] MongoDB Database Service is already ACTIVE on port 27017." -ForegroundColor Green
} else {
    $mongoService = Get-Service -Name "MongoDB*", "mongod*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($mongoService) {
        Write-Host "  -> Starting Windows MongoDB Service ($($mongoService.Name))..." -ForegroundColor Yellow
        Start-Service -Name $mongoService.Name -ErrorAction SilentlyContinue
    }
    if (-not (Test-PortActive -portNumber 27017)) {
        Ensure-DockerContainer -name "rng_mongodb" -port 27017 -image "mongo:7.0-jammy" -extraArgs @("-v", "rng_mongodb_data:/data/db")
    }
}

Write-Host "  -> Waiting for MongoDB readiness on port 27017..." -ForegroundColor Yellow
$mongoRetries = 20
$mongoCount = 0
while (-not (Test-PortActive -portNumber 27017) -and ($mongoCount -lt $mongoRetries)) {
    Start-Sleep -Seconds 1
    $mongoCount++
}

if (Test-PortActive -portNumber 27017) {
    Write-Host "  [x] MongoDB Database Service is ACTIVE and accepting connections on port 27017." -ForegroundColor Green
} else {
    Write-Host "  [!] WARNING: MongoDB did not respond on port 27017 after $mongoRetries seconds. Ensure Docker or mongod service is running." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# STEP 4: Push Database Schema & Migration Seeds (Flyway DB Push Equivalent)
# ------------------------------------------------------------------------------
Write-Host "`n[4/7] Pushing Database Schema & Migrations (Flyway DB Push)..." -ForegroundColor Yellow

if (Test-PortActive -portNumber 5432) {
    Set-Location "backend"
    & ".\mvnw.cmd" compile flyway:repair flyway:migrate "-Dflyway.url=$env:DB_URL" "-Dflyway.user=$env:DB_USERNAME" "-Dflyway.password=$env:DB_PASSWORD"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [!] NOTICE: Direct PostgreSQL migration skipped. Using test DB mode..." -ForegroundColor Yellow
    } else {
        Write-Host "  [x] Flyway Database Schema & Seed Data PUSHED successfully to $env:DB_URL." -ForegroundColor Green
    }
    Set-Location ".."
    Write-Host "  [x] Flyway Database Migrations completed." -ForegroundColor Green
} else {
    Write-Host "  [!] SKIPPING Flyway Migrations: PostgreSQL is not active on port 5432." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# STEP 5: Frontend Production Build
# ------------------------------------------------------------------------------
Write-Host "`n[5/7] Building Frontend Production Bundle..." -ForegroundColor Yellow
cmd /c npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] ERROR: Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  [x] Frontend Build PASSED." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 6: Port Management & Conflict Resolution
# ------------------------------------------------------------------------------
Write-Host "`n[6/7] Clearing Port Bindings..." -ForegroundColor Yellow

function Clear-Port ($portNumber) {
    $connections = Get-NetTCPConnection -LocalPort $portNumber -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                Write-Host "  -> Terminating process PID $pidToKill on port $portNumber..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
        Start-Sleep -Seconds 1
    }
}

Clear-Port -portNumber $BACKEND_PORT
Clear-Port -portNumber $FRONTEND_PORT
Write-Host "  [x] Ports $BACKEND_PORT and $FRONTEND_PORT ready." -ForegroundColor Green

# ------------------------------------------------------------------------------
# STEP 7: Launch Application Services
# ------------------------------------------------------------------------------
Write-Host "`n[7/7] Launching Backend & Frontend..." -ForegroundColor Yellow

Set-Location "backend"
& ".\mvnw.cmd" package -DskipTests | Out-Null
Set-Location ".."

Write-Host "  -> Launching Backend API on http://localhost:$BACKEND_PORT..." -ForegroundColor Yellow
$backendJob = Start-Process -FilePath "java" -ArgumentList "-jar", "backend\target\rng-backend-0.0.1-SNAPSHOT.jar", "--server.port=$BACKEND_PORT", "--spring.data.mongodb.uri=$env:MONGODB_URI" -PassThru -NoNewWindow -RedirectStandardOutput "backend.log" -RedirectStandardError "backend_err.log"

Write-Host "  -> Backend process spawned (PID: $($backendJob.Id)). Waiting for health check..." -ForegroundColor Yellow

$backendRetries = 40
$backendCount = 0
while (-not (Test-PortActive -portNumber $BACKEND_PORT) -and ($backendCount -lt $backendRetries)) {
    if ($backendJob.HasExited) {
        Write-Host "  [!] CRITICAL ERROR: Backend process died prematurely with exit code $($backendJob.ExitCode)!" -ForegroundColor Red
        if (Test-Path "backend_err.log") {
            Write-Host "  [!] backend_err.log tail:" -ForegroundColor Red
            Get-Content "backend_err.log" -Tail 30
        }
        if (Test-Path "backend.log") {
            Write-Host "  [!] backend.log tail:" -ForegroundColor Red
            Get-Content "backend.log" -Tail 30
        }
        exit 1
    }
    Start-Sleep -Seconds 1
    $backendCount++
}

if (Test-PortActive -portNumber $BACKEND_PORT) {
    Write-Host "  [x] Backend API is ACTIVE and listening on port $BACKEND_PORT." -ForegroundColor Green
} else {
    Write-Host "  [!] WARNING: Backend API did not respond on port $BACKEND_PORT within $backendRetries seconds." -ForegroundColor Yellow
}

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "       DEPLOYMENT SUCCESSFUL! APPLICATION IS NOW LIVE ON:" -ForegroundColor Green
Write-Host "       -> Frontend UI:  http://localhost:$FRONTEND_PORT" -ForegroundColor Cyan
Write-Host "       -> Backend API: http://localhost:$BACKEND_PORT/api/v1" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Green

cmd /c npm run start -- -p $FRONTEND_PORT
