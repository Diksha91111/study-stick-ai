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
exports.Profile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    collegeName: {
        type: String,
        default: '',
        trim: true,
    },
    degree: {
        type: String,
        default: 'B.Tech / B.E.',
        trim: true,
    },
    branch: {
        type: String,
        default: 'Computer Science & Engineering',
        trim: true,
    },
    currentSemester: {
        type: Number,
        default: 5,
        min: 1,
        max: 12,
    },
    currentYear: {
        type: Number,
        default: 3,
        min: 1,
        max: 6,
    },
    targetCompetitiveExams: [
        {
            examName: { type: String, required: true },
            targetYear: { type: Number },
            notes: { type: String, default: '' },
        },
    ],
    targetDailyStudyHours: {
        type: Number,
        default: 6,
        min: 1,
        max: 18,
    },
    chronotype: {
        type: String,
        enum: ['early_bird', 'night_owl', 'intermediate'],
        default: 'intermediate',
    },
    pomodoroWorkMins: {
        type: Number,
        default: 45,
        min: 15,
        max: 120,
    },
    pomodoroBreakMins: {
        type: Number,
        default: 10,
        min: 5,
        max: 30,
    },
}, { timestamps: true });
exports.Profile = mongoose_1.default.model('Profile', ProfileSchema);
