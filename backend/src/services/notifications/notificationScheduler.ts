import { Notification } from '../../models/Notification.js';
import { NotificationPreferences } from '../../models/NotificationPreferences.js';
import { StudySession } from '../../models/StudySession.js';
import { Task } from '../../models/Task.js';
import { Flashcard } from '../../models/Flashcard.js';
import { LearningPath } from '../../models/LearningPath.js';
import { notificationDispatcher } from './notificationDispatcher.js';
import { QuietHoursService } from './quietHoursService.js';

export class NotificationScheduler {
  private intervalTimer: NodeJS.Timeout | null = null;
  private isProcessing: boolean = false;
  private intervalMs: number = 60000; // 1 minute

  /**
   * Start the in-process background runner
   */
  start(): void {
    if (this.intervalTimer) return;

    console.log('⏰ [Notification Scheduler] Initialized and active.');
    // Execute catch-up tick immediately on start
    this.runTick().catch((err) =>
      console.error('[Notification Scheduler] Startup tick error:', err)
    );

    this.intervalTimer = setInterval(() => {
      this.runTick().catch((err) =>
        console.error('[Notification Scheduler] Interval tick error:', err)
      );
    }, this.intervalMs);
  }

  /**
   * Stop the in-process background runner
   */
  stop(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
      console.log('🛑 [Notification Scheduler] Stopped.');
    }
  }

  /**
   * Main scheduler tick:
   * 1. Process due scheduled notifications
   * 2. Detect missed study sessions
   * 3. Evaluate daily plan triggers
   * 4. Evaluate weekly summary triggers
   */
  async runTick(): Promise<{
    processedCount: number;
    missedSessionsDetected: number;
    dailyPlansGenerated: number;
    weeklySummariesGenerated: number;
  }> {
    if (this.isProcessing) {
      return {
        processedCount: 0,
        missedSessionsDetected: 0,
        dailyPlansGenerated: 0,
        weeklySummariesGenerated: 0,
      };
    }

    this.isProcessing = true;
    let processedCount = 0;
    let missedSessionsDetected = 0;
    let dailyPlansGenerated = 0;
    let weeklySummariesGenerated = 0;

    try {
      const now = new Date();

      // 1. Process all pending notifications that are due
      const dueNotifications = await Notification.find({
        status: 'SCHEDULED',
        scheduledFor: { $lte: now },
      })
        .sort({ scheduledFor: 1 })
        .limit(100);

      for (const notif of dueNotifications) {
        const success = await notificationDispatcher.dispatchNotification(notif);
        if (success) processedCount++;
      }

      // 2. Scan for missed study sessions (planned sessions past their endTime)
      missedSessionsDetected = await this.detectAndNotifyMissedSessions(now);

      // 3. Scan for recurring Daily Plan notifications
      dailyPlansGenerated = await this.evaluateDailyPlans(now);

      // 4. Scan for Weekly Progress Summary notifications
      weeklySummariesGenerated = await this.evaluateWeeklySummaries(now);
    } catch (error) {
      console.error('[Notification Scheduler] Tick failure:', error);
    } finally {
      this.isProcessing = false;
    }

    return {
      processedCount,
      missedSessionsDetected,
      dailyPlansGenerated,
      weeklySummariesGenerated,
    };
  }

  /**
   * Detect planned study sessions that ended without completion
   */
  private async detectAndNotifyMissedSessions(now: Date): Promise<number> {
    const overdueSessions = await StudySession.find({
      status: 'planned',
      endTime: { $lt: now },
      // Look back up to 24 hours
      startTime: { $gt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
    }).limit(30);

    let count = 0;
    for (const session of overdueSessions) {
      // Mark session as missed in planner
      session.status = 'missed';
      await session.save();

      // Schedule missed session notification
      await notificationDispatcher.scheduleNotification({
        userId: session.userId.toString(),
        type: 'missed_session',
        category: 'study_sessions',
        title: 'Missed Study Session',
        message: `You missed your planned study session "${session.title}". Would you like to reschedule it?`,
        actionUrl: '/planner',
        actionLabel: 'Reschedule Session →',
        triggerTime: now,
        relatedEntityType: 'StudySession',
        relatedEntityId: session._id,
        dedupeBaseKey: `missed_session_${session._id}`,
        forceSendImmediate: true,
      });
      count++;
    }

    return count;
  }

  /**
   * Generate daily study plans at the user's preferred time in their timezone
   */
  private async evaluateDailyPlans(now: Date): Promise<number> {
    const allPrefs = await NotificationPreferences.find({
      'categories.dailyPlan': true,
    });

    let count = 0;
    for (const prefs of allPrefs) {
      const tz = prefs.timezone || 'Asia/Kolkata';
      const { hour, minute } = QuietHoursService.getLocalTimeParts(now, tz);
      const currentTimeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

      // Check if within 5-minute window of user's preferred daily plan time
      const targetTimeStr = prefs.reminderTimings.dailyPlanTime || '08:00';
      const [th, tm] = targetTimeStr.split(':').map((v) => parseInt(v, 10) || 0);
      const diffMinutes = Math.abs((hour * 60 + minute) - (th * 60 + tm));

      if (diffMinutes <= 3) {
        // Build today's date string for dedupe
        const dateStr = now.toISOString().slice(0, 10);
        const dedupeBaseKey = `daily_plan_${prefs.userId}_${dateStr}`;

        // Verify if already created today
        const existing = await Notification.findOne({
          userId: prefs.userId,
          dedupeKey: new RegExp(`^${dedupeBaseKey}`),
        });

        if (!existing) {
          // Aggregate real plan data
          const startOfDay = new Date(now);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(now);
          endOfDay.setHours(23, 59, 59, 999);

          const todaySessionsCount = await StudySession.countDocuments({
            userId: prefs.userId,
            startTime: { $gte: startOfDay, $lte: endOfDay },
          });

          const tasksDueCount = await Task.countDocuments({
            userId: prefs.userId,
            status: { $ne: 'completed' },
            dueDate: { $gte: startOfDay, $lte: endOfDay },
          });

          const flashcardsDue = await Flashcard.countDocuments({
            userId: prefs.userId,
            status: 'active',
            nextReview: { $lte: endOfDay },
          });

          const planSummary = `Today you have ${todaySessionsCount} study session(s), ${tasksDueCount} task(s) due, and ${flashcardsDue} flashcard(s) to review.`;

          await notificationDispatcher.scheduleNotification({
            userId: prefs.userId.toString(),
            type: 'daily_plan',
            category: 'daily_plan',
            title: 'Your Daily Study Plan',
            message: planSummary,
            actionUrl: '/planner',
            actionLabel: 'View Daily Planner →',
            triggerTime: now,
            dedupeBaseKey,
            forceSendImmediate: true,
          });
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Generate weekly progress summary notifications using real persisted statistics
   */
  private async evaluateWeeklySummaries(now: Date): Promise<number> {
    const allPrefs = await NotificationPreferences.find({
      'categories.weeklySummary': true,
    });

    let count = 0;
    for (const prefs of allPrefs) {
      const tz = prefs.timezone || 'Asia/Kolkata';
      // Format to get local day of week (0=Sunday ... 6=Saturday)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(now);
      const weekdayStr = parts.find((p) => p.type === 'weekday')?.value || '';
      const hourVal = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
      const minVal = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);

      const dayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
      };
      const currentDay = dayMap[weekdayStr] ?? 0;

      const targetDay = prefs.reminderTimings.weeklySummaryDay ?? 0;
      const targetTimeStr = prefs.reminderTimings.weeklySummaryTime || '19:00';
      const [th, tm] = targetTimeStr.split(':').map((v) => parseInt(v, 10) || 0);

      if (currentDay === targetDay && Math.abs((hourVal * 60 + minVal) - (th * 60 + tm)) <= 3) {
        // Dedupe key by calendar week
        const weekNumber = Math.ceil(
          (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        const dedupeBaseKey = `weekly_summary_${prefs.userId}_${now.getFullYear()}_w${weekNumber}`;

        const existing = await Notification.findOne({
          userId: prefs.userId,
          dedupeKey: new RegExp(`^${dedupeBaseKey}`),
        });

        if (!existing) {
          // Calculate REAL persisted statistics for the past 7 days
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

          const completedSessions = await StudySession.find({
            userId: prefs.userId,
            status: 'completed',
            updatedAt: { $gte: sevenDaysAgo },
          });

          const totalStudyMinutes = completedSessions.reduce(
            (acc, s) => acc + (s.durationMinutes || 0),
            0
          );

          const completedTasksCount = await Task.countDocuments({
            userId: prefs.userId,
            status: 'completed',
            updatedAt: { $gte: sevenDaysAgo },
          });

          const reviewedCardsCount = await Flashcard.countDocuments({
            userId: prefs.userId,
            lastReview: { $gte: sevenDaysAgo },
          });

          const hours = (totalStudyMinutes / 60).toFixed(1);
          const summaryMessage = `Past 7 Days Stats: Completed ${completedSessions.length} study session(s) (${hours} hrs), ${completedTasksCount} task(s), and reviewed ${reviewedCardsCount} flashcard(s). Great work!`;

          await notificationDispatcher.scheduleNotification({
            userId: prefs.userId.toString(),
            type: 'weekly_summary',
            category: 'weekly_summary',
            title: 'Your Weekly Study Progress Summary',
            message: summaryMessage,
            actionUrl: '/progress',
            actionLabel: 'View Detailed Analytics →',
            triggerTime: now,
            dedupeBaseKey,
            forceSendImmediate: true,
          });
          count++;
        }
      }
    }

    return count;
  }
}

export const notificationScheduler = new NotificationScheduler();
