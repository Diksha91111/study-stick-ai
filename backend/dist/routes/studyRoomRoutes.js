"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const studyRoomController_js_1 = require("../controllers/studyRoomController.js");
const router = (0, express_1.Router)();
// All study room routes require an authenticated user
router.use(auth_js_1.authenticateToken);
// Room Discovery & Membership list
router.get('/', studyRoomController_js_1.getMyRooms);
router.post('/', studyRoomController_js_1.createRoom);
router.get('/public', studyRoomController_js_1.getPublicRooms);
router.post('/join', studyRoomController_js_1.joinRoomByInvite);
// Room Workspace & Member Operations
router.get('/:roomId', studyRoomController_js_1.getRoomDetails);
router.patch('/:roomId', studyRoomController_js_1.updateRoom);
router.post('/:roomId/join-public', studyRoomController_js_1.joinPublicRoom);
router.post('/:roomId/leave', studyRoomController_js_1.leaveRoom);
router.post('/:roomId/regenerate-invite', studyRoomController_js_1.regenerateInvite);
router.post('/:roomId/invite/regenerate', studyRoomController_js_1.regenerateInvite);
router.get('/:roomId/members', studyRoomController_js_1.getMembers);
router.post('/:roomId/members/:targetUserId', studyRoomController_js_1.manageMember);
router.patch('/:roomId/members/:targetUserId', studyRoomController_js_1.manageMember);
router.delete('/:roomId/members/:targetUserId', studyRoomController_js_1.manageMember);
// Member General Presence (ONLINE, STUDYING, BREAK, OFFLINE)
router.patch('/:roomId/presence', studyRoomController_js_1.updatePresence);
router.post('/:roomId/presence', studyRoomController_js_1.updatePresence);
// Realtime Stream
router.get('/:roomId/stream', studyRoomController_js_1.connectRoomStream);
// Focus Sessions
router.post('/:roomId/sessions', studyRoomController_js_1.startFocusSession);
router.patch('/:roomId/sessions', studyRoomController_js_1.updateFocusSession);
router.post('/:roomId/sessions/control', studyRoomController_js_1.updateFocusSession);
router.patch('/:roomId/sessions/control', studyRoomController_js_1.updateFocusSession);
router.post('/:roomId/sessions/participant', studyRoomController_js_1.updateParticipantPresence);
router.post('/:roomId/sessions/presence', studyRoomController_js_1.updateParticipantPresence);
// Room Chat
router.get('/:roomId/messages', studyRoomController_js_1.getMessages);
router.post('/:roomId/messages', studyRoomController_js_1.sendMessage);
// Shared Tasks
router.get('/:roomId/tasks', studyRoomController_js_1.getTasks);
router.post('/:roomId/tasks', studyRoomController_js_1.createTask);
router.patch('/:roomId/tasks/:taskId', studyRoomController_js_1.updateTaskStatus);
// Shared Resources
router.get('/:roomId/resources', studyRoomController_js_1.getResources);
router.post('/:roomId/resources', studyRoomController_js_1.shareResource);
// Group Quiz
router.get('/:roomId/quiz', studyRoomController_js_1.getActiveQuiz);
router.get('/:roomId/quizzes', studyRoomController_js_1.getActiveQuiz);
router.post('/:roomId/quiz', studyRoomController_js_1.startGroupQuiz);
router.post('/:roomId/quizzes', studyRoomController_js_1.startGroupQuiz);
router.post('/:roomId/quiz/submit', studyRoomController_js_1.submitQuiz);
router.post('/:roomId/quizzes/submit', studyRoomController_js_1.submitQuiz);
router.post('/:roomId/quizzes/:quizId/submit', studyRoomController_js_1.submitQuiz);
// AI Assistant in Room
router.post('/:roomId/ai', studyRoomController_js_1.askAIInRoom);
// Real Persisted Progress
router.get('/:roomId/progress', studyRoomController_js_1.getRoomProgress);
exports.default = router;
