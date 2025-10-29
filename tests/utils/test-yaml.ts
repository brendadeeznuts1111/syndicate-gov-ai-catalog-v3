import { YAML } from 'bun';

const content = await Bun.file('config/bun.yaml').text();
console.log('Content length:', content.length);
console.log('First line:', content.split('\n')[0]);

try {
  const cfg = YAML.parse(content);
  console.log('✅ YAML parsed successfully');
  console.log('API version:', cfg.api?.version);
} catch (error) {
  console.log('❌ YAML parse error:', error.message);
  
  // Try to find the problematic line
  const lines = content.split('\n');
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
