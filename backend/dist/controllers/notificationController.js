"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerSchedulerTick = exports.sendTestNotification = exports.updatePreferences = exports.getPreferences = exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
const response_js_1 = require("../utils/response.js");
const notificationService_js_1 = require("../services/notifications/notificationService.js");
const notificationScheduler_js_1 = require("../services/notifications/notificationScheduler.js");
/**
 * Get in-app notifications
 */
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const limit = parseInt(req.query.limit, 10) || 30;
        const skip = parseInt(req.query.skip, 10) || 0;
        const unreadOnly = req.query.unreadOnly === 'true';
        const channel = req.query.channel || 'in_app';
        const result = await notificationService_js_1.notificationService.getNotifications(userId, {
            limit,
            skip,
            unreadOnly,
            channel,
        });
        (0, response_js_1.sendSuccess)(res, result, 'Notifications retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getNotifications = getNotifications;
/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const count = await notificationService_js_1.notificationService.getUnreadCount(userId);
        (0, response_js_1.sendSuccess)(res, { count }, 'Unread count retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getUnreadCount = getUnreadCount;
/**
 * Mark a single notification as read
 */
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { id } = req.params;
        const notification = await notificationService_js_1.notificationService.markAsRead(userId, id);
        if (!notification) {
            (0, response_js_1.sendError)(res, 'Notification not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, notification, 'Notification marked as read');
    }
    catch (error) {
        next(error);
    }
};
exports.markAsRead = markAsRead;
/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const modifiedCount = await notificationService_js_1.notificationService.markAllAsRead(userId);
        (0, response_js_1.sendSuccess)(res, { modifiedCount }, 'All notifications marked as read');
    }
    catch (error) {
        next(error);
    }
};
exports.markAllAsRead = markAllAsRead;
/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { id } = req.params;
        const success = await notificationService_js_1.notificationService.deleteNotification(userId, id);
        if (!success) {
            (0, response_js_1.sendError)(res, 'Notification not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, null, 'Notification deleted successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.deleteNotification = deleteNotification;
/**
 * Get notification preferences
 */
const getPreferences = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const prefs = await notificationService_js_1.notificationService.getPreferences(userId);
        (0, response_js_1.sendSuccess)(res, prefs, 'Preferences retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getPreferences = getPreferences;
/**
 * Update notification preferences
 */
const updatePreferences = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const updated = await notificationService_js_1.notificationService.updatePreferences(userId, req.body);
        (0, response_js_1.sendSuccess)(res, updated, 'Notification preferences updated successfully');
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to update preferences', 400);
    }
};
exports.updatePreferences = updatePreferences;
/**
 * Send test notification
 */
const sendTestNotification = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized', 401);
            return;
        }
        const { channel } = req.body;
        if (!['email', 'whatsapp'].includes(channel)) {
            (0, response_js_1.sendError)(res, 'Channel must be either "email" or "whatsapp"', 400);
            return;
        }
        const result = await notificationService_js_1.notificationService.sendTestNotification(userId, channel);
        (0, response_js_1.sendSuccess)(res, result, `Test notification initiated on ${channel}`);
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Failed to trigger test notification', 400);
    }
};
exports.sendTestNotification = sendTestNotification;
/**
 * Trigger scheduler tick manually or from external cron/webhook
 */
const triggerSchedulerTick = async (req, res, next) => {
    try {
        const secret = req.headers['x-scheduler-secret'];
        const expectedSecret = process.env.SCHEDULER_SECRET;
        if (expectedSecret && secret !== expectedSecret && !req.user?.userId) {
            (0, response_js_1.sendError)(res, 'Unauthorized scheduler tick trigger', 401);
            return;
        }
        const stats = await notificationScheduler_js_1.notificationScheduler.runTick();
        (0, response_js_1.sendSuccess)(res, stats, 'Scheduler tick executed successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.triggerSchedulerTick = triggerSchedulerTick;
