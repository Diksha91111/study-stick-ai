"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studyRoomService = exports.StudyRoomService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const StudyRoom_js_1 = require("../models/StudyRoom.js");
const RoomMessage_js_1 = require("../models/RoomMessage.js");
const RoomTask_js_1 = require("../models/RoomTask.js");
const RoomResource_js_1 = require("../models/RoomResource.js");
const RoomQuizSession_js_1 = require("../models/RoomQuizSession.js");
const StudyResource_js_1 = require("../models/StudyResource.js");
const User_js_1 = require("../models/User.js");
const studyRoomStreamService_js_1 = require("./studyRoomStreamService.js");
const learningPathService_js_1 = require("./learningPathService.js");
const topicContentData_js_1 = require("../data/topicContentData.js");
const aiOrchestrator_js_1 = require("../ai/core/aiOrchestrator.js");
class StudyRoomService {
    /**
     * Securely generates a unique invite code
     */
    generateInviteCode() {
        return `SR-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    /**
     * Helper to verify room membership and permissions
     */
    async getAuthorizedMember(roomId, userId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(roomId)) {
            throw new Error('Invalid room ID');
        }
        const room = await StudyRoom_js_1.StudyRoom.findById(roomId);
        if (!room) {
            throw new Error('Study room not found');
        }
        const member = room.members.find((m) => m.userId.toString() === userId && m.status === 'ACTIVE');
        if (!member) {
            throw new Error('You are not an active member of this study room');
        }
        return { room, role: member.role };
    }
    /**
     * Calculate live remaining time for active focus session
     */
    calculateRemainingSeconds(session) {
        if (!session || session.status === 'COMPLETED' || session.status === 'CANCELLED') {
            return 0;
        }
        const totalDurationMs = session.durationMinutes * 60 * 1000;
        const now = session.status === 'PAUSED' && session.pausedAt ? session.pausedAt.getTime() : Date.now();
        const elapsedMs = now - session.startedAt.getTime() - (session.totalPausedMs || 0);
        const remainingMs = Math.max(0, totalDurationMs - elapsedMs);
        return Math.floor(remainingMs / 1000);
    }
    /**
     * Create a new Study Room
     */
    async createRoom(userId, input) {
        const inviteCode = this.generateInviteCode();
        const room = await StudyRoom_js_1.StudyRoom.create({
            name: input.name.trim(),
            description: input.description?.trim() || '',
            goal: input.goal.trim(),
            privacy: (input.privacy ? input.privacy.toLowerCase() : 'private'),
            inviteCode,
            ownerId: new mongoose_1.default.Types.ObjectId(userId),
            members: [
                {
                    userId: new mongoose_1.default.Types.ObjectId(userId),
                    role: 'OWNER',
                    joinedAt: new Date(),
                    status: 'ACTIVE',
                    presenceStatus: 'ONLINE',
                    lastActiveAt: new Date(),
                },
            ],
            maxMembers: input.maxMembers || 20,
            defaultFocusDuration: input.defaultFocusDuration || 45,
            status: 'ACTIVE',
        });
        // Populate user details for response
        await room.populate('members.userId', 'name email avatar');
        return room;
    }
    /**
     * Get all active rooms the user belongs to
     */
    async getUserRooms(userId) {
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const rooms = await StudyRoom_js_1.StudyRoom.find({
            'members.userId': userObjectId,
            'members.status': 'ACTIVE',
            status: { $ne: 'ARCHIVED' },
        })
            .populate('ownerId', 'name email avatar')
            .populate('members.userId', 'name email avatar')
            .sort({ updatedAt: -1 });
        return rooms.map((room) => {
            const remainingSeconds = this.calculateRemainingSeconds(room.activeSession);
            const userMember = room.members.find((m) => m.userId?._id?.toString() === userId || m.userId?.toString() === userId);
            const sessionObj = room.activeSession
                ? (room.activeSession.toObject ? room.activeSession.toObject() : room.activeSession)
                : null;
            return {
                ...room.toObject(),
                myRole: userMember?.role || 'MEMBER',
                activeSession: sessionObj
                    ? {
                        ...sessionObj,
                        remainingSeconds,
                    }
                    : null,
            };
        });
    }
    /**
     * Get public rooms for discovery
     */
    async getPublicRooms(userId) {
        const rooms = await StudyRoom_js_1.StudyRoom.find({
            privacy: 'public',
            status: 'ACTIVE',
        })
            .populate('ownerId', 'name email avatar')
            .populate('members.userId', 'name email avatar')
            .sort({ createdAt: -1 })
            .limit(30);
        return rooms.map((room) => {
            const isMember = room.members.some((m) => (m.userId?._id?.toString() === userId || m.userId?.toString() === userId) && m.status === 'ACTIVE');
            return {
                ...room.toObject(),
                isMember,
                memberCount: room.members.filter((m) => m.status === 'ACTIVE').length,
            };
        });
    }
    /**
     * Get complete details of a specific room
     */
    async getRoomDetails(roomId, userId) {
        const { room, role } = await this.getAuthorizedMember(roomId, userId);
        await room.populate('ownerId', 'name email avatar');
        await room.populate('members.userId', 'name email avatar');
        const remainingSeconds = this.calculateRemainingSeconds(room.activeSession);
        const sessionObj = room.activeSession
            ? (room.activeSession.toObject ? room.activeSession.toObject() : room.activeSession)
            : null;
        return {
            ...room.toObject(),
            myRole: role,
            activeSession: sessionObj
                ? {
                    ...sessionObj,
                    remainingSeconds,
                }
                : null,
        };
    }
    /**
     * Join a room via Invite Code
     */
    async joinByInviteCode(userId, inviteCode) {
        const normalizedCode = inviteCode.trim().toUpperCase();
        const room = await StudyRoom_js_1.StudyRoom.findOne({ inviteCode: normalizedCode });
        if (!room) {
            throw new Error('Invalid or expired invite code. Room not found.');
        }
        if (room.status === 'ARCHIVED') {
            throw new Error('This study room has been archived and is no longer accepting new members.');
        }
        const existingMember = room.members.find((m) => m.userId.toString() === userId);
        if (existingMember) {
            if (existingMember.status === 'BANNED') {
                throw new Error('You have been restricted from joining this study room.');
            }
            // Already an active member
            await room.populate('members.userId', 'name email avatar');
            return room;
        }
        // Check capacity
        const activeMemberCount = room.members.filter((m) => m.status === 'ACTIVE').length;
        if (activeMemberCount >= room.maxMembers) {
            throw new Error(`This study room is full (maximum ${room.maxMembers} members).`);
        }
        // Add new member
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        room.members.push({
            userId: userObjectId,
            role: 'MEMBER',
            joinedAt: new Date(),
            status: 'ACTIVE',
            presenceStatus: 'ONLINE',
            lastActiveAt: new Date(),
        });
        await room.save();
        await room.populate('members.userId', 'name email avatar');
        // Notify room via SSE
        const joiningUser = await User_js_1.User.findById(userId).select('name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(room._id.toString(), 'member_joined', {
            user: joiningUser,
            joinedAt: new Date(),
        });
        return room;
    }
    /**
     * Join a public room
     */
    async joinPublicRoom(userId, roomId) {
        const room = await StudyRoom_js_1.StudyRoom.findById(roomId);
        if (!room) {
            throw new Error('Study room not found.');
        }
        if (room.privacy !== 'public') {
            throw new Error('This room is private. An invite code is required to join.');
        }
        return await this.joinByInviteCode(userId, room.inviteCode);
    }
    /**
     * Leave a Study Room
     */
    async leaveRoom(userId, roomId) {
        const { room, role } = await this.getAuthorizedMember(roomId, userId);
        if (role === 'OWNER') {
            const activeMembers = room.members.filter((m) => m.userId.toString() !== userId && m.status === 'ACTIVE');
            if (activeMembers.length > 0) {
                // Transfer ownership to first admin or first member
                const nextOwner = activeMembers.find((m) => m.role === 'ADMIN') || activeMembers[0];
                nextOwner.role = 'OWNER';
                room.ownerId = nextOwner.userId;
            }
            else {
                // Last member leaving archives the room
                room.status = 'ARCHIVED';
            }
        }
        // Remove user from members list
        room.members = room.members.filter((m) => m.userId.toString() !== userId);
        await room.save();
        // Broadcast member left
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'member_left', {
            userId,
            leftAt: new Date(),
        });
        return { success: true, message: 'You have left the study room.' };
    }
    /**
     * Update Room Settings (Owner or Admin)
     */
    async updateRoom(userId, roomId, updates) {
        const { room, role } = await this.getAuthorizedMember(roomId, userId);
        if (role !== 'OWNER' && role !== 'ADMIN') {
            throw new Error('Only the room owner or admins can modify room settings.');
        }
        if (updates.name)
            room.name = updates.name.trim();
        if (updates.description !== undefined)
            room.description = updates.description.trim();
        if (updates.goal)
            room.goal = updates.goal.trim();
        if (updates.privacy)
            room.privacy = updates.privacy;
        if (updates.maxMembers)
            room.maxMembers = updates.maxMembers;
        if (updates.defaultFocusDuration)
            room.defaultFocusDuration = updates.defaultFocusDuration;
        if (updates.status && role === 'OWNER')
            room.status = updates.status;
        await room.save();
        await room.populate('members.userId', 'name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'room_updated', {
            room: room.toObject(),
        });
        return room;
    }
    /**
     * Regenerate invite code (Owner only)
     */
    async regenerateInviteCode(userId, roomId) {
        const { room, role } = await this.getAuthorizedMember(roomId, userId);
        if (role !== 'OWNER') {
            throw new Error('Only the room owner can regenerate the invite code.');
        }
        room.inviteCode = this.generateInviteCode();
        await room.save();
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'room_updated', {
            inviteCode: room.inviteCode,
        });
        return room.inviteCode;
    }
    /**
     * Manage member roles and status (Owner/Admin)
     */
    async manageMember(actorId, roomId, targetUserId, action) {
        const { room, role: actorRole } = await this.getAuthorizedMember(roomId, actorId);
        if (actorRole !== 'OWNER' && actorRole !== 'ADMIN') {
            throw new Error('Insufficient permissions to manage room members.');
        }
        if (actorId === targetUserId) {
            throw new Error('You cannot modify your own membership role.');
        }
        const member = room.members.find((m) => m.userId.toString() === targetUserId);
        if (!member) {
            throw new Error('Target user is not a member of this study room.');
        }
        if (member.role === 'OWNER') {
            throw new Error('Cannot modify the room owner.');
        }
        if (actorRole === 'ADMIN' && member.role === 'ADMIN') {
            throw new Error('Admins cannot modify fellow admins.');
        }
        switch (action) {
            case 'PROMOTE':
                if (actorRole !== 'OWNER')
                    throw new Error('Only owners can promote members to admin.');
                member.role = 'ADMIN';
                break;
            case 'DEMOTE':
                if (actorRole !== 'OWNER')
                    throw new Error('Only owners can demote admins.');
                member.role = 'MEMBER';
                break;
            case 'KICK':
                room.members = room.members.filter((m) => m.userId.toString() !== targetUserId);
                break;
            case 'BAN':
                if (actorRole !== 'OWNER')
                    throw new Error('Only owners can ban members.');
                member.status = 'BANNED';
                break;
        }
        await room.save();
        await room.populate('members.userId', 'name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'member_presence', {
            targetUserId,
            action,
        });
        return room;
    }
    /**
     * Start a collaborative focus session (Owner/Admin)
     */
    async startFocusSession(userId, roomId, input) {
        const { room, role } = await this.getAuthorizedMember(roomId, userId);
        if (role !== 'OWNER' && role !== 'ADMIN') {
            throw new Error('Only room owners or admins can initiate focus sessions.');
        }
        const sessionId = `FS-${Date.now()}-${crypto_1.default.randomBytes(3).toString('hex')}`;
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const activeSession = {
            sessionId,
            goal: input.goal.trim(),
            durationMinutes: input.durationMinutes || room.defaultFocusDuration || 45,
            startedAt: new Date(),
            pausedAt: null,
            totalPausedMs: 0,
            status: 'ACTIVE',
            startedBy: userObjectId,
            participants: [
                {
                    userId: userObjectId,
                    status: 'STUDYING',
                    joinedAt: new Date(),
                },
            ],
        };
        room.activeSession = activeSession;
        await room.save();
        // Create system announcement in chat
        await RoomMessage_js_1.RoomMessage.create({
            roomId: room._id,
            senderId: userObjectId,
            content: `🎯 Focus session started: "${activeSession.goal}" (${activeSession.durationMinutes} minutes)`,
            isSystem: true,
        });
        // Broadcast SSE update
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'focus_session_update', {
            session: {
                ...activeSession,
                remainingSeconds: activeSession.durationMinutes * 60,
            },
        });
        return activeSession;
    }
    /**
     * Update Focus Session Status (Pause, Resume, End)
     */
    async updateFocusSession(userId, roomId, action) {
        const { room, role } = await this.getAuthorizedMember(roomId, userId);
        if (role !== 'OWNER' && role !== 'ADMIN') {
            throw new Error('Only room owners or admins can modify the focus session.');
        }
        if (!room.activeSession || room.activeSession.status === 'COMPLETED') {
            throw new Error('No active focus session in progress.');
        }
        const session = room.activeSession;
        if (action === 'PAUSE') {
            if (session.status === 'PAUSED')
                return session;
            session.status = 'PAUSED';
            session.pausedAt = new Date();
        }
        else if (action === 'RESUME') {
            if (session.status === 'RUNNING' || session.status === 'ACTIVE')
                return session;
            if (session.pausedAt) {
                session.totalPausedMs += Date.now() - session.pausedAt.getTime();
            }
            session.status = 'ACTIVE';
            session.pausedAt = null;
        }
        else if (action === 'END') {
            session.status = 'COMPLETED';
            room.activeSession = null;
        }
        await room.save();
        const remainingSeconds = this.calculateRemainingSeconds(session);
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'focus_session_update', {
            session: action === 'END'
                ? null
                : {
                    ...(session.toObject ? session.toObject() : session),
                    remainingSeconds,
                },
            action,
        });
        return {
            session: room.activeSession,
            remainingSeconds,
        };
    }
    /**
     * Join or update individual presence in an active focus session
     */
    async updateParticipantSessionStatus(userId, roomId, status) {
        const { room } = await this.getAuthorizedMember(roomId, userId);
        if (!room.activeSession || room.activeSession.status === 'COMPLETED') {
            throw new Error('No active focus session to participate in.');
        }
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const participantIndex = room.activeSession.participants.findIndex((p) => (p.userId?._id?.toString() || p.userId.toString()) === userId);
        if (status === 'LEAVE') {
            if (participantIndex > -1) {
                room.activeSession.participants.splice(participantIndex, 1);
            }
        }
        else {
            if (participantIndex > -1) {
                room.activeSession.participants[participantIndex].status = status;
            }
            else {
                room.activeSession.participants.push({
                    userId: userObjectId,
                    status,
                    joinedAt: new Date(),
                });
            }
        }
        // Also update member presence in room
        const member = room.members.find((m) => (m.userId?._id?.toString() || m.userId.toString()) === userId);
        if (member) {
            member.presenceStatus = status === 'LEAVE' ? 'ONLINE' : status;
            member.lastActiveAt = new Date();
        }
        await room.save();
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'focus_session_update', {
            participants: room.activeSession.participants,
        });
        return room.activeSession;
    }
    /**
     * Update member general room presence (ONLINE, STUDYING, BREAK, OFFLINE)
     */
    async updateMemberPresence(userId, roomId, presence) {
        const { room } = await this.getAuthorizedMember(roomId, userId);
        const member = room.members.find((m) => (m.userId?._id?.toString() || m.userId.toString()) === userId);
        if (!member) {
            throw new Error('Member not found in study room');
        }
        member.presenceStatus = presence;
        member.lastActiveAt = new Date();
        await room.save();
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'member_presence', {
            userId,
            presence,
            lastActiveAt: member.lastActiveAt,
        });
        return {
            userId,
            presence: member.presenceStatus,
            lastActiveAt: member.lastActiveAt,
        };
    }
    /**
     * Send a study room chat message (Persistent + Sanitized)
     */
    async sendMessage(userId, roomId, content) {
        await this.getAuthorizedMember(roomId, userId);
        const trimmed = content.trim();
        if (!trimmed) {
            throw new Error('Message cannot be empty.');
        }
        if (trimmed.length > 2000) {
            throw new Error('Message exceeds 2,000 characters limit.');
        }
        // Basic XSS defense: strip HTML tags
        const sanitized = trimmed.replace(/<[^>]*>?/gm, '');
        const message = await RoomMessage_js_1.RoomMessage.create({
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
            senderId: new mongoose_1.default.Types.ObjectId(userId),
            content: sanitized,
            isSystem: false,
        });
        await message.populate('senderId', 'name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'chat_message', {
            message: message.toObject(),
        });
        return message;
    }
    /**
     * Get chat messages for a room
     */
    async getMessages(userId, roomId, limit = 100) {
        await this.getAuthorizedMember(roomId, userId);
        return await RoomMessage_js_1.RoomMessage.find({ roomId: new mongoose_1.default.Types.ObjectId(roomId) })
            .populate('senderId', 'name email avatar')
            .sort({ createdAt: 1 })
            .limit(limit);
    }
    /**
     * Get shared tasks for a room
     */
    async getTasks(userId, roomId) {
        await this.getAuthorizedMember(roomId, userId);
        return await RoomTask_js_1.RoomTask.find({ roomId: new mongoose_1.default.Types.ObjectId(roomId) })
            .populate('createdBy', 'name email avatar')
            .populate('completedBy', 'name email avatar')
            .sort({ createdAt: -1 });
    }
    /**
     * Create a shared room task
     */
    async createTask(userId, roomId, input) {
        await this.getAuthorizedMember(roomId, userId);
        const task = await RoomTask_js_1.RoomTask.create({
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
            title: input.title.trim(),
            description: input.description?.trim() || '',
            createdBy: new mongoose_1.default.Types.ObjectId(userId),
            dueDate: input.dueDate ? new Date(input.dueDate) : null,
            status: 'PENDING',
        });
        await task.populate('createdBy', 'name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'task_update', {
            action: 'CREATED',
            task: task.toObject(),
        });
        return task;
    }
    /**
     * Update task status
     */
    async updateTaskStatus(userId, roomId, taskId, status) {
        await this.getAuthorizedMember(roomId, userId);
        const task = await RoomTask_js_1.RoomTask.findOne({
            _id: taskId,
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
        });
        if (!task) {
            throw new Error('Room task not found.');
        }
        task.status = status;
        if (status === 'COMPLETED') {
            task.completedBy = new mongoose_1.default.Types.ObjectId(userId);
            task.completedAt = new Date();
        }
        else {
            task.completedBy = null;
            task.completedAt = null;
        }
        await task.save();
        await task.populate('createdBy', 'name email avatar');
        await task.populate('completedBy', 'name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'task_update', {
            action: 'STATUS_CHANGED',
            task: task.toObject(),
        });
        return task;
    }
    /**
     * Share an existing study resource into the room
     */
    async shareResource(userId, roomId, resourceId, note) {
        await this.getAuthorizedMember(roomId, userId);
        const resource = await StudyResource_js_1.StudyResource.findById(resourceId);
        if (!resource) {
            throw new Error('Study resource not found.');
        }
        // Verify it is not already shared in this room
        const existing = await RoomResource_js_1.RoomResource.findOne({
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
            resourceId: new mongoose_1.default.Types.ObjectId(resourceId),
        });
        if (existing) {
            throw new Error('This resource is already shared in this study room.');
        }
        const roomResource = await RoomResource_js_1.RoomResource.create({
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
            resourceId: new mongoose_1.default.Types.ObjectId(resourceId),
            sharedBy: new mongoose_1.default.Types.ObjectId(userId),
            note: note?.trim() || '',
            sharedAt: new Date(),
        });
        await roomResource.populate('resourceId');
        await roomResource.populate('sharedBy', 'name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'resource_shared', {
            resource: roomResource.toObject(),
        });
        return roomResource;
    }
    /**
     * Get all shared resources in the room
     */
    async getSharedResources(userId, roomId) {
        await this.getAuthorizedMember(roomId, userId);
        return await RoomResource_js_1.RoomResource.find({ roomId: new mongoose_1.default.Types.ObjectId(roomId) })
            .populate('resourceId')
            .populate('sharedBy', 'name email avatar')
            .sort({ sharedAt: -1 });
    }
    /**
     * Start a group quiz for the room (reusing learningPath topics/questions)
     */
    async startGroupQuiz(userId, roomId, topic) {
        const { role } = await this.getAuthorizedMember(roomId, userId);
        if (role !== 'OWNER' && role !== 'ADMIN') {
            throw new Error('Only the room owner or admins can launch a group quiz.');
        }
        const topicQuestions = topicContentData_js_1.TOPIC_QUIZ_QUESTIONS[topic] || [];
        if (topicQuestions.length === 0) {
            throw new Error(`No assessment questions configured for topic "${topic}".`);
        }
        const quiz = await RoomQuizSession_js_1.RoomQuizSession.create({
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
            topic,
            title: `${topic} Group Challenge`,
            startedBy: new mongoose_1.default.Types.ObjectId(userId),
            status: 'ACTIVE',
            questionIds: topicQuestions.map((q) => q.id),
            submissions: [],
            startedAt: new Date(),
        });
        await quiz.populate('startedBy', 'name email avatar');
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'quiz_update', {
            action: 'STARTED',
            quizId: quiz._id,
            topic: quiz.topic,
            title: quiz.title,
            questionCount: topicQuestions.length,
        });
        return {
            quizId: quiz._id,
            topic: quiz.topic,
            title: quiz.title,
            questions: topicQuestions.map((q) => ({
                id: q.id,
                questionText: q.questionText,
                options: q.options,
                concept: q.concept,
            })),
            status: quiz.status,
        };
    }
    /**
     * Get active group quiz for the room
     */
    async getActiveQuiz(userId, roomId) {
        await this.getAuthorizedMember(roomId, userId);
        const quiz = await RoomQuizSession_js_1.RoomQuizSession.findOne({
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
            status: 'ACTIVE',
        })
            .populate('startedBy', 'name email avatar')
            .populate('submissions.userId', 'name email avatar');
        if (!quiz)
            return null;
        const topicQuestions = topicContentData_js_1.TOPIC_QUIZ_QUESTIONS[quiz.topic] || [];
        const mySubmission = quiz.submissions.find((s) => s.userId?._id?.toString() === userId || s.userId?.toString() === userId);
        return {
            quizId: quiz._id,
            topic: quiz.topic,
            title: quiz.title,
            startedBy: quiz.startedBy,
            startedAt: quiz.startedAt,
            status: quiz.status,
            totalParticipants: quiz.submissions.length,
            averageScore: quiz.submissions.length
                ? Math.round(quiz.submissions.reduce((acc, s) => acc + s.scorePercentage, 0) /
                    quiz.submissions.length)
                : 0,
            mySubmission: mySubmission || null,
            questions: topicQuestions.map((q) => ({
                id: q.id,
                questionText: q.questionText,
                options: q.options,
                concept: q.concept,
            })),
        };
    }
    /**
     * Submit individual answers to group quiz
     * Integrates with learningPathService to register genuine individual evidence!
     */
    async submitQuizAnswers(userId, roomId, quizId, answers) {
        await this.getAuthorizedMember(roomId, userId);
        const quiz = await RoomQuizSession_js_1.RoomQuizSession.findOne({
            _id: quizId,
            roomId: new mongoose_1.default.Types.ObjectId(roomId),
            status: 'ACTIVE',
        });
        if (!quiz) {
            throw new Error('Active group quiz not found or already closed.');
        }
        const existingSubmission = quiz.submissions.find((s) => s.userId.toString() === userId);
        if (existingSubmission) {
            throw new Error('You have already submitted answers for this quiz.');
        }
        // 1. Submit through official learningPathService for real mastery evidence!
        const assessmentResult = await learningPathService_js_1.learningPathService.submitAssessment(userId, quiz.topic, answers, 5);
        const scorePercentage = typeof assessmentResult.percentage === 'number' ? assessmentResult.percentage : 0;
        const correctCount = typeof assessmentResult.correctCount === 'number' ? assessmentResult.correctCount : 0;
        const totalQuestions = typeof assessmentResult.totalQuestions === 'number' ? assessmentResult.totalQuestions : 1;
        // 2. Record individual submission in room quiz session
        quiz.submissions.push({
            userId: new mongoose_1.default.Types.ObjectId(userId),
            scorePercentage,
            correctCount,
            totalQuestions,
            submittedAt: new Date(),
            attemptId: assessmentResult.attemptId,
        });
        await quiz.save();
        // 3. Broadcast aggregate update
        const avgScore = Math.round(quiz.submissions.reduce((acc, s) => acc + s.scorePercentage, 0) / quiz.submissions.length);
        studyRoomStreamService_js_1.studyRoomStreamService.broadcast(roomId, 'quiz_update', {
            action: 'SUBMISSION_RECEIVED',
            quizId: quiz._id,
            totalParticipants: quiz.submissions.length,
            averageScore: avgScore,
        });
        return {
            scorePercentage,
            correctAnswersCount: correctCount,
            totalQuestions,
            isPass: assessmentResult.isPass,
            evaluatedQuestions: assessmentResult.questionsReview,
            roomAggregate: {
                totalParticipants: quiz.submissions.length,
                averageScore: avgScore,
            },
        };
    }
    /**
     * Ask AI within Study Room (Contextual, safe pedagogical assistant)
     */
    async askAI(userId, roomId, input) {
        const { room } = await this.getAuthorizedMember(roomId, userId);
        let contextSnippet = `Study Room Goal: "${room.goal}".`;
        if (input.topic) {
            contextSnippet += ` Current Topic: "${input.topic}".`;
        }
        if (input.resourceId) {
            const resource = await StudyResource_js_1.StudyResource.findById(input.resourceId);
            if (resource?.extractedText) {
                contextSnippet += `\nShared Document Context: ${resource.extractedText.slice(0, 1500)}`;
            }
        }
        const systemInstruction = `You are Study Stick AI's Collaborative Study Room Coach.
The student is studying in a collaborative room.
${contextSnippet}
Your task is: ${input.action.toUpperCase()}.
Keep your response educational, focused, clear, and actionable for college students preparing for semesters and competitive exams.`;
        const aiResponse = await aiOrchestrator_js_1.aiOrchestrator.processRequest({
            message: input.prompt,
            studentId: userId,
            taskType: 'chat',
            tutorMode: 'explain',
            options: {
                systemInstruction,
            },
        });
        return aiResponse.text;
    }
    /**
     * Compute real persisted room progress metrics for the student and the room
     */
    async getRoomProgress(userId, roomId) {
        await this.getAuthorizedMember(roomId, userId);
        const userObjectId = new mongoose_1.default.Types.ObjectId(userId);
        const roomObjectId = new mongoose_1.default.Types.ObjectId(roomId);
        // 1. Quizzes
        const quizzes = await RoomQuizSession_js_1.RoomQuizSession.find({ roomId: roomObjectId });
        const mySubmissions = [];
        let roomQuizSubmissionsCount = 0;
        let roomQuizScoreSum = 0;
        for (const q of quizzes) {
            for (const s of q.submissions) {
                roomQuizSubmissionsCount++;
                roomQuizScoreSum += s.scorePercentage;
                if (s.userId.toString() === userId) {
                    mySubmissions.push(s);
                }
            }
        }
        const myAvgQuizScore = mySubmissions.length
            ? Math.round(mySubmissions.reduce((acc, s) => acc + s.scorePercentage, 0) / mySubmissions.length)
            : 0;
        const roomAvgQuizScore = roomQuizSubmissionsCount
            ? Math.round(roomQuizScoreSum / roomQuizSubmissionsCount)
            : 0;
        // 2. Tasks
        const allTasks = await RoomTask_js_1.RoomTask.find({ roomId: roomObjectId });
        const myCompletedTasks = allTasks.filter((t) => t.status === 'COMPLETED' && t.completedBy?.toString() === userId).length;
        const roomCompletedTasks = allTasks.filter((t) => t.status === 'COMPLETED').length;
        // 3. Shared Resources
        const allResources = await RoomResource_js_1.RoomResource.find({ roomId: roomObjectId });
        const mySharedResourcesCount = allResources.filter((r) => r.sharedBy.toString() === userId).length;
        return {
            myProgress: {
                quizzesAttempted: mySubmissions.length,
                averageQuizScore: myAvgQuizScore,
                tasksCompleted: myCompletedTasks,
                resourcesShared: mySharedResourcesCount,
            },
            roomActivity: {
                totalTasks: allTasks.length,
                tasksCompleted: roomCompletedTasks,
                totalResources: allResources.length,
                totalQuizzesConducted: quizzes.length,
                roomAverageQuizScore: roomAvgQuizScore,
            },
        };
    }
}
exports.StudyRoomService = StudyRoomService;
exports.studyRoomService = new StudyRoomService();
