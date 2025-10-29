# Testing with Bun Native Framework

## Overview

Citadel uses Bun's native testing framework for comprehensive test coverage, CI/CD integration, and enterprise-grade validation.

## Quick Start

```bash
# Run all tests with coverage
bun test --coverage

# Run tests in watch mode (development)
bun test --watch

# Run tests with specific reporter
bun test --reporter=junit

# Run specific test files
bun test tests/api.test.ts
```

## Test Scripts

| Script | Description |
|--------|-------------|
| `bun test` | Run all tests with default settings |
| `bun run bun:test` | Run tests with coverage and dots reporter |
| `bun run bun:test:watch` | Run tests in watch mode for development |
| `bun run bun:test:ci` | Run tests with CI configuration (junit + coverage) |
| `bun run bun:test:unit` | Run unit tests only |
| `bun run bun:test:integration` | Run integration tests only |
| `bun run bun:test:e2e` | Run end-to-end tests only |
| `bun run bun:test:coverage` | Run tests with coverage threshold enforcement |

## Test Structure

```
tests/
├── setup.ts              # Global test configuration and utilities
├── api.test.ts           # API routes and documentation tests
├── ai-suggester.test.ts  # AI suggester functionality tests
├── schema.test.ts        # OpenAPI schema generation tests
├── unit/                 # Unit tests (placeholder)
├── integration/          # Integration tests (placeholder)
├── e2e/                  # End-to-end tests (placeholder)
└── performance/          # Performance tests (placeholder)
```

## Configuration

### bun.test.toml

```toml
[test]
test_match = ["**/*.test.ts", "**/*.spec.ts"]
test_ignore = ["**/node_modules/**", "**/dist/**"]
coverage = true
coverage_dir = "./coverage"
coverage_threshold = 80
reporter = ["dots", "junit"]
preload = ["./tests/setup.ts"]
timeout = 30000
concurrency = 4
```

### Environment Variables

- `NODE_ENV=test` - Sets test environment
- `AI_HANDLER_WRITE=false` - Disables file writing in tests
- `JWT_SECRET=test-jwt-secret` - Test JWT secret
- `SESSION_SECRET=test-session-secret` - Test session secret

## Test Categories

### 1. API Tests (`tests/api.test.ts`)

- Documentation endpoints (`/_docs`, `/_redoc`, `/openapi.yaml`)
- Admin wand endpoints (`/wand/reload`, `/wand/diff`, `/wand/rollback`)
- Response validation and status codes
- Content-Type headers and response formats

### 2. AI Suggester Tests (`tests/ai-suggester.test.ts`)

- YAML configuration parsing
- Route filtering based on confidence scores
- Unique ID generation and idempotency
- Handler template generation
- Atomic file operations
- Feature flag handling
- Telemetry integration

### 3. Schema Tests (`tests/schema.test.ts`)

- OpenAPI specification structure
- Zod to OpenAPI type conversion
- Schema metadata and AI annotations
- Route registration and validation
- WebSocket route handling

## Mock Implementation

### Embedding Utilities

```typescript
mock.module('../src/ai/embedding', () => ({
  cosine: (a: number[], b: number[]) => 0.95,
  loadLogs: async () => [...mockLogs],
  vectorise: async () => [...mockVectors]
}));
```

### File System Operations

```typescript
export const mockFileSystem = {
  writeFile: mock(async (path: string, content: string) => {...}),
  readFile: mock(async (path: string) => {...}),
  exists: mock(async (path: string) => {...})
};
```

## Coverage

### Coverage Reports

- **HTML Report**: `coverage/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **Text Summary**: Console output
- **Threshold**: 80% (configurable)

### Coverage Commands

```bash
# Generate HTML coverage report
bun run bun:test:coverage:html

# Generate JSON coverage report
bun run bun:test:coverage:json

# Enforce coverage threshold
bun run bun:test:coverage
```

## CI/CD Integration

### GitHub Actions

The test suite is integrated into `.github/workflows/bun-ci.yml`:

```yaml
- name: Run Bun Native Tests
  run: bun run bun:test:ci

- name: Upload Coverage Reports
  uses: actions/upload-artifact@v4
  with:
    name: coverage-reports
    path: |
      coverage/
      test-reports/
```

### CI Configuration

- **Timeout**: 60 seconds
- **Reporters**: JUnit (for CI), HTML (for artifacts)
- **Coverage Threshold**: 85% (CI-specific)
- **Concurrency**: 2 (CI-specific)

## Best Practices

### 1. Test Organization

```typescript
describe('Feature Category', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### 2. Mock Usage

```typescript
// Mock external dependencies
const mockFetch = mock(() => Promise.resolve({ ok: true }));
global.fetch = mockFetch;

// Restore mocks after test
afterEach(() => {
  mock.restore();
});
```

### 3. Test Data

```typescript
export const testData = {
  validConfig: { /* ... */ },
  invalidConfig: { /* ... */ },
  mockLogs: [ /* ... */ ],
  mockVectors: [ /* ... */ ]
};
```

## Performance Testing

### Timeout Configuration

- **Default**: 30 seconds
- **Performance Tests**: 120 seconds
- **CI Environment**: 60 seconds

### Concurrency

- **Development**: 4 concurrent tests
- **CI Environment**: 2 concurrent tests

## Debugging

### Verbose Output

```bash
# Run tests with detailed output
bun test --reporter=dots

# Run specific test with debugging
bun test tests/api.test.ts --reporter=dots
```

### Test Utilities

```typescript
// Create mock responses
export const createMockResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

// Create mock requests
export const createMockRequest = (path: string, method = 'GET', body?: any) => {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new Request(`http://localhost:3000${path}`, init);
};
```

## Continuous Integration

### Test Pipeline

1. **Install Dependencies** - `bun install --frozen-lockfile`
2. **Run Tests** - `bun run bun:test:ci`
3. **Upload Coverage** - Coverage reports as artifacts
4. **Validate Results** - Coverage thresholds enforced

### Coverage Badges

Add coverage badges to README.md:

```markdown
![Coverage](./coverage/badge.svg)
```

## Troubleshooting

### Common Issues

1. **Mock Conflicts**: Use `mock.restore()` in `afterEach`
2. **Async Timeouts**: Increase timeout for slow tests
3. **Coverage Thresholds**: Adjust thresholds in `bun.test.toml`
4. **Import Errors**: Check mock module paths

### Debug Commands

```bash
# Run tests with Node.js inspector
bun --inspect test

# Run tests with verbose logging
DEBUG=* bun test
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Include proper mocks for external dependencies
4. Ensure coverage thresholds are maintained
5. Add test data to shared utilities when applicable

## Resources

- [Bun Testing Documentation](https://bun.sh/docs/test)
- [Jest Matchers](https://jestjs.io/docs/using-matchers) (compatible)
- [Coverage Configuration](https://bun.sh/docs/test#coverage)
