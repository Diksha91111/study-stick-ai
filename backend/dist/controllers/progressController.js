"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgressDashboard = exports.recordProgressEvent = void 0;
const response_js_1 = require("../utils/response.js");
const ProgrammingProgress_js_1 = require("../models/ProgrammingProgress.js");
const processedEvents = new Map();
const EVENT_TTL_MS = 60 * 1000; // 1 minute TTL for duplicate event deduplication
const recordProgressEvent = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { topic, eventId, isCorrect, isExam, score, hintUsed, repeatedError } = req.body;
        const allowedTopics = [
            'Variables and data types',
            'Conditions and loops',
            'Arrays and strings',
            'Searching and sorting',
            'Recursion',
            'Linked lists, stacks, and queues',
            'Trees and graphs',
            'Dynamic programming',
            'Time and space complexity'
        ];
        if (!topic || !allowedTopics.includes(topic)) {
            (0, response_js_1.sendError)(res, 'Invalid or missing topic', 400);
            return;
        }
        if (eventId) {
            const now = Date.now();
            const lastSeen = processedEvents.get(eventId);
            if (lastSeen && now - lastSeen < EVENT_TTL_MS) {
                // Prevent duplicate event recording
                (0, response_js_1.sendSuccess)(res, null, 'Duplicate event ignored');
                return;
            }
            processedEvents.set(eventId, now);
            // Periodic cleanup of map
            if (processedEvents.size > 1000) {
                for (const [key, timestamp] of processedEvents.entries()) {
                    if (now - timestamp > EVENT_TTL_MS)
                        processedEvents.delete(key);
                }
            }
        }
        // We can track idempotency by checking if an eventId was recently processed, 
        // but a simple approach for now is just incrementing. 
        // Wait, the prompt says: "Prevent duplicate event recording when requests are retried."
        // Let's implement an EventId tracker, or since we don't have a model for it, we can store recent event IDs in memory or a redis cache. 
        // Alternatively, a simpler way is just a fast memory cache for event IDs to prevent duplicate retries.
        const update = { $inc: {}, $set: { lastActivity: new Date() } };
        if (isCorrect !== undefined) {
            update.$inc.attempts = 1;
            if (isCorrect) {
                update.$inc.correctAnswers = 1;
            }
        }
        if (isExam) {
            update.$inc.examQuestionsAttempted = 1;
            if (score !== undefined) {
                update.$inc.examScoreSum = score;
            }
        }
        if (hintUsed) {
            update.$inc.hintsRequested = 1;
        }
        if (repeatedError) {
            update.$addToSet = { recentErrors: repeatedError };
        }
        const progress = await ProgrammingProgress_js_1.ProgrammingProgress.findOneAndUpdate({ userId, topic }, update, { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true });
        (0, response_js_1.sendSuccess)(res, progress, 'Progress recorded successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.recordProgressEvent = recordProgressEvent;
const getProgressDashboard = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const progressList = await ProgrammingProgress_js_1.ProgrammingProgress.find({ userId }).sort({ lastActivity: -1 });
        const dashboard = progressList.map(p => {
            let mastery = null;
            let status = 'Not enough data';
            // Require at least 3 attempts to calculate a mastery percentage
            if (p.attempts >= 3) {
                mastery = Math.round((p.correctAnswers / p.attempts) * 100);
                if (mastery >= 80)
                    status = 'Mastered';
                else if (mastery >= 50)
                    status = 'Practicing';
                else
                    status = 'Needs Revision';
            }
            return {
                id: p._id,
                topic: p.topic,
                attempts: p.attempts,
                correctAnswers: p.correctAnswers,
                hintsRequested: p.hintsRequested,
                lessonsCompleted: p.lessonsCompleted,
                examQuestionsAttempted: p.examQuestionsAttempted,
                examScoreSum: p.examScoreSum,
                recentErrors: p.recentErrors.slice(-5), // Keep only last 5 recent errors to report
                lastActivity: p.lastActivity,
                mastery,
                status
            };
        });
        (0, response_js_1.sendSuccess)(res, dashboard, 'Progress dashboard retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getProgressDashboard = getProgressDashboard;
