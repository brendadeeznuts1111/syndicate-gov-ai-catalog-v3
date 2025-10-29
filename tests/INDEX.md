# 🧪 Tests Index

**Quick navigation for Citadel testing infrastructure**

## 📑 **Test Categories**

| Category | Directory | Purpose | Quick Command |
|----------|-----------|---------|---------------|
| **🔬 Unit Tests** | `unit/` | Component isolation | `bun test tests/unit/` |
| **🔗 Integration** | `integration/` | Component interaction | `bun test tests/integration/` |
| **⚡ Performance** | `performance/` | Speed & resource testing | `bun test tests/performance/` |
| **🏷️ Matrix** | `matrix/` | Dynamic tag-driven tests | `bun test tests/matrix/` |
| **📸 Snapshots** | `snapshots/` | Auto-generated snapshots | `bun test --update-snapshots` |

## 🚀 **Quick Commands**

```bash
# Full test suite
bun test --coverage

# AI-quiet mode
CLAUDECODE=1 bun test --only-failures

# Environment validation
bun test tests/unit/env.test.ts

# Performance testing
bun test tests/performance/ --timeout=120000

# Tag-filtered matrix tests
TAG_FILTER=RUNTIME bun test tests/matrix/
```

## 📊 **Key Files**

| File | Purpose | Reference |
|------|---------|-----------|
| `env.test.ts` | Environment validation | [Environment Reference](../docs/01-getting-started/REFERENCE.md) |
| `types.test.ts` | TypeScript type safety | [Type Safety Guide](../docs/07-validation/TESTING.md) |
| `global-setup.ts` | Global test configuration | [Configuration Guide](../docs/09-configuration/) |
| `tag-scanner.ts` | Dynamic tag discovery | [Matrix Testing](../docs/12-package-management/) |

---

**📖 Full Documentation:** [tests/README.md](./README.md)
