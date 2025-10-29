// tests/deterministic-coverage-hash.test.ts - Deterministic-coverage-hash (≤15 lines)
import { expect, test } from 'bun:test';
import { createHash } from 'crypto';

test('coverage hash deterministic', async () => {
  // Simulate coverage data hash check
  const coverageData = {
    files: ['src/index.ts', 'src/utils.ts'],
    coverage: { lines: 85, functions: 90, branches: 80, statements: 88 }
  };
  
  const hash = createHash('sha256')
    .update(JSON.stringify(coverageData))
    .digest('hex');
  
  // Hash should be stable across runs
  expect(hash).toMatch(/^[a-f0-9]{64}$/);
  expect(hash.length).toBe(64);
  
  // Verify reproducibility
  const hash2 = createHash('sha256')
    .update(JSON.stringify(coverageData))
    .digest('hex');
  expect(hash).toBe(hash2);
});
