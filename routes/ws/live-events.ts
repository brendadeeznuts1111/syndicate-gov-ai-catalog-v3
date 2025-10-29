// [GOV][WS][LIVE-EVENTS][WS-LIVE-001][v3.0][LIVE]
// Grepable: [gov-ws-live-events-ws-live-001-v3.0-live]
// routes/ws/live-events.ts - Real-time live events WebSocket stream
// 🛡️ **Maintainers**: @syndicate-gov/websocket-team
// 🎯 **Semantic Tag**: 🟢 [GOV][WS][LIVE-EVENTS][TYPESCRIPT]
// 📊 **Coverage**: WebSocket stream for real-time live events and updates

import { WebSocketServer, WebSocket } from 'bun';
import { randomUUID } from 'crypto';

interface LiveEventData {
  id: string;
  type: 'event_update' | 'score_change' | 'status_change' | 'new_event';
  timestamp: string;
  data: {
    eventId: string;
    sport: string;
    league: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    status: string;
    startTime: string;
    odds?: {
      home: number;
      away: number;
      draw?: number;
    };
  };
}

interface ClientConnection {
  id: string;
  ws: WebSocket;
  subscriptions: string[];
  lastPing: number;
}

class LiveEventsWebSocket {
  private server: WebSocketServer;
  private clients: Map<string, ClientConnection> = new Map();
  private eventData: Map<string, any> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor(port: number = 3004) {
    this.server = new WebSocketServer({
      port,
      fetch(req, server) {
        // Upgrade HTTP to WebSocket
        if (server.upgrade(req, {
          headers: {
            'X-WebSocket-Protocol': 'live-events-v1',
            'X-Server-Version': '3.0.0'
          }
        })) {
          return; // WebSocket connection established
        }
        return new Response('Upgrade failed', { status: 400 });
      },
      websocket: {
        message: this.handleMessage.bind(this),
        open: this.handleOpen.bind(this),
        close: this.handleClose.bind(this),
        error: this.handleError.bind(this),
        drain: this.handleDrain.bind(this)
      }
    });

    // Start ping interval for connection health
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 30000);

    // Start mock data generation
    this.startMockDataGeneration();
    
