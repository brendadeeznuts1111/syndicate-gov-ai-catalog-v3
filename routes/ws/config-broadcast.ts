// routes/ws/config-broadcast.ts - WebSocket config updates
import { z } from 'zod';

const ConfigUpdate = z.object({
  type: z.string(),
  hash: z.string(),
  data: z.any(),
  timestamp: z.string()
});

export const handle = async (req: Request, server: any) => {
  if (req.headers.get('upgrade') !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }

  const upgraded = server.upgrade(req);
  if (!upgraded) {
    return new Response('WebSocket upgrade failed', { status: 400 });
  }

  return undefined;
};

export const websocket = {
  message(ws: any, message: string) {
    try {
      const data = JSON.parse(message);
      const validated = ConfigUpdate.parse(data);
      
      // Broadcast to all connected clients
      ws.publish('config-updates', JSON.stringify({
        ...validated,
        broadcast: true,
        clients: ws.server.clients.size
      }));
      
      ws.send(JSON.stringify({
        type: 'ack',
        id: validated.hash,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        message: error.message
      }));
    }
  },

  open(ws: any) {
    console.log('🔌 WebSocket client connected');
    ws.subscribe('config-updates');
    
    ws.send(JSON.stringify({
      type: 'welcome',
      server: 'Syndicate Config Broadcast',
      protocol: 'dashboard-v1.3'
    }));
  },

  close(ws: any) {
    console.log('🔌 WebSocket client disconnected');
  },

  drain(ws: any) {
    console.log('🔌 WebSocket draining');
  }
};
