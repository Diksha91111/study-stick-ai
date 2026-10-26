import { AICompletionResponse } from '../types/ai.types.js';

export class ResponseParser {
  parseTextResponse(rawResponse: AICompletionResponse): AICompletionResponse {
    let cleanText = rawResponse.text || '';

    // Strip leading/trailing whitespaces
    cleanText = cleanText.trim();

    return {
      ...rawResponse,
      text: cleanText,
    };
  }

  extractCodeBlocks(text: string): Array<{ language: string; code: string }> {
    const codeBlockRegex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
    const blocks: Array<{ language: string; code: string }> = [];
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim(),
      });
    }

    return blocks;
  }
}

export const responseParser = new ResponseParser();
