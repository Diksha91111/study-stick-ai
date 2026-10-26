"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeProject = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProjectFileSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    path: { type: String, required: true }, // unique within project
    language: {
        type: String,
        enum: ['c', 'cpp', 'python', 'java', 'javascript', 'typescript', 'html', 'css', 'sql', 'plaintext'],
        default: 'plaintext',
    },
    content: { type: String, default: '' },
    isDirectory: { type: Boolean, default: false },
    parentPath: { type: String, default: '/' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { _id: true });
const CodeProjectSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: [true, 'Project name is required'],
        trim: true,
        maxlength: 100,
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500,
    },
    defaultLanguage: {
        type: String,
        enum: ['c', 'cpp', 'python', 'java', 'javascript', 'typescript', 'html', 'css', 'sql', 'plaintext'],
        default: 'plaintext',
    },
    files: [ProjectFileSchema],
}, { timestamps: true });
exports.CodeProject = mongoose_1.default.model('CodeProject', CodeProjectSchema);
