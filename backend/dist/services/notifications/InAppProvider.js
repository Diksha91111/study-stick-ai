"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InAppProvider = void 0;
class InAppProvider {
    channelName = 'in_app';
    async send(recipient, payload) {
        // In-app notifications are persisted in MongoDB and immediately available to the client.
        // They are considered DELIVERED to the user's inbox upon save.
        return {
            success: true,
            status: 'DELIVERED',
            messageId: `inapp_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
    }
}
exports.InAppProvider = InAppProvider;
