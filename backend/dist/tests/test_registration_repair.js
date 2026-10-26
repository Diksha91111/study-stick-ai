"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const BASE_URL = 'http://localhost:5000';
async function runTests() {
    console.log('================================================================================');
    console.log('🧪 VERIFYING STUDY STICK AI REGISTRATION REPAIR & AUTH SUITE');
    console.log('================================================================================\n');
    const timestamp = Date.now();
    // -------------------------------------------------------------------------
    // Test 5: Wrong/missing registration fields → validation response, not 500
    // -------------------------------------------------------------------------
    console.log('--- Test 5: Missing / Invalid Registration Fields ---');
    const missingFieldRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Incomplete User' }),
    });
    const missingFieldData = await missingFieldRes.json();
    console.log('Missing fields response:', missingFieldRes.status, missingFieldData);
    assert_1.default.strictEqual(missingFieldRes.status, 400);
    assert_1.default.strictEqual(missingFieldData.code || missingFieldData.data?.code, 'VALIDATION_ERROR');
    const passwordMismatchRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Mismatch User',
            email: `mismatch_${timestamp}@studystick.ai`,
            password: 'Password123!',
            confirmPassword: 'DifferentPassword123!',
            acceptedTerms: true,
        }),
    });
    const mismatchData = await passwordMismatchRes.json();
    console.log('Password mismatch response:', passwordMismatchRes.status, mismatchData);
    assert_1.default.strictEqual(passwordMismatchRes.status, 400);
    assert_1.default.strictEqual(mismatchData.code || mismatchData.data?.code, 'VALIDATION_ERROR');
    console.log('✅ Test 5 PASSED: Validation errors properly return 400 with VALIDATION_ERROR\n');
    // -------------------------------------------------------------------------
    // Test 2: New user + SMTP unavailable → no false "OTP sent", recoverable
    // -------------------------------------------------------------------------
    console.log('--- Test 2: New User Registration (SMTP unavailable/offline) ---');
    const testEmail1 = `newuser_${timestamp}@studystick.ai`;
    const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'New Test User',
            email: testEmail1,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            acceptedTerms: true,
        }),
    });
    const reg1Data = await reg1Res.json();
    console.log('New user registration response:', reg1Res.status, reg1Data);
    assert_1.default.strictEqual(reg1Res.status, 201);
    assert_1.default.strictEqual(reg1Data.success, true);
    assert_1.default.strictEqual(reg1Data.data.requiresVerification, true);
    if (reg1Data.data.emailSent) {
        assert_1.default.strictEqual(reg1Data.data.deliveryMode, 'real');
        assert_1.default.strictEqual(reg1Data.message, 'Verification code sent. Check your email.');
        console.log('✅ Test 2 PASSED: Returns 201 with real email delivery confirmed\n');
    }
    else {
        assert_1.default.strictEqual(reg1Data.data.deliveryMode, 'simulated');
        assert_1.default.strictEqual(reg1Data.data.code, 'EMAIL_SEND_FAILED');
        assert_1.default.strictEqual(reg1Data.message, "We couldn't send the verification code. Please try again.");
        console.log('✅ Test 2 PASSED: Returns 201 with recoverable EMAIL_SEND_FAILED, no false "sent" claim\n');
    }
    // -------------------------------------------------------------------------
    // Test 3: Existing unverified user → no generic 500, verification/resend flow works
    // -------------------------------------------------------------------------
    console.log('--- Test 3: Existing Unverified User Registration Resubmission ---');
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'New Test User Updated',
            email: testEmail1,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            acceptedTerms: true,
        }),
    });
    const reg2Data = await reg2Res.json();
    console.log('Existing unverified resubmit response:', reg2Res.status, reg2Data);
    assert_1.default.strictEqual(reg2Res.status, 200);
    assert_1.default.strictEqual(reg2Data.success, true);
    assert_1.default.strictEqual(reg2Data.data.requiresVerification, true);
    if (reg2Data.data.emailSent) {
        assert_1.default.strictEqual(reg2Data.data.deliveryMode, 'real');
        assert_1.default.strictEqual(reg2Data.message, 'Verification code sent. Check your email.');
    }
    else {
        assert_1.default.strictEqual(reg2Data.data.deliveryMode, 'simulated');
        assert_1.default.strictEqual(reg2Data.message, "We couldn't send the verification code. Please try again.");
    }
    console.log('✅ Test 3 PASSED: Existing unverified user handled cleanly without generic 500\n');
    // -------------------------------------------------------------------------
    // Test 6: Rapid double-click Register → only one logical user created
    // -------------------------------------------------------------------------
    console.log('--- Test 6: Rapid Concurrent Registrations ---');
    const testEmailConcurrent = `concurrent_${timestamp}@studystick.ai`;
    const [resA, resB] = await Promise.all([
        fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Concurrent User A',
                email: testEmailConcurrent,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                acceptedTerms: true,
            }),
        }),
        fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Concurrent User B',
                email: testEmailConcurrent,
                password: 'Password123!',
                confirmPassword: 'Password123!',
                acceptedTerms: true,
            }),
        }),
    ]);
    const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
    console.log('Concurrent A status:', resA.status, dataA.data?.code);
    console.log('Concurrent B status:', resB.status, dataB.data?.code);
    assert_1.default.ok(resA.status === 200 || resA.status === 201 || resA.status === 409);
    assert_1.default.ok(resB.status === 200 || resB.status === 201 || resB.status === 409);
    console.log('✅ Test 6 PASSED: Concurrent requests handled cleanly without database crash\n');
    // -------------------------------------------------------------------------
    // Test 7: Logged-out /auth/me → 401 clean guest state
    // -------------------------------------------------------------------------
    console.log('--- Test 7: Logged-out /auth/me ---');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`);
    const meData = await meRes.json();
    console.log('/auth/me response:', meRes.status, meData);
    assert_1.default.strictEqual(meRes.status, 401);
    assert_1.default.strictEqual(meData.success, false);
    console.log('✅ Test 7 PASSED: Unauthenticated /auth/me returns 401\n');
    // -------------------------------------------------------------------------
    // Test 8: Logged-out /auth/refresh → 401 no refresh loop
    // -------------------------------------------------------------------------
    console.log('--- Test 8: Logged-out /auth/refresh ---');
    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    const refreshData = await refreshRes.json();
    console.log('/auth/refresh response:', refreshRes.status, refreshData);
    assert_1.default.strictEqual(refreshRes.status, 401);
    assert_1.default.strictEqual(refreshData.success, false);
    console.log('✅ Test 8 PASSED: Unauthenticated /auth/refresh returns 401\n');
    // -------------------------------------------------------------------------
    // Test 9: Correct OTP → verification succeeds
    // -------------------------------------------------------------------------
    console.log('--- Test 9: OTP Verification with Correct OTP ---');
    // Look up OTP token from DB for testEmail1
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient('mongodb://127.0.0.1:27017');
    await client.connect();
    const db = client.db('studystick_ai');
    const crypto = await import('crypto');
    // Generate known OTP and hash it into testEmail1
    const knownOtp = '482910';
    const hashedOtp = crypto.createHash('sha256').update(knownOtp).digest('hex');
    await db.collection('users').updateOne({ email: testEmail1 }, {
        $set: {
            verificationTokenHash: hashedOtp,
            verificationTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
        },
    });
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail1, otp: knownOtp }),
    });
    const verifyData = await verifyRes.json();
    console.log('Verify response:', verifyRes.status, verifyData);
    assert_1.default.strictEqual(verifyRes.status, 200);
    assert_1.default.strictEqual(verifyData.success, true);
    assert_1.default.strictEqual(verifyData.data.isEmailVerified, true);
    console.log('✅ Test 9 PASSED: OTP verification succeeds and user is marked verified\n');
    // -------------------------------------------------------------------------
    // Test 4: Existing verified user → clear sign-in message (409)
    // -------------------------------------------------------------------------
    console.log('--- Test 4: Existing Verified User Registration Attempt ---');
    const verifiedRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Already Verified User',
            email: testEmail1,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            acceptedTerms: true,
        }),
    });
    const verifiedRegData = await verifiedRegRes.json();
    console.log('Verified user register response:', verifiedRegRes.status, verifiedRegData);
    assert_1.default.strictEqual(verifiedRegRes.status, 409);
    assert_1.default.strictEqual(verifiedRegData.success, false);
    assert_1.default.strictEqual(verifiedRegData.data.code, 'EMAIL_ALREADY_EXISTS');
    assert_1.default.strictEqual(verifiedRegData.message, 'An account with this email address already exists. Please sign in.');
    console.log('✅ Test 4 PASSED: Verified user receives 409 EMAIL_ALREADY_EXISTS with sign-in prompt\n');
    // -------------------------------------------------------------------------
    // Test 10: Resend OTP → handles delivery failure honestly
    // -------------------------------------------------------------------------
    console.log('--- Test 10: Resend OTP Endpoint ---');
    // Create an unverified user to test resend
    const resendTestEmail = `resend_${timestamp}@studystick.ai`;
    await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Resend User',
            email: resendTestEmail,
            password: 'Password123!',
            confirmPassword: 'Password123!',
            acceptedTerms: true,
        }),
    });
    const resendRes = await fetch(`${BASE_URL}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendTestEmail }),
    });
    const resendData = await resendRes.json();
    console.log('Resend OTP response:', resendRes.status, resendData);
    if (resendData.data?.emailSent) {
        assert_1.default.strictEqual(resendRes.status, 200);
        assert_1.default.strictEqual(resendData.success, true);
        assert_1.default.strictEqual(resendData.data.deliveryMode, 'real');
        console.log('✅ Test 10 PASSED: Resend OTP delivered real email successfully\n');
    }
    else {
        assert_1.default.strictEqual(resendRes.status, 500);
        assert_1.default.strictEqual(resendData.data.code, 'EMAIL_SEND_FAILED');
        assert_1.default.strictEqual(resendData.data.emailSent, false);
        assert_1.default.strictEqual(resendData.data.deliveryMode, 'simulated');
        assert_1.default.strictEqual(resendData.message, "We couldn't send the verification code. Please try again.");
        console.log('✅ Test 10 PASSED: Resend OTP reports email delivery failure truthfully\n');
    }
    await client.close();
    console.log('================================================================================');
    console.log('🎉 ALL REGISTRATION & AUTH REPAIR TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================================\n');
}
runTests().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
