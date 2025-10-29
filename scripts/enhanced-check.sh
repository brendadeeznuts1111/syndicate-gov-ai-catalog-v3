#!/usr/bin/env bash
# scripts/enhanced-check.sh - Local mega-check (single script)
set -euo pipefail

bun install --frozen-lockfile
bun test --only-failures --pass-with-no-tests --rerun-each=3 --bail=3 --randomize --seed=$(date +%s) --coverage || {
  echo "❌ Tests failed"
  exit 1
}
echo "✅ Enhanced runtime locked"
