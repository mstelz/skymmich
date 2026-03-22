import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';

export class WsManager {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log(`WebSocket client connected (${this.clients.size} total)`);

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log(`WebSocket client disconnected (${this.clients.size} total)`);
      });

      ws.on('error', (err) => {
        console.error('WebSocket client error:', err);
        this.clients.delete(ws);
      });
    });
  }

  broadcast(event: string, data: unknown) {
    const message = JSON.stringify({ event, data });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }
}
