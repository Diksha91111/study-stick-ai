import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomQuizSubmission {
  userId: mongoose.Types.ObjectId;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: Date;
  attemptId?: mongoose.Types.ObjectId;
}

export interface IRoomQuizSession extends Document {
  roomId: mongoose.Types.ObjectId;
  topic: string;
  title: string;
  startedBy: mongoose.Types.ObjectId;
  status: 'ACTIVE' | 'COMPLETED';
  questionIds: string[];
  submissions: IRoomQuizSubmission[];
  startedAt: Date;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoomQuizSubmissionSchema = new Schema<IRoomQuizSubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    scorePercentage: { type: Number, required: true },
    correctCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
    attemptId: { type: Schema.Types.ObjectId, ref: 'AssessmentAttempt' },
  },
  { _id: false }
);

const RoomQuizSessionSchema = new Schema<IRoomQuizSession>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyRoom',
      required: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    startedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
      index: true,
    },
    questionIds: [{ type: String }],
    submissions: [RoomQuizSubmissionSchema],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

RoomQuizSessionSchema.index({ roomId: 1, status: 1, createdAt: -1 });

export const RoomQuizSession = mongoose.model<IRoomQuizSession>(
  'RoomQuizSession',
  RoomQuizSessionSchema
);
