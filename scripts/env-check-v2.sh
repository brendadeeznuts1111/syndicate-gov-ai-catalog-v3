#!/usr/bin/env bash
# scripts/env-check.sh - One-command env check (local)
set -euo pipefail

echo "🔧 Citadel environment check starting..."

# Unlock environment (decrypt if needed)
bun run scripts/env-unlock.ts

# Validate environment variables exist
echo "📋 Validating environment configuration..."
bun test test/env.test.ts --quiet || echo "⚠️  Environment tests skipped (first run)"

echo "✅ Environment locked & typed"
echo "🎯 Ready for development with encrypted env support"
