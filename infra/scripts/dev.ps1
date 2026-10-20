# ==============================================================================
# RNG Full-Stack Local Development Automation (Windows PowerShell)
# Orchestrates Docker datastores, backend Spring Boot API, and frontend Next.js
# ==============================================================================

$ErrorActionPreference = "Continue"

# Resolve repository root
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $RepoRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "       RNG CONTROL CENTER - LOCAL DEVELOPMENT ENVIRONMENT             " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Repo Root: $RepoRoot`n" -ForegroundColor DarkGray

# ------------------------------------------------------------------------------
# 1. Docker Status Check & Auto-Recovery
# ------------------------------------------------------------------------------
Write-Host "[1/5] Verifying Docker daemon status..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    & docker info > $null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "  [x] Docker daemon is running and accessible." -ForegroundColor Green
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "  [!] Docker daemon is not running." -ForegroundColor Yellow
    $dockerDesktopPaths = @(
        "C:\Program Files\Docker\Docker\Docker Desktop.exe",
        "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
    )
    $dockerStarted = $false
    foreach ($path in $dockerDesktopPaths) {
        if (Test-Path $path) {
            Write-Host "  -> Attempting to start Docker Desktop from $path..." -ForegroundColor Yellow
            Start-Process -FilePath $path -ErrorAction SilentlyContinue
            $dockerStarted = $true
            break
        }
    }

    if ($dockerStarted) {
        Write-Host "  -> Waiting for Docker daemon to initialize..." -ForegroundColor Yellow
        $retries = 30
        while ($retries -gt 0) {
            Start-Sleep -Seconds 2
            & docker info > $null 2>&1
            if ($LASTEXITCODE -eq 0) {
                $dockerRunning = $true
                Write-Host "  [x] Docker daemon successfully initialized." -ForegroundColor Green
                break
            }
            $retries--
        }
    }

    if (-not $dockerRunning) {
        Write-Host "  [!] WARNING: Docker could not be started automatically." -ForegroundColor Red
        Write-Host "  [!] Please launch Docker Desktop manually if you need PostgreSQL, Redis, or MongoDB." -ForegroundColor Yellow
    }
}

# ------------------------------------------------------------------------------
# 2. Start Background Data Stores (PostgreSQL, Redis, MongoDB)
# ------------------------------------------------------------------------------
Write-Host "`n[2/5] Starting background data stores (PostgreSQL, Redis, MongoDB)..." -ForegroundColor Yellow
if ($dockerRunning) {
    & docker compose up -d --wait postgres redis mongodb
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [x] Data stores (postgres, redis, mongodb) are up and running." -ForegroundColor Green
    } else {
        Write-Host "  [!] WARNING: docker compose up returned non-zero code $LASTEXITCODE." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [!] Skipping 'docker compose up' because Docker is not available." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 3. Development Toolchain Verification (JDK 25, Node.js)
# ------------------------------------------------------------------------------
Write-Host "`n[3/5] Verifying development toolchains (Java 25, Node.js)..." -ForegroundColor Yellow

# Check Java / JDK 25
$javaOutput = ""
try {
    $javaOutput = (& java -version 2>&1 | Out-String)
} catch {
    $javaOutput = ""
}

if ($javaOutput -match '(?:version|build) "?(25[\d\.]*)') {
    Write-Host "  [x] Java 25 detected ($($Matches[1]))." -ForegroundColor Green
} elseif ($javaOutput -ne "") {
    $firstLine = ($javaOutput -split "`r?`n")[0]
    Write-Host "  [!] Active Java version: $firstLine" -ForegroundColor Yellow
    Write-Host "      Recommended: Eclipse Temurin 25 LTS or Microsoft OpenJDK 25." -ForegroundColor DarkGray
} else {
    Write-Host "  [!] ERROR: Java is not found in PATH! Please install Java 25 JDK." -ForegroundColor Red
}

# Check Node.js
$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVersion = (& node -v)
    Write-Host "  [x] Node.js detected ($nodeVersion)." -ForegroundColor Green
} else {
    Write-Host "  [!] ERROR: Node.js is not found in PATH! Please install Node.js (LTS recommended)." -ForegroundColor Red
}

