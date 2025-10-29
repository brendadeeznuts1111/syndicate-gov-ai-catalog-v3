// routes/wand.ts – Admin wand: live reload, schema diff, rollback
import { $ } from 'bun';
export default {
  async fetch(req: Request) {
    const { pathname } = new URL(req.url);
    if (pathname === '/wand/reload') { await $`bun run api:schemas`.quiet(); return Response.json({ ok: true }); }
    if (pathname === '/wand/diff')  { const d = await $`git diff docs/openapi.yaml`.text(); return Response.json({ diff: d }); }
    if (pathname === '/wand/rollback') { await $`for f in routes/ai/*.bak; do mv "$f" "${f%.bak}" 2>/dev/null; done`.quiet(); return Response.json({ ok: true }); }
    return Response.json({ error: 'unknown wand' }, { status: 404 });
  }
}
