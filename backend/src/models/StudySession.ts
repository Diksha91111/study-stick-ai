import mongoose, { Document, Schema } from 'mongoose';

export type StudySessionType = 'task' | 'learning_path' | 'flashcards' | 'exam_prep';
export type StudySessionStatus = 'planned' | 'completed' | 'missed' | 'rescheduled';

export interface IStudySession extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  sessionType: StudySessionType;
  referenceId?: mongoose.Types.ObjectId; // ID of Task, Exam, or LearningRecommendation
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: StudySessionStatus;
  priorityScore: number;
  reasoning: string; // Why this session was scheduled (e.g. "Deadline approaching", "Weak topic")
  createdAt: Date;
  updatedAt: Date;
}

const StudySessionSchema = new Schema<IStudySession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    sessionType: {
      type: String,
      enum: ['task', 'learning_path', 'flashcards', 'exam_prep'],
      required: true,
    },
    referenceId: {
      type: Schema.Types.ObjectId, // Can be mixed refs, so no strict ref string
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['planned', 'completed', 'missed', 'rescheduled'],
      default: 'planned',
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    reasoning: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const StudySession = mongoose.model<IStudySession>('StudySession', StudySessionSchema);
