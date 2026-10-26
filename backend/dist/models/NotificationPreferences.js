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
exports.NotificationPreferences = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const NotificationPreferencesSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    inAppEnabled: {
        type: Boolean,
        default: true,
    },
    emailEnabled: {
        type: Boolean,
        default: true,
    },
    whatsappEnabled: {
        type: Boolean,
        default: false,
    },
    categories: {
        studySessions: { type: Boolean, default: true },
        tasks: { type: Boolean, default: true },
        exams: { type: Boolean, default: true },
        learningPath: { type: Boolean, default: true },
        flashcards: { type: Boolean, default: true },
        dailyPlan: { type: Boolean, default: true },
        weeklySummary: { type: Boolean, default: true },
    },
    reminderTimings: {
        studySessions: { type: Number, default: 15 }, // 15 mins before
        tasks: { type: Number, default: 1440 }, // 1 day before
        exams: { type: Number, default: 4320 }, // 3 days before
        dailyPlanTime: { type: String, default: '08:00' },
        weeklySummaryDay: { type: Number, default: 0 }, // Sunday
        weeklySummaryTime: { type: String, default: '19:00' },
    },
    quietHours: {
        enabled: { type: Boolean, default: true },
        startTime: { type: String, default: '22:30' },
        endTime: { type: String, default: '07:00' },
    },
    timezone: {
        type: String,
        default: 'Asia/Kolkata',
    },
    whatsapp: {
        phoneNumber: { type: String, default: '', trim: true },
        consentGiven: { type: Boolean, default: false },
        consentTimestamp: { type: Date, default: null },
        verificationStatus: {
            type: String,
            enum: ['unverified', 'verified'],
            default: 'unverified',
        },
    },
}, { timestamps: true });
exports.NotificationPreferences = mongoose_1.default.model('NotificationPreferences', NotificationPreferencesSchema);
