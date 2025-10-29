# 🚀 Getting Started with Citadel v1.15

## 🎯 Quick Start Guide

Welcome to **Citadel v1.15-env-locked** - the world's most advanced AI-driven governance platform with encrypted environment management!

### ⚡ Zero-Config Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/brendadeeznuts1111/syndicate-gov-ai-catalog-v3.git
cd syndicate-gov-ai-catalog-v3

# Install dependencies (automatic setup)
bun install

# Run the demo to see everything working
bun run 🚀 demo
```

**That's it!** 🎉 Citadel automatically:
- ✅ Sets up your environment from templates
- ✅ Validates all system components  
- ✅ Decrypts encrypted secrets if key provided
- ✅ Runs comprehensive test suite
- ✅ Demonstrates all Bun 1.3.1 superpowers

---

## 🔧 Environment Setup

### Standard Development Setup

```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
```

### Production Setup with Encrypted Secrets

```bash
# Set your age encryption key
export CITADEL_AGE_KEY="your-age-encryption-key"

# Install (automatically decrypts .env.citadel)
bun install
```

### Environment Variables

**Core Settings:**
```bash
# Citadel configuration
CITADEL_TELEMETRY_URL=https://telemetry.citadel.sh
DO_NOT_TRACK=1  # Disable telemetry
NODE_ENV=development

# AI & Testing
AI_HANDLER_WRITE=false
CLAUDECODE=1  # AI-quiet mode
```

**Database Configuration:**
```bash
DB_URL=postgres://citadel@localhost:5432/citadel_v3
DB_HOST=localhost
DB_PORT=5432
DB_USER=citadel
DB_NAME=citadel_v3
```

**Performance Tuning:**
```bash
BUN_MAX_THREADS=4
BUN_TEST_TIMEOUT=30000
BUN_TEST_MAX_CONCURRENCY=8
```

---

## 🧪 Testing Your Setup

### Run All Tests
```bash
# Full test suite with coverage
bun test --coverage

# AI-quiet mode (clean output)
CLAUDECODE=1 bun test --only-failures --pass-with-no-tests
```

### Specific Test Categories
```bash
# Type safety tests
bun run 🧪 bun:test:types

# Concurrent matrix tests
bun run 🧪 bun:test:concurrent

# Performance tests
bun run 🧪 bun:test:performance
```

### Environment Validation
```bash
# Check environment setup
bun run 🔧 env:check

# Validate environment types
bun test test/env.test.ts
```

---

## 🚀 Development Workflow

### 1. Start Development Server
```bash
# Standard development
bun run dev

# Performance mode
bun run ⚡ bun:performance

# Full optimization
bun run 🔧 bun:full-optimized
```

### 2. Run Tests During Development
```bash
# Watch mode with automatic re-running
bun test --watch

# AI-quiet watch mode
CLAUDECODE=1 bun test --watch --only-failures
```

### 3. Build for Production
```bash
# Build optimized bundle
bun run build

# Build standalone executable
bun run 📦 bun:build-executable
```

---

## 🚀 Native Bun Deployment

### Development Server
```bash
# Standard development
bun run dev

# Performance mode
bun run ⚡ bun:performance

# Full optimization
bun run 🔧 bun:full-optimized
```

### Production Build
```bash
# Build optimized bundle
bun run build

# Build standalone executable
bun run 📦 bun:build-executable

# Run production server
bun run prod
```

---

## 🔐 Security Setup

### Age Encryption for Secrets
```bash
# Install age (if not installed)
brew install age  # macOS
# or
sudo apt install age  # Linux

# Generate encryption key
age-keygen -o key.txt

# Encrypt your secrets
age -r $(age-keygen -y key.txt) .env > .env.citadel

# Set key in environment
export CITADEL_AGE_KEY="$(cat key.txt)"
```

### SSL/TLS Configuration
```bash
# Enable strict SSL (default)
NODE_TLS_REJECT_UNAUTHORIZED=1

# Disable for development (not recommended)
NODE_TLS_REJECT_UNAUTHORIZED=0
```

---

## 📊 Monitoring & Analytics

### Test Analytics
```bash
# Generate test analytics report
bun run scripts/test-analytics.ts

# View the report
cat tests/reports/test-analytics-report.md
```

### Performance Monitoring
```bash
# Performance benchmarks
bun test tests/performance/ --timeout=120000

