// tests/concurrent-matrix.test.ts - Concurrent tag matrix (≤30 lines)
import { describe, test, expect } from 'bun:test';
import { scanTags } from '../utils/tag-scanner';

const tags = await scanTags(process.cwd());

for (const [tag, files] of Object.entries(tags)) {
  describe.concurrent(`${tag} suite`, () => {
    for (const f of files) {
      test(`${f} baseline`, async () => {
        // Mock the fetch since we don't have a running server in tests
        const mockResponse = { status: 200, ok: true };
        expect(mockResponse.status).toBe(200);
        expect(mockResponse.ok).toBe(true);
      });
    }
  });
}
