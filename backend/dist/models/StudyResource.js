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
exports.StudyResource = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ResourceChunkSchema = new mongoose_1.Schema({
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    pageNumber: { type: Number },
    slideNumber: { type: Number },
    startTimeSeconds: { type: Number },
    endTimeSeconds: { type: Number },
    sectionTitle: { type: String },
}, { _id: false });
const StudyResourceSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    conversationId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'AIConversation',
        default: null,
        index: true,
    },
    originalFilename: {
        type: String,
        required: true,
        trim: true,
    },
    storedFilename: {
        type: String,
        required: true,
    },
    filePath: {
        type: String,
    },
    mimeType: {
        type: String,
        required: true,
    },
    resourceType: {
        type: String,
        enum: ['image', 'pdf', 'presentation', 'document', 'video', 'video_link'],
        required: true,
        index: true,
    },
    fileSizeBytes: {
        type: Number,
        default: 0,
    },
    processingStatus: {
        type: String,
        enum: ['UPLOADING', 'PROCESSING', 'READY', 'FAILED'],
        default: 'PROCESSING',
        index: true,
    },
    failureReason: {
        type: String,
        default: null,
    },
    extractedText: {
        type: String,
        default: '',
    },
    chunks: [ResourceChunkSchema],
    pageCount: {
        type: Number,
    },
    slideCount: {
        type: Number,
    },
    videoDuration: {
        type: Number,
    },
    videoUrl: {
        type: String,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
StudyResourceSchema.index({ userId: 1, createdAt: -1 });
StudyResourceSchema.index({ userId: 1, processingStatus: 1 });
exports.StudyResource = mongoose_1.default.model('StudyResource', StudyResourceSchema);
