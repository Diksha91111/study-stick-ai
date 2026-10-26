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
exports.Exam = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ExamSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    subjectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subject',
    },
    customSubjectName: {
        type: String,
        default: '',
        trim: true,
    },
    title: {
        type: String,
        required: [true, 'Exam title is required'],
        trim: true,
    },
    examType: {
        type: String,
        enum: [
            'college_midterm',
            'college_endsem',
            'college_unit_test',
            'competitive_mock',
            'competitive_final',
        ],
        default: 'college_midterm',
    },
    examDate: {
        type: Date,
        required: [true, 'Exam date & time is required'],
    },
    durationMinutes: {
        type: Number,
        default: 180,
        min: 15,
    },
    venue: {
        type: String,
        default: '',
        trim: true,
    },
    syllabusCoverage: {
        type: String,
        default: '',
    },
    targetScore: {
        type: Number,
        default: 85,
    },
    totalMarks: {
        type: Number,
        default: 100,
    },
    actualScore: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['upcoming', 'completed', 'cancelled'],
        default: 'upcoming',
    },
    notes: {
        type: String,
        default: '',
    },
}, { timestamps: true });
exports.Exam = mongoose_1.default.model('Exam', ExamSchema);
