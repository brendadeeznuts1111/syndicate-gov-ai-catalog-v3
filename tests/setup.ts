// tests/setup.ts - Global Test Setup
import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';

// Global test configuration
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.AI_HANDLER_WRITE = 'false';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.SESSION_SECRET = 'test-session-secret';
  
  // AI-friendly quiet mode - only show failures
  if (process.env.CLAUDECODE === '1') {
    global.console = {
      ...console,
      log: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
    };
  } else {
    // Normal test mode - mock console methods to reduce noise
    global.console = {
      ...console,
      log: mock(() => {}),
      info: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
    };
  }
});

afterAll(async () => {
  // Cleanup test environment
  delete process.env.NODE_ENV;
  delete process.env.AI_HANDLER_WRITE;
  delete process.env.JWT_SECRET;
  delete process.env.SESSION_SECRET;
});

beforeEach(() => {
  // Reset mocks before each test
  mock.restore();
});

afterEach(() => {
  // Cleanup after each test
  mock.restore();
});

// Global test utilities
export const createMockResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const createMockRequest = (path: string, method = 'GET', body?: any) => {
  const init: RequestInit = { method };
  if (body) {
    init.body = JSON.stringify(body);
    init.headers = { 'Content-Type': 'application/json' };
  }
  return new Request(`http://localhost:3000${path}`, init);
};

// Mock file system utilities
export const mockFileSystem = {
  writeFile: mock(async (path: string, content: string) => {
    // Mock file write
    return Promise.resolve();
  }),
  readFile: mock(async (path: string) => {
    // Mock file read
    return Promise.resolve('mock file content');
  }),
  exists: mock(async (path: string) => {
    // Mock file exists check
    return Promise.resolve(false);
  })
};

// Global test data
export const testConfig = {
  api: {
    basePath: '/api',
    version: '1.3.0',
    routes: [
      {
        path: '/config/{hash}',
        method: 'GET',
        id: 'get-config-by-hash',
        handler: './routes/config/get-by-hash.ts'
      }
    ]
  },
  ai: {
    suggester: {
      enabled: true,
      logGlob: './test-logs.ndjson',
      minConfidence: 0.88,
      maxNewPerRun: 5
    }
  }
};

export const mockLogs = [
  { method: 'GET', path: '/api/v1/users', status: 200, timestamp: Date.now() },
  { method: 'POST', path: '/api/v1/config', status: 201, timestamp: Date.now() },
  { method: 'GET', path: '/api/v1/analytics', status: 200, timestamp: Date.now() }
];

export const mockVectors = [
  { path: '/api/v1/users/audit', method: 'GET', score: 0.92 },
  { path: '/api/v1/analytics/export', method: 'POST', score: 0.89 },
  { path: '/api/v1/dashboard/metrics', method: 'GET', score: 0.95 }
];
