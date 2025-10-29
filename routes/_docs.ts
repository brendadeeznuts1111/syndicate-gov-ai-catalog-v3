// routes/_docs.ts – Interactive Swagger/ReDoc docs server
export default {
  fetch(req: Request) {
    const { pathname } = new URL(req.url);
    if (pathname === '/openapi.yaml') return new Response(Bun.file('docs/openapi.yaml'));
    if (pathname === '/_docs') return new Response(Bun.file('node_modules/swagger-ui-dist/index.html'), { headers: { 'Content-Type': 'text/html' }});
    if (pathname === '/_redoc') return new Response(Bun.file('node_modules/redoc/bundles/redoc.standalone.js'), { headers: { 'Content-Type': 'text/html' }});
    return new Response('Not Found', { status: 404 });
  }
}
