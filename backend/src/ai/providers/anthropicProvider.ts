import { ENV } from '../../config/env.js';
import {
  IAIProvider,
  AIProviderName,
  AITaskType,
  AICompletionRequest,
  AICompletionResponse,
  AIStreamChunk,
} from '../types/ai.types.js';

export class AnthropicProvider implements IAIProvider {
  readonly name: AIProviderName = 'anthropic';

  isConfigured(): boolean {
    return Boolean(ENV.ANTHROPIC_API_KEY && ENV.ANTHROPIC_API_KEY.trim() !== '');
  }

  getDefaultModel(taskType?: AITaskType): string {
    switch (taskType) {
      case 'codeGeneration':
      case 'codeExplanation':
      case 'reasoning':
        return 'claude-3-5-sonnet-20241022';
      case 'summarization':
      case 'chat':
      case 'streamingChat':
      default:
        return 'claude-3-5-haiku-20241022';
    }
  }

  async generateResponse(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this.isConfigured()) {
      throw new Error(
        'Anthropic API key is missing. Set ANTHROPIC_API_KEY in backend environment configuration.'
      );
    }

    const model = this.getDefaultModel(request.taskType);
    const { system, messages } = this.formatMessages(request);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ENV.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          messages,
          ...(system && { system }),
          max_tokens: request.options?.maxTokens || ENV.AI_MAX_TOKENS,
          temperature: request.options?.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as any;
        throw new Error(
          `Anthropic API error (${response.status}): ${
            errorData.error?.message || response.statusText
          }`
        );
      }

      const data = (await response.json()) as any;
      const text =
        data.content
          ?.filter((c: any) => c.type === 'text')
          ?.map((c: any) => c.text)
          ?.join('\n') || '';

      return {
        text,
        provider: this.name,
        model: data.model || model,
        conversationId: request.conversationId,
        taskType: request.taskType,
        usage: {
          promptTokens: data.usage?.input_tokens,
          completionTokens: data.usage?.output_tokens,
          totalTokens:
            (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
        finishReason: data.stop_reason,
      };
    } catch (err: any) {
      throw new Error(`[AnthropicProvider] Execution failed: ${err.message}`);
    }
  }

  async generateStream(
    request: AICompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<void> {
    if (!this.isConfigured()) {
      throw new Error(
        'Anthropic API key is missing. Set ANTHROPIC_API_KEY in backend environment configuration.'
      );
    }

    const model = this.getDefaultModel(request.taskType);
    const { system, messages } = this.formatMessages(request);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ENV.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        messages,
        ...(system && { system }),
        max_tokens: request.options?.maxTokens || ENV.AI_MAX_TOKENS,
        temperature: request.options?.temperature ?? 0.7,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errorData = (await response.json().catch(() => ({}))) as any;
      throw new Error(
        `Anthropic API streaming error (${response.status}): ${
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
          try {
            const json = JSON.parse(trimmed.slice(6));
            if (json.type === 'content_block_delta' && json.delta?.text) {
              onChunk({ textChunk: json.delta.text, provider: this.name, model, done: false });
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
    let system = request.options?.systemInstruction || '';
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    if (request.messages && request.messages.length > 0) {
      for (const msg of request.messages) {
        if (msg.role === 'system') {
          system = system ? `${system}\n${msg.content}` : msg.content;
        } else {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        }
      }
    } else if (request.message) {
      messages.push({ role: 'user', content: request.message });
    }

    return { system, messages };
  }
}
