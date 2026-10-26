import api, { getInMemoryAccessToken } from './api';
import {
  IStudyRoom,
  IRoomMember,
  IRoomMessage,
  IRoomTask,
  IRoomResource,
  IRoomQuizSession,
  IRoomProgress,
  RoomRole,
  MemberPresence,
} from '../types/studyRoom';

export interface CreateRoomInput {
  name: string;
  description?: string;
  goal: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  maxMembers?: number;
  defaultFocusDurationMinutes?: number;
}

export interface StartSessionInput {
  goal?: string;
  durationMinutes: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface ShareResourceInput {
  resourceId: string;
  notes?: string;
}

export interface StartQuizInput {
  title: string;
  topic: string;
  questionCount?: number;
}

export interface AskAIInput {
  action: 'EXPLAIN' | 'PRACTICE' | 'SUMMARIZE' | 'HINT' | 'REVISION';
  prompt?: string;
  topic?: string;
  resourceId?: string;
}

export const studyRoomService = {
  // Room listing and discovery
  async getMyRooms(): Promise<IStudyRoom[]> {
    const { data } = await api.get('/study-rooms');
    return data.data || [];
  },

  async getPublicRooms(): Promise<IStudyRoom[]> {
    const { data } = await api.get('/study-rooms/public');
    return data.data || [];
  },

  async createRoom(input: CreateRoomInput): Promise<IStudyRoom> {
    const { data } = await api.post('/study-rooms', input);
    return data.data;
  },

  async getRoom(roomId: string): Promise<IStudyRoom> {
    const { data } = await api.get(`/study-rooms/${roomId}`);
    return data.data;
  },

  async updateRoom(roomId: string, updates: Partial<CreateRoomInput>): Promise<IStudyRoom> {
    const { data } = await api.patch(`/study-rooms/${roomId}`, updates);
    return data.data;
  },

  async archiveRoom(roomId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.delete(`/study-rooms/${roomId}`);
    return data;
  },

  // Joining and leaving
  async joinRoomByInvite(inviteCode: string): Promise<IStudyRoom> {
    const { data } = await api.post('/study-rooms/join', { inviteCode });
    return data.data;
  },

  async leaveRoom(roomId: string): Promise<{ success: boolean; message: string }> {
    const { data } = await api.post(`/study-rooms/${roomId}/leave`);
    return data;
  },

  async regenerateInvite(roomId: string): Promise<{ inviteCode: string }> {
    const { data } = await api.post(`/study-rooms/${roomId}/invite/regenerate`);
    return data.data;
  },

  // Members and presence
  async getMembers(roomId: string): Promise<IRoomMember[]> {
    const { data } = await api.get(`/study-rooms/${roomId}/members`);
    return data.data || [];
  },

  async updateMemberRole(roomId: string, userId: string, role: RoomRole): Promise<IRoomMember> {
    const { data } = await api.patch(`/study-rooms/${roomId}/members/${userId}/role`, { role });
    return data.data;
  },

  async removeMember(roomId: string, userId: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/study-rooms/${roomId}/members/${userId}`);
    return data;
  },

  async updatePresence(roomId: string, presence: MemberPresence): Promise<IRoomMember> {
    const { data } = await api.patch(`/study-rooms/${roomId}/presence`, { presence });
    return data.data;
  },

  // Focus sessions
  async startFocusSession(roomId: string, input: StartSessionInput) {
    const { data } = await api.post(`/study-rooms/${roomId}/sessions`, input);
    return data.data;
  },

  async controlFocusSession(roomId: string, action: 'PAUSE' | 'RESUME' | 'END') {
    const { data } = await api.post(`/study-rooms/${roomId}/sessions/control`, { action });
    return data.data;
  },

  async participantFocusAction(roomId: string, action: 'JOIN' | 'BREAK' | 'RESUME' | 'LEAVE') {
    const { data } = await api.post(`/study-rooms/${roomId}/sessions/participant`, { action });
    return data.data;
  },

  // Chat
  async getMessages(roomId: string): Promise<IRoomMessage[]> {
    const { data } = await api.get(`/study-rooms/${roomId}/messages`);
    return data.data || [];
  },

  async sendMessage(roomId: string, content: string): Promise<IRoomMessage> {
    const { data } = await api.post(`/study-rooms/${roomId}/messages`, { content });
    return data.data;
  },

  async deleteMessage(roomId: string, messageId: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/study-rooms/${roomId}/messages/${messageId}`);
    return data;
  },

  // Tasks
  async getTasks(roomId: string): Promise<IRoomTask[]> {
    const { data } = await api.get(`/study-rooms/${roomId}/tasks`);
    return data.data || [];
  },

  async createTask(roomId: string, input: CreateTaskInput): Promise<IRoomTask> {
    const { data } = await api.post(`/study-rooms/${roomId}/tasks`, input);
    return data.data;
  },

  async updateTask(roomId: string, taskId: string, updates: Partial<IRoomTask>): Promise<IRoomTask> {
    const { data } = await api.patch(`/study-rooms/${roomId}/tasks/${taskId}`, updates);
    return data.data;
  },

  // Resources
  async getResources(roomId: string): Promise<IRoomResource[]> {
    const { data } = await api.get(`/study-rooms/${roomId}/resources`);
    return data.data || [];
  },

  async shareResource(roomId: string, input: ShareResourceInput): Promise<IRoomResource> {
    const { data } = await api.post(`/study-rooms/${roomId}/resources`, input);
    return data.data;
  },

  // Quizzes
  async getQuizzes(roomId: string): Promise<IRoomQuizSession[]> {
    const { data } = await api.get(`/study-rooms/${roomId}/quizzes`);
    return data.data || [];
  },

  async startQuiz(roomId: string, input: StartQuizInput): Promise<IRoomQuizSession> {
    const { data } = await api.post(`/study-rooms/${roomId}/quizzes`, input);
    return data.data;
  },

  async submitQuiz(roomId: string, quizId: string, answers: number[]): Promise<any> {
    const { data } = await api.post(`/study-rooms/${roomId}/quizzes/${quizId}/submit`, { answers });
    return data.data;
  },

  // AI Assistant
  async askAI(roomId: string, input: AskAIInput): Promise<any> {
    const { data } = await api.post(`/study-rooms/${roomId}/ai`, input);
    return data.data;
  },

  // Progress
  async getProgress(roomId: string): Promise<IRoomProgress> {
    const { data } = await api.get(`/study-rooms/${roomId}/progress`);
    return data.data;
  },

  // SSE Stream
  subscribeToRoomStream(
    roomId: string,
    onMessage: (event: string, payload: any) => void,
    onError?: (err: any) => void
  ): () => void {
    const token = getInMemoryAccessToken();
    const query = token ? `?token=${encodeURIComponent(token)}` : '';
    const eventSource = new EventSource(`/api/study-rooms/${roomId}/stream${query}`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed?.event) {
          onMessage(parsed.event, parsed.data);
        }
      } catch (e) {
        // Heartbeat or ping comment
      }
    };

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  },
};
