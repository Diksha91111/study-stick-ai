"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelRouter = exports.ModelRouter = void 0;
const env_js_1 = require("../../config/env.js");
const openaiProvider_js_1 = require("../providers/openaiProvider.js");
const geminiProvider_js_1 = require("../providers/geminiProvider.js");
const anthropicProvider_js_1 = require("../providers/anthropicProvider.js");
class ModelRouter {
    providers = new Map();
    constructor() {
        this.providers.set('openai', new openaiProvider_js_1.OpenAIProvider());
        this.providers.set('gemini', new geminiProvider_js_1.GeminiProvider());
        this.providers.set('anthropic', new anthropicProvider_js_1.AnthropicProvider());
    }
    getProvider(name) {
        return this.providers.get(name);
    }
    getConfiguredProviders() {
        return Array.from(this.providers.values()).filter((p) => p.isConfigured());
    }
    classifyTask(message) {
        if (!message)
            return 'chat';
        const lower = message.toLowerCase();
        // Code keywords
        if (message.includes('```') ||
            /\b(code|function|debug|error|syntax|compile|refactor|class|script|html|css|js|ts|python|java|c\+\+|algo|ide)\b/i.test(lower)) {
            if (/\b(explain|understand|what does|how does|walkthrough|comment)\b/i.test(lower)) {
                return 'codeExplanation';
            }
            return 'codeGeneration';
        }
        // Reasoning keywords
        if (/\b(solve|calculate|prove|derive|step by step|proof|math|physics|equation|logic|why|analyze)\b/i.test(lower)) {
            return 'reasoning';
        }
        // Summarization keywords
        if (/\b(summarize|summary|tl;dr|key points|overview|abstract|brief)\b/i.test(lower)) {
            return 'summarization';
        }
        return 'chat';
    }
    route(taskType, preferredProvider) {
        // 1. If explicit preferred provider is requested and configured, use it
        if (preferredProvider) {
            const provider = this.providers.get(preferredProvider);
            if (provider && provider.isConfigured()) {
                return provider;
            }
        }
        // 2. Select configured target provider based on task configuration
        let targetName = env_js_1.ENV.AI_PRIMARY_PROVIDER || 'gemini';
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
                targetName = env_js_1.ENV.AI_CODING_PROVIDER || 'gemini';
                break;
            case 'reasoning':
                targetName = env_js_1.ENV.AI_REASONING_PROVIDER || 'gemini';
                break;
            case 'summarization':
            case 'chat':
            case 'streamingChat':
            default:
                targetName = env_js_1.ENV.AI_FAST_PROVIDER || env_js_1.ENV.AI_PRIMARY_PROVIDER || 'gemini';
                break;
        }
        const primaryTarget = this.providers.get(targetName);
        if (primaryTarget && primaryTarget.isConfigured()) {
            return primaryTarget;
        }
        // 3. Fallback to any configured provider in priority order [gemini, openai, anthropic]
        const fallbackPriority = ['gemini', 'openai', 'anthropic'];
        for (const name of fallbackPriority) {
            const provider = this.providers.get(name);
            if (provider && provider.isConfigured()) {
                return provider;
            }
        }
        // 4. No provider is configured
        throw new Error('AI service unavailable: No AI provider API keys configured. Set OPENAI_API_KEY, GEMINI_API_KEY, or ANTHROPIC_API_KEY in backend environment.');
    }
}
exports.ModelRouter = ModelRouter;
exports.modelRouter = new ModelRouter();
