export type RoomRole = 'OWNER' | 'ADMIN' | 'MEMBER';
export type MemberPresence = 'ONLINE' | 'STUDYING' | 'BREAK' | 'OFFLINE';
export type RoomPrivacy = 'PUBLIC' | 'PRIVATE' | 'public' | 'private';
export type FocusSessionStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface IRoomUserInfo {
  _id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export interface IRoomMember {
  userId: IRoomUserInfo;
  role: RoomRole;
  presence: MemberPresence;
  lastActiveAt: string;
  joinedAt: string;
}

export interface ISessionParticipant {
  userId: string;
  status: 'STUDYING' | 'BREAK' | 'LEFT';
  joinedAt: string;
}

export interface IActiveFocusSession {
  sessionId: string;
  goal: string;
  durationMinutes: number;
  startedBy: { _id: string; name: string } | string;
  startedAt: string;
  pausedAt?: string | null;
  totalPausedMs: number;
  status: FocusSessionStatus;
  participants: ISessionParticipant[];
  remainingSeconds: number;
  targetEndAt?: string;
}

export interface IStudyRoom {
  _id: string;
  name: string;
  description?: string;
  goal: string;
  privacy: RoomPrivacy;
  ownerId: IRoomUserInfo;
  inviteCode?: string;
  maxMembers: number;
  defaultFocusDurationMinutes: number;
  members: IRoomMember[];
  activeSession?: IActiveFocusSession | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

export interface IRoomMessage {
  _id: string;
  roomId: string;
  senderId: IRoomUserInfo;
  content: string;
  type: 'CHAT' | 'SYSTEM' | 'AI_SUMMARY';
  createdAt: string;
  editedAt?: string;
}

export interface IRoomTask {
  _id: string;
  roomId: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  createdBy: { _id: string; name: string };
  completedBy?: { _id: string; name: string };
  completedAt?: string;
  createdAt: string;
}

export interface ISharedResourceInfo {
  _id: string;
  title: string;
  fileType: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  mimeType: string;
}

export interface IRoomResource {
  _id: string;
  roomId: string;
  resourceId: ISharedResourceInfo;
  title: string;
  sharedBy: { _id: string; name: string };
  notes?: string;
  createdAt: string;
}

export interface IQuizQuestion {
  question: string;
  options: string[];
  explanation?: string;
}

export interface IQuizSubmission {
  userId: string;
  score: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
}

export interface IRoomQuizSession {
  _id: string;
  roomId: string;
  title: string;
  topic: string;
  status: 'ACTIVE' | 'COMPLETED';
  createdBy: { _id: string; name: string };
  questions: IQuizQuestion[];
  submissions: IQuizSubmission[];
  aggregate: {
    participantCount: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
  };
  createdAt: string;
}

export interface IRoomProgress {
  myProgress: {
    focusTimeMinutes: number;
    completedSessions: number;
    tasksCompleted: number;
    quizzesAttempted: number;
    averageQuizScore: number;
    resourcesShared: number;
  };
  roomActivity: {
    totalSessions: number;
    totalFocusTimeMinutes: number;
    tasksCompleted: number;
    totalTasks: number;
    totalQuizzes: number;
    totalMembers: number;
  };
}

export interface IRoomStreamEvent {
  event: string;
  data: any;
}
