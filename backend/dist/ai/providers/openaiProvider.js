"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const env_js_1 = require("../../config/env.js");
class OpenAIProvider {
    name = 'openai';
    isConfigured() {
        return Boolean(env_js_1.ENV.OPENAI_API_KEY && env_js_1.ENV.OPENAI_API_KEY.trim() !== '');
    }
    getDefaultModel(taskType) {
        switch (taskType) {
            case 'reasoning':
            case 'codeGeneration':
                return 'gpt-4o';
            case 'summarization':
            case 'chat':
            case 'streamingChat':
            default:
                return 'gpt-4o-mini';
        }
    }
    async generateResponse(request) {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in backend environment configuration.');
        }
        const model = this.getDefaultModel(request.taskType);
        const messages = this.formatMessages(request);
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${env_js_1.ENV.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model,
                    messages,
                    max_tokens: request.options?.maxTokens || env_js_1.ENV.AI_MAX_TOKENS,
                    temperature: request.options?.temperature ?? 0.7,
                }),
            });
            if (!response.ok) {
                const errorData = (await response.json().catch(() => ({})));
                throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || response.statusText}`);
            }
            const data = (await response.json());
            const text = data.choices?.[0]?.message?.content || '';
            return {
                text,
                provider: this.name,
                model: data.model || model,
                conversationId: request.conversationId,
                taskType: request.taskType,
                usage: {
                    promptTokens: data.usage?.prompt_tokens,
                    completionTokens: data.usage?.completion_tokens,
                    totalTokens: data.usage?.total_tokens,
                },
                finishReason: data.choices?.[0]?.finish_reason,
            };
        }
        catch (err) {
            throw new Error(`[OpenAIProvider] Execution failed: ${err.message}`);
        }
    }
    async generateStream(request, onChunk) {
        if (!this.isConfigured()) {
            throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY in backend environment configuration.');
        }
        const model = this.getDefaultModel(request.taskType);
        const messages = this.formatMessages(request);
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${env_js_1.ENV.OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: request.options?.maxTokens || env_js_1.ENV.AI_MAX_TOKENS,
                temperature: request.options?.temperature ?? 0.7,
                stream: true,
            }),
        });
        if (!response.ok || !response.body) {
            const errorData = (await response.json().catch(() => ({})));
            throw new Error(`OpenAI API streaming error (${response.status}): ${errorData.error?.message || response.statusText}`);
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                    const dataStr = trimmed.slice(6);
                    if (dataStr === '[DONE]') {
                        onChunk({ textChunk: '', provider: this.name, model, done: true });
                        return;
                    }
                    try {
                        const json = JSON.parse(dataStr);
                        const content = json.choices?.[0]?.delta?.content || '';
                        if (content) {
                            onChunk({ textChunk: content, provider: this.name, model, done: false });
                        }
                    }
                    catch {
                        // Ignore partial lines
                    }
                }
            }
        }
        onChunk({ textChunk: '', provider: this.name, model, done: true });
    }
    formatMessages(request) {
        const formatted = [];
        if (request.options?.systemInstruction) {
            formatted.push({ role: 'system', content: request.options.systemInstruction });
        }
        if (request.messages && request.messages.length > 0) {
            formatted.push(...request.messages);
        }
        else if (request.message) {
            formatted.push({ role: 'user', content: request.message });
        }
        return formatted;
    }
}
exports.OpenAIProvider = OpenAIProvider;
