"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageParser = void 0;
const env_js_1 = require("../../config/env.js");
class ImageParser {
    static supportedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    static isSupported(mimeType) {
        return this.supportedMimeTypes.includes(mimeType.toLowerCase());
    }
    static async parseImage(buffer, mimeType, filename) {
        if (!this.isSupported(mimeType)) {
            throw new Error(`Unsupported image format: ${mimeType}. Please upload PNG, JPG, JPEG, or WEBP.`);
        }
        const base64Data = buffer.toString('base64');
        const hasVisionSupport = Boolean(env_js_1.ENV.GEMINI_API_KEY || env_js_1.ENV.OPENAI_API_KEY || env_js_1.ENV.ANTHROPIC_API_KEY);
        if (!hasVisionSupport) {
            throw new Error('AI Vision model is not configured. Visual analysis is unavailable.');
        }
        const placeholderText = `[Uploaded Image Resource: ${filename} (${mimeType})]`;
        const chunks = [
            {
                chunkIndex: 0,
                text: placeholderText,
                sectionTitle: `Image: ${filename}`,
            },
        ];
        return {
            mimeType,
            base64Data,
            extractedText: placeholderText,
            chunks,
            hasVisionSupport,
        };
    }
}
exports.ImageParser = ImageParser;
