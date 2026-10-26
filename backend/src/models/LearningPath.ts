import mongoose, { Document, Schema } from 'mongoose';
import { ProgrammingTopic } from './ProgrammingProgress.js';

export type RecommendationStatus = 'pending' | 'accepted' | 'dismissed' | 'completed';

export interface ILearningRecommendation {
  _id?: mongoose.Types.ObjectId;
  topic: ProgrammingTopic;
  reason: string; // E.g., 'Prerequisite for Trees', 'Weak area detected'
  suggestedActivity: string; // E.g., 'Complete 3 Arrays exercises', 'Review recursion basics'
  estimatedMinutes: number;
  status: RecommendationStatus;
  aiExplanation?: string; // AI generated explanation
  createdAt: Date;
}

export interface ILearningPath extends Document {
  userId: mongoose.Types.ObjectId;
  currentGoal: string;
  recommendations: ILearningRecommendation[];
  updatedAt: Date;
}

const LearningRecommendationSchema = new Schema<ILearningRecommendation>(
  {
    topic: {
      type: String,
      required: true,
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
    reason: { type: String, required: true },
    suggestedActivity: { type: String, required: true },
    estimatedMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'dismissed', 'completed'],
      default: 'pending',
    },
    aiExplanation: { type: String },
    createdAt: { type: Date, default: Date.now },
  }
);

const LearningPathSchema = new Schema<ILearningPath>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    currentGoal: {
      type: String,
      default: 'Master fundamental programming concepts',
    },
    recommendations: [LearningRecommendationSchema],
  },
  { timestamps: true }
);

export const LearningPath = mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);
