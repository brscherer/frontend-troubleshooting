#!/usr/bin/env bash
# Stop every server of this project (prod or dev), by pid file and by port.
cd "$(dirname "$0")/.."
for f in .logs/*.pid; do
  [[ -f "$f" ]] || continue
  kill "$(cat "$f")" 2>/dev/null || true
  rm -f "$f"
done
# `next start` runs the real server in a child process: make sure the ports are free.
for port in 3100 3101 3111 3102 3112 4000; do
  pids=$(lsof -nP -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  [[ -n "$pids" ]] && kill $pids 2>/dev/null && echo "stopped :$port"
done
exit 0
