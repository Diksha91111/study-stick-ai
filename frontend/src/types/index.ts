export interface ILegalConsent {
  termsAcceptedAt?: string;
  termsVersion?: string;
  privacyAcceptedAt?: string;
  privacyVersion?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isEmailVerified?: boolean;
  requiresLegalConsent?: boolean;
  legalConsent?: ILegalConsent;
}

export interface CompetitiveGoal {
  examName: string;
  targetYear?: number;
  notes?: string;
}

export interface Profile {
  _id?: string;
  userId: string;
  collegeName: string;
  degree: string;
  branch: string;
  currentSemester: number;
  currentYear: number;
  targetCompetitiveExams: CompetitiveGoal[];
  targetDailyStudyHours: number;
  chronotype: 'early_bird' | 'night_owl' | 'intermediate';
  pomodoroWorkMins: number;
  pomodoroBreakMins: number;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  color: string;
  credits: number;
  professor?: string;
  syllabusProgress: number; // 0 - 100
  category: 'college_core' | 'college_elective' | 'competitive_exam' | 'skill_development';
  totalHoursTarget: number;
  completedHours: number;
}

export type SlotType =
  | 'college_lecture'
  | 'college_lab'
  | 'college_tutorial'
  | 'self_study'
  | 'exam_prep'
  | 'break';

export interface TimetableSlot {
  _id: string;
  userId: string;
  dayOfWeek: number; // 1 = Monday ... 7 = Sunday
  startTime: string; // "09:00"
  endTime: string; // "10:30"
  slotType: SlotType;
  subjectId?: Subject | any;
  title: string;
  room?: string;
  notes?: string;
  color?: string;
}

export interface SleepSchedule {
  _id?: string;
  userId: string;
  bedTime: string;
  wakeTime: string;
  targetSleepHours: number;
  windDownMinutes: number;
  enableAlerts: boolean;
}

export type TaskType = 'assignment' | 'project' | 'practical' | 'homework' | 'other';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Milestone {
  _id?: string;
  title: string;
  completed: boolean;
}

export interface Task {
  _id: string;
  userId: string;
  subjectId?: Subject | any;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  estimatedHours: number;
  actualHours: number;
  weightagePercentage: number;
  milestones: Milestone[];
  isVivaPrepared?: boolean;
  submissionNotes?: string;
  createdAt: string;
}

export type ExamType =
  | 'college_midterm'
  | 'college_endsem'
  | 'college_unit_test'
  | 'competitive_mock'
  | 'competitive_final';

export type ExamStatus = 'upcoming' | 'completed' | 'cancelled';

export interface Exam {
  _id: string;
  userId: string;
  subjectId?: Subject | any;
  customSubjectName?: string;
  title: string;
  examType: ExamType;
  examDate: string;
  durationMinutes: number;
  venue?: string;
  syllabusCoverage?: string;
  targetScore?: number;
  totalMarks?: number;
  actualScore?: number;
  status: ExamStatus;
  notes?: string;
}

export interface DashboardStats {
  metrics: {
    totalSubjects: number;
    avgSyllabusProgress: number;
    pendingTasksCount: number;
    urgentTasksCount: number;
    completedTasksCount: number;
    upcomingExamsCount: number;
    todayCollegeHours: number;
    todayStudyHours: number;
  };
  nearestExam: Exam | null;
  todaySlots: TimetableSlot[];
  upcomingDeadlines: Array<{
    id: string;
    kind: 'task' | 'exam';
    type: string;
    title: string;
    subject: string;
    subjectColor: string;
    priority: string;
    deadline: string;
  }>;
  sleepSchedule: SleepSchedule | null;
  sleepConflicts: Array<{
    slotTitle: string;
    time: string;
    reason: string;
  }>;
}

export type NotificationType =
  | 'study_session'
  | 'task_deadline'
  | 'exam_reminder'
  | 'learning_path'
  | 'flashcard_review'
  | 'missed_session'
  | 'daily_plan'
  | 'weekly_summary'
  | 'system';

export type NotificationCategory =
  | 'study_sessions'
  | 'tasks'
  | 'exams'
  | 'learning_path'
  | 'flashcards'
  | 'daily_plan'
  | 'weekly_summary'
  | 'general';

export interface AppNotification {
  _id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  channel: 'in_app' | 'email' | 'whatsapp';
  status: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  scheduledFor: string;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  _id?: string;
  userId?: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  categories: {
    studySessions: boolean;
    tasks: boolean;
    exams: boolean;
    learningPath: boolean;
    flashcards: boolean;
    dailyPlan: boolean;
    weeklySummary: boolean;
  };
  reminderTimings: {
    studySessions: number;
    tasks: number;
    exams: number;
    dailyPlanTime: string;
    weeklySummaryDay: number;
    weeklySummaryTime: string;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  timezone: string;
  whatsapp: {
    phoneNumber: string;
    consentGiven: boolean;
    consentTimestamp?: string | null;
    verificationStatus: 'unverified' | 'verified';
  };
}

export * from './studyRoom';
