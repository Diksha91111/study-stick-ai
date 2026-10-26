"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.forceRegenerateSchedule = exports.rescheduleSession = exports.updateSessionStatus = exports.getDashboard = void 0;
const response_js_1 = require("../utils/response.js");
const plannerService_js_1 = require("../services/plannerService.js");
const StudySession_js_1 = require("../models/StudySession.js");
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const Exam_js_1 = require("../models/Exam.js");
const Task_js_1 = require("../models/Task.js");
const Flashcard_js_1 = require("../models/Flashcard.js");
const LearningPath_js_1 = require("../models/LearningPath.js");
const notificationService_js_1 = require("../services/notifications/notificationService.js");
const getDashboard = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const now = new Date();
        // 1. Generate/Get Study Sessions for today
        const sessions = await plannerService_js_1.plannerService.generateDailySchedule(userId, now);
        // 2. Commitments (Timetable for today)
        const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
        const commitments = await TimetableSlot_js_1.TimetableSlot.find({ userId, dayOfWeek }).sort({ startTime: 1 });
        // 3. Upcoming Exams
        const upcomingExams = await Exam_js_1.Exam.find({ userId, status: 'upcoming', examDate: { $gte: now } })
            .sort({ examDate: 1 })
            .limit(3);
        // 4. Learning Path (Recommended activities)
        const lp = await LearningPath_js_1.LearningPath.findOne({ userId });
        const recommendedActivity = lp?.recommendations.find(r => r.status === 'pending') || null;
        // 5. Flashcards Due
        const flashcardsDueCount = await Flashcard_js_1.Flashcard.countDocuments({ userId, nextReview: { $lte: now }, status: 'active' });
        // 6. Tasks Summary
        const tasksTotal = await Task_js_1.Task.countDocuments({ userId });
        const tasksCompleted = await Task_js_1.Task.countDocuments({ userId, status: 'completed' });
        const tasksPending = await Task_js_1.Task.countDocuments({ userId, status: 'pending' });
        const tasksInProgress = await Task_js_1.Task.countDocuments({ userId, status: 'in_progress' });
        // 7. Available Study Time
        const availableBlocks = await plannerService_js_1.plannerService.getAvailableTimeBlocks(userId, now);
        let totalAvailableMinutes = 0;
        availableBlocks.forEach(b => {
            totalAvailableMinutes += (b.end.getTime() - b.start.getTime()) / 60000;
        });
        const availableStudyTime = Math.max(0, totalAvailableMinutes);
        (0, response_js_1.sendSuccess)(res, {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboard = getDashboard;
const updateSessionStatus = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { sessionId } = req.params;
        const { status } = req.body;
        if (!['completed', 'missed', 'planned'].includes(status)) {
            (0, response_js_1.sendError)(res, 'Invalid status', 400);
            return;
        }
        const session = await StudySession_js_1.StudySession.findOneAndUpdate({ _id: sessionId, userId }, { status }, { new: true });
        if (!session) {
            (0, response_js_1.sendError)(res, 'Session not found', 404);
            return;
        }
        // Update notifications (e.g. cancels reminder if marked completed)
        notificationService_js_1.notificationService.onStudySessionCreatedOrUpdated(session).catch((err) => console.error('[Session Event] Notification update error:', err));
        (0, response_js_1.sendSuccess)(res, session, `Session marked as ${status}`);
    }
    catch (error) {
        next(error);
    }
};
exports.updateSessionStatus = updateSessionStatus;
const rescheduleSession = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { sessionId } = req.params;
        const newSession = await plannerService_js_1.plannerService.rescheduleMissedSession(userId, sessionId);
        // Schedule reminder for newly rescheduled session
        if (newSession) {
            notificationService_js_1.notificationService.onStudySessionCreatedOrUpdated(newSession).catch((err) => console.error('[Session Event] Reschedule notification error:', err));
        }
        (0, response_js_1.sendSuccess)(res, newSession, 'Session rescheduled successfully');
    }
    catch (error) {
        if (error.message.includes('No available time slots')) {
            (0, response_js_1.sendError)(res, error.message, 409, {
                code: 'NO_TIME_SLOTS_AVAILABLE'
            });
        }
        else {
            next(error);
        }
    }
};
exports.rescheduleSession = rescheduleSession;
const forceRegenerateSchedule = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const now = new Date();
        // To force regenerate, we might delete "planned" sessions for today that haven't started.
        // For simplicity, we just delete all planned sessions in the future today.
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        await StudySession_js_1.StudySession.deleteMany({
            userId,
            status: 'planned',
            startTime: { $gte: now, $lte: endOfDay }
        });
        const sessions = await plannerService_js_1.plannerService.generateDailySchedule(userId, now);
        (0, response_js_1.sendSuccess)(res, sessions, 'Schedule regenerated');
    }
    catch (error) {
        next(error);
    }
};
exports.forceRegenerateSchedule = forceRegenerateSchedule;
