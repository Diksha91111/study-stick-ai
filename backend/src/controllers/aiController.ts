import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';
import { modelRouter } from '../ai/core/modelRouter.js';
import { AIConversation, TutorMode } from '../models/AIConversation.js';
import { AIProviderName, AITaskType } from '../ai/types/ai.types.js';

// Get list of conversations for current student
export const getConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const conversations = await AIConversation.find({ userId })
      .select('title tutorMode updatedAt createdAt')
      .sort({ updatedAt: -1 });

    sendSuccess(res, conversations, 'Conversations retrieved');
  } catch (error) {
    next(error);
  }
};

// Create a new conversation session
export const createConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { title, tutorMode } = req.body;

    const conversation = await AIConversation.create({
      userId,
      title: title || 'New Study Session',
      tutorMode: (tutorMode as TutorMode) || 'learn',
      messages: [],
    });

    sendSuccess(res, conversation, 'Conversation created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// Get single conversation details with messages
export const getConversationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await AIConversation.findOne({ _id: id, userId });
    if (!conversation) {
      sendError(res, 'Conversation not found', 404);
      return;
    }

    sendSuccess(res, conversation, 'Conversation retrieved');
  } catch (error) {
    next(error);
  }
};

// Update conversation (title or tutor mode)
export const updateConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { title, tutorMode } = req.body;

    const conversation = await AIConversation.findOne({ _id: id, userId });
    if (!conversation) {
      sendError(res, 'Conversation not found', 404);
      return;
    }

    if (title) conversation.title = title;
    if (tutorMode) conversation.tutorMode = tutorMode as TutorMode;
    await conversation.save();

    sendSuccess(res, conversation, 'Conversation updated successfully');
  } catch (error) {
    next(error);
  }
};

// Delete a conversation
export const deleteConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const conversation = await AIConversation.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
      sendError(res, 'Conversation not found', 404);
      return;
    }

    sendSuccess(res, { id }, 'Conversation deleted successfully');
  } catch (error) {
    next(error);
  }
};

// Send message & receive AI response (persisted in DB)
export const handleAIChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, conversationId, taskType, tutorMode, preferredProvider, options, resourceIds } = req.body;
    const userId = req.user?.userId;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      sendError(res, 'Message string is required.', 400);
      return;
    }

    // 1. Fetch or create persistent DB Conversation
    let conversation = null;
    if (conversationId) {
      conversation = await AIConversation.findOne({ _id: conversationId, userId });
    }

    if (!conversation) {
      const generatedTitle =
        message.length > 30 ? `${message.substring(0, 30)}...` : message;
      conversation = await AIConversation.create({
        userId,
        title: generatedTitle,
        tutorMode: (tutorMode as TutorMode) || 'learn',
        messages: [],
      });
    }

    const currentTutorMode = tutorMode || conversation.tutorMode || 'learn';

    // 2. Process via AI Orchestrator
    const response = await aiOrchestrator.processRequest({
      message,
      conversationId: conversation._id.toString(),
      studentId: userId,
      taskType: taskType as AITaskType,
      tutorMode: currentTutorMode,
      preferredProvider: preferredProvider as AIProviderName,
      resourceIds: Array.isArray(resourceIds) ? resourceIds : undefined,
      options,
    });

    // 3. Persist messages in DB
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    conversation.messages.push({
      role: 'assistant',
      content: response.text,
      sources: response.sources,
      timestamp: new Date(),
    });

    // Auto-update conversation title if it was default
    if (conversation.messages.length <= 2 && conversation.title === 'New Study Session') {
      conversation.title = message.length > 35 ? `${message.substring(0, 35)}...` : message;
    }

    await conversation.save();

    sendSuccess(
      res,
      {
        ...response,
        conversationId: conversation._id.toString(),
        tutorMode: conversation.tutorMode,
        title: conversation.title,
      },
      'AI response generated successfully'
    );
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('No AI provider API keys configured') ||
        error.message.includes('API key is missing'))
    ) {
      sendError(res, error.message, 503);
      return;
    }
    if (
      error.message &&
      (error.message.includes('Quota exceeded') ||
        error.message.includes('429') ||
        error.message.includes('RESOURCE_EXHAUSTED'))
    ) {
      sendError(res, 'AI provider quota exceeded. Please check your provider usage or try again later.', 429);
      return;
    }
    if (
      error.message &&
      (error.message.includes('fetch failed') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ENOTFOUND'))
    ) {
      sendError(res, 'AI service temporary connection error. Please try again.', 503);
      return;
    }
    next(error);
  }
};

// Stream AI response (persisted in DB upon completion)
export const handleAIStreamChat = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { message, conversationId, taskType, tutorMode, preferredProvider, resourceIds } = req.body;
    const userId = req.user?.userId;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      sendError(res, 'Message string is required for streaming.', 400);
      return;
    }

    let conversation = null;
    if (conversationId) {
      conversation = await AIConversation.findOne({ _id: conversationId, userId });
    }

    if (!conversation) {
      const generatedTitle =
        message.length > 30 ? `${message.substring(0, 30)}...` : message;
      conversation = await AIConversation.create({
        userId,
        title: generatedTitle,
        tutorMode: (tutorMode as TutorMode) || 'learn',
        messages: [],
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullText = '';
    let capturedSources: any[] | undefined = undefined;
    await aiOrchestrator.processStream(
      {
        message,
        conversationId: conversation._id.toString(),
        studentId: userId,
        taskType: taskType as AITaskType,
        tutorMode: tutorMode || conversation.tutorMode || 'learn',
        preferredProvider: preferredProvider as AIProviderName,
        resourceIds: Array.isArray(resourceIds) ? resourceIds : undefined,
      },
      (chunk) => {
        if (chunk.sources) {
          capturedSources = chunk.sources;
        }
        if (chunk.textChunk) {
          fullText += chunk.textChunk;
        }
        res.write(`data: ${JSON.stringify({ ...chunk, conversationId: conversation._id.toString() })}\n\n`);
      }
    );

    // Save to DB
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });
    if (fullText) {
      conversation.messages.push({
        role: 'assistant',
        content: fullText,
        sources: capturedSources,
        timestamp: new Date(),
      });
    }
    await conversation.save();

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    if (!res.headersSent) {
      if (
        error.message &&
        (error.message.includes('API key is missing') ||
          error.message.includes('No AI provider API keys configured'))
      ) {
        sendError(res, error.message, 503);
        return;
      }
      if (
        error.message &&
        (error.message.includes('Quota exceeded') ||
          error.message.includes('429') ||
          error.message.includes('RESOURCE_EXHAUSTED'))
      ) {
        sendError(res, 'AI provider quota exceeded. Please check your provider usage or try again later.', 429);
        return;
      }
      if (
        error.message &&
        (error.message.includes('fetch failed') ||
          error.message.includes('ECONNRESET') ||
          error.message.includes('ENOTFOUND'))
      ) {
        sendError(res, 'AI service temporary connection error. Please try again.', 503);
        return;
      }
      next(error);
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
      res.end();
    }
  }
};

export const getAIProviderStatus = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const configured = modelRouter.getConfiguredProviders().map((p) => ({
      name: p.name,
      defaultModel: p.getDefaultModel(),
      status: 'configured',
    }));

    sendSuccess(
      res,
      {
        configuredProviders: configured,
        hasActiveProvider: configured.length > 0,
      },
      'AI Provider status retrieved'
    );
  } catch (error) {
    next(error);
  }
};
