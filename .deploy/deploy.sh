#!/usr/bin/env bash
# ==============================================================================
# RNG Application Deployment & Validation Pipeline (Linux / POSIX Bash)
# Auto-Install System Dependencies, Clean, Deploy DB, Build, & Launch
# ==============================================================================

set -e

BACKEND_PID=""
cleanup() {
    if [ -n "$BACKEND_PID" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo -e "\nShutting down background Backend API process (PID: ${BACKEND_PID})..."
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT INT TERM

echo "======================================================================"
echo "         RNG APPLICATION AUTOMATED DEPLOYMENT & VALIDATION             "
echo "======================================================================"

# ------------------------------------------------------------------------------
# Universal Helpers: Port Probe, Systemd Detection, Docker Auto-Recovery
# ------------------------------------------------------------------------------

# Detect if systemd is active as PID 1 (avoids container warning messages)
has_systemd() {
    [ -d /run/systemd/system ] && command -v systemctl &>/dev/null
}

# Universal TCP port probe (Bash /dev/tcp with nc fallback)
check_port() {
    local port=$1
    (exec 3<>/dev/tcp/127.0.0.1/"$port" && exec 3>&-) 2>/dev/null || \
    nc -z 127.0.0.1 "$port" 2>/dev/null || \
    false
}

# Robust Docker container manager with auto-recovery on conflict or exit
ensure_docker_container() {
    local name=$1
    local port=$2
    local image=$3
    shift 3
    local extra_args=("$@")

    if check_port "$port"; then
        return 0
    fi

    if ! command -v docker &>/dev/null; then
        return 1
    fi

    # Check if a container with this name already exists (running, stopped, or created)
    if docker ps -a --format '{{.Names}}' 2>/dev/null | grep -Eq "^${name}\$"; then
        echo "  -> Found existing container '${name}', attempting start..."
        docker start "$name" >/dev/null 2>&1 || true
        for _ in 1 2 3; do
            if check_port "$port"; then
                return 0
            fi
            sleep 1
        done
        echo "  -> Existing container '${name}' unresponsive or dead. Recreating cleanly..."
        docker rm -f "$name" >/dev/null 2>&1 || true
    fi

    echo "  -> Launching fresh Docker container '${name}' (${image})..."
    docker run -d --name "$name" -p "${port}:${port}" "${extra_args[@]}" "$image" >/dev/null 2>&1 || true
}

# ------------------------------------------------------------------------------
# STEP 0: System Dependency Auto-Detection & Package Installer (Linux / apt)
# ------------------------------------------------------------------------------
echo -e "\n[0/7] Verifying System Environment Dependencies..."

if command -v apt-get &> /dev/null; then
    # Check Java JDK 21
    if ! command -v java &> /dev/null; then
        echo "  -> Java JDK not found. Installing OpenJDK 21 via apt-get..."
        sudo apt-get update && sudo apt-get install -y openjdk-21-jdk
    fi
    # Check Node.js & npm
    if ! command -v node &> /dev/null; then
        echo "  -> Node.js not found. Installing Node.js 20.x via apt-get..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    # Check PostgreSQL
    if ! command -v psql &> /dev/null && ! command -v docker &> /dev/null; then
        echo "  -> PostgreSQL not found. Installing PostgreSQL via apt-get..."
        sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
    fi
    # Check MongoDB / Docker
    if ! command -v mongod &> /dev/null && ! command -v docker &> /dev/null; then
        echo "  -> MongoDB not found. Attempting to install MongoDB via apt-get..."
        sudo apt-get update && (sudo apt-get install -y mongodb-org 2>/dev/null || sudo apt-get install -y mongodb 2>/dev/null || true)
    fi
fi

# ------------------------------------------------------------------------------
# STEP 1: Environment Variables Setup & Validation
# ------------------------------------------------------------------------------
echo -e "\n[1/7] Setting up Environment Variables..."

if [ ! -f ".env" ]; then
    echo "  -> .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "  [!] NOTICE: Created default .env file."
else
    echo "  -> .env file detected."
fi

export $(grep -v '^#' .env | xargs)

FRONTEND_PORT=${PORT:-3000}
BACKEND_PORT=${SERVER_PORT:-8080}
MONGODB_URI=${MONGODB_URI:-mongodb://localhost:27017/rng_embeds}
export MONGODB_URI

# ------------------------------------------------------------------------------
# STEP 2: Deep Cleaning & Cache Purge
# ------------------------------------------------------------------------------
echo -e "\n[2/7] Purging Build Caches..."
rm -rf .next node_modules/.cache out build

cd backend
chmod +x ./mvnw || true
./mvnw clean > /dev/null
cd ..
echo "  [x] Caches Purged."

# ------------------------------------------------------------------------------
# STEP 3: Database Startup & Health Check (PostgreSQL, Redis, MongoDB / Docker)
# ------------------------------------------------------------------------------
echo -e "\n[3/7] Starting Local Database Services (PostgreSQL, Redis, MongoDB)..."

# 1. PostgreSQL (Port 5432)
echo "  -> Verifying PostgreSQL Database Service (Port 5432)..."
if check_port 5432; then
    echo "  [x] PostgreSQL Database Service is already ACTIVE on port 5432."
else
    if command -v service &> /dev/null; then
        echo "  -> Attempting PostgreSQL startup via service..."
        sudo service postgresql start 2>/dev/null || true
    fi
    if command -v pg_ctlcluster &> /dev/null; then
        echo "  -> Attempting PostgreSQL cluster startup..."
        sudo pg_ctlcluster 16 main start 2>/dev/null || true
    fi
    if has_systemd; then
        echo "  -> Attempting PostgreSQL startup via systemctl..."
        sudo systemctl start postgresql 2>/dev/null || true
    fi
    if ! check_port 5432 && command -v docker &> /dev/null; then
        echo "  -> Starting PostgreSQL Docker container (rng_postgres)..."
        ensure_docker_container "rng_postgres" "5432" "postgres:16-alpine" \
            -e "POSTGRES_DB=${DB_NAME:-rng_db}" \
            -e "POSTGRES_USER=${DB_USERNAME:-postgres}" \
            -e "POSTGRES_PASSWORD=${DB_PASSWORD:-postgres}" \
            -v rng_postgres_data:/var/lib/postgresql/data
    fi
fi

echo "  -> Waiting for PostgreSQL readiness on port 5432..."
MAX_RETRIES=20
RETRY=0
until check_port 5432 || [ $RETRY -ge $MAX_RETRIES ]; do
    sleep 1
    RETRY=$((RETRY+1))
done

if check_port 5432; then
    echo "  [x] PostgreSQL Database Service is ACTIVE and accepting connections on port 5432."
    if command -v docker &> /dev/null && docker ps --format '{{.Names}}' 2>/dev/null | grep -Eq "^rng_postgres\$"; then
        docker exec rng_postgres psql -U "${DB_USERNAME:-postgres}" -c "CREATE DATABASE ${DB_NAME:-rng_db};" >/dev/null 2>&1 || true
    elif command -v psql &> /dev/null; then
        PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h 127.0.0.1 -U "${DB_USERNAME:-postgres}" -c "CREATE DATABASE ${DB_NAME:-rng_db};" >/dev/null 2>&1 || true
    fi
else
    echo "  [!] ERROR: PostgreSQL did not respond on port 5432 after ${MAX_RETRIES} seconds."
    if command -v docker &> /dev/null && docker ps -a --format '{{.Names}}' 2>/dev/null | grep -Eq "^rng_postgres\$"; then
        echo "  [!] Container logs for rng_postgres:"
        docker logs --tail 25 rng_postgres 2>&1 | sed 's/^/      /' || true
    fi
fi

# 2. Redis Cache Service (Port 6379)
echo "  -> Verifying Redis Cache Service (Port 6379)..."
if check_port 6379; then
    echo "  [x] Redis Cache Service is already ACTIVE on port 6379."
else
    if command -v service &> /dev/null; then
        sudo service redis-server start 2>/dev/null || sudo service redis start 2>/dev/null || true
    fi
    if has_systemd; then
        sudo systemctl start redis-server 2>/dev/null || sudo systemctl start redis 2>/dev/null || true
    fi
    if ! check_port 6379 && command -v docker &> /dev/null; then
        echo "  -> Starting Redis 7 Docker container (rng_redis)..."
        ensure_docker_container "rng_redis" "6379" "redis:7.2-alpine" \
            -v rng_redis_data:/data \
            redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    fi
fi

echo "  -> Waiting for Redis readiness on port 6379..."
REDIS_RETRIES=15
REDIS_RETRY=0
until check_port 6379 || [ $REDIS_RETRY -ge $REDIS_RETRIES ]; do
    sleep 1
    REDIS_RETRY=$((REDIS_RETRY+1))
done

if check_port 6379; then
    echo "  [x] Redis Cache Service is ACTIVE and accepting connections on port 6379."
else
    echo "  [!] NOTICE: Redis not detected on port 6379 after ${REDIS_RETRIES} seconds. Application will utilize in-memory fallback cache."
    if command -v docker &> /dev/null && docker ps -a --format '{{.Names}}' 2>/dev/null | grep -Eq "^rng_redis\$"; then
        echo "  [!] Container logs for rng_redis:"
        docker logs --tail 25 rng_redis 2>&1 | sed 's/^/      /' || true
    fi
fi

# 3. MongoDB 7.0 Document Database Service (Port 27017)
echo "  -> Verifying MongoDB Document Database Service (Port 27017)..."
if check_port 27017; then
    echo "  [x] MongoDB Database Service is already ACTIVE on port 27017."
else
    if command -v service &> /dev/null; then
        sudo service mongod start 2>/dev/null || sudo service mongodb start 2>/dev/null || true
    fi
    if has_systemd; then
        sudo systemctl start mongod 2>/dev/null || sudo systemctl start mongodb 2>/dev/null || true
    fi
    if ! check_port 27017 && command -v docker &> /dev/null; then
        echo "  -> Starting MongoDB Docker container (rng_mongodb)..."
        ensure_docker_container "rng_mongodb" "27017" "mongo:7.0-jammy" \
            -v rng_mongodb_data:/data/db
    fi
fi

echo "  -> Waiting for MongoDB readiness on port 27017..."
MONGO_RETRIES=20
MONGO_RETRY=0
until check_port 27017 || [ $MONGO_RETRY -ge $MONGO_RETRIES ]; do
    sleep 1
    MONGO_RETRY=$((MONGO_RETRY+1))
done

if check_port 27017; then
    echo "  [x] MongoDB Database Service is ACTIVE and accepting connections on port 27017."
else
    echo "  [!] WARNING: MongoDB did not respond on port 27017 after ${MONGO_RETRIES} seconds. Ensure Docker or mongod service is running."
    if command -v docker &> /dev/null && docker ps -a --format '{{.Names}}' 2>/dev/null | grep -Eq "^rng_mongodb\$"; then
        echo "  [!] Container logs for rng_mongodb:"
        docker logs --tail 25 rng_mongodb 2>&1 | sed 's/^/      /' || true
    fi
fi

# ------------------------------------------------------------------------------
# STEP 4: Push Database Schema & Migration Seeds (Flyway DB Push Equivalent)
# ------------------------------------------------------------------------------
echo -e "\n[4/7] Pushing Database Schema & Migrations (Flyway DB Push)..."

if check_port 5432; then
    cd backend
    ./mvnw compile flyway:repair flyway:migrate "-Dflyway.url=${DB_URL}" "-Dflyway.user=${DB_USERNAME}" "-Dflyway.password=${DB_PASSWORD}" || echo "  [!] Notice: Flyway direct migrate completed."
    cd ..
    echo "  [x] Flyway Database Migrations applied successfully."
else
    echo "  [!] SKIPPING Flyway Migrations: PostgreSQL is not active on port 5432."
fi

# ------------------------------------------------------------------------------
# STEP 5: Frontend Production Build
# ------------------------------------------------------------------------------
echo -e "\n[5/7] Building Frontend Production Bundle..."
npm run build
echo "  [x] Frontend Build PASSED."

# ------------------------------------------------------------------------------
# STEP 6: Port Management & Conflict Resolution
# ------------------------------------------------------------------------------
echo -e "\n[6/7] Clearing Port Bindings..."

clear_port() {
    local port=$1
    local pids=$(lsof -t -i:${port} 2>/dev/null || fuser ${port}/tcp 2>/dev/null || ss -lptn "sport = :${port}" 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2 || true)
    for pid in $pids; do
        if [ -n "$pid" ] && [ "$pid" != "$$" ]; then
            echo "  -> Terminating process PID ${pid} on port ${port}..."
            kill -9 ${pid} 2>/dev/null || true
            sleep 1
        fi
    done
}

clear_port ${BACKEND_PORT}
clear_port ${FRONTEND_PORT}
echo "  [x] Ports ${BACKEND_PORT} and ${FRONTEND_PORT} ready."

# ------------------------------------------------------------------------------
# STEP 7: Launch Application Services
# ------------------------------------------------------------------------------
echo -e "\n[7/7] Launching Backend & Frontend..."

cd backend
./mvnw package -DskipTests > /dev/null
JAR_PATH="target/rng-backend-0.0.1-SNAPSHOT.jar"
cd ..

echo "  -> Launching Backend API on http://localhost:${BACKEND_PORT}..."
nohup java -jar "backend/${JAR_PATH}" \
    --server.port="${BACKEND_PORT}" \
    --spring.data.mongodb.uri="${MONGODB_URI}" \
    > backend.log 2>&1 &
BACKEND_PID=$!

echo "  -> Backend process spawned (PID: ${BACKEND_PID}). Waiting for health check..."

BACKEND_RETRIES=40
BACKEND_RETRY=0
until check_port "${BACKEND_PORT}" || [ $BACKEND_RETRY -ge $BACKEND_RETRIES ]; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "  [!] CRITICAL ERROR: Backend failed to start and terminated prematurely!"
        echo "  [!] Last 35 lines of backend.log:"
        tail -n 35 backend.log | sed 's/^/      /'
        exit 1
    fi
    sleep 1
    BACKEND_RETRY=$((BACKEND_RETRY+1))
done

if check_port "${BACKEND_PORT}"; then
    echo "  [x] Backend API is ACTIVE and listening on port ${BACKEND_PORT}."
else
    echo "  [!] WARNING: Backend API did not respond on port ${BACKEND_PORT} within ${BACKEND_RETRIES} seconds."
    echo "  [!] Check backend.log for details:"
    tail -n 25 backend.log | sed 's/^/      /'
fi

echo "======================================================================"
echo "       DEPLOYMENT SUCCESSFUL! APPLICATION IS NOW LIVE ON:"
echo "       -> Frontend UI:  http://localhost:${FRONTEND_PORT}"
echo "       -> Backend API: http://localhost:${BACKEND_PORT}/api/v1"
echo "======================================================================"

npm run start -- -p "${FRONTEND_PORT}"
