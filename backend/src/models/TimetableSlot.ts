import mongoose, { Document, Schema } from 'mongoose';

export type SlotType =
  | 'college_lecture'
  | 'college_lab'
  | 'college_tutorial'
  | 'self_study'
  | 'exam_prep'
  | 'break';

export interface ITimetableSlot extends Document {
  userId: mongoose.Types.ObjectId;
  dayOfWeek: number; // 1 = Monday, 2 = Tuesday, ... 7 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  slotType: SlotType;
  subjectId?: mongoose.Types.ObjectId;
  title: string;
  room?: string;
  notes?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimetableSlotSchema = new Schema<ITimetableSlot>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 1,
      max: 7, // 1 = Mon ... 7 = Sun
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'],
    },
    slotType: {
      type: String,
      enum: [
        'college_lecture',
        'college_lab',
        'college_tutorial',
        'self_study',
        'exam_prep',
        'break',
      ],
      default: 'college_lecture',
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    room: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
  },
  { timestamps: true }
);

export const TimetableSlot = mongoose.model<ITimetableSlot>(
  'TimetableSlot',
  TimetableSlotSchema
);
