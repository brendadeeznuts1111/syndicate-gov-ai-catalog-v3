# 🚀 Bun Runtime Optimization Guide

## Overview

Citadel leverages Bun v1.3's advanced runtime features including default CLI arguments, custom User-Agent configuration, preload scripts, and SQL optimization for maximum performance and developer productivity.

## 🚀 Quick Start

### 1. Development with Hot Reload
```bash
bun run bun:dev
```
Equivalent to: `BUN_OPTIONS="--watch --hot" bun run dev`

### 2. Production Build
```bash
bun run bun:prod
```
Equivalent to: `BUN_OPTIONS="--optimize --minify" bun run build`

### 3. Testing with Coverage
```bash
bun run bun:test
```
Equivalent to: `BUN_OPTIONS="--coverage --reporter=verbose" bun run test`

### 4. Full Optimization
```bash
bun run bun:full-optimized
```
Combines all optimizations for production deployment

## 🔧 Configuration

### `config/bun.yaml` Runtime Section

```yaml
bun:
  # Default CLI Arguments
  options:
    development: "--watch --hot --verbose"
    production: "--optimize --minify"
    testing: "--coverage --reporter=verbose"
    
  # Custom User-Agent
  userAgent:
    default: "Citadel/${APP_VERSION:3.0.0} (Bun-${BUN_VERSION:1.3.0})"
    fetch: "Citadel-Fetch/${APP_VERSION:3.0.0}"
    auth: "Citadel-Auth/${APP_VERSION:3.0.0}"
    
  # Preload Scripts
  preload:
    enabled: true
    scripts:
      - "./scripts/preload/setup.ts"
      - "./scripts/preload/database.ts"
      - "./scripts/preload/auth.ts"
    environment: "BUN_INSPECT_PRELOAD"
    
  # SQL Optimization
  sql:
    preconnect:
      enabled: true
      databaseUrl: "${DATABASE_URL}"
      flag: "--sql-preconnect"
    pool:
      min: 2
      max: 10
      idleTimeout: 30000
      
  # Performance Optimizations
  performance:
    memory:
      maxHeap: "2GB"
      gcThreshold: 0.8
    threads:
      max: "${BUN_MAX_THREADS:4}"
      workerPool: true
    cache:
      enabled: true
      directory: "./.bun/cache"
      maxSize: "500MB"
```

## 🎯 BUN_OPTIONS Environment Variable

Set default CLI arguments that apply to all Bun commands:

### Development Configuration
```bash
export BUN_OPTIONS="--watch --hot --verbose"
bun run dev
# Equivalent to: bun --watch --hot --verbose run dev
```

### Production Configuration
```bash
export BUN_OPTIONS="--optimize --minify"
bun run build
# Equivalent to: bun --optimize --minify run build
```

### Testing Configuration
```bash
export BUN_OPTIONS="--coverage --reporter=verbose"
bun run test
# Equivalent to: bun --coverage --reporter=verbose run test
```

### Available Scripts
```bash
bun run bun:dev           # Development with hot reload
bun run bun:prod          # Production build
bun run bun:test          # Testing with coverage
bun run bun:preload       # With preload scripts
bun run bun:sql-preconnect # With SQL preconnect
bun run bun:custom-agent  # With custom User-Agent
bun run bun:performance   # Performance optimized
bun run bun:full-optimized # Full optimization suite
```

## 🌐 Custom User-Agent Configuration

Set custom User-Agent for fetch() requests:

### Default User-Agent
```bash
export BUN_USER_AGENT="Citadel/3.0.0 (Bun-1.3.0)"
bun run app.ts
```

### Context-Specific User-Agents
```typescript
// Authentication requests
const authResponse = await fetch('https://api.example.com/auth', {
  headers: {
    'User-Agent': 'Citadel-Auth/3.0.0'
  }
});

// API requests
const apiResponse = await fetch('https://api.example.com/data', {
  headers: {
    'User-Agent': 'Citadel-Fetch/3.0.0'
  }
});
```

### Command Line Flag
```bash
bun --user-agent="MyApp/1.0" run app.ts
```

