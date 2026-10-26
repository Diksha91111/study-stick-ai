"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAITutor = exports.submitAssessment = exports.generateAssessment = exports.getTopicContent = exports.updateRecommendation = exports.startTopic = exports.getLearningPath = void 0;
const learningPathService_js_1 = require("../services/learningPathService.js");
const response_js_1 = require("../utils/response.js");
const ProgrammingProgress_js_1 = require("../models/ProgrammingProgress.js");
const LearningPath_js_1 = require("../models/LearningPath.js");
const notificationService_js_1 = require("../services/notifications/notificationService.js");
const getLearningPath = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return (0, response_js_1.sendError)(res, 'Unauthorized', 401);
        const goal = req.query.goal;
        const path = await learningPathService_js_1.learningPathService.generateLearningPath(userId, goal);
        const states = await learningPathService_js_1.learningPathService.getTopicStates(userId);
        const progressList = await ProgrammingProgress_js_1.ProgrammingProgress.find({ userId }).select('topic status attempts correctAnswers examScoreSum');
        (0, response_js_1.sendSuccess)(res, {
            path,
            prerequisites: learningPathService_js_1.PREREQUISITES,
            states,
            progressList
        }, 'Learning path retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Error fetching learning path', 500);
    }
};
exports.getLearningPath = getLearningPath;
const startTopic = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return (0, response_js_1.sendError)(res, 'Unauthorized', 401);
        const { topic } = req.body;
        if (!topic)
            return (0, response_js_1.sendError)(res, 'Topic is required', 400);
        const result = await learningPathService_js_1.learningPathService.startTopic(userId, topic);
        // Schedule reminder to continue topic
        notificationService_js_1.notificationService.onLearningPathReminder(userId, topic).catch((err) => console.error('[LearningPath Event] Notification error:', err));
        (0, response_js_1.sendSuccess)(res, result, `Topic "${topic}" started successfully`);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Error starting topic', 400);
    }
};
exports.startTopic = startTopic;
const updateRecommendation = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return (0, response_js_1.sendError)(res, 'Unauthorized', 401);
        const { recommendationId } = req.params;
        const { status } = req.body;
        if (!['accepted', 'dismissed', 'completed'].includes(status)) {
            return (0, response_js_1.sendError)(res, 'Invalid status', 400);
        }
        const path = await learningPathService_js_1.learningPathService.updateRecommendationStatus(userId, recommendationId, status);
        const states = await learningPathService_js_1.learningPathService.getTopicStates(userId);
        const progressList = await ProgrammingProgress_js_1.ProgrammingProgress.find({ userId }).select('topic status attempts correctAnswers examScoreSum');
        (0, response_js_1.sendSuccess)(res, {
            path,
            prerequisites: learningPathService_js_1.PREREQUISITES,
            states,
            progressList
        }, `Recommendation marked as ${status}`);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Error updating recommendation', 500);
    }
};
exports.updateRecommendation = updateRecommendation;
const getTopicContent = async (req, res) => {
    try {
        const { topic } = req.params;
        if (!topic)
            return (0, response_js_1.sendError)(res, 'Topic parameter required', 400);
        const content = learningPathService_js_1.learningPathService.getTopicContent(topic);
        (0, response_js_1.sendSuccess)(res, { content }, 'Topic content retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Error retrieving topic content', 404);
    }
};
exports.getTopicContent = getTopicContent;
const generateAssessment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return (0, response_js_1.sendError)(res, 'Unauthorized', 401);
        const { topic } = req.body;
        if (!topic)
            return (0, response_js_1.sendError)(res, 'Topic is required', 400);
        const assessment = await learningPathService_js_1.learningPathService.generateAssessment(userId, topic);
        (0, response_js_1.sendSuccess)(res, { assessment }, 'Assessment generated');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Error generating assessment', 500);
    }
};
exports.generateAssessment = generateAssessment;
const submitAssessment = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId)
            return (0, response_js_1.sendError)(res, 'Unauthorized', 401);
        const { topic, userAnswers, timeTakenMinutes } = req.body;
        if (!topic || !Array.isArray(userAnswers)) {
            return (0, response_js_1.sendError)(res, 'Missing topic or userAnswers array', 400);
        }
        const result = await learningPathService_js_1.learningPathService.submitAssessment(userId, topic, userAnswers, timeTakenMinutes || 5);
        const states = await learningPathService_js_1.learningPathService.getTopicStates(userId);
        const progressList = await ProgrammingProgress_js_1.ProgrammingProgress.find({ userId }).select('topic status attempts correctAnswers examScoreSum');
        const updatedPath = await LearningPath_js_1.LearningPath.findOne({ userId });
        (0, response_js_1.sendSuccess)(res, {
            ...result,
            path: updatedPath,
            prerequisites: learningPathService_js_1.PREREQUISITES,
            states,
            progressList
        }, result.isPass ? 'Quiz passed successfully! Next task is available.' : 'Quiz completed. Needs revision.');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Error submitting assessment', 500);
    }
};
exports.submitAssessment = submitAssessment;
const askAITutor = async (req, res) => {
    try {
        const { topic, question } = req.body;
        if (!topic || !question)
            return (0, response_js_1.sendError)(res, 'Topic and question are required', 400);
        const answer = await learningPathService_js_1.learningPathService.askAITutor(topic, question);
        (0, response_js_1.sendSuccess)(res, { answer }, 'Tutor answer retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Error asking AI tutor', 500);
    }
};
exports.askAITutor = askAITutor;
