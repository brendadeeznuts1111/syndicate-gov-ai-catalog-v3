// tools/uuid.ts - Simple UUID generator
export function generateUUID(): string {
  return crypto.randomUUID();
}
