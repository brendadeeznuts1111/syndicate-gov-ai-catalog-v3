// citadel/network/ws-manager.ts
import { Bun } from 'bun';

export interface WSConnection {
  ws: any;
  ruleId: string;
  connectedAt: number;
  lastActivity: number;
  auth?: {
    token: string;
    userId?: string;
    permissions: string[];
  };
}

export interface WSOptions {
  port?: number;
  auth?: {
    type: 'cookie' | 'token' | 'basic';
    name: string;
    httpOnly?: boolean;
    secure?: boolean;
  };
  heartbeat?: number;
  maxConnections?: number;
}

export interface RuleUpdate {
  type: 'trigger' | 'action' | 'status' | 'config';
  data: any;
  timestamp: number;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

export class WebSocketManager {
  private connections = new Map<string, WSConnection>();
  private cookieManager = new CookieManager();
  private server: any = null;
  private heartbeatInterval?: any;
  private maxConnections = 100;

  async createMonitor(rule: any, options: WSOptions = {}): Promise<string> {
    const endpoint = `/ws/monitor/${rule.id || this.generateRuleId(rule)}`;
    const port = options.port || 3001;
    
    console.log(`🔗 Creating WebSocket monitor for ${rule.name} on ${endpoint}`);
    
    // Initialize server if not already running
    if (!this.server) {
      await this.initializeServer(port, options);
    }
    
    // Store rule configuration
    this.connections.set(rule.id || rule.name, {
      ws: null, // Will be set when client connects
      ruleId: rule.id || rule.name,
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });

    return `ws://localhost:${port}${endpoint}`;
  }

  private async initializeServer(port: number, options: WSOptions): Promise<void> {
    console.log(`🚀 Starting WebSocket server on port ${port}`);
    
    this.server = Bun.serve({
      port,
      websocket: {
        open: (ws) => {
          this.handleConnection(ws, options);
        },
        message: (ws, message) => {
          this.handleMessage(ws, message);
        },
        close: (ws, code, reason) => {
          this.handleDisconnection(ws, code, reason);
        },
        error: (ws, error) => {
          console.error('WebSocket error:', error);
        }
      },
      fetch: (req) => {
        return this.handleHttpRequest(req, options);
      }
    });

    // Start heartbeat if configured
    if (options.heartbeat) {
      this.startHeartbeat(options.heartbeat);
    }

    console.log(`✅ WebSocket server running on port ${port}`);
  }

