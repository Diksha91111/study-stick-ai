"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_js_1 = require("../middleware/auth.js");
const plannerController_js_1 = require("../controllers/plannerController.js");
const router = express_1.default.Router();
router.use(auth_js_1.requireAuth);
router.get('/dashboard', plannerController_js_1.getDashboard);
router.post('/generate', plannerController_js_1.forceRegenerateSchedule);
router.put('/sessions/:sessionId/status', plannerController_js_1.updateSessionStatus);
router.post('/sessions/:sessionId/reschedule', plannerController_js_1.rescheduleSession);
exports.default = router;
