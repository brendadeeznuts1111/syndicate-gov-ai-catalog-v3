# Bun Best Practices & Latest Features

## Overview

This guide covers the latest Bun features and best practices as documented in [bun.sh/docs](https://bun.sh/docs), specifically tailored for the Citadel project.

## 🚀 Performance Optimizations

### 1. Fast Package Management
```bash
# Use Bun's fast package manager
bun install                    # 3x faster than npm
bun add <package>              # Add dependencies
bun add -d <package>           # Add dev dependencies
bun install --frozen-lockfile  # CI/CD deterministic installs
```

### 2. Native Runtime Features
```typescript
// Use Bun's native APIs for better performance
import { file, serve } from 'bun';

// Fast file reading
const content = await file('config.yaml').text();

// High-performance HTTP server
serve({
  port: 3000,
  fetch(req) {
    return new Response('Hello from Bun!');
  }
});
```

### 3. Built-in TypeScript Support
```typescript
// No build step required - Bun runs TypeScript directly
// config/bun.yaml is parsed natively
import { YAML } from 'bun';

const config = YAML.parse(await file('config/bun.yaml').text());
```

## 🧪 Testing Best Practices

### 1. Native Test Runner
```bash
# Use Bun's Jest-compatible test runner
bun test                       # Run all tests
bun test --watch              # Watch mode for development
bun test --coverage           # Generate coverage reports
bun test --bail=3             # Bail after 3 failures
bun test --rerun-each=5       # Re-run tests to catch flakes
bun test --randomize          # Randomize test order
```

### 2. Configuration (bun.test.toml)
```toml
[test]
test_match = ["**/*.test.ts", "**/*.spec.ts"]
coverage = true
coverage_threshold = 80
reporter = ["dots", "junit"]
timeout = 30000
concurrency = 4

[ci]
coverage_threshold = 85
reporter = ["junit", "html"]
timeout = 60000
```

### 3. Snapshot Testing
```typescript
import { expect, test } from 'bun:test';

test('environment snapshot', () => {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
  };
  expect(env).toMatchSnapshot();
});

// Update snapshots: bun test --update-snapshots
```

## 🔒 Security & Reliability

### 1. Lockfile Management
```bash
# Ensure deterministic installs
bun install --frozen-lockfile  # Fails on lockfile mismatch

# Git diff for lockfiles
git config diff.bun.textconv 'bun bun.lockb --print'
```

### 2. Patching Dependencies
```bash
# Patch problematic dependencies
bun patch <package>            # Prepare for patching
# Edit node_modules/<package>
bun patch --commit <package>   # Generate patch file
```

### 3. Security Scanning
```bash
# Check for vulnerabilities
bun audit                      # Security audit
bun audit --fix               # Auto-fix where possible
```

## 🏗️ Build & Deployment

### 1. Native Bundling
```bash
# Bundle applications
bun build ./src/index.ts --outfile ./dist/bundle.js
bun build --compile ./src/index.ts --outfile ./app  # Standalone executable
```

### 2. Bytecode Caching
```bash
# Cache bytecode for faster startup
bun build --bytecode ./src/index.ts --outfile ./dist/cache.bc
```

### 3. Docker Optimization
```dockerfile
# Use official Bun images
FROM oven/bun:1.3.0-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
CMD ["bun", "test"]
```

## 🌐 Networking & I/O

### 1. Fast HTTP Client
```typescript
// Use Bun's fast fetch implementation
const response = await fetch('https://api.example.com', {
  method: 'POST',
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json' }
});
```

### 2. File System Operations
```typescript
// Use Bun's optimized file APIs
import { write } from 'bun';

// Atomic writes
await write('output.json', JSON.stringify(data));

// Streaming reads
const stream = file('large-file.log').stream();
```

### 3. WebSocket Support
```typescript
// Native WebSocket server
serve({
  websocket: {
    message(ws, message) {
      ws.send(`Echo: ${message}`);
    }
  }
});
```

## 🔧 Advanced Features

### 1. Shell Integration
```typescript
import { $ } from 'bun';

// Run shell commands safely
const result = await $`ls -la`.text();
await $`git commit -m "Auto commit"`.quiet();
```

### 2. SQL Database Support
```typescript
// Native SQL bindings (PostgreSQL, MySQL, SQLite)
import { Database } from 'bun:sqlite';

const db = new Database('data.db');
const results = db.query('SELECT * FROM users').all();
```

### 3. Plugin System
```typescript
// Extend Bun with plugins
import { plugin } from 'bun';

plugin({
  name: 'custom-loader',
  setup(build) {
    build.onLoad({ filter: /\.custom$/ }, (args) => {
      return { contents: 'export default "processed";' };
    });
  }
});
```

## 📊 Monitoring & Debugging

### 1. Built-in Metrics
```typescript
// Enable HTTP server metrics
serve({
  port: 3000,
  development: process.env.NODE_ENV === 'development',
  fetch(req) {
    // Metrics automatically collected
    return new Response('OK');
  }
});
```

### 2. Debugging Support
```bash
# Debug with VS Code or Web Inspector
bun --debug ./src/index.ts
bun --inspect ./src/index.ts
```

### 3. Memory Profiling
```typescript
// Generate heap snapshots
import { writeHeapSnapshot } from 'bun';
await writeHeapSnapshot('heap.snap');
```

## 🎯 Citadel-Specific Optimizations

### 1. Configuration Management
```typescript
// Use Bun's YAML support for config
const config = YAML.parse(await file('config/bun.yaml').text());

// Environment-specific configs
const env = process.env.NODE_ENV || 'development';
const envConfig = YAML.parse(await file(`config/${env}.yaml`).text());
```

### 2. AI Pipeline Integration
```typescript
// Fast file processing for AI suggester
const logs = await file('logs/access.ndjson').text();
const entries = logs.split('\n').filter(line => line.length > 0);
```

### 3. API Schema Generation
```typescript
// Use Bun's fast JSON processing
const schema = generateOpenAPI(config);
await write('docs/openapi.yaml', YAML.stringify(schema));
```

## 🚀 Production Checklist

### Performance
- [ ] Use `bun install --frozen-lockfile` in CI
- [ ] Enable bytecode caching for large applications
- [ ] Use native Bun APIs instead of Node.js polyfills
- [ ] Configure proper concurrency in tests

### Security
- [ ] Run `bun audit` regularly
- [ ] Use `bun patch` for security fixes
- [ ] Enable TLS in production servers
- [ ] Use Bun's secrets API for credentials

### Reliability
- [ ] Implement lockfile drift guards
- [ ] Use environment snapshots
- [ ] Configure test bail and rerun strategies
- [ ] Set up proper error handling

### Monitoring
- [ ] Enable built-in metrics
- [ ] Set up heap snapshot generation
- [ ] Configure proper logging
- [ ] Use Bun's debugging tools

## 📚 Additional Resources

- [Official Bun Documentation](https://bun.sh/docs)
- [Bun Runtime APIs](https://bun.sh/docs/runtime/bun-apis)
- [Testing with Bun](https://bun.sh/docs/test)
- [Package Manager](https://bun.sh/docs/pm/cli/install)
- [Bundler](https://bun.sh/docs/bundler/index)

## 🏆 Benefits for Citadel

- **3x faster** package installation
- **Native TypeScript** execution
- **Built-in testing** with coverage
- **High-performance** HTTP server
- **Zero-config** development
- **Optimized** for modern JavaScript/TypeScript

By following these best practices, Citadel leverages Bun's full potential for maximum performance and developer productivity. 🏰⚡
