import api from './api';

export interface FlashcardDeck {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type FlashcardStatus = 'active' | 'suspended' | 'archived';
export type FlashcardDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ReviewRating = 'Again' | 'Hard' | 'Good' | 'Easy';
export type ProgrammingTopic = string;

export interface Flashcard {
  _id: string;
  deckId: string;
  front: string;
  back: string;
  explanation?: string;
  example?: string;
  programmingTopic?: ProgrammingTopic;
  difficulty: FlashcardDifficulty;
  sourceReference?: string;
  status: FlashcardStatus;
  nextReview: string;
  lastReview?: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
}

export const flashcardService = {
  // Decks
  getDecks: async () => {
    const res = await api.get('/flashcards/decks');
    return res.data;
  },
  createDeck: async (data: { title: string; description?: string }) => {
    const res = await api.post('/flashcards/decks', data);
    return res.data;
  },
  updateDeck: async (deckId: string, data: { title?: string; description?: string }) => {
    const res = await api.put(`/flashcards/decks/${deckId}`, data);
    return res.data;
  },
  deleteDeck: async (deckId: string) => {
    const res = await api.delete(`/flashcards/decks/${deckId}`);
    return res.data;
  },

  // Cards
  getCards: async (params?: { deckId?: string; due?: boolean; topic?: string }) => {
    const res = await api.get('/flashcards/cards', { params });
    return res.data;
  },
  createCard: async (data: Partial<Flashcard>) => {
    const res = await api.post('/flashcards/cards', data);
    return res.data;
  },
  updateCard: async (cardId: string, data: Partial<Flashcard>) => {
    const res = await api.put(`/flashcards/cards/${cardId}`, data);
    return res.data;
  },
  deleteCard: async (cardId: string) => {
    const res = await api.delete(`/flashcards/cards/${cardId}`);
    return res.data;
  },
  reviewCard: async (cardId: string, rating: ReviewRating, reviewId: string) => {
    const res = await api.post(`/flashcards/cards/${cardId}/review`, { rating, reviewId });
    return res.data;
  },

  // AI
  generateCards: async (data: { topic?: string; sourceText: string; count?: number }) => {
    const res = await api.post('/flashcards/ai/generate', data);
    return res.data;
  },
};
