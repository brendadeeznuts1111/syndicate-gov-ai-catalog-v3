# 📚 Citadel Reference Documentation - Variables & Constants

## 🏷️ Environment Variables [#REF]

### Core Citadel Settings
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CITADEL_TELEMETRY_URL` | `string \| undefined` | `https://telemetry.citadel.sh` | Telemetry endpoint URL |
| `CITADEL_AGE_KEY` | `string \| undefined` | - | Age encryption key for `.env.citadel` |
| `CITADEL_VERSION` | `string \| undefined` | `1.15.0` | Citadel version identifier |
| `NODE_ENV` | `string` | `development` | Node.js environment mode |

### AI & Testing Configuration
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `AI_HANDLER_WRITE` | `'true' \| 'false' \| undefined` | `false` | Enable AI write operations |
| `CLAUDECODE` | `'1' \| undefined` | `1` | AI-quiet mode flag |
| `DO_NOT_TRACK` | `'1' \| undefined` | `1` | Disable telemetry/crash reports |
| `BUN_TEST_TIMEOUT` | `string \| undefined` | `30000` | Test timeout in milliseconds |
| `BUN_TEST_MAX_CONCURRENCY` | `string \| undefined` | `8` | Maximum concurrent test threads |
| `BUN_TEST_RERUN_EACH` | `string \| undefined` | `3` | Test retry count |

### Database & Infrastructure
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DB_URL` | `string \| undefined` | `postgres://citadel@localhost:5432/citadel_v3` | Database connection URL |
| `DB_HOST` | `string \| undefined` | `localhost` | Database host |
| `DB_PORT` | `string \| undefined` | `5432` | Database port |
| `DB_USER` | `string \| undefined` | `citadel` | Database username |
| `DB_NAME` | `string \| undefined` | `citadel_v3` | Database name |

### Performance & Runtime
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `BUN_MAX_THREADS` | `string \| undefined` | `4` | Maximum worker threads |
| `BUN_OPTIONS` | `string \| undefined` | `--optimize --minify` | Bun runtime options |
| `BUN_CONFIG_MAX_HTTP_REQUESTS` | `string \| undefined` | `256` | Max concurrent HTTP requests |
| `BUN_RUNTIME_TRANSPILER_CACHE_PATH` | `string \| undefined` | - | Transpiler cache path |

### Security & Privacy
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_TLS_REJECT_UNAUTHORIZED` | `'0' \| '1' \| undefined` | `1` | SSL certificate validation |
| `FORCE_COLOR` | `'1' \| undefined` | `1` | Force ANSI color output |
| `NO_COLOR` | `'1' \| undefined` | - | Disable ANSI color output |

### Feature Flags
| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CITADEL_EXPERIMENTAL_AI` | `'1' \| undefined` | `1` | Enable experimental AI features |
| `CITADEL_QUANTUM_SAFE` | `'1' \| undefined` | `1` | Enable quantum-safe cryptography |
| `CITADEL_CONCURRENT_TESTING` | `'1' \| undefined` | `1` | Enable concurrent testing |
| `CITADEL_ACCOUNTING` | `'0' \| '1' \| undefined` | `0` | Enable accounting mode |
| `CITADEL_RUNTIME_STRESS` | `'0' \| '1' \| undefined` | `0` | Enable stress testing mode |

---

## 🔧 Configuration Constants [#REF]

### Test Priorities
```typescript
export const TEST_PRIORITIES = {
  critical: ['security', 'auth', 'database', 'api-gate'],
  high: ['integration', 'ci-gate', 'compliance'],
  medium: ['unit', 'matrix', 'performance'],
  low: ['snapshots', 'configs']
} as const;
```

### Failure Patterns
```typescript
export const FAILURE_PATTERNS = {
  flaky: /flaky|intermittent|unstable/i,
  timeout: /timeout|timed out/i,
  memory: /memory|leak|gc|heap/i,
  network: /network|connection|timeout/i,
  database: /database|postgres|redis|sqlite/i
} as const;
```

### Package Templates
```typescript
export const TEMPLATES = {
  'bun-package': 'Bun package template',
  'typescript-lib': 'TypeScript library template',
  'web-app': 'Web application template',
  'api-service': 'API service template'
} as const;
```

---

## 📊 Interface Definitions [#REF]

