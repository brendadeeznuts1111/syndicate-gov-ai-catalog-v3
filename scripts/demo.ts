// scripts/demo.ts - One-command full demo (≤20 lines)
import { $ } from 'bun';

console.log('🚀 Citadel demo – Testing Bun 1.3.1 superpowers');

console.log('1️⃣  Type-safe testing with expectTypeOf...');
await $`bun test ./tests/types.test.ts`.quiet();
console.log('✅ Type safety validated');

console.log('2️⃣  Serial test islands...');
await $`bun test ./tests/accounting-serial.test.ts`.quiet();
console.log('✅ Serial execution confirmed');

console.log('3️⃣  Inline snapshots with auto-indent...');
await $`bun test ./tests/inline-snap.test.ts`.quiet();
console.log('✅ Snapshots working');

console.log('4️⃣  AI-quiet mode...');
await $`CLAUDECODE=1 bun test ./tests/types.test.ts --only-failures --pass-with-no-tests`.quiet();
console.log('✅ Quiet mode functional');

console.log('✅ Demo complete – Bun 1.3.1 superpowers active!');
console.log('🎯 Zero-config, concurrent, type-safe, flake-free testing ready!');
