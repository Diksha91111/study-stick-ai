import api from './api';

export interface ProgressEvent {
  topic: string;
  eventId?: string;
  isCorrect?: boolean;
  isExam?: boolean;
  score?: number;
  hintUsed?: boolean;
  repeatedError?: string;
}

export interface ProgressDashboardItem {
  id: string;
  topic: string;
  attempts: number;
  correctAnswers: number;
  hintsRequested: number;
  lessonsCompleted: number;
  examQuestionsAttempted: number;
  examScoreSum: number;
  recentErrors: string[];
  lastActivity: string;
  mastery: number | null;
  status: string;
}

export const progressService = {
  recordEvent: async (data: ProgressEvent): Promise<void> => {
    await api.post('/progress/record', data);
  },

  getDashboard: async (): Promise<ProgressDashboardItem[]> => {
    const response = await api.get('/progress/dashboard');
    return response.data.data;
  },
};
