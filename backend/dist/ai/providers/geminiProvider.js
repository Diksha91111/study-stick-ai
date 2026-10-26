"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
const env_js_1 = require("../../config/env.js");
class GeminiProvider {
    name = 'gemini';
    isConfigured() {
        return Boolean(env_js_1.ENV.GEMINI_API_KEY && env_js_1.ENV.GEMINI_API_KEY.trim() !== '');
    }
    getDefaultModel(taskType) {
        switch (taskType) {
            case 'codeGeneration':
            case 'codeExplanation':
            case 'reasoning':
                return 'gemini-3.5-flash';
            case 'summarization':
            case 'chat':
            case 'streamingChat':
            default:
                return 'gemini-3.5-flash';
        }
    }
    async generateResponse(request) {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in backend environment configuration.');
        }
        const model = this.getDefaultModel(request.taskType);
        const contents = this.formatContents(request);
        const maxRetries = 3;
        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env_js_1.ENV.GEMINI_API_KEY}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents,
                        generationConfig: {
                            maxOutputTokens: request.options?.maxTokens || env_js_1.ENV.AI_MAX_TOKENS,
                            temperature: request.options?.temperature ?? 0.7,
                        },
                        ...(request.options?.systemInstruction && {
                            systemInstruction: {
                                parts: [{ text: request.options.systemInstruction }],
                            },
                        }),
                    }),
                });
                if (!response.ok) {
                    if (response.status === 429 || response.status === 503 || response.status === 500) {
                        if (attempt < maxRetries) {
                            const retryAfter = response.headers.get('Retry-After');
                            let delay = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
                            if (retryAfter) {
                                const retryAfterMs = parseInt(retryAfter, 10) * 1000;
                                if (!isNaN(retryAfterMs))
                                    delay = retryAfterMs;
                            }
                            attempt++;
                            await new Promise(res => setTimeout(res, delay));
                            continue; // Retry
                        }
                    }
                    const errorData = (await response.json().catch(() => ({})));
                    throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || response.statusText}`);
                }
                const data = (await response.json());
                const candidate = data.candidates?.[0];
                const text = candidate?.content?.parts?.[0]?.text || '';
                return {
                    text,
                    provider: this.name,
                    model,
                    conversationId: request.conversationId,
                    taskType: request.taskType,
                    usage: {
                        promptTokens: data.usageMetadata?.promptTokenCount,
                        completionTokens: data.usageMetadata?.candidatesTokenCount,
                        totalTokens: data.usageMetadata?.totalTokenCount,
                    },
                    finishReason: candidate?.finishReason,
                };
            }
            catch (err) {
                if (attempt >= maxRetries || !(err.message.includes('429') || err.message.includes('503'))) {
                    const sanitized = (err.message || String(err)).replace(env_js_1.ENV.GEMINI_API_KEY, '[REDACTED_GEMINI_KEY]');
                    throw new Error(`[GeminiProvider] Execution failed: ${sanitized}`);
                }
                // If it's a fetch network error, we can retry it.
                attempt++;
                const delay = 1000 * Math.pow(2, attempt) + Math.random() * 1000;
                await new Promise(res => setTimeout(res, delay));
            }
        }
        throw new Error('Maximum retry limit reached for Gemini API');
    }
    async generateStream(request, onChunk) {
        if (!this.isConfigured()) {
            throw new Error('Gemini API key is missing. Set GEMINI_API_KEY in backend environment configuration.');
        }
        const model = this.getDefaultModel(request.taskType);
        const contents = this.formatContents(request);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${env_js_1.ENV.GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    maxOutputTokens: request.options?.maxTokens || env_js_1.ENV.AI_MAX_TOKENS,
                    temperature: request.options?.temperature ?? 0.7,
                },
                ...(request.options?.systemInstruction && {
                    systemInstruction: {
                        parts: [{ text: request.options.systemInstruction }],
                    },
                }),
            }),
        });
        if (!response.ok || !response.body) {
            const errorData = (await response.json().catch(() => ({})));
            throw new Error(`Gemini API streaming error (${response.status}): ${errorData.error?.message || response.statusText}`);
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
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        if (text) {
                            onChunk({ textChunk: text, provider: this.name, model, done: false });
                        }
                    }
                    catch {
                        // Ignore parse errors
                    }
                }
            }
        }
        onChunk({ textChunk: '', provider: this.name, model, done: true });
    }
    formatContents(request) {
        const contents = [];
        // Format image parts if present
        const imageParts = [];
        if (request.inlineImages && request.inlineImages.length > 0) {
            for (const img of request.inlineImages) {
                imageParts.push({
                    inlineData: {
                        mimeType: img.mimeType,
                        data: img.data,
                    },
                });
            }
        }
        if (request.messages && request.messages.length > 0) {
            for (let i = 0; i < request.messages.length; i++) {
                const msg = request.messages[i];
                if (msg.role === 'system')
                    continue;
                const isLast = i === request.messages.length - 1;
                const parts = [{ text: msg.content }];
                if (isLast && msg.role === 'user' && imageParts.length > 0) {
                    parts.unshift(...imageParts);
                }
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts,
                });
            }
        }
        else if (request.message) {
            const parts = [...imageParts, { text: request.message }];
            contents.push({
                role: 'user',
                parts,
            });
        }
        return contents;
    }
}
exports.GeminiProvider = GeminiProvider;
