#!/usr/bin/env bash
# ==============================================================================
# RNG Full-Stack Local Development & Production Automation (Linux / macOS / Codespaces)
# Orchestrates Docker datastores, backend Spring Boot API, and frontend Next.js
#
# Usage:
#   ./infra/scripts/dev.sh          # Default: Production mode (Pre-builds & runs 'npm run start')
#   ./infra/scripts/dev.sh --prod   # Explicit: Production mode (Pre-builds & runs 'npm run start')
#   ./infra/scripts/dev.sh --dev    # Development mode (Runs 'npm run dev' with HMR)
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
    MODE_LABEL="DEVELOPMENT (Hot Reload / HMR)"
else
    MODE_LABEL="PRODUCTION (Pre-built Ahead-Of-Time)"
fi

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "Shutting down local processes cleanly..."
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

trap cleanup EXIT INT TERM

echo "======================================================================"
echo "       RNG CONTROL CENTER - LOCAL ENVIRONMENT LAUNCHER                "
echo "======================================================================"
echo "Repo Root: $REPO_ROOT"
echo "Mode:      $MODE_LABEL"
echo ""

# ------------------------------------------------------------------------------
# 1. Docker Status Check
# ------------------------------------------------------------------------------
echo "[1/5] Verifying Docker daemon status..."
if docker info >/dev/null 2>&1; then
    echo "  [x] Docker daemon is running and accessible."
    DOCKER_AVAILABLE=true
else
    echo "  [!] WARNING: Docker daemon is not running or not accessible."
    echo "  [!] Please start Docker if you need local PostgreSQL, Redis, or MongoDB."
    DOCKER_AVAILABLE=false
fi

# ------------------------------------------------------------------------------
# 2. Start Background Data Stores (PostgreSQL, Redis, MongoDB)
# ------------------------------------------------------------------------------
echo ""
echo "[2/5] Starting background data stores (PostgreSQL, Redis, MongoDB)..."
if [ "$DOCKER_AVAILABLE" = true ]; then
    docker compose up -d --wait postgres redis mongodb
    echo "  [x] Data stores (postgres, redis, mongodb) started and ready."
else
    echo "  [!] Skipping 'docker compose up' because Docker is not available."
fi

# ------------------------------------------------------------------------------
# 3. Development Toolchain Verification (JDK 25, Node.js)
# ------------------------------------------------------------------------------
echo ""
echo "[3/5] Verifying development toolchains (Java, Node.js)..."
if command -v java >/dev/null 2>&1; then
    JAVA_VER=$(java -version 2>&1 | head -n 1)
    echo "  [x] Java detected: $JAVA_VER"
else
    echo "  [!] ERROR: Java is not found in PATH! Please install Java 25 JDK."
fi

if command -v node >/dev/null 2>&1; then
    NODE_VER=$(node -v)
    echo "  [x] Node.js detected: $NODE_VER"
else
    echo "  [!] ERROR: Node.js is not found in PATH! Please install Node.js."
fi

# ------------------------------------------------------------------------------
# 4. Pre-Flight Compilation & Verification
# ------------------------------------------------------------------------------
echo ""
echo "[4/5] Running pre-flight build & verification ($MODE_LABEL)..."

echo "  -> Compiling backend Java classes (mvn compile -q)..."
(
    cd "$REPO_ROOT/backend"
    chmod +x ./mvnw 2>/dev/null || true
    ./mvnw compile -q
)
echo "  [x] Backend Java classes compiled cleanly."

if [ "$MODE" = "dev" ]; then
    echo "  -> Verifying frontend TypeScript types (npx tsc --noEmit)..."
    (
        cd "$REPO_ROOT/frontend"
        npx tsc --noEmit
    )
    echo "  [x] Frontend TypeScript type check passed."
else
    echo "  -> Pre-building frontend production bundle (npm run build)..."
    (
        cd "$REPO_ROOT/frontend"
        npm run build
    )
    echo "  [x] Frontend production bundle pre-built successfully (zero on-site compilation delay)."
fi

# ------------------------------------------------------------------------------
# 5. Concurrently Launch Backend & Frontend
# ------------------------------------------------------------------------------
echo ""
echo "[5/5] Launching Spring Boot backend and Next.js frontend concurrently..."

(
    cd "$REPO_ROOT/backend"
    chmod +x ./mvnw 2>/dev/null || true
    exec ./mvnw spring-boot:run
) &
BACKEND_PID=$!

if [ "$MODE" = "dev" ]; then
    echo "  -> Launching Frontend via 'npm run dev' (dev mode with HMR)..."
    (
        cd "$REPO_ROOT/frontend"
        exec npm run dev
    ) &
    FRONTEND_PID=$!
else
    echo "  -> Launching Frontend via 'npm run start' (pre-compiled production mode)..."
    (
        cd "$REPO_ROOT/frontend"
        exec npm run start
    ) &
    FRONTEND_PID=$!
fi

echo ""
echo "======================================================================"
echo "   RNG FULL-STACK SERVERS SPAWNED SUCCESSFULLY                        "
echo "     * Mode:        $MODE_LABEL                                       "
echo "     * Frontend UI: http://localhost:3000                             "
echo "     * Backend API: http://localhost:8080/api/v1                      "
echo "                                                                      "
echo "   Press [Ctrl+C] to terminate all services cleanly.                  "
echo "======================================================================"
echo ""

wait
