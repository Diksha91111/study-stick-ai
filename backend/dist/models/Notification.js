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
exports.Notification = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const NotificationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: [
            'study_session',
            'task_deadline',
            'exam_reminder',
            'learning_path',
            'flashcard_review',
            'missed_session',
            'daily_plan',
            'weekly_summary',
            'system',
        ],
        required: true,
        index: true,
    },
    category: {
        type: String,
        enum: [
            'study_sessions',
            'tasks',
            'exams',
            'learning_path',
            'flashcards',
            'daily_plan',
            'weekly_summary',
            'general',
        ],
        default: 'general',
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    actionUrl: {
        type: String,
        default: '/planner',
    },
    actionLabel: {
        type: String,
        default: 'View Details',
    },
    channel: {
        type: String,
        enum: ['in_app', 'email', 'whatsapp'],
        default: 'in_app',
        index: true,
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'],
        default: 'SCHEDULED',
        index: true,
    },
    scheduledFor: {
        type: Date,
        required: true,
        index: true,
    },
    sentAt: {
        type: Date,
        default: null,
    },
    deliveredAt: {
        type: Date,
        default: null,
    },
    failedAt: {
        type: Date,
        default: null,
    },
    readAt: {
        type: Date,
        default: null,
        index: true,
    },
    failureReason: {
        type: String,
        default: null,
    },
    retryCount: {
        type: Number,
        default: 0,
    },
    maxRetries: {
        type: Number,
        default: 3,
    },
    dedupeKey: {
        type: String,
        default: null,
        index: true,
    },
    relatedEntityType: {
        type: String,
        enum: ['StudySession', 'Task', 'Exam', 'Flashcard', 'LearningPath', 'Other'],
        default: 'Other',
    },
    relatedEntityId: {
        type: mongoose_1.Schema.Types.Mixed,
        default: null,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, { timestamps: true });
// Compound index for idempotency and fast queries
NotificationSchema.index({ userId: 1, dedupeKey: 1 });
NotificationSchema.index({ status: 1, scheduledFor: 1 });
NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });
exports.Notification = mongoose_1.default.model('Notification', NotificationSchema);
