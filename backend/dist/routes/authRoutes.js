"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_js_1 = require("../controllers/authController.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
// Public Auth Endpoints
router.post('/register', authController_js_1.register);
router.post('/login', authController_js_1.login);
router.post('/verify-email', authController_js_1.verifyEmail);
router.get('/verify-email', authController_js_1.verifyEmail);
router.post('/resend-verification', authController_js_1.resendVerification);
router.post('/forgot-password', authController_js_1.forgotPassword);
router.post('/reset-password', authController_js_1.resetPassword);
router.post('/refresh', authController_js_1.refreshToken);
router.get('/refresh', authController_js_1.refreshToken);
router.post('/logout', authController_js_1.logout);
// Protected Auth Endpoints
router.post('/change-password', auth_js_1.authenticateToken, authController_js_1.changePassword);
router.get('/me', auth_js_1.authenticateToken, authController_js_1.getMe);
router.post('/legal-consent', auth_js_1.authenticateToken, authController_js_1.recordLegalConsent);
exports.default = router;
