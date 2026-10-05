#!/usr/bin/env bash
# Build an offline bundle for a machine that may not reach the npm registry.
#
#   ./scripts/bundle.sh            → .bundle/frontend-troubleshooting-offline.tgz
#
# The archive carries the repo AND node_modules, so the target machine runs
# `pnpm dev` without installing anything.
#
# IMPORTANT: node_modules contains platform-specific binaries (@next/swc, turbo,
# esbuild, playwright). The bundle only works on the same OS + CPU architecture
# as the machine that built it. This one: see PLATFORM.txt inside the archive.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=.bundle
NAME=frontend-troubleshooting-offline.tgz
mkdir -p "$OUT"

{
  echo "built on : $(uname -s) $(uname -m)"
  echo "node     : $(node -v)"
  echo "pnpm     : $(pnpm -v)"
  echo "commit   : $(git rev-parse --short HEAD) ($(git rev-parse --abbrev-ref HEAD))"
  echo "date     : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo
  echo "Unpack, then: pnpm dev   (no install needed on the same OS/arch)"
} > PLATFORM.txt

echo "Archiving (this takes a couple of minutes)…"
tar --exclude='./.git' \
    --exclude='./.bundle' \
    --exclude='./.logs' \
    --exclude='./.turbo' \
    --exclude='*/.next' \
    --exclude='*/.next-buggy' \
    --exclude='*/.turbo' \
    --exclude='*.tsbuildinfo' \
    -czf "$OUT/$NAME" .

rm -f PLATFORM.txt
echo
echo "$OUT/$NAME  ($(du -h "$OUT/$NAME" | cut -f1))"
echo "Copy it to the other machine, then:"
echo "  mkdir -p ~/dev/frontend-troubleshooting && tar -xzf $NAME -C ~/dev/frontend-troubleshooting && cd ~/dev/frontend-troubleshooting && pnpm dev"
