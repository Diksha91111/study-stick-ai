import api from './api';

export interface PrerequisiteMap {
  [key: string]: string[];
}

export interface LearningRecommendation {
  _id: string;
  topic: string;
  reason: string;
  suggestedActivity: string;
  estimatedMinutes: number;
  status: 'pending' | 'accepted' | 'dismissed' | 'completed';
  aiExplanation?: string;
  createdAt: string;
}

export interface LearningPath {
  userId: string;
  currentGoal: string;
  recommendations: LearningRecommendation[];
}

export interface LearningPathData {
  path: LearningPath;
  prerequisites: PrerequisiteMap;
  states: Record<string, { status: string; mastery: number | null }>;
  progressList: any[];
}

export interface TopicConcept {
  name: string;
  description: string;
}

export interface TopicExample {
  title: string;
  code: string;
  explanation: string;
}

export interface TopicResource {
  title: string;
  type: 'Guide' | 'Documentation' | 'Video' | 'Practice';
  description: string;
}

export interface TopicContent {
  topic: string;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedMinutes: number;
  weightage: string;
  objectives: string[];
  detailedExplanation: string;
  coreConcepts: TopicConcept[];
  examples: TopicExample[];
  importantPoints: string[];
  commonMistakes: string[];
  quickRevision: string[];
  learningResources: TopicResource[];
}

export interface QuizQuestion {
  id: string;
  questionText: string;
  type: 'mcq' | 'true_false';
  options: string[];
  concept: string;
}

export interface QuestionReviewItem {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  concept: string;
}

export interface QuizSubmissionResult {
  attemptId: string;
  topic: string;
  isPass: boolean;
  score: number;
  totalQuestions: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  questionsReview: QuestionReviewItem[];
  weakConcepts: string[];
  status: string;
  states: Record<string, { status: string; mastery: number | null }>;
  progressList: any[];
  nextTopic?: { topic: string; status: string } | null;
}

export const learningPathService = {
  getPath: async (goal?: string): Promise<LearningPathData> => {
    const url = goal ? `/learning-path?goal=${encodeURIComponent(goal)}` : '/learning-path';
    const response = await api.get(url);
    return response.data.data;
  },

  startTopic: async (topic: string): Promise<LearningPathData> => {
    const response = await api.post('/learning-path/start-topic', { topic });
    return response.data.data;
  },

  updateRecommendation: async (id: string, status: 'accepted' | 'dismissed' | 'completed'): Promise<LearningPathData> => {
    const response = await api.patch(`/learning-path/recommendation/${id}`, { status });
    return response.data.data;
  },

  getTopicContent: async (topic: string): Promise<TopicContent> => {
    const response = await api.get(`/learning-path/topic-content/${encodeURIComponent(topic)}`);
    return response.data.data.content;
  },

  generateAssessment: async (topic: string): Promise<QuizQuestion[]> => {
    const response = await api.post('/learning-path/assessment/generate', { topic });
    return response.data.data.assessment;
  },

  submitAssessment: async (
    topic: string, 
    userAnswers: { questionId: string; selectedAnswer: string }[], 
    timeTakenMinutes: number
  ): Promise<QuizSubmissionResult> => {
    const response = await api.post('/learning-path/assessment/submit', { topic, userAnswers, timeTakenMinutes });
    return response.data.data;
  },

  askAITutor: async (topic: string, question: string): Promise<string> => {
    const response = await api.post('/learning-path/ai-tutor', { topic, question });
    return response.data.data.answer;
  }
};
