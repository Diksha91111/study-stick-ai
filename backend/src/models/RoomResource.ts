import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomResource extends Document {
  roomId: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  sharedBy: mongoose.Types.ObjectId;
  note: string;
  sharedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RoomResourceSchema = new Schema<IRoomResource>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyRoom',
      required: true,
      index: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      ref: 'StudyResource',
      required: true,
      index: true,
    },
    sharedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    note: {
      type: String,
      default: '',
      trim: true,
      maxlength: 300,
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

RoomResourceSchema.index({ roomId: 1, sharedAt: -1 });

export const RoomResource = mongoose.model<IRoomResource>(
  'RoomResource',
  RoomResourceSchema
);