## 📦 Preload Scripts

Load scripts before running your main application using `BUN_INSPECT_PRELOAD`:

### Environment Variable Method
```bash
export BUN_INSPECT_PRELOAD="./scripts/preload/setup.ts"
bun run app.ts
# Equivalent to: bun --preload ./scripts/preload/setup.ts run app.ts
```

### Multiple Preload Scripts
```bash
export BUN_INSPECT_PRELOAD="./scripts/preload/setup.ts,./scripts/preload/database.ts,./scripts/preload/auth.ts"
bun run app.ts
```

### Available Preload Scripts

#### 1. Setup Preload (`scripts/preload/setup.ts`)
- DNS prefetching for critical hosts
- Preconnect to essential services
- Environment initialization
- Configuration validation

```bash
bun run scripts/preload/setup.ts
```

#### 2. Database Preload (`scripts/preload/database.ts`)
- Database connection initialization
- Connection pooling setup
- Migration execution
- Health checks and optimization

```bash
bun run scripts/preload/database.ts
```

#### 3. Authentication Preload (`scripts/preload/auth.ts`)
- JWT configuration validation
- Secret generation and management
- CSRF protection initialization
- Security middleware setup

```bash
bun run scripts/preload/auth.ts
```

## 🗄️ SQL Optimization

### PostgreSQL Preconnect
Establish database connection at startup to reduce first-query latency:

```bash
export DATABASE_URL="postgres://localhost/mydb"
bun --sql-preconnect run app.ts
```

### Connection Pooling Configuration
```yaml
sql:
  preconnect:
    enabled: true
    databaseUrl: "${DATABASE_URL}"
    flag: "--sql-preconnect"
  pool:
    min: 2
    max: 10
    idleTimeout: 30000
```

### Database Support
- **PostgreSQL**: Full preconnect and pooling support
- **SQLite**: Optimization and health checks
- **MySQL**: Basic connection optimization
- **Redis**: Session storage and caching

## ⚡ Performance Optimizations

### Memory Management
```yaml
performance:
  memory:
    maxHeap: "2GB"
    gcThreshold: 0.8
```

### Threading Configuration
```bash
export BUN_MAX_THREADS=4
bun run app.ts
```

### Compilation Cache
```yaml
performance:
  cache:
    enabled: true
    directory: "./.bun/cache"
    maxSize: "500MB"
```

## 🧪 Development Workflow

### 1. Setup Environment
```bash
# Copy environment template
cp .env.example .env

# Generate secrets
bun run auth:setup

# Validate configuration
bun run auth:validate
```

### 2. Development Mode
```bash
# Start with hot reload and preload
bun run bun:preload

# Start with SQL preconnect
bun run bun:sql-preconnect

# Start with full optimization
bun run bun:full-optimized
```

### 3. Testing
```bash
# Run tests with coverage
bun run bun:test

# Test network optimization
bun run network:benchmark

# Test authentication
bun run auth:test
```

### 4. Production Deployment
```bash
# Build optimized version
bun run bun:prod

# Deploy with all optimizations
bun run bun:full-optimized
```

## 📊 Performance Monitoring

### Runtime Metrics
```typescript
// Monitor memory usage
const memoryUsage = process.memoryUsage();
console.log(`Memory: ${memoryUsage.heapUsed / 1024 / 1024}MB`);

// Monitor thread usage
const threadCount = process.env.BUN_MAX_THREADS || '4';
console.log(`Threads: ${threadCount}`);

// Monitor cache performance
const cacheStats = await getCacheStats();
console.log(`Cache hit rate: ${cacheStats.hitRate}%`);
```

### Benchmarking
```bash
# Network performance benchmark
bun run network:performance

# Full system benchmark
bun run benchmark:all

# Database performance test
bun run scripts/preload/database.ts
```

## 🔧 Environment Variables

### Core Runtime Variables
```bash
# CLI Options
BUN_OPTIONS="--watch --hot --verbose"

# Preload Scripts
BUN_INSPECT_PRELOAD="./scripts/preload/setup.ts"

# Performance
BUN_MAX_THREADS=4
BUN_USER_AGENT="Citadel/3.0.0"

# Database
DATABASE_URL="postgres://localhost/mydb"

# Memory
BUN_HEAP_SIZE="2GB"
BUN_GC_THRESHOLD="0.8"
```

