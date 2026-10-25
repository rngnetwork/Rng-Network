#!/usr/bin/env bash
# ==============================================================================
# RNG Full-Stack Environment Automation (Linux / macOS / Codespaces)
#
# Modes:
#   --dev, -d   : Development mode
#                 - Instantiates the 3 Docker datastores (PostgreSQL, Redis, MongoDB)
#                 - Uses backend/.env and frontend/.env.local (auto-seeded if missing)
#                 - Runs Spring Boot (mvn spring-boot:run) and Next.js (npm run dev with HMR) locally
#
#   --prod, -p  : Production mode (Default)
#                 - Instantiates ALL 5 services in Docker (PostgreSQL, Redis, MongoDB, Backend, Frontend)
#                 - Uses root .env file (auto-seeded from .env.example if missing)
#                 - Streams container logs with graceful shutdown on Ctrl+C
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "$REPO_ROOT"

MODE="prod"
while [[ $# -gt 0 ]]; do
    case "$1" in
        --dev|-d)
            MODE="dev"
            shift
            ;;
        --prod|-p)
            MODE="prod"
            shift
            ;;
        *)
            shift
            ;;
    esac
done

if [ "$MODE" = "dev" ]; then
    MODE_LABEL="DEVELOPMENT (Local HMR + Docker Datastores)"
else
    MODE_LABEL="PRODUCTION (Full Containerized Docker Stack)"
fi

echo "======================================================================"
echo "       RNG CONTROL CENTER - ENVIRONMENT LAUNCHER                      "
echo "======================================================================"
echo "Repo Root: $REPO_ROOT"
echo "Mode:      $MODE_LABEL"
echo ""

# ------------------------------------------------------------------------------
# 1. Docker Status Verification
# ------------------------------------------------------------------------------
echo "[1/4] Verifying Docker daemon status..."
if docker info >/dev/null 2>&1; then
    echo "  [x] Docker daemon is running and accessible."
    DOCKER_AVAILABLE=true
else
    echo "  [!] ERROR: Docker daemon is not running or not accessible."
    if [ "$MODE" = "prod" ]; then
        echo "  [!] Docker is strictly required to run production container stack. Aborting."
        exit 1
    else
        echo "  [!] Please start Docker to run local PostgreSQL, Redis, or MongoDB."
        DOCKER_AVAILABLE=false
    fi
fi

# ==============================================================================
# MODE: PRODUCTION (Full Containerized Stack in Docker)
# ==============================================================================
if [ "$MODE" = "prod" ]; then
    echo ""
    echo "[2/4] Verifying production environment configuration..."
    if [ ! -f .env ] && [ -f .env.example ]; then
        echo "  -> Root .env not found. Initializing from .env.example..."
        cp .env.example .env
        echo "  [x] Root .env initialized."
    elif [ -f .env ]; then
        echo "  [x] Root .env configuration found."
    fi

    echo ""
    echo "[3/4] Building and launching full Docker Compose stack (5 services)..."
    docker compose up -d --build --wait

    echo ""
    echo "======================================================================"
    echo "   RNG PRODUCTION STACK DEPLOYED SUCCESSFULLY IN DOCKER               "
    echo "     * Mode:        PRODUCTION (Containerized)                        "
    echo "     * Frontend UI: http://localhost:3000                             "
    echo "     * Backend API: http://localhost:8080/api/v1                      "
    echo "     * Datastores:  PostgreSQL (5432), Redis (6379), MongoDB (27017)  "
    echo "                                                                      "
    echo "   Streaming container logs below. Press [Ctrl+C] to stop all services."
    echo "======================================================================"
    echo ""

    trap 'echo ""; echo "Shutting down Docker containers..."; docker compose stop; echo "  [x] All containers stopped."; exit 0' EXIT INT TERM
    docker compose logs -f
    exit 0
fi

# ==============================================================================
# MODE: DEVELOPMENT (Local Host Backend/Frontend + Docker Datastores)
# ==============================================================================

# ------------------------------------------------------------------------------
# 2. Environment Configuration for Local Dev
# ------------------------------------------------------------------------------
echo ""
echo "[2/4] Verifying local development environment files..."

