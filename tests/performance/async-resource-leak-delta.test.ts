// tests/async-resource-leak-delta.test.ts - Async-resource-leak-delta (≤12 lines)
import { expect, test, beforeEach, afterEach } from 'bun:test';

let beforeCount: number;
beforeEach(() => {
  beforeCount = process.getActiveResourcesInfo().length;
});

test('async resource delta ≤ 2', async () => {
  const timer = setInterval(() => {}, 1000);
  clearInterval(timer);
  const afterCount = process.getActiveResourcesInfo().length;
  expect(afterCount - beforeCount).toBeLessThanOrEqual(2);
});

afterEach(() => {
  const current = process.getActiveResourcesInfo().length;
  if (current > beforeCount) {
    console.warn(`⚠️  Async leak: ${current - beforeCount} resources still active`);
  }
});
