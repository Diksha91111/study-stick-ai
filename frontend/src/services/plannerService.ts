import api from './api';

export interface StudySession {
  _id: string;
  userId: string;
  title: string;
  sessionType: 'task' | 'learning_path' | 'flashcards' | 'exam_prep';
  referenceId?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: 'planned' | 'completed' | 'missed' | 'rescheduled';
  priorityScore: number;
  reasoning: string;
}

export interface PlannerDashboard {
  sessions: StudySession[];
  commitments: any[]; // TimetableSlots
  upcomingExams: any[]; // Exams
  recommendedActivity: any; // LearningRecommendation
  flashcardsDueCount: number;
  tasksSummary: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
  };
  availableStudyTimeMinutes: number;
}

export const plannerService = {
  getDashboard: async (): Promise<PlannerDashboard> => {
    const res = await api.get('/planner/dashboard');
    return res.data.data;
  },
  
  forceRegenerate: async (): Promise<StudySession[]> => {
    const res = await api.post('/planner/generate');
    return res.data.data;
  },

  updateSessionStatus: async (sessionId: string, status: 'completed' | 'missed' | 'planned'): Promise<StudySession> => {
    const res = await api.put(`/planner/sessions/${sessionId}/status`, { status });
    return res.data.data;
  },

  rescheduleSession: async (sessionId: string): Promise<StudySession> => {
    const res = await api.post(`/planner/sessions/${sessionId}/reschedule`);
    return res.data.data;
  },
};