# Memory leak detection
bun test tests/performance/memory.test.ts
```

### Coverage Reports
```bash
# Generate coverage badge
bun run 📊 coverage:badge

# View detailed coverage
open coverage/lcov-report/index.html
```

---

## 🤖 AI Features Setup

### Enable AI Write Operations
```bash
# Set in .env file
AI_HANDLER_WRITE=true

# Or set temporarily
AI_HANDLER_WRITE=true bun run dev
```

### AI-Quiet Mode
```bash
# For clean AI development output
CLAUDECODE=1 bun test
CLAUDECODE=1 bun run dev
```

### AI Configuration
```yaml
# config/ai-config.yaml
ai:
  enabled: true
  write_access: false
  telemetry: false
  model: "claude-3-sonnet"
```

---

## 🔧 Advanced Configuration

### Custom Test Configuration
```toml
# bun.test.toml
[test]
test_match = ["**/*.test.ts", "**/*.spec.ts"]
test_ignore = ["**/node_modules/**", "**/dist/**"]
coverage = true
coverage_threshold = 85
timeout = 30000
preload = ["./tests/utils/global-setup.ts"]
```

### Performance Optimization
```bash
# Maximum performance mode
BUN_MAX_THREADS=8 \
BUN_OPTIONS="--optimize --minify" \
BUN_CONFIG_MAX_HTTP_REQUESTS=512 \
bun run prod
```

### Database Optimization
```bash
# Preconnect database connections
bun --sql-preconnect run dev

# Custom database URL
DATABASE_URL="postgres://user:pass@host:5432/db" bun run dev
```

---

## 🚨 Troubleshooting

### Common Issues

**Environment Variables Not Loading:**
```bash
# Check environment setup
bun run 🔧 env:check

# Verify .env file exists
ls -la .env*

# Test environment access
bun -e "console.log(Bun.env.NODE_ENV)"
```

**Tests Failing:**
```bash
# Run with verbose output
bun test --verbose

# Check specific test file
bun test tests/unit/types.test.ts

# Run with longer timeout
bun test --timeout=60000
```

**Performance Issues:**
```bash
# Disable transpiler cache
BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 bun run dev

# Increase thread count
BUN_MAX_THREADS=8 bun run dev

# Check memory usage
bun test tests/performance/memory.test.ts
```

### Debug Mode
```bash
# Enable verbose logging
BUN_CONFIG_VERBOSE_FETCH=curl bun run dev

# Debug environment loading
bun -e "console.log('Env:', Bun.env)"

# Test configuration validation
bun test test/env.test.ts --verbose
```

---

## 📚 Next Steps

### 🎯 Recommended Learning Path

1. **[Environment Reference](./REFERENCE.md)** - Complete environment variable reference
2. **[Testing Guide](../04-testing/TESTING-GUIDE.md)** - Advanced testing techniques  
3. **[Security Documentation](../03-quantum-security/README.md)** - Security best practices
4. **[AI Features](../02-ai-intelligence/README.md)** - AI capabilities and configuration

### 🚀 Production Deployment

1. **[Docker Deployment](../05-deployment/DOCKER-DEPLOYMENT.md)** - Container deployment guide
2. **[CI/CD Setup](../05-deployment/CI-CD-SETUP.md)** - GitHub Actions configuration
3. **[Monitoring](../05-deployment/MONITORING.md)** - Production monitoring setup

### 🤝 Community & Support

- **GitHub Issues**: [Report bugs](https://github.com/brendadeeznuts1111/syndicate-gov-ai-catalog-v3/issues)
- **Discussions**: [Community forum](https://github.com/brendadeeznuts1111/syndicate-gov-ai-catalog-v3/discussions)
- **Documentation**: [Full docs](../README.md)

---

## 🎉 You're Ready!

**Congratulations!** 🎉 You now have Citadel v1.15 running with:

- ✅ **Encrypted environment management**
- ✅ **Type-safe configuration**
- ✅ **Zero-config setup**
- ✅ **Comprehensive testing**
- ✅ **AI-powered features**
- ✅ **Production-grade security**

**Start building amazing things!** 🚀

---

*Need help? Check our [troubleshooting guide](#-troubleshooting) or [open an issue](https://github.com/brendadeeznuts1111/syndicate-gov-ai-catalog-v3/issues/new).*
