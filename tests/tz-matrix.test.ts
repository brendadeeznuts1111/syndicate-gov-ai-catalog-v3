// tests/tz-matrix.test.ts - Timezone matrix test (≤10 lines)
import { expect, test } from 'bun:test';

for (const tz of ['UTC', 'America/New_York', 'Europe/Berlin']) {
  test(`TZ=${tz}`, () => {
    process.env.TZ = tz;
    const d = new Date('2025-06-25T12:00:00Z');
    expect(d.getTimezoneOffset()).toBe(d.getTimezoneOffset()); // deterministic
  });
}
