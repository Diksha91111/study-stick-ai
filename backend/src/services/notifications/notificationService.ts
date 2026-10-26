import mongoose from 'mongoose';
import {
  Notification,
  INotification,
  NotificationChannel,
} from '../../models/Notification.js';
import {
  NotificationPreferences,
  INotificationPreferences,
} from '../../models/NotificationPreferences.js';
import { User } from '../../models/User.js';
import { ITask } from '../../models/Task.js';
import { IExam } from '../../models/Exam.js';
import { IStudySession } from '../../models/StudySession.js';
import { notificationDispatcher } from './notificationDispatcher.js';
import { normalizePhoneNumber } from './WhatsAppProvider.js';

export class NotificationService {
  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<INotificationPreferences> {
    return await notificationDispatcher.getOrCreatePreferences(userId);
  }

  /**
   * Update notification preferences, validating phone number and consent
   */
  async updatePreferences(
    userId: string,
    updates: Partial<INotificationPreferences>
  ): Promise<INotificationPreferences> {
    const existing = await notificationDispatcher.getOrCreatePreferences(userId);

    // If updating WhatsApp settings, validate phone and consent
    if (updates.whatsapp) {
      if (updates.whatsapp.phoneNumber !== undefined) {
        const raw = updates.whatsapp.phoneNumber.trim();
        if (raw) {
          const normalized = normalizePhoneNumber(raw);
          if (!normalized) {
            throw new Error(
              'Invalid international phone number. Please use full international E.164 format including country code (e.g. +919876543210).'
            );
          }
          updates.whatsapp.phoneNumber = normalized;
        } else {
          updates.whatsapp.phoneNumber = '';
        }
      }

      if (updates.whatsapp.consentGiven !== undefined) {
        if (updates.whatsapp.consentGiven) {
          updates.whatsapp.consentTimestamp = new Date();
        } else {
          updates.whatsapp.consentTimestamp = null;
        }
      }
    }

    // Merge updates safely
    if (updates.inAppEnabled !== undefined) existing.inAppEnabled = updates.inAppEnabled;
    if (updates.emailEnabled !== undefined) existing.emailEnabled = updates.emailEnabled;
    if (updates.whatsappEnabled !== undefined) {
      if (updates.whatsappEnabled) {
        // Enforce consent and phone before enabling WhatsApp
        const consent = updates.whatsapp?.consentGiven ?? existing.whatsapp?.consentGiven;
        const phone = updates.whatsapp?.phoneNumber ?? existing.whatsapp?.phoneNumber;
        if (!consent) {
          throw new Error('Explicit consent is required to enable WhatsApp study reminders.');
        }
        if (!phone) {
          throw new Error('A valid international phone number is required to enable WhatsApp reminders.');
        }
      }
      existing.whatsappEnabled = updates.whatsappEnabled;
    }

    if (updates.categories) {
      existing.categories = { ...existing.categories, ...updates.categories };
    }

    if (updates.reminderTimings) {
      existing.reminderTimings = { ...existing.reminderTimings, ...updates.reminderTimings };
    }

    if (updates.quietHours) {
      existing.quietHours = { ...existing.quietHours, ...updates.quietHours };
    }

    if (updates.timezone) {
      existing.timezone = updates.timezone;
    }

    if (updates.whatsapp) {
      existing.whatsapp = { ...existing.whatsapp, ...updates.whatsapp };
    }

    await existing.save();
    return existing;
  }

