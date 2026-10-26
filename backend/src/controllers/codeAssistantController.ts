import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';
import { promptManager } from '../ai/core/promptManager.js';
import { AIConversation } from '../models/AIConversation.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import {
  AICodeAction,
  AICodeAssistantRequestPayload,
  AICodeAssistantResponseData,
  AIProviderName,
  AITaskType,
} from '../ai/types/ai.types.js';

const ALLOWED_ACTIONS: AICodeAction[] = [
  'explain',
  'teach',
  'hint',
  'debug',
  'interview',
  'exam',
];

const MAX_PAYLOAD_BYTES = 50 * 1024; // 50 KB Limit

/**
 * Strips sensitive keys/secrets if accidentally present in code or error context
 */
function sanitizeText(input?: string): string {
  if (!input) return '';
  return input
    .replace(/(mongodb(\+srv)?:\/\/[^\s"']+)/gi, '[REDACTED_MONGO_URI]')
    .replace(/(eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*)/g, '[REDACTED_JWT_TOKEN]')
    .replace(/(AIzaSy[A-Za-z0-9-_]{33})/g, '[REDACTED_GEMINI_KEY]')
    .replace(/(sk-[A-Za-z0-9]{32,})/g, '[REDACTED_API_KEY]');
}

/**
 * Parses raw AI text output into structured explanation + proposed code
 */
function parseStructuredAIOutput(
  rawText: string,
  action: AICodeAction,
  language: string,
  targetLanguage?: string
): { explanation: string; proposedCode?: string; hasCodeChanges: boolean } {
  const codeModifyingActions: AICodeAction[] = [
    'debug',
    'exam'
  ];

  const expectsCode = codeModifyingActions.includes(action);

  // 1. Try JSON parse
  try {
    const cleanedText = rawText.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const jsonParsed = JSON.parse(cleanedText);
    if (jsonParsed && typeof jsonParsed === 'object' && jsonParsed.explanation) {
      return {
        explanation: String(jsonParsed.explanation),
        proposedCode: jsonParsed.proposedCode ? String(jsonParsed.proposedCode).trim() : undefined,
        hasCodeChanges: Boolean(jsonParsed.proposedCode && String(jsonParsed.proposedCode).trim() !== ''),
      };
    }
  } catch {
    // Fall back to Markdown parsing
  }

  // 2. Markdown Fallback Parsing
  if (!expectsCode) {
    return {
      explanation: rawText.trim(),
      proposedCode: undefined,
      hasCodeChanges: false,
    };
  }

  // Look for ```language ... ``` block
  const codeBlockRegex = /```(?:[a-zA-Z0-9_+-]+)?\n([\s\S]*?)\n```/g;
  const matches = [...rawText.matchAll(codeBlockRegex)];

  if (matches.length > 0) {
    // Last or longest code block is treated as proposed code
    const proposedCode = matches[matches.length - 1][1].trim();
    // Explanation is text before code block
    const explanation = rawText.replace(codeBlockRegex, '').trim() || rawText.trim();
    return {
      explanation,
      proposedCode,
      hasCodeChanges: proposedCode.length > 0,
    };
  }

  return {
    explanation: rawText.trim(),
    proposedCode: undefined,
    hasCodeChanges: false,
  };
}

export const handleCodeAssistant = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const body: AICodeAssistantRequestPayload = req.body;

    // 1. Validate Action
    if (!body.action || !ALLOWED_ACTIONS.includes(body.action)) {
      sendError(
        res,
        `Invalid action '${body.action}'. Allowed actions: ${ALLOWED_ACTIONS.join(', ')}`,
        400
      );
      return;
    }

    // 2. Validate Language
    if (!body.language || typeof body.language !== 'string') {
      sendError(res, 'Language parameter is required.', 400);
      return;
    }

    // 3. Payload Size Check
    const rawPayloadSize = JSON.stringify(body).length;
    if (rawPayloadSize > MAX_PAYLOAD_BYTES) {
      sendError(
        res,
        `Payload size (${Math.round(rawPayloadSize / 1024)} KB) exceeds maximum allowed limit of 50 KB.`,
        400
      );
      return;
    }

    // 4. Sanitize Context inputs
    const sanitizedCode = sanitizeText(body.code);
    const sanitizedSelectedCode = sanitizeText(body.selectedCode);
    const sanitizedUserPrompt = sanitizeText(body.userPrompt);
    const sanitizedStderr = sanitizeText(body.errorContext?.stderr);
    const sanitizedStdout = sanitizeText(body.errorContext?.stdout);

    // 5. Construct User Prompt Message for AI Orchestrator
    const promptParts: string[] = [];
    promptParts.push(`Action Requested: ${body.action.toUpperCase()}`);
    promptParts.push(`Target Language: ${body.targetLanguage || body.language}`);

    if (sanitizedUserPrompt) {
      promptParts.push(`User Request: "${sanitizedUserPrompt}"`);
    }

    if (sanitizedSelectedCode) {
      promptParts.push(`Selected Code snippet:\n\`\`\`${body.language}\n${sanitizedSelectedCode}\n\`\`\``);
    }

    if (sanitizedCode) {
      promptParts.push(`Full Code File Context:\n\`\`\`${body.language}\n${sanitizedCode}\n\`\`\``);
    }

    if (sanitizedStderr || sanitizedStdout) {
      promptParts.push(`Terminal Output / Errors:`);
      if (sanitizedStderr) promptParts.push(`STDERR:\n${sanitizedStderr}`);
      if (sanitizedStdout) promptParts.push(`STDOUT:\n${sanitizedStdout}`);
    }

    const compiledUserMessage = promptParts.join('\n\n');

    // 5.5 Fetch Student Progress & Learning Path Context
    const recentProgress = await ProgrammingProgress.find({ userId }).sort({ lastActivity: -1 }).limit(5);
    const { LearningPath } = await import('../models/LearningPath.js');
    const path = await LearningPath.findOne({ userId });

    let contextNote = '';
    if (recentProgress.length > 0) {
      const progressText = recentProgress.map(p => {
         const mastery = p.attempts >= 3 ? Math.round((p.correctAnswers / p.attempts) * 100) + '%' : 'Not enough data';
         return `- Topic: ${p.topic} | Mastery: ${mastery} | Errors: ${p.recentErrors.slice(-2).join(', ') || 'None'}`;
      }).join('\n');
      contextNote += `[SYSTEM NOTE: Student Progress]\n${progressText}\n`;
    }

    if (path) {
      const acceptedRecs = path.recommendations.filter((r: any) => r.status === 'accepted');
      if (acceptedRecs.length > 0) {
        contextNote += `[SYSTEM NOTE: Current Learning Goal]\nGoal: ${path.currentGoal}\nWorking On: ${acceptedRecs.map((r: any) => r.topic).join(', ')}\n`;
      }
    }

    if (contextNote) {
      promptParts.push(`${contextNote}Use this context to adapt your response if teaching or explaining concepts.`);
    }

    const finalUserMessage = promptParts.join('\n\n');

    // 6. DB Conversation Fetch / Create
    let conversation = null;
    if (body.conversationId) {
      conversation = await AIConversation.findOne({ _id: body.conversationId, userId });
    }

    if (!conversation) {
      conversation = await AIConversation.create({
        userId,
        title: `Code Lab AI (${body.action})`,
        tutorMode: 'practice',
        messages: [],
      });
    }

    // 7. System Prompt Instruction
    const systemInstruction = promptManager.getCodeAssistantInstruction(
      body.action,
      body.language,
      body.targetLanguage
    );

    // Map to AITaskType
    const taskTypeMap: Record<AICodeAction, AITaskType> = {
      explain: 'codeExplanation',
      teach: 'chat',
      hint: 'chat',
      debug: 'codeDebug',
      interview: 'chat',
      exam: 'chat',
    };

    // 8. Process via AI Orchestrator
    const aiResponse = await aiOrchestrator.processRequest({
      message: finalUserMessage,
      conversationId: conversation._id.toString(),
      studentId: userId,
      taskType: taskTypeMap[body.action] || 'codeExplanation',
      tutorMode: 'practice',
      preferredProvider: body.preferredProvider as AIProviderName,
      options: {
        systemInstruction,
        temperature: body.action === 'explain' ? 0.4 : 0.2,
      },
    });

    // 9. Parse Response into Structured Output
    const parsed = parseStructuredAIOutput(
      aiResponse.text,
      body.action,
      body.language,
      body.targetLanguage
    );

    // 10. Persist Conversation in DB
    conversation.messages.push({
      role: 'user',
      content: `[Action: ${body.action}] ${sanitizedUserPrompt || 'Process code snippet'}`,
      timestamp: new Date(),
    });
    conversation.messages.push({
      role: 'assistant',
      content: parsed.explanation,
      timestamp: new Date(),
    });
    await conversation.save();

    // 11. Send Success Response
    const responseData: AICodeAssistantResponseData = {
      action: body.action,
      explanation: parsed.explanation,
      proposedCode: parsed.proposedCode,
      hasCodeChanges: parsed.hasCodeChanges,
      language: body.targetLanguage || body.language,
      provider: aiResponse.provider,
      model: aiResponse.model,
      conversationId: conversation._id.toString(),
    };

    sendSuccess(res, responseData, 'AI Code Assistant task completed successfully');
  } catch (error: any) {
    if (
      error.message &&
      (error.message.includes('No AI provider API keys configured') ||
        error.message.includes('API key is missing'))
    ) {
      sendError(
        res,
        'AI Code Assistant is currently unavailable: No AI provider API keys configured on backend.',
        503
      );
      return;
    }
    next(error);
  }
};
