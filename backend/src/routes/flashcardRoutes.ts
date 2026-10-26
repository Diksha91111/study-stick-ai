import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  createDeck,
  getDecks,
  updateDeck,
  deleteDeck,
  createCard,
  getCards,
  updateCard,
  deleteCard,
  reviewCard,
  generateCardsAI,
} from '../controllers/flashcardController.js';

const router = express.Router();

router.use(requireAuth);

// Decks
router.post('/decks', createDeck);
router.get('/decks', getDecks);
router.put('/decks/:deckId', updateDeck);
router.delete('/decks/:deckId', deleteDeck);

// Cards
router.post('/cards', createCard);
router.get('/cards', getCards);
router.put('/cards/:cardId', updateCard);
router.delete('/cards/:cardId', deleteCard);
router.post('/cards/:cardId/review', reviewCard);

// AI
router.post('/ai/generate', generateCardsAI);

export default router;
