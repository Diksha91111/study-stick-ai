"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const progressController_js_1 = require("../controllers/progressController.js");
const router = (0, express_1.Router)();
// Apply authentication middleware to all progress routes
router.use(auth_js_1.requireAuth);
router.post('/record', progressController_js_1.recordProgressEvent);
router.get('/dashboard', progressController_js_1.getProgressDashboard);
exports.default = router;
