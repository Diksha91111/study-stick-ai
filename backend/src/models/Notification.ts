import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType =
  | 'study_session'
  | 'task_deadline'
  | 'exam_reminder'
  | 'learning_path'
  | 'flashcard_review'
  | 'missed_session'
  | 'daily_plan'
  | 'weekly_summary'
  | 'system';

export type NotificationCategory =
  | 'study_sessions'
  | 'tasks'
  | 'exams'
  | 'learning_path'
  | 'flashcards'
  | 'daily_plan'
  | 'weekly_summary'
  | 'general';

export type NotificationChannel = 'in_app' | 'email' | 'whatsapp';

export type NotificationDeliveryStatus =
  | 'SCHEDULED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  scheduledFor: Date;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  readAt?: Date | null;
  failureReason?: string | null;
  retryCount: number;
  maxRetries: number;
  dedupeKey?: string | null;
  relatedEntityType?: 'StudySession' | 'Task' | 'Exam' | 'Flashcard' | 'LearningPath' | 'Other';
  relatedEntityId?: mongoose.Types.ObjectId | string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'study_session',
        'task_deadline',
        'exam_reminder',
        'learning_path',
        'flashcard_review',
        'missed_session',
        'daily_plan',
        'weekly_summary',
        'system',
      ],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'study_sessions',
        'tasks',
        'exams',
        'learning_path',
        'flashcards',
        'daily_plan',
        'weekly_summary',
        'general',
      ],
      default: 'general',
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    actionUrl: {
      type: String,
      default: '/planner',
    },
    actionLabel: {
      type: String,
      default: 'View Details',
    },
    channel: {
      type: String,
      enum: ['in_app', 'email', 'whatsapp'],
      default: 'in_app',
      index: true,
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    scheduledFor: {
      type: Date,
      required: true,
      index: true,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    dedupeKey: {
      type: String,
      default: null,
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ['StudySession', 'Task', 'Exam', 'Flashcard', 'LearningPath', 'Other'],
      default: 'Other',
    },
    relatedEntityId: {
      type: Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for idempotency and fast queries
NotificationSchema.index({ userId: 1, dedupeKey: 1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 });
NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
