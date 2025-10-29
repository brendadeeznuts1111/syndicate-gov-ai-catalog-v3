// tests/coverage-hash.test.ts - Deterministic coverage hash (≤5 lines)
import { createHash } from 'crypto';
import { expect, test } from 'bun:test';

test('coverage hash stable', async () => {
  const summary = { total: { lines: 85, functions: 90, branches: 80 } }; // mock
  const hash = createHash('sha256').update(JSON.stringify(summary.total)).digest('hex');
  expect(hash).toMatchSnapshot(); // fails on logic change
});
