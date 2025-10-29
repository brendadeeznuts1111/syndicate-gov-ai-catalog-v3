// tests/env.test.ts - Environment snapshot test (≤15 lines)
import { expect, test, beforeAll } from 'bun:test';

beforeAll(() => {
  // Ensure test environment
  process.env.NODE_ENV = 'test';
  process.env.AI_HANDLER_WRITE = 'false';
});

test('env snapshot', () => {
  const snap = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    AI_HANDLER_WRITE: process.env.AI_HANDLER_WRITE,
    CITADEL_TELEMETRY_URL: process.env.CITADEL_TELEMETRY_URL?.replace(/\w/g, '*'), // mask token
    JWT_SECRET: process.env.JWT_SECRET?.replace(/\w/g, '*'), // mask secret
    SESSION_SECRET: process.env.SESSION_SECRET?.replace(/\w/g, '*'), // mask secret
  };
  expect(snap).toMatchSnapshot(); // auto-creates env.test.ts.snap
});

test('required env vars present', () => {
  expect(process.env.NODE_ENV).toBeDefined();
  expect(process.env.AI_HANDLER_WRITE).toBeDefined();
});
