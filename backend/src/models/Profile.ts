import mongoose, { Document, Schema } from 'mongoose';

export interface IProfile extends Document {
  userId: mongoose.Types.ObjectId;
  collegeName: string;
  degree: string;
  branch: string;
  currentSemester: number;
  currentYear: number;
  targetCompetitiveExams: Array<{
    examName: string;
    targetYear?: number;
    notes?: string;
  }>;
  targetDailyStudyHours: number;
  chronotype: 'early_bird' | 'night_owl' | 'intermediate';
  pomodoroWorkMins: number;
  pomodoroBreakMins: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    collegeName: {
      type: String,
      default: '',
      trim: true,
    },
    degree: {
      type: String,
      default: 'B.Tech / B.E.',
      trim: true,
    },
    branch: {
      type: String,
      default: 'Computer Science & Engineering',
      trim: true,
    },
    currentSemester: {
      type: Number,
      default: 5,
      min: 1,
      max: 12,
    },
    currentYear: {
      type: Number,
      default: 3,
      min: 1,
      max: 6,
    },
    targetCompetitiveExams: [
      {
        examName: { type: String, required: true },
        targetYear: { type: Number },
        notes: { type: String, default: '' },
      },
    ],
    targetDailyStudyHours: {
      type: Number,
      default: 6,
      min: 1,
      max: 18,
    },
    chronotype: {
      type: String,
      enum: ['early_bird', 'night_owl', 'intermediate'],
      default: 'intermediate',
    },
    pomodoroWorkMins: {
      type: Number,
      default: 45,
      min: 15,
      max: 120,
    },
    pomodoroBreakMins: {
      type: Number,
      default: 10,
      min: 5,
      max: 30,
    },
  },
  { timestamps: true }
);

export const Profile = mongoose.model<IProfile>('Profile', ProfileSchema);