### Application Variables
```bash
# Version
APP_VERSION="3.0.0"
BUN_VERSION="1.3.0"

# Environment
NODE_ENV="development"
PORT="3000"
HOST="localhost"

# Security
JWT_SECRET="your-secret-key"
SESSION_SECRET="your-session-secret"
CSRF_SECRET="your-csrf-secret"
```

## 🚀 Production Best Practices

### 1. Optimize Build
```bash
export BUN_OPTIONS="--optimize --minify"
export BUN_MAX_THREADS=4
bun run build
```

### 2. Enable All Optimizations
```bash
export DATABASE_URL="postgres://prod-db:5432/citadel"
export BUN_INSPECT_PRELOAD="./scripts/preload/setup.ts,./scripts/preload/database.ts,./scripts/preload/auth.ts"
bun --sql-preconnect --user-agent="Citadel/3.0.0" run prod
```

### 3. Monitor Performance
```typescript
// Performance monitoring middleware
app.use((req, res, next) => {
  const start = performance.now();
  next();
  const duration = performance.now() - start;
  console.log(`${req.method} ${req.path}: ${duration.toFixed(2)}ms`);
});
```

### 4. Health Checks
```bash
# Database health
bun run scripts/preload/database.ts

# Authentication health
bun run scripts/preload/auth.ts

# Network health
bun run network:stats
```

## 🎯 Advanced Usage

### Custom Preload Scripts
```typescript
// scripts/preload/custom.ts
console.log('🔧 Custom preload script');

// Initialize custom services
await initializeCustomServices();

// Setup custom middleware
setupCustomMiddleware();

export { initializeCustomServices, setupCustomMiddleware };
```

### Dynamic Configuration
```typescript
// Dynamic bun configuration based on environment
const bunConfig = {
  options: process.env.NODE_ENV === 'production' 
    ? '--optimize --minify' 
    : '--watch --hot --verbose',
  userAgent: `Citadel/${process.env.APP_VERSION}`,
  preload: process.env.NODE_ENV === 'production' 
    ? './scripts/preload/production.ts'
    : './scripts/preload/development.ts'
};
```

### Performance Profiling
```bash
# Enable performance profiling
export BUN_PROFILING=true
bun run app.ts

# Generate flame graph
bun --profile run app.ts
```

### Standalone Executable Control

Bun v1.3 introduces the `BUN_BE_BUN` environment variable for standalone executables created with `bun build --compile`:

#### Building Standalone Executables
```bash
# Build an executable
bun build --compile ./app.ts --outfile myapp

# Run the embedded app (default behavior)
./myapp

# Run Bun itself, ignoring the embedded app
BUN_BE_BUN=1 ./myapp --version
```

#### Configuration
```yaml
bun:
  standalone:
    beBun:
      enabled: true
      description: "Run Bun binary instead of embedded entry point"
      usage: "BUN_BE_BUN=1 ./myapp --version"
```

#### Available Scripts
```bash
bun run bun:build-executable    # Build standalone executable
bun run bun:run-binary         # Run with BUN_BE_BUN=1
bun run bun:executable-demo   # Build and demonstrate
bun run standalone:build       # Build demo executable
bun run standalone:demo        # Full demonstration
bun run standalone:run-bun     # Run Bun binary
bun run standalone:cleanup     # Clean up demo files
```

#### Use Cases
- **Debugging**: Access Bun CLI features from within executable
- **Version Checking**: Verify Bun version in production
- **Testing**: Test different Bun configurations
- **Development**: Debug embedded application issues

#### Demo Script
```typescript
// scripts/standalone-demo.ts demonstrates BUN_BE_BUN functionality
await buildExecutable();           // Build standalone executable
await runEmbeddedApp();           // Run embedded application
await runBunBinary();             // Run Bun binary instead
await demonstrateUsage();         // Show both behaviors
```
