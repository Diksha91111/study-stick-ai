"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProvider = void 0;
const nodemailer = __importStar(require("nodemailer"));
const env_js_1 = require("../../config/env.js");
class EmailProvider {
    channelName = 'email';
    transporter = null;
    constructor() {
        this.initTransporter();
    }
    initTransporter() {
        if (process.env.NODE_ENV === 'test_runner') {
            this.transporter = null;
            return;
        }
        const cleanUser = (env_js_1.ENV.SMTP_USER || '').trim();
        const cleanPassword = (env_js_1.ENV.SMTP_PASSWORD || '').replace(/\s+/g, '').trim();
        if (env_js_1.ENV.SMTP_HOST && cleanUser && cleanPassword) {
            const isGmail = env_js_1.ENV.SMTP_HOST.toLowerCase().includes('gmail');
            const port = env_js_1.ENV.SMTP_PORT || (isGmail ? 465 : 587);
            const isSecure = port === 465;
            this.transporter = nodemailer.createTransport({
                host: env_js_1.ENV.SMTP_HOST.trim(),
                port: port,
                secure: isSecure,
                auth: {
                    user: cleanUser,
                    pass: cleanPassword,
                },
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 20000,
            });
        }
        else {
            this.transporter = null;
        }
    }
    /**
     * Send notification email
     */
    async send(recipient, payload) {
        if (!recipient.email) {
            return {
                success: false,
                status: 'FAILED',
                error: 'Recipient email address is missing',
            };
        }
        const actionUrl = payload.actionUrl?.startsWith('http')
            ? payload.actionUrl
            : `${env_js_1.ENV.FRONTEND_URL}${payload.actionUrl || '/planner'}`;
        const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${payload.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 32px 16px; color: #f8fafc; }
          .container { max-width: 580px; margin: 0 auto; background: #131d31; border-radius: 24px; padding: 36px; border: 1px solid #1e293b; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
          .header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
          .logo-badge { width: 44px; height: 44px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; color: #ffffff; }
          .brand-title { font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; }
          .category-tag { display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 12px; border-radius: 9999px; background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); margin-bottom: 16px; }
          h1 { font-size: 22px; font-weight: 800; margin: 0 0 14px 0; color: #f1f5f9; line-height: 1.3; }
          p { font-size: 15px; line-height: 1.6; color: #94a3b8; margin: 0 0 24px 0; }
          .highlight-card { background: #0b1120; border-radius: 16px; border: 1px solid #1e293b; padding: 20px; margin-bottom: 28px; }
          .highlight-text { font-size: 14px; color: #cbd5e1; font-weight: 500; margin: 0; }
          .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 14px 28px; border-radius: 14px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35); text-align: center; }
          .footer { margin-top: 36px; padding-top: 24px; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }
          .slogan { font-weight: 600; color: #818cf8; letter-spacing: 0.04em; margin-bottom: 8px; }
          .opt-out { font-size: 11px; color: #475569; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-badge">⚡</div>
            <div class="brand-title">Study Stick AI</div>
          </div>
          
          <div class="category-tag">${(payload.category || 'reminder').replace('_', ' ')}</div>
          
          <h1>${payload.title}</h1>
          <p>Hi <strong>${recipient.name || 'Student'}</strong>,</p>
          
          <div class="highlight-card">
            <p class="highlight-text">${payload.message}</p>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${actionUrl}" class="btn" target="_blank">${payload.actionLabel || 'Open Study Stick AI'}</a>
          </div>

          <div class="footer">
            <div class="slogan">Plan. Learn. Practice. Analyze. Adapt. Improve.</div>
            <div>Study Stick AI • Your Unified Academic & Competitive Exam System</div>
            <div class="opt-out">
              Manage your preferences anytime in <a href="${env_js_1.ENV.FRONTEND_URL}/profile" style="color: #6366f1; text-decoration: underline;">Notification Settings</a>.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
        // Fallback in non-production or missing transporter
        if (!this.transporter) {
            if (env_js_1.ENV.NODE_ENV !== 'production' || process.env.NODE_ENV === 'test_runner') {
                console.log('\n==================================================');
                console.log('✉️  [SIMULATED EMAIL NOTIFICATION - DEVELOPMENT ONLY]');
                console.log(`To: ${recipient.email}`);
                console.log(`Title: ${payload.title}`);
                console.log(`Message: ${payload.message}`);
                console.log(`Action: ${actionUrl}`);
                console.log('==================================================\n');
                return {
                    success: true,
                    status: 'SENT',
                    isSimulated: true,
                    messageId: `sim_email_${Date.now()}`,
                };
            }
            else {
                return {
                    success: false,
                    status: 'FAILED',
                    error: 'SMTP service is not configured on server.',
                };
            }
        }
        try {
            const info = await this.transporter.sendMail({
                from: env_js_1.ENV.MAIL_FROM,
                to: recipient.email,
                subject: `[Study Stick AI] ${payload.title}`,
                html: htmlContent,
            });
            return {
                success: true,
                status: 'SENT',
                messageId: info.messageId,
            };
        }
        catch (error) {
            console.error('[EmailProvider] Failed to send email via Nodemailer:', error.message);
            if (env_js_1.ENV.NODE_ENV !== 'production' || process.env.NODE_ENV === 'test_runner') {
                console.log('\n==================================================');
                console.log('✉️  [DEVELOPMENT SMTP FALLBACK - SIMULATED NOTIFICATION - NOT DELIVERED]');
                console.log(`To: ${recipient.email}`);
                console.log(`Title: ${payload.title}`);
                console.log(`Reason: SMTP authentication / delivery error (${error.message})`);
                console.log('Notice: Email was NOT delivered to the user inbox.');
                console.log('==================================================\n');
                return {
                    success: false,
                    status: 'FAILED',
                    isSimulated: true,
                    error: error.message || 'SMTP delivery failure',
                };
            }
            return {
                success: false,
                status: 'FAILED',
                error: error.message || 'Unknown email delivery error',
            };
        }
    }
}
exports.EmailProvider = EmailProvider;