# ------------------------------------------------------------------------------
# 4. Pre-Flight Compilation & Type Checking (mvn compile, npx tsc --noEmit)
# ------------------------------------------------------------------------------
Write-Host "`n[4/5] Running pre-flight build & type-check verification..." -ForegroundColor Yellow

$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$backendMvnw = Join-Path $BackendDir "mvnw.cmd"

Write-Host "  -> Verifying backend compilation ('$backendMvnw compile -q')..." -ForegroundColor Cyan
& cmd.exe /c "`"$backendMvnw`" compile -q"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  [!] ERROR: Backend compilation failed with exit code $LASTEXITCODE! Aborting startup." -ForegroundColor Red
    exit 1
}
Write-Host "  [x] Backend Java classes compiled cleanly." -ForegroundColor Green

Write-Host "  -> Verifying frontend TypeScript types ('npx tsc --noEmit')..." -ForegroundColor Cyan
Push-Location $FrontendDir
& cmd.exe /c "npx tsc --noEmit"
$tscExit = $LASTEXITCODE
Pop-Location
if ($tscExit -ne 0) {
    Write-Host "  [!] ERROR: Frontend TypeScript type check failed with exit code $tscExit! Aborting startup." -ForegroundColor Red
    exit 1
}
Write-Host "  [x] Frontend TypeScript type check passed." -ForegroundColor Green

# ------------------------------------------------------------------------------
# 5. Concurrently Launch Backend & Frontend with Clean Shutdown
# ------------------------------------------------------------------------------
Write-Host "`n[5/5] Launching Spring Boot backend and Next.js frontend concurrently..." -ForegroundColor Yellow

Write-Host "  -> Launching Backend via '$backendMvnw spring-boot:run'..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "`"$backendMvnw`" spring-boot:run" `
    -WorkingDirectory $BackendDir `
    -PassThru

Write-Host "  -> Launching Frontend via 'npm run dev' in '$FrontendDir'..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory $FrontendDir `
    -PassThru

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "   RNG FULL-STACK LOCAL DEVELOPMENT SERVERS SPAWNED SUCCESSFULLY      " -ForegroundColor Green
Write-Host "     * Frontend UI: http://localhost:3000                             " -ForegroundColor Cyan
Write-Host "     * Backend API: http://localhost:8080/api/v1                      " -ForegroundColor Cyan
Write-Host "                                                                      " -ForegroundColor Green
Write-Host "   Press [Ctrl+C] in this console to terminate all services cleanly.  " -ForegroundColor Yellow
Write-Host "======================================================================`n" -ForegroundColor Green

$cleanupExecuted = $false
$cleanupAction = {
    if ($cleanupExecuted) { return }
    $script:cleanupExecuted = $true
    Write-Host "`n`nShutting down local development processes cleanly..." -ForegroundColor Yellow

    if ($backendProcess -and -not $backendProcess.HasExited) {
        Write-Host "  -> Stopping Spring Boot backend (PID: $($backendProcess.Id))..." -ForegroundColor DarkGray
        & taskkill /F /T /PID $backendProcess.Id 2>$null | Out-Null
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Write-Host "  -> Stopping Next.js frontend (PID: $($frontendProcess.Id))..." -ForegroundColor DarkGray
        & taskkill /F /T /PID $frontendProcess.Id 2>$null | Out-Null
    }
    Write-Host "  [x] All development services stopped." -ForegroundColor Green
}

try {
    while ($true) {
        if ($backendProcess.HasExited -and $frontendProcess.HasExited) {
            Write-Host "Both backend and frontend processes have exited." -ForegroundColor Yellow
            break
        }
        Start-Sleep -Milliseconds 500
    }
} finally {
    & $cleanupAction
}
