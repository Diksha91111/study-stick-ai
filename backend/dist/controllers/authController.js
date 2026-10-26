"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordLegalConsent = exports.getMe = exports.logout = exports.refreshToken = exports.changePassword = exports.resetPassword = exports.forgotPassword = exports.login = exports.resendVerification = exports.verifyEmail = exports.register = exports.checkConsentRequired = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const User_js_1 = require("../models/User.js");
const Profile_js_1 = require("../models/Profile.js");
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const token_js_1 = require("../utils/token.js");
const response_js_1 = require("../utils/response.js");
const emailService_js_1 = require("../services/emailService.js");
const legal_js_1 = require("../config/legal.js");
/**
 * Helper to check if a user requires legal consent acceptance
 */
const checkConsentRequired = (user) => {
    if (!user.legalConsent)
        return true;
    if (!user.legalConsent.termsVersion || user.legalConsent.termsVersion !== legal_js_1.TERMS_VERSION)
        return true;
    if (!user.legalConsent.privacyVersion || user.legalConsent.privacyVersion !== legal_js_1.PRIVACY_VERSION)
        return true;
    return false;
};
exports.checkConsentRequired = checkConsentRequired;
/**
 * Helper to generate SHA-256 hash for raw tokens
 */
const hashToken = (token) => {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
};
/**
 * Register a new student user
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, confirmPassword, acceptedTerms } = req.body;
        if (!name || !email || !password) {
            (0, response_js_1.sendError)(res, 'Name, email, and password are required', 400, { code: 'VALIDATION_ERROR' });
            return;
        }
        if (!acceptedTerms) {
            (0, response_js_1.sendError)(res, 'Please accept the Terms & Conditions and Privacy Policy to continue.', 400, { code: 'LEGAL_CONSENT_REQUIRED' });
            return;
        }
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            (0, response_js_1.sendError)(res, 'Please provide a valid email address', 400, { code: 'VALIDATION_ERROR' });
            return;
        }
        if (password.length < 6) {
            (0, response_js_1.sendError)(res, 'Password must be at least 6 characters long', 400, { code: 'VALIDATION_ERROR' });
            return;
        }
        if (confirmPassword && password !== confirmPassword) {
            (0, response_js_1.sendError)(res, 'Passwords do not match', 400, { code: 'VALIDATION_ERROR' });
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User_js_1.User.findOne({ email: normalizedEmail });
        if (existingUser) {
            if (existingUser.isEmailVerified) {
                (0, response_js_1.sendError)(res, 'An account with this email address already exists. Please sign in.', 409, { code: 'EMAIL_ALREADY_EXISTS', email: normalizedEmail });
                return;
            }
            // Existing unverified account: resend fresh verification OTP and continue verification flow
            const rawVerificationToken = crypto_1.default.randomInt(100000, 999999).toString();
            existingUser.verificationTokenHash = hashToken(rawVerificationToken);
            existingUser.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
            const salt = await bcryptjs_1.default.genSalt(10);
            existingUser.password = await bcryptjs_1.default.hash(password, salt);
            existingUser.name = name.trim();
            existingUser.legalConsent = {
                termsAcceptedAt: new Date(),
                termsVersion: legal_js_1.TERMS_VERSION,
                privacyAcceptedAt: new Date(),
                privacyVersion: legal_js_1.PRIVACY_VERSION,
            };
            await existingUser.save();
            const emailResult = await emailService_js_1.emailService.sendVerificationEmail(existingUser.email, existingUser.name, rawVerificationToken);
            if (!emailResult.emailSent) {
                (0, response_js_1.sendSuccess)(res, {
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
                }, "We couldn't send the verification code. Please try again.", 200);
                return;
            }
            (0, response_js_1.sendSuccess)(res, {
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
            }, 'Verification code sent. Check your email.', 200);
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Generate secure 6-digit OTP verification token
        const rawVerificationToken = crypto_1.default.randomInt(100000, 999999).toString();
        const verificationTokenHash = hashToken(rawVerificationToken);
        const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
        const newUser = await User_js_1.User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            isEmailVerified: false,
            verificationTokenHash,
            verificationTokenExpires,
            legalConsent: {
                termsAcceptedAt: new Date(),
                termsVersion: legal_js_1.TERMS_VERSION,
                privacyAcceptedAt: new Date(),
                privacyVersion: legal_js_1.PRIVACY_VERSION,
            },
        });
        // Create default profile
        await Profile_js_1.Profile.create({
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
        await SleepSchedule_js_1.SleepSchedule.create({
            userId: newUser._id,
            bedTime: '23:30',
            wakeTime: '07:00',
            targetSleepHours: 7.5,
            enableAlerts: true,
        });
        // Send verification email via Nodemailer
        const emailResult = await emailService_js_1.emailService.sendVerificationEmail(newUser.email, newUser.name, rawVerificationToken);
        if (!emailResult.emailSent) {
            (0, response_js_1.sendSuccess)(res, {
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
            }, "We couldn't send the verification code. Please try again.", 201);
            return;
        }
        (0, response_js_1.sendSuccess)(res, {
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
        }, 'Verification code sent. Check your email.', 201);
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
/**
 * Verify Email Address via token
 */
