import { Response } from 'express';

export type RoomEventType =
  | 'focus_session_update'
  | 'member_presence'
  | 'chat_message'
  | 'task_update'
  | 'resource_shared'
  | 'quiz_update'
  | 'member_joined'
  | 'member_left'
  | 'room_updated'
  | 'ping';

interface StreamClient {
  userId: string;
  res: Response;
}

class StudyRoomStreamService {
  // Map of roomId -> Set of connected clients
  private roomClients = new Map<string, Set<StreamClient>>();
  private pingInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodic heartbeat to prevent proxies/browsers from closing idle connections
    this.pingInterval = setInterval(() => {
      this.broadcastToAll('ping', { timestamp: Date.now() });
    }, 25000);
  }

  /**
   * Register an SSE client for a room
   */
  public registerClient(roomId: string, userId: string, res: Response): () => void {
    if (!this.roomClients.has(roomId)) {
      this.roomClients.set(roomId, new Set());
    }

    const client: StreamClient = { userId, res };
    const clients = this.roomClients.get(roomId)!;
    clients.add(client);

    // Initial handshake
    res.write(`data: ${JSON.stringify({ type: 'connected', roomId, timestamp: Date.now() })}\n\n`);

    // Return cleanup callback
    return () => {
      clients.delete(client);
      if (clients.size === 0) {
        this.roomClients.delete(roomId);
      }
    };
  }

  /**
   * Broadcast an event to all connected members of a room
   */
  public broadcast(roomId: string, type: RoomEventType, data: any): void {
    const clients = this.roomClients.get(roomId);
    if (!clients || clients.size === 0) return;

    const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;

    for (const client of clients) {
      try {
        client.res.write(payload);
      } catch {
        clients.delete(client);
      }
    }
  }

  /**
   * Broadcast heartbeat ping
   */
  private broadcastToAll(type: RoomEventType, data: any): void {
    const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
    for (const [_, clients] of this.roomClients.entries()) {
      for (const client of clients) {
        try {
          client.res.write(payload);
        } catch {
          clients.delete(client);
        }
      }
    }
  }

  /**
   * Count active connections for a room
   */
  public getActiveClientCount(roomId: string): number {
    return this.roomClients.get(roomId)?.size || 0;
  }
}

export const studyRoomStreamService = new StudyRoomStreamService();
