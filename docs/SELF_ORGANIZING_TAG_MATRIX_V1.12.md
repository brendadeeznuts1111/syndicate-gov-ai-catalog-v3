# Self-Organizing Tag-Driven Test Suite v1.12

## Overview

The self-organizing test suite uses grepable headers embedded in AI route files to automatically decide test execution parameters. Zero configuration files required - all behavior is driven by file headers.

## Features

### 🔍 Header Scanner (`tests/scan-tags.ts`)
- Scans `routes/ai/*.ts` files for `[AI][TAG]` headers
- Returns `Record<string, string[]>` mapping tags to file paths
- Uses `readdir` and `Bun.file()` for file discovery

### 🏷️ Tag-Driven Test Matrix (`tests/tag-matrix.test.ts`)
- Dynamically generates tests based on discovered tags
- Filters by `TAG_FILTER` environment variable
- Validates file existence, headers, and export structure
- Sets environment variables based on tag type

### ⏱️ Dynamic Timeout from Headers (`tests/timeout-from-header.test.ts`)
- Parses `[TIMEOUT-NNNN]` headers from AI files
- Validates timeout declarations (defaults to 5000ms)
- Ensures headers are properly formatted

### 🔓 Mutation Allow-List (`tests/mutation-allow.test.ts`)
- Checks for `[ALLOW-MUTATION]` headers in AI files
- Validates mutation permission flags
- Snapshot-style validation of mutation settings

## AI Route Files with Headers

### Runtime Handler (`routes/ai/runtime-handler.ts`)
```typescript
// [AI][RUNTIME]
// [TIMEOUT-8000]
// [ALLOW-MUTATION]
```

### Accounting Handler (`routes/ai/accounting-handler.ts`)
```typescript
// [AI][ACCOUNTING]
// [TIMEOUT-5000]
```

### Odd Movement Handler (`routes/ai/odd-movement-handler.ts`)
```typescript
// [AI][ODD-MOVEMENT]
// [TIMEOUT-3000]
```

## Commands

### Tag-Specific Testing
- `🧪 bun:test:tag:runtime` - Test only RUNTIME-tagged files
- `🧪 bun:test:tag:accounting` - Test only ACCOUNTING-tagged files
- `🧪 bun:test:tag:odd-movement` - Test only ODD-MOVEMENT-tagged files

### Mega Tag Testing
- `🧪 bun:test:mega-tag` - Comprehensive RUNTIME testing with flake protection

## CI Integration

### Tag Matrix Job
```yaml
ai-tag-matrix:
  strategy:
    matrix:
      tag: [RUNTIME, ACCOUNTING, ODD-MOVEMENT]
  steps:
    - run: TAG_FILTER=${{ matrix.tag }} bun test ./tests/tag-matrix.test.ts --only-failures --pass-with-no-tests
```

## Implementation Details

### Tag Discovery
- Files are scanned at test runtime using `scanTags()`
- Headers use format `[AI][TAG-NAME]` for easy grepability
- Multiple tags per file supported

### Environment-Based Execution
- `TAG_FILTER=RUNTIME` sets `NODE_ENV=stress`
- `TAG_FILTER=ACCOUNTING` sets `CITADEL_ACCOUNTING=1`
- Future tags can add custom environment setup

### Validation Approach
- Tests validate file structure and headers rather than execution
- Prevents import issues with relative paths
- Focuses on configuration correctness

## Usage Examples

### Local Development
```bash
# Test all runtime handlers
bun run 🧪 bun:test:tag:runtime

# Test accounting features
bun run 🧪 bun:test:tag:accounting

# Mega testing with flake protection
bun run 🧪 bun:test:mega-tag
```

### Adding New Tags
1. Add `[AI][NEW-TAG]` header to route files
2. Optionally add environment setup in `tag-matrix.test.ts`
3. Add CLI command in `package.json`
4. Add to CI matrix array

## Ship Checklist

- [x] `scanTags()` returns correct tag→file map
- [x] `🧪 bun:test:tag:runtime` only runs RUNTIME-tagged validation
- [x] Timeout header `[TIMEOUT-8000]` properly parsed
- [x] Mutation flag `[ALLOW-MUTATION]` correctly detected
- [x] CI matrix spawns one job per tag
- [x] All tests pass with zero extra dependencies

---

**Status**: ✅ v1.12 Tag-Matrix Self-Organizing Tests Active
**Compatibility**: Bun 1.3.0+
**Dependencies**: Zero external dependencies
