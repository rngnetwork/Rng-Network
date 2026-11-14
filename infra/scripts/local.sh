#!/usr/bin/env bash
# Run the RNG frontend, backend, PostgreSQL, Redis, and MongoDB directly on the host.
# Install as: /root/RNG-Website/infra/scripts/local.sh
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"
LOG_DIR="${ROOT_DIR}/logs/local"

BUILD=1
case "${1:-}" in
  "") ;;
  --skip-build) BUILD=0 ;;
  -h|--help)
    cat <<USAGE
Usage: ${0##*/} [--skip-build]

Starts the local PostgreSQL, Redis, and MongoDB system services if needed,
then builds (unless --skip-build is supplied) and runs the backend and frontend.
Press Ctrl+C to stop the backend and frontend. Database services remain running.
USAGE
    exit 0
    ;;
  *) echo "Unknown option: $1" >&2; exit 2 ;;
esac

log() { printf '[local] %s\n' "$*"; }
die() { printf '[local] ERROR: %s\n' "$*" >&2; exit 1; }

for cmd in bash systemctl curl ss timeout grep java javac node npm; do
  command -v "$cmd" >/dev/null 2>&1 || die "Required command '$cmd' is missing. Install it before running this script."
done

[[ -d "$BACKEND_DIR" ]] || die "Backend directory not found: $BACKEND_DIR"
[[ -d "$FRONTEND_DIR" ]] || die "Frontend directory not found: $FRONTEND_DIR"
[[ -f "$ROOT_DIR/.env" ]] || die "Missing $ROOT_DIR/.env. Create it from .env.example and fill in the real values first."
[[ -f "$BACKEND_DIR/pom.xml" && -f "$BACKEND_DIR/mvnw" ]] || die "Backend Maven project or Maven Wrapper is missing."
[[ -f "$FRONTEND_DIR/package.json" && -f "$FRONTEND_DIR/package-lock.json" ]] || die "Frontend package.json or package-lock.json is missing."

# The repository .env is expected to contain ordinary KEY=value entries and be shell-compatible.
# shellcheck disable=SC1091
set -a
source "$ROOT_DIR/.env"
set +a

# Preserve the existing VPS PostgreSQL service (also used by another application).
# RNG gets its own database and login inside that instance; it does not get a new PG server.
LOCAL_POSTGRES_HOST="127.0.0.1"
LOCAL_POSTGRES_PORT="${LOCAL_POSTGRES_PORT:-5432}"
LOCAL_POSTGRES_DB="${LOCAL_POSTGRES_DB:-${POSTGRES_DB:-rng_db}}"
DB_USERNAME="${DB_USERNAME:-${POSTGRES_USER:-website_db}}"
DB_PASSWORD="${DB_PASSWORD:-${POSTGRES_PASSWORD:-}}"

LOCAL_REDIS_HOST="127.0.0.1"
LOCAL_REDIS_PORT="${LOCAL_REDIS_PORT:-6379}"
LOCAL_MONGODB_HOST="127.0.0.1"
LOCAL_MONGODB_PORT="${LOCAL_MONGODB_PORT:-27017}"
LOCAL_MONGODB_DB="${LOCAL_MONGODB_DB:-rng_mongodb}"

FRONTEND_HOST="0.0.0.0"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
SERVER_PORT="${SERVER_PORT:-8080}"

# Override Docker-only service names with host-local addresses for this run.
export DB_USERNAME DB_PASSWORD
export DB_URL="jdbc:postgresql://${LOCAL_POSTGRES_HOST}:${LOCAL_POSTGRES_PORT}/${LOCAL_POSTGRES_DB}"
export SPRING_DATA_REDIS_HOST="$LOCAL_REDIS_HOST"
export SPRING_DATA_REDIS_PORT="$LOCAL_REDIS_PORT"
export SPRING_DATA_REDIS_PASSWORD="${SPRING_DATA_REDIS_PASSWORD:-${REDIS_PASSWORD:-}}"
export MONGODB_URI="mongodb://${LOCAL_MONGODB_HOST}:${LOCAL_MONGODB_PORT}/${LOCAL_MONGODB_DB}"
export SERVER_PORT
export PORT="$FRONTEND_PORT"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://backend.rednecksgaming.com/api/v1}"
export NEXT_TELEMETRY_DISABLED=1

if [[ -z "$DB_PASSWORD" ]]; then
  die "DB_PASSWORD (or POSTGRES_PASSWORD) is empty in .env. Set it to the password for the host PostgreSQL role '$DB_USERNAME'."
fi

