import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';
import {
  handleUpload,
  handleVideoLink,
  getUserResources,
  getResourceById,
  deleteResource,
  previewResourceFile,
  retryResource,
} from '../controllers/resourceController.js';

const router = Router();

// Multer memory storage with 50MB ceiling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

router.use(authenticateToken);

router.post('/upload', upload.single('file'), handleUpload);
router.post('/link', handleVideoLink);
router.get('/', getUserResources);
router.get('/:id', getResourceById);
router.get('/:id/file', previewResourceFile);
router.post('/:id/retry', retryResource);
router.delete('/:id', deleteResource);

export default router;
