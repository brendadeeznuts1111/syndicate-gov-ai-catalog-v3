// [REGISTRY][SERVICE][TYPESCRIPT][API-REGISTRY-001][v3.0][LIVE]
// Grepable: [registry-script-typescript-api-registry-001-v3.0-live]
// src/citadel/registry/api-registry.ts
// 🛡️ **Maintainers**: @syndicate-gov/registry-team
// 🎯 **Semantic Tag**: 🔴 [REGISTRY-TEAM][API][SERVICE][TYPESCRIPT]
// 📊 **Coverage**: API-driven registry with WebSocket support
import { file, serve } from 'bun';
import { WebSocketServer } from 'ws';
import { gzip, zstd } from 'bun';

export interface APIRegistryConfig {
  port: number;
  host: string;
  enableAuth: boolean;
  enableCompression: boolean;
  enableWebSocket: boolean;
  cacheSize: number;
  rateLimit: {
    requests: number;
    window: number;
  };
}

export interface RegistryRule {
  id: string;
  name: string;
  category: string;
  trigger: string;
  action: string;
  priority: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  enforcement: {
    trigger: string;
    action: string;
    conditions: Record<string, any>;
    fallback: string;
    monitoring: {
      enabled: boolean;
      metrics: string[];
      alerts: {
        enabled: boolean;
        thresholds: Record<string, number>;
        notifications: string[];
      };
    };
  };
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
    dependencies?: string[];
  };
}

export interface RegistryPackage {
  name: string;
  version: string;
  scope: string;
  size: number;
  integrity: string;
  compression: 'zstd' | 'gzip';
  createdAt: string;
  updatedAt: string;
  metadata: {
    description?: string;
    author?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
}

export interface RegistryStats {
  rules: {
    total: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
  packages: {
    total: number;
    byScope: Record<string, number>;
    totalSize: number;
  };
  performance: {
    avgResponseTime: number;
    cacheHitRate: number;
    compressionRatio: number;
  };
  lastUpdated: string;
}

export class APIRegistry {
  private config: APIRegistryConfig;
  private rules: Map<string, RegistryRule> = new Map();
  private packages: Map<string, RegistryPackage> = new Map();
  private cache: Map<string, any> = new Map();
  private rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();
  private wss?: WebSocketServer;
  private server?: any;

  constructor(config: Partial<APIRegistryConfig> = {}) {
    this.config = {
      port: 3001,
      host: 'localhost',
      enableAuth: true,
      enableCompression: true,
      enableWebSocket: true,
      cacheSize: 1000,
      rateLimit: {
        requests: 100,
        window: 60000 // 1 minute
      },
      ...config
    };

    this.loadRegistryData();
  }

  private async loadRegistryData(): Promise<void> {
    try {
      // Load rules from .citadel/registry.yaml
      const registryPath = '.citadel/registry.yaml';
      const registryData = await file(registryPath).text();
      const parsed = JSON.parse(registryData);
      
      if (parsed.rules) {
        parsed.rules.forEach((rule: any) => {
          this.rules.set(rule.id, {
            ...rule,
            updatedAt: rule.createdAt
          });
        });
      }

      // Load packages from .citadel/registry/
      const packageFiles = await Array.fromAsync(
        new Bun.Glob('.citadel/registry/*.json').scan({
          cwd: '.',
          absolute: true
        })
      );

      for (const pkgFile of packageFiles) {
        try {
          const pkgData = await file(pkgFile).json();
          const key = `${pkgData.scope}:${pkgData.name}@${pkgData.version}`;
          this.packages.set(key, pkgData);
        } catch (error) {
          console.warn(`Failed to load package ${pkgFile}:`, error.message);
        }
      }

      console.log(`📦 Loaded ${this.rules.size} rules and ${this.packages.size} packages`);
    } catch (error) {
      console.warn('Failed to load registry data:', error.message);
    }
  }

  private async saveRegistryData(): Promise<void> {
    try {
      // Save rules to .citadel/registry.yaml
      const rulesArray = Array.from(this.rules.values());
      const registryData = {
        version: '1.0.0',
        rules: rulesArray,
        packages: Array.from(this.packages.values()),
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      };

      await Bun.write('.citadel/registry.yaml', JSON.stringify(registryData));
      
      // Save individual packages
      for (const [key, pkg] of this.packages.entries()) {
        const filename = `.citadel/registry/${pkg.scope}-${pkg.name}-${pkg.version}.json`;
        await Bun.write(filename, JSON.stringify(pkg, null, 2));
      }

      console.log(`💾 Saved ${this.rules.size} rules and ${this.packages.size} packages`);
    } catch (error) {
      console.error('Failed to save registry data:', error.message);
    }
  }

  private rateLimitCheck(clientId: string): boolean {
    const now = Date.now();
    const client = this.rateLimitMap.get(clientId);
    
    if (!client || now > client.resetTime) {
      this.rateLimitMap.set(clientId, {
        count: 1,
        resetTime: now + this.config.rateLimit.window
      });
      return true;
    }
    
    if (client.count >= this.config.rateLimit.requests) {
      return false;
    }
    
    client.count++;
    return true;
  }

