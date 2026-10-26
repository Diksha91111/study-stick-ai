import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { SleepSchedule } from '../models/SleepSchedule.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../utils/token.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import { TERMS_VERSION, PRIVACY_VERSION } from '../config/legal.js';

/**
 * Helper to check if a user requires legal consent acceptance
 */
export const checkConsentRequired = (user: any): boolean => {
  if (!user.legalConsent) return true;
  if (!user.legalConsent.termsVersion || user.legalConsent.termsVersion !== TERMS_VERSION) return true;
  if (!user.legalConsent.privacyVersion || user.legalConsent.privacyVersion !== PRIVACY_VERSION) return true;
  return false;
};

/**
 * Helper to generate SHA-256 hash for raw tokens
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Register a new student user
 */
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, confirmPassword, acceptedTerms } = req.body;

    if (!name || !email || !password) {
      sendError(res, 'Name, email, and password are required', 400, { code: 'VALIDATION_ERROR' });
      return;
    }

    if (!acceptedTerms) {
      sendError(
        res,
        'Please accept the Terms & Conditions and Privacy Policy to continue.',
        400,
        { code: 'LEGAL_CONSENT_REQUIRED' }
      );
      return;
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      sendError(res, 'Please provide a valid email address', 400, { code: 'VALIDATION_ERROR' });
      return;
    }

    if (password.length < 6) {
      sendError(res, 'Password must be at least 6 characters long', 400, { code: 'VALIDATION_ERROR' });
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      sendError(res, 'Passwords do not match', 400, { code: 'VALIDATION_ERROR' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (existingUser.isEmailVerified) {
        sendError(
          res, 
          'An account with this email address already exists. Please sign in.', 
          409, 
          { code: 'EMAIL_ALREADY_EXISTS', email: normalizedEmail }
        );
        return;
      }

      // Existing unverified account: resend fresh verification OTP and continue verification flow
      const rawVerificationToken = crypto.randomInt(100000, 999999).toString();
      existingUser.verificationTokenHash = hashToken(rawVerificationToken);
      existingUser.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes

      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(password, salt);
      existingUser.name = name.trim();
      existingUser.legalConsent = {
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        privacyAcceptedAt: new Date(),
        privacyVersion: PRIVACY_VERSION,
      };
      await existingUser.save();

      const emailResult = await emailService.sendVerificationEmail(
        existingUser.email,
        existingUser.name,
        rawVerificationToken
      );

      if (!emailResult.emailSent) {
        sendSuccess(
          res,
          {
            user: {
              id: existingUser._id,
              name: existingUser.name,
              email: existingUser.email,
              isEmailVerified: false,
            },
            requiresVerification: true,
            emailSent: false,
            emailDelivered: false,
            deliveryMode: emailResult.deliveryMode || 'simulated',
            code: 'EMAIL_SEND_FAILED',
            email: existingUser.email,
            isSimulated: true,
          },
          "We couldn't send the verification code. Please try again.",
          200
        );
        return;
      }

      sendSuccess(
        res,
        {
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            isEmailVerified: false,
          },
          requiresVerification: true,
          emailSent: true,
          emailDelivered: true,
          deliveryMode: 'real',
          code: 'EMAIL_NOT_VERIFIED',
          email: existingUser.email,
        },
        'Verification code sent. Check your email.',
        200
      );
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate secure 6-digit OTP verification token
    const rawVerificationToken = crypto.randomInt(100000, 999999).toString();
    const verificationTokenHash = hashToken(rawVerificationToken);
    const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      verificationTokenHash,
      verificationTokenExpires,
      legalConsent: {
        termsAcceptedAt: new Date(),
        termsVersion: TERMS_VERSION,
        privacyAcceptedAt: new Date(),
        privacyVersion: PRIVACY_VERSION,
      },
    });

    // Create default profile
    await Profile.create({
      userId: newUser._id,
      collegeName: '',
      degree: 'B.Tech / B.E.',
      branch: 'Computer Science',
      currentSemester: 5,
      currentYear: 3,
      targetCompetitiveExams: [
        { examName: 'GATE CS', targetYear: 2027, notes: 'Targeting top 500 rank' },
      ],
      targetDailyStudyHours: 6,
    });

    // Create default sleep schedule
    await SleepSchedule.create({
      userId: newUser._id,
      bedTime: '23:30',
      wakeTime: '07:00',
      targetSleepHours: 7.5,
      enableAlerts: true,
    });

    // Send verification email via Nodemailer
    const emailResult = await emailService.sendVerificationEmail(
      newUser.email,
      newUser.name,
      rawVerificationToken
    );

    if (!emailResult.emailSent) {
      sendSuccess(
        res,
        {
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            isEmailVerified: false,
          },
          requiresVerification: true,
          emailSent: false,
          emailDelivered: false,
          deliveryMode: emailResult.deliveryMode || 'simulated',
          code: 'EMAIL_SEND_FAILED',
          email: newUser.email,
          isSimulated: true,
        },
        "We couldn't send the verification code. Please try again.",
        201
      );
      return;
    }

    sendSuccess(
      res,
      {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          isEmailVerified: false,
        },
        requiresVerification: true,
        emailSent: true,
        emailDelivered: true,
        deliveryMode: 'real',
        code: 'VERIFICATION_REQUIRED',
        email: newUser.email,
      },
      'Verification code sent. Check your email.',
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Email Address via token
 */
