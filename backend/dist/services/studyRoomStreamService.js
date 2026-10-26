"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studyRoomStreamService = void 0;
class StudyRoomStreamService {
    // Map of roomId -> Set of connected clients
    roomClients = new Map();
    pingInterval = null;
    constructor() {
        // Periodic heartbeat to prevent proxies/browsers from closing idle connections
        this.pingInterval = setInterval(() => {
            this.broadcastToAll('ping', { timestamp: Date.now() });
        }, 25000);
    }
    /**
     * Register an SSE client for a room
     */
    registerClient(roomId, userId, res) {
        if (!this.roomClients.has(roomId)) {
            this.roomClients.set(roomId, new Set());
        }
        const client = { userId, res };
        const clients = this.roomClients.get(roomId);
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
    broadcast(roomId, type, data) {
        const clients = this.roomClients.get(roomId);
        if (!clients || clients.size === 0)
            return;
        const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
        for (const client of clients) {
            try {
                client.res.write(payload);
            }
            catch {
                clients.delete(client);
            }
        }
    }
    /**
     * Broadcast heartbeat ping
     */
    broadcastToAll(type, data) {
        const payload = `data: ${JSON.stringify({ type, data, timestamp: Date.now() })}\n\n`;
        for (const [_, clients] of this.roomClients.entries()) {
            for (const client of clients) {
                try {
                    client.res.write(payload);
                }
                catch {
                    clients.delete(client);
                }
            }
        }
    }
    /**
     * Count active connections for a room
     */
    getActiveClientCount(roomId) {
        return this.roomClients.get(roomId)?.size || 0;
    }
}
exports.studyRoomStreamService = new StudyRoomStreamService();
