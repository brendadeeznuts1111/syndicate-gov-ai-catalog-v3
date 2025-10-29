// tests/sourcemap.test.ts - Source-map snapshot (≤5 lines)
import { expect, test } from 'bun:test';

test('handler has valid structure', async () => {
  const txt = await Bun.file('routes/_docs.ts').text();
  expect(txt).toContain('export default');
  expect(txt).toContain('fetch');
});
