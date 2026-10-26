"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationMemory = void 0;
class ConversationMemoryManager {
    store = new Map();
    maxMessagesPerConversation = 20;
    getHistory(conversationId) {
        if (!conversationId)
            return [];
        return this.store.get(conversationId) || [];
    }
    addMessage(conversationId, message) {
        if (!conversationId)
            return;
        const current = this.store.get(conversationId) || [];
        current.push(message);
        // Trim old messages if exceeding capacity, preserving system messages if present
        if (current.length > this.maxMessagesPerConversation) {
            const systemMessages = current.filter((m) => m.role === 'system');
            const otherMessages = current.filter((m) => m.role !== 'system');
            const trimmedOthers = otherMessages.slice(otherMessages.length - (this.maxMessagesPerConversation - systemMessages.length));
            this.store.set(conversationId, [...systemMessages, ...trimmedOthers]);
        }
        else {
            this.store.set(conversationId, current);
        }
    }
    clearHistory(conversationId) {
        this.store.delete(conversationId);
    }
    hasConversation(conversationId) {
        return this.store.has(conversationId);
    }
}
exports.conversationMemory = new ConversationMemoryManager();
