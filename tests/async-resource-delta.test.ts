// tests/async-resource-delta.test.ts - Async-resource delta (≤15 lines)
import { expect, test } from 'bun:test';

test('async resource delta zero', async () => {
  const before = process.getActiveResourcesInfo().reduce((a, c) => (a[c] = (a[c] || 0) + 1, a), {} as Record<string, number>);
  await Bun.file('routes/_docs.ts').text(); // simple async operation
  await new Promise(r => setImmediate(r));
  const after = process.getActiveResourcesInfo().reduce((a, c) => (a[c] = (a[c] || 0) + 1, a), {} as Record<string, number>);
  Object.keys(after).forEach(k => expect(after[k] - (before[k] || 0)).toBe(0));
});
