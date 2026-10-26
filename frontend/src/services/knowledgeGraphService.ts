import axios from 'axios';

const API_BASE = '/api/knowledge-graph';

export type KnowledgeNodeType = 'subject' | 'topic' | 'concept';
export type KnowledgeNodeStatus =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'LEARNING'
  | 'WEAK'
  | 'MASTERED'
  | 'NEEDS_REVISION';
export type KnowledgeEdgeType = 'PREREQUISITE_OF' | 'PART_OF' | 'RELATED_TO';

export interface IKnowledgeEvidence {
  practiceQuizScore: number | null;
  practiceQuizCorrect: number;
  practiceQuizTotal: number;
  finalTestScore: number | null;
  finalTestCorrect: number;
  finalTestTotal: number;
  assessmentAttemptsCount: number;
  totalQuestionsAttempted: number;
  totalCorrectAnswers: number;
  accuracyPercentage: number | null;
  flashcardsTotal: number;
  flashcardsDue: number;
  lastPracticedAt: string | null;
  recentErrors: string[];
  evidenceSummary: string;
}

export interface IKnowledgeNode {
  id: string;
  title: string;
  type: KnowledgeNodeType;
  subject: string;
  topic?: string;
  description: string;
  prerequisites: string[];
  dependencies: string[];
  status: KnowledgeNodeStatus;
  mastery: number | null;
  confidence: number;
  lastPracticedAt: string | null;
  assessmentCount: number;
  correctAnswers: number;
  totalAnswers: number;
  flashcardsDue: number;
  weakConcept: boolean;
  weakReason?: string;
  evidence: IKnowledgeEvidence;
  position: { x: number; y: number };
  estimatedMinutes?: number;
}

export interface IKnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: KnowledgeEdgeType;
  label?: string;
}

export interface IKnowledgeSummary {
  totalNodes: number;
  mastered: number;
  learning: number;
  weak: number;
  needsRevision: number;
  available: number;
  locked: number;
  averageMastery: number | null;
  assessedCount: number;
  recommendedNext: {
    id: string;
    title: string;
    reason: string;
    estimatedMinutes: number;
  } | null;
}

export interface IKnowledgeGraphResponse {
  nodes: IKnowledgeNode[];
  edges: IKnowledgeEdge[];
  summary: IKnowledgeSummary;
  subjects: Array<{ id: string; name: string; count: number }>;
}

export const knowledgeGraphService = {
  getKnowledgeGraph: async (includeConcepts = true): Promise<IKnowledgeGraphResponse> => {
    const response = await axios.get(`${API_BASE}?includeConcepts=${includeConcepts}`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  getNodeDetails: async (id: string): Promise<IKnowledgeNode> => {
    const response = await axios.get(`${API_BASE}/node/${encodeURIComponent(id)}`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  getKnowledgeSummary: async (): Promise<IKnowledgeSummary> => {
    const response = await axios.get(`${API_BASE}/summary`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  getWeakConcepts: async (): Promise<IKnowledgeNode[]> => {
    const response = await axios.get(`${API_BASE}/weak-concepts`, {
      withCredentials: true,
    });
    return response.data.data;
  },

  explainWeakness: async (
    topic: string,
    mastery: number | null,
    weakReason?: string
  ): Promise<string> => {
    const response = await axios.post(
      `${API_BASE}/explain-weakness`,
      { topic, mastery, weakReason },
      { withCredentials: true }
    );
    return response.data.data.explanation;
  },
};
