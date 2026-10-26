import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  code: string;
  color: string;
  credits: number;
  professor?: string;
  syllabusProgress: number; // 0 - 100
  category: 'college_core' | 'college_elective' | 'competitive_exam' | 'skill_development';
  totalHoursTarget: number;
  completedHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubjectSchema = new Schema<ISubject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      trim: true,
    },
    code: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    color: {
      type: String,
      default: '#6366f1', // Indigo default
    },
    credits: {
      type: Number,
      default: 4,
      min: 0,
      max: 12,
    },
    professor: {
      type: String,
      default: '',
      trim: true,
    },
    syllabusProgress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    category: {
      type: String,
      enum: ['college_core', 'college_elective', 'competitive_exam', 'skill_development'],
      default: 'college_core',
    },
    totalHoursTarget: {
      type: Number,
      default: 40,
      min: 0,
    },
    completedHours: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const Subject = mongoose.model<ISubject>('Subject', SubjectSchema);