# Run systemctl with sudo only when the script is not already running as root.
if (( EUID == 0 )); then
  SYSTEMCTL=(systemctl)
else
  command -v sudo >/dev/null 2>&1 || die "Run as root or install sudo so the database services can be started."
  SYSTEMCTL=(sudo systemctl)
fi

port_open() {
  local host="$1" port="$2"
  timeout 1 bash -c "</dev/tcp/${host}/${port}" >/dev/null 2>&1
}

wait_for_port() {
  local name="$1" host="$2" port="$3" max_wait="${4:-45}"
  local i
  for ((i=1; i<=max_wait; i++)); do
    if port_open "$host" "$port"; then
      log "$name is listening on ${host}:${port}."
      return 0
    fi
    sleep 1
  done
  die "$name did not become ready on ${host}:${port} within ${max_wait}s. Check its systemd status and logs."
}

ensure_system_service() {
  local name="$1" host="$2" port="$3"
  shift 3
  local unit load_state found=0

  if port_open "$host" "$port"; then
    log "$name is already listening on ${host}:${port}."
    return 0
  fi

  for unit in "$@"; do
    load_state="$("${SYSTEMCTL[@]}" show --property=LoadState --value "$unit" 2>/dev/null || true)"
    if [[ "$load_state" == "loaded" ]]; then
      found=1
      if "${SYSTEMCTL[@]}" is-active --quiet "$unit"; then
        log "$name service '$unit' is active; waiting for its port."
      else
        log "Starting $name service '$unit'..."
        "${SYSTEMCTL[@]}" start "$unit"
      fi
      break
    fi
  done

  (( found == 1 )) || die "$name is not listening on ${host}:${port}, and no expected systemd service was found ($*). Install/configure it first."
  wait_for_port "$name" "$host" "$port" 45
}

# Databases must be available before the Spring Boot application starts.
ensure_system_service "PostgreSQL" "$LOCAL_POSTGRES_HOST" "$LOCAL_POSTGRES_PORT" postgresql
ensure_system_service "Redis" "$LOCAL_REDIS_HOST" "$LOCAL_REDIS_PORT" redis-server
ensure_system_service "MongoDB" "$LOCAL_MONGODB_HOST" "$LOCAL_MONGODB_PORT" mongod mongodb

# Verify that the dedicated RNG database/login exist on the existing host PostgreSQL server.
if command -v psql >/dev/null 2>&1; then
  if ! PGPASSWORD="$DB_PASSWORD" psql \
      --host="$LOCAL_POSTGRES_HOST" --port="$LOCAL_POSTGRES_PORT" \
      --username="$DB_USERNAME" --dbname="$LOCAL_POSTGRES_DB" \
      --no-psqlrc --tuples-only --no-align --command='SELECT 1' >/dev/null 2>&1; then
    die "Cannot connect to PostgreSQL database '$LOCAL_POSTGRES_DB' as '$DB_USERNAME'. Create/verify this dedicated role and database on the existing host PostgreSQL instance; do not delete or recreate the bot's database."
  fi
else
  die "psql is missing. Install the PostgreSQL client so the script can verify the RNG database/login."
fi

# Verify Redis protocol response when redis-cli is installed.
if command -v redis-cli >/dev/null 2>&1; then
  if [[ -n "${REDIS_PASSWORD:-}" ]]; then
    REDISCLI_AUTH="$REDIS_PASSWORD" redis-cli -h "$LOCAL_REDIS_HOST" -p "$LOCAL_REDIS_PORT" ping 2>/dev/null | grep -qx 'PONG' \
      || die "Redis is listening but did not answer PONG. Check Redis authentication/configuration."
  else
    redis-cli -h "$LOCAL_REDIS_HOST" -p "$LOCAL_REDIS_PORT" ping 2>/dev/null | grep -qx 'PONG' \
      || die "Redis is listening but did not answer PONG. Check Redis configuration."
  fi
fi

# Optional MongoDB protocol-level ping if mongosh is installed; TCP readiness was checked above.
if command -v mongosh >/dev/null 2>&1; then
  mongosh "$MONGODB_URI" --quiet --eval 'if (db.adminCommand({ping:1}).ok !== 1) quit(1)' \
    >/dev/null 2>&1 || die "MongoDB is listening but the ping failed. Check its authentication/configuration."
fi

# Verify runtime versions. Next.js 16 requires Node.js 20.9 or newer.
NODE_VERSION="$(node -p 'process.versions.node')"
if ! node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a > 20 || (a === 20 && b >= 9) ? 0 : 1)'; then
  die "Node.js $NODE_VERSION is too old for this Next.js 16 project; install Node.js 20.9+ (prefer the same Node 20 line used by the Dockerfile)."
