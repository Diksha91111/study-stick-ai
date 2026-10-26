import mongoose, { Document, Schema } from 'mongoose';

export type RoomPrivacy = 'public' | 'private' | 'PUBLIC' | 'PRIVATE';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MemberStatus = 'ACTIVE' | 'BANNED';
export type SessionStatus = 'RUNNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type MemberPresenceStatus = 'ONLINE' | 'STUDYING' | 'BREAK' | 'OFFLINE';

export interface IRoomMember {
  userId: mongoose.Types.ObjectId;
  role: MemberRole;
  joinedAt: Date;
  status: MemberStatus;
  presenceStatus?: MemberPresenceStatus;
  lastActiveAt?: Date;
}

export interface ISessionParticipant {
  userId: mongoose.Types.ObjectId;
  status: 'STUDYING' | 'BREAK';
  joinedAt: Date;
}

export interface IActiveFocusSession {
  sessionId: string;
  goal: string;
  durationMinutes: number;
  startedAt: Date;
  pausedAt?: Date | null;
  totalPausedMs: number;
  status: SessionStatus;
  startedBy: mongoose.Types.ObjectId;
  participants: ISessionParticipant[];
}

export interface IStudyRoom extends Document {
  name: string;
  description: string;
  goal: string;
  privacy: RoomPrivacy;
  inviteCode: string;
  ownerId: mongoose.Types.ObjectId;
  members: IRoomMember[];
  maxMembers: number;
  defaultFocusDuration: number;
  status: 'ACTIVE' | 'ARCHIVED';
  activeSession?: IActiveFocusSession | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoomMemberSchema = new Schema<IRoomMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['OWNER', 'ADMIN', 'MEMBER'], default: 'MEMBER' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'BANNED'], default: 'ACTIVE' },
    presenceStatus: {
      type: String,
      enum: ['ONLINE', 'STUDYING', 'BREAK', 'OFFLINE'],
      default: 'ONLINE',
    },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SessionParticipantSchema = new Schema<ISessionParticipant>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['STUDYING', 'BREAK'], default: 'STUDYING' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ActiveFocusSessionSchema = new Schema<IActiveFocusSession>(
  {
    sessionId: { type: String, required: true },
    goal: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 240 },
    startedAt: { type: Date, required: true },
    pausedAt: { type: Date, default: null },
    totalPausedMs: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['RUNNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      default: 'ACTIVE',
    },
    startedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [SessionParticipantSchema],
  },
  { _id: false }
);

const StudyRoomSchema = new Schema<IStudyRoom>(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    goal: {
      type: String,
      required: [true, 'Study goal is required'],
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    privacy: {
      type: String,
      enum: ['public', 'private', 'PUBLIC', 'PRIVATE'],
      default: 'private',
      set: (val: string) => (val ? val.toLowerCase() : 'private'),
      index: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [RoomMemberSchema],
    maxMembers: {
      type: Number,
      default: 20,
      min: 2,
      max: 100,
    },
    defaultFocusDuration: {
      type: Number,
      default: 45,
      enum: [25, 45, 60, 90],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    activeSession: {
      type: ActiveFocusSessionSchema,
      default: null,
    },
  },
  { timestamps: true }
);

StudyRoomSchema.index({ 'members.userId': 1, status: 1 });
StudyRoomSchema.index({ privacy: 1, status: 1 });

export const StudyRoom = mongoose.model<IStudyRoom>('StudyRoom', StudyRoomSchema);
