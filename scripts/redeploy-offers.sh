#!/usr/bin/env bash
# Simulate a production deploy of the offers remote (new release → new chunk hashes).
# Used for the stale-remote-entry bug. Requires scripts/prod.sh to be running.
set -euo pipefail
cd "$(dirname "$0")/.."
RELEASE="r$(date +%H%M%S)"
echo "Building offers $RELEASE…"
( cd apps/offers && NEXT_PUBLIC_RELEASE=$RELEASE NEXT_PRIVATE_LOCAL_WEBPACK=true npx next build >/dev/null )
if [[ -f .logs/offers.pid ]]; then
  pid=$(cat .logs/offers.pid); pkill -P "$pid" 2>/dev/null || true; kill "$pid" 2>/dev/null || true
fi
( cd apps/offers && exec npx next start -p 3102 ) >.logs/offers.log 2>&1 &
echo $! >.logs/offers.pid
for _ in $(seq 1 30); do curl -sf -o /dev/null http://localhost:3102/ && break; sleep 0.5; done
echo "offers $RELEASE is live on :3102"
