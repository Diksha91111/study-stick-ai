import mongoose, { Document, Schema } from 'mongoose';

export interface ISleepSchedule extends Document {
  userId: mongoose.Types.ObjectId;
  bedTime: string; // "23:00"
  wakeTime: string; // "07:00"
  targetSleepHours: number;
  windDownMinutes: number;
  enableAlerts: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SleepScheduleSchema = new Schema<ISleepSchedule>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    bedTime: {
      type: String,
      default: '23:30',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'],
    },
    wakeTime: {
      type: String,
      default: '07:00',
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'],
    },
    targetSleepHours: {
      type: Number,
      default: 7.5,
      min: 4,
      max: 12,
    },
    windDownMinutes: {
      type: Number,
      default: 30,
      min: 0,
      max: 90,
    },
    enableAlerts: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const SleepSchedule = mongoose.model<ISleepSchedule>(
  'SleepSchedule',
  SleepScheduleSchema
);
