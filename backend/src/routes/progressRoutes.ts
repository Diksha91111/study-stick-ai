import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { recordProgressEvent, getProgressDashboard } from '../controllers/progressController.js';

const router = Router();

// Apply authentication middleware to all progress routes
router.use(requireAuth);

router.post('/record', recordProgressEvent);
router.get('/dashboard', getProgressDashboard);

export default router;
