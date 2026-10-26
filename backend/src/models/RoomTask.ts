import mongoose, { Document, Schema } from 'mongoose';

export type RoomTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export interface IRoomTask extends Document {
  roomId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  createdBy: mongoose.Types.ObjectId;
  status: RoomTaskStatus;
  dueDate?: Date | null;
  completedBy?: mongoose.Types.ObjectId | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoomTaskSchema = new Schema<IRoomTask>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyRoom',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      default: 'PENDING',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

RoomTaskSchema.index({ roomId: 1, status: 1, createdAt: -1 });

export const RoomTask = mongoose.model<IRoomTask>('RoomTask', RoomTaskSchema);
