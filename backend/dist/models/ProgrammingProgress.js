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
exports.ProgrammingProgress = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProgrammingProgressSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    topic: {
        type: String,
        required: true,
        enum: [
            'Variables and data types',
            'Conditions and loops',
            'Arrays and strings',
            'Searching and sorting',
            'Recursion',
            'Linked lists, stacks, and queues',
            'Trees and graphs',
            'Dynamic programming',
            'Time and space complexity',
        ],
    },
    status: {
        type: String,
        enum: ['LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'PRACTICE_COMPLETED', 'TEST_IN_PROGRESS', 'COMPLETED', 'NEEDS_REVISION'],
        default: 'LOCKED',
    },
    attempts: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    hintsRequested: { type: Number, default: 0 },
    lessonsCompleted: { type: Number, default: 0 },
    examScoreSum: { type: Number, default: 0 },
    examQuestionsAttempted: { type: Number, default: 0 },
    recentErrors: [{ type: String }],
    lastActivity: { type: Date, default: Date.now },
}, { timestamps: true });
// Enforce unique tracking per user per topic
ProgrammingProgressSchema.index({ userId: 1, topic: 1 }, { unique: true });
exports.ProgrammingProgress = mongoose_1.default.model('ProgrammingProgress', ProgrammingProgressSchema);
