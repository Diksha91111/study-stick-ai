"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const notificationController_js_1 = require("../controllers/notificationController.js");
const router = (0, express_1.Router)();
// In-app notifications
router.get('/', auth_js_1.authenticateToken, notificationController_js_1.getNotifications);
router.get('/unread-count', auth_js_1.authenticateToken, notificationController_js_1.getUnreadCount);
router.patch('/mark-all-read', auth_js_1.authenticateToken, notificationController_js_1.markAllAsRead);
router.patch('/:id/read', auth_js_1.authenticateToken, notificationController_js_1.markAsRead);
router.delete('/:id', auth_js_1.authenticateToken, notificationController_js_1.deleteNotification);
// Notification preferences
router.get('/preferences', auth_js_1.authenticateToken, notificationController_js_1.getPreferences);
router.put('/preferences', auth_js_1.authenticateToken, notificationController_js_1.updatePreferences);
// Testing
router.post('/test', auth_js_1.authenticateToken, notificationController_js_1.sendTestNotification);
// Scheduler tick (supports auth or secret header)
router.post('/scheduler/tick', notificationController_js_1.triggerSchedulerTick);
exports.default = router;