export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rawToken = (req.body.otp || req.body.token || req.query.token || req.query.otp) as string;
    const email = (req.body.email || req.query.email) as string;

    if (!rawToken) {
      sendError(res, 'Verification OTP or token is required', 400);
      return;
    }

    const hashedToken = hashToken(rawToken.toString().trim());

    let query: any = {
      verificationTokenHash: hashedToken,
      verificationTokenExpires: { $gt: new Date() },
    };

    if (email) {
      query = {
        email: email.toLowerCase().trim(),
        verificationTokenHash: hashedToken,
        verificationTokenExpires: { $gt: new Date() },
      };
    }

    const user = await User.findOne(query).select('+verificationTokenHash +verificationTokenExpires');

    if (!user) {
      sendError(
        res,
        'Invalid or expired verification code. Please request a new verification code.',
        400
      );
      return;
    }

    user.isEmailVerified = true;
    user.verificationTokenHash = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    sendSuccess(
      res,
      { isEmailVerified: true },
      'Email address verified successfully! You can now log in.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Resend Verification Email
 */
export const resendVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      sendError(res, 'Email is required', 400);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user && !user.isEmailVerified) {
      const rawVerificationToken = crypto.randomInt(100000, 999999).toString();
      user.verificationTokenHash = hashToken(rawVerificationToken);
      user.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
      await user.save();

      const emailResult = await emailService.sendVerificationEmail(
        user.email,
        user.name,
        rawVerificationToken
      );

      if (!emailResult.emailSent) {
        sendError(
          res,
          "We couldn't send the verification code. Please try again.",
          500,
          {
            requiresVerification: true,
            emailSent: false,
            emailDelivered: false,
            deliveryMode: emailResult.deliveryMode || 'simulated',
            code: 'EMAIL_SEND_FAILED',
            email: user.email,
            isSimulated: true,
          }
        );
        return;
      }
    }

    sendSuccess(
      res,
      {
        requiresVerification: true,
        emailSent: true,
        emailDelivered: true,
        deliveryMode: 'real',
      },
      'Verification code sent. Check your email.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * User Login
 */
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.warn(`[Login] Validation failed: missing email or password for ${email}`);
      sendError(res, 'Email and password are required', 400);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password +isEmailVerified'
    );

    if (!user) {
      console.warn(`[Login] User not found for email: ${normalizedEmail}`);
      sendError(res, 'Invalid email or password', 401);
      return;
    }
    if (!user.password) {
      console.warn(`[Login] User found but no password field available for email: ${normalizedEmail}`);
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[Login] Password mismatch for email: ${normalizedEmail}`);
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      console.warn(`[Login] Account not verified for email: ${normalizedEmail}`);
      sendError(
        res,
        'Please verify your email before signing in.',
        403,
        { isEmailVerified: false, email: user.email }
      );
      return;
    }

    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const requiresLegalConsent = checkConsentRequired(user);

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar || '',
          requiresLegalConsent,
          legalConsent: user.legalConsent,
        },
        requiresLegalConsent,
        accessToken,
        tokens: {
          accessToken,
        },
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot Password Init
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      sendError(res, 'Email address is required', 400);
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      const rawResetToken = crypto.randomBytes(32).toString('hex');
      user.resetTokenHash = hashToken(rawResetToken);
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour
      await user.save();

      const emailResult = await emailService.sendPasswordResetEmail(
        user.email,
        user.name,
        rawResetToken
      );

      if (!emailResult.delivered) {
        sendError(
          res,
          'Failed to deliver password reset email due to mail server authentication failure (EAUTH/535). Please check SMTP configuration.',
          500,
          { code: 'EMAIL_SEND_FAILED', isSimulated: emailResult.isSimulated }
        );
        return;
      }
    }

    sendSuccess(
      res,
      null,
      'If an account exists with this email address, a password reset link has been sent.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reset Password with token
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      sendError(res, 'Reset token and new password are required', 400);
      return;
    }

    if (password.length < 6) {
      sendError(res, 'Password must be at least 6 characters long', 400);
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      sendError(res, 'Passwords do not match', 400);
      return;
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      resetTokenHash: hashedToken,
      resetTokenExpires: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpires +password');

    if (!user) {
      sendError(
        res,
        'Invalid or expired password reset link. Please request a new password reset.',
        400
      );
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    user.refreshTokenHash = undefined; // Invalidate all prior sessions
    await user.save();

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth' });

    sendSuccess(
      res,
      null,
      'Password reset successfully! Please sign in with your new password.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Change Password for Authenticated User
 */
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!currentPassword || !newPassword) {
      sendError(res, 'Current password and new password are required', 400);
      return;
    }

    if (newPassword.length < 6) {
      sendError(res, 'New password must be at least 6 characters long', 400);
      return;
    }

    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      sendError(res, 'New passwords do not match', 400);
      return;
    }

    const user = await User.findById(userId).select('+password');
    if (!user || !user.password) {
      sendError(res, 'User not found', 404);
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      sendError(res, 'Current password is incorrect', 400);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.refreshTokenHash = undefined; // Invalidate current sessions
    await user.save();

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth' });

    sendSuccess(res, null, 'Password updated successfully!');
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh Access Token with Token Rotation & Reuse Detection
 */
export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      sendError(res, 'Refresh token required', 401);
      return;
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      sendError(res, 'Invalid or expired refresh token', 403);
      return;
    }

    const hashedToken = hashToken(token);
    const user = await User.findById(decoded.userId).select('+refreshTokenHash');
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    // Token reuse detection: if token hash does not match currently active refreshTokenHash
    if (user.refreshTokenHash !== hashedToken) {
      user.refreshTokenHash = undefined; // Invalidate active session for security!
      await user.save();
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/api/auth' });
      sendError(res, 'Invalid or reused refresh token session', 403);
      return;
    }

    // Generate new token pair (Refresh Token Rotation)
    const tokenPayload = { userId: user._id.toString(), email: user.email };
    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    sendSuccess(
      res,
      {
        accessToken: newAccessToken,
      },
      'Token refreshed successfully'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * User Logout
 */
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let userId: string | undefined = (req as AuthRequest).user?.userId;

    if (!userId) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const candidate = authHeader.split(' ')[1]?.trim();
        if (candidate && candidate !== 'null' && candidate !== 'undefined') {
          try {
            const decoded = verifyAccessToken(candidate);
            userId = decoded.userId;
          } catch {
            // Token might be expired, check refresh token
          }
        }
      }
    }

    if (!userId) {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (token) {
        try {
          const decodedRefresh = verifyRefreshToken(token);
          userId = decodedRefresh.userId;
        } catch {
          // Ignore invalid refresh token during logout
        }
      }
    }

    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }

    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/api/auth' });

    sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Get Authenticated User Details
 */
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    const profile = await Profile.findOne({ userId: user._id });
    const sleepSchedule = await SleepSchedule.findOne({ userId: user._id });
    const requiresLegalConsent = checkConsentRequired(user);

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          requiresLegalConsent,
          legalConsent: user.legalConsent,
        },
        requiresLegalConsent,
        profile,
        sleepSchedule,
      },
      'User details fetched'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Record Legal Consent for authenticated user
 */
export const recordLegalConsent = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { acceptedTerms } = req.body;

    if (!userId) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!acceptedTerms) {
      sendError(
        res,
        'Please accept the Terms & Conditions and Privacy Policy to continue.',
        400,
        { code: 'LEGAL_CONSENT_REQUIRED' }
      );
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }

    user.legalConsent = {
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
      privacyAcceptedAt: new Date(),
      privacyVersion: PRIVACY_VERSION,
    };
    await user.save();

    sendSuccess(
      res,
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          requiresLegalConsent: false,
          legalConsent: user.legalConsent,
        },
        requiresLegalConsent: false,
      },
      'Legal consent recorded successfully'
    );
  } catch (error) {
    next(error);
  }
};
