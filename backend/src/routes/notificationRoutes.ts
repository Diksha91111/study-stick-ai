import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  sendTestNotification,
  triggerSchedulerTick,
} from '../controllers/notificationController.js';

const router = Router();

// In-app notifications
router.get('/', authenticateToken, getNotifications);
router.get('/unread-count', authenticateToken, getUnreadCount);
router.patch('/mark-all-read', authenticateToken, markAllAsRead);
router.patch('/:id/read', authenticateToken, markAsRead);
router.delete('/:id', authenticateToken, deleteNotification);

// Notification preferences
router.get('/preferences', authenticateToken, getPreferences);
router.put('/preferences', authenticateToken, updatePreferences);

// Testing
router.post('/test', authenticateToken, sendTestNotification);

// Scheduler tick (supports auth or secret header)
router.post('/scheduler/tick', triggerSchedulerTick);

export default router;
