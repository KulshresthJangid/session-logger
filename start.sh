#!/usr/bin/env bash
# =============================================================================
# start.sh — Build and run Session Logger in production mode.
#
# Prerequisites:
#   • Docker (for PostgreSQL)
#   • Node.js >= 18 + npm
#   • Ports 3001 and 5432 available
#
# Usage:
#   chmod +x start.sh
#   ./start.sh
#
# To stop:
#   Press Ctrl+C — the script traps the signal and shuts down cleanly.
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
step() { echo -e "\n${CYAN}${BOLD}==> $*${RESET}"; }
ok()   { echo -e "${GREEN}    ✓ $*${RESET}"; }

# ── 1. Validate .env.production exists for backend ────────────────────────────
if [[ ! -f "$BACKEND_DIR/.env.production" ]]; then
  echo "ERROR: $BACKEND_DIR/.env.production not found."
  echo "  Copy .env.production.example, fill in the secrets, and retry."
  exit 1
fi

# ── 2. Start PostgreSQL ───────────────────────────────────────────────────────
step "Starting PostgreSQL via Docker Compose..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d postgres

step "Waiting for PostgreSQL to be ready..."
until docker exec session_logger_db pg_isready -U sessionuser -q 2>/dev/null; do
  sleep 1
done
ok "PostgreSQL is ready."

# ── 3. Backend: install → generate Prisma client → migrate → build ───────────
# Load .env.production into the current shell so Prisma CLI can read DATABASE_URL
# and other vars (Prisma CLI only auto-reads .env, not per-environment files).
set -a
# shellcheck source=backend/.env.production
source "$BACKEND_DIR/.env.production"
set +a

step "Installing backend dependencies..."
cd "$BACKEND_DIR"
# --include=dev ensures TypeScript and ts-node are present for the tsc build step.
npm ci --include=dev
ok "Backend dependencies installed."

step "Generating Prisma client..."
npx prisma generate
ok "Prisma client generated."

step "Running database migrations (migrate deploy)..."
npx prisma migrate deploy
ok "Migrations applied."

step "Building backend (TypeScript → dist/)..."
npm run build
ok "Backend built."

# ── 4. Frontend: install → build ──────────────────────────────────────────────
step "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
# NODE_ENV=production (from .env.production) would make npm skip devDependencies.
# --include=dev forces TypeScript, Vite, and other build tools to be installed.
npm ci --include=dev
ok "Frontend dependencies installed."

step "Building frontend (Vite, base=/session-logger/)..."
npm run build
ok "Frontend built → frontend/dist/"

# ── 5. Kill any existing backend before starting the new one ─────────────────
PID_FILE="$ROOT_DIR/server.pid"
if [[ -f "$PID_FILE" ]]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    step "Stopping existing backend (PID: $OLD_PID)..."
    kill "$OLD_PID"
    # Wait up to 10 s for the process to exit
    for i in $(seq 1 10); do
      kill -0 "$OLD_PID" 2>/dev/null || break
      sleep 1
    done
    if kill -0 "$OLD_PID" 2>/dev/null; then
      echo "  Process did not exit cleanly — sending SIGKILL..."
      kill -9 "$OLD_PID" 2>/dev/null || true
    fi
    ok "Old backend stopped."
  else
    ok "PID file found but process $OLD_PID is not running — skipping."
  fi
  rm -f "$PID_FILE"
fi

# ── 6. Start backend detached (serves both API and frontend static files) ──────
step "Starting backend server (detached)..."
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/server.log"
cd "$BACKEND_DIR"
nohup node dist/server.js > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
# Persist the PID so stop.sh (or the operator) can kill it later.
echo "$BACKEND_PID" > "$ROOT_DIR/server.pid"
ok "Backend started (PID: $BACKEND_PID) — logs: logs/server.log"

# ── 7. Health check ───────────────────────────────────────────────────────────
step "Waiting for server to accept connections..."
for i in $(seq 1 15); do
  if curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    ok "Server is healthy."
    break
  fi
  sleep 1
  if [[ $i -eq 15 ]]; then
    echo "ERROR: Server did not become healthy after 15 s. Check logs above."
    kill "$BACKEND_PID" 2>/dev/null || true
    exit 1
  fi
done

# ── 8. Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Session Logger is running!${RESET}"
echo -e "${BOLD}════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  ${BOLD}Application${RESET}   http://localhost:3001/session-logger"
echo -e "  ${BOLD}API${RESET}           http://localhost:3001/api"
echo -e "  ${BOLD}Health${RESET}        http://localhost:3001/health"
echo -e "  ${BOLD}pgAdmin${RESET}       http://localhost:5050"
echo ""
echo -e "  ${BOLD}Exposed ports:${RESET}"
echo "    3001  — Express server  (API + frontend static files)"
echo "    5432  — PostgreSQL"
echo "    5050  — pgAdmin"
echo ""
echo -e "  ${BOLD}Production URL:${RESET}  https://buildwithkulshresth.com/session-logger"
echo ""
echo -e "  ${BOLD}Nginx reverse-proxy snippet:${RESET}"
echo "    location /session-logger { proxy_pass http://127.0.0.1:3001; }"
echo "    location /api            { proxy_pass http://127.0.0.1:3001; }"
echo ""
echo -e "  ${BOLD}Logs${RESET}          $LOG_FILE"
echo -e "  ${BOLD}PID file${RESET}      $ROOT_DIR/server.pid"
echo ""
echo -e "  To stop the server:  kill \$(cat server.pid)"
echo -e "  To tail logs:        tail -f logs/server.log"
echo ""
