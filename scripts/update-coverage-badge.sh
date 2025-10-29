#!/usr/bin/env bash
# scripts/update-coverage-badge.sh - Auto-update coverage badge
set -euo pipefail

if [ -f "coverage/lcov.info" ]; then
  COVERAGE_PERCENT=$(grep -oP 'Lines:\s+\K\d+' coverage/lcov.info | head -1)
  curl -s "https://img.shields.io/badge/coverage-${COVERAGE_PERCENT}%25-brightgreen" > badge.svg
  echo "✅ Coverage badge updated: ${COVERAGE_PERCENT}%"
else
  echo "❌ coverage/lcov.info not found"
  exit 1
fi
