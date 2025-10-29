// tests/advanced-bun-features.test.ts - Demonstrating Latest Bun Test Features
import { 
  test, 
  expect, 
  describe, 
  beforeAll, 
  afterAll, 
  beforeEach, 
  afterEach,
  setSystemTime
} from 'bun:test';
import { testUtils, mockTime, TEST_CONSTANTS } from './setup';

describe('Advanced Bun Testing Features', () => {
  // Mock clock demonstration
  describe('Mock Clock Features', () => {
    test('deterministic time testing', () => {
      const now = new Date();
      expect(now.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    });

    test('time advancement in tests', () => {
      mockTime.advance(3600000); // Advance 1 hour
      const now = new Date();
      expect(now.toISOString()).toBe('2024-01-01T01:00:00.000Z');
    });

    test('set specific time for tests', () => {
      mockTime.setTo('2024-12-25T00:00:00.000Z');
      const now = new Date();
      expect(now.toISOString()).toBe('2024-12-25T00:00:00.000Z');
    });
  });

  // Utility functions demonstration
  describe('Bun Utility Functions', () => {
    test('sleep utility for async tests', async () => {
      const start = performance.now();
      await testUtils.sleep(100);
      const end = performance.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });

    test('UUID generation', () => {
      const uuid1 = testUtils.generateUUID();
      const uuid2 = testUtils.generateUUID();
      expect(uuid1).toMatch(/^[0-9a-f-]{36}$/);
      expect(uuid2).toMatch(/^[0-9a-f-]{36}$/);
      expect(uuid1).not.toBe(uuid2);
    });

    test('deep equality check', () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const obj3 = { a: 1, b: { c: 3 } };
      
      expect(obj1).toEqual(obj2);
      expect(obj1).not.toEqual(obj3);
    });

    test('password hashing and verification', async () => {
      const password = 'test-password-123';
      const hash = await testUtils.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(await testUtils.verifyPassword(password, hash)).toBe(true);
      expect(await testUtils.verifyPassword('wrong-password', hash)).toBe(false);
    });
  });

  // File utilities demonstration
  describe('Bun File Utilities', () => {
    test('file operations', async () => {
      const testContent = JSON.stringify({ test: 'data' });
      const testPath = './tmp/test-file.json';
      
      // Write file
      await testUtils.file.write(testPath, testContent);
      
      // Check file exists
      const exists = await testUtils.file.exists(testPath);
      expect(exists).toBe(true);
      
      // Read text
      const textContent = await testUtils.file.readText(testPath);
      expect(textContent).toBe(testContent);
      
      // Read JSON
      const jsonContent = await testUtils.file.readJSON(testPath);
      expect(jsonContent).toEqual({ test: 'data' });
      
      // Cleanup
      await Bun.write(testPath, ''); // Clean up
    });
  });

  // Per-test timeout demonstration
  describe('Per-Test Timeouts', () => {
    test('test with custom timeout', async () => {
      // This test has a 10 second timeout
      await testUtils.sleep(100);
      expect(true).toBe(true);
    }, 10000);

    test('fast test with short timeout', () => {
      expect(true).toBe(true);
    }, 1000);
  });

  // Snapshot testing with utilities
  describe('Advanced Snapshot Testing', () => {
    test('snapshot with generated data', () => {
      const data = {
        id: 'test-uuid-fixed', // Fixed UUID for snapshot consistency
        timestamp: Date.now(),
        config: TEST_CONSTANTS.SAMPLE_CONFIG
      };
      expect(data).toMatchSnapshot();
    });

    test('snapshot file operations', async () => {
      const fileData = {
        content: 'test content',
        size: 12,
        encoding: 'utf8'
      };
      expect(fileData).toMatchSnapshot();
    });
  });

  // Error handling and edge cases
  describe('Error Handling', () => {
    test('handles file not found gracefully', async () => {
      try {
        await testUtils.file.readText('./non-existent-file.txt');
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    test('handles invalid JSON gracefully', async () => {
      const invalidJsonPath = './tmp/invalid.json';
      await testUtils.file.write(invalidJsonPath, '{ invalid json }');
      
      try {
        await testUtils.file.readJSON(invalidJsonPath);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
      
      // Cleanup
      await Bun.write(invalidJsonPath, '');
    });
  });

  // Performance testing utilities
  describe('Performance Testing', () => {
    test('measure execution time', async () => {
      const start = performance.now();
      await testUtils.sleep(50);
      const end = performance.now();
      
      expect(end - start).toBeGreaterThanOrEqual(50);
      expect(end - start).toBeLessThan(200); // Should be close to 50ms
    });

    test('benchmark utility function', () => {
      const iterations = 1000;
      const start = performance.now();
      
      for (let i = 0; i < iterations; i++) {
        testUtils.generateUUID();
      }
      
      const end = performance.now();
      const avgTime = (end - start) / iterations;
      
      // UUID generation should be fast (< 1ms per generation)
      expect(avgTime).toBeLessThan(1);
    });
  });
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up any test files
  const testFiles = ['./tmp/test-file.json', './tmp/invalid.json'];
  for (const file of testFiles) {
    try {
      await Bun.write(file, '');
    } catch {
      // Ignore cleanup errors
    }
  }
});