  private getClientId(request: Request): string {
    return request.headers.get('x-forwarded-for') || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }

  private async handleRequest(request: Request): Promise<Response> {
    const clientId = this.getClientId(request);
    
    // Rate limiting
    if (!this.rateLimitCheck(clientId)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // CORS headers
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Content-Type': 'application/json'
      };

      // Handle OPTIONS requests
      if (method === 'OPTIONS') {
        return new Response(null, { headers });
      }

      // API Routes
      switch (path) {
        case '/api/rules':
          return this.handleRules(request, method);
        case '/api/rules/search':
          return this.handleRulesSearch(request, method);
        case '/api/packages':
          return this.handlePackages(request, method);
        case '/api/packages/search':
          return this.handlePackagesSearch(request, method);
        case '/api/stats':
          return this.handleStats(request, method);
        case '/api/health':
          return this.handleHealth(request, method);
        default:
          if (path.startsWith('/api/rules/')) {
            const ruleId = path.split('/')[3];
            return this.handleRule(request, method, ruleId);
          }
          if (path.startsWith('/api/packages/')) {
            const pkgKey = path.split('/')[3];
            return this.handlePackage(request, method, pkgKey);
          }
          return new Response(
            JSON.stringify({ error: 'Not found' }),
            { status: 404, headers }
          );
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }

  private async handleRules(request: Request, method: string): Promise<Response> {
    switch (method) {
      case 'GET':
        const rules = Array.from(this.rules.values());
        return new Response(JSON.stringify(rules), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'POST':
        const newRule: RegistryRule = await request.json();
        this.rules.set(newRule.id, {
          ...newRule,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await this.saveRegistryData();
        this.broadcastUpdate('rule:created', newRule);
        return new Response(JSON.stringify(newRule), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405 }
        );
    }
  }

  private async handleRule(request: Request, method: string, ruleId: string): Promise<Response> {
    const rule = this.rules.get(ruleId);
    
    if (!rule) {
      return new Response(
        JSON.stringify({ error: 'Rule not found' }),
        { status: 404 }
      );
    }

    switch (method) {
      case 'GET':
        return new Response(JSON.stringify(rule), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'PUT':
        const updatedRule: RegistryRule = await request.json();
        this.rules.set(ruleId, {
          ...updatedRule,
          updatedAt: new Date().toISOString()
        });
        await this.saveRegistryData();
        this.broadcastUpdate('rule:updated', updatedRule);
        return new Response(JSON.stringify(updatedRule), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'DELETE':
        this.rules.delete(ruleId);
        await this.saveRegistryData();
        this.broadcastUpdate('rule:deleted', { id: ruleId });
        return new Response(null, { status: 204 });
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405 }
        );
    }
  }

  private async handleRulesSearch(request: Request, method: string): Promise<Response> {
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405 }
      );
    }

    const searchQuery: {
      category?: string;
      priority?: string;
      trigger?: string;
      tags?: string[];
    } = await request.json();

    let results = Array.from(this.rules.values());

    if (searchQuery.category) {
      results = results.filter(rule => rule.category === searchQuery.category);
    }
    if (searchQuery.priority) {
      results = results.filter(rule => rule.priority === searchQuery.priority);
    }
    if (searchQuery.trigger) {
      results = results.filter(rule => rule.trigger.includes(searchQuery.trigger));
    }
    if (searchQuery.tags) {
      results = results.filter(rule => 
        rule.metadata?.tags?.some(tag => searchQuery.tags.includes(tag))
      );
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handlePackages(request: Request, method: string): Promise<Response> {
    switch (method) {
      case 'GET':
        const packages = Array.from(this.packages.values());
        return new Response(JSON.stringify(packages), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'POST':
        const newPkg: RegistryPackage = await request.json();
        const key = `${newPkg.scope}:${newPkg.name}@${newPkg.version}`;
        this.packages.set(key, {
          ...newPkg,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await this.saveRegistryData();
        this.broadcastUpdate('package:created', newPkg);
        return new Response(JSON.stringify(newPkg), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405 }
        );
    }
  }

  private async handlePackage(request: Request, method: string, pkgKey: string): Promise<Response> {
    const pkg = this.packages.get(pkgKey);
    
    if (!pkg) {
      return new Response(
        JSON.stringify({ error: 'Package not found' }),
        { status: 404 }
      );
    }

    switch (method) {
      case 'GET':
        return new Response(JSON.stringify(pkg), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'PUT':
        const updatedPkg: RegistryPackage = await request.json();
        this.packages.set(pkgKey, {
          ...updatedPkg,
          updatedAt: new Date().toISOString()
        });
        await this.saveRegistryData();
        this.broadcastUpdate('package:updated', updatedPkg);
        return new Response(JSON.stringify(updatedPkg), {
          headers: { 'Content-Type': 'application/json' }
        });
      
      case 'DELETE':
        this.packages.delete(pkgKey);
        await this.saveRegistryData();
        this.broadcastUpdate('package:deleted', { key: pkgKey });
        return new Response(null, { status: 204 });
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405 }
        );
    }
  }

  private async handlePackagesSearch(request: Request, method: string): Promise<Response> {
    if (method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405 }
      );
    }

    const searchQuery: {
      scope?: string;
      name?: string;
      version?: string;
    } = await request.json();

    let results = Array.from(this.packages.values());

    if (searchQuery.scope) {
      results = results.filter(pkg => pkg.scope === searchQuery.scope);
    }
    if (searchQuery.name) {
      results = results.filter(pkg => pkg.name.includes(searchQuery.name));
    }
    if (searchQuery.version) {
      results = results.filter(pkg => pkg.version === searchQuery.version);
    }

    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleStats(request: Request, method: string): Promise<Response> {
    if (method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405 }
      );
    }

    const rules = Array.from(this.rules.values());
    const packages = Array.from(this.packages.values());

    const stats: RegistryStats = {
      rules: {
        total: rules.length,
        byCategory: rules.reduce((acc, rule) => {
          acc[rule.category] = (acc[rule.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPriority: rules.reduce((acc, rule) => {
          acc[rule.priority] = (acc[rule.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      packages: {
        total: packages.length,
        byScope: packages.reduce((acc, pkg) => {
          acc[pkg.scope] = (acc[pkg.scope] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalSize: packages.reduce((acc, pkg) => acc + pkg.size, 0)
      },
      performance: {
        avgResponseTime: 15.5, // Mock value
        cacheHitRate: 0.85, // Mock value
        compressionRatio: 0.65 // Mock value
      },
      lastUpdated: new Date().toISOString()
    };

    return new Response(JSON.stringify(stats), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleHealth(request: Request, method: string): Promise<Response> {
    if (method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405 }
      );
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      registry: {
        rules: this.rules.size,
        packages: this.packages.size,
        cacheSize: this.cache.size
      }
    };

    return new Response(JSON.stringify(health), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private broadcastUpdate(type: string, data: any): void {
    if (this.wss) {
      const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
      this.wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(message);
        }
      });
    }
  }

  async start(): Promise<void> {
    // Start HTTP server
    this.server = serve({
      port: this.config.port,
      hostname: this.config.host,
      fetch: this.handleRequest.bind(this)
    });

    // Start WebSocket server
    if (this.config.enableWebSocket) {
      this.wss = new WebSocketServer({ port: this.config.port + 1 });
      
      this.wss.on('connection', (ws) => {
        console.log('🔌 WebSocket client connected');
        
        ws.send(JSON.stringify({
          type: 'welcome',
          data: { message: 'Connected to Citadel Registry API' },
          timestamp: new Date().toISOString()
        }));

        ws.on('close', () => {
          console.log('🔌 WebSocket client disconnected');
        });
      });
    }

    console.log(`🚀 Citadel Registry API started on http://${this.config.host}:${this.config.port}`);
    console.log(`🔌 WebSocket server started on ws://${this.config.host}:${this.config.port + 1}`);
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.stop();
    }
    if (this.wss) {
      this.wss.close();
    }
    console.log('🛑 Citadel Registry API stopped');
  }

  // Utility methods for CLI integration
  async addRule(rule: RegistryRule): Promise<void> {
    this.rules.set(rule.id, {
      ...rule,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await this.saveRegistryData();
    this.broadcastUpdate('rule:created', rule);
  }

  async removeRule(ruleId: string): Promise<boolean> {
    const existed = this.rules.has(ruleId);
    if (existed) {
      this.rules.delete(ruleId);
      await this.saveRegistryData();
      this.broadcastUpdate('rule:deleted', { id: ruleId });
    }
    return existed;
  }

  async addPackage(pkg: RegistryPackage): Promise<void> {
    const key = `${pkg.scope}:${pkg.name}@${pkg.version}`;
    this.packages.set(key, {
      ...pkg,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await this.saveRegistryData();
    this.broadcastUpdate('package:created', pkg);
  }

  getRules(): RegistryRule[] {
    return Array.from(this.rules.values());
  }

  getPackages(): RegistryPackage[] {
    return Array.from(this.packages.values());
  }

  getStats(): RegistryStats {
    const rules = Array.from(this.rules.values());
    const packages = Array.from(this.packages.values());

    return {
      rules: {
        total: rules.length,
        byCategory: rules.reduce((acc, rule) => {
          acc[rule.category] = (acc[rule.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byPriority: rules.reduce((acc, rule) => {
          acc[rule.priority] = (acc[rule.priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      packages: {
        total: packages.length,
        byScope: packages.reduce((acc, pkg) => {
          acc[pkg.scope] = (acc[pkg.scope] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalSize: packages.reduce((acc, pkg) => acc + pkg.size, 0)
      },
      performance: {
        avgResponseTime: 15.5,
        cacheHitRate: 0.85,
        compressionRatio: 0.65
      },
      lastUpdated: new Date().toISOString()
    };
  }
}
