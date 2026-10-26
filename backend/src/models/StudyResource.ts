import mongoose, { Document, Schema } from 'mongoose';

export type ResourceType =
  | 'image'
  | 'pdf'
  | 'presentation'
  | 'document'
  | 'video'
  | 'video_link';

export type ResourceProcessingStatus =
  | 'UPLOADING'
  | 'PROCESSING'
  | 'READY'
  | 'FAILED';

export interface IResourceChunk {
  chunkIndex: number;
  text: string;
  pageNumber?: number;
  slideNumber?: number;
  startTimeSeconds?: number;
  endTimeSeconds?: number;
  sectionTitle?: string;
}

export interface IStudyResource extends Document {
  userId: mongoose.Types.ObjectId;
  conversationId?: mongoose.Types.ObjectId | null;
  originalFilename: string;
  storedFilename: string;
  filePath?: string;
  mimeType: string;
  resourceType: ResourceType;
  fileSizeBytes: number;
  processingStatus: ResourceProcessingStatus;
  failureReason?: string | null;
  extractedText: string;
  chunks: IResourceChunk[];
  pageCount?: number;
  slideCount?: number;
  videoDuration?: number;
  videoUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceChunkSchema = new Schema<IResourceChunk>(
  {
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    pageNumber: { type: Number },
    slideNumber: { type: Number },
    startTimeSeconds: { type: Number },
    endTimeSeconds: { type: Number },
    sectionTitle: { type: String },
  },
  { _id: false }
);

const StudyResourceSchema = new Schema<IStudyResource>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'AIConversation',
      default: null,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    storedFilename: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
    },
    mimeType: {
      type: String,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['image', 'pdf', 'presentation', 'document', 'video', 'video_link'],
      required: true,
      index: true,
    },
    fileSizeBytes: {
      type: Number,
      default: 0,
    },
    processingStatus: {
      type: String,
      enum: ['UPLOADING', 'PROCESSING', 'READY', 'FAILED'],
      default: 'PROCESSING',
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    extractedText: {
      type: String,
      default: '',
    },
    chunks: [ResourceChunkSchema],
    pageCount: {
      type: Number,
    },
    slideCount: {
      type: Number,
    },
    videoDuration: {
      type: Number,
    },
    videoUrl: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

StudyResourceSchema.index({ userId: 1, createdAt: -1 });
StudyResourceSchema.index({ userId: 1, processingStatus: 1 });

export const StudyResource = mongoose.model<IStudyResource>(
  'StudyResource',
  StudyResourceSchema
);
