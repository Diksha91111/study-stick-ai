import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createRoom,
  getMyRooms,
  getPublicRooms,
  getRoomDetails,
  joinRoomByInvite,
  joinPublicRoom,
  leaveRoom,
  updateRoom,
  regenerateInvite,
  manageMember,
  connectRoomStream,
  startFocusSession,
  updateFocusSession,
  updateParticipantPresence,
  updatePresence,
  getMembers,
  getMessages,
  sendMessage,
  getTasks,
  createTask,
  updateTaskStatus,
  getResources,
  shareResource,
  getActiveQuiz,
  startGroupQuiz,
  submitQuiz,
  askAIInRoom,
  getRoomProgress,
} from '../controllers/studyRoomController.js';

const router = Router();

// All study room routes require an authenticated user
router.use(authenticateToken);

// Room Discovery & Membership list
router.get('/', getMyRooms);
router.post('/', createRoom);
router.get('/public', getPublicRooms);
router.post('/join', joinRoomByInvite);

// Room Workspace & Member Operations
router.get('/:roomId', getRoomDetails);
router.patch('/:roomId', updateRoom);
router.post('/:roomId/join-public', joinPublicRoom);
router.post('/:roomId/leave', leaveRoom);
router.post('/:roomId/regenerate-invite', regenerateInvite);
router.post('/:roomId/invite/regenerate', regenerateInvite);
router.get('/:roomId/members', getMembers);
router.post('/:roomId/members/:targetUserId', manageMember);
router.patch('/:roomId/members/:targetUserId', manageMember);
router.delete('/:roomId/members/:targetUserId', manageMember);

// Member General Presence (ONLINE, STUDYING, BREAK, OFFLINE)
router.patch('/:roomId/presence', updatePresence);
router.post('/:roomId/presence', updatePresence);

// Realtime Stream
router.get('/:roomId/stream', connectRoomStream);

// Focus Sessions
router.post('/:roomId/sessions', startFocusSession);
router.patch('/:roomId/sessions', updateFocusSession);
router.post('/:roomId/sessions/control', updateFocusSession);
router.patch('/:roomId/sessions/control', updateFocusSession);
router.post('/:roomId/sessions/participant', updateParticipantPresence);
router.post('/:roomId/sessions/presence', updateParticipantPresence);

// Room Chat
router.get('/:roomId/messages', getMessages);
router.post('/:roomId/messages', sendMessage);

// Shared Tasks
router.get('/:roomId/tasks', getTasks);
router.post('/:roomId/tasks', createTask);
router.patch('/:roomId/tasks/:taskId', updateTaskStatus);

// Shared Resources
router.get('/:roomId/resources', getResources);
router.post('/:roomId/resources', shareResource);

// Group Quiz
router.get('/:roomId/quiz', getActiveQuiz);
router.get('/:roomId/quizzes', getActiveQuiz);
router.post('/:roomId/quiz', startGroupQuiz);
router.post('/:roomId/quizzes', startGroupQuiz);
router.post('/:roomId/quiz/submit', submitQuiz);
router.post('/:roomId/quizzes/submit', submitQuiz);
router.post('/:roomId/quizzes/:quizId/submit', submitQuiz);

// AI Assistant in Room
router.post('/:roomId/ai', askAIInRoom);

// Real Persisted Progress
router.get('/:roomId/progress', getRoomProgress);

export default router;
