"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCardsAI = exports.reviewCard = exports.deleteCard = exports.updateCard = exports.getCards = exports.createCard = exports.deleteDeck = exports.updateDeck = exports.getDecks = exports.createDeck = void 0;
const response_js_1 = require("../utils/response.js");
const Flashcard_js_1 = require("../models/Flashcard.js");
const spacedRepetitionService_js_1 = require("../services/spacedRepetitionService.js");
const aiOrchestrator_js_1 = require("../ai/core/aiOrchestrator.js");
const notificationService_js_1 = require("../services/notifications/notificationService.js");
// --- Decks ---
const createDeck = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { title, description } = req.body;
        if (!title) {
            (0, response_js_1.sendError)(res, 'Deck title is required', 400);
            return;
        }
        const deck = await Flashcard_js_1.FlashcardDeck.create({ userId, title, description });
        (0, response_js_1.sendSuccess)(res, deck, 'Deck created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createDeck = createDeck;
const getDecks = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const decks = await Flashcard_js_1.FlashcardDeck.find({ userId }).sort({ updatedAt: -1 });
        (0, response_js_1.sendSuccess)(res, decks, 'Decks retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getDecks = getDecks;
const updateDeck = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { deckId } = req.params;
        const { title, description } = req.body;
        const deck = await Flashcard_js_1.FlashcardDeck.findOneAndUpdate({ _id: deckId, userId }, { title, description }, { new: true, runValidators: true });
        if (!deck) {
            (0, response_js_1.sendError)(res, 'Deck not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, deck, 'Deck updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateDeck = updateDeck;
const deleteDeck = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { deckId } = req.params;
        const deck = await Flashcard_js_1.FlashcardDeck.findOneAndDelete({ _id: deckId, userId });
        if (!deck) {
            (0, response_js_1.sendError)(res, 'Deck not found', 404);
            return;
        }
        // Delete associated cards
        await Flashcard_js_1.Flashcard.deleteMany({ deckId, userId });
        (0, response_js_1.sendSuccess)(res, null, 'Deck and its cards deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDeck = deleteDeck;
// --- Cards ---
const createCard = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { deckId, front, back, explanation, example, programmingTopic, difficulty, sourceReference } = req.body;
        // Verify deck ownership
        const deck = await Flashcard_js_1.FlashcardDeck.findOne({ _id: deckId, userId });
        if (!deck) {
            (0, response_js_1.sendError)(res, 'Deck not found', 404);
            return;
        }
        // Check for exact duplicate in the same deck
        const existingCard = await Flashcard_js_1.Flashcard.findOne({ deckId, front, userId });
        if (existingCard) {
            (0, response_js_1.sendError)(res, 'A flashcard with this question already exists in the deck', 409, {
                code: 'CARD_ALREADY_EXISTS'
            });
            return;
        }
        const card = await Flashcard_js_1.Flashcard.create({
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
        (0, response_js_1.sendSuccess)(res, card, 'Card created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createCard = createCard;
const getCards = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { deckId, due, topic } = req.query;
        const query = { userId, status: 'active' };
        if (deckId)
            query.deckId = deckId;
        if (topic)
            query.programmingTopic = topic;
        if (due === 'true') {
            const now = new Date();
            query.nextReview = { $lte: now };
        }
        const cards = await Flashcard_js_1.Flashcard.find(query).sort({ nextReview: 1 });
        if (due === 'true' && cards.length > 0 && userId) {
            notificationService_js_1.notificationService.onFlashcardsDue(userId, cards.length).catch((err) => console.error('[Flashcard Event] Notification scheduling error:', err));
        }
        (0, response_js_1.sendSuccess)(res, cards, 'Cards retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getCards = getCards;
const updateCard = async (req, res, next) => {
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
        const card = await Flashcard_js_1.Flashcard.findOneAndUpdate({ _id: cardId, userId }, updates, { new: true, runValidators: true });
        if (!card) {
            (0, response_js_1.sendError)(res, 'Card not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, card, 'Card updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateCard = updateCard;
const deleteCard = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { cardId } = req.params;
        const card = await Flashcard_js_1.Flashcard.findOneAndDelete({ _id: cardId, userId });
        if (!card) {
            (0, response_js_1.sendError)(res, 'Card not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, null, 'Card deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteCard = deleteCard;
const processedReviews = new Map();
const REVIEW_TTL_MS = 60 * 1000;
const reviewCard = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { cardId } = req.params;
        const { rating, reviewId } = req.body;
        if (!['Again', 'Hard', 'Good', 'Easy'].includes(rating)) {
            (0, response_js_1.sendError)(res, 'Invalid rating', 400);
            return;
        }
        if (reviewId) {
            const now = Date.now();
            const lastSeen = processedReviews.get(reviewId);
            if (lastSeen && now - lastSeen < REVIEW_TTL_MS) {
                (0, response_js_1.sendSuccess)(res, null, 'Duplicate review event ignored');
                return;
            }
            processedReviews.set(reviewId, now);
            if (processedReviews.size > 1000) {
                for (const [key, timestamp] of processedReviews.entries()) {
                    if (now - timestamp > REVIEW_TTL_MS)
                        processedReviews.delete(key);
                }
            }
        }
        const card = await Flashcard_js_1.Flashcard.findOne({ _id: cardId, userId });
        if (!card) {
            (0, response_js_1.sendError)(res, 'Card not found', 404);
            return;
        }
        const { interval, easeFactor, repetitions, nextReviewDate } = (0, spacedRepetitionService_js_1.calculateSM2)(rating, card.interval, card.easeFactor, card.repetitions);
        card.interval = interval;
        card.easeFactor = easeFactor;
        card.repetitions = repetitions;
        card.nextReview = nextReviewDate;
        card.lastReview = new Date();
        await card.save();
        (0, response_js_1.sendSuccess)(res, card, 'Card reviewed successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.reviewCard = reviewCard;
// --- AI Generation ---
const generateCardsAI = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { topic, sourceText, count = 3 } = req.body;
        if (!sourceText) {
            (0, response_js_1.sendError)(res, 'Source text is required for AI generation', 400);
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
            const response = await aiOrchestrator_js_1.aiOrchestrator.processRequest({
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
            (0, response_js_1.sendSuccess)(res, parsedCards, 'Cards generated successfully');
        }
        catch (aiError) {
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
            (0, response_js_1.sendSuccess)(res, fallbackCards, 'Cards generated using fallback due to AI error');
        }
    }
    catch (error) {
        next(error);
    }
};
exports.generateCardsAI = generateCardsAI;
