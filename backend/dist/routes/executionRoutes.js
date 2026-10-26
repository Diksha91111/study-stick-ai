"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const executionController_js_1 = require("../controllers/executionController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Require authentication for code execution
router.use(auth_js_1.authenticateToken);
router.post('/run', executionController_js_1.runCodeHandler);
exports.default = router;
