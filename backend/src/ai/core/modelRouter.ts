import { ENV } from '../../config/env.js';
import { IAIProvider, AIProviderName, AITaskType } from '../types/ai.types.js';
import { OpenAIProvider } from '../providers/openaiProvider.js';
import { GeminiProvider } from '../providers/geminiProvider.js';
import { AnthropicProvider } from '../providers/anthropicProvider.js';

export class ModelRouter {
  private providers: Map<AIProviderName, IAIProvider> = new Map();

  constructor() {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('anthropic', new AnthropicProvider());
  }

  getProvider(name: AIProviderName): IAIProvider | undefined {
    return this.providers.get(name);
  }

  getConfiguredProviders(): IAIProvider[] {
    return Array.from(this.providers.values()).filter((p) => p.isConfigured());
  }

  classifyTask(message: string): AITaskType {
    if (!message) return 'chat';
    const lower = message.toLowerCase();

    // Code keywords
    if (
      message.includes('```') ||
      /\b(code|function|debug|error|syntax|compile|refactor|class|script|html|css|js|ts|python|java|c\+\+|algo|ide)\b/i.test(
        lower
      )
    ) {
      if (/\b(explain|understand|what does|how does|walkthrough|comment)\b/i.test(lower)) {
        return 'codeExplanation';
      }
      return 'codeGeneration';
    }

    // Reasoning keywords
    if (
      /\b(solve|calculate|prove|derive|step by step|proof|math|physics|equation|logic|why|analyze)\b/i.test(
        lower
      )
    ) {
      return 'reasoning';
    }

    // Summarization keywords
    if (/\b(summarize|summary|tl;dr|key points|overview|abstract|brief)\b/i.test(lower)) {
      return 'summarization';
    }

    return 'chat';
  }

  route(taskType: AITaskType, preferredProvider?: AIProviderName): IAIProvider {
    // 1. If explicit preferred provider is requested and configured, use it
    if (preferredProvider) {
      const provider = this.providers.get(preferredProvider);
      if (provider && provider.isConfigured()) {
        return provider;
      }
    }

    // 2. Select configured target provider based on task configuration
    let targetName: AIProviderName = (ENV.AI_PRIMARY_PROVIDER as AIProviderName) || 'gemini';

    switch (taskType) {
      case 'codeGeneration':
      case 'codeExplanation':
      case 'codeFix':
      case 'codeRefactor':
      case 'codeOptimize':
      case 'codeTestGen':
      case 'codeConvert':
      case 'codeReview':
      case 'codeComments':
      case 'codeDebug':
        targetName = (ENV.AI_CODING_PROVIDER as AIProviderName) || 'gemini';
        break;
      case 'reasoning':
        targetName = (ENV.AI_REASONING_PROVIDER as AIProviderName) || 'gemini';
        break;
      case 'summarization':
      case 'chat':
      case 'streamingChat':
      default:
        targetName = (ENV.AI_FAST_PROVIDER as AIProviderName) || (ENV.AI_PRIMARY_PROVIDER as AIProviderName) || 'gemini';
        break;
    }

    const primaryTarget = this.providers.get(targetName);
    if (primaryTarget && primaryTarget.isConfigured()) {
      return primaryTarget;
    }

    // 3. Fallback to any configured provider in priority order [gemini, openai, anthropic]
    const fallbackPriority: AIProviderName[] = ['gemini', 'openai', 'anthropic'];
    for (const name of fallbackPriority) {
      const provider = this.providers.get(name);
      if (provider && provider.isConfigured()) {
        return provider;
      }
    }

    // 4. No provider is configured
    throw new Error(
      'AI service unavailable: No AI provider API keys configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY in backend environment.'
    );
  }
}

export const modelRouter = new ModelRouter();
