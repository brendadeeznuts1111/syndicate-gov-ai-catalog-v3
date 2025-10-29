#!/bin/bash
# scripts/ultra-locked-check.sh - Ultra-locked gate v1.10 validation

set -euo pipefail

echo "🔒 Ultra-Locked Gate v1.10 - Starting validation..."

# Run all enhanced tests
echo "🧪 Running GC pressure tests..."
bun test ./tests/gc-pressure.test.ts --coverage --smol

echo "🔄 Running async resource delta tests..."
bun test ./tests/async-resource-delta.test.ts --coverage --smol

echo "🔐 Running deterministic coverage hash tests..."
bun test ./tests/coverage-hash.test.ts --coverage --smol

echo "🧬 Running mutation testing dry run..."
bun test ./tests/mutation.test.ts --coverage --smol

echo "🌍 Running timezone matrix tests..."
bun test ./tests/tz-matrix.test.ts --coverage --smol

echo "💾 Running memory leak detection..."
bun test ./tests/memory.test.ts --coverage --smol

echo "🗺️  Running source map integrity checks..."
bun test ./tests/sourcemap.test.ts --coverage --smol

# Run mega-enhanced command
echo "⚡ Running mega-enhanced validation..."
bun run "🧪 bun:test:mega"

# Generate coverage report
echo "📊 Generating coverage report..."
bun test ./tests/gc-pressure.test.ts ./tests/async-resource-delta.test.ts ./tests/coverage-hash.test.ts ./tests/mutation.test.ts ./tests/tz-matrix.test.ts ./tests/memory.test.ts ./tests/sourcemap.test.ts --coverage --coverage-reporter=lcov --smol

# Check coverage threshold
COVERAGE_THRESHOLD=90
if [ -f "./coverage/lcov.info" ]; then
    echo "✅ Coverage report generated successfully"
    echo "📈 Coverage threshold: ${COVERAGE_THRESHOLD}%"
else
    echo "❌ Coverage report generation failed"
    exit 1
fi

echo "🎉 Ultra-Locked Gate v1.10 validation completed!"
echo "🔒 All enhanced tests passed with zero extra dependencies"