  /**
   * Get user in-app notifications
   */
  async getNotifications(
    userId: string,
    options: { limit?: number; skip?: number; unreadOnly?: boolean; channel?: string }
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number }> {
    const filter: any = {
      userId,
      status: { $in: ['SENT', 'DELIVERED'] }, // User should see processed/delivered notifications
    };

    if (options.channel) {
      filter.channel = options.channel;
    } else {
      filter.channel = 'in_app';
    }

    if (options.unreadOnly) {
      filter.readAt = null;
    }

    const limit = Math.min(options.limit || 30, 100);
    const skip = options.skip || 0;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ userId, channel: 'in_app', readAt: null, status: { $in: ['SENT', 'DELIVERED'] } }),
    ]);

    return { notifications, total, unreadCount };
  }

  /**
   * Get count of unread in-app notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await Notification.countDocuments({
      userId,
      channel: 'in_app',
      readAt: null,
      status: { $in: ['SENT', 'DELIVERED'] },
    });
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<INotification | null> {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    const res = await Notification.updateMany(
      { userId, channel: 'in_app', readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.modifiedCount;
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string): Promise<boolean> {
    const res = await Notification.findOneAndDelete({ _id: notificationId, userId });
    return Boolean(res);
  }

  /**
   * Send a test notification to verify channel configuration
   */
  async sendTestNotification(
    userId: string,
    channel: NotificationChannel
  ): Promise<{ success: boolean; status: string; isSimulated?: boolean; error?: string }> {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const prefs = await this.getPreferences(userId);

    if (channel === 'whatsapp') {
      if (!prefs.whatsapp?.consentGiven) {
        throw new Error('Explicit consent is required before sending test WhatsApp messages.');
      }
      if (!prefs.whatsapp?.phoneNumber) {
        throw new Error('Please configure a valid phone number before testing WhatsApp.');
      }
    }

    const testTitle = `Test ${channel.toUpperCase()} Notification`;
    const testMessage = `This is a test notification from Study Stick AI to confirm your ${channel} reminder delivery is working smoothly.`;

    const scheduledList = await notificationDispatcher.scheduleNotification({
      userId,
      type: 'system',
      category: 'general',
      title: testTitle,
      message: testMessage,
      actionUrl: '/planner',
      actionLabel: 'Open Dashboard',
      triggerTime: new Date(),
      forceSendImmediate: true,
      dedupeBaseKey: `test_${channel}_${userId}_${Date.now()}`,
    });

    const targetNotif = scheduledList.find((n) => n.channel === channel);
    if (!targetNotif) {
      // Channel might have been disabled in preferences; create direct temporary notification to test
      const tempNotif = await Notification.create({
        userId,
        type: 'system',
        category: 'general',
        title: testTitle,
        message: testMessage,
        actionUrl: '/planner',
        actionLabel: 'Open Dashboard',
        channel,
        status: 'SCHEDULED',
        scheduledFor: new Date(),
        dedupeKey: `force_test_${channel}_${userId}_${Date.now()}`,
      });

      await notificationDispatcher.dispatchNotification(tempNotif);
      const updated = await Notification.findById(tempNotif._id);
      return {
        success: updated?.status === 'SENT' || updated?.status === 'DELIVERED',
        status: updated?.status || 'FAILED',
        isSimulated: Boolean(updated?.metadata?.isSimulated),
        error: updated?.failureReason || undefined,
      };
    }

    await notificationDispatcher.dispatchNotification(targetNotif);
    const reloaded = await Notification.findById(targetNotif._id);

    return {
      success: reloaded?.status === 'SENT' || reloaded?.status === 'DELIVERED',
      status: reloaded?.status || 'FAILED',
      isSimulated: Boolean(reloaded?.metadata?.isSimulated),
      error: reloaded?.failureReason || undefined,
    };
  }

  // ==========================================
  // EVENT INTEGRATIONS WITH STUDY STICK DATA
  // ==========================================

  /**
   * Called when a study session is created or updated
   */
  async onStudySessionCreatedOrUpdated(session: IStudySession): Promise<void> {
    if (session.status !== 'planned') {
      // If completed or cancelled, cancel future pending reminders
      await notificationDispatcher.cancelEntityNotifications('StudySession', session._id.toString());
      return;
    }

    // Cancel older pending reminders for this session first to prevent duplicate or stale timings
    await notificationDispatcher.cancelEntityNotifications('StudySession', session._id.toString());

    const title = 'Study Session Reminder';
    const message = `Your planned study session "${session.title}" starts in 15 minutes.`;

    await notificationDispatcher.scheduleNotification({
      userId: session.userId.toString(),
      type: 'study_session',
      category: 'study_sessions',
      title,
      message,
      actionUrl: '/planner',
      actionLabel: 'Open Planner →',
      triggerTime: session.startTime,
      relatedEntityType: 'StudySession',
      relatedEntityId: session._id,
      dedupeBaseKey: `session_${session._id}_start`,
    });
  }

  /**
   * Called when a study session is deleted
   */
  async onStudySessionDeleted(sessionId: string): Promise<void> {
    await notificationDispatcher.cancelEntityNotifications('StudySession', sessionId);
  }

  /**
   * Called when a task is created or updated
   */
  async onTaskCreatedOrUpdated(task: ITask): Promise<void> {
    if (task.status === 'completed') {
      await notificationDispatcher.cancelEntityNotifications('Task', task._id.toString());
      return;
    }

    // Cancel old pending reminders before re-scheduling
    await notificationDispatcher.cancelEntityNotifications('Task', task._id.toString());

    const title = 'Task Deadline Approaching';
    const message = `Your task "${task.title}" is due soon. Check milestones and keep progressing!`;

    await notificationDispatcher.scheduleNotification({
      userId: task.userId.toString(),
      type: 'task_deadline',
      category: 'tasks',
      title,
      message,
      actionUrl: '/academic',
      actionLabel: 'View Task →',
      triggerTime: task.dueDate,
      relatedEntityType: 'Task',
      relatedEntityId: task._id,
      dedupeBaseKey: `task_${task._id}_due`,
    });
  }

  /**
   * Called when a task is deleted
   */
  async onTaskDeleted(taskId: string): Promise<void> {
    await notificationDispatcher.cancelEntityNotifications('Task', taskId);
  }

  /**
   * Called when an exam is created or updated
   */
  async onExamCreatedOrUpdated(exam: IExam): Promise<void> {
    if (exam.status !== 'upcoming') {
      await notificationDispatcher.cancelEntityNotifications('Exam', exam._id.toString());
      return;
    }

    // Cancel old reminders before scheduling
    await notificationDispatcher.cancelEntityNotifications('Exam', exam._id.toString());

    const title = 'Upcoming Exam Reminder';
    const message = `Your upcoming exam "${exam.title}" is scheduled on ${new Date(exam.examDate).toLocaleDateString()}. Make sure your revision is on track!`;

    await notificationDispatcher.scheduleNotification({
      userId: exam.userId.toString(),
      type: 'exam_reminder',
      category: 'exams',
      title,
      message,
      actionUrl: '/exams',
      actionLabel: 'View Exam Syllabus →',
      triggerTime: exam.examDate,
      relatedEntityType: 'Exam',
      relatedEntityId: exam._id,
      dedupeBaseKey: `exam_${exam._id}_date`,
    });
  }

  /**
   * Called when an exam is deleted
   */
  async onExamDeleted(examId: string): Promise<void> {
    await notificationDispatcher.cancelEntityNotifications('Exam', examId);
  }

  /**
   * Schedule a flashcard review reminder
   */
  async onFlashcardsDue(userId: string, count: number): Promise<void> {
    if (count <= 0) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const title = 'Flashcards Due for Review';
    const message = `You have ${count} flashcard(s) due for spaced repetition review today. Strengthen your memory retention now!`;

    await notificationDispatcher.scheduleNotification({
      userId,
      type: 'flashcard_review',
      category: 'flashcards',
      title,
      message,
      actionUrl: '/revision',
      actionLabel: 'Review Now →',
      triggerTime: new Date(),
      forceSendImmediate: true,
      dedupeBaseKey: `flashcards_due_${userId}_${dateStr}`,
    });
  }

  /**
   * Schedule a learning path reminder
   */
  async onLearningPathReminder(userId: string, topicName: string, recommendationId?: string): Promise<void> {
    const title = 'Continue Your Learning Topic';
    const message = `Keep up momentum! Continue your study topic: "${topicName}".`;

    await notificationDispatcher.scheduleNotification({
      userId,
      type: 'learning_path',
      category: 'learning_path',
      title,
      message,
      actionUrl: '/learning-path',
      actionLabel: 'Open Learning Path →',
      triggerTime: new Date(),
      forceSendImmediate: true,
      relatedEntityType: 'LearningPath',
      relatedEntityId: recommendationId,
      dedupeBaseKey: `lp_remind_${userId}_${recommendationId || 'rec'}_${new Date().toISOString().slice(0, 10)}`,
    });
  }
}

export const notificationService = new NotificationService();
