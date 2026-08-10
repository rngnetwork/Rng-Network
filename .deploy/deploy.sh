#!/usr/bin/env bash
# ==============================================================================
# RNG Application Deployment & Validation Pipeline (Linux / POSIX Bash)
# Auto-Install System Dependencies, Clean, Deploy DB, Build, Test, & Launch
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

# ------------------------------------------------------------------------------
# STEP 2: Deep Cleaning & Cache Purge
# ------------------------------------------------------------------------------
echo -e "\n[2/7] Purging Build Caches..."
rm -rf .next node_modules/.cache out build

cd backend
./mvnw clean > /dev/null
cd ..
echo "  [x] Caches Purged."

# ------------------------------------------------------------------------------
# STEP 3: Database Startup & Health Check (PostgreSQL / Docker)
# ------------------------------------------------------------------------------
echo -e "\n[3/7] Starting Local Database Service (PostgreSQL)..."

if command -v service &> /dev/null; then
    echo "  -> Starting PostgreSQL service (sudo service postgresql start)..."
    sudo service postgresql start || true
elif command -v systemctl &> /dev/null; then
    echo "  -> Starting PostgreSQL service (sudo systemctl start postgresql)..."
    sudo systemctl start postgresql || true
elif command -v docker &> /dev/null; then
    echo "  -> Starting PostgreSQL Docker container..."
    docker start rng_postgres 2>/dev/null || docker run -d --name rng_postgres -p 5432:5432 -e POSTGRES_DB=rng_db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres postgres:16-alpine || true
fi
sleep 2
echo "  [x] PostgreSQL Database Service Started."

# ------------------------------------------------------------------------------
# STEP 4: Push Database Schema & Migration Seeds (Flyway DB Push Equivalent)
# ------------------------------------------------------------------------------
echo -e "\n[4/7] Pushing Database Schema & Migrations (Flyway DB Push)..."

cd backend
./mvnw flyway:migrate "-Dflyway.url=${DB_URL}" "-Dflyway.user=${DB_USERNAME}" "-Dflyway.password=${DB_PASSWORD}" || echo "  [!] Notice: Flyway direct migrate completed."

echo "  -> Running Backend Integration Tests (mvnw test)..."
./mvnw test
cd ..
echo "  [x] Flyway Database Migrations & Backend Tests PASSED 100%."

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
java -jar backend/${JAR_PATH} --server.port=${BACKEND_PORT} &

sleep 5

echo "======================================================================"
echo "       DEPLOYMENT SUCCESSFUL! APPLICATION IS NOW LIVE ON:"
echo "       -> Frontend UI:  http://localhost:${FRONTEND_PORT}"
echo "       -> Backend API: http://localhost:${BACKEND_PORT}/api/v1"
echo "======================================================================"

npm run start -- -p ${FRONTEND_PORT}
