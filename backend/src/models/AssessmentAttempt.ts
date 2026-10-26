import mongoose, { Document, Schema } from 'mongoose';
import { ProgrammingTopic } from './ProgrammingProgress.js';

export interface IQuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
  isManuallyGraded?: boolean;
}

export interface IAssessmentAttempt extends Document {
  userId: mongoose.Types.ObjectId;
  topic: ProgrammingTopic;
  startTime: Date;
  submissionTime: Date;
  timeTakenMinutes: number;
  questions: IQuestionResult[];
  correctAnswersCount: number;
  totalQuestions: number;
  scorePercentage: number;
  isPass: boolean;
}

const QuestionResultSchema = new Schema<IQuestionResult>(
  {
    questionId: { type: String, required: true },
    questionText: { type: String, required: true },
    userAnswer: { type: String, default: '' },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
    explanation: { type: String, required: true },
    isManuallyGraded: { type: Boolean, default: false },
  },
  { _id: false }
);

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    topic: { type: String, required: true },
    startTime: { type: Date, required: true },
    submissionTime: { type: Date, required: true },
    timeTakenMinutes: { type: Number, required: true },
    questions: [QuestionResultSchema],
    correctAnswersCount: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    scorePercentage: { type: Number, required: true },
    isPass: { type: Boolean, required: true },
  },
  { timestamps: true }
);

export const AssessmentAttempt = mongoose.model<IAssessmentAttempt>(
  'AssessmentAttempt',
  AssessmentAttemptSchema
);
