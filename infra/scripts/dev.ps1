# ==============================================================================
# RNG Full-Stack Environment Automation (Windows PowerShell)
#
# Modes:
#   .\infra\scripts\dev.ps1 -Dev    : Development mode
#                                     - Instantiates the 3 Docker datastores (PostgreSQL, Redis, MongoDB)
#                                     - Uses backend/.env and frontend/.env.local (auto-seeded if missing)
#                                     - Runs Spring Boot and Next.js (npm run dev with HMR) locally
#
#   .\infra\scripts\dev.ps1         : Production mode (Default)
#   .\infra\scripts\dev.ps1 -Prod   : Explicit Production mode
#                                     - Instantiates ALL 5 services in Docker (PostgreSQL, Redis, MongoDB, Backend, Frontend)
#                                     - Uses root .env file (auto-seeded from .env.example if missing)
#                                     - Streams container logs with clean stop on Ctrl+C
# ==============================================================================

param (
    [switch]$Dev,
    [switch]$Prod
)

$ErrorActionPreference = "Continue"

$isDevMode = $Dev.IsPresent
$modeLabel = if ($isDevMode) { "DEVELOPMENT (Local HMR + Docker Datastores)" } else { "PRODUCTION (Full Containerized Docker Stack)" }

# Resolve repository root
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $RepoRoot

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "       RNG CONTROL CENTER - ENVIRONMENT LAUNCHER                      " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "Repo Root: $RepoRoot" -ForegroundColor DarkGray
Write-Host "Mode:      $modeLabel`n" -ForegroundColor Yellow

# ------------------------------------------------------------------------------
# 1. Docker Status Check & Auto-Recovery
# ------------------------------------------------------------------------------
Write-Host "[1/4] Verifying Docker daemon status..." -ForegroundColor Yellow
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
        if (-not $isDevMode) {
            Write-Host "  [!] ERROR: Docker is strictly required to run production container stack. Aborting." -ForegroundColor Red
            exit 1
        } else {
            Write-Host "  [!] WARNING: Docker is not available. Skipping datastores container startup." -ForegroundColor Yellow
        }
    }
}

# ==============================================================================
# MODE: PRODUCTION (Full Containerized Stack in Docker)
# ==============================================================================
if (-not $isDevMode) {
    Write-Host "`n[2/4] Verifying production environment configuration..." -ForegroundColor Yellow
    $rootEnv = Join-Path $RepoRoot ".env"
    $rootEnvExample = Join-Path $RepoRoot ".env.example"

    if (-not (Test-Path $rootEnv) -and (Test-Path $rootEnvExample)) {
        Write-Host "  -> Root .env not found. Initializing from .env.example..." -ForegroundColor Cyan
        Copy-Item $rootEnvExample $rootEnv
        Write-Host "  [x] Root .env initialized." -ForegroundColor Green
    } elseif (Test-Path $rootEnv) {
        Write-Host "  [x] Root .env configuration found." -ForegroundColor Green
    }

    Write-Host "`n[3/4] Building and launching full Docker Compose stack (5 services)..." -ForegroundColor Yellow
    & docker compose up -d --build --wait

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  [!] ERROR: Docker Compose failed to start services. Aborting." -ForegroundColor Red
        exit 1
    }

    Write-Host "`n======================================================================" -ForegroundColor Green
    Write-Host "   RNG PRODUCTION STACK DEPLOYED SUCCESSFULLY IN DOCKER               " -ForegroundColor Green
    Write-Host "     * Mode:        PRODUCTION (Containerized)                        " -ForegroundColor Yellow
    Write-Host "     * Frontend UI: http://localhost:3000                             " -ForegroundColor Cyan
    Write-Host "     * Backend API: http://localhost:8080/api/v1                      " -ForegroundColor Cyan
    Write-Host "     * Datastores:  PostgreSQL (5432), Redis (6379), MongoDB (27017)  " -ForegroundColor Cyan
    Write-Host "                                                                      " -ForegroundColor Green
    Write-Host "   Streaming container logs below. Press [Ctrl+C] to stop all services." -ForegroundColor Yellow
    Write-Host "======================================================================`n" -ForegroundColor Green

    $cleanupExecuted = $false
    $cleanupAction = {
        if ($cleanupExecuted) { return }
        $script:cleanupExecuted = $true
        Write-Host "`n`nStopping Docker containers cleanly..." -ForegroundColor Yellow
        & docker compose stop
        Write-Host "  [x] All containers stopped." -ForegroundColor Green
    }

    try {
        & docker compose logs -f
    } finally {
        & $cleanupAction
    }
    exit 0
}

# ==============================================================================
# MODE: DEVELOPMENT (Local Host Backend/Frontend + Docker Datastores)
# ==============================================================================

Write-Host "`n[2/4] Verifying local development environment files..." -ForegroundColor Yellow