    console.log(`🔴 Live Events WebSocket server started on port ${port}`);
  }

  private handleOpen(ws: WebSocket) {
    const clientId = randomUUID();
    const client: ClientConnection = {
      id: clientId,
      ws,
      subscriptions: ['all'],
      lastPing: Date.now()
    };
    
    this.clients.set(clientId, client);
    
    // Send welcome message
    this.sendToClient(clientId, {
      id: randomUUID(),
      type: 'connection_established',
      timestamp: new Date().toISOString(),
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        availableSports: ['football', 'basketball', 'soccer', 'baseball', 'hockey'],
        subscriptionOptions: ['all', 'football', 'basketball', 'soccer']
      }
    });
    
    console.log(`🟢 Client connected: ${clientId}`);
  }

  private handleClose(ws: WebSocket, code: number, message: string) {
    const clientId = this.findClientIdByWs(ws);
    if (clientId) {
      this.clients.delete(clientId);
      console.log(`🔴 Client disconnected: ${clientId} (code: ${code})`);
    }
  }

  private handleMessage(ws: WebSocket, message: string | Buffer) {
    const clientId = this.findClientIdByWs(ws);
    if (!clientId) return;

    try {
      const data = JSON.parse(message.toString());
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscription(clientId, data.subscriptions || []);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(clientId, data.subscriptions || []);
          break;
        case 'ping':
          this.handlePing(clientId);
          break;
        case 'get_events':
          this.sendCurrentEvents(clientId);
          break;
        default:
          console.log(`🟡 Unknown message type: ${data.type}`);
      }
    } catch (error) {
      console.error(`🔴 Error handling message:`, error);
      this.sendError(clientId, 'Invalid message format');
    }
  }

  private handleError(ws: WebSocket, error: Error) {
    const clientId = this.findClientIdByWs(ws);
    console.error(`🔴 WebSocket error for client ${clientId}:`, error);
  }

  private handleDrain(ws: WebSocket) {
    // Handle backpressure if needed
  }

  private handleSubscription(clientId: string, subscriptions: string[]) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions = [...new Set([...client.subscriptions, ...subscriptions])];
      this.sendToClient(clientId, {
        id: randomUUID(),
        type: 'subscription_updated',
        timestamp: new Date().toISOString(),
        data: { subscriptions: client.subscriptions }
      });
    }
  }

  private handleUnsubscription(clientId: string, subscriptions: string[]) {
    const client = this.clients.get(clientId);
    if (client) {
      client.subscriptions = client.subscriptions.filter(sub => !subscriptions.includes(sub));
      this.sendToClient(clientId, {
        id: randomUUID(),
        type: 'subscription_updated',
        timestamp: new Date().toISOString(),
        data: { subscriptions: client.subscriptions }
      });
    }
  }

  private handlePing(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
      this.sendToClient(clientId, {
        id: randomUUID(),
        type: 'pong',
        timestamp: new Date().toISOString(),
        data: { serverTime: new Date().toISOString() }
      });
    }
  }

  private sendCurrentEvents(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      const events = Array.from(this.eventData.values());
      this.sendToClient(clientId, {
        id: randomUUID(),
        type: 'current_events',
        timestamp: new Date().toISOString(),
        data: { events }
      });
    }
  }

  private sendToClient(clientId: string, data: LiveEventData | any) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  private sendError(clientId: string, message: string) {
    this.sendToClient(clientId, {
      id: randomUUID(),
      type: 'error',
      timestamp: new Date().toISOString(),
      data: { message }
    });
  }

  private findClientIdByWs(ws: WebSocket): string | null {
    for (const [clientId, client] of this.clients.entries()) {
      if (client.ws === ws) return clientId;
    }
    return null;
  }

  private pingClients() {
    const now = Date.now();
    for (const [clientId, client] of this.clients.entries()) {
      if (now - client.lastPing > 60000) { // 1 minute timeout
        client.ws.close(1000, 'Ping timeout');
        this.clients.delete(clientId);
        console.log(`🔴 Client timed out: ${clientId}`);
      }
    }
  }

  private startMockDataGeneration() {
    // Generate mock live events data every 5 seconds
    setInterval(() => {
      if (this.clients.size > 0) {
        const mockEvent: LiveEventData = {
          id: randomUUID(),
          type: 'event_update',
          timestamp: new Date().toISOString(),
          data: {
            eventId: randomUUID(),
            sport: ['football', 'basketball', 'soccer'][Math.floor(Math.random() * 3)],
            league: ['NFL', 'NBA', 'Premier League'][Math.floor(Math.random() * 3)],
            homeTeam: 'Team A',
            awayTeam: 'Team B',
            homeScore: Math.floor(Math.random() * 50),
            awayScore: Math.floor(Math.random() * 50),
            status: 'live',
            startTime: new Date().toISOString(),
            odds: {
              home: 1.5 + Math.random(),
              away: 2.0 + Math.random(),
              draw: 3.0 + Math.random()
            }
          }
        };

        // Store event data
        this.eventData.set(mockEvent.data.eventId, mockEvent.data);

        // Broadcast to subscribed clients
        for (const [clientId, client] of this.clients.entries()) {
          if (client.subscriptions.includes('all') || 
              client.subscriptions.includes(mockEvent.data.sport)) {
            this.sendToClient(clientId, mockEvent);
          }
        }
      }
    }, 5000);
  }

  public shutdown() {
    clearInterval(this.pingInterval);
    for (const [clientId, client] of this.clients.entries()) {
      client.ws.close(1000, 'Server shutdown');
    }
    this.server.close();
  }
}

// Initialize WebSocket server
let wsServer: LiveEventsWebSocket;

export const handle = async (req: Request) => {
  // This is a placeholder - the actual WebSocket handling is done by the server
  return new Response('WebSocket endpoint', { 
    status: 200,
    headers: { 'X-WebSocket-Endpoint': 'live-events' }
  });
};

// Start the WebSocket server when this module is loaded
if (typeof globalThis !== 'undefined' && !globalThis.liveEventsWs) {
  globalThis.liveEventsWs = new LiveEventsWebSocket(3004);
}

// Export for testing and manual control
export { LiveEventsWebSocket };
