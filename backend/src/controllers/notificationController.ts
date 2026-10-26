import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { notificationService } from '../services/notifications/notificationService.js';
import { notificationScheduler } from '../services/notifications/notificationScheduler.js';

/**
 * Get in-app notifications
 */
export const getNotifications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const limit = parseInt(req.query.limit as string, 10) || 30;
    const skip = parseInt(req.query.skip as string, 10) || 0;
    const unreadOnly = req.query.unreadOnly === 'true';
    const channel = (req.query.channel as string) || 'in_app';

    const result = await notificationService.getNotifications(userId, {
      limit,
      skip,
      unreadOnly,
      channel,
    });

    sendSuccess(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const count = await notificationService.getUnreadCount(userId);
    sendSuccess(res, { count }, 'Unread count retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const notification = await notificationService.markAsRead(userId, id);

    if (!notification) {
      sendError(res, 'Notification not found', 404);
      return;
    }

    sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const modifiedCount = await notificationService.markAllAsRead(userId);
    sendSuccess(res, { modifiedCount }, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { id } = req.params;
    const success = await notificationService.deleteNotification(userId, id);

    if (!success) {
      sendError(res, 'Notification not found', 404);
      return;
    }

    sendSuccess(res, null, 'Notification deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification preferences
 */
export const getPreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const prefs = await notificationService.getPreferences(userId);
    sendSuccess(res, prefs, 'Preferences retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 */
export const updatePreferences = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const updated = await notificationService.updatePreferences(userId, req.body);
    sendSuccess(res, updated, 'Notification preferences updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update preferences', 400);
  }
};

/**
 * Send test notification
 */
export const sendTestNotification = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      sendError(res, 'Unauthorized', 401);
      return;
    }

    const { channel } = req.body;
    if (!['email', 'whatsapp'].includes(channel)) {
      sendError(res, 'Channel must be either "email" or "whatsapp"', 400);
      return;
    }

    const result = await notificationService.sendTestNotification(userId, channel);
    sendSuccess(res, result, `Test notification initiated on ${channel}`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to trigger test notification', 400);
  }
};

/**
 * Trigger scheduler tick manually or from external cron/webhook
 */
export const triggerSchedulerTick = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const secret = req.headers['x-scheduler-secret'];
    const expectedSecret = process.env.SCHEDULER_SECRET;

    if (expectedSecret && secret !== expectedSecret && !req.user?.userId) {
      sendError(res, 'Unauthorized scheduler tick trigger', 401);
      return;
    }

    const stats = await notificationScheduler.runTick();
    sendSuccess(res, stats, 'Scheduler tick executed successfully');
  } catch (error) {
    next(error);
  }
};
