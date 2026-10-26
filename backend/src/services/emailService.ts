import * as nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

export interface EmailSendResult {
  success: boolean;
  delivered: boolean;
  emailSent: boolean;
  deliveryMode: 'real' | 'simulated' | 'failed';
  isSimulated?: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  /**
   * Initialize SMTP Transporter with sanitized credentials
   */
  public initTransporter() {
    if (process.env.NODE_ENV === 'test_runner') {
      this.transporter = null;
      return;
    }

    const cleanUser = (ENV.SMTP_USER || '').trim();
    const cleanPassword = (ENV.SMTP_PASSWORD || '').replace(/\s+/g, '').trim();

    if (ENV.SMTP_HOST && cleanUser && cleanPassword) {
      const isGmail = ENV.SMTP_HOST.toLowerCase().includes('gmail');
      const port = ENV.SMTP_PORT || (isGmail ? 465 : 587);
      const secure = port === 465;

      this.transporter = nodemailer.createTransport({
        host: ENV.SMTP_HOST,
        port,
        secure,
        auth: {
          user: cleanUser,
          pass: cleanPassword,
        },
        tls: {
          rejectUnauthorized: true,
        },
      });

      // Transporter verification in development with sanitized logging
      if (ENV.NODE_ENV === 'development') {
        this.verifyConnection()
          .then((res) => {
            if (res.success) {
              console.log(
                `[Email] SMTP connection verified (Host: ${ENV.SMTP_HOST}, User: <${this.getSanitizedUser()}>)`
              );
            } else if (res.code === 'EAUTH' || res.code === '535') {
              console.warn(
                `[Email] SMTP authentication failed: EAUTH 535 - Username and Password not accepted for <${this.getSanitizedUser()}>`
              );
            } else {
              console.warn(
                `[Email] SMTP connection verification failed for <${this.getSanitizedUser()}>: ${res.message}`
              );
            }
          })
          .catch(() => {});
      }
    } else {
      this.transporter = null;
    }
  }

  /**
   * Helper to return masked email for logging (e.g. di***@gmail.com)
   * Never prints passwords or tokens
   */
  public getSanitizedUser(): string {
    if (!ENV.SMTP_USER) return '(not configured)';
    const parts = ENV.SMTP_USER.split('@');
    if (parts.length < 2) return '***';
    const name = parts[0];
    const masked = name.length > 2 ? `${name.substring(0, 2)}***` : `${name}***`;
    return `${masked}@${parts[1]}`;
  }

  /**
   * Verify SMTP connection status
   */
  async verifyConnection(): Promise<{ success: boolean; message: string; code?: string }> {
    if (!this.transporter) {
      return {
        success: false,
        message: 'SMTP Transporter is not initialized (missing SMTP_HOST, SMTP_USER, or SMTP_PASSWORD in .env)',
      };
    }
    try {
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection verified successfully!' };
    } catch (error: any) {
      const isAuthError = error.code === 'EAUTH' || error.responseCode === 535;
      const detail = isAuthError
        ? 'Gmail SMTP authentication failed (535 Bad Credentials). Ensure 2-Step Verification is active and a 16-character App Password without spaces is configured in SMTP_PASSWORD.'
        : error.message;

      return {
        success: false,
        message: `SMTP connection failed: ${detail}`,
        code: error.code || String(error.responseCode),
      };
    }
  }