# Check backend/.env
if [ ! -f "$REPO_ROOT/backend/.env" ] && [ -f "$REPO_ROOT/backend/.env.example" ]; then
    echo "  -> backend/.env not found. Initializing from backend/.env.example..."
    cp "$REPO_ROOT/backend/.env.example" "$REPO_ROOT/backend/.env"
    echo "  [x] backend/.env initialized."
elif [ -f "$REPO_ROOT/backend/.env" ]; then
    echo "  [x] backend/.env found."
fi

# Check frontend/.env.local
if [ ! -f "$REPO_ROOT/frontend/.env.local" ] && [ -f "$REPO_ROOT/frontend/.env.local.example" ]; then
    echo "  -> frontend/.env.local not found. Initializing from frontend/.env.local.example..."
    cp "$REPO_ROOT/frontend/.env.local.example" "$REPO_ROOT/frontend/.env.local"
    echo "  [x] frontend/.env.local initialized."
elif [ -f "$REPO_ROOT/frontend/.env.local" ]; then
    echo "  [x] frontend/.env.local found."
fi

# Start Docker Datastores (postgres, redis, mongodb)
if [ "$DOCKER_AVAILABLE" = true ]; then
    echo "  -> Starting background datastores (postgres, redis, mongodb)..."
    docker compose up -d --wait postgres redis mongodb
    echo "  [x] Datastores (postgres, redis, mongodb) started and ready."
else
    echo "  [!] Skipping datastore container startup (Docker unavailable)."
fi

# ------------------------------------------------------------------------------
# 3. Toolchain & Pre-Flight Verification
# ------------------------------------------------------------------------------
echo ""
echo "[3/4] Verifying development toolchains & pre-flight compilation..."
if command -v java >/dev/null 2>&1; then
    JAVA_VER=$(java -version 2>&1 | head -n 1)
    echo "  [x] Java: $JAVA_VER"
else
    echo "  [!] ERROR: Java is not found in PATH! Please install Java 25 JDK."
    exit 1
fi

if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo "  [x] Node.js: $NODE_VER"
else
    echo "  [!] ERROR: Node.js is not found in PATH! Please install Node.js."
    exit 1
fi

echo "  -> Compiling backend Java classes (mvn compile -q)..."
(
    cd "$REPO_ROOT/backend"
    chmod +x ./mvnw 2>/dev/null || true
    ./mvnw compile -q
)
echo "  [x] Backend Java classes compiled cleanly."

echo "  -> Verifying frontend TypeScript types (npx tsc --noEmit)..."
(
    cd "$REPO_ROOT/frontend"
    npx tsc --noEmit
)
echo "  [x] Frontend TypeScript type check passed."

# ------------------------------------------------------------------------------
# 4. Concurrently Launch Backend & Frontend on Local Host
# ------------------------------------------------------------------------------
BACKEND_PID=""
FRONTEND_PID=""

cleanup_dev() {
    echo ""
    echo "Shutting down local development processes..."
    if [ -n "$BACKEND_PID" ]; then
        echo "  -> Stopping Spring Boot backend (PID: ${BACKEND_PID})..."
        kill -TERM "$BACKEND_PID" 2>/dev/null || true
        pkill -P "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        echo "  -> Stopping Next.js frontend (PID: ${FRONTEND_PID})..."
        kill -TERM "$FRONTEND_PID" 2>/dev/null || true
        pkill -P "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo "  [x] All development services stopped."
}

trap cleanup_dev EXIT INT TERM

echo ""
echo "[4/4] Launching Spring Boot backend and Next.js frontend concurrently..."

(
    cd "$REPO_ROOT/backend"
    chmod +x ./mvnw 2>/dev/null || true
    exec ./mvnw spring-boot:run
) &
BACKEND_PID=$!

(
    cd "$REPO_ROOT/frontend"
    exec npm run dev
) &
FRONTEND_PID=$!

echo ""
echo "======================================================================"
echo "   RNG LOCAL DEVELOPMENT ENVIRONMENT RUNNING                          "
echo "     * Mode:        DEVELOPMENT (Hot Reload / HMR)                    "
echo "     * Frontend UI: http://localhost:3000                             "
echo "     * Backend API: http://localhost:8080/api/v1                      "
echo "     * Datastores:  PostgreSQL (5432), Redis (6379), MongoDB (27017)  "
echo "                                                                      "
echo "   Press [Ctrl+C] to terminate all services cleanly.                  "
echo "======================================================================"
echo ""

wait
