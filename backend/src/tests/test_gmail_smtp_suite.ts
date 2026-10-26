import { emailService } from '../services/emailService.js';
import { EmailProvider } from '../services/notifications/EmailProvider.js';
import { ENV } from '../config/env.js';

async function runGmailSmtpSuite() {
  console.log('==================================================');
  console.log('🧪 Study Stick AI - Gmail SMTP Validation Suite');
  console.log('==================================================');

  console.log(`[Config Check]`);
  console.log(`SMTP_HOST: ${ENV.SMTP_HOST || '(unset)'}`);
  console.log(`SMTP_PORT: ${ENV.SMTP_PORT || '(unset)'}`);
  console.log(`SMTP_USER: ${emailService.getSanitizedUser()}`);
  console.log(
    `SMTP_PASSWORD: [${
      ENV.SMTP_PASSWORD
        ? 'CONFIGURED (' + ENV.SMTP_PASSWORD.replace(/\s+/g, '').length + ' chars)'
        : 'NOT SET'
    }]`
  );
  console.log(`MAIL_FROM: ${ENV.MAIL_FROM || '(unset)'}`);

  console.log('\n--- Step 1: Transporter Verification ---');
  emailService.initTransporter();
  const verifyResult = await emailService.verifyConnection();
  console.log(`Verify Result: ${verifyResult.success ? 'PASSED ✅' : 'FAILED ❌'}`);
  console.log(`Detail: ${verifyResult.message}`);
  if (verifyResult.code) {
    console.log(`Error Code: ${verifyResult.code}`);
  }

  const targetEmail = process.argv[2] || ENV.SMTP_USER || 'test@studystick.ai';
  console.log(`\nTarget recipient for email tests: ${targetEmail}`);

  console.log('\n--- Step 2: Registration OTP Email Delivery ---');
  const dummyOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const regResult = await emailService.sendVerificationEmail(
    targetEmail,
    'Test Student',
    dummyOtp
  );
  console.log(`Registration OTP Result:`, {
    delivered: regResult.delivered,
    isSimulated: !!regResult.isSimulated,
    messageId: regResult.messageId || null,
    error: regResult.error || null,
    errorCode: regResult.errorCode || null,
  });

  console.log('\n--- Step 3: Resend OTP Email Delivery ---');
  const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const resendResult = await emailService.sendVerificationEmail(
    targetEmail,
    'Test Student',
    freshOtp
  );
  console.log(`Resend OTP Result:`, {
    delivered: resendResult.delivered,
    isSimulated: !!resendResult.isSimulated,
    messageId: resendResult.messageId || null,
    error: resendResult.error || null,
    errorCode: resendResult.errorCode || null,
  });

  console.log('\n--- Step 4: Notification Email Delivery ---');
  const emailProvider = new EmailProvider();
  const notifyResult = await emailProvider.send(
    { userId: 'test_user_id', email: targetEmail, name: 'Test Student' },
    {
      title: 'Upcoming GATE CS Revision Session',
      message: 'Your scheduled study session for Algorithms & Data Structures begins in 30 minutes. Be ready!',
      category: 'study_sessions',
      type: 'study_session',
      actionUrl: '/planner',
      actionLabel: 'View Schedule',
    }
  );
  console.log(`Notification Email Result:`, {
    status: notifyResult.status,
    isSimulated: !!notifyResult.isSimulated,
    messageId: notifyResult.messageId || null,
    error: notifyResult.error || null,
  });

  console.log('\n==================================================');
  console.log('📊 Summary:');
  console.log(`SMTP Connection:     ${verifyResult.success ? 'CONNECTED ✅' : 'FAILED ❌'}`);
  console.log(
    `Registration OTP:    ${
      regResult.delivered
        ? 'DELIVERED TO INBOX ✅'
        : regResult.isSimulated
        ? 'SIMULATED (NOT DELIVERED) ⚠️'
        : 'FAILED ❌'
    }`
  );
  console.log(
    `Resend OTP:          ${
      resendResult.delivered
        ? 'DELIVERED TO INBOX ✅'
        : resendResult.isSimulated
        ? 'SIMULATED (NOT DELIVERED) ⚠️'
        : 'FAILED ❌'
    }`
  );
  console.log(
    `Notification Email:  ${
      notifyResult.status === 'SENT' && !notifyResult.isSimulated
        ? 'DELIVERED TO INBOX ✅'
        : notifyResult.isSimulated
        ? 'SIMULATED (NOT DELIVERED) ⚠️'
        : 'FAILED ❌'
    }`
  );
  console.log('==================================================\n');
}

runGmailSmtpSuite().catch((err) => {
  console.error('Fatal error running suite:', err.message);
  process.exit(1);
});
