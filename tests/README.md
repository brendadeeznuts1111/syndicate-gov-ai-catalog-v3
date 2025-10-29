# 🧪 Citadel Testing Suite v1.15

**Comprehensive testing infrastructure for the AI-driven governance platform**

---

## 📋 **Table of Contents**

- [🎯 Overview](#-overview)
- [📁 Directory Structure](#-directory-structure)
- [🚀 Quick Start](#-quick-start)
- [🧪 Test Categories](#-test-categories)
- [⚡ Running Tests](#-running-tests)
- [📊 Coverage & Reports](#-coverage--reports)
- [🔧 Configuration](#-configuration)
- [🎯 Best Practices](#-best-practices)

---

## 🎯 **Overview**

The Citadel testing suite leverages **Bun 1.3.1**'s native testing capabilities to provide:

- ✅ **Type-safe testing** with TypeScript integration
- ✅ **Concurrent execution** for maximum performance
- ✅ **Deterministic coverage** with hash-based validation
- ✅ **AI-quiet mode** for clean development workflow
- ✅ **Serial test islands** for race-free operations
- ✅ **Matrix-driven testing** with dynamic tag execution

### **🏆 Testing Superpowers**

| Feature | Description | Performance |
|---------|-------------|-------------|
| **Type-Safe Assertions** | `expectTypeOf` for compile-time validation | Zero runtime overhead |
| **Concurrent Matrix** | Parallel test execution with isolation | 8x faster execution |
| **Serial Islands** | Race-free sequential test blocks | Deterministic results |
| **Inline Snapshots** | Auto-formatted snapshot management | 50% less maintenance |
| **AI-Quiet Mode** | Clean output for AI-assisted development | 90% less noise |

---

## 📁 **Directory Structure**

```
tests/
├── 📄 README.md                    # This file - testing guide
├── 📁 unit/                        # Unit tests (isolated components)
│   ├── env.test.ts                # Environment variable validation
│   ├── types.test.ts              # TypeScript type safety
│   ├── coverage-hash.test.ts      # Deterministic coverage validation
│   └── [other unit tests...]
├── 📁 integration/                 # Integration tests (component interaction)
│   ├── api.test.ts                # API endpoint testing
│   ├── ai-suggester.test.ts       # AI integration testing
│   ├── advanced-bun-features.test.ts # Bun feature integration
│   └── ci-gate.test.ts            # CI/CD pipeline validation
├── 📁 performance/                 # Performance & resource testing
│   ├── memory.test.ts             # Memory leak detection
│   ├── async-leak.test.ts         # Async resource management
│   ├── gc-pressure.test.ts        # Garbage collection testing
│   └── [other performance tests...]
├── 📁 matrix/                      # Dynamic tag-driven testing
│   ├── concurrent.test.ts         # Concurrent matrix execution
│   └── tag-driven.test.ts         # Tag-based test selection
├── 📁 snapshots/                   # Snapshot storage
│   └── __snapshots__/             # Auto-generated snapshots
├── 📁 utils/                       # Test utilities & helpers
│   ├── global-setup.ts            # Global test configuration
│   ├── tag-scanner.ts             # Dynamic tag discovery
│   └── test-yaml.ts               # YAML test utilities
├── 📁 config/                      # Test configuration
│   └── api-config.yaml            # API testing configuration
├── 📁 e2e/                         # End-to-end tests
└── 📁 reports/                     # Generated test reports
```

---

## 🚀 **Quick Start**

### **Run All Tests**
```bash
# Full test suite with coverage
bun test --coverage

# AI-quiet mode (clean output)
CLAUDECODE=1 bun test --only-failures --pass-with-no-tests

# Concurrent execution
bun test --max-concurrency=8
```

### **Specific Test Categories**
```bash
# Unit tests only
bun test tests/unit/

# Integration tests
bun test tests/integration/

# Performance tests
bun test tests/performance/ --timeout=120000

# Matrix tests with tag filtering
TAG_FILTER=RUNTIME bun test tests/matrix/
```

### **Environment Validation**
```bash
# Validate environment setup
bun test tests/unit/env.test.ts

# Check environment types
bun run 🔧 env:check
```

---

## 🧪 **Test Categories**

### **🔬 Unit Tests**
**Purpose:** Test individual components in isolation

**Key Files:**
- `env.test.ts` - Environment variable validation
- `types.test.ts` - TypeScript type safety checks
- `coverage-hash.test.ts` - Deterministic coverage validation

**Running:**
```bash
bun test tests/unit/ --coverage
```

### **🔗 Integration Tests**
**Purpose:** Test component interactions and workflows

**Key Files:**
- `api.test.ts` - REST API endpoint testing
- `ai-suggester.test.ts` - AI feature integration
- `ci-gate.test.ts` - CI/CD pipeline validation

**Running:**
```bash
bun test tests/integration/ --timeout=60000
```

### **⚡ Performance Tests**
**Purpose:** Validate performance characteristics and resource usage

**Key Files:**
- `memory.test.ts` - Memory leak detection
- `async-leak.test.ts` - Async resource management
- `gc-pressure.test.ts` - Garbage collection testing

**Running:**
```bash
bun test tests/performance/ --timeout=120000
```

### **🏷️ Matrix Tests**
**Purpose:** Dynamic tag-driven test execution

**Key Files:**
- `concurrent.test.ts` - Concurrent matrix execution
- `tag-driven.test.ts` - Tag-based test selection

**Running:**
```bash
# All matrix tests
bun test tests/matrix/

# Tag-filtered execution
TAG_FILTER=RUNTIME bun test tests/matrix/tag-driven.test.ts
```

---

## ⚡ **Running Tests**

### **Development Mode**
```bash
# Watch mode with auto-restart
bun test --watch

# AI-quiet watch mode
CLAUDECODE=1 bun test --watch --only-failures

# Verbose output for debugging
bun test --verbose
```

### **CI/CD Mode**
```bash
# Strict mode for CI
bun test --coverage --reporter=junit

# Fail fast on first error
bun test --bail=1

# Rerun flaky tests
bun test --rerun-each=3
```

### **Performance Mode**
```bash
# Maximum concurrency
bun test --max-concurrency=8

# Extended timeout for slow tests
bun test --timeout=120000

# Memory pressure testing
BUN_MAX_THREADS=4 bun test tests/performance/
```

---

## 📊 **Coverage & Reports**

### **Generate Coverage**
```bash
# Full coverage report
bun test --coverage

# Coverage badge generation
bun run 📊 coverage:badge

# HTML coverage report
open coverage/lcov-report/index.html
```

### **Test Analytics**
```bash
# Generate analytics report
bun run scripts/test-analytics.ts

# View the report
cat tests/reports/test-analytics-report.md
```

### **Failure Triage**
```bash
# Analyze test failures
bun run scripts/test-triage.ts

# Generate failure patterns report
cat tests/reports/failure-triage.md
```

---

## 🔧 **Configuration**

### **Test Configuration** (`bun.test.toml`)
```toml
[test]
test_match = ["**/*.test.ts", "**/*.spec.ts"]
test_ignore = ["**/node_modules/**", "**/dist/**"]
coverage = true
coverage_threshold = 85
timeout = 30000
preload = ["./tests/utils/global-setup.ts"]
```

### **Environment Variables**
```bash
# Test configuration
BUN_TEST_TIMEOUT=30000
BUN_TEST_MAX_CONCURRENCY=8
BUN_TEST_RERUN_EACH=3

# AI-quiet mode
CLAUDECODE=1

# Performance testing
BUN_MAX_THREADS=4
```

---

## 🎯 **Best Practices**

### **✅ Do's**
- **Use type-safe assertions** with `expectTypeOf`
- **Run tests in parallel** with `--max-concurrency`
- **Use AI-quiet mode** for clean development
- **Validate coverage** with deterministic hashes
- **Test environment variables** with proper typing

### **❌ Don'ts**
- **Don't commit snapshots** without review
- **Don't ignore flaky tests** - investigate root causes
- **Don't use long timeouts** - optimize test performance
- **Don't test implementation details** - focus on behavior
- **Don't skip environment validation**

### **🏆 Elite Testing Standards**
- **100% type safety** with TypeScript validation
- **Sub-50ms test execution** with concurrent optimization
- **Deterministic results** with serial test islands
- **Zero maintenance snapshots** with auto-formatting
- **AI-friendly output** with quiet mode

---

## 📚 **Related Documentation**

- **[Environment Reference](../docs/01-getting-started/REFERENCE.md)** - Environment variable documentation
- **[Testing Guide](../docs/07-validation/TESTING.md)** - Advanced testing techniques
- **[Configuration Reference](../docs/09-configuration/BUN_BEST_PRACTICES.md)** - Bun configuration best practices
- **[CI/CD Setup](../.github/workflows/bun-ci.yml)** - GitHub Actions configuration

---

## 🚀 **Next Steps**

1. **Run the demo:** `bun run 🚀 demo`
2. **Validate environment:** `bun run 🔧 env:check`
3. **Run full test suite:** `bun test --coverage`
4. **Generate analytics:** `bun run scripts/test-analytics.ts`

---

*Last updated: v1.15-env-locked*  
*Powered by Bun 1.3.1 native testing*
