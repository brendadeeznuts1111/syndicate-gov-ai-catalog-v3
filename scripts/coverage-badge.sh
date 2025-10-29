#!/bin/bash
# scripts/coverage-badge.sh - Coverage badge refresh after CI

set -euo pipefail

COVERAGE_FILE="coverage/lcov.info"

if [ ! -f "$COVERAGE_FILE" ]; then
    echo "❌ Coverage file not found: $COVERAGE_FILE"
    exit 1
fi

# Extract line coverage percentage
COVERAGE=$(grep -Po 'Lines:\s+\K\d+' "$COVERAGE_FILE" | head -1)

if [ -z "$COVERAGE" ]; then
    echo "❌ Could not extract coverage percentage"
    exit 1
fi

echo "📊 Current coverage: ${COVERAGE}%"

# Generate coverage badge URL
COVERAGE_BADGE_URL="https://img.shields.io/badge/coverage-${COVERAGE}%25-brightgreen"
echo "🛡️ Coverage badge URL: $COVERAGE_BADGE_URL"

# Generate demo status badge (always passing after CI)
DEMO_BADGE_URL="https://img.shields.io/badge/demo-passing-brightgreen"
echo "🚀 Demo badge URL: $DEMO_BADGE_URL"

echo "📋 Add to README.md:"
echo "[![Coverage](https://img.shields.io/badge/coverage-${COVERAGE}%25-brightgreen)](coverage/lcov-report/index.html)"
echo "[![Demo]($DEMO_BADGE_URL)](https://github.com/brendadeeznuts1111/syndicate-gov-ai-catalog-v3#demo)"
