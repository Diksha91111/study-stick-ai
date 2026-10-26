import mongoose from 'mongoose';
import {
  Notification,
  INotification,
  NotificationChannel,
  NotificationCategory,
  NotificationType,
} from '../../models/Notification.js';
import {
  NotificationPreferences,
  INotificationPreferences,
} from '../../models/NotificationPreferences.js';
import { User } from '../../models/User.js';
import { InAppProvider } from './InAppProvider.js';
import { EmailProvider } from './EmailProvider.js';
import { WhatsAppProvider } from './WhatsAppProvider.js';
import { QuietHoursService } from './quietHoursService.js';
import { NotificationPayload } from './types.js';

export interface ScheduleEventOptions {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  triggerTime: Date; // The event time (e.g., session start, task due date)
  reminderMinutesBefore?: number; // How many minutes before to notify (defaults to user preference)
  relatedEntityType?: 'StudySession' | 'Task' | 'Exam' | 'Flashcard' | 'LearningPath' | 'Other';
  relatedEntityId?: string | mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  dedupeBaseKey?: string;
  forceSendImmediate?: boolean;
}

export class NotificationDispatcher {
  private inAppProvider: InAppProvider;
  private emailProvider: EmailProvider;
  private whatsAppProvider: WhatsAppProvider;

  constructor() {
    this.inAppProvider = new InAppProvider();
    this.emailProvider = new EmailProvider();
    this.whatsAppProvider = new WhatsAppProvider();
  }

  getWhatsAppProvider(): WhatsAppProvider {
    return this.whatsAppProvider;
  }

