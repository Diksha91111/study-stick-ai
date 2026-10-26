import mongoose, { Document, Schema } from 'mongoose';
import { ProgrammingTopic } from './ProgrammingProgress.js';

export interface IFlashcardDeck extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardDeckSchema = new Schema<IFlashcardDeck>(
  {
    userId: {
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true }
);

export type FlashcardStatus = 'active' | 'suspended' | 'archived';
export type FlashcardDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface IFlashcard extends Document {
  userId: mongoose.Types.ObjectId;
  deckId: mongoose.Types.ObjectId;
  front: string;
  back: string;
  explanation?: string;
  example?: string;
  programmingTopic?: ProgrammingTopic;
  difficulty: FlashcardDifficulty;
  sourceReference?: string;
  status: FlashcardStatus;
  
  // SM-2 Spaced Repetition Fields
  nextReview: Date;
  lastReview?: Date;
  interval: number;
  easeFactor: number;
  repetitions: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deckId: {
      type: Schema.Types.ObjectId,
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
  },
  { timestamps: true }
);

export const FlashcardDeck = mongoose.model<IFlashcardDeck>('FlashcardDeck', FlashcardDeckSchema);
export const Flashcard = mongoose.model<IFlashcard>('Flashcard', FlashcardSchema);
