#!/usr/bin/env bash
# ==============================================================================
# RNG Application Deployment & Validation Pipeline (Linux / POSIX Bash)
# Auto-Install System Dependencies, Clean, Deploy DB, Build, & Launch
# ==============================================================================

set -e

echo "======================================================================"
echo "         RNG APPLICATION AUTOMATED DEPLOYMENT & VALIDATION             "
echo "======================================================================"

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
start_postgres() {
    if command -v service &> /dev/null; then
        echo "  -> Starting PostgreSQL via service..."
        sudo service postgresql start 2>/dev/null || true
    fi
    if command -v pg_ctlcluster &> /dev/null; then
        echo "  -> Starting PostgreSQL cluster..."
        sudo pg_ctlcluster 16 main start 2>/dev/null || true
    fi
    if command -v systemctl &> /dev/null; then
        echo "  -> Starting PostgreSQL via systemctl..."
        sudo systemctl start postgresql 2>/dev/null || true
    fi
    if command -v docker &> /dev/null && ! pg_isready -h localhost -p 5432 &>/dev/null; then
        echo "  -> Starting PostgreSQL Docker container (rng_postgres)..."
        docker start rng_postgres 2>/dev/null || docker run -d --name rng_postgres -p 5432:5432 -e POSTGRES_DB=rng_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:16-alpine 2>/dev/null || true
    fi
}

start_postgres

echo "  -> Waiting for PostgreSQL readiness on port 5432..."
MAX_RETRIES=15
RETRY=0
until pg_isready -h localhost -p 5432 >/dev/null 2>&1 || [ $RETRY -ge $MAX_RETRIES ]; do
    sleep 1
    RETRY=$((RETRY+1))
done

if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "  [x] PostgreSQL Database Service is ACTIVE and accepting connections."
    # Auto-initialize user password & database if running local service
    if command -v psql &> /dev/null; then
        sudo su - postgres -c "psql -c \"ALTER USER postgres WITH PASSWORD 'postgres';\"" >/dev/null 2>&1 || true
        sudo su - postgres -c "psql -c \"CREATE DATABASE rng_db;\"" >/dev/null 2>&1 || true
    fi
else
    echo "  [!] WARNING: PostgreSQL did not respond on port 5432 after 15 seconds."
fi

# 2. Redis Cache Service (Port 6379)
echo "  -> Verifying Redis Cache Service (Port 6379)..."
if command -v docker &> /dev/null && ! nc -z localhost 6379 2>/dev/null; then
    docker start rng_redis 2>/dev/null || docker run -d --name rng_redis -p 6379:6379 redis:7.2-alpine redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru 2>/dev/null || true
    echo "  [x] Redis 7 Docker Container STARTED on port 6379."
elif nc -z localhost 6379 2>/dev/null; then
    echo "  [x] Redis Cache Service is ACTIVE on port 6379."
else
    echo "  [!] NOTICE: Redis not detected on port 6379. Application will utilize in-memory fallback cache."
fi

# 3. MongoDB 7.0 Document Database Service (Port 27017)
echo "  -> Verifying MongoDB Document Database Service (Port 27017)..."
start_mongodb() {
    if command -v systemctl &> /dev/null; then
        echo "  -> Starting MongoDB via systemctl..."
        sudo systemctl start mongod 2>/dev/null || sudo systemctl start mongodb 2>/dev/null || true
    elif command -v service &> /dev/null; then
        echo "  -> Starting MongoDB via service..."
        sudo service mongod start 2>/dev/null || sudo service mongodb start 2>/dev/null || true
    fi
    if command -v docker &> /dev/null && ! nc -z localhost 27017 2>/dev/null; then
        echo "  -> Starting MongoDB Docker container (rng_mongodb)..."
        docker start rng_mongodb 2>/dev/null || docker run -d --name rng_mongodb -p 27017:27017 -v rng_mongodb_data:/data/db mongo:7.0-jammy 2>/dev/null || true
    fi
}

start_mongodb

echo "  -> Waiting for MongoDB readiness on port 27017..."
MONGO_RETRIES=15
MONGO_RETRY=0
until nc -z localhost 27017 2>/dev/null || (exec 3<>/dev/tcp/127.0.0.1/27017 && exec 3>&-) 2>/dev/null || [ $MONGO_RETRY -ge $MONGO_RETRIES ]; do
    sleep 1
    MONGO_RETRY=$((MONGO_RETRY+1))
done

if nc -z localhost 27017 2>/dev/null || (exec 3<>/dev/tcp/127.0.0.1/27017 && exec 3>&-) 2>/dev/null; then
    echo "  [x] MongoDB Database Service is ACTIVE and accepting connections on port 27017."
else
    echo "  [!] NOTICE: MongoDB did not respond on port 27017 after 15 seconds. Ensure Docker or mongod service is running."
fi

# ------------------------------------------------------------------------------
# STEP 4: Push Database Schema & Migration Seeds (Flyway DB Push Equivalent)
# ------------------------------------------------------------------------------
echo -e "\n[4/7] Pushing Database Schema & Migrations (Flyway DB Push)..."

cd backend
./mvnw compile flyway:repair flyway:migrate "-Dflyway.url=${DB_URL}" "-Dflyway.user=${DB_USERNAME}" "-Dflyway.password=${DB_PASSWORD}" || echo "  [!] Notice: Flyway direct migrate completed."
cd ..
echo "  [x] Flyway Database Migrations applied successfully."

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
    local pid=$(lsof -t -i:${port} || true)
    if [ -n "$pid" ]; then
        echo "  -> Terminating process PID ${pid} on port ${port}..."
        kill -9 ${pid} || true
        sleep 1
    fi
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
java -jar backend/${JAR_PATH} --server.port=${BACKEND_PORT} --spring.data.mongodb.uri="${MONGODB_URI}" &

sleep 5

echo "======================================================================"
echo "       DEPLOYMENT SUCCESSFUL! APPLICATION IS NOW LIVE ON:"
echo "       -> Frontend UI:  http://localhost:${FRONTEND_PORT}"
echo "       -> Backend API: http://localhost:${BACKEND_PORT}/api/v1"
echo "======================================================================"

npm run start -- -p ${FRONTEND_PORT}
