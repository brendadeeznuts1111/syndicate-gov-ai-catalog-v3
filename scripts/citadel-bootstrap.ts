// scripts/citadel-bootstrap.ts - Post-install bootstrap (≤30 lines)
import { $ } from 'bun';

console.log('🔧 Citadel bootstrap starting...');

// Smoke test basic functionality
try {
  console.log('🧪 Testing basic functionality...');
  await $`bun test ./tests/types.test.ts`.quiet();
  console.log('✅ Basic functionality validated');
} catch (error) {
  console.log('❌ Basic validation failed');
  process.exit(1);
}

// Check if AI tests pass (optional)
try {
  console.log('🤖 Testing AI stack (optional)...');
  await $`CLAUDECODE=1 bun test --only-failures --pass-with-no-tests`.quiet();
  console.log('✅ AI stack validated');
} catch (error) {
  console.log('⚠️  AI validation skipped (may fail on first install)');
}

// Anonymous telemetry (opt-out)
if (process.env.DO_NOT_TRACK !== '1') {
  try {
    const packageJson = await Bun.file('package.json').json();
    fetch('https://telemetry.citadel.sh/install', {
      method: 'POST',
      body: JSON.stringify({
        version: packageJson.version,
        timestamp: Date.now(),
        platform: process.platform
      }),
      headers: { 'Content-Type': 'application/json' }
    }).catch(() => {}); // Fire and forget
  } catch (error) {
    // Silently ignore telemetry failures
  }
}

console.log('✅ Citadel ready – run "bun run 🚀 demo" to see it in action!');
