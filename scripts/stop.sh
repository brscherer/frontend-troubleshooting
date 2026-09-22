#!/usr/bin/env bash
# Stop servers started by scripts/prod.sh.
cd "$(dirname "$0")/.."
for f in .logs/*.pid; do
  [[ -f "$f" ]] || continue
  pid=$(cat "$f")
  pkill -P "$pid" 2>/dev/null || true
  kill "$pid" 2>/dev/null && echo "stopped $(basename "$f" .pid)"
  rm -f "$f"
done
