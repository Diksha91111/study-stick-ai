import { Router } from 'express';
import {
  getExams,
  createExam,
  updateExam,
  deleteExam,
} from '../controllers/examController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getExams);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

export default router;