const verifyEmail = async (req, res, next) => {
    try {
        const rawToken = (req.body.otp || req.body.token || req.query.token || req.query.otp);
        const email = (req.body.email || req.query.email);
        if (!rawToken) {
            (0, response_js_1.sendError)(res, 'Verification OTP or token is required', 400);
            return;
        }
        const hashedToken = hashToken(rawToken.toString().trim());
        let query = {
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
        const user = await User_js_1.User.findOne(query).select('+verificationTokenHash +verificationTokenExpires');
        if (!user) {
            (0, response_js_1.sendError)(res, 'Invalid or expired verification code. Please request a new verification code.', 400);
            return;
        }
        user.isEmailVerified = true;
        user.verificationTokenHash = undefined;
        user.verificationTokenExpires = undefined;
        await user.save();
        (0, response_js_1.sendSuccess)(res, { isEmailVerified: true }, 'Email address verified successfully! You can now log in.');
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
/**
 * Resend Verification Email
 */
const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            (0, response_js_1.sendError)(res, 'Email is required', 400);
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_js_1.User.findOne({ email: normalizedEmail });
        if (user && !user.isEmailVerified) {
            const rawVerificationToken = crypto_1.default.randomInt(100000, 999999).toString();
            user.verificationTokenHash = hashToken(rawVerificationToken);
            user.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 Minutes
            await user.save();
            const emailResult = await emailService_js_1.emailService.sendVerificationEmail(user.email, user.name, rawVerificationToken);
            if (!emailResult.emailSent) {
                (0, response_js_1.sendError)(res, "We couldn't send the verification code. Please try again.", 500, {
                    requiresVerification: true,
                    emailSent: false,
                    emailDelivered: false,
                    deliveryMode: emailResult.deliveryMode || 'simulated',
                    code: 'EMAIL_SEND_FAILED',
                    email: user.email,
                    isSimulated: true,
                });
                return;
            }
        }
        (0, response_js_1.sendSuccess)(res, {
            requiresVerification: true,
            emailSent: true,
            emailDelivered: true,
            deliveryMode: 'real',
        }, 'Verification code sent. Check your email.');
    }
    catch (error) {
        next(error);
    }
};
exports.resendVerification = resendVerification;
/**
 * User Login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            console.warn(`[Login] Validation failed: missing email or password for ${email}`);
            (0, response_js_1.sendError)(res, 'Email and password are required', 400);
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_js_1.User.findOne({ email: normalizedEmail }).select('+password +isEmailVerified');
        if (!user) {
            console.warn(`[Login] User not found for email: ${normalizedEmail}`);
            (0, response_js_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        if (!user.password) {
            console.warn(`[Login] User found but no password field available for email: ${normalizedEmail}`);
            (0, response_js_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            console.warn(`[Login] Password mismatch for email: ${normalizedEmail}`);
            (0, response_js_1.sendError)(res, 'Invalid email or password', 401);
            return;
        }
        // Check if email is verified
        if (!user.isEmailVerified) {
            console.warn(`[Login] Account not verified for email: ${normalizedEmail}`);
            (0, response_js_1.sendError)(res, 'Please verify your email before signing in.', 403, { isEmailVerified: false, email: user.email });
            return;
        }
        const tokenPayload = { userId: user._id.toString(), email: user.email };
        const accessToken = (0, token_js_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, token_js_1.generateRefreshToken)(tokenPayload);
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
        const requiresLegalConsent = (0, exports.checkConsentRequired)(user);
        (0, response_js_1.sendSuccess)(res, {
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
        }, 'Logged in successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
/**
 * Forgot Password Init
 */
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            (0, response_js_1.sendError)(res, 'Email address is required', 400);
            return;
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User_js_1.User.findOne({ email: normalizedEmail });
        if (user) {
            const rawResetToken = crypto_1.default.randomBytes(32).toString('hex');
            user.resetTokenHash = hashToken(rawResetToken);
            user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 Hour
            await user.save();
            const emailResult = await emailService_js_1.emailService.sendPasswordResetEmail(user.email, user.name, rawResetToken);
            if (!emailResult.delivered) {
                (0, response_js_1.sendError)(res, 'Failed to deliver password reset email due to mail server authentication failure (EAUTH/535). Please check SMTP configuration.', 500, { code: 'EMAIL_SEND_FAILED', isSimulated: emailResult.isSimulated });
                return;
            }
        }
        (0, response_js_1.sendSuccess)(res, null, 'If an account exists with this email address, a password reset link has been sent.');
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
/**
 * Reset Password with token
 */
const resetPassword = async (req, res, next) => {
    try {
        const { token, password, confirmPassword } = req.body;
        if (!token || !password) {
            (0, response_js_1.sendError)(res, 'Reset token and new password are required', 400);
            return;
        }
        if (password.length < 6) {
            (0, response_js_1.sendError)(res, 'Password must be at least 6 characters long', 400);
            return;
        }
        if (confirmPassword && password !== confirmPassword) {
            (0, response_js_1.sendError)(res, 'Passwords do not match', 400);
            return;
        }
        const hashedToken = hashToken(token);
        const user = await User_js_1.User.findOne({
            resetTokenHash: hashedToken,
            resetTokenExpires: { $gt: new Date() },
        }).select('+resetTokenHash +resetTokenExpires +password');
        if (!user) {
            (0, response_js_1.sendError)(res, 'Invalid or expired password reset link. Please request a new password reset.', 400);
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        user.password = hashedPassword;
        user.resetTokenHash = undefined;
        user.resetTokenExpires = undefined;
        user.refreshTokenHash = undefined; // Invalidate all prior sessions
        await user.save();
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/auth' });
        (0, response_js_1.sendSuccess)(res, null, 'Password reset successfully! Please sign in with your new password.');
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
/**
 * Change Password for Authenticated User
 */
const changePassword = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { currentPassword, newPassword, confirmNewPassword } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!currentPassword || !newPassword) {
            (0, response_js_1.sendError)(res, 'Current password and new password are required', 400);
            return;
        }
        if (newPassword.length < 6) {
            (0, response_js_1.sendError)(res, 'New password must be at least 6 characters long', 400);
            return;
        }
        if (confirmNewPassword && newPassword !== confirmNewPassword) {
            (0, response_js_1.sendError)(res, 'New passwords do not match', 400);
            return;
        }
        const user = await User_js_1.User.findById(userId).select('+password');
        if (!user || !user.password) {
            (0, response_js_1.sendError)(res, 'User not found', 404);
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            (0, response_js_1.sendError)(res, 'Current password is incorrect', 400);
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        user.password = hashedPassword;
        user.refreshTokenHash = undefined; // Invalidate current sessions
        await user.save();
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/auth' });
        (0, response_js_1.sendSuccess)(res, null, 'Password updated successfully!');
    }
    catch (error) {
        next(error);
    }
};
exports.changePassword = changePassword;
/**
 * Refresh Access Token with Token Rotation & Reuse Detection
 */
const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies?.refreshToken || req.body?.refreshToken;
        if (!token) {
            (0, response_js_1.sendError)(res, 'Refresh token required', 401);
            return;
        }
        let decoded;
        try {
            decoded = (0, token_js_1.verifyRefreshToken)(token);
        }
        catch {
            (0, response_js_1.sendError)(res, 'Invalid or expired refresh token', 403);
            return;
        }
        const hashedToken = hashToken(token);
        const user = await User_js_1.User.findById(decoded.userId).select('+refreshTokenHash');
        if (!user) {
            (0, response_js_1.sendError)(res, 'User not found', 404);
            return;
        }
        // Token reuse detection: if token hash does not match currently active refreshTokenHash
        if (user.refreshTokenHash !== hashedToken) {
            user.refreshTokenHash = undefined; // Invalidate active session for security!
            await user.save();
            res.clearCookie('accessToken', { path: '/' });
            res.clearCookie('refreshToken', { path: '/api/auth' });
            (0, response_js_1.sendError)(res, 'Invalid or reused refresh token session', 403);
            return;
        }
        // Generate new token pair (Refresh Token Rotation)
        const tokenPayload = { userId: user._id.toString(), email: user.email };
        const newAccessToken = (0, token_js_1.generateAccessToken)(tokenPayload);
        const newRefreshToken = (0, token_js_1.generateRefreshToken)(tokenPayload);
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
        (0, response_js_1.sendSuccess)(res, {
            accessToken: newAccessToken,
        }, 'Token refreshed successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.refreshToken = refreshToken;
/**
 * User Logout
 */
const logout = async (req, res, next) => {
    try {
        let userId = req.user?.userId;
        if (!userId) {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const candidate = authHeader.split(' ')[1]?.trim();
                if (candidate && candidate !== 'null' && candidate !== 'undefined') {
                    try {
                        const decoded = (0, token_js_1.verifyAccessToken)(candidate);
                        userId = decoded.userId;
                    }
                    catch {
                        // Token might be expired, check refresh token
                    }
                }
            }
        }
        if (!userId) {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            if (token) {
                try {
                    const decodedRefresh = (0, token_js_1.verifyRefreshToken)(token);
                    userId = decodedRefresh.userId;
                }
                catch {
                    // Ignore invalid refresh token during logout
                }
            }
        }
        if (userId) {
            await User_js_1.User.findByIdAndUpdate(userId, { refreshTokenHash: null });
        }
        res.clearCookie('accessToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/api/auth' });
        (0, response_js_1.sendSuccess)(res, null, 'Logged out successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.logout = logout;
/**
 * Get Authenticated User Details
 */
const getMe = async (req, res, next) => {
    try {
        const user = await User_js_1.User.findById(req.user?.userId);
        if (!user) {
            (0, response_js_1.sendError)(res, 'User not found', 404);
            return;
        }
        const profile = await Profile_js_1.Profile.findOne({ userId: user._id });
        const sleepSchedule = await SleepSchedule_js_1.SleepSchedule.findOne({ userId: user._id });
        const requiresLegalConsent = (0, exports.checkConsentRequired)(user);
        (0, response_js_1.sendSuccess)(res, {
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
        }, 'User details fetched');
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
/**
 * Record Legal Consent for authenticated user
 */
const recordLegalConsent = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const { acceptedTerms } = req.body;
        if (!userId) {
            (0, response_js_1.sendError)(res, 'Authentication required', 401);
            return;
        }
        if (!acceptedTerms) {
            (0, response_js_1.sendError)(res, 'Please accept the Terms & Conditions and Privacy Policy to continue.', 400, { code: 'LEGAL_CONSENT_REQUIRED' });
            return;
        }
        const user = await User_js_1.User.findById(userId);
        if (!user) {
            (0, response_js_1.sendError)(res, 'User not found', 404);
            return;
        }
        user.legalConsent = {
            termsAcceptedAt: new Date(),
            termsVersion: legal_js_1.TERMS_VERSION,
            privacyAcceptedAt: new Date(),
            privacyVersion: legal_js_1.PRIVACY_VERSION,
        };
        await user.save();
        (0, response_js_1.sendSuccess)(res, {
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
        }, 'Legal consent recorded successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.recordLegalConsent = recordLegalConsent;