$backendEnv = Join-Path $RepoRoot "backend\.env"
$backendEnvExample = Join-Path $RepoRoot "backend\.env.example"
if (-not (Test-Path $backendEnv) -and (Test-Path $backendEnvExample)) {
    Write-Host "  -> backend\.env not found. Initializing from backend\.env.example..." -ForegroundColor Cyan
    Copy-Item $backendEnvExample $backendEnv
    Write-Host "  [x] backend\.env initialized." -ForegroundColor Green
} elseif (Test-Path $backendEnv) {
    Write-Host "  [x] backend\.env found." -ForegroundColor Green
}

$frontendEnvLocal = Join-Path $RepoRoot "frontend\.env.local"
$frontendEnvLocalExample = Join-Path $RepoRoot "frontend\.env.local.example"
if (-not (Test-Path $frontendEnvLocal) -and (Test-Path $frontendEnvLocalExample)) {
    Write-Host "  -> frontend\.env.local not found. Initializing from frontend\.env.local.example..." -ForegroundColor Cyan
    Copy-Item $frontendEnvLocalExample $frontendEnvLocal
    Write-Host "  [x] frontend\.env.local initialized." -ForegroundColor Green
} elseif (Test-Path $frontendEnvLocal) {
    Write-Host "  [x] frontend\.env.local found." -ForegroundColor Green
}

if ($dockerRunning) {
    Write-Host "  -> Starting background datastores (postgres, redis, mongodb)..." -ForegroundColor Cyan
    & docker compose up -d --wait postgres redis mongodb
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  [x] Datastores (postgres, redis, mongodb) started and ready." -ForegroundColor Green
    } else {
        Write-Host "  [!] WARNING: docker compose up returned exit code $LASTEXITCODE." -ForegroundColor Yellow
    }
} else {
    Write-Host "  [!] Skipping datastore container startup (Docker unavailable)." -ForegroundColor Yellow
}

# ------------------------------------------------------------------------------
# 3. Toolchain & Pre-Flight Verification
# ------------------------------------------------------------------------------
Write-Host "`n[3/4] Verifying development toolchains (Java 25, Node.js)..." -ForegroundColor Yellow

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
} else {
    Write-Host "  [!] ERROR: Java is not found in PATH! Please install Java 25 JDK." -ForegroundColor Red
    exit 1
}

$nodeCmd = Get-Command "node" -ErrorAction SilentlyContinue
if ($nodeCmd) {
    $nodeVersion = (& node -v)
    Write-Host "  [x] Node.js detected ($nodeVersion)." -ForegroundColor Green
} else {
    Write-Host "  [!] ERROR: Node.js is not found in PATH! Please install Node.js." -ForegroundColor Red
    exit 1
}

$BackendDir = Join-Path $RepoRoot "backend"
$FrontendDir = Join-Path $RepoRoot "frontend"
$backendMvnw = Join-Path $BackendDir "mvnw.cmd"

Write-Host "  -> Compiling backend Java classes ('$backendMvnw compile -q')..." -ForegroundColor Cyan
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
# 4. Concurrently Launch Backend & Frontend on Local Host
# ------------------------------------------------------------------------------
Write-Host "`n[4/4] Launching Spring Boot backend and Next.js frontend concurrently..." -ForegroundColor Yellow

Write-Host "  -> Launching Backend via '$backendMvnw spring-boot:run'..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "`"$backendMvnw`" spring-boot:run" `
    -WorkingDirectory $BackendDir `
    -PassThru

Write-Host "  -> Launching Frontend via 'npm run dev' (dev mode with HMR)..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "cmd.exe" `
    -ArgumentList "/c", "npm run dev" `
    -WorkingDirectory $FrontendDir `
    -PassThru

Write-Host "`n======================================================================" -ForegroundColor Green
Write-Host "   RNG LOCAL DEVELOPMENT ENVIRONMENT RUNNING                          " -ForegroundColor Green
Write-Host "     * Mode:        DEVELOPMENT (Hot Reload / HMR)                    " -ForegroundColor Yellow
Write-Host "     * Frontend UI: http://localhost:3000                             " -ForegroundColor Cyan
Write-Host "     * Backend API: http://localhost:8080/api/v1                      " -ForegroundColor Cyan
Write-Host "     * Datastores:  PostgreSQL (5432), Redis (6379), MongoDB (27017)  " -ForegroundColor Cyan
Write-Host "                                                                      " -ForegroundColor Green
Write-Host "   Press [Ctrl+C] in this console to terminate all services cleanly.  " -ForegroundColor Yellow
Write-Host "======================================================================`n" -ForegroundColor Green

$cleanupExecuted = $false
$cleanupAction = {
    if ($cleanupExecuted) { return }
    $script:cleanupExecuted = $true
    Write-Host "`n`nShutting down local processes cleanly..." -ForegroundColor Yellow

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
