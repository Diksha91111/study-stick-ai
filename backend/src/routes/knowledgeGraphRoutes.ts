import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getKnowledgeGraph,
  getNodeDetails,
  getKnowledgeSummary,
  getWeakConcepts,
  explainWeakness,
} from '../controllers/knowledgeGraphController.js';

const router = Router();

// Apply authentication middleware to all knowledge-graph routes
router.use(requireAuth);

router.get('/', getKnowledgeGraph);
router.get('/summary', getKnowledgeSummary);
router.get('/weak-concepts', getWeakConcepts);
router.get('/node/:id', getNodeDetails);
router.post('/explain-weakness', explainWeakness);

export default router;
