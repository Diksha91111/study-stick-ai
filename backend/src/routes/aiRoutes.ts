import { Router } from 'express';
import {
  handleAIChat,
  handleAIStreamChat,
  getAIProviderStatus,
  getConversations,
  createConversation,
  getConversationById,
  updateConversation,
  deleteConversation,
} from '../controllers/aiController.js';
import { handleCodeAssistant } from '../controllers/codeAssistantController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// All AI routes require authentication
router.use(authenticateToken);

// Conversation persistence routes
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id', getConversationById);
router.patch('/conversations/:id', updateConversation);
router.delete('/conversations/:id', deleteConversation);

// AI Chat & Assistant endpoints
router.post('/chat', handleAIChat);
router.post('/chat/stream', handleAIStreamChat);
router.post('/code-assistant', handleCodeAssistant);

// System status
router.get('/providers', getAIProviderStatus);

export default router;
