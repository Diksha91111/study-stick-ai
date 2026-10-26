"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiOrchestrator = exports.AIOrchestrator = void 0;
const modelRouter_js_1 = require("./modelRouter.js");
const contextBuilder_js_1 = require("./contextBuilder.js");
const responseParser_js_1 = require("./responseParser.js");
const conversationMemory_js_1 = require("../memory/conversationMemory.js");
const studentMemory_js_1 = require("../memory/studentMemory.js");
const resourceService_js_1 = require("../../services/resource/resourceService.js");
class AIOrchestrator {
    async processRequest(request) {
        // 1. Input Validation
        const messageText = request.message || request.messages?.slice(-1)[0]?.content;
        if (!messageText || messageText.trim() === '') {
            throw new Error('Invalid request: message body cannot be empty.');
        }
        const conversationId = request.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        // 2. Task Classification
        const taskType = request.taskType || modelRouter_js_1.modelRouter.classifyTask(messageText);
        // 3. Model Router - Select Provider
        const provider = modelRouter_js_1.modelRouter.route(taskType, request.preferredProvider);
        // 4. Load Student Memory & Build Context with Tutor Mode and Study Resources
        let studentContext = null;
        if (request.studentId) {
            studentContext = await studentMemory_js_1.studentMemory.getStudentContext(request.studentId);
        }
        let resourceContext = request.options?.resourceContext || '';
        let retrievedSources = [];
        let inlineImages = request.inlineImages || [];
        if (request.resourceIds && request.resourceIds.length > 0 && request.studentId) {
            const retrieved = await resourceService_js_1.ResourceService.retrieveContextForQuery(request.studentId, request.resourceIds, messageText);
            if (retrieved.formattedContext) {
                resourceContext = resourceContext
                    ? `${resourceContext}\n\n${retrieved.formattedContext}`
                    : retrieved.formattedContext;
            }
            retrievedSources = retrieved.sources;
            if (retrieved.inlineImages.length > 0) {
                inlineImages = [...inlineImages, ...retrieved.inlineImages];
            }
        }
        const tutorMode = request.tutorMode || 'learn';
        const systemInstruction = request.options?.systemInstruction ||
            contextBuilder_js_1.contextBuilder.buildSystemInstruction(taskType, tutorMode, studentContext, resourceContext);
        // 5. Build Message List (Combining history + current request)
        const history = conversationMemory_js_1.conversationMemory.getHistory(conversationId);
        const messages = [...history];
        if (request.messages && request.messages.length > 0) {
            const newMsgs = request.messages.filter((m) => !history.some((h) => h.content === m.content && h.role === m.role));
            messages.push(...newMsgs);
        }
        else if (request.message) {
            messages.push({ role: 'user', content: request.message });
        }
        // 6. Execute Provider Call
        const providerRequest = {
            ...request,
            conversationId,
            taskType,
            tutorMode,
            messages,
            inlineImages,
            options: {
                ...request.options,
                systemInstruction,
                resourceContext,
            },
        };
        const rawResponse = await provider.generateResponse(providerRequest);
        const parsedResponse = responseParser_js_1.responseParser.parseTextResponse(rawResponse);
        // 7. Update Memory
        if (request.message) {
            conversationMemory_js_1.conversationMemory.addMessage(conversationId, { role: 'user', content: request.message });
        }
        if (parsedResponse.text) {
            conversationMemory_js_1.conversationMemory.addMessage(conversationId, {
                role: 'assistant',
                content: parsedResponse.text,
            });
        }
        return {
            ...parsedResponse,
            conversationId,
            taskType,
            sources: retrievedSources.length > 0 ? retrievedSources : undefined,
        };
    }
    async processStream(request, onChunk) {
        const messageText = request.message || request.messages?.slice(-1)[0]?.content;
        if (!messageText || messageText.trim() === '') {
            throw new Error('Invalid request: message body cannot be empty.');
        }
        const conversationId = request.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const taskType = request.taskType || modelRouter_js_1.modelRouter.classifyTask(messageText);
        const provider = modelRouter_js_1.modelRouter.route(taskType, request.preferredProvider);
        let studentContext = null;
        if (request.studentId) {
            studentContext = await studentMemory_js_1.studentMemory.getStudentContext(request.studentId);
        }
        let resourceContext = request.options?.resourceContext || '';
        let inlineImages = request.inlineImages || [];
        let retrievedSources = [];
        if (request.resourceIds && request.resourceIds.length > 0 && request.studentId) {
            const retrieved = await resourceService_js_1.ResourceService.retrieveContextForQuery(request.studentId, request.resourceIds, messageText);
            if (retrieved.formattedContext) {
                resourceContext = resourceContext
                    ? `${resourceContext}\n\n${retrieved.formattedContext}`
                    : retrieved.formattedContext;
            }
            retrievedSources = retrieved.sources;
            if (retrieved.inlineImages.length > 0) {
                inlineImages = [...inlineImages, ...retrieved.inlineImages];
            }
        }
        const tutorMode = request.tutorMode || 'learn';
        const systemInstruction = request.options?.systemInstruction ||
            contextBuilder_js_1.contextBuilder.buildSystemInstruction(taskType, tutorMode, studentContext, resourceContext);
        const history = conversationMemory_js_1.conversationMemory.getHistory(conversationId);
        const messages = [...history];
        if (request.messages && request.messages.length > 0) {
            messages.push(...request.messages);
        }
        else if (request.message) {
            messages.push({ role: 'user', content: request.message });
        }
        const providerRequest = {
            ...request,
            conversationId,
            taskType,
            tutorMode,
            messages,
            inlineImages,
            options: {
                ...request.options,
                systemInstruction,
                resourceContext,
            },
        };
        if (retrievedSources.length > 0) {
            onChunk({
                textChunk: '',
                provider: provider.name,
                model: provider.getDefaultModel(),
                done: false,
                sources: retrievedSources,
            });
        }
        let fullText = '';
        await provider.generateStream(providerRequest, (chunk) => {
            if (chunk.textChunk) {
                fullText += chunk.textChunk;
            }
            onChunk(chunk);
        });
        if (request.message) {
            conversationMemory_js_1.conversationMemory.addMessage(conversationId, { role: 'user', content: request.message });
        }
        if (fullText) {
            conversationMemory_js_1.conversationMemory.addMessage(conversationId, { role: 'assistant', content: fullText });
        }
    }
}
exports.AIOrchestrator = AIOrchestrator;
exports.aiOrchestrator = new AIOrchestrator();
