#!/usr/bin/env bash
# Production profile: build everything, then run each server with `next start`.
# Needed for the prod-only bugs (stale-remote-entry, prod-crash).
#   ./scripts/prod.sh            build + start
#   ./scripts/prod.sh --no-build start only
set -euo pipefail
cd "$(dirname "$0")/.."
LOGS=.logs
mkdir -p "$LOGS"

if [[ "${1:-}" != "--no-build" ]]; then
  pnpm build
fi

start() { # name port dir cmd...
  local name=$1 dir=$2; shift 2
  ( cd "$dir" && exec "$@" ) >"$LOGS/$name.log" 2>&1 &
  echo $! >"$LOGS/$name.pid"
  echo "  $name → pid $! (log: $LOGS/$name.log)"
}

./scripts/stop.sh >/dev/null 2>&1 || true
echo "Starting production servers"
start graph         services/graph node dist/server.js
start intake        apps/intake   npx next start -p 3101
start intake-buggy  apps/intake   env MF_VARIANT=buggy npx next start -p 3111
start offers        apps/offers   npx next start -p 3102
start offers-buggy  apps/offers   env MF_VARIANT=buggy npx next start -p 3112
start host          apps/host     npx next start -p 3100
echo
echo "Host: http://localhost:3100   Stop: ./scripts/stop.sh"
