import { Router } from 'express';
import {
  getSleepSchedule,
  updateSleepSchedule,
  getSleepConflicts,
} from '../controllers/sleepController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSleepSchedule);
router.put('/', updateSleepSchedule);
router.get('/conflicts', getSleepConflicts);

export default router;
