import mongoose, { Document, Schema } from 'mongoose';

export type ExamType =
  | 'college_midterm'
  | 'college_endsem'
  | 'college_unit_test'
  | 'competitive_mock'
  | 'competitive_final';

export type ExamStatus = 'upcoming' | 'completed' | 'cancelled';

export interface IExam extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  customSubjectName?: string;
  title: string;
  examType: ExamType;
  examDate: Date;
  durationMinutes: number;
  venue?: string;
  syllabusCoverage?: string;
  targetScore?: number;
  totalMarks?: number;
  actualScore?: number;
  status: ExamStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExamSchema = new Schema<IExam>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    customSubjectName: {
      type: String,
      default: '',
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Exam title is required'],
      trim: true,
    },
    examType: {
      type: String,
      enum: [
        'college_midterm',
        'college_endsem',
        'college_unit_test',
        'competitive_mock',
        'competitive_final',
      ],
      default: 'college_midterm',
    },
    examDate: {
      type: Date,
      required: [true, 'Exam date & time is required'],
    },
    durationMinutes: {
      type: Number,
      default: 180,
      min: 15,
    },
    venue: {
      type: String,
      default: '',
      trim: true,
    },
    syllabusCoverage: {
      type: String,
      default: '',
    },
    targetScore: {
      type: Number,
      default: 85,
    },
    totalMarks: {
      type: Number,
      default: 100,
    },
    actualScore: {
      type: Number,
    },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
