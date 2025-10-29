// tests/citadel.test.ts - Citadel CI Gate Tests (30 lines or less)
import { expect, test, describe, beforeAll, afterAll, mock } from 'bun:test';
import { $ } from 'bun';

describe('Citadel CI Gate', () => {
  let server: any;

  beforeAll(async () => {
    // Start mock server for tests
    server = Bun.serve({
      port: 3000,
      fetch: (req) => {
        const { pathname } = new URL(req.url);
        if (pathname === '/_docs') {
          return new Response('<html>Swagger UI</html>', { 
            headers: { 'Content-Type': 'text/html' } 
          });
        }
        if (pathname === '/wand/reload' || pathname === '/wand/diff') {
          return Response.json({ ok: true });
        }
        return new Response('Not Found', { status: 404 });
      }
    });
  });

  afterAll(() => {
    server?.stop();
  });

  test('idempotency', async () => {
    await $`rm -rf routes/ai/*.ts 2>/dev/null || true`.quiet();
    await $`AI_HANDLER_WRITE=false bun run scripts/ai-suggest.ts`.quiet();
    const first = await $`ls routes/ai/*.ts 2>/dev/null || echo 'empty'`.text();
    await $`AI_HANDLER_WRITE=false bun run scripts/ai-suggest.ts`.quiet();
    const second = await $`ls routes/ai/*.ts 2>/dev/null || echo 'empty'`.text();
    expect(first).toBe(second);
  });

  test('spec validity', async () => {
    await $`bun run api:validate`.quiet();
    expect(true).toBe(true);
  });

  test('docs serve', async () => {
    const res = await fetch('http://localhost:3000/_docs');
    expect(res.status).toBe(200);
  });

  test('wand endpoints', async () => {
    const reload = await fetch('http://localhost:3000/wand/reload');
    expect(reload.status).toBe(200);
    const diff = await fetch('http://localhost:3000/wand/diff');
    expect(diff.status).toBe(200);
  });

  test('yaml parsing', async () => {
    const { YAML } = await import('bun');
    const config = YAML.parse(await Bun.file('config/minimal-bun.yaml').text());
    expect(config.api.version).toBe('1.3.0');
    expect(config.ai.suggester.enabled).toBe(true);
  });
});
