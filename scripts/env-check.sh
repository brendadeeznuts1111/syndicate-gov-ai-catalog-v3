#!/usr/bin/env bash
# scripts/env-check.sh - Pre-flight script for new clones
set -euo pipefail

echo "🔒 Lockfile check"
bun install --frozen-lockfile

echo "🧪 Env snapshot"
bun test tests/env.test.ts

echo "✅ Environment locked"
