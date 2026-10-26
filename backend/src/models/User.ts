import mongoose, { Document, Schema } from 'mongoose';

export interface ILegalConsent {
  termsAcceptedAt?: Date;
  termsVersion?: string;
  privacyAcceptedAt?: Date;
  privacyVersion?: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  isEmailVerified: boolean;
  verificationTokenHash?: string | null;
  verificationTokenExpires?: Date | null;
  resetTokenHash?: string | null;
  resetTokenExpires?: Date | null;
  refreshTokenHash?: string | null;
  avatar?: string;
  legalConsent?: ILegalConsent;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationTokenHash: {
      type: String,
      select: false,
    },
    verificationTokenExpires: {
      type: Date,
      select: false,
    },
    resetTokenHash: {
      type: String,
      select: false,
    },
    resetTokenExpires: {
      type: Date,
      select: false,
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    legalConsent: {
      termsAcceptedAt: { type: Date },
      termsVersion: { type: String },
      privacyAcceptedAt: { type: Date },
      privacyVersion: { type: String },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
