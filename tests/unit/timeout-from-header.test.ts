// tests/timeout-from-header.test.ts - Dynamic timeout from header (≤10 lines)
import { expect, test } from 'bun:test';
import { readdir } from 'node:fs/promises';

const aiDir = 'routes/ai';
const files: string[] = [];

try {
  const entries = await readdir(aiDir);
  for (const entry of entries) {
    if (entry.endsWith('.ts')) {
      files.push(`${aiDir}/${entry}`);
    }
  }
} catch {
  // Directory doesn't exist or no files
}

for (const f of files) {
  const txt = await Bun.file(f).text();
  const m = txt.match(/\[TIMEOUT-(\d+)\]/);
  const timeout = m ? parseInt(m[1], 10) : 5000;
  test(`${f} declares ${timeout} ms timeout`, () => {
    expect(timeout).toBeGreaterThan(0);
    expect(txt).toContain(`[TIMEOUT-${timeout}]`);
  });
}
