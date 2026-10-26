"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRoomProgress = exports.askAIInRoom = exports.submitQuiz = exports.startGroupQuiz = exports.getActiveQuiz = exports.shareResource = exports.getResources = exports.updateTaskStatus = exports.createTask = exports.getTasks = exports.sendMessage = exports.getMessages = exports.getMembers = exports.updatePresence = exports.updateParticipantPresence = exports.updateFocusSession = exports.startFocusSession = exports.connectRoomStream = exports.manageMember = exports.regenerateInvite = exports.updateRoom = exports.leaveRoom = exports.joinPublicRoom = exports.joinRoomByInvite = exports.getRoomDetails = exports.getPublicRooms = exports.getMyRooms = exports.createRoom = void 0;
const response_js_1 = require("../utils/response.js");
const studyRoomService_js_1 = require("../services/studyRoomService.js");
const studyRoomStreamService_js_1 = require("../services/studyRoomStreamService.js");
const createRoom = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { name, description, goal, privacy, maxMembers, defaultFocusDuration } = req.body;
        if (!name || !goal) {
            (0, response_js_1.sendError)(res, 'Room name and study goal are required', 400);
            return;
        }
        const room = await studyRoomService_js_1.studyRoomService.createRoom(userId, {
            name,
            description,
            goal,
            privacy,
            maxMembers: maxMembers ? Number(maxMembers) : undefined,
            defaultFocusDuration: defaultFocusDuration ? Number(defaultFocusDuration) : undefined,
        });
        (0, response_js_1.sendSuccess)(res, room, 'Study room created successfully', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.createRoom = createRoom;
const getMyRooms = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const rooms = await studyRoomService_js_1.studyRoomService.getUserRooms(userId);
        (0, response_js_1.sendSuccess)(res, rooms, 'User study rooms retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getMyRooms = getMyRooms;
const getPublicRooms = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const rooms = await studyRoomService_js_1.studyRoomService.getPublicRooms(userId);
        (0, response_js_1.sendSuccess)(res, rooms, 'Public study rooms retrieved');
    }
    catch (error) {
        next(error);
    }
};
exports.getPublicRooms = getPublicRooms;
const getRoomDetails = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const room = await studyRoomService_js_1.studyRoomService.getRoomDetails(roomId, userId);
        (0, response_js_1.sendSuccess)(res, room, 'Study room details retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to retrieve room details', 403);
    }
};
exports.getRoomDetails = getRoomDetails;
const joinRoomByInvite = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { inviteCode } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!inviteCode || typeof inviteCode !== 'string') {
            (0, response_js_1.sendError)(res, 'A valid invite code is required to join a private room', 400);
            return;
        }
        const room = await studyRoomService_js_1.studyRoomService.joinByInviteCode(userId, inviteCode);
        (0, response_js_1.sendSuccess)(res, room, 'Successfully joined study room');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Unable to join study room', 400);
    }
};
exports.joinRoomByInvite = joinRoomByInvite;
const joinPublicRoom = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const room = await studyRoomService_js_1.studyRoomService.joinPublicRoom(userId, roomId);
        (0, response_js_1.sendSuccess)(res, room, 'Successfully joined public study room');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Unable to join study room', 400);
    }
};
exports.joinPublicRoom = joinPublicRoom;
const leaveRoom = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const result = await studyRoomService_js_1.studyRoomService.leaveRoom(userId, roomId);
        (0, response_js_1.sendSuccess)(res, result, result.message);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Unable to leave study room', 400);
    }
};
exports.leaveRoom = leaveRoom;
const updateRoom = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const room = await studyRoomService_js_1.studyRoomService.updateRoom(userId, roomId, req.body);
        (0, response_js_1.sendSuccess)(res, room, 'Room settings updated successfully');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to update room settings', 403);
    }
};
exports.updateRoom = updateRoom;
const regenerateInvite = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const inviteCode = await studyRoomService_js_1.studyRoomService.regenerateInviteCode(userId, roomId);
        (0, response_js_1.sendSuccess)(res, { inviteCode }, 'Invite code regenerated');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to regenerate invite code', 403);
    }
};
exports.regenerateInvite = regenerateInvite;
const manageMember = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId, targetUserId } = req.params;
        const { action } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const room = await studyRoomService_js_1.studyRoomService.manageMember(userId, roomId, targetUserId, action);
        (0, response_js_1.sendSuccess)(res, room, `Member ${action.toLowerCase()} completed`);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to update member role', 403);
    }
};
exports.manageMember = manageMember;
/**
 * SSE Real-Time Event Stream
 */
