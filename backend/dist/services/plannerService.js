"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.plannerService = void 0;
const StudySession_js_1 = require("../models/StudySession.js");
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const Task_js_1 = require("../models/Task.js");
const Exam_js_1 = require("../models/Exam.js");
const LearningPath_js_1 = require("../models/LearningPath.js");
const Flashcard_js_1 = require("../models/Flashcard.js");
const aiOrchestrator_js_1 = require("../ai/core/aiOrchestrator.js");
const notificationService_js_1 = require("./notifications/notificationService.js");
exports.plannerService = {
    // Generate a schedule for a specific date (usually today)
    generateDailySchedule: async (userId, targetDate) => {
        // 1. Check if we already planned today
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);
        const existingSessions = await StudySession_js_1.StudySession.find({
            userId,
            startTime: { $gte: startOfDay, $lte: endOfDay },
        });
        // If we already have sessions planned for today (that aren't missed/rescheduled), don't overwrite blindly
        // For simplicity of phase 10, if there are active sessions, we can just return them, 
        // unless the user explicitly requests a rebuild or we find missing sessions.
        const activeSessions = existingSessions.filter(s => s.status === 'planned' || s.status === 'completed');
        if (activeSessions.length > 0) {
            return existingSessions;
        }
        // 2. Determine available time blocks
        const availableBlocks = await exports.plannerService.getAvailableTimeBlocks(userId, targetDate);
        // 3. Gather actionable items
        const actionableItems = await exports.plannerService.gatherActionableItems(userId);
        // 4. Allocate items to blocks
        const newSessions = [];
        let currentBlockIndex = 0;
        let blockCursor = new Date(availableBlocks[0]?.start || startOfDay);
        for (const item of actionableItems) {
            if (currentBlockIndex >= availableBlocks.length)
                break;
            let remainingDuration = item.durationMinutes;
            while (remainingDuration > 0 && currentBlockIndex < availableBlocks.length) {
                const block = availableBlocks[currentBlockIndex];
                const blockEnd = new Date(block.end);
                const availableMinutes = (blockEnd.getTime() - blockCursor.getTime()) / (1000 * 60);
                if (availableMinutes <= 0) {
                    currentBlockIndex++;
                    if (currentBlockIndex < availableBlocks.length) {
                        blockCursor = new Date(availableBlocks[currentBlockIndex].start);
                    }
                    continue;
                }
                const allocateMinutes = Math.min(availableMinutes, remainingDuration);
                const sessionEnd = new Date(blockCursor.getTime() + allocateMinutes * 60000);
                newSessions.push({
                    userId,
                    title: item.title,
                    sessionType: item.type,
                    referenceId: item.referenceId,
                    startTime: new Date(blockCursor),
                    endTime: sessionEnd,
                    durationMinutes: allocateMinutes,
                    status: 'planned',
                    priorityScore: item.priority,
                    reasoning: item.reasoning,
                });
                blockCursor = sessionEnd;
                remainingDuration -= allocateMinutes;
            }
        }
        if (newSessions.length > 0) {
            const inserted = await StudySession_js_1.StudySession.insertMany(newSessions);
            for (const sess of inserted) {
                notificationService_js_1.notificationService.onStudySessionCreatedOrUpdated(sess).catch((err) => console.error('[Planner Event] Notification error:', err));
            }
        }
        return StudySession_js_1.StudySession.find({
            userId,
            startTime: { $gte: startOfDay, $lte: endOfDay },
        }).sort({ startTime: 1 });
    },
    getAvailableTimeBlocks: async (userId, targetDate) => {
        const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay(); // 1 = Mon, 7 = Sun
        const slots = await TimetableSlot_js_1.TimetableSlot.find({ userId, dayOfWeek });
        const sleep = await SleepSchedule_js_1.SleepSchedule.findOne({ userId });
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        // Default sleep hours
        let wakeHour = 7, wakeMin = 0;
        let bedHour = 23, bedMin = 30;
        if (sleep) {
            const [wh, wm] = sleep.wakeTime.split(':').map(Number);
            const [bh, bm] = sleep.bedTime.split(':').map(Number);
            wakeHour = wh;
            wakeMin = wm;
            bedHour = bh;
            bedMin = bm;
        }
        const wakeTime = new Date(startOfDay);
        wakeTime.setHours(wakeHour, wakeMin, 0, 0);
        const bedTime = new Date(startOfDay);
        bedTime.setHours(bedHour, bedMin, 0, 0);
        if (bedTime < wakeTime) {
            bedTime.setDate(bedTime.getDate() + 1);
        }
        // Convert timetable slots to blocked intervals
        const blockedIntervals = slots.map(slot => {
            const [sh, sm] = slot.startTime.split(':').map(Number);
            const [eh, em] = slot.endTime.split(':').map(Number);
            const s = new Date(startOfDay);
            s.setHours(sh, sm, 0, 0);
            const e = new Date(startOfDay);
            e.setHours(eh, em, 0, 0);
            return { start: s, end: e };
        });
        // Sort blocked intervals
        blockedIntervals.sort((a, b) => a.start.getTime() - b.start.getTime());
        const availableBlocks = [];
        let currentTime = new Date(wakeTime);
        for (const block of blockedIntervals) {
            if (currentTime < block.start) {
                availableBlocks.push({ start: new Date(currentTime), end: new Date(block.start) });
            }
            if (currentTime < block.end) {
                currentTime = new Date(block.end);
            }
        }
        if (currentTime < bedTime) {
            availableBlocks.push({ start: new Date(currentTime), end: new Date(bedTime) });
        }
        return availableBlocks;
    },
    gatherActionableItems: async (userId) => {
        const items = [];
        const now = new Date();
        // 1. Due Flashcards (Highest priority if due)
        const dueCards = await Flashcard_js_1.Flashcard.countDocuments({ userId, nextReview: { $lte: now }, status: 'active' });
        if (dueCards > 0) {
            items.push({
                title: `Flashcards Review (${dueCards} cards)`,
                type: 'flashcards',
                durationMinutes: Math.min(dueCards * 1.5, 45), // estimate 1.5 mins per card, max 45 mins
                priority: 100,
                reasoning: 'Spaced repetition works best when you review on time.',
            });
        }
        // 2. Pending Tasks
        const tasks = await Task_js_1.Task.find({ userId, status: { $ne: 'completed' } }).sort({ dueDate: 1 });
        for (const task of tasks) {
            const daysUntilDue = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            let priority = 50;
            let reasoning = 'Planned coursework.';
            if (daysUntilDue < 2) {
                priority = 95;
                reasoning = 'Deadline is extremely close.';
            }
            else if (daysUntilDue < 5) {
                priority = 75;
                reasoning = 'Deadline approaching.';
            }
            if (task.priority === 'urgent')
                priority += 10;
            if (task.priority === 'high')
                priority += 5;
            const remainingHours = task.estimatedHours - task.actualHours;
            if (remainingHours > 0) {
                items.push({
                    title: `Task: ${task.title}`,
                    type: 'task',
                    referenceId: task._id,
                    durationMinutes: Math.min(remainingHours * 60, 90), // Chunk into 90 min max
                    priority,
                    reasoning,
                });
            }
        }
        // 3. Upcoming Exams
        const exams = await Exam_js_1.Exam.find({ userId, status: 'upcoming' }).sort({ examDate: 1 });
        for (const exam of exams) {
            const daysUntil = (exam.examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
            if (daysUntil < 14) {
                items.push({
                    title: `Prep: ${exam.title}`,
                    type: 'exam_prep',
                    referenceId: exam._id,
                    durationMinutes: daysUntil < 3 ? 120 : 60,
                    priority: daysUntil < 3 ? 90 : 70,
                    reasoning: `Exam in ${Math.floor(daysUntil)} days.`,
                });
            }
        }
        // 4. Learning Path (Weak topics)
        const lp = await LearningPath_js_1.LearningPath.findOne({ userId });
        if (lp) {
            const pendingRec = lp.recommendations.find(r => r.status === 'pending');
            if (pendingRec) {
                items.push({
                    title: `Learning Path: ${pendingRec.topic}`,
                    type: 'learning_path',
                    referenceId: pendingRec._id,
                    durationMinutes: pendingRec.estimatedMinutes || 30,
                    priority: 80, // High priority to build foundations
                    reasoning: pendingRec.reason,
                });
            }
        }
        // Sort by priority descending
        items.sort((a, b) => b.priority - a.priority);
        return items;
    },
    // Adaptive Rescheduling
    rescheduleMissedSession: async (userId, sessionId) => {
        const session = await StudySession_js_1.StudySession.findOne({ _id: sessionId, userId });
        if (!session)
            throw new Error('Session not found');
        if (session.status === 'completed')
            throw new Error('Session is already completed');
        const now = new Date();
        const availableBlocks = await exports.plannerService.getAvailableTimeBlocks(userId, now);
        // Find first block that can fit this session today
        let replacementStart = null;
        let replacementEnd = null;
        for (const block of availableBlocks) {
            // Find space in this block that isn't occupied by other planned sessions
            const overlappingSessions = await StudySession_js_1.StudySession.find({
                userId,
                status: 'planned',
                startTime: { $lt: block.end },
                endTime: { $gt: block.start }
            }).sort({ startTime: 1 });
            let cursor = new Date(Math.max(now.getTime(), block.start.getTime()));
            for (const planned of overlappingSessions) {
                if (cursor < planned.startTime) {
                    const spaceMinutes = (planned.startTime.getTime() - cursor.getTime()) / 60000;
                    if (spaceMinutes >= session.durationMinutes) {
                        replacementStart = new Date(cursor);
                        replacementEnd = new Date(cursor.getTime() + session.durationMinutes * 60000);
                        break;
                    }
                }
                cursor = new Date(Math.max(cursor.getTime(), planned.endTime.getTime()));
            }
            if (!replacementStart && cursor < block.end) {
                const spaceMinutes = (block.end.getTime() - cursor.getTime()) / 60000;
                if (spaceMinutes >= session.durationMinutes) {
                    replacementStart = new Date(cursor);
                    replacementEnd = new Date(cursor.getTime() + session.durationMinutes * 60000);
                }
            }
            if (replacementStart)
                break;
        }
        if (!replacementStart || !replacementEnd) {
            throw new Error('No available time slots found today to reschedule this session. Consider moving it to tomorrow.');
        }
        session.status = 'missed';
        await session.save();
        // Generate explanation
        let aiExplanation = 'Rescheduled to the next available slot today based on your timetable.';
        try {
            const aiResponse = await aiOrchestrator_js_1.aiOrchestrator.processRequest({
                taskType: 'reasoning',
                message: `A student missed a ${session.durationMinutes} minute study session for "${session.title}". We deterministically rescheduled it to ${replacementStart.toLocaleTimeString()}. Give a brief, encouraging 1-sentence explanation of why we moved it here and why they shouldn't stress.`,
                options: { temperature: 0.7 }
            });
            if (aiResponse.text)
                aiExplanation = aiResponse.text;
        }
        catch (e) {
            // Fallback
        }
        const newSession = new StudySession_js_1.StudySession({
            userId,
            title: session.title,
            sessionType: session.sessionType,
            referenceId: session.referenceId,
            startTime: replacementStart,
            endTime: replacementEnd,
            durationMinutes: session.durationMinutes,
            status: 'planned',
            priorityScore: session.priorityScore + 5, // slightly increase priority so it doesn't get pushed forever
            reasoning: aiExplanation,
        });
        await newSession.save();
        return newSession;
    }
};
