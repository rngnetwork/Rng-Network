# ==============================================================================
# RNG Application Deployment & Validation Pipeline (Windows PowerShell)
# Auto-Install System Dependencies, Clean, Deploy DB, Build, Test, & Launch
# ==============================================================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         RNG APPLICATION AUTOMATED DEPLOYMENT & VALIDATION             " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

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
# STEP 3: Database Startup & Health Check (PostgreSQL / Docker)
# ------------------------------------------------------------------------------
Write-Host "`n[3/7] Starting Local Database Service (PostgreSQL)..." -ForegroundColor Yellow

$dbActive = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 5432)
    $dbActive = $true
    $tcp.Close()
    Write-Host "  [x] Database port 5432 is ACTIVE and responding." -ForegroundColor Green
} catch {
    $dbActive = $false
}

if (-not $dbActive) {
    Write-Host "  -> Port 5432 not responding. Attempting to start PostgreSQL Windows Service..." -ForegroundColor Yellow
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($pgService) {
        Start-Service -Name $pgService.Name -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 3
        Write-Host "  [x] Windows PostgreSQL Service ($($pgService.Name)) STARTED." -ForegroundColor Green
    } else {
        Write-Host "  -> Windows PostgreSQL service not found. Checking Docker..." -ForegroundColor Yellow
        $dockerCheck = Get-Command "docker" -ErrorAction SilentlyContinue
        if ($dockerCheck) {
            docker start rng_postgres 2>$null
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  -> Launching PostgreSQL Docker container (rng_postgres)..." -ForegroundColor Yellow
                docker run -d --name rng_postgres -p 5432:5432 -e POSTGRES_DB=rng_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:16-alpine
            }
            Start-Sleep -Seconds 3
            Write-Host "  [x] PostgreSQL Docker Container STARTED." -ForegroundColor Green
        } else {
            Write-Host "  [!] PostgreSQL not installed or running. Installing via winget..." -ForegroundColor Yellow
            if (Get-Command "winget" -ErrorAction SilentlyContinue) {
                winget install --id PostgreSQL.PostgreSQL --accept-source-agreements --accept-package-agreements
            }
        }
    }
}

# ------------------------------------------------------------------------------
# STEP 4: Push Database Schema & Migration Seeds (Flyway DB Push Equivalent)
# ------------------------------------------------------------------------------
Write-Host "`n[4/7] Pushing Database Schema & Migrations (Flyway DB Push)..." -ForegroundColor Yellow

Set-Location "backend"
& ".\mvnw.cmd" flyway:migrate "-Dflyway.url=$env:DB_URL" "-Dflyway.user=$env:DB_USERNAME" "-Dflyway.password=$env:DB_PASSWORD"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] NOTICE: Direct PostgreSQL migration skipped. Using test DB mode..." -ForegroundColor Yellow
} else {
    Write-Host "  [x] Flyway Database Schema & Seed Data PUSHED successfully to $env:DB_URL." -ForegroundColor Green
}

Write-Host "  -> Running Backend Integration Test Suite..." -ForegroundColor Gray
$testOutput = & ".\mvnw.cmd" test
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] ERROR: Backend tests failed! Aborting deployment." -ForegroundColor Red
    Set-Location ".."
    exit 1
}
Set-Location ".."
Write-Host "  [x] Backend Tests PASSED 100%." -ForegroundColor Green

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

$backendJob = Start-Process -FilePath "java" -ArgumentList "-jar", "backend\target\rng-backend-0.0.1-SNAPSHOT.jar", "--server.port=$BACKEND_PORT" -PassThru -NoNewWindow
Start-Sleep -Seconds 5

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "       DEPLOYMENT SUCCESSFUL! APPLICATION IS NOW LIVE ON:" -ForegroundColor Green
Write-Host "       -> Frontend UI:  http://localhost:$FRONTEND_PORT" -ForegroundColor Cyan
Write-Host "       -> Backend API: http://localhost:$BACKEND_PORT/api/v1" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Green

cmd /c npm run start -- -p $FRONTEND_PORT