  /**
   * Send Account Verification Email (OTP & Link)
   */
  async sendVerificationEmail(
    toEmail: string,
    name: string,
    token: string
  ): Promise<EmailSendResult> {
    const verificationUrl = `${ENV.FRONTEND_URL}/verify-email?email=${encodeURIComponent(toEmail)}&token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px; color: #f8fafc; }
          .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 24px; padding: 40px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .logo-badge { width: 48px; h: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 24px; }
          h1 { font-size: 24px; font-weight: 800; margin: 0 0 12px 0; color: #ffffff; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0; }
          .otp-box { text-align: center; margin: 24px 0; background: #0f172a; padding: 20px; border-radius: 16px; border: 1px solid #334155; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #818cf8; font-family: monospace; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
          .url-box { background: #0f172a; padding: 12px; border-radius: 10px; font-size: 11px; word-break: break-all; color: #818cf8; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-badge">⚡</div>
          <h1>Verify your Study Stick AI account</h1>
          <p>Hi <strong>${name}</strong>,</p>
          <p>Welcome to <strong>Study Stick AI</strong>! Please verify your email address to activate your student account:</p>
          
          <div class="otp-box">
            <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 8px;">Your Verification Code</div>
            <div class="otp-code">${token}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for 15 minutes</div>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${verificationUrl}" class="btn" target="_blank">Verify Email Instantly</a>
          </div>
          <p>If you did not create this account, you can safely ignore this email.</p>
          <div class="url-box">
            Or copy & paste this URL into your browser: <br>${verificationUrl}
          </div>
          <div class="footer">
            Study Stick AI • Unified Academic & Competitive Exam Planner
          </div>
        </div>
      </body>
      </html>
    `;

    // 1. Uninitialized transporter handling
    if (!this.transporter) {
      if (ENV.NODE_ENV === 'development' || process.env.NODE_ENV === 'test_runner') {
        console.log('\n==================================================');
        console.log('✉️  [DEVELOPMENT SMTP FALLBACK - SIMULATED EMAIL - NOT DELIVERED]');
        console.log(`To: ${toEmail}`);
        console.log(`Name: ${name}`);
        console.log('Notice: SMTP is unconfigured. Real email was NOT delivered to inbox.');
        console.log('==================================================\n');
        return {
          success: false,
          delivered: false,
          emailSent: false,
          deliveryMode: 'simulated',
          isSimulated: true,
          error: 'SMTP service is not configured on server.',
        };
      } else {
        throw new Error('SMTP service is not configured on server.');
      }
    }

    // 2. Transporter send execution
    try {
      const info = await this.transporter.sendMail({
        from: ENV.MAIL_FROM,
        to: toEmail,
        subject: 'Verify your Study Stick AI account',
        html: htmlContent,
      });

      return {
        success: true,
        delivered: true,
        emailSent: true,
        deliveryMode: 'real',
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error(
        `[Email] Failed to send verification email to <${toEmail}> via SMTP:`,
        error.message
      );

      // In development mode, provide sanitized simulated link for offline testing,
      // but NEVER claim that the email was actually delivered
      if (ENV.NODE_ENV === 'development' || process.env.NODE_ENV === 'test_runner') {
        console.log('\n==================================================');
        console.log('✉️  [DEVELOPMENT SMTP FALLBACK - SIMULATED EMAIL - NOT DELIVERED]');
        console.log(`To: ${toEmail}`);
        console.log(`Reason: SMTP authentication error (${error.message})`);
        console.log('Notice: Real email was NOT delivered to the user inbox.');
        console.log('==================================================\n');
        return {
          success: false,
          delivered: false,
          emailSent: false,
          deliveryMode: 'simulated',
          isSimulated: true,
          error: `SMTP delivery failed: ${error.message}`,
          errorCode: error.code || String(error.responseCode),
        };
      }

      // In production, never expose fallback links or tokens
      throw error;
    }
  }

  /**
   * Send Password Reset Email
   */
  async sendPasswordResetEmail(
    toEmail: string,
    name: string,
    token: string
  ): Promise<EmailSendResult> {
    const resetUrl = `${ENV.FRONTEND_URL}/reset-password?token=${token}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; margin: 0; padding: 40px 20px; color: #f8fafc; }
          .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 24px; padding: 40px; border: 1px solid #334155; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); }
          .logo-badge { width: 48px; h: 48px; background: linear-gradient(135deg, #e11d48, #be123c); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 24px; }
          h1 { font-size: 24px; font-weight: 800; margin: 0 0 12px 0; color: #ffffff; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); }
          .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #334155; font-size: 12px; color: #64748b; text-align: center; }
          .url-box { background: #0f172a; padding: 12px; border-radius: 10px; font-size: 11px; word-break: break-all; color: #818cf8; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-badge">🔒</div>
          <h1>Reset your Study Stick AI password</h1>
          <p>Hi <strong>${name}</strong>,</p>
          <p>We received a request to reset the password for your Study Stick AI account. Click the button below to set up a new secure password.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
          </div>
          <p>This password reset link is valid for <strong>1 hour</strong>. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          <div class="url-box">
            Or copy & paste this URL into your browser: <br>${resetUrl}
          </div>
          <div class="footer">
            Study Stick AI • Unified Academic & Competitive Exam Planner
          </div>
        </div>
      </body>
      </html>
    `;

    if (!this.transporter) {
      if (ENV.NODE_ENV === 'development' || process.env.NODE_ENV === 'test_runner') {
        console.log('\n==================================================');
        console.log('✉️  [DEVELOPMENT SMTP FALLBACK - SIMULATED EMAIL - NOT DELIVERED]');
        console.log(`To: ${toEmail}`);
        console.log(`Name: ${name}`);
        console.log('Notice: SMTP is unconfigured. Real email was NOT delivered to inbox.');
        console.log('==================================================\n');
        return {
          success: false,
          delivered: false,
          emailSent: false,
          deliveryMode: 'simulated',
          isSimulated: true,
          error: 'SMTP service is not configured on server.',
        };
      } else {
        throw new Error('SMTP service is not configured on server.');
      }
    }

    try {
      const info = await this.transporter.sendMail({
        from: ENV.MAIL_FROM,
        to: toEmail,
        subject: 'Reset your Study Stick AI password',
        html: htmlContent,
      });

      return {
        success: true,
        delivered: true,
        emailSent: true,
        deliveryMode: 'real',
        messageId: info.messageId,
      };
    } catch (error: any) {
      console.error(
        `[Email] Failed to send password reset email to <${toEmail}> via SMTP:`,
        error.message
      );

      if (ENV.NODE_ENV === 'development' || process.env.NODE_ENV === 'test_runner') {
        console.log('\n==================================================');
        console.log('✉️  [DEVELOPMENT SMTP FALLBACK - SIMULATED EMAIL - NOT DELIVERED]');
        console.log(`To: ${toEmail}`);
        console.log(`Reason: SMTP authentication error (${error.message})`);
        console.log('Notice: Real email was NOT delivered to the user inbox.');
        console.log('==================================================\n');
        return {
          success: false,
          delivered: false,
          emailSent: false,
          deliveryMode: 'simulated',
          isSimulated: true,
          error: `SMTP delivery failed: ${error.message}`,
          errorCode: error.code || String(error.responseCode),
        };
      }

      throw error;
    }
  }
}

export const emailService = new EmailService();
