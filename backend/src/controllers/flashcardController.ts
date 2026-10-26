import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { FlashcardDeck, Flashcard } from '../models/Flashcard.js';
import { calculateSM2, ReviewRating } from '../services/spacedRepetitionService.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';
import { ProgrammingTopic } from '../models/ProgrammingProgress.js';
import { notificationService } from '../services/notifications/notificationService.js';

// --- Decks ---

export const createDeck = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { title, description } = req.body;

    if (!title) {
      sendError(res, 'Deck title is required', 400);
      return;
    }

    const deck = await FlashcardDeck.create({ userId, title, description });
    sendSuccess(res, deck, 'Deck created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getDecks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const decks = await FlashcardDeck.find({ userId }).sort({ updatedAt: -1 });
    sendSuccess(res, decks, 'Decks retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateDeck = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deckId } = req.params;
    const { title, description } = req.body;

    const deck = await FlashcardDeck.findOneAndUpdate(
      { _id: deckId, userId },
      { title, description },
      { new: true, runValidators: true }
    );

    if (!deck) {
      sendError(res, 'Deck not found', 404);
      return;
    }

    sendSuccess(res, deck, 'Deck updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteDeck = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deckId } = req.params;

    const deck = await FlashcardDeck.findOneAndDelete({ _id: deckId, userId });
    if (!deck) {
      sendError(res, 'Deck not found', 404);
      return;
    }

    // Delete associated cards
    await Flashcard.deleteMany({ deckId, userId });

    sendSuccess(res, null, 'Deck and its cards deleted successfully');
  } catch (error) {
    next(error);
  }
};

// --- Cards ---

export const createCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deckId, front, back, explanation, example, programmingTopic, difficulty, sourceReference } = req.body;

    // Verify deck ownership
    const deck = await FlashcardDeck.findOne({ _id: deckId, userId });
    if (!deck) {
      sendError(res, 'Deck not found', 404);
      return;
    }

    // Check for exact duplicate in the same deck
    const existingCard = await Flashcard.findOne({ deckId, front, userId });
    if (existingCard) {
      sendError(res, 'A flashcard with this question already exists in the deck', 409, {
        code: 'CARD_ALREADY_EXISTS'
      });
      return;
    }

    const card = await Flashcard.create({
      userId,
      deckId,
      front,
      back,
      explanation,
      example,
      programmingTopic,
      difficulty,
      sourceReference,
    });

    sendSuccess(res, card, 'Card created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getCards = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { deckId, due, topic } = req.query;

    const query: any = { userId, status: 'active' };
    if (deckId) query.deckId = deckId;
    if (topic) query.programmingTopic = topic;

    if (due === 'true') {
      const now = new Date();
      query.nextReview = { $lte: now };
    }

    const cards = await Flashcard.find(query).sort({ nextReview: 1 });

    if (due === 'true' && cards.length > 0 && userId) {
      notificationService.onFlashcardsDue(userId, cards.length).catch((err) =>
        console.error('[Flashcard Event] Notification scheduling error:', err)
      );
    }

    sendSuccess(res, cards, 'Cards retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId } = req.params;
    const updates = req.body;

    // Don't allow SM2 algorithm fields or ownership to be updated directly here
    delete updates.userId;
    delete updates.nextReview;
    delete updates.lastReview;
    delete updates.interval;
    delete updates.easeFactor;
    delete updates.repetitions;

    const card = await Flashcard.findOneAndUpdate(
      { _id: cardId, userId },
      updates,
      { new: true, runValidators: true }
    );

    if (!card) {
      sendError(res, 'Card not found', 404);
      return;
    }

    sendSuccess(res, card, 'Card updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId } = req.params;

    const card = await Flashcard.findOneAndDelete({ _id: cardId, userId });
    if (!card) {
      sendError(res, 'Card not found', 404);
      return;
    }

    sendSuccess(res, null, 'Card deleted successfully');
  } catch (error) {
    next(error);
  }
};

const processedReviews = new Map<string, number>();
const REVIEW_TTL_MS = 60 * 1000;

export const reviewCard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { cardId } = req.params;
    const { rating, reviewId } = req.body;

    if (!['Again', 'Hard', 'Good', 'Easy'].includes(rating)) {
      sendError(res, 'Invalid rating', 400);
      return;
    }

    if (reviewId) {
      const now = Date.now();
      const lastSeen = processedReviews.get(reviewId);
      if (lastSeen && now - lastSeen < REVIEW_TTL_MS) {
        sendSuccess(res, null, 'Duplicate review event ignored');
        return;
      }
      processedReviews.set(reviewId, now);
      
      if (processedReviews.size > 1000) {
        for (const [key, timestamp] of processedReviews.entries()) {
           if (now - timestamp > REVIEW_TTL_MS) processedReviews.delete(key);
        }
      }
    }

    const card = await Flashcard.findOne({ _id: cardId, userId });
    if (!card) {
      sendError(res, 'Card not found', 404);
      return;
    }

    const { interval, easeFactor, repetitions, nextReviewDate } = calculateSM2(
      rating as ReviewRating,
      card.interval,
      card.easeFactor,
      card.repetitions
    );

    card.interval = interval;
    card.easeFactor = easeFactor;
    card.repetitions = repetitions;
    card.nextReview = nextReviewDate;
    card.lastReview = new Date();

    await card.save();

    sendSuccess(res, card, 'Card reviewed successfully');
  } catch (error) {
    next(error);
  }
};

// --- AI Generation ---

export const generateCardsAI = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { topic, sourceText, count = 3 } = req.body;

    if (!sourceText) {
      sendError(res, 'Source text is required for AI generation', 400);
      return;
    }

    const prompt = `Generate ${count} flashcards based ONLY on the following source text.
Topic: ${topic || 'General Programming'}
Source Text: """${sourceText}"""

Requirements:
1. Provide a clear question (front) and concise answer (back).
2. Include a short explanation.
3. Include a code example if applicable (optional).
4. Do NOT fabricate information not present in the source text.
5. Return the response as a JSON array of objects with the following keys:
   "front" (string), "back" (string), "explanation" (string), "example" (string).
   Do not include any other markdown or text outside the JSON array.`;

    try {
      const response = await aiOrchestrator.processRequest({
        message: prompt,
        taskType: 'summarization', // Using summarization or generic
        options: {
          systemInstruction: 'You are an expert programming tutor that creates flashcards in JSON format.',
          temperature: 0.2, // Lower temperature for structured JSON
        }
      });

      let jsonText = response.text || '[]';
      // Basic cleanup in case AI wrapped in markdown code blocks
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsedCards = JSON.parse(jsonText);
      
      if (!Array.isArray(parsedCards)) {
        throw new Error('AI did not return a valid JSON array');
      }

      sendSuccess(res, parsedCards, 'Cards generated successfully');
    } catch (aiError: any) {
      // Handle quota failures or malformed responses
      console.error('AI Generation Error:', aiError);
      
      // Provide deterministic fallback if AI fails
      const fallbackCards = [
        {
          front: `What is the main concept discussed in: "${sourceText.substring(0, 30)}..."?`,
          back: 'Please review the source text to verify the main concept.',
          explanation: 'AI generation failed due to quota or parsing error. This is a placeholder.',
          example: '',
        }
      ];
      
      sendSuccess(res, fallbackCards, 'Cards generated using fallback due to AI error');
    }

  } catch (error) {
    next(error);
  }
};
