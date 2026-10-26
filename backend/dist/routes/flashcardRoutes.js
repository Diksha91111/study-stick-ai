"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_js_1 = require("../middleware/auth.js");
const flashcardController_js_1 = require("../controllers/flashcardController.js");
const router = express_1.default.Router();
router.use(auth_js_1.requireAuth);
// Decks
router.post('/decks', flashcardController_js_1.createDeck);
router.get('/decks', flashcardController_js_1.getDecks);
router.put('/decks/:deckId', flashcardController_js_1.updateDeck);
router.delete('/decks/:deckId', flashcardController_js_1.deleteDeck);
// Cards
router.post('/cards', flashcardController_js_1.createCard);
router.get('/cards', flashcardController_js_1.getCards);
router.put('/cards/:cardId', flashcardController_js_1.updateCard);
router.delete('/cards/:cardId', flashcardController_js_1.deleteCard);
router.post('/cards/:cardId/review', flashcardController_js_1.reviewCard);
// AI
router.post('/ai/generate', flashcardController_js_1.generateCardsAI);
exports.default = router;