  private async handleConnection(ws: any, options: WSOptions): Promise<void> {
    try {
      // Validate authentication
      const auth = await this.validateAuth(ws, options);
      if (!auth) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Check connection limit
      if (this.connections.size >= this.maxConnections) {
        ws.close(1013, 'Server overloaded');
        return;
      }

      // Extract rule ID from URL or headers
      const ruleId = this.extractRuleId(ws);
      if (!ruleId) {
        ws.close(1008, 'Rule identifier required');
        return;
      }

      // Register connection
      const connection: WSConnection = {
        ws,
        ruleId,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        auth
      };

      this.connections.set(ruleId, connection);
      
      console.log(`🔗 WebSocket connected for rule: ${ruleId}`);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'CONNECTED',
        ruleId,
        timestamp: Date.now(),
        message: 'Connected to Syndicate Governance Monitor'
      }));

    } catch (error) {
      console.error('Connection error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  private handleMessage(ws: any, message: string | Buffer): void {
    try {
      const data = JSON.parse(message.toString());
      const ruleId = this.extractRuleId(ws);
      const connection = this.connections.get(ruleId);

      if (!connection) {
        ws.close(1008, 'Connection not found');
        return;
      }

      connection.lastActivity = Date.now();

      switch (data.type) {
        case 'PING':
          ws.send(JSON.stringify({
            type: 'PONG',
            timestamp: Date.now()
          }));
          break;

        case 'SUBSCRIBE':
          this.handleSubscription(connection, data);
          break;

        case 'RULE_UPDATE':
          this.handleRuleMessage(ruleId, data);
          break;

        default:
          console.log(`Unknown message type: ${data.type}`);
      }

    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format',
        timestamp: Date.now()
      }));
    }
  }

  private handleDisconnection(ws: any, code: number, reason: string): void {
    const ruleId = this.extractRuleId(ws);
    
    if (ruleId) {
      this.connections.delete(ruleId);
      console.log(`🔌 WebSocket disconnected for rule: ${ruleId} (${code}: ${reason})`);
    }
  }

  private async handleHttpRequest(req: Request, options: WSOptions): Promise<Response> {
    const url = new URL(req.url);
    
    // Handle WebSocket upgrade requests
    if (req.headers.get('upgrade') === 'websocket') {
      return new Response('Upgrade required', { status: 426 });
    }

    // Handle API endpoints
    if (url.pathname === '/api/status') {
      return new Response(JSON.stringify({
        status: 'running',
        connections: this.connections.size,
        maxConnections: this.maxConnections,
        uptime: Date.now()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404 });
  }

  private async validateAuth(ws: any, options: WSOptions): Promise<any> {
    if (!options.auth) {
      return { permissions: ['read'] }; // No auth required
    }

    const headers = ws.data?.headers || new Headers();
    
    switch (options.auth.type) {
      case 'cookie':
        return await this.validateCookieAuth(headers, options);
      case 'token':
        return await this.validateTokenAuth(headers, options);
      case 'basic':
        return await this.validateBasicAuth(headers, options);
      default:
        return null;
    }
  }

  private async validateCookieAuth(headers: Headers, options: WSOptions): Promise<any> {
    const cookieHeader = headers.get('Cookie');
    if (!cookieHeader) return null;

    const cookies = this.cookieManager.parse(cookieHeader);
    const authCookie = cookies[options.auth.name];
    
    if (!authCookie) return null;

    // Validate JWT or session token
    return await this.validateToken(authCookie);
  }

  private async validateTokenAuth(headers: Headers, options: WSOptions): Promise<any> {
    const authHeader = headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    return await this.validateToken(token);
  }

  private async validateBasicAuth(headers: Headers, options: WSOptions): Promise<any> {
    const authHeader = headers.get('Authorization');
    if (!authHeader?.startsWith('Basic ')) return null;

    const credentials = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    // Simple validation (would use proper auth in production)
    if (username === 'syndicate' && password === 'citadel') {
      return { userId: username, permissions: ['read', 'write'] };
    }
    
    return null;
  }

  private async validateToken(token: string): Promise<any> {
    // Mock token validation - would use JWT verification in production
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return {
        userId: payload.sub,
        permissions: payload.permissions || ['read'],
        expires: payload.exp
      };
    } catch {
      return null;
    }
  }

  private extractRuleId(ws: any): string | null {
    // Extract from URL path or headers
    const url = ws.data?.url || '';
    const match = url.match(/\/ws\/monitor\/([^\/]+)/);
    return match ? match[1] : null;
  }

  private handleSubscription(connection: WSConnection, data: any): void {
    console.log(`📡 Rule ${connection.ruleId} subscribed to: ${data.events?.join(', ')}`);
    
    connection.ws.send(JSON.stringify({
      type: 'SUBSCRIBED',
      events: data.events || [],
      timestamp: Date.now()
    }));
  }

  private handleRuleMessage(ruleId: string, message: any): void {
    console.log(`📨 Rule message for ${ruleId}:`, message.type);
    
    // Broadcast to other connections if needed
    this.broadcastToRule(ruleId, {
      type: 'RULE_MESSAGE',
      ruleId,
      data: message,
      timestamp: Date.now()
    }, ruleId); // Exclude sender
  }

  async broadcastRuleUpdate(ruleId: string, update: RuleUpdate): Promise<void> {
    const connection = this.connections.get(ruleId);
    if (connection && connection.ws) {
      connection.ws.send(JSON.stringify({
        type: 'RULE_UPDATE',
        ruleId,
        update,
        timestamp: Date.now()
      }));
      
      console.log(`📡 Broadcasted update for rule: ${ruleId}`);
    }
  }

  async broadcastToAll(message: any): Promise<void> {
    const messageStr = JSON.stringify(message);
    
    for (const [ruleId, connection] of this.connections) {
      if (connection.ws) {
        try {
          connection.ws.send(messageStr);
        } catch (error) {
          console.warn(`Failed to send to ${ruleId}:`, error);
        }
      }
    }
  }

  async broadcastToRule(ruleId: string, message: any, excludeRuleId?: string): Promise<void> {
    if (ruleId === excludeRuleId) return;
    
    const connection = this.connections.get(ruleId);
    if (connection && connection.ws) {
      try {
        connection.ws.send(JSON.stringify(message));
      } catch (error) {
        console.warn(`Failed to send to ${ruleId}:`, error);
      }
    }
  }

  private startHeartbeat(intervalMs: number): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [ruleId, connection] of this.connections) {
        // Check for inactive connections
        if (now - connection.lastActivity > intervalMs * 2) {
          console.log(`💔 Closing inactive connection: ${ruleId}`);
          connection.ws?.close(1000, 'Inactive');
          this.connections.delete(ruleId);
          continue;
        }
        
        // Send heartbeat
        try {
          connection.ws?.send(JSON.stringify({
            type: 'HEARTBEAT',
            timestamp: now
          }));
        } catch (error) {
          console.warn(`Heartbeat failed for ${ruleId}:`, error);
        }
      }
    }, intervalMs);
  }

  private generateRuleId(rule: any): string {
    return `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down WebSocket server...');
    
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all connections
    for (const [ruleId, connection] of this.connections) {
      try {
        connection.ws?.close(1001, 'Server shutdown');
      } catch (error) {
        console.warn(`Error closing connection ${ruleId}:`, error);
      }
    }
    
    this.connections.clear();
    
    // Stop server
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
    
    console.log('✅ WebSocket server shut down');
  }

  getStats(): any {
    const now = Date.now();
    const activeConnections = Array.from(this.connections.values()).filter(
      conn => now - conn.lastActivity < 30000 // Active in last 30 seconds
    );

    return {
      totalConnections: this.connections.size,
      activeConnections: activeConnections.length,
      maxConnections: this.maxConnections,
      uptime: this.server ? now - (this.server as any).startTime : 0
    };
  }
}

export class CookieManager {
  parse(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};
    
    if (!cookieHeader) return cookies;
    
    cookieHeader.split(';').forEach(cookie => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name && valueParts.length > 0) {
        cookies[name] = decodeURIComponent(valueParts.join('='));
      }
    });
    
    return cookies;
  }

  createAuthCookie(token: string, options: CookieOptions = {}): string {
    const defaults: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    };

    const settings = { ...defaults, ...options };
    
    return `syndicate-auth=${token}; ${this.serializeOptions(settings)}`;
  }

  createSessionCookie(sessionData: any, options: CookieOptions = {}): string {
    const token = Buffer.from(JSON.stringify(sessionData)).toString('base64');
    return this.createAuthCookie(token, options);
  }

  private serializeOptions(options: CookieOptions): string {
    const parts: string[] = [];
    
    if (options.httpOnly) parts.push('HttpOnly');
    if (options.secure) parts.push('Secure');
    if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
    if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
    if (options.path) parts.push(`Path=${options.path}`);
    if (options.domain) parts.push(`Domain=${options.domain}`);
    
    return parts.join('; ');
  }

  validateCookie(cookieHeader: string, expectedName: string): boolean {
    const cookies = this.parse(cookieHeader);
    return cookies.hasOwnProperty(expectedName);
  }

  extractToken(cookieHeader: string, cookieName: string = 'syndicate-auth'): string | null {
    const cookies = this.parse(cookieHeader);
    return cookies[cookieName] || null;
  }
}
