// scripts/env-unlock.ts - Encrypted environment file unlock (≤ 30 lines)
import { $ } from 'bun';
import { exists } from 'fs/promises';

const key = process.env.CITADEL_AGE_KEY;

// Auto-copy .env.example if .env doesn't exist (zero-config setup)
if (!await Bun.file('.env').exists()) {
  console.log('📝 Creating .env from template...');
  await Bun.write('.env', await Bun.file('.env.example').text());
}

// Decrypt .env.citadel if age key is provided
if (key && await Bun.file('.env.citadel').exists()) {
  console.log('🔓 Decrypting environment file...');
  try {
    await $`age -d -i <(echo "${key}") .env.citadel > .env`.quiet();
    console.log('✅ Environment file decrypted successfully');
  } catch (error) {
    console.log('⚠️  Failed to decrypt .env.citadel, using plain .env');
  }
} else {
  console.log('📄 Using plain .env file');
}
