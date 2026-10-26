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
exports.TimetableSlot = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const TimetableSlotSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    dayOfWeek: {
        type: Number,
        required: true,
        min: 1,
        max: 7, // 1 = Mon ... 7 = Sun
    },
    startTime: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'],
    },
    endTime: {
        type: String,
        required: true,
        match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format, expected HH:mm'],
    },
    slotType: {
        type: String,
        enum: [
            'college_lecture',
            'college_lab',
            'college_tutorial',
            'self_study',
            'exam_prep',
            'break',
        ],
        default: 'college_lecture',
    },
    subjectId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Subject',
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    room: {
        type: String,
        default: '',
        trim: true,
    },
    notes: {
        type: String,
        default: '',
    },
    color: {
        type: String,
        default: '#6366f1',
    },
}, { timestamps: true });
exports.TimetableSlot = mongoose_1.default.model('TimetableSlot', TimetableSlotSchema);
