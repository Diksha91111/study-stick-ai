"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const aiController_js_1 = require("../controllers/aiController.js");
const codeAssistantController_js_1 = require("../controllers/codeAssistantController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// All AI routes require authentication
router.use(auth_js_1.authenticateToken);
// Conversation persistence routes
router.get('/conversations', aiController_js_1.getConversations);
router.post('/conversations', aiController_js_1.createConversation);
router.get('/conversations/:id', aiController_js_1.getConversationById);
router.patch('/conversations/:id', aiController_js_1.updateConversation);
router.delete('/conversations/:id', aiController_js_1.deleteConversation);
// AI Chat & Assistant endpoints
router.post('/chat', aiController_js_1.handleAIChat);
router.post('/chat/stream', aiController_js_1.handleAIStreamChat);
router.post('/code-assistant', codeAssistantController_js_1.handleCodeAssistant);
// System status
router.get('/providers', aiController_js_1.getAIProviderStatus);
exports.default = router;
