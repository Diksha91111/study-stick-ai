"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.responseParser = exports.ResponseParser = void 0;
class ResponseParser {
    parseTextResponse(rawResponse) {
        let cleanText = rawResponse.text || '';
        // Strip leading/trailing whitespaces
        cleanText = cleanText.trim();
        return {
            ...rawResponse,
            text: cleanText,
        };
    }
    extractCodeBlocks(text) {
        const codeBlockRegex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
        const blocks = [];
        let match;
        while ((match = codeBlockRegex.exec(text)) !== null) {
            blocks.push({
                language: match[1] || 'text',
                code: match[2].trim(),
            });
        }
        return blocks;
    }
}
exports.ResponseParser = ResponseParser;
exports.responseParser = new ResponseParser();
