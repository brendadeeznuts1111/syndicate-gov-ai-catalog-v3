// tests/setup.ts - Global Test Setup (Latest Bun Features)
import { beforeAll, afterAll, beforeEach, afterEach, mock, setSystemTime } from 'bun:test';

// Global test configuration
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.AI_HANDLER_WRITE = 'false';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.SESSION_SECRET = 'test-session-secret';
  
  // Set deterministic time for time-based tests
  setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  
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
  
  // Reset system time
  setSystemTime();
});

beforeEach(() => {
  // Reset mocks before each test
  mock.restore();
});

afterEach(() => {
  // Cleanup after each test
  mock.restore();
});

// Global test utilities (Latest Bun Features)
export const testUtils = {
  // Sleep utility for async tests
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test UUIDs using Bun's built-in crypto
  generateUUID: () => crypto.randomUUID(),
  
  // Deep equality check using Bun's built-in function
  deepEqual: (a: any, b: any) => {
    try {
      expect(a).toEqual(b);
      return true;
    } catch {
      return false;
    }
  },
  
  // Password hashing utility
  hashPassword: async (password: string) => {
    return await Bun.password.hash(password);
  },
  
  // Password verification utility
  verifyPassword: async (password: string, hash: string) => {
    return await Bun.password.verify(password, hash);
  },
  
  // File utilities using Bun's fast file API
  file: {
    readText: async (path: string) => await Bun.file(path).text(),
    readJSON: async (path: string) => await Bun.file(path).json(),
    write: async (path: string, content: string | Uint8Array) => await Bun.write(path, content),
    exists: async (path: string) => await Bun.file(path).exists()
  }
};

// Mock time utilities
export const mockTime = {
  now: () => Date.now(),
  advance: (ms: number) => {
    const currentTime = new Date(Date.now() + ms);
    setSystemTime(currentTime);
  },
  setTo: (date: Date | string) => {
    setSystemTime(new Date(date));
  }
};

// Test constants
export const TEST_CONSTANTS = {
  TEST_PORT: 3001,
  TEST_TIMEOUT: 5000,
  MOCK_API_URL: 'http://localhost:3001',
  SAMPLE_CONFIG: {
    api: { version: '1.3.0' },
    ai: { suggester: { enabled: true } }
  }
} as const;

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
