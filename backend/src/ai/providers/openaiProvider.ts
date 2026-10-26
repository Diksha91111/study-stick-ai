import { ENV } from '../../config/env.js';
import {
  IAIProvider,
  AIProviderName,
  AITaskType,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from '../types/ai.types.js';

export class OpenAIProvider implements IAIProvider {
  readonly name: AIProviderName = 'openai';

  isConfigured(): boolean {
    return Boolean(ENV.OPENAI_API_KEY && ENV.OPENAI_API_KEY.trim() !== '');
  }

  getDefaultModel(taskType?: AITaskType): string {
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

  async generateResponse(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'OpenAI API key is missing. Set OPENAI_API_KEY in backend environment configuration.'
      );
    }

    const model = this.getDefaultModel(request.taskType);
    const messages = this.formatMessages(request);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: request.options?.maxTokens || ENV.AI_MAX_TOKENS,
          temperature: request.options?.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          `OpenAI API error (${response.status}): ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = (await response.json()) as any;
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
    } catch (err: any) {
      throw new Error(`[OpenAIProvider] Execution failed: ${err.message}`);
    }
  }

  async generateStream(
    request: AICompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        'OpenAI API key is missing. Set OPENAI_API_KEY in backend environment configuration.'
      );
    }

    const model = this.getDefaultModel(request.taskType);
    const messages = this.formatMessages(request);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ENV.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.options?.maxTokens || ENV.AI_MAX_TOKENS,
        temperature: request.options?.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      throw new Error(
        `OpenAI API streaming error (${response.status}): ${
          errorData.error?.message || response.statusText
        }`
      );
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

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
          } catch {
            // Ignore partial lines
          }
        }
      }
    }

    onChunk({ textChunk: '', provider: this.name, model, done: true });
  }

  private formatMessages(request: AICompletionRequest) {
    const formatted = [];
    if (request.options?.systemInstruction) {
      formatted.push({ role: 'system', content: request.options.systemInstruction });
    }
    if (request.messages && request.messages.length > 0) {
      formatted.push(...request.messages);
    } else if (request.message) {
      formatted.push({ role: 'user', content: request.message });
    }
    return formatted;
  }
}
