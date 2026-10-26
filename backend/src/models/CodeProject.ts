import mongoose, { Document, Schema } from 'mongoose';

export type SupportedLanguage =
  | 'c'
  | 'cpp'
  | 'python'
  | 'java'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'sql'
  | 'plaintext';

export interface IProjectFile {
  _id: string;
  name: string;
  path: string; // e.g. "/src/main.py"
  language: SupportedLanguage;
  content: string;
  isDirectory: boolean;
  parentPath: string; // "/" for root files
  createdAt: Date;
  updatedAt: Date;
}

export interface ICodeProject extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  defaultLanguage: SupportedLanguage;
  files: IProjectFile[];
  createdAt: Date;
  updatedAt: Date;
}

const ProjectFileSchema = new Schema<IProjectFile>(
  {
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true }, // unique within project
    language: {
      type: String,
      enum: ['c', 'cpp', 'python', 'java', 'javascript', 'typescript', 'html', 'css', 'sql', 'plaintext'],
      default: 'plaintext',
    },
    content: { type: String, default: '' },
    isDirectory: { type: Boolean, default: false },
    parentPath: { type: String, default: '/' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CodeProjectSchema = new Schema<ICodeProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    defaultLanguage: {
      type: String,
      enum: ['c', 'cpp', 'python', 'java', 'javascript', 'typescript', 'html', 'css', 'sql', 'plaintext'],
      default: 'plaintext',
    },
    files: [ProjectFileSchema],
  },
  { timestamps: true }
);

export const CodeProject = mongoose.model<ICodeProject>('CodeProject', CodeProjectSchema);
