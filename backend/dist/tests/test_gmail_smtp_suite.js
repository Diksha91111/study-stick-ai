"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const emailService_js_1 = require("../services/emailService.js");
const EmailProvider_js_1 = require("../services/notifications/EmailProvider.js");
const env_js_1 = require("../config/env.js");
async function runGmailSmtpSuite() {
    console.log('==================================================');
    console.log('🧪 Study Stick AI - Gmail SMTP Validation Suite');
    console.log('==================================================');
    console.log(`[Config Check]`);
    console.log(`SMTP_HOST: ${env_js_1.ENV.SMTP_HOST || '(unset)'}`);
    console.log(`SMTP_PORT: ${env_js_1.ENV.SMTP_PORT || '(unset)'}`);
    console.log(`SMTP_USER: ${emailService_js_1.emailService.getSanitizedUser()}`);
    console.log(`SMTP_PASSWORD: [${env_js_1.ENV.SMTP_PASSWORD
        ? 'CONFIGURED (' + env_js_1.ENV.SMTP_PASSWORD.replace(/\s+/g, '').length + ' chars)'
        : 'NOT SET'}]`);
    console.log(`MAIL_FROM: ${env_js_1.ENV.MAIL_FROM || '(unset)'}`);
    console.log('\n--- Step 1: Transporter Verification ---');
    emailService_js_1.emailService.initTransporter();
    const verifyResult = await emailService_js_1.emailService.verifyConnection();
    console.log(`Verify Result: ${verifyResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
    console.log(`Detail: ${verifyResult.message}`);
    if (verifyResult.code) {
        console.log(`Error Code: ${verifyResult.code}`);
    }
    const targetEmail = process.argv[2] || env_js_1.ENV.SMTP_USER || 'test@studystick.ai';
    console.log(`\nTarget recipient for email tests: ${targetEmail}`);
    console.log('\n--- Step 2: Registration OTP Email Delivery ---');
    const dummyOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const regResult = await emailService_js_1.emailService.sendVerificationEmail(targetEmail, 'Test Student', dummyOtp);
    console.log(`Registration OTP Result:`, {
        delivered: regResult.delivered,
        isSimulated: !!regResult.isSimulated,
        messageId: regResult.messageId || null,
        error: regResult.error || null,
        errorCode: regResult.errorCode || null,
    });
    console.log('\n--- Step 3: Resend OTP Email Delivery ---');
    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const resendResult = await emailService_js_1.emailService.sendVerificationEmail(targetEmail, 'Test Student', freshOtp);
    console.log(`Resend OTP Result:`, {
        delivered: resendResult.delivered,
        isSimulated: !!resendResult.isSimulated,
        messageId: resendResult.messageId || null,
        error: resendResult.error || null,
        errorCode: resendResult.errorCode || null,
    });
    console.log('\n--- Step 4: Notification Email Delivery ---');
    const emailProvider = new EmailProvider_js_1.EmailProvider();
    const notifyResult = await emailProvider.send({ userId: 'test_user_id', email: targetEmail, name: 'Test Student' }, {
        title: 'Upcoming GATE CS Revision Session',
        message: 'Your scheduled study session for Algorithms & Data Structures begins in 30 minutes. Be ready!',
        category: 'study_sessions',
        type: 'study_session',
        actionUrl: '/planner',
        actionLabel: 'View Schedule',
    });
    console.log(`Notification Email Result:`, {
        status: notifyResult.status,
        isSimulated: !!notifyResult.isSimulated,
        messageId: notifyResult.messageId || null,
        error: notifyResult.error || null,
    });
    console.log('\n==================================================');
    console.log('📊 Summary:');
    console.log(`SMTP Connection:     ${verifyResult.success ? 'CONNECTED ✅' : 'FAILED ❌'}`);
    console.log(`Registration OTP:    ${regResult.delivered
        ? 'DELIVERED TO INBOX ✅'
        : regResult.isSimulated
            ? 'SIMULATED (NOT DELIVERED) ⚠️'
            : 'FAILED ❌'}`);
    console.log(`Resend OTP:          ${resendResult.delivered
        ? 'DELIVERED TO INBOX ✅'
        : resendResult.isSimulated
            ? 'SIMULATED (NOT DELIVERED) ⚠️'
            : 'FAILED ❌'}`);
    console.log(`Notification Email:  ${notifyResult.status === 'SENT' && !notifyResult.isSimulated
        ? 'DELIVERED TO INBOX ✅'
        : notifyResult.isSimulated
            ? 'SIMULATED (NOT DELIVERED) ⚠️'
            : 'FAILED ❌'}`);
    console.log('==================================================\n');
}
runGmailSmtpSuite().catch((err) => {
    console.error('Fatal error running suite:', err.message);
    process.exit(1);
});
