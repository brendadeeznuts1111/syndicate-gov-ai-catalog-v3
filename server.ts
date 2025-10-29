// server.ts - Bun-powered API server with YAML routing
import { file, YAML } from 'bun';
import { serve } from 'bun';

interface RouteDecl {
  path: string;
  method: string | 'WS';
  id: string;
  handler: string;
  auth?: string;
  request?: { schema: string; required?: boolean };
  response: Record<string, { schema: string; example?: any }>;
  tags: string[];
  summary: string;
  sourcemap?: boolean;
  subprotocol?: string;
}

class APIServer {
  private config: any;
  private routes: Map<string, RouteDecl> = new Map();
  private handlers: Map<string, any> = new Map();

  async loadConfig() {
    const configText = await file('config/bun.yaml').text();
    this.config = YAML.parse(configText);
    
    // Load routes into memory
    for (const route of this.config.api.routes || []) {
      const key = `${route.method}:${route.path}`;
      this.routes.set(key, route);
    }
    
    console.log(`📡 Loaded ${this.routes.size} routes from bun.yaml`);
  }

  async loadHandler(handlerPath: string) {
    if (this.handlers.has(handlerPath)) {
      return this.handlers.get(handlerPath);
    }

    try {
      const module = await import(handlerPath);
      this.handlers.set(handlerPath, module);
      return module;
    } catch (error) {
      console.error(`❌ Failed to load handler ${handlerPath}:`, error.message);
      throw error;
    }
  }

  matchRoute(method: string, path: string): RouteDecl | null {
    // Exact match first
    const exactKey = `${method}:${path}`;
    if (this.routes.has(exactKey)) {
      return this.routes.get(exactKey)!;
    }

    // Pattern matching for paths with parameters
    for (const [key, route] of this.routes.entries()) {
      if (key.startsWith(method + ':')) {
        const routePath = route.path;
        const pattern = routePath.replace(/{[^}]+}/g, '([^/]+)');
        const regex = new RegExp(`^${pattern}$`);
        
        if (regex.test(path)) {
          return route;
        }
      }
    }

    return null;
  }

  extractParams(routePath: string, actualPath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const routeParts = routePath.split('/');
    const pathParts = actualPath.split('/');
    
    for (let i = 0; i < routeParts.length; i++) {
      const routePart = routeParts[i];
      if (routePart.startsWith('{') && routePart.endsWith('}')) {
        const paramName = routePart.slice(1, -1);
        params[paramName] = pathParts[i] || '';
      }
    }
    
    return params;
  }

  async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname;

    const route = this.matchRoute(method, path);
    if (!route) {
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const handler = await this.loadHandler(route.handler);
      const params = this.extractParams(route.path, path);
      
      // Auth middleware (mock)
      if (route.auth && route.auth !== 'csrf') {
        // In production, implement actual auth logic
        console.log(`🔐 Auth required: ${route.auth}`);
      }

      // Call handler
      if (typeof handler.handle === 'function') {
        return await handler.handle(req, { params, route, url });
      }

      return new Response('Handler not found', { status: 500 });
    } catch (error) {
      console.error(`❌ Route handler error:`, error.message);
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error',
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  async start() {
    await this.loadConfig();

    const server = serve({
      port: 3003,
      websocket: {
        message: (ws, message) => {
          // Handle WebSocket messages
          const wsRoute = this.matchRoute('WS', '/ws/config-update');
          if (wsRoute) {
            this.loadHandler(wsRoute.handler).then(handler => {
              if (handler.websocket?.message) {
                handler.websocket.message(ws, message);
              }
            });
          }
        },
        open: (ws) => {
          console.log('🔌 WebSocket opened');
          const wsRoute = this.matchRoute('WS', '/ws/config-update');
          if (wsRoute) {
            this.loadHandler(wsRoute.handler).then(handler => {
              if (handler.websocket?.open) {
                handler.websocket.open(ws);
              }
            });
          }
        },
        close: (ws) => {
          console.log('🔌 WebSocket closed');
        }
      },
      fetch: async (req, server) => {
        // Check for WebSocket upgrade
        if (req.headers.get('upgrade') === 'websocket') {
          const wsRoute = this.matchRoute('WS', new URL(req.url).pathname);
          if (wsRoute) {
            const handler = await this.loadHandler(wsRoute.handler);
            if (typeof handler.handle === 'function') {
              return await handler.handle(req, server);
            }
          }
        }

        return this.handleRequest(req);
      }
    });

    console.log(`🚀 API Server running on http://localhost:${server.port}`);
    console.log(`📚 OpenAPI spec: ${this.config.api.openapi.output}`);
    return server;
  }
}

// Start server
const apiServer = new APIServer();
apiServer.start().catch(console.error);