fi
JAVA_VERSION="$(java -version 2>&1 | awk -F '"' '/version/ {print $2; exit}')"
log "Using Node.js $NODE_VERSION and Java $JAVA_VERSION."

mkdir -p "$LOG_DIR"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

if (( BUILD == 1 )); then
  log "Preparing frontend dependencies..."
  if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    (cd "$FRONTEND_DIR" && npm ci)
  fi

  log "Building Next.js frontend..."
  (cd "$FRONTEND_DIR" && npm run build)

  log "Packaging Spring Boot backend..."
  (cd "$BACKEND_DIR" && ./mvnw clean package -DskipTests)
fi

# Locate the executable Spring Boot JAR, excluding a possible plain/non-boot JAR.
shopt -s nullglob
BACKEND_JARS=("$BACKEND_DIR"/target/rednecksgaming-backend-*.jar)
EXECUTABLE_JAR=""
for candidate in "${BACKEND_JARS[@]}"; do
  if [[ "$candidate" != *-plain.jar ]]; then
    EXECUTABLE_JAR="$candidate"
    break
  fi
done
[[ -n "$EXECUTABLE_JAR" && -f "$EXECUTABLE_JAR" ]] || die "Executable backend JAR not found under backend/target. Run without --skip-build first."
[[ -f "$FRONTEND_DIR/.next/BUILD_ID" ]] || die "Next.js production build not found (frontend/.next/BUILD_ID). Run without --skip-build first."

# Do not silently attach to another process or a leftover Docker port mapping.
for port in "$SERVER_PORT" "$FRONTEND_PORT"; do
  if port_open 127.0.0.1 "$port"; then
    die "Port $port is already occupied. Identify it with: sudo ss -ltnp 'sport = :$port' ; stop/reconfigure that process before starting RNG."
  fi
done

JAVA_OPTS_ARRAY=()
if [[ -n "${JAVA_OPTS:-}" ]]; then
  read -r -a JAVA_OPTS_ARRAY <<< "$JAVA_OPTS"
fi

BACKEND_PID=""
FRONTEND_PID=""
TAIL_PID=""
cleanup() {
  trap - EXIT INT TERM
  log "Stopping local frontend and backend..."
  [[ -n "$TAIL_PID" ]] && kill "$TAIL_PID" 2>/dev/null || true
  # Job control gives each background service its own process group; terminate the group.
  [[ -n "$FRONTEND_PID" ]] && kill -TERM -- "-$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$BACKEND_PID" ]] && kill -TERM -- "-$BACKEND_PID" 2>/dev/null || true
  [[ -n "$FRONTEND_PID" ]] && wait "$FRONTEND_PID" 2>/dev/null || true
  [[ -n "$BACKEND_PID" ]] && wait "$BACKEND_PID" 2>/dev/null || true
  log "PostgreSQL, Redis, and MongoDB system services were left running."
}
trap cleanup EXIT INT TERM

log "Starting Spring Boot backend on 0.0.0.0:${SERVER_PORT}..."
log "Backend log: $BACKEND_LOG"
set -m
(
  cd "$BACKEND_DIR"
  exec java "${JAVA_OPTS_ARRAY[@]}" -jar "$EXECUTABLE_JAR"
) >>"$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

log "Starting Next.js production server on ${FRONTEND_HOST}:${FRONTEND_PORT}..."
log "Frontend log: $FRONTEND_LOG"
(
  cd "$FRONTEND_DIR"
  exec npm run start -- --hostname "$FRONTEND_HOST" --port "$FRONTEND_PORT"
) >>"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
set +m

# Wait for both applications to begin listening before declaring startup successful.
wait_for_port "Spring Boot backend" "127.0.0.1" "$SERVER_PORT" 180
wait_for_port "Next.js frontend" "127.0.0.1" "$FRONTEND_PORT" 90

log "All five RNG services are up."
log "Frontend: http://127.0.0.1:${FRONTEND_PORT}"
log "Backend:  http://127.0.0.1:${SERVER_PORT}"
log "Public frontend/backend URLs continue to use the existing Caddy routes."
log "Following logs; press Ctrl+C to stop frontend and backend."

tail -n 0 -F "$BACKEND_LOG" "$FRONTEND_LOG" &
TAIL_PID=$!

# Exit and clean up if either application process exits unexpectedly.
set +e
wait -n "$BACKEND_PID" "$FRONTEND_PID"
STATUS=$?
set -e
log "A frontend/backend process exited (status $STATUS). See the logs above."
exit "$STATUS"
