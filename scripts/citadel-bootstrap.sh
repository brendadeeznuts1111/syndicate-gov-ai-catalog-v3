#!/usr/bin/env bash
set -euo pipefail

echo "🏰 Syndicate Citadel Bootstrap v1.3"
echo "=================================="

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Generate OpenAPI schemas
echo "🔧 Generating OpenAPI schemas..."
bun run scripts/gen-openapi-schemas.ts

# Validate API routes
echo "✅ Validating API routes..."
bun run scripts/validate-api.ts

echo "🔍 Running AI suggester dry-run..."
AI_HANDLER_WRITE=false bun run scripts/ai-suggest.ts
echo "✅ v1.3-suggest-minimal integrity verified"

echo "🚀 Citadel is ready for deployment!"
echo "   Run 'bun start' to launch the server"
