#!/usr/bin/env bash
set -euo pipefail
export AI_HANDLER_WRITE=false
bun run scripts/ai-suggest.ts
echo "✅ Suggester dry-run complete"
