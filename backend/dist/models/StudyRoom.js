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
exports.StudyRoom = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const RoomMemberSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['OWNER', 'ADMIN', 'MEMBER'], default: 'MEMBER' },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['ACTIVE', 'BANNED'], default: 'ACTIVE' },
    presenceStatus: {
        type: String,
        enum: ['ONLINE', 'STUDYING', 'BREAK', 'OFFLINE'],
        default: 'ONLINE',
    },
    lastActiveAt: { type: Date, default: Date.now },
}, { _id: false });
const SessionParticipantSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['STUDYING', 'BREAK'], default: 'STUDYING' },
    joinedAt: { type: Date, default: Date.now },
}, { _id: false });
const ActiveFocusSessionSchema = new mongoose_1.Schema({
    sessionId: { type: String, required: true },
    goal: { type: String, required: true },
    durationMinutes: { type: Number, required: true, min: 1, max: 240 },
    startedAt: { type: Date, required: true },
    pausedAt: { type: Date, default: null },
    totalPausedMs: { type: Number, default: 0 },
    status: {
        type: String,
        enum: ['RUNNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
        default: 'ACTIVE',
    },
    startedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [SessionParticipantSchema],
}, { _id: false });
const StudyRoomSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Room name is required'],
        trim: true,
        minlength: 2,
        maxlength: 80,
    },
    description: {
        type: String,
        default: '',
        trim: true,
        maxlength: 500,
    },
    goal: {
        type: String,
        required: [true, 'Study goal is required'],
        trim: true,
        minlength: 2,
        maxlength: 150,
    },
    privacy: {
        type: String,
        enum: ['public', 'private', 'PUBLIC', 'PRIVATE'],
        default: 'private',
        set: (val) => (val ? val.toLowerCase() : 'private'),
        index: true,
    },
    inviteCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    ownerId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    members: [RoomMemberSchema],
    maxMembers: {
        type: Number,
        default: 20,
        min: 2,
        max: 100,
    },
    defaultFocusDuration: {
        type: Number,
        default: 45,
        enum: [25, 45, 60, 90],
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'ARCHIVED'],
        default: 'ACTIVE',
        index: true,
    },
    activeSession: {
        type: ActiveFocusSessionSchema,
        default: null,
    },
}, { timestamps: true });
StudyRoomSchema.index({ 'members.userId': 1, status: 1 });
StudyRoomSchema.index({ privacy: 1, status: 1 });
exports.StudyRoom = mongoose_1.default.model('StudyRoom', StudyRoomSchema);
