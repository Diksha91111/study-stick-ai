import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { learningPathService, PREREQUISITES } from '../services/learningPathService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { ProgrammingProgress, ProgrammingTopic } from '../models/ProgrammingProgress.js';
import { LearningPath } from '../models/LearningPath.js';
import { notificationService } from '../services/notifications/notificationService.js';

export const getLearningPath = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);

    const goal = req.query.goal as string;
    const path = await learningPathService.generateLearningPath(userId, goal);
    
    const states = await learningPathService.getTopicStates(userId);
    const progressList = await ProgrammingProgress.find({ userId }).select('topic status attempts correctAnswers examScoreSum');

    sendSuccess(res, {
      path,
      prerequisites: PREREQUISITES,
      states,
      progressList
    }, 'Learning path retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Error fetching learning path', 500);
  }
};

export const startTopic = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);

    const { topic } = req.body;
    if (!topic) return sendError(res, 'Topic is required', 400);

    const result = await learningPathService.startTopic(userId, topic as ProgrammingTopic);

    // Schedule reminder to continue topic
    notificationService.onLearningPathReminder(userId, topic).catch((err) =>
      console.error('[LearningPath Event] Notification error:', err)
    );

    sendSuccess(res, result, `Topic "${topic}" started successfully`);
  } catch (error: any) {
    sendError(res, error.message || 'Error starting topic', 400);
  }
};

export const updateRecommendation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);

    const { recommendationId } = req.params;
    const { status } = req.body;

    if (!['accepted', 'dismissed', 'completed'].includes(status)) {
      return sendError(res, 'Invalid status', 400);
    }

    const path = await learningPathService.updateRecommendationStatus(userId, recommendationId, status);
    
    const states = await learningPathService.getTopicStates(userId);
    const progressList = await ProgrammingProgress.find({ userId }).select('topic status attempts correctAnswers examScoreSum');

    sendSuccess(res, {
      path,
      prerequisites: PREREQUISITES,
      states,
      progressList
    }, `Recommendation marked as ${status}`);
  } catch (error: any) {
    sendError(res, error.message || 'Error updating recommendation', 500);
  }
};

export const getTopicContent = async (req: AuthRequest, res: Response) => {
  try {
    const { topic } = req.params;
    if (!topic) return sendError(res, 'Topic parameter required', 400);

    const content = learningPathService.getTopicContent(topic as ProgrammingTopic);
    sendSuccess(res, { content }, 'Topic content retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Error retrieving topic content', 404);
  }
};

export const generateAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);

    const { topic } = req.body;
    if (!topic) return sendError(res, 'Topic is required', 400);

    const assessment = await learningPathService.generateAssessment(userId, topic as ProgrammingTopic);
    sendSuccess(res, { assessment }, 'Assessment generated');
  } catch (error: any) {
    sendError(res, error.message || 'Error generating assessment', 500);
  }
};

export const submitAssessment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 'Unauthorized', 401);

    const { topic, userAnswers, timeTakenMinutes } = req.body;
    if (!topic || !Array.isArray(userAnswers)) {
      return sendError(res, 'Missing topic or userAnswers array', 400);
    }

    const result = await learningPathService.submitAssessment(
      userId, 
      topic as ProgrammingTopic, 
      userAnswers, 
      timeTakenMinutes || 5
    );

    const states = await learningPathService.getTopicStates(userId);
    const progressList = await ProgrammingProgress.find({ userId }).select('topic status attempts correctAnswers examScoreSum');
    const updatedPath = await LearningPath.findOne({ userId });

    sendSuccess(res, {
      ...result,
      path: updatedPath,
      prerequisites: PREREQUISITES,
      states,
      progressList
    }, result.isPass ? 'Quiz passed successfully! Next task is available.' : 'Quiz completed. Needs revision.');
  } catch (error: any) {
    sendError(res, error.message || 'Error submitting assessment', 500);
  }
};

export const askAITutor = async (req: AuthRequest, res: Response) => {
  try {
    const { topic, question } = req.body;
    if (!topic || !question) return sendError(res, 'Topic and question are required', 400);

    const answer = await learningPathService.askAITutor(topic, question);
    sendSuccess(res, { answer }, 'Tutor answer retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Error asking AI tutor', 500);
  }
};