### Environment Interface
```typescript
declare module 'bun' {
  interface Env {
    // Core Citadel settings
    CITADEL_TELEMETRY_URL?: string;
    CITADEL_AGE_KEY?: string;
    CITADEL_VERSION?: string;
    
    // AI & Testing configuration
    AI_HANDLER_WRITE?: 'true' | 'false';
    CLAUDECODE?: '1';
    DO_NOT_TRACK?: '1';
    
    // Database & Infrastructure
    DB_URL?: string;
    DB_HOST?: string;
    DB_PORT?: string;
    DB_USER?: string;
    DB_NAME?: string;
    
    // Performance & Runtime
    BUN_MAX_THREADS?: string;
    BUN_TEST_TIMEOUT?: string;
    BUN_TEST_MAX_CONCURRENCY?: string;
    
    // Security
    NODE_TLS_REJECT_UNAUTHORIZED?: '0' | '1';
  }
}
```

### Test Result Interface
```typescript
export interface TestResult {
  file: string;
  category: string;
  passed: boolean;
  duration?: number;
  error?: string;
  timestamp: Date;
}
```

### Test Analytics Interface
```typescript
export interface TestAnalytics {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  categories: Record<string, {
    total: number;
    passed: number;
    failed: number;
    avgDuration: number;
  }>;
  failurePatterns: Record<string, number>;
  trends: {
    improvement: boolean;
    coverage: number;
    avgDuration: number;
  };
}
```

---

## 🚀 Package Scripts [#REF]

### Environment Management
| Script | Command | Description |
|--------|---------|-------------|
| `🔓 env:unlock` | `bun run scripts/env-unlock.ts` | Decrypt environment files |
| `🔧 env:check` | `bun run scripts/env-check-v2.sh` | Validate environment setup |
| `📊 telemetry` | `bun run scripts/telemetry.ts` | Send telemetry data |
| `🏰 citadel:bootstrap` | `bun run scripts/citadel-bootstrap.ts` | System validation |

### Testing Commands
| Script | Command | Description |
|--------|---------|-------------|
| `🧪 bun:test:types` | `bun test ./tests/types.test.ts` | Type safety tests |
| `🧪 bun:test:ai-quiet` | `CLAUDECODE=1 bun test --only-failures --pass-with-no-tests` | AI-quiet mode testing |
| `🧪 bun:test:concurrent` | `bun test ./tests/concurrent-matrix.test.ts --max-concurrency=8` | Concurrent matrix testing |
| `🧪 bun:test:serial` | `bun test ./tests/accounting-serial.test.ts` | Serial test execution |

### Performance Commands
| Script | Command | Description |
|--------|---------|-------------|
| `⚡ bun:performance` | `BUN_MAX_THREADS=4 bun run dev` | Performance mode |
| `🔧 bun:full-optimized` | `BUN_OPTIONS="--optimize --minify" BUN_MAX_THREADS=4 bun run prod` | Full optimization |
| `📦 bun:build-executable` | `bun build --compile ./src/main.ts --outfile citadel-app` | Build executable |

---

## 📁 File Structure Constants [#REF]

### Test Directories
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests  
- `tests/performance/` - Performance tests
- `tests/matrix/` - Matrix tests
- `tests/snapshots/` - Snapshot tests

### Configuration Files
- `bun.test.toml` - Test configuration
- `.env.example` - Environment template
- `src/env.d.ts` - TypeScript environment types
- `scripts/env-unlock.ts` - Environment unlock implementation

### Scripts Directory
- `scripts/env-unlock.ts` - Environment decryption
- `scripts/telemetry.ts` - Telemetry handling
- `scripts/citadel-bootstrap.ts` - System bootstrap
- `scripts/demo.ts` - Demo script

---

## 🔗 Cross-References [#REF]

### Related Documentation
- [Environment Setup](./GETTING-STARTED.md#environment-setup)
- [Testing Guide](../04-testing/TESTING-GUIDE.md)
- [Configuration Reference](../03-configuration/CONFIG-REFERENCE.md)
- [Security Documentation](../03-quantum-security/README.md)
- [Bun Native Deployment](./GETTING-STARTED.md#-native-bun-deployment)

### Implementation Files
- `src/env.d.ts` - Environment type definitions
- `scripts/env-unlock.ts` - Environment unlock implementation
- `test/env.test.ts` - Environment validation tests
- `package.json` - Package scripts and configuration

---

*Last updated: v1.15-env-locked*  
*Generated automatically from source code*
