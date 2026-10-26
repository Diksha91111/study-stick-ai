import express from 'express';
import { 
  getLearningPath, 
  updateRecommendation, 
  generateAssessment, 
  submitAssessment,
  startTopic,
  getTopicContent,
  askAITutor
} from '../controllers/learningPathController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getLearningPath);
router.post('/start-topic', startTopic);
router.patch('/recommendation/:recommendationId', updateRecommendation);
router.get('/topic-content/:topic', getTopicContent);
router.post('/assessment/generate', generateAssessment);
router.post('/assessment/submit', submitAssessment);
router.post('/ai-tutor', askAITutor);

export default router;