const connectRoomStream = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            res.status(401).end();
            return;
        }
        // Verify member has access
        await studyRoomService_js_1.studyRoomService.getAuthorizedMember(roomId, userId);
        // Setup SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        const cleanup = studyRoomStreamService_js_1.studyRoomStreamService.registerClient(roomId, userId, res);
        req.on('close', () => {
            cleanup();
        });
    }
    catch {
        res.status(403).end();
    }
};
exports.connectRoomStream = connectRoomStream;
/**
 * Focus Session Handlers
 */
const startFocusSession = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { goal, durationMinutes } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!goal) {
            (0, response_js_1.sendError)(res, 'Session goal is required', 400);
            return;
        }
        const session = await studyRoomService_js_1.studyRoomService.startFocusSession(userId, roomId, {
            goal,
            durationMinutes: durationMinutes ? Number(durationMinutes) : 45,
        });
        (0, response_js_1.sendSuccess)(res, session, 'Focus session started', 201);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to start focus session', 403);
    }
};
exports.startFocusSession = startFocusSession;
const updateFocusSession = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { action } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const result = await studyRoomService_js_1.studyRoomService.updateFocusSession(userId, roomId, action);
        (0, response_js_1.sendSuccess)(res, result, `Focus session ${action.toLowerCase()}`);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to update focus session', 403);
    }
};
exports.updateFocusSession = updateFocusSession;
const updateParticipantPresence = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const action = req.body.action || req.body.status;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        let status = 'STUDYING';
        if (action === 'BREAK')
            status = 'BREAK';
        else if (action === 'LEAVE')
            status = 'LEAVE';
        else if (action === 'JOIN' || action === 'RESUME' || action === 'STUDYING')
            status = 'STUDYING';
        const session = await studyRoomService_js_1.studyRoomService.updateParticipantSessionStatus(userId, roomId, status);
        (0, response_js_1.sendSuccess)(res, session, 'Participant status updated');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to update participant status', 400);
    }
};
exports.updateParticipantPresence = updateParticipantPresence;
const updatePresence = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { presence } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!presence) {
            (0, response_js_1.sendError)(res, 'Presence status is required', 400);
            return;
        }
        const member = await studyRoomService_js_1.studyRoomService.updateMemberPresence(userId, roomId, presence);
        (0, response_js_1.sendSuccess)(res, member, 'Presence status updated');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to update presence', 400);
    }
};
exports.updatePresence = updatePresence;
const getMembers = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const { room } = await studyRoomService_js_1.studyRoomService.getAuthorizedMember(roomId, userId);
        await room.populate('members.userId', 'name email avatar');
        (0, response_js_1.sendSuccess)(res, room.members, 'Room members retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to retrieve members', 403);
    }
};
exports.getMembers = getMembers;
/**
 * Chat Handlers
 */
const getMessages = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const messages = await studyRoomService_js_1.studyRoomService.getMessages(userId, roomId);
        (0, response_js_1.sendSuccess)(res, messages, 'Chat messages retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to retrieve messages', 403);
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { content } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const message = await studyRoomService_js_1.studyRoomService.sendMessage(userId, roomId, content);
        (0, response_js_1.sendSuccess)(res, message, 'Message sent', 201);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to send message', 400);
    }
};
exports.sendMessage = sendMessage;
/**
 * Task Handlers
 */
