// tests/scan-tags.ts - Header scanner (≤20 lines)
import { readdir } from 'node:fs/promises';

export async function scanTags(cwd: string) {
  const aiDir = `${cwd}/routes/ai`;
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
  
  const map: Record<string, string[]> = {};
  for (const f of files) {
    const txt = await Bun.file(f).text();
    const m = txt.match(/\[AI\]\[([A-Z-]+)\]/g);
    if (m) m.forEach(tagMatch => {
      const tag = tagMatch.match(/\[AI\]\[([A-Z-]+)\]/)?.[1];
      if (tag) (map[tag] ||= []).push(f);
    });
  }
  return map;
}
