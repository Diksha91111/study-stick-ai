import { Router } from 'express';
import {
  register,
  login,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
  getMe,
  recordLegalConsent,
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Public Auth Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/refresh', refreshToken);
router.get('/refresh', refreshToken);
router.post('/logout', logout);

// Protected Auth Endpoints
router.post('/change-password', authenticateToken, changePassword);
router.get('/me', authenticateToken, getMe);
router.post('/legal-consent', authenticateToken, recordLegalConsent);

export default router;
