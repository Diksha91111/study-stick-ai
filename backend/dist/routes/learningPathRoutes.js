"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const learningPathController_js_1 = require("../controllers/learningPathController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = express_1.default.Router();
router.use(auth_js_1.authenticateToken);
router.get('/', learningPathController_js_1.getLearningPath);
router.post('/start-topic', learningPathController_js_1.startTopic);
router.patch('/recommendation/:recommendationId', learningPathController_js_1.updateRecommendation);
router.get('/topic-content/:topic', learningPathController_js_1.getTopicContent);
router.post('/assessment/generate', learningPathController_js_1.generateAssessment);
router.post('/assessment/submit', learningPathController_js_1.submitAssessment);
router.post('/ai-tutor', learningPathController_js_1.askAITutor);
exports.default = router;
