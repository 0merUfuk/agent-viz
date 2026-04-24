#!/usr/bin/env bash
# agent-viz — start the bridge and the Next.js dev server together.
# Ctrl-C kills both.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Install bridge deps on first run
if [ ! -d "bridge/node_modules" ]; then
  echo "→ installing bridge dependencies"
  (cd bridge && npm install --silent)
fi

echo "→ starting bridge on http://localhost:4001"
node bridge/server.js &
BRIDGE_PID=$!

cleanup() {
  echo ""
  echo "→ shutting down…"
  if kill -0 "$BRIDGE_PID" 2>/dev/null; then
    kill "$BRIDGE_PID" 2>/dev/null || true
  fi
  if [ -n "${DEV_PID:-}" ] && kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup INT TERM EXIT

# Give the bridge a moment to bind
sleep 0.5

echo "→ starting Next.js on http://localhost:3000"
npm run dev &
DEV_PID=$!

wait
