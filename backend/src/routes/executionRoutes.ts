import { Router } from 'express';
import { runCodeHandler } from '../controllers/executionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Require authentication for code execution
router.use(authenticateToken);

router.post('/run', runCodeHandler);

export default router;
