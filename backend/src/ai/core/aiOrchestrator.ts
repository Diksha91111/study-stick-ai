import {
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
  AIMessage,
} from '../types/ai.types.js';
import { modelRouter } from './modelRouter.js';
import { contextBuilder } from './contextBuilder.js';
import { responseParser } from './responseParser.js';
import { conversationMemory } from '../memory/conversationMemory.js';
import { studentMemory } from '../memory/studentMemory.js';
import { TutorMode } from '../../models/AIConversation.js';
import { ResourceService } from '../../services/resource/resourceService.js';

export class AIOrchestrator {
  async processRequest(request: AICompletionRequest): Promise<AICompletionResponse> {
    // 1. Input Validation
    const messageText = request.message || request.messages?.slice(-1)[0]?.content;
    if (!messageText || messageText.trim() === '') {
      throw new Error('Invalid request: message body cannot be empty.');
    }

    const conversationId =
      request.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 2. Task Classification
    const taskType = request.taskType || modelRouter.classifyTask(messageText);

    // 3. Model Router - Select Provider
    const provider = modelRouter.route(taskType, request.preferredProvider);

    // 4. Load Student Memory & Build Context with Tutor Mode and Study Resources
    let studentContext = null;
    if (request.studentId) {
      studentContext = await studentMemory.getStudentContext(request.studentId);
    }

    let resourceContext = request.options?.resourceContext || '';
    let retrievedSources: Array<{ resourceId: string; filename: string; page?: number; slide?: number; time?: string }> = [];
    let inlineImages = request.inlineImages || [];

    if (request.resourceIds && request.resourceIds.length > 0 && request.studentId) {
      const retrieved = await ResourceService.retrieveContextForQuery(
        request.studentId,
        request.resourceIds,
        messageText
      );
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

    const tutorMode: TutorMode = request.tutorMode || 'learn';
    const systemInstruction =
      request.options?.systemInstruction ||
      contextBuilder.buildSystemInstruction(taskType, tutorMode, studentContext, resourceContext);

    // 5. Build Message List (Combining history + current request)
    const history = conversationMemory.getHistory(conversationId);
    const messages: AIMessage[] = [...history];

    if (request.messages && request.messages.length > 0) {
      const newMsgs = request.messages.filter(
        (m) => !history.some((h) => h.content === m.content && h.role === m.role)
      );
      messages.push(...newMsgs);
    } else if (request.message) {
      messages.push({ role: 'user', content: request.message });
    }

    // 6. Execute Provider Call
    const providerRequest: AICompletionRequest = {
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
    const parsedResponse = responseParser.parseTextResponse(rawResponse);

    // 7. Update Memory
    if (request.message) {
      conversationMemory.addMessage(conversationId, { role: 'user', content: request.message });
    }
    if (parsedResponse.text) {
      conversationMemory.addMessage(conversationId, {
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

  async processStream(
    request: AICompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    const messageText = request.message || request.messages?.slice(-1)[0]?.content;
    if (!messageText || messageText.trim() === '') {
      throw new Error('Invalid request: message body cannot be empty.');
    }

    const conversationId =
      request.conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const taskType = request.taskType || modelRouter.classifyTask(messageText);
    const provider = modelRouter.route(taskType, request.preferredProvider);

    let studentContext = null;
    if (request.studentId) {
      studentContext = await studentMemory.getStudentContext(request.studentId);
    }

    let resourceContext = request.options?.resourceContext || '';
    let inlineImages = request.inlineImages || [];
    let retrievedSources: Array<{
      filename: string;
      pageNumber?: number;
      slideNumber?: number;
      timestamp?: string;
      sectionTitle?: string;
    }> = [];

    if (request.resourceIds && request.resourceIds.length > 0 && request.studentId) {
      const retrieved = await ResourceService.retrieveContextForQuery(
        request.studentId,
        request.resourceIds,
        messageText
      );
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

    const tutorMode: TutorMode = request.tutorMode || 'learn';
    const systemInstruction =
      request.options?.systemInstruction ||
      contextBuilder.buildSystemInstruction(taskType, tutorMode, studentContext, resourceContext);

    const history = conversationMemory.getHistory(conversationId);
    const messages: AIMessage[] = [...history];

    if (request.messages && request.messages.length > 0) {
      messages.push(...request.messages);
    } else if (request.message) {
      messages.push({ role: 'user', content: request.message });
    }

    const providerRequest: AICompletionRequest = {
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
      conversationMemory.addMessage(conversationId, { role: 'user', content: request.message });
    }
    if (fullText) {
      conversationMemory.addMessage(conversationId, { role: 'assistant', content: fullText });
    }
  }
}

export const aiOrchestrator = new AIOrchestrator();
