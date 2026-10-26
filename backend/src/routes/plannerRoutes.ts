import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getDashboard,
  updateSessionStatus,
  rescheduleSession,
  forceRegenerateSchedule,
} from '../controllers/plannerController.js';

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', getDashboard);
router.post('/generate', forceRegenerateSchedule);
router.put('/sessions/:sessionId/status', updateSessionStatus);
router.post('/sessions/:sessionId/reschedule', rescheduleSession);

export default router;
