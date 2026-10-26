"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAIProviderStatus = exports.handleAIStreamChat = exports.handleAIChat = exports.deleteConversation = exports.updateConversation = exports.getConversationById = exports.createConversation = exports.getConversations = void 0;
const response_js_1 = require("../utils/response.js");
const aiOrchestrator_js_1 = require("../ai/core/aiOrchestrator.js");
const modelRouter_js_1 = require("../ai/core/modelRouter.js");
const AIConversation_js_1 = require("../models/AIConversation.js");
// Get list of conversations for current student
const getConversations = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const conversations = await AIConversation_js_1.AIConversation.find({ userId })
            .select('title tutorMode updatedAt createdAt')
            .sort({ updatedAt: -1 });
        (0, response_js_1.sendSuccess)(res, conversations, 'Conversations retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getConversations = getConversations;
// Create a new conversation session
const createConversation = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { title, tutorMode } = req.body;
        const conversation = await AIConversation_js_1.AIConversation.create({
            userId,
            title: title || 'New Study Session',
            tutorMode: tutorMode || 'learn',
            messages: [],
        });
        (0, response_js_1.sendSuccess)(res, conversation, 'Conversation created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createConversation = createConversation;
// Get single conversation details with messages
const getConversationById = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const conversation = await AIConversation_js_1.AIConversation.findOne({ _id: id, userId });
        if (!conversation) {
            (0, response_js_1.sendError)(res, 'Conversation not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, conversation, 'Conversation retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getConversationById = getConversationById;
// Update conversation (title or tutor mode)
const updateConversation = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const { title, tutorMode } = req.body;
        const conversation = await AIConversation_js_1.AIConversation.findOne({ _id: id, userId });
        if (!conversation) {
            (0, response_js_1.sendError)(res, 'Conversation not found', 404);
            return;
        }
        if (title)
            conversation.title = title;
        if (tutorMode)
            conversation.tutorMode = tutorMode;
        await conversation.save();
        (0, response_js_1.sendSuccess)(res, conversation, 'Conversation updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateConversation = updateConversation;
// Delete a conversation
const deleteConversation = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { id } = req.params;
        const conversation = await AIConversation_js_1.AIConversation.findOneAndDelete({ _id: id, userId });
        if (!conversation) {
            (0, response_js_1.sendError)(res, 'Conversation not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, { id }, 'Conversation deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteConversation = deleteConversation;
// Send message & receive AI response (persisted in DB)
const handleAIChat = async (req, res, next) => {
    try {
        const { message, conversationId, taskType, tutorMode, preferredProvider, options, resourceIds } = req.body;
        const userId = req.user?.userId;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            (0, response_js_1.sendError)(res, 'Message string is required.', 400);
            return;
        }
        // 1. Fetch or create persistent DB Conversation
        let conversation = null;
        if (conversationId) {
            conversation = await AIConversation_js_1.AIConversation.findOne({ _id: conversationId, userId });
        }
        if (!conversation) {
            const generatedTitle = message.length > 30 ? `${message.substring(0, 30)}...` : message;
            conversation = await AIConversation_js_1.AIConversation.create({
                userId,
                title: generatedTitle,
                tutorMode: tutorMode || 'learn',
                messages: [],
            });
        }
        const currentTutorMode = tutorMode || conversation.tutorMode || 'learn';
        // 2. Process via AI Orchestrator
        const response = await aiOrchestrator_js_1.aiOrchestrator.processRequest({
            message,
            conversationId: conversation._id.toString(),
            studentId: userId,
            taskType: taskType,
            tutorMode: currentTutorMode,
            preferredProvider: preferredProvider,
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
        (0, response_js_1.sendSuccess)(res, {
            ...response,
            conversationId: conversation._id.toString(),
            tutorMode: conversation.tutorMode,
            title: conversation.title,
        }, 'AI response generated successfully');
    }
    catch (error) {
        if (error.message &&
            (error.message.includes('No AI provider API keys configured') ||
                error.message.includes('API key is missing'))) {
            (0, response_js_1.sendError)(res, error.message, 503);
            return;
        }
        if (error.message &&
            (error.message.includes('Quota exceeded') ||
                error.message.includes('429') ||
                error.message.includes('RESOURCE_EXHAUSTED'))) {
            (0, response_js_1.sendError)(res, 'AI provider quota exceeded. Please check your provider usage or try again later.', 429);
            return;
        }
        if (error.message &&
            (error.message.includes('fetch failed') ||
                error.message.includes('ECONNRESET') ||
                error.message.includes('ENOTFOUND'))) {
            (0, response_js_1.sendError)(res, 'AI service temporary connection error. Please try again.', 503);
            return;
        }
        next(error);
    }
};
exports.handleAIChat = handleAIChat;
// Stream AI response (persisted in DB upon completion)
const handleAIStreamChat = async (req, res, next) => {
    try {
        const { message, conversationId, taskType, tutorMode, preferredProvider, resourceIds } = req.body;
        const userId = req.user?.userId;
        if (!message || typeof message !== 'string' || message.trim() === '') {
            (0, response_js_1.sendError)(res, 'Message string is required for streaming.', 400);
            return;
        }
        let conversation = null;
        if (conversationId) {
            conversation = await AIConversation_js_1.AIConversation.findOne({ _id: conversationId, userId });
        }
        if (!conversation) {
            const generatedTitle = message.length > 30 ? `${message.substring(0, 30)}...` : message;
            conversation = await AIConversation_js_1.AIConversation.create({
                userId,
                title: generatedTitle,
                tutorMode: tutorMode || 'learn',
                messages: [],
            });
        }
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        let fullText = '';
        let capturedSources = undefined;
        await aiOrchestrator_js_1.aiOrchestrator.processStream({
            message,
            conversationId: conversation._id.toString(),
            studentId: userId,
            taskType: taskType,
            tutorMode: tutorMode || conversation.tutorMode || 'learn',
            preferredProvider: preferredProvider,
            resourceIds: Array.isArray(resourceIds) ? resourceIds : undefined,
        }, (chunk) => {
            if (chunk.sources) {
                capturedSources = chunk.sources;
            }
            if (chunk.textChunk) {
                fullText += chunk.textChunk;
            }
            res.write(`data: ${JSON.stringify({ ...chunk, conversationId: conversation._id.toString() })}\n\n`);
        });
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
    }
    catch (error) {
        if (!res.headersSent) {
            if (error.message &&
                (error.message.includes('API key is missing') ||
                    error.message.includes('No AI provider API keys configured'))) {
                (0, response_js_1.sendError)(res, error.message, 503);
                return;
            }
            if (error.message &&
                (error.message.includes('Quota exceeded') ||
                    error.message.includes('429') ||
                    error.message.includes('RESOURCE_EXHAUSTED'))) {
                (0, response_js_1.sendError)(res, 'AI provider quota exceeded. Please check your provider usage or try again later.', 429);
                return;
            }
            if (error.message &&
                (error.message.includes('fetch failed') ||
                    error.message.includes('ECONNRESET') ||
                    error.message.includes('ENOTFOUND'))) {
                (0, response_js_1.sendError)(res, 'AI service temporary connection error. Please try again.', 503);
                return;
            }
            next(error);
        }
        else {
            res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
            res.end();
        }
    }
};
exports.handleAIStreamChat = handleAIStreamChat;
const getAIProviderStatus = async (_req, res, next) => {
    try {
        const configured = modelRouter_js_1.modelRouter.getConfiguredProviders().map((p) => ({
            name: p.name,
            defaultModel: p.getDefaultModel(),
            status: 'configured',
        }));
        (0, response_js_1.sendSuccess)(res, {
            configuredProviders: configured,
            hasActiveProvider: configured.length > 0,
        }, 'AI Provider status retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getAIProviderStatus = getAIProviderStatus;
