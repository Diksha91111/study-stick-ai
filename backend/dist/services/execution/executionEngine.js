"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_OUTPUT_SIZE_BYTES = exports.MAX_TIMEOUT_MS = exports.DEFAULT_TIMEOUT_MS = exports.SUPPORTED_LANGUAGES = void 0;
exports.SUPPORTED_LANGUAGES = [
    'c',
    'cpp',
    'python',
    'java',
    'javascript',
];
exports.DEFAULT_TIMEOUT_MS = 5000;
exports.MAX_TIMEOUT_MS = 10000;
exports.MAX_OUTPUT_SIZE_BYTES = 64 * 1024; // 64 KB limit for stdout/stderr to prevent output bombs
