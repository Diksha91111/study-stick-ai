import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  categories: {
    studySessions: boolean;
    tasks: boolean;
    exams: boolean;
    learningPath: boolean;
    flashcards: boolean;
    dailyPlan: boolean;
    weeklySummary: boolean;
  };
  reminderTimings: {
    studySessions: number; // minutes before (e.g. 15)
    tasks: number; // minutes before (e.g. 1440 = 1 day)
    exams: number; // minutes before (e.g. 4320 = 3 days)
    dailyPlanTime: string; // HH:mm format, e.g. "08:00"
    weeklySummaryDay: number; // 0=Sunday, 1=Monday, etc.
    weeklySummaryTime: string; // HH:mm format, e.g. "19:00"
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm, e.g. "22:30"
    endTime: string; // HH:mm, e.g. "07:00"
  };
  timezone: string; // e.g. "Asia/Kolkata", "UTC"
  whatsapp: {
    phoneNumber: string; // E.164 format, e.g. "+919876543210"
    consentGiven: boolean;
    consentTimestamp?: Date | null;
    verificationStatus: 'unverified' | 'verified';
  };
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPreferencesSchema = new Schema<INotificationPreferences>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    inAppEnabled: {
      type: Boolean,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      default: true,
    },
    whatsappEnabled: {
      type: Boolean,
      default: false,
    },
    categories: {
      studySessions: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      exams: { type: Boolean, default: true },
      learningPath: { type: Boolean, default: true },
      flashcards: { type: Boolean, default: true },
      dailyPlan: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true },
    },
    reminderTimings: {
      studySessions: { type: Number, default: 15 }, // 15 mins before
      tasks: { type: Number, default: 1440 }, // 1 day before
      exams: { type: Number, default: 4320 }, // 3 days before
      dailyPlanTime: { type: String, default: '08:00' },
      weeklySummaryDay: { type: Number, default: 0 }, // Sunday
      weeklySummaryTime: { type: String, default: '19:00' },
    },
    quietHours: {
      enabled: { type: Boolean, default: true },
      startTime: { type: String, default: '22:30' },
      endTime: { type: String, default: '07:00' },
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    whatsapp: {
      phoneNumber: { type: String, default: '', trim: true },
      consentGiven: { type: Boolean, default: false },
      consentTimestamp: { type: Date, default: null },
      verificationStatus: {
        type: String,
        enum: ['unverified', 'verified'],
        default: 'unverified',
      },
    },
  },
  { timestamps: true }
);

export const NotificationPreferences = mongoose.model<INotificationPreferences>(
  'NotificationPreferences',
  NotificationPreferencesSchema
);
