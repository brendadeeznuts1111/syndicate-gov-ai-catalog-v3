// tests/gc-pressure.test.ts - GC-pressure-per-test (≤10 lines)
import { expect, test } from 'bun:test';

test('GC pressure ≤ 15 %', () => {
  const memBefore = process.memoryUsage.rss();
  for (let i = 0; i < 1_000; i++) {
    new Array(1_000).fill(Math.random()); // churn
  }
  global.gc?.();
  const memAfter = process.memoryUsage.rss();
  const pct = (memAfter - memBefore) / memBefore * 100;
  expect(pct).toBeLessThan(15);           // < 15 % residual
});
