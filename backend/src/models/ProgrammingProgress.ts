import mongoose, { Document, Schema } from 'mongoose';

export type ProgrammingTopic = 
  | 'Variables and data types'
  | 'Conditions and loops'
  | 'Arrays and strings'
  | 'Searching and sorting'
  | 'Recursion'
  | 'Linked lists, stacks, and queues'
  | 'Trees and graphs'
  | 'Dynamic programming'
  | 'Time and space complexity';

export type TopicStatus = 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'PRACTICE_COMPLETED' | 'TEST_IN_PROGRESS' | 'COMPLETED' | 'NEEDS_REVISION';

export interface IProgrammingProgress extends Document {
  userId: mongoose.Types.ObjectId;
  topic: ProgrammingTopic;
  status: TopicStatus;
  attempts: number;
  correctAnswers: number;
  hintsRequested: number;
  lessonsCompleted: number;
  examScoreSum: number;
  examQuestionsAttempted: number;
  recentErrors: string[];
  lastActivity: Date;
}

const ProgrammingProgressSchema = new Schema<IProgrammingProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
    status: {
      type: String,
      enum: ['LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'PRACTICE_COMPLETED', 'TEST_IN_PROGRESS', 'COMPLETED', 'NEEDS_REVISION'],
      default: 'LOCKED',
    },
    attempts: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    hintsRequested: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    examScoreSum: { type: Number, default: 0 },
    examQuestionsAttempted: { type: Number, default: 0 },
    recentErrors: [{ type: String }],
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Enforce unique tracking per user per topic
ProgrammingProgressSchema.index({ userId: 1, topic: 1 }, { unique: true });

export const ProgrammingProgress = mongoose.model<IProgrammingProgress>(
  'ProgrammingProgress',
  ProgrammingProgressSchema
);
