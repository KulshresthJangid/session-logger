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
step "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci --omit=dev --include=dev   # install all (need devDeps for TS build)
ok "Backend dependencies installed."

step "Generating Prisma client..."
NODE_ENV=production npx prisma generate
ok "Prisma client generated."

step "Running database migrations (migrate deploy)..."
NODE_ENV=production npx prisma migrate deploy
ok "Migrations applied."

step "Building backend (TypeScript → dist/)..."
npm run build
ok "Backend built."

# ── 4. Frontend: install → build ──────────────────────────────────────────────
step "Installing frontend dependencies..."
cd "$FRONTEND_DIR"
npm ci
ok "Frontend dependencies installed."

step "Building frontend (Vite, base=/session-logger/)..."
npm run build
ok "Frontend built → frontend/dist/"

# ── 5. Start backend (serves both API and frontend static files) ──────────────
step "Starting backend server..."
cd "$BACKEND_DIR"
NODE_ENV=production node dist/server.js &
BACKEND_PID=$!
ok "Backend started (PID: $BACKEND_PID)."

# ── 6. Health check ───────────────────────────────────────────────────────────
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

# ── 7. Summary ────────────────────────────────────────────────────────────────
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
echo "  Press Ctrl+C to stop all services."
echo ""

# ── 8. Graceful shutdown ──────────────────────────────────────────────────────
cleanup() {
  echo ""
  step "Shutting down..."
  kill "$BACKEND_PID" 2>/dev/null || true
  docker compose -f "$ROOT_DIR/docker-compose.yml" stop postgres
  ok "Done."
}
trap cleanup EXIT INT TERM

wait "$BACKEND_PID"
