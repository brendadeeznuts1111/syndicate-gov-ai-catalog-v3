#!/usr/bin/env bash
# scripts/enhanced-check.sh - Local mega-check (single script)
set -euo pipefail

bun install --frozen-lockfile
bun test --smol --coverage --bail=3 || {
  echo "❌ Tests failed"
  exit 1
}
echo "✅ Enhanced runtime locked"
