import { AIMessage } from '../types/ai.types.js';

class ConversationMemoryManager {
  private store: Map<string, AIMessage[]> = new Map();
  private readonly maxMessagesPerConversation: number = 20;

  getHistory(conversationId: string): AIMessage[] {
    if (!conversationId) return [];
    return this.store.get(conversationId) || [];
  }

  addMessage(conversationId: string, message: AIMessage): void {
    if (!conversationId) return;

    const current = this.store.get(conversationId) || [];
    current.push(message);

    // Trim old messages if exceeding capacity, preserving system messages if present
    if (current.length > this.maxMessagesPerConversation) {
      const systemMessages = current.filter((m) => m.role === 'system');
      const otherMessages = current.filter((m) => m.role !== 'system');
      const trimmedOthers = otherMessages.slice(
        otherMessages.length - (this.maxMessagesPerConversation - systemMessages.length)
      );
      this.store.set(conversationId, [...systemMessages, ...trimmedOthers]);
    } else {
      this.store.set(conversationId, current);
    }
  }

  clearHistory(conversationId: string): void {
    this.store.delete(conversationId);
  }

  hasConversation(conversationId: string): boolean {
    return this.store.has(conversationId);
  }
}

export const conversationMemory = new ConversationMemoryManager();
