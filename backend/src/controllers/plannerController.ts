import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { plannerService } from '../services/plannerService.js';
import { StudySession } from '../models/StudySession.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { Exam } from '../models/Exam.js';
import { Task } from '../models/Task.js';
import { Flashcard } from '../models/Flashcard.js';
import { LearningPath } from '../models/LearningPath.js';
import { notificationService } from '../services/notifications/notificationService.js';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    const now = new Date();
    
    // 1. Generate/Get Study Sessions for today
    const sessions = await plannerService.generateDailySchedule(userId, now);

    // 2. Commitments (Timetable for today)
    const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const commitments = await TimetableSlot.find({ userId, dayOfWeek }).sort({ startTime: 1 });

    // 3. Upcoming Exams
    const upcomingExams = await Exam.find({ userId, status: 'upcoming', examDate: { $gte: now } })
                                  .sort({ examDate: 1 })
                                  .limit(3);

    // 4. Learning Path (Recommended activities)
    const lp = await LearningPath.findOne({ userId });
    const recommendedActivity = lp?.recommendations.find(r => r.status === 'pending') || null;

    // 5. Flashcards Due
    const flashcardsDueCount = await Flashcard.countDocuments({ userId, nextReview: { $lte: now }, status: 'active' });

    // 6. Tasks Summary
    const tasksTotal = await Task.countDocuments({ userId });
    const tasksCompleted = await Task.countDocuments({ userId, status: 'completed' });
    const tasksPending = await Task.countDocuments({ userId, status: 'pending' });
    const tasksInProgress = await Task.countDocuments({ userId, status: 'in_progress' });

    // 7. Available Study Time
    const availableBlocks = await plannerService.getAvailableTimeBlocks(userId, now);
    let totalAvailableMinutes = 0;
    availableBlocks.forEach(b => {
      totalAvailableMinutes += (b.end.getTime() - b.start.getTime()) / 60000;
    });
    
    const availableStudyTime = Math.max(0, totalAvailableMinutes);

    sendSuccess(res, {
      sessions,
      commitments,
      upcomingExams,
      recommendedActivity,
      flashcardsDueCount,
      tasksSummary: {
        total: tasksTotal,
        completed: tasksCompleted,
        pending: tasksPending,
        inProgress: tasksInProgress,
      },
      availableStudyTimeMinutes: availableStudyTime
    }, 'Dashboard retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const updateSessionStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    const { sessionId } = req.params;
    const { status } = req.body;

    if (!['completed', 'missed', 'planned'].includes(status)) {
      sendError(res, 'Invalid status', 400);
      return;
    }

    const session = await StudySession.findOneAndUpdate(
      { _id: sessionId, userId },
      { status },
      { new: true }
    );

    if (!session) {
      sendError(res, 'Session not found', 404);
      return;
    }

    // Update notifications (e.g. cancels reminder if marked completed)
    notificationService.onStudySessionCreatedOrUpdated(session).catch((err) =>
      console.error('[Session Event] Notification update error:', err)
    );

    sendSuccess(res, session, `Session marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

export const rescheduleSession = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    const { sessionId } = req.params;

    const newSession = await plannerService.rescheduleMissedSession(userId, sessionId);

    // Schedule reminder for newly rescheduled session
    if (newSession) {
      notificationService.onStudySessionCreatedOrUpdated(newSession).catch((err) =>
        console.error('[Session Event] Reschedule notification error:', err)
      );
    }

    sendSuccess(res, newSession, 'Session rescheduled successfully');
  } catch (error: any) {
    if (error.message.includes('No available time slots')) {
      sendError(res, error.message, 409, {
        code: 'NO_TIME_SLOTS_AVAILABLE'
      });
    } else {
      next(error);
    }
  }
};

export const forceRegenerateSchedule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }
    const now = new Date();
    
    // To force regenerate, we might delete "planned" sessions for today that haven't started.
    // For simplicity, we just delete all planned sessions in the future today.
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    await StudySession.deleteMany({
      userId,
      status: 'planned',
      startTime: { $gte: now, $lte: endOfDay }
    });

    const sessions = await plannerService.generateDailySchedule(userId, now);
    sendSuccess(res, sessions, 'Schedule regenerated');
  } catch (error) {
    next(error);
  }
};
