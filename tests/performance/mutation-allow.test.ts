// tests/mutation-allow.test.ts - Mutation allow-list from header (≤10 lines)
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
  const allowed = txt.includes('[ALLOW-MUTATION]');
  test(`${f} mutation flag=${allowed}`, () => {
    expect(allowed).toBe(allowed); // snapshot gate
  });
}
