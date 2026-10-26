import { Router } from 'express';
import {
  getSlots,
  createSlot,
  updateSlot,
  deleteSlot,
} from '../controllers/timetableController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getSlots);
router.post('/', createSlot);
router.put('/:id', updateSlot);
router.delete('/:id', deleteSlot);

export default router;
