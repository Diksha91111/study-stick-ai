"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuthConfig = exports.validateAIProviderConfig = exports.ENV = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.ENV = {
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studystick_ai',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_2026_xyz',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_2026_abc',
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
    FRONTEND_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
    SMTP_HOST: process.env.SMTP_HOST || '',
    SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    SMTP_USER: process.env.SMTP_USER || '',
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || '',
    MAIL_FROM: process.env.MAIL_FROM || '"Study Stick AI" <noreply@studystick.ai>',
    // AI Provider & Routing Config
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    AI_PRIMARY_PROVIDER: process.env.AI_PRIMARY_PROVIDER || 'gemini',
    AI_FAST_PROVIDER: process.env.AI_FAST_PROVIDER || 'gemini',
    AI_REASONING_PROVIDER: process.env.AI_REASONING_PROVIDER || 'gemini',
    AI_CODING_PROVIDER: process.env.AI_CODING_PROVIDER || 'gemini',
    AI_VISION_PROVIDER: process.env.AI_VISION_PROVIDER || 'gemini',
    AI_MAX_TOKENS: parseInt(process.env.AI_MAX_TOKENS || '2048', 10),
    AI_TIMEOUT_MS: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
};
const validateAIProviderConfig = (providerName) => {
    const normalized = providerName.toLowerCase();
    if (normalized === 'openai' && !exports.ENV.OPENAI_API_KEY) {
        return { isValid: false, error: 'OpenAI API key is missing. Set OPENAI_API_KEY in environment configuration.' };
    }
    if (normalized === 'gemini' && !exports.ENV.GEMINI_API_KEY) {
        return { isValid: false, error: 'Gemini API key is missing. Set GEMINI_API_KEY in environment configuration.' };
    }
    if (normalized === 'anthropic' && !exports.ENV.ANTHROPIC_API_KEY) {
        return { isValid: false, error: 'Anthropic API key is missing. Set ANTHROPIC_API_KEY in environment configuration.' };
    }
    return { isValid: true };
};
exports.validateAIProviderConfig = validateAIProviderConfig;
const validateAuthConfig = () => {
    const missing = [];
    if (!exports.ENV.MONGODB_URI)
        missing.push('MONGODB_URI');
    if (!exports.ENV.JWT_ACCESS_SECRET)
        missing.push('JWT_ACCESS_SECRET');
    if (!exports.ENV.JWT_REFRESH_SECRET)
        missing.push('JWT_REFRESH_SECRET');
    if (missing.length > 0) {
        throw new Error(`[Startup Error] Critical authentication environment variables are missing: ${missing.join(', ')}. Please configure them in your environment.`);
    }
    if (exports.ENV.NODE_ENV === 'production') {
        if (exports.ENV.JWT_ACCESS_SECRET.includes('fallback') ||
            exports.ENV.JWT_REFRESH_SECRET.includes('fallback')) {
            throw new Error('[Startup Error] Fallback JWT secrets cannot be used in production. Provide strong unique secrets.');
        }
    }
};
exports.validateAuthConfig = validateAuthConfig;
// Validate configuration on load
(0, exports.validateAuthConfig)();
