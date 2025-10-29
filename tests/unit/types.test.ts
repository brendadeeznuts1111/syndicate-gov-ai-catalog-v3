// tests/types.test.ts - Type snapshot via expectTypeOf (≤5 lines)
import { expectTypeOf, test } from 'bun:test';

interface AIResponse {
  id: string;
  confidence: number;
  timestamp: number;
}

test('types align', () => {
  expectTypeOf<AIResponse>().toHaveProperty('confidence');
  expectTypeOf<AIResponse['confidence']>().toBeNumber();
});
