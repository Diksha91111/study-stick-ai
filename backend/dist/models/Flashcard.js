"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Flashcard = exports.FlashcardDeck = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const FlashcardDeckSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: [true, 'Deck title is required'],
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
}, { timestamps: true });
const FlashcardSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    deckId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'FlashcardDeck',
        required: true,
        index: true,
    },
    front: {
        type: String,
        required: [true, 'Card front (question) is required'],
    },
    back: {
        type: String,
        required: [true, 'Card back (answer) is required'],
    },
    explanation: {
        type: String,
    },
    example: {
        type: String,
    },
    programmingTopic: {
        type: String,
        enum: [
            'Variables and data types',
            'Conditions and loops',
            'Arrays and strings',
            'Searching and sorting',
            'Recursion',
            'Linked lists, stacks, and queues',
            'Trees and graphs',
            'Dynamic programming',
            'Time and space complexity',
        ],
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'beginner',
    },
    sourceReference: {
        type: String,
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'archived'],
        default: 'active',
    },
    // SM-2 fields
    nextReview: {
        type: Date,
        default: Date.now,
        index: true,
    },
    lastReview: {
        type: Date,
    },
    interval: {
        type: Number,
        default: 0,
    },
    easeFactor: {
        type: Number,
        default: 2.5, // Standard SM-2 starting ease
    },
    repetitions: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
exports.FlashcardDeck = mongoose_1.default.model('FlashcardDeck', FlashcardDeckSchema);
exports.Flashcard = mongoose_1.default.model('Flashcard', FlashcardSchema);
