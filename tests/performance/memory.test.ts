// tests/memory.test.ts - Memory-leak detector (≤15 lines)
import { expect, test, afterAll } from 'bun:test';

test('no handler leak', async () => {
  const before = process.memoryUsage().heapUsed;
  await import('../routes/_docs.ts'); // any handler
  global.gc?.();                                 // force GC if --smol
  const after = process.memoryUsage().heapUsed;
  expect(after - before).toBeLessThan(2 * 1024 * 1024); // < 2 MB delta
});
