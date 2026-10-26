import mongoose, { Document, Schema } from 'mongoose';

export type TutorMode = 'learn' | 'explain' | 'practice' | 'quiz' | 'exam' | 'coach';

export interface IAIMessage {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: Array<{
    filename: string;
    pageNumber?: number;
    slideNumber?: number;
    timestamp?: string;
    sectionTitle?: string;
  }>;
  timestamp: Date;
}

export interface IAIConversation extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  tutorMode: TutorMode;
  messages: IAIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const AIMessageSchema = new Schema<IAIMessage>(
  {
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sources: {
      type: [Schema.Types.Mixed],
      default: undefined,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const AIConversationSchema = new Schema<IAIConversation>(
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
      trim: true,
      default: 'New Study Session',
    },
    tutorMode: {
      type: String,
      enum: ['learn', 'explain', 'practice', 'quiz', 'exam', 'coach'],
      default: 'learn',
    },
    messages: [AIMessageSchema],
  },
  { timestamps: true }
);

export const AIConversation = mongoose.model<IAIConversation>(
  'AIConversation',
  AIConversationSchema
);
