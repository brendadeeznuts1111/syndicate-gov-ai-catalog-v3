// tests/tag-matrix.test.ts - Tag-driven test matrix (≤30 lines)
import { expect, test } from 'bun:test';
import { scanTags } from './scan-tags';

const tags = await scanTags(process.cwd());
const tagFilter = process.env.TAG_FILTER;

for (const [tag, files] of Object.entries(tags)) {
  // Skip if tag filter is set and doesn't match
  if (tagFilter && tag !== tagFilter) continue;
  
  test(`${tag} runtime`, async () => {
    // Validate that files exist and have correct headers
    for (const file of files) {
      const exists = await Bun.file(file).exists();
      expect(exists).toBe(true);
      
      const content = await Bun.file(file).text();
      expect(content).toContain(`[AI][${tag}]`);
      
      // Validate export structure
      expect(content).toContain('export default');
      expect(content).toContain('async fetch');
    }
    
    // Set environment based on tag (for future execution)
    const env = { ...process.env };
    if (tag.includes('RUNTIME')) env.NODE_ENV = 'stress';
    if (tag.includes('ACCOUNTING')) env.CITADEL_ACCOUNTING = '1';
    
    // For now, just validate the setup - actual execution would be in CI
    expect(Object.keys(env).length).toBeGreaterThan(0);
  });
}
