"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const assert_1 = __importDefault(require("assert"));
const env_js_1 = require("../config/env.js");
const User_js_1 = require("../models/User.js");
const Task_js_1 = require("../models/Task.js");
const Exam_js_1 = require("../models/Exam.js");
const StudySession_js_1 = require("../models/StudySession.js");
const Notification_js_1 = require("../models/Notification.js");
const NotificationPreferences_js_1 = require("../models/NotificationPreferences.js");
const notificationService_js_1 = require("../services/notifications/notificationService.js");
const notificationDispatcher_js_1 = require("../services/notifications/notificationDispatcher.js");
const notificationScheduler_js_1 = require("../services/notifications/notificationScheduler.js");
const quietHoursService_js_1 = require("../services/notifications/quietHoursService.js");
const WhatsAppProvider_js_1 = require("../services/notifications/WhatsAppProvider.js");
async function runAllNotificationTests() {
    console.log('======================================================================');
    console.log('🧪 RUNNING PRODUCTION-ORIENTED NOTIFICATIONS & REMINDERS TEST SUITE');
    console.log('======================================================================\n');
    await mongoose_1.default.connect(env_js_1.ENV.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');
    let passed = 0;
    let failed = 0;
    async function test(name, fn) {
        try {
            await fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        }
        catch (e) {
            console.error(`❌ FAIL: ${name}`);
            console.error(e.stack || e.message || e);
            failed++;
        }
    }
    // Create two distinct test users for isolation and cross-user tests
    const timestamp = Date.now();
    const testUserA = await User_js_1.User.create({
        name: 'Test Student Alpha',
        email: `notif.test.alpha.${timestamp}@studystick.ai`,
        password: 'hashedPassword123',
        isEmailVerified: true,
    });
    const testUserB = await User_js_1.User.create({
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
            const scheduled = await notificationDispatcher_js_1.notificationDispatcher.scheduleNotification({
                userId: userIdA,
                type: 'study_session',
                category: 'study_sessions',
                title: 'Your study session starts in 15 minutes',
                message: 'Get ready for Algorithms session',
                triggerTime: new Date(Date.now() + 15 * 60 * 1000),
                forceSendImmediate: true,
            });
            const inApp = scheduled.find((n) => n.channel === 'in_app');
            assert_1.default.ok(inApp, 'In-app notification must be created');
            assert_1.default.strictEqual(inApp.title, 'Your study session starts in 15 minutes');
            // Dispatch and check status transition
            await notificationDispatcher_js_1.notificationDispatcher.dispatchNotification(inApp);
            const reloaded = await Notification_js_1.Notification.findById(inApp._id);
            assert_1.default.strictEqual(reloaded?.status, 'DELIVERED', 'In-app notification should be DELIVERED upon dispatch');
        });
        // 2. Read/unread state
        await test('2. Read/unread state', async () => {
            const unreadCountBefore = await notificationService_js_1.notificationService.getUnreadCount(userIdA);
            const { notifications } = await notificationService_js_1.notificationService.getNotifications(userIdA, { unreadOnly: true });
            assert_1.default.ok(notifications.length > 0, 'Should have at least 1 unread notification');
            const target = notifications[0];
            const updated = await notificationService_js_1.notificationService.markAsRead(userIdA, target._id.toString());
            assert_1.default.ok(updated?.readAt !== null, 'readAt should be populated');
            const unreadCountAfter = await notificationService_js_1.notificationService.getUnreadCount(userIdA);
            assert_1.default.strictEqual(unreadCountAfter, unreadCountBefore - 1, 'Unread count should decrease by 1');
        });
        // 3. Email enabled
        await test('3. Email enabled', async () => {
            await notificationService_js_1.notificationService.updatePreferences(userIdA, { emailEnabled: true });
            const scheduled = await notificationDispatcher_js_1.notificationDispatcher.scheduleNotification({
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
            assert_1.default.ok(emailNotif, 'Email notification should be scheduled when emailEnabled is true');
            // Dispatch email notification
            await notificationDispatcher_js_1.notificationDispatcher.dispatchNotification(emailNotif);
            const reloaded = await Notification_js_1.Notification.findById(emailNotif._id);
            assert_1.default.ok(reloaded?.status === 'SENT' || (reloaded?.failureReason && reloaded?.status === 'SCHEDULED'), 'Email should be marked as SENT or queued for retry on SMTP auth failure');
        });
        // 4. Email disabled
        await test('4. Email disabled', async () => {
            await notificationService_js_1.notificationService.updatePreferences(userIdA, { emailEnabled: false });
            const scheduled = await notificationDispatcher_js_1.notificationDispatcher.scheduleNotification({
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
            assert_1.default.strictEqual(emailNotif, undefined, 'Email notification should NOT be scheduled when emailEnabled is false');
        });
        // 5. WhatsApp enabled + valid consent
        await test('5. WhatsApp enabled + valid consent', async () => {
            await notificationService_js_1.notificationService.updatePreferences(userIdA, {
                whatsapp: {
                    phoneNumber: '+919876543210',
                    consentGiven: true,
                    verificationStatus: 'verified',
                },
                whatsappEnabled: true,
            });
            const prefs = await notificationService_js_1.notificationService.getPreferences(userIdA);
            assert_1.default.strictEqual(prefs.whatsappEnabled, true);
            assert_1.default.strictEqual(prefs.whatsapp.consentGiven, true);
            assert_1.default.strictEqual(prefs.whatsapp.phoneNumber, '+919876543210');
            const scheduled = await notificationDispatcher_js_1.notificationDispatcher.scheduleNotification({
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
            assert_1.default.ok(waNotif, 'WhatsApp notification should be scheduled when enabled with valid consent');
            await notificationDispatcher_js_1.notificationDispatcher.dispatchNotification(waNotif);
            const reloaded = await Notification_js_1.Notification.findById(waNotif._id);
            assert_1.default.strictEqual(reloaded?.status, 'SENT', 'WhatsApp notification should be SENT');
            assert_1.default.strictEqual(reloaded?.metadata?.isSimulated, true, 'Development run should be clearly labeled simulated');
        });
        // 6. WhatsApp disabled
        await test('6. WhatsApp disabled', async () => {
            await notificationService_js_1.notificationService.updatePreferences(userIdA, { whatsappEnabled: false });
            const scheduled = await notificationDispatcher_js_1.notificationDispatcher.scheduleNotification({
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
            assert_1.default.strictEqual(waNotif, undefined, 'WhatsApp notification should NOT be scheduled when disabled');
        });
        // 7. WhatsApp without consent
        await test('7. WhatsApp without consent', async () => {
            let rejected = false;
            try {
                await notificationService_js_1.notificationService.updatePreferences(userIdA, {
                    whatsapp: { phoneNumber: '+919876543210', consentGiven: false, verificationStatus: 'unverified' },
                    whatsappEnabled: true,
                });
            }
            catch (err) {
                rejected = true;
                assert_1.default.ok(err.message.includes('consent'), 'Error should specify consent is required');
            }
            assert_1.default.strictEqual(rejected, true, 'Must reject enabling WhatsApp without explicit consent');
        });
        // 8. Invalid phone number
        await test('8. Invalid phone number', async () => {
            assert_1.default.strictEqual((0, WhatsAppProvider_js_1.normalizePhoneNumber)('12345'), null, 'Local short numbers without country code must be rejected');
            assert_1.default.strictEqual((0, WhatsAppProvider_js_1.normalizePhoneNumber)('abcd'), null, 'Non-digit strings must be rejected');
            assert_1.default.strictEqual((0, WhatsAppProvider_js_1.normalizePhoneNumber)('+91 98765 43210'), '+919876543210', 'Normalized format strips spaces');
            assert_1.default.strictEqual((0, WhatsAppProvider_js_1.maskPhoneNumber)('+919876543210'), '+91*****3210', 'Phone number must be masked in logs');
            let errorThrown = false;
            try {
                await notificationService_js_1.notificationService.updatePreferences(userIdA, {
                    whatsapp: { phoneNumber: 'invalid_number' },
                });
            }
            catch (e) {
                errorThrown = true;
                assert_1.default.ok(e.message.includes('E.164'), 'Should reject invalid phone format');
            }
            assert_1.default.strictEqual(errorThrown, true, 'Preferences update must reject invalid phone number');
        });
        // 9. Provider unavailable / transient retry
        await test('9. Provider unavailable / transient error handling', async () => {
            const dummyNotif = await Notification_js_1.Notification.create({
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
            const originalSend = notificationDispatcher_js_1.notificationDispatcher.emailProvider.send;
            notificationDispatcher_js_1.notificationDispatcher.emailProvider.send = async () => ({
                success: false,
                status: 'FAILED',
                error: 'ETIMEDOUT: Connection to SMTP server timed out',
            });
            try {
                await notificationDispatcher_js_1.notificationDispatcher.dispatchNotification(dummyNotif);
                const reloaded = await Notification_js_1.Notification.findById(dummyNotif._id);
                assert_1.default.strictEqual(reloaded?.status, 'SCHEDULED', 'Transient failure must remain SCHEDULED for retry');
                assert_1.default.strictEqual(reloaded?.retryCount, 1, 'Retry count must be incremented');
                assert_1.default.ok(reloaded.scheduledFor > new Date(), 'Next scheduled time must have backoff');
            }
            finally {
                notificationDispatcher_js_1.notificationDispatcher.emailProvider.send = originalSend;
            }
        });
        // 10. Duplicate scheduler execution / Idempotency
        await test('10. Duplicate scheduler execution / Idempotency', async () => {
            const dedupeKey = `idempotent_${timestamp}`;
            const notif = await Notification_js_1.Notification.create({
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
                notificationDispatcher_js_1.notificationDispatcher.dispatchNotification(notif),
                notificationDispatcher_js_1.notificationDispatcher.dispatchNotification(notif),
            ]);
            // Exactly one should successfully lock and process
            assert_1.default.ok((res1 && !res2) || (!res1 && res2), 'Only one concurrent dispatcher should win the atomic lock');
            const reloaded = await Notification_js_1.Notification.findById(notif._id);
            assert_1.default.strictEqual(reloaded?.status, 'DELIVERED');
        });
        // 11. Backend restart catch-up
        await test('11. Backend restart catch-up', async () => {
            // Simulate an unhandled scheduled notification from when server was down
            const missedNotif = await Notification_js_1.Notification.create({
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
            const tickResult = await notificationScheduler_js_1.notificationScheduler.runTick();
            assert_1.default.ok(tickResult.processedCount >= 1, 'Restart tick must process past-due scheduled notifications');
            const reloaded = await Notification_js_1.Notification.findById(missedNotif._id);
            assert_1.default.strictEqual(reloaded?.status, 'DELIVERED', 'Missed notification should be delivered after tick');
        });
        // 12. Task updated
        await test('12. Task updated schedules new reminder and cancels old', async () => {
            const task = await Task_js_1.Task.create({
                userId: userIdA,
                title: 'Data Structures Lab Exercise',
                dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                taskType: 'practical',
            });
            await notificationService_js_1.notificationService.onTaskCreatedOrUpdated(task);
            const initialReminders = await Notification_js_1.Notification.find({
                relatedEntityType: 'Task',
                relatedEntityId: task._id,
                status: 'SCHEDULED',
            });
            assert_1.default.ok(initialReminders.length > 0, 'Initial task reminders should be scheduled');
            // Update task dueDate
            task.dueDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
            await task.save();
            await notificationService_js_1.notificationService.onTaskCreatedOrUpdated(task);
            const updatedReminders = await Notification_js_1.Notification.find({
                relatedEntityType: 'Task',
                relatedEntityId: task._id,
                status: 'SCHEDULED',
            });
            assert_1.default.ok(updatedReminders.length > 0, 'New task reminders should be scheduled for updated date');
            const cancelledReminders = await Notification_js_1.Notification.find({
                relatedEntityType: 'Task',
                relatedEntityId: task._id,
                status: 'CANCELLED',
            });
            assert_1.default.ok(cancelledReminders.length > 0, 'Previous task reminder should be marked CANCELLED');
        });
        // 13. Task deleted
        await test('13. Task deleted cancels associated pending notifications', async () => {
            const task = await Task_js_1.Task.create({
                userId: userIdA,
                title: 'Temporary Task to Delete',
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                taskType: 'assignment',
            });
            await notificationService_js_1.notificationService.onTaskCreatedOrUpdated(task);
            await Task_js_1.Task.findByIdAndDelete(task._id);
            await notificationService_js_1.notificationService.onTaskDeleted(task._id.toString());
            const activeReminders = await Notification_js_1.Notification.find({
                relatedEntityType: 'Task',
                relatedEntityId: task._id,
                status: 'SCHEDULED',
            });
            assert_1.default.strictEqual(activeReminders.length, 0, 'No active reminders should remain for deleted task');
        });
        // 14. Exam reminder
        await test('14. Exam reminder integration', async () => {
            const exam = await Exam_js_1.Exam.create({
                userId: userIdA,
                title: 'Computer Architecture Midterm',
                examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
                examType: 'college_midterm',
            });
            await notificationService_js_1.notificationService.onExamCreatedOrUpdated(exam);
            const examReminders = await Notification_js_1.Notification.find({
                relatedEntityType: 'Exam',
                relatedEntityId: exam._id,
                type: 'exam_reminder',
            });
            assert_1.default.ok(examReminders.length > 0, 'Exam reminders should be scheduled');
            assert_1.default.ok(examReminders[0].title.includes('Upcoming Exam Reminder'));
        });
        // 15. Flashcard due reminder
        await test('15. Flashcard due reminder integration', async () => {
            await notificationService_js_1.notificationService.onFlashcardsDue(userIdA, 12);
            const flashcardNotif = await Notification_js_1.Notification.findOne({
                userId: userIdA,
                type: 'flashcard_review',
                dedupeKey: new RegExp(`^flashcards_due_${userIdA}`),
            });
            assert_1.default.ok(flashcardNotif, 'Flashcards due notification should be created');
            assert_1.default.ok(flashcardNotif.message.includes('12 flashcard(s) due'));
        });
        // 16. Learning Path reminder
        await test('16. Learning Path reminder integration', async () => {
            await notificationService_js_1.notificationService.onLearningPathReminder(userIdA, 'Dynamic Programming');
            const lpNotif = await Notification_js_1.Notification.findOne({
                userId: userIdA,
                type: 'learning_path',
            });
            assert_1.default.ok(lpNotif, 'Learning path notification should be created');
            assert_1.default.ok(lpNotif.message.includes('Dynamic Programming'));
        });
        // 17. Missed study session
        await test('17. Missed study session detection & rescheduling notification', async () => {
            const pastStartTime = new Date(Date.now() - 90 * 60 * 1000);
            const pastEndTime = new Date(Date.now() - 30 * 60 * 1000);
            const session = await StudySession_js_1.StudySession.create({
                userId: userIdA,
                title: 'Advanced Recursion Practice',
                sessionType: 'learning_path',
                startTime: pastStartTime,
                endTime: pastEndTime,
                durationMinutes: 60,
                status: 'planned',
            });
            // Run scheduler tick to trigger missed session detection
            const tickResult = await notificationScheduler_js_1.notificationScheduler.runTick();
            assert_1.default.ok(tickResult.missedSessionsDetected >= 1, 'Should detect missed session');
            const updatedSession = await StudySession_js_1.StudySession.findById(session._id);
            assert_1.default.strictEqual(updatedSession?.status, 'missed', 'Session status should update to missed');
            const missedNotif = await Notification_js_1.Notification.findOne({
                relatedEntityType: 'StudySession',
                relatedEntityId: session._id,
                type: 'missed_session',
            });
            assert_1.default.ok(missedNotif, 'Missed study session notification should be created');
            assert_1.default.ok(missedNotif.message.includes('reschedule'));
        });
        // 18. Quiet hours
        await test('18. Quiet hours detection and time shift', async () => {
            const config = { enabled: true, startTime: '22:30', endTime: '07:00' };
            // Construct a date at 23:30 (should be IN quiet hours)
            const lateNight = new Date('2026-10-16T23:30:00Z');
            const isQuietLate = quietHoursService_js_1.QuietHoursService.isInQuietHours(lateNight, 'UTC', config);
            assert_1.default.strictEqual(isQuietLate, true, '23:30 UTC should be in quiet hours');
            // Construct a date at 14:00 (should NOT be in quiet hours)
            const afternoon = new Date('2026-10-16T14:00:00Z');
            const isQuietAfternoon = quietHoursService_js_1.QuietHoursService.isInQuietHours(afternoon, 'UTC', config);
            assert_1.default.strictEqual(isQuietAfternoon, false, '14:00 UTC should not be in quiet hours');
            // Shift late night out of quiet hours
            const shifted = quietHoursService_js_1.QuietHoursService.getNextAllowedTime(lateNight, 'UTC', config);
            const isStillQuiet = quietHoursService_js_1.QuietHoursService.isInQuietHours(shifted, 'UTC', config);
            assert_1.default.strictEqual(isStillQuiet, false, 'Shifted time must fall strictly outside quiet hours');
        });
        // 19. User timezone
        await test('19. Respect user timezone for quiet hours', async () => {
            const config = { enabled: true, startTime: '22:30', endTime: '07:00' };
            // 03:00 UTC is 08:30 in Asia/Kolkata (OUT of quiet hours)
            // 03:00 UTC is 23:00 in America/New_York (IN quiet hours!)
            const testDate = new Date('2026-10-16T03:00:00Z');
            const isQuietInIndia = quietHoursService_js_1.QuietHoursService.isInQuietHours(testDate, 'Asia/Kolkata', config);
            const isQuietInNewYork = quietHoursService_js_1.QuietHoursService.isInQuietHours(testDate, 'America/New_York', config);
            assert_1.default.strictEqual(isQuietInIndia, false, '08:30 AM in India should NOT be quiet hours');
            assert_1.default.strictEqual(isQuietInNewYork, true, '11:00 PM in New York SHOULD be quiet hours');
        });
        // 20. Cross-user authorization
        await test('20. Cross-user authorization boundary', async () => {
            // Create notification owned by User B
            const notifB = await Notification_js_1.Notification.create({
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
            const result = await notificationService_js_1.notificationService.markAsRead(userIdA, notifB._id.toString());
            assert_1.default.strictEqual(result, null, 'User A must not be able to mark User B notification as read');
            // Verify User B's notification readAt is unchanged
            const unaffected = await Notification_js_1.Notification.findById(notifB._id);
            assert_1.default.strictEqual(unaffected?.readAt, null);
            // User A attempts to delete User B's notification
            const deleteResult = await notificationService_js_1.notificationService.deleteNotification(userIdA, notifB._id.toString());
            assert_1.default.strictEqual(deleteResult, false, 'User A must not be able to delete User B notification');
        });
        // 21. Logout / browser closed scenario
        await test('21. Independent server-side operation (browser closed / logged out)', async () => {
            // Notification is queued and processed purely by server background logic
            const scheduled = await notificationDispatcher_js_1.notificationDispatcher.scheduleNotification({
                userId: userIdB,
                type: 'daily_plan',
                category: 'daily_plan',
                title: 'Server side scheduled plan',
                message: 'No client needed',
                triggerTime: new Date(Date.now() - 1000),
                forceSendImmediate: true,
                dedupeBaseKey: `server_standalone_${timestamp}`,
            });
            assert_1.default.ok(scheduled.length > 0);
            const tickRes = await notificationScheduler_js_1.notificationScheduler.runTick();
            assert_1.default.ok(tickRes.processedCount >= 1);
            const dispatched = await Notification_js_1.Notification.findById(scheduled[0]._id);
            assert_1.default.strictEqual(dispatched?.status, 'DELIVERED');
        });
        // 22. Production configuration missing
        await test('22. Production configuration missing safeguards', async () => {
            const originalEnv = env_js_1.ENV.NODE_ENV;
            const originalSid = process.env.TWILIO_ACCOUNT_SID;
            try {
                env_js_1.ENV.NODE_ENV = 'production';
                delete process.env.TWILIO_ACCOUNT_SID;
                const prodProvider = new WhatsAppProvider_js_1.WhatsAppProvider();
                assert_1.default.strictEqual(prodProvider.getIsConfigured(), false);
                const result = await prodProvider.send({ userId: userIdA, phone: '+919876543210', consentGiven: true }, {
                    title: 'Production Test',
                    message: 'Should fail safely',
                    category: 'study_sessions',
                    type: 'study_session',
                });
                assert_1.default.strictEqual(result.success, false, 'Must not claim success when credentials missing in production');
                assert_1.default.strictEqual(result.status, 'FAILED');
                assert_1.default.ok(result.error?.includes('Missing production WhatsApp credentials'));
            }
            finally {
                env_js_1.ENV.NODE_ENV = originalEnv;
                if (originalSid)
                    process.env.TWILIO_ACCOUNT_SID = originalSid;
            }
        });
    }
    finally {
        // Cleanup test data
        await User_js_1.User.deleteMany({ _id: { $in: [testUserA._id, testUserB._id] } });
        await Notification_js_1.Notification.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
        await NotificationPreferences_js_1.NotificationPreferences.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
        await Task_js_1.Task.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
        await Exam_js_1.Exam.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
        await StudySession_js_1.StudySession.deleteMany({ userId: { $in: [testUserA._id, testUserB._id] } });
        await mongoose_1.default.disconnect();
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
