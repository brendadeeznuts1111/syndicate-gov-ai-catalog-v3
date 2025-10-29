// tests/inline-snap.test.ts - Inline-snapshot with auto-indent (≤10 lines)
import { test, expect } from 'bun:test';

test('AI response shape', () => {
  const res = { id: 'ai-123', confidence: 0.94 };
  expect(res).toMatchInlineSnapshot(`
    {
      "confidence": 0.94,
      "id": "ai-123",
    }
  `);
});
