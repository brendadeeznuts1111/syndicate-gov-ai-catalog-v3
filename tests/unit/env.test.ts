// test/env.test.ts - Environment validation test
import { expect, test } from 'bun:test';

test('environment variables are properly typed', () => {
  // Test that our environment types are accessible (may be undefined)
  expect(typeof Bun.env.CITADEL_TELEMETRY_URL).toMatch(/string|undefined/);
  expect(typeof Bun.env.DO_NOT_TRACK).toMatch(/string|undefined/);
  expect(typeof Bun.env.CLAUDECODE).toMatch(/string|undefined/);
  
  // Test that TypeScript types are working
  // If this compiles, our env.d.ts is working
  const telemetryUrl: string | undefined = Bun.env.CITADEL_TELEMETRY_URL;
  const doNotTrack: string | undefined = Bun.env.DO_NOT_TRACK;
  
  expect(telemetryUrl).toBeDefined();
  expect(doNotTrack).toBeDefined();
});

test('environment file exists and is readable', async () => {
  const envExists = await Bun.file('.env').exists();
  expect(envExists).toBe(true);
  
  const envContent = await Bun.file('.env').text();
  expect(envContent.length).toBeGreaterThan(0);
});
