// tests/async-leak.test.ts - Async-leak detector (≤10 lines)
import { expect, test } from 'bun:test';

test('no dangling timers', async () => {
  const before = process.getActiveResourcesInfo();
  await Bun.file('routes/_docs.ts').text(); // simple async operation
  await new Promise(r => setImmediate(r));    // let promises settle
  const after = process.getActiveResourcesInfo();
  expect(after.filter(r => r === 'Timeout').length)
    .toBe(before.filter(r => r === 'Timeout').length);
});
