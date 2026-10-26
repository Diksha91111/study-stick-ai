import mongoose from 'mongoose';
import assert from 'assert';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Task } from '../models/Task.js';
import { Exam } from '../models/Exam.js';
import { StudySession } from '../models/StudySession.js';
import { Notification, INotification } from '../models/Notification.js';
import { NotificationPreferences } from '../models/NotificationPreferences.js';
import { notificationService } from '../services/notifications/notificationService.js';
import { notificationDispatcher } from '../services/notifications/notificationDispatcher.js';
import { notificationScheduler } from '../services/notifications/notificationScheduler.js';
import { QuietHoursService } from '../services/notifications/quietHoursService.js';
import {
  normalizePhoneNumber,
  maskPhoneNumber,
  WhatsAppProvider,
} from '../services/notifications/WhatsAppProvider.js';

async function runAllNotificationTests() {
  console.log('======================================================================');
  console.log('🧪 RUNNING PRODUCTION-ORIENTED NOTIFICATIONS & REMINDERS TEST SUITE');
  console.log('======================================================================\n');

  await mongoose.connect(ENV.MONGODB_URI);
  console.log('✅ Connected to MongoDB.');

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(e.stack || e.message || e);
      failed++;
    }
  }

  // Create two distinct test users for isolation and cross-user tests
  const timestamp = Date.now();
  const testUserA = await User.create({
    name: 'Test Student Alpha',
    email: `notif.test.alpha.${timestamp}@studystick.ai`,
    password: 'hashedPassword123',
    isEmailVerified: true,
  });

  const testUserB = await User.create({
    name: 'Test Student Beta',
    email: `notif.test.beta.${timestamp}@studystick.ai`,
    password: 'hashedPassword123',
    isEmailVerified: true,
  });

  const userIdA = testUserA._id.toString();
  const userIdB = testUserB._id.toString();

  try {
    // 1. In-app notification creation
    await test('1. In-app notification creation', async () => {
      const scheduled = await notificationDispatcher.scheduleNotification({
        userId: userIdA,
        type: 'study_session',
        category: 'study_sessions',
        title: 'Your study session starts in 15 minutes',
        message: 'Get ready for Algorithms session',
        triggerTime: new Date(Date.now() + 15 * 60 * 1000),
        forceSendImmediate: true,
      });

      const inApp = scheduled.find((n) => n.channel === 'in_app');
      assert.ok(inApp, 'In-app notification must be created');
      assert.strictEqual(inApp.title, 'Your study session starts in 15 minutes');

      // Dispatch and check status transition
      await notificationDispatcher.dispatchNotification(inApp);
      const reloaded = await Notification.findById(inApp._id);
      assert.strictEqual(reloaded?.status, 'DELIVERED', 'In-app notification should be DELIVERED upon dispatch');
    });

    // 2. Read/unread state
    await test('2. Read/unread state', async () => {
      const unreadCountBefore = await notificationService.getUnreadCount(userIdA);
      const { notifications } = await notificationService.getNotifications(userIdA, { unreadOnly: true });
      assert.ok(notifications.length > 0, 'Should have at least 1 unread notification');

      const target = notifications[0];
      const updated = await notificationService.markAsRead(userIdA, target._id.toString());
      assert.ok(updated?.readAt !== null, 'readAt should be populated');

      const unreadCountAfter = await notificationService.getUnreadCount(userIdA);
      assert.strictEqual(unreadCountAfter, unreadCountBefore - 1, 'Unread count should decrease by 1');
    });

    // 3. Email enabled
    await test('3. Email enabled', async () => {
      await notificationService.updatePreferences(userIdA, { emailEnabled: true });
      const scheduled = await notificationDispatcher.scheduleNotification({
        userId: userIdA,
        type: 'task_deadline',
        category: 'tasks',
        title: 'Task due tomorrow',
        message: 'Complete CS301 Assignment',
        triggerTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        forceSendImmediate: true,
        dedupeBaseKey: `email_test_${timestamp}`,
      });

      const emailNotif = scheduled.find((n) => n.channel === 'email');
      assert.ok(emailNotif, 'Email notification should be scheduled when emailEnabled is true');

      // Dispatch email notification
      await notificationDispatcher.dispatchNotification(emailNotif);
      const reloaded = await Notification.findById(emailNotif._id);
      assert.ok(
        reloaded?.status === 'SENT' || (reloaded?.failureReason && reloaded?.status === 'SCHEDULED'),
        'Email should be marked as SENT or queued for retry on SMTP auth failure'
      );
    });

    // 4. Email disabled
    await test('4. Email disabled', async () => {
      await notificationService.updatePreferences(userIdA, { emailEnabled: false });
      const scheduled = await notificationDispatcher.scheduleNotification({
        userId: userIdA,
        type: 'task_deadline',
        category: 'tasks',
        title: 'Task due tomorrow',
        message: 'Complete CS301 Assignment',
        triggerTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        forceSendImmediate: true,
        dedupeBaseKey: `email_disabled_test_${timestamp}`,
      });

      const emailNotif = scheduled.find((n) => n.channel === 'email');
      assert.strictEqual(emailNotif, undefined, 'Email notification should NOT be scheduled when emailEnabled is false');
    });

    // 5. WhatsApp enabled + valid consent
    await test('5. WhatsApp enabled + valid consent', async () => {
      await notificationService.updatePreferences(userIdA, {
        whatsapp: {
          phoneNumber: '+919876543210',
          consentGiven: true,
          verificationStatus: 'verified',
        },
        whatsappEnabled: true,
      });

      const prefs = await notificationService.getPreferences(userIdA);
      assert.strictEqual(prefs.whatsappEnabled, true);
      assert.strictEqual(prefs.whatsapp.consentGiven, true);
      assert.strictEqual(prefs.whatsapp.phoneNumber, '+919876543210');

      const scheduled = await notificationDispatcher.scheduleNotification({
        userId: userIdA,
        type: 'exam_reminder',
        category: 'exams',
        title: 'Upcoming Exam Reminder',
        message: 'Operating Systems exam in 3 days',
        triggerTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
        forceSendImmediate: true,
        dedupeBaseKey: `wa_valid_test_${timestamp}`,
      });

      const waNotif = scheduled.find((n) => n.channel === 'whatsapp');
      assert.ok(waNotif, 'WhatsApp notification should be scheduled when enabled with valid consent');

      await notificationDispatcher.dispatchNotification(waNotif);
      const reloaded = await Notification.findById(waNotif._id);
      assert.strictEqual(reloaded?.status, 'SENT', 'WhatsApp notification should be SENT');
      assert.strictEqual(reloaded?.metadata?.isSimulated, true, 'Development run should be clearly labeled simulated');
    });

    // 6. WhatsApp disabled
    await test('6. WhatsApp disabled', async () => {
      await notificationService.updatePreferences(userIdA, { whatsappEnabled: false });
      const scheduled = await notificationDispatcher.scheduleNotification({
        userId: userIdA,
        type: 'exam_reminder',
        category: 'exams',
        title: 'Upcoming Exam Reminder',
        message: 'Exam reminder',
        triggerTime: new Date(Date.now() + 72 * 60 * 60 * 1000),
        forceSendImmediate: true,
        dedupeBaseKey: `wa_disabled_test_${timestamp}`,
      });

      const waNotif = scheduled.find((n) => n.channel === 'whatsapp');
      assert.strictEqual(waNotif, undefined, 'WhatsApp notification should NOT be scheduled when disabled');
    });

    // 7. WhatsApp without consent
    await test('7. WhatsApp without consent', async () => {
      let rejected = false;
      try {
        await notificationService.updatePreferences(userIdA, {
          whatsapp: { phoneNumber: '+919876543210', consentGiven: false, verificationStatus: 'unverified' },
          whatsappEnabled: true,
        });
      } catch (err: any) {
        rejected = true;
        assert.ok(err.message.includes('consent'), 'Error should specify consent is required');
      }
      assert.strictEqual(rejected, true, 'Must reject enabling WhatsApp without explicit consent');
    });

    // 8. Invalid phone number
    await test('8. Invalid phone number', async () => {
      assert.strictEqual(normalizePhoneNumber('12345'), null, 'Local short numbers without country code must be rejected');
      assert.strictEqual(normalizePhoneNumber('abcd'), null, 'Non-digit strings must be rejected');
      assert.strictEqual(normalizePhoneNumber('+91 98765 43210'), '+919876543210', 'Normalized format strips spaces');
      assert.strictEqual(maskPhoneNumber('+919876543210'), '+91*****3210', 'Phone number must be masked in logs');

      let errorThrown = false;
      try {
        await notificationService.updatePreferences(userIdA, {
          whatsapp: { phoneNumber: 'invalid_number' } as any,
        });
      } catch (e: any) {
        errorThrown = true;
        assert.ok(e.message.includes('E.164'), 'Should reject invalid phone format');
      }
      assert.strictEqual(errorThrown, true, 'Preferences update must reject invalid phone number');
    });

    // 9. Provider unavailable / transient retry
    await test('9. Provider unavailable / transient error handling', async () => {
      const dummyNotif = await Notification.create({
        userId: userIdA,
        type: 'system',
        category: 'general',
        title: 'Network test',
        message: 'Testing provider backoff',
        channel: 'email',
        status: 'SCHEDULED',
        scheduledFor: new Date(),
        retryCount: 0,
        maxRetries: 3,
        dedupeKey: `transient_test_${timestamp}`,
      });

      // Dispatch through a provider mock that fails with a transient error
      const originalSend = (notificationDispatcher as any).emailProvider.send;
      (notificationDispatcher as any).emailProvider.send = async () => ({
        success: false,
        status: 'FAILED',
        error: 'ETIMEDOUT: Connection to SMTP server timed out',
      });

      try {
        await notificationDispatcher.dispatchNotification(dummyNotif);
        const reloaded = await Notification.findById(dummyNotif._id);
        assert.strictEqual(reloaded?.status, 'SCHEDULED', 'Transient failure must remain SCHEDULED for retry');
        assert.strictEqual(reloaded?.retryCount, 1, 'Retry count must be incremented');
        assert.ok(reloaded!.scheduledFor > new Date(), 'Next scheduled time must have backoff');
      } finally {
        (notificationDispatcher as any).emailProvider.send = originalSend;
      }
    });

    // 10. Duplicate scheduler execution / Idempotency
    await test('10. Duplicate scheduler execution / Idempotency', async () => {
      const dedupeKey = `idempotent_${timestamp}`;
      const notif = await Notification.create({
        userId: userIdA,
        type: 'study_session',
        category: 'study_sessions',
        title: 'Idempotency Test',
        message: 'Ensuring single send',
        channel: 'in_app',
        status: 'SCHEDULED',
        scheduledFor: new Date(Date.now() - 1000), // Past due
        dedupeKey,
      });

      // Dispatch twice concurrently
      const [res1, res2] = await Promise.all([
        notificationDispatcher.dispatchNotification(notif),
        notificationDispatcher.dispatchNotification(notif),
      ]);

      // Exactly one should successfully lock and process
      assert.ok(
        (res1 && !res2) || (!res1 && res2),
        'Only one concurrent dispatcher should win the atomic lock'
      );

      const reloaded = await Notification.findById(notif._id);
      assert.strictEqual(reloaded?.status, 'DELIVERED');
    });

    // 11. Backend restart catch-up
    await test('11. Backend restart catch-up', async () => {
      // Simulate an unhandled scheduled notification from when server was down
      const missedNotif = await Notification.create({
        userId: userIdA,
        type: 'study_session',
        category: 'study_sessions',
        title: 'Past Due Notification',
        message: 'Created while backend was offline',
        channel: 'in_app',
        status: 'SCHEDULED',
        scheduledFor: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes in past
        dedupeKey: `restart_catchup_${timestamp}`,
      });

      // Run scheduler tick as occurs on startup
      const tickResult = await notificationScheduler.runTick();
      assert.ok(tickResult.processedCount >= 1, 'Restart tick must process past-due scheduled notifications');

      const reloaded = await Notification.findById(missedNotif._id);
      assert.strictEqual(reloaded?.status, 'DELIVERED', 'Missed notification should be delivered after tick');
    });

    // 12. Task updated
    await test('12. Task updated schedules new reminder and cancels old', async () => {
      const task = await Task.create({
        userId: userIdA,
        title: 'Data Structures Lab Exercise',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        taskType: 'practical',
      });

      await notificationService.onTaskCreatedOrUpdated(task);

      const initialReminders = await Notification.find({
        relatedEntityType: 'Task',
        relatedEntityId: task._id,
        status: 'SCHEDULED',
      });
      assert.ok(initialReminders.length > 0, 'Initial task reminders should be scheduled');

      // Update task dueDate
      task.dueDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
      await task.save();
      await notificationService.onTaskCreatedOrUpdated(task);

      const updatedReminders = await Notification.find({
        relatedEntityType: 'Task',
        relatedEntityId: task._id,
        status: 'SCHEDULED',
      });
      assert.ok(updatedReminders.length > 0, 'New task reminders should be scheduled for updated date');

      const cancelledReminders = await Notification.find({
        relatedEntityType: 'Task',
        relatedEntityId: task._id,
        status: 'CANCELLED',
      });
      assert.ok(cancelledReminders.length > 0, 'Previous task reminder should be marked CANCELLED');
    });

    // 13. Task deleted
    await test('13. Task deleted cancels associated pending notifications', async () => {
      const task = await Task.create({
        userId: userIdA,
        title: 'Temporary Task to Delete',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        taskType: 'assignment',
      });

      await notificationService.onTaskCreatedOrUpdated(task);
      await Task.findByIdAndDelete(task._id);
      await notificationService.onTaskDeleted(task._id.toString());

      const activeReminders = await Notification.find({
        relatedEntityType: 'Task',
        relatedEntityId: task._id,
        status: 'SCHEDULED',
      });
      assert.strictEqual(activeReminders.length, 0, 'No active reminders should remain for deleted task');
    });

    // 14. Exam reminder
    await test('14. Exam reminder integration', async () => {
      const exam = await Exam.create({
        userId: userIdA,
        title: 'Computer Architecture Midterm',
        examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        examType: 'college_midterm',
      });

      await notificationService.onExamCreatedOrUpdated(exam);

      const examReminders = await Notification.find({
        relatedEntityType: 'Exam',
        relatedEntityId: exam._id,
        type: 'exam_reminder',
      });
      assert.ok(examReminders.length > 0, 'Exam reminders should be scheduled');
      assert.ok(examReminders[0].title.includes('Upcoming Exam Reminder'));
    });

    // 15. Flashcard due reminder
    await test('15. Flashcard due reminder integration', async () => {
      await notificationService.onFlashcardsDue(userIdA, 12);
      const flashcardNotif = await Notification.findOne({
        userId: userIdA,
        type: 'flashcard_review',
        dedupeKey: new RegExp(`^flashcards_due_${userIdA}`),
      });
      assert.ok(flashcardNotif, 'Flashcards due notification should be created');
      assert.ok(flashcardNotif.message.includes('12 flashcard(s) due'));
    });

    // 16. Learning Path reminder
    await test('16. Learning Path reminder integration', async () => {
      await notificationService.onLearningPathReminder(userIdA, 'Dynamic Programming');
      const lpNotif = await Notification.findOne({
        userId: userIdA,
        type: 'learning_path',
      });
      assert.ok(lpNotif, 'Learning path notification should be created');
      assert.ok(lpNotif.message.includes('Dynamic Programming'));
    });

    // 17. Missed study session
    await test('17. Missed study session detection & rescheduling notification', async () => {
      const pastStartTime = new Date(Date.now() - 90 * 60 * 1000);
      const pastEndTime = new Date(Date.now() - 30 * 60 * 1000);

      const session = await StudySession.create({
        userId: userIdA,
        title: 'Advanced Recursion Practice',
        sessionType: 'learning_path',
        startTime: pastStartTime,
        endTime: pastEndTime,
        durationMinutes: 60,
        status: 'planned',
      });

      // Run scheduler tick to trigger missed session detection
      const tickResult = await notificationScheduler.runTick();
      assert.ok(tickResult.missedSessionsDetected >= 1, 'Should detect missed session');

      const updatedSession = await StudySession.findById(session._id);
      assert.strictEqual(updatedSession?.status, 'missed', 'Session status should update to missed');

      const missedNotif = await Notification.findOne({
        relatedEntityType: 'StudySession',
        relatedEntityId: session._id,
        type: 'missed_session',
      });
      assert.ok(missedNotif, 'Missed study session notification should be created');
      assert.ok(missedNotif.message.includes('reschedule'));
    });

    // 18. Quiet hours
    await test('18. Quiet hours detection and time shift', async () => {
      const config = { enabled: true, startTime: '22:30', endTime: '07:00' };

      // Construct a date at 23:30 (should be IN quiet hours)
      const lateNight = new Date('2026-10-16T23:30:00Z');
      const isQuietLate = QuietHoursService.isInQuietHours(lateNight, 'UTC', config);
      assert.strictEqual(isQuietLate, true, '23:30 UTC should be in quiet hours');

      // Construct a date at 14:00 (should NOT be in quiet hours)
      const afternoon = new Date('2026-10-16T14:00:00Z');
      const isQuietAfternoon = QuietHoursService.isInQuietHours(afternoon, 'UTC', config);
      assert.strictEqual(isQuietAfternoon, false, '14:00 UTC should not be in quiet hours');

      // Shift late night out of quiet hours
      const shifted = QuietHoursService.getNextAllowedTime(lateNight, 'UTC', config);
      const isStillQuiet = QuietHoursService.isInQuietHours(shifted, 'UTC', config);
      assert.strictEqual(isStillQuiet, false, 'Shifted time must fall strictly outside quiet hours');
    });

    // 19. User timezone
    await test('19. Respect user timezone for quiet hours', async () => {
      const config = { enabled: true, startTime: '22:30', endTime: '07:00' };
      // 03:00 UTC is 08:30 in Asia/Kolkata (OUT of quiet hours)
      // 03:00 UTC is 23:00 in America/New_York (IN quiet hours!)
      const testDate = new Date('2026-10-16T03:00:00Z');

      const isQuietInIndia = QuietHoursService.isInQuietHours(testDate, 'Asia/Kolkata', config);
      const isQuietInNewYork = QuietHoursService.isInQuietHours(testDate, 'America/New_York', config);

      assert.strictEqual(isQuietInIndia, false, '08:30 AM in India should NOT be quiet hours');
      assert.strictEqual(isQuietInNewYork, true, '11:00 PM in New York SHOULD be quiet hours');
    });

    // 20. Cross-user authorization
    await test('20. Cross-user authorization boundary', async () => {
      // Create notification owned by User B
      const notifB = await Notification.create({
        userId: userIdB,
        type: 'system',
        category: 'general',
        title: "User B's Private Notification",
        message: 'Secret',
        channel: 'in_app',
        status: 'DELIVERED',
        scheduledFor: new Date(),
      });

      // User A attempts to mark User B's notification as read
      const result = await notificationService.markAsRead(userIdA, notifB._id.toString());
      assert.strictEqual(result, null, 'User A must not be able to mark User B notification as read');

      // Verify User B's notification readAt is unchanged
      const unaffected = await Notification.findById(notifB._id);
      assert.strictEqual(unaffected?.readAt, null);

      // User A attempts to delete User B's notification
      const deleteResult = await notificationService.deleteNotification(userIdA, notifB._id.toString());
      assert.strictEqual(deleteResult, false, 'User A must not be able to delete User B notification');
    });

    // 21. Logout / browser closed scenario
    await test('21. Independent server-side operation (browser closed / logged out)', async () => {
      // Notification is queued and processed purely by server background logic
      const scheduled = await notificationDispatcher.scheduleNotification({
        userId: userIdB,
        type: 'daily_plan',
        category: 'daily_plan',
        title: 'Server side scheduled plan',
        message: 'No client needed',
        triggerTime: new Date(Date.now() - 1000),
        forceSendImmediate: true,
        dedupeBaseKey: `server_standalone_${timestamp}`,
      });

      assert.ok(scheduled.length > 0);
      const tickRes = await notificationScheduler.runTick();
      assert.ok(tickRes.processedCount >= 1);

      const dispatched = await Notification.findById(scheduled[0]._id);
      assert.strictEqual(dispatched?.status, 'DELIVERED');
    });

    // 22. Production configuration missing
    await test('22. Production configuration missing safeguards', async () => {
      const originalEnv = ENV.NODE_ENV;
      const originalSid = process.env.TWILIO_ACCOUNT_SID;
      try {
        (ENV as any).NODE_ENV = 'production';
        delete process.env.TWILIO_ACCOUNT_SID;

        const prodProvider = new WhatsAppProvider();
        assert.strictEqual(prodProvider.getIsConfigured(), false);

        const result = await prodProvider.send(
          { userId: userIdA, phone: '+919876543210', consentGiven: true },
          {
            title: 'Production Test',
            message: 'Should fail safely',
            category: 'study_sessions',
            type: 'study_session',
          }
        );

        assert.strictEqual(result.success, false, 'Must not claim success when credentials missing in production');
        assert.strictEqual(result.status, 'FAILED');
        assert.ok(result.error?.includes('Missing production WhatsApp credentials'));
      } finally {
        (ENV as any).NODE_ENV = originalEnv;
        if (originalSid) process.env.TWILIO_ACCOUNT_SID = originalSid;
      }
    });

  } finally {
    // Cleanup test data
    await User.deleteMany({ _id: { $in: [testUserA._id, testUserB._id] } });
    await Notification.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
    await NotificationPreferences.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
    await Task.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
    await Exam.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
    await StudySession.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
    await mongoose.disconnect();
  }

  console.log(`\n======================================================================`);
  console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log(`======================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runAllNotificationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
