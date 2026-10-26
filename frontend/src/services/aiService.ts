import api, { getInMemoryAccessToken } from './api';

export type TutorMode = 'learn' | 'explain' | 'practice' | 'quiz' | 'exam' | 'coach';

export interface AISourceItem {
  filename: string;
  pageNumber?: number;
  slideNumber?: number;
  timestamp?: string;
  sectionTitle?: string;
}

export interface AIMessageItem {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: AISourceItem[];
  timestamp: string;
}

export interface AIConversationItem {
  _id: string;
  title: string;
  tutorMode: TutorMode;
  messages: AIMessageItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AIProviderStatus {
  configuredProviders: Array<{ name: string; defaultModel: string; status: string }>;
  hasActiveProvider: boolean;
}

export const aiService = {
  getConversations: async (): Promise<AIConversationItem[]> => {
    const response = await api.get('/ai/conversations');
    return response.data.data;
  },

  createConversation: async (title?: string, tutorMode?: TutorMode): Promise<AIConversationItem> => {
    const response = await api.post('/ai/conversations', { title, tutorMode });
    return response.data.data;
  },

  getConversationById: async (id: string): Promise<AIConversationItem> => {
    const response = await api.get(`/ai/conversations/${id}`);
    return response.data.data;
  },

  updateConversation: async (
    id: string,
    updates: { title?: string; tutorMode?: TutorMode }
  ): Promise<AIConversationItem> => {
    const response = await api.patch(`/ai/conversations/${id}`, updates);
    return response.data.data;
  },

  deleteConversation: async (id: string): Promise<{ id: string }> => {
    const response = await api.delete(`/ai/conversations/${id}`);
    return response.data.data;
  },

  sendChatMessage: async (data: {
    message: string;
    conversationId?: string;
    tutorMode?: TutorMode;
    preferredProvider?: string;
    resourceIds?: string[];
  }) => {
    const response = await api.post('/ai/chat', data);
    return response.data.data;
  },

  getProviderStatus: async (): Promise<AIProviderStatus> => {
    const response = await api.get('/ai/providers');
    return response.data.data;
  },

  streamChatMessage: async (
    data: {
      message: string;
      conversationId?: string;
      tutorMode?: TutorMode;
      preferredProvider?: string;
      resourceIds?: string[];
    },
    onChunk: (chunk: {
      textChunk: string;
      provider: string;
      model: string;
      done: boolean;
      conversationId?: string;
      sources?: AISourceItem[];
    }) => void,
    onDone: () => void,
    onError: (err: any) => void,
    signal?: AbortSignal
  ) => {
    try {
      const token = getInMemoryAccessToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal,
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || `Server error (${response.status})`);
      }

      if (!response.body) {
        throw new Error('Readable stream not supported by browser response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (dataStr === '[DONE]') {
              onDone();
              return;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                onError(new Error(parsed.error));
                return;
              }
              onChunk(parsed);
            } catch {
              // Ignore partial JSON
            }
          }
        }
      }
      onDone();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    }
  },
};
