import mongoose, { Document, Schema } from 'mongoose';

export type TaskType = 'assignment' | 'project' | 'practical' | 'homework' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface IMilestone {
  _id?: mongoose.Types.ObjectId;
  title: string;
  completed: boolean;
}

export interface ITask extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  estimatedHours: number;
  actualHours: number;
  weightagePercentage: number;
  milestones: IMilestone[];
  isVivaPrepared?: boolean; // For practicals
  submissionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    taskType: {
      type: String,
      enum: ['assignment', 'project', 'practical', 'homework', 'other'],
      default: 'assignment',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    estimatedHours: {
      type: Number,
      default: 2,
      min: 0,
    },
    actualHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    weightagePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    milestones: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    isVivaPrepared: {
      type: Boolean,
      default: false,
    },
    submissionNotes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Task = mongoose.model<ITask>('Task', TaskSchema);
