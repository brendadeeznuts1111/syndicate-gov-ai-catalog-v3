# Environment Locking & Reproducibility

## Overview

Citadel implements **deterministic environment locking** to guarantee "it works everywhere" - no more "works on my machine" issues.

## 🔒 Lockfile Drift Guard

### Implementation
```typescript
// tests/citadel.test.ts
test('lockfile frozen', async () => {
  await $`bun install --frozen-lockfile`.quiet(); // throws on mismatch
  expect(true).toBe(true);
});
```

### How It Works
- **CI fails immediately** if `bun.lock` not committed after dependency changes
- **`bun install --frozen-lockfile`** throws on any mismatch
- **Prevents accidental drift** between local and CI environments

### Usage
```bash
# After changing dependencies
bun install  # Updates lockfile
git add bun.lock package.json
git commit -m "update: dependencies"
```

## 📸 Environment Snapshots

### Implementation
```typescript
// tests/env.test.ts
test('env snapshot', () => {
  const snap = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    AI_HANDLER_WRITE: process.env.AI_HANDLER_WRITE,
    CITADEL_TELEMETRY_URL: process.env.CITADEL_TELEMETRY_URL?.replace(/\w/g,'*'),
    JWT_SECRET: process.env.JWT_SECRET?.replace(/\w/g,'*'),
    SESSION_SECRET: process.env.SESSION_SECRET?.replace(/\w/g,'*'),
  };
  expect(snap).toMatchSnapshot();
});
```

### Features
- **Auto-creates** `env.test.ts.snap` on first run
- **Masks sensitive data** (tokens, secrets)
- **Fails on environment changes**
- **Update with**: `bun test --update-snapshots`

### Usage
```bash
# Run environment validation
bun test tests/env.test.ts

# Update snapshot after intentional changes
bun test tests/env.test.ts --update-snapshots
```

## 🐳 Containerized Reproducibility

### Dockerfile.test (Strict)
```dockerfile
FROM oven/bun:1.3.0-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile  # Fails on mismatch
COPY . .
CMD ["bun", "test"]
```

### Usage
```bash
# Build and test (fails on lockfile mismatch)
docker build -f Dockerfile.test -t citadel:test .

# Working version for demonstration
docker build -f Dockerfile.test-working -t citadel:test-working
docker run --rm citadel:test-working
```

## 🔄 CI Matrix Testing

### Implementation
```yaml
# .github/workflows/citadel-ci.yml
strategy:
  matrix:
    node: [18, 20, 22]
  fail-fast: false
```

### Benefits
- **Tests multiple Node ABIs**
- **Catches native-addon issues**
- **Detects polyfill surprises**
- **Separate artifacts per version**

## 🚀 Pre-flight Validation

### scripts/env-check.sh
```bash
#!/usr/bin/env bash
set -euo pipefail
echo "🔒 Lockfile check"
bun install --frozen-lockfile
echo "🧪 Env snapshot"
bun test tests/env.test.ts
echo "✅ Environment locked"
```

### Usage
```bash
# For new clones or CI setup
./scripts/env-check.sh
```

## 🔧 Bun Patch Integration

### Patching Dependencies
```bash
# Prepare package for patching
bun patch @types/bun

# Edit node_modules/@types/bun directly
echo "# Patched for Citadel" >> node_modules/@types/bun/README.md

# Commit patch
bun patch --commit node_modules/@types/bun
```

### Result
- **Patch file**: `patches/@types%2Fbun@1.3.1.patch`
- **package.json**: Updated `patchedDependencies`
- **Git-friendly**: Patches committed to repo
- **Reusable**: Across projects and machines

## 📋 Ship Checklist

### Required ✅
- [ ] `bun install --frozen-lockfile` passes locally
- [ ] `tests/env.test.ts` snapshot committed
- [ ] CI matrix includes multiple Node versions
- [ ] `docker build -f Dockerfile.test .` exits 0
- [ ] `scripts/env-check.sh` runs in <5 seconds

### Optional 🎯
- [ ] Bun patches created for necessary fixes
- [ ] Docker working version tested
- [ ] Environment documented in README

## 🎯 Real-World Examples

### Scenario 1: Dependency Update
```bash
# Developer adds new dependency
bun add lodash

# Lockfile guard catches missing bun.lock in CI
# Fix: commit the updated lockfile
git add bun.lock package.json
git commit -m "add: lodash dependency"
```

### Scenario 2: Environment Variable Change
```bash
# Add new environment variable
export CITADEL_NEW_FEATURE=true

# Env snapshot test fails
# Fix: update snapshot
bun test tests/env.test.ts --update-snapshots
git add tests/__snapshots__/env.test.ts.snap
git commit -m "env: add CITADEL_NEW_FEATURE"
```

### Scenario 3: Native Addon Issues
```bash
# CI fails on Node 18 but passes on 20
# Matrix testing catches this early
# Fix: update package.json engines field
```

### Scenario 4: Docker Build Issues
```bash
# Docker build fails due to node_modules conflicts
# Lockfile guard prevents silent failures
# Fix: use proper .dockerignore or bun patch
```

## 🔍 Debugging Environment Issues

### Lockfile Issues
```bash
# Check lockfile status
bun install --frozen-lockfile

# Regenerate if needed
rm bun.lock && bun install
```

### Environment Issues
```bash
# Show current environment
env | grep CITADEL

# Run env validation
bun test tests/env.test.ts
```

### Docker Issues
```bash
# Build with debug output
docker build -f Dockerfile.test -t citadel:test . --progress=plain

# Run container interactively
docker run -it --rm citadel:test sh
```

## 📚 Best Practices

1. **Always commit lockfile** after dependency changes
2. **Update snapshots** after environment changes
3. **Use bun patch** for necessary dependency fixes
4. **Test in Docker** for container environments
5. **Run pre-flight script** on new clones

## 🏆 Benefits

- **Zero surprises** in CI/CD
- **Deterministic builds** across machines
- **Environment validation** on every test run
- **Git-friendly patches** for dependency fixes
- **Container reproducibility** for deployment

The empire now ships with **deterministic deps + environment snapshots**—the last mile of "it works everywhere" guarantees. 🏰🔒