  /**
   * Fetch or create default notification preferences for a user
   */
  async getOrCreatePreferences(userId: string): Promise<INotificationPreferences> {
    let prefs = await NotificationPreferences.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreferences.create({
        userId,
        inAppEnabled: true,
        emailEnabled: true,
        whatsappEnabled: false,
        categories: {
          studySessions: true,
          tasks: true,
          exams: true,
          learningPath: true,
          flashcards: true,
          dailyPlan: true,
          weeklySummary: true,
        },
        reminderTimings: {
          studySessions: 15,
          tasks: 1440,
          exams: 4320,
          dailyPlanTime: '08:00',
          weeklySummaryDay: 0,
          weeklySummaryTime: '19:00',
        },
        quietHours: {
          enabled: true,
          startTime: '22:30',
          endTime: '07:00',
        },
        timezone: 'Asia/Kolkata',
        whatsapp: {
          phoneNumber: '',
          consentGiven: false,
          consentTimestamp: null,
          verificationStatus: 'unverified',
        },
      });
    }
    return prefs;
  }

  /**
   * Schedule a notification across all enabled channels respecting preferences, deduplication, and quiet hours
   */
  async scheduleNotification(options: ScheduleEventOptions): Promise<INotification[]> {
    const {
      userId,
      type,
      category,
      title,
      message,
      actionUrl,
      actionLabel,
      triggerTime,
      relatedEntityType = 'Other',
      relatedEntityId,
      metadata = {},
      dedupeBaseKey,
      forceSendImmediate = false,
    } = options;

    const prefs = await this.getOrCreatePreferences(userId);

    // 1. Check if category is enabled in user preferences
    const categoryKeyMap: Record<NotificationCategory, keyof INotificationPreferences['categories']> = {
      study_sessions: 'studySessions',
      tasks: 'tasks',
      exams: 'exams',
      learning_path: 'learningPath',
      flashcards: 'flashcards',
      daily_plan: 'dailyPlan',
      weekly_summary: 'weeklySummary',
      general: 'studySessions',
    };

    const prefCategoryKey = categoryKeyMap[category];
    if (prefCategoryKey && prefs.categories && prefs.categories[prefCategoryKey] === false) {
      // User disabled this category
      return [];
    }

    // 2. Determine lead time
    let minutesBefore = options.reminderMinutesBefore;
    if (minutesBefore === undefined) {
      if (category === 'study_sessions') minutesBefore = prefs.reminderTimings.studySessions;
      else if (category === 'tasks') minutesBefore = prefs.reminderTimings.tasks;
      else if (category === 'exams') minutesBefore = prefs.reminderTimings.exams;
      else minutesBefore = 0;
    }

    // 3. Compute initial scheduled time
    let scheduledFor = forceSendImmediate
      ? new Date()
      : new Date(triggerTime.getTime() - minutesBefore * 60 * 1000);

    // If scheduled time is in the past by more than 1 hour and not forceSendImmediate, skip creating stale reminders
    if (!forceSendImmediate && scheduledFor.getTime() < Date.now() - 60 * 60 * 1000) {
      return [];
    }

    // 4. Adjust for quiet hours (shift to end of quiet hours if scheduled time falls within them)
    if (!forceSendImmediate && prefs.quietHours?.enabled) {
      scheduledFor = QuietHoursService.getNextAllowedTime(
        scheduledFor,
        prefs.timezone || 'Asia/Kolkata',
        prefs.quietHours
      );
    }

    // 5. Determine active channels
    const channels: NotificationChannel[] = [];
    if (prefs.inAppEnabled) channels.push('in_app');
    if (prefs.emailEnabled) channels.push('email');
    if (prefs.whatsappEnabled && prefs.whatsapp?.consentGiven && prefs.whatsapp?.phoneNumber) {
      channels.push('whatsapp');
    }

    const createdNotifications: INotification[] = [];

    for (const channel of channels) {
      const dedupeKey = dedupeBaseKey
        ? `${dedupeBaseKey}_${channel}_${scheduledFor.toISOString().slice(0, 13)}`
        : `${userId}_${type}_${relatedEntityId || 'none'}_${channel}_${scheduledFor.toISOString().slice(0, 13)}`;

      // Check for existing notification with this dedupeKey
      const existing = await Notification.findOne({ userId, dedupeKey });
      if (existing) {
        continue;
      }

      try {
        const notif = await Notification.create({
          userId,
          type,
          category,
          title,
          message,
          actionUrl,
          actionLabel,
          channel,
          status: 'SCHEDULED',
          scheduledFor,
          relatedEntityType,
          relatedEntityId: relatedEntityId ? new mongoose.Types.ObjectId(relatedEntityId.toString()) : null,
          dedupeKey,
          metadata,
        });

        createdNotifications.push(notif);
      } catch (err: any) {
        // If unique index collision on dedupeKey, ignore duplicate gracefully
        if (err.code !== 11000) {
          console.error(`Error saving notification for channel ${channel}:`, err);
        }
      }
    }

    return createdNotifications;
  }

  /**
   * Cancel pending notifications for an entity (e.g. deleted task or cancelled exam)
   */
  async cancelEntityNotifications(
    relatedEntityType: string,
    relatedEntityId: string | mongoose.Types.ObjectId
  ): Promise<number> {
    const res = await Notification.updateMany(
      {
        relatedEntityType,
        relatedEntityId: new mongoose.Types.ObjectId(relatedEntityId.toString()),
        status: 'SCHEDULED',
      },
      {
        $set: { status: 'CANCELLED' },
      }
    );
    return res.modifiedCount;
  }

  /**
   * Process a single notification delivery
   */
  async dispatchNotification(notification: INotification): Promise<boolean> {
    // Lock notification atomically
    const lockedNotif = await Notification.findOneAndUpdate(
      { _id: notification._id, status: 'SCHEDULED' },
      { $set: { status: 'PROCESSING' } },
      { new: true }
    );

    if (!lockedNotif) {
      return false; // Already locked or processed by another worker
    }

    const user = await User.findById(lockedNotif.userId);
    const prefs = await NotificationPreferences.findOne({ userId: lockedNotif.userId });

    if (!user) {
      await Notification.updateOne(
        { _id: lockedNotif._id },
        { $set: { status: 'FAILED', failedAt: new Date(), failureReason: 'User not found' } }
      );
      return false;
    }

    const payload: NotificationPayload = {
      title: lockedNotif.title,
      message: lockedNotif.message,
      category: lockedNotif.category,
      type: lockedNotif.type,
      actionUrl: lockedNotif.actionUrl,
      actionLabel: lockedNotif.actionLabel,
      metadata: lockedNotif.metadata,
    };

    let result: { success: boolean; status: 'SENT' | 'DELIVERED' | 'FAILED'; error?: string; messageId?: string; isSimulated?: boolean } = {
      success: false,
      status: 'FAILED',
      error: 'Unsupported channel',
    };

    try {
      if (lockedNotif.channel === 'in_app') {
        result = await this.inAppProvider.send({ userId: user._id.toString() }, payload);
      } else if (lockedNotif.channel === 'email') {
        result = await this.emailProvider.send(
          { userId: user._id.toString(), email: user.email, name: user.name },
          payload
        );
      } else if (lockedNotif.channel === 'whatsapp') {
        result = await this.whatsAppProvider.send(
          {
            userId: user._id.toString(),
            phone: prefs?.whatsapp?.phoneNumber,
            consentGiven: Boolean(prefs?.whatsapp?.consentGiven),
            name: user.name,
          },
          payload
        );
      }
    } catch (sendErr: any) {
      result = {
        success: false,
        status: 'FAILED',
        error: sendErr.message || 'Exception during provider delivery',
      };
    }

    if (result.success) {
      await Notification.updateOne(
        { _id: lockedNotif._id },
        {
          $set: {
            status: result.status,
            sentAt: new Date(),
            deliveredAt: result.status === 'DELIVERED' ? new Date() : null,
            failureReason: null,
            ...(result.isSimulated && { 'metadata.isSimulated': true }),
            ...(result.messageId && { 'metadata.providerMessageId': result.messageId }),
          },
        }
      );
      return true;
    } else {
      const isPermanentError =
        result.error?.includes('consent') ||
        result.error?.includes('Invalid or unnormalized') ||
        result.error?.includes('missing') ||
        result.error?.includes('User not found');

      if (isPermanentError || lockedNotif.retryCount >= lockedNotif.maxRetries) {
        await Notification.updateOne(
          { _id: lockedNotif._id },
          {
            $set: {
              status: 'FAILED',
              failedAt: new Date(),
              failureReason: result.error || 'Provider rejected notification',
            },
          }
        );
      } else {
        // Schedule retry with exponential backoff (e.g. 5m, 15m)
        const backoffMinutes = Math.pow(3, lockedNotif.retryCount + 1);
        const retryTime = new Date(Date.now() + backoffMinutes * 60 * 1000);

        await Notification.updateOne(
          { _id: lockedNotif._id },
          {
            $set: {
              status: 'SCHEDULED',
              scheduledFor: retryTime,
              failureReason: `Attempt ${lockedNotif.retryCount + 1} failed: ${result.error}`,
            },
            $inc: { retryCount: 1 },
          }
        );
      }
      return false;
    }
  }
}

export const notificationDispatcher = new NotificationDispatcher();
