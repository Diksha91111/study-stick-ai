import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomMessage extends Document {
  roomId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomMessageSchema = new Schema<IRoomMessage>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyRoom',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

RoomMessageSchema.index({ roomId: 1, createdAt: 1 });

export const RoomMessage = mongoose.model<IRoomMessage>('RoomMessage', RoomMessageSchema);
