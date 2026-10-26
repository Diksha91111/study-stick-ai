"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.codingTools = exports.analyzeCodeSyntaxTool = void 0;
exports.analyzeCodeSyntaxTool = {
    name: 'analyzeCodeSyntax',
    description: 'Analyzes provided code snippet for common syntax errors, structural issues, and best practices.',
    parameters: {
        type: 'object',
        properties: {
            code: { type: 'string', description: 'Source code to analyze' },
            language: { type: 'string', description: 'Programming language (e.g. javascript, python, cpp)' },
        },
        required: ['code'],
    },
    execute: async (_userId, params) => {
        const code = params?.code || '';
        const language = params?.language || 'javascript';
        if (!code || code.trim() === '') {
            return { success: false, error: 'Empty code string provided.' };
        }
        const lineCount = code.split('\n').length;
        return {
            success: true,
            analysis: {
                language,
                lines: lineCount,
                hasUnbalancedBrackets: (code.match(/\{/g) || []).length !== (code.match(/\}/g) || []).length,
                hasUnbalancedParens: (code.match(/\(/g) || []).length !== (code.match(/\)/g) || []).length,
            },
        };
    },
};
exports.codingTools = [exports.analyzeCodeSyntaxTool];