const getTasks = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const tasks = await studyRoomService_js_1.studyRoomService.getTasks(userId, roomId);
        (0, response_js_1.sendSuccess)(res, tasks, 'Room tasks retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to retrieve tasks', 403);
    }
};
exports.getTasks = getTasks;
const createTask = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { title, description, dueDate } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!title) {
            (0, response_js_1.sendError)(res, 'Task title is required', 400);
            return;
        }
        const task = await studyRoomService_js_1.studyRoomService.createTask(userId, roomId, {
            title,
            description,
            dueDate,
        });
        (0, response_js_1.sendSuccess)(res, task, 'Task created successfully', 201);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to create task', 400);
    }
};
exports.createTask = createTask;
const updateTaskStatus = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId, taskId } = req.params;
        const { status } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const task = await studyRoomService_js_1.studyRoomService.updateTaskStatus(userId, roomId, taskId, status);
        (0, response_js_1.sendSuccess)(res, task, 'Task status updated');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to update task status', 400);
    }
};
exports.updateTaskStatus = updateTaskStatus;
/**
 * Resource Handlers
 */
const getResources = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const resources = await studyRoomService_js_1.studyRoomService.getSharedResources(userId, roomId);
        (0, response_js_1.sendSuccess)(res, resources, 'Shared resources retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to retrieve resources', 403);
    }
};
exports.getResources = getResources;
const shareResource = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { resourceId, note } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!resourceId) {
            (0, response_js_1.sendError)(res, 'Resource ID is required', 400);
            return;
        }
        const resource = await studyRoomService_js_1.studyRoomService.shareResource(userId, roomId, resourceId, note);
        (0, response_js_1.sendSuccess)(res, resource, 'Resource shared successfully', 201);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to share resource', 400);
    }
};
exports.shareResource = shareResource;
/**
 * Quiz Handlers
 */
const getActiveQuiz = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const quiz = await studyRoomService_js_1.studyRoomService.getActiveQuiz(userId, roomId);
        (0, response_js_1.sendSuccess)(res, quiz, 'Active quiz session retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to retrieve active quiz', 403);
    }
};
exports.getActiveQuiz = getActiveQuiz;
const startGroupQuiz = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { topic } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!topic) {
            (0, response_js_1.sendError)(res, 'Quiz topic is required', 400);
            return;
        }
        const quiz = await studyRoomService_js_1.studyRoomService.startGroupQuiz(userId, roomId, topic);
        (0, response_js_1.sendSuccess)(res, quiz, 'Group quiz launched', 201);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to start group quiz', 403);
    }
};
exports.startGroupQuiz = startGroupQuiz;
const submitQuiz = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { quizId, answers } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!quizId || !answers || !Array.isArray(answers)) {
            (0, response_js_1.sendError)(res, 'Quiz ID and answers array are required', 400);
            return;
        }
        const result = await studyRoomService_js_1.studyRoomService.submitQuizAnswers(userId, roomId, quizId, answers);
        (0, response_js_1.sendSuccess)(res, result, 'Quiz answers evaluated and saved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to submit quiz answers', 400);
    }
};
exports.submitQuiz = submitQuiz;
/**
 * AI Assistant Handler
 */
const askAIInRoom = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        const { action, prompt, topic, resourceId } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!prompt) {
            (0, response_js_1.sendError)(res, 'Prompt is required', 400);
            return;
        }
        const answer = await studyRoomService_js_1.studyRoomService.askAI(userId, roomId, {
            action: action || 'explain',
            prompt,
            topic,
            resourceId,
        });
        (0, response_js_1.sendSuccess)(res, { answer }, 'AI response generated');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to generate AI response', 400);
    }
};
exports.askAIInRoom = askAIInRoom;
/**
 * Room Progress Metrics
 */
const getRoomProgress = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { roomId } = req.params;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        const progress = await studyRoomService_js_1.studyRoomService.getRoomProgress(userId, roomId);
        (0, response_js_1.sendSuccess)(res, progress, 'Study room progress metrics retrieved');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to retrieve room progress', 403);
    }
};
exports.getRoomProgress = getRoomProgress;
