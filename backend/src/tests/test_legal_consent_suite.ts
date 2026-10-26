import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User';
import { TERMS_VERSION, PRIVACY_VERSION } from '../config/legal';

const BASE_URL = 'http://localhost:5000';

async function runLegalConsentSuite() {
  console.log('================================================================================');
  console.log('⚖️  RUNNING TERMS & CONDITIONS + PRIVACY POLICY ACCEPTANCE TEST SUITE');
  console.log('================================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studystick';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for direct document verification.\n');

  const timestamp = Date.now();
  const testEmail1 = `legal_test_${timestamp}@studystick.ai`;
  const legacyEmail = `legacy_user_${timestamp}@studystick.ai`;

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Registration rejected when acceptedTerms is missing or false
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Registration Blocked Without Consent ---');
    const noConsentRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Consent Student',
        email: testEmail1,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        // acceptedTerms omitted
      }),
    });
    const noConsentData = await noConsentRes.json();
    console.log('No consent response status:', noConsentRes.status, noConsentData);
    assert.strictEqual(noConsentRes.status, 400, 'Expected status 400 when acceptedTerms is missing');
    assert.strictEqual(
      noConsentData.code || noConsentData.data?.code,
      'LEGAL_CONSENT_REQUIRED',
      'Expected LEGAL_CONSENT_REQUIRED code'
    );
    console.log('✅ TEST 1 PASSED: Registration blocked without explicit consent.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Registration accepted with acceptedTerms: true
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Registration Accepted With Consent & Stored in DB ---');
    const consentRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Consenting Student',
        email: testEmail1,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        acceptedTerms: true,
      }),
    });
    const consentData = await consentRes.json();
    console.log('Consent registration response:', consentRes.status, consentData);
    assert.strictEqual(consentRes.status, 201, 'Expected status 201 on valid registration');
    assert.strictEqual(consentData.success, true);

    // Verify in MongoDB
    const registeredUser = await User.findOne({ email: testEmail1 }).select('+password');
    assert(registeredUser, 'User must exist in MongoDB');
    assert(registeredUser.legalConsent, 'legalConsent object must be saved');
    assert(registeredUser.legalConsent.termsAcceptedAt instanceof Date, 'termsAcceptedAt must be Date');
    assert.strictEqual(registeredUser.legalConsent.termsVersion, TERMS_VERSION, `termsVersion must equal ${TERMS_VERSION}`);
    assert(registeredUser.legalConsent.privacyAcceptedAt instanceof Date, 'privacyAcceptedAt must be Date');
    assert.strictEqual(registeredUser.legalConsent.privacyVersion, PRIVACY_VERSION, `privacyVersion must equal ${PRIVACY_VERSION}`);

    // Verify security: No tokens, password, or OTP inside legalConsent
    const consentObj = (registeredUser.legalConsent as any).toObject ? (registeredUser.legalConsent as any).toObject() : registeredUser.legalConsent;
    assert.strictEqual(consentObj.password, undefined);
    assert.strictEqual(consentObj.token, undefined);
    assert.strictEqual(consentObj.otp, undefined);
    console.log('MongoDB legalConsent document:', registeredUser.legalConsent);
    console.log('✅ TEST 2 PASSED: MongoDB properly records consent metadata with version constants.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Verify OTP & Login for Consenting User
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: OTP Verification & Login (requiresLegalConsent: false) ---');
    const crypto = await import('crypto');
    const knownOtp = '654321';
    const hashedOtp = crypto.createHash('sha256').update(knownOtp).digest('hex');
    await User.updateOne(
      { email: testEmail1 },
      {
        $set: {
          verificationTokenHash: hashedOtp,
          verificationTokenExpires: new Date(Date.now() + 10 * 60 * 1000),
        },
      }
    );

    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail1, otp: knownOtp }),
    });
    const verifyData = await verifyRes.json();
    console.log('Email verification response:', verifyRes.status, verifyData);
    assert.strictEqual(verifyRes.status, 200, 'Email verification should succeed');

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail1, password: 'Password123!' }),
    });
    const loginData = await loginRes.json();
    console.log('Login response:', loginRes.status, {
      success: loginData.success,
      requiresLegalConsent: loginData.data?.requiresLegalConsent,
      legalConsent: loginData.data?.user?.legalConsent,
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginData.data.requiresLegalConsent, false, 'User with current versions does not require re-consent');
    console.log('✅ TEST 3 PASSED: Standard login works and requiresLegalConsent is false.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Backward Compatibility for Existing Users Without legalConsent
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Existing / Legacy User (no legalConsent document) ---');
    // Create a legacy user directly in DB without legalConsent
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    const legacyUserDoc = await User.create({
      name: 'Legacy Student',
      email: legacyEmail,
      password: hashedPassword,
      isEmailVerified: true,
      role: 'student',
      // legalConsent explicitly omitted to simulate pre-existing database record
    });
    assert(legacyUserDoc, 'Legacy user created in DB');

    const legacyLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: legacyEmail, password: 'Password123!' }),
    });
    const legacyLoginData = await legacyLoginRes.json();
    console.log('Legacy login response:', legacyLoginRes.status, {
      success: legacyLoginData.success,
      requiresLegalConsent: legacyLoginData.data?.requiresLegalConsent,
    });
    assert.strictEqual(legacyLoginRes.status, 200, 'Legacy user login must NOT fail');
    assert.strictEqual(legacyLoginData.data.requiresLegalConsent, true, 'Legacy user must require legal consent');
    const legacyToken = legacyLoginData.data.accessToken;

    // Check /auth/me for legacy user
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${legacyToken}` },
    });
    const meData = await meRes.json();
    console.log('Legacy /auth/me requiresLegalConsent:', meData.data?.requiresLegalConsent);
    assert.strictEqual(meData.data.requiresLegalConsent, true);
    console.log('✅ TEST 4 PASSED: Existing users without consent log in successfully and are flagged for consent.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Acceptance via POST /api/auth/legal-consent
    // -------------------------------------------------------------------------
    console.log('--- TEST 5: Existing User Submits Legal Consent ---');
    // 5a. Rejection when acceptedTerms is false
    const reconsentFailRes = await fetch(`${BASE_URL}/api/auth/legal-consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${legacyToken}`,
      },
      body: JSON.stringify({ acceptedTerms: false }),
    });
    assert.strictEqual(reconsentFailRes.status, 400);

    // 5b. Success when acceptedTerms is true
    const reconsentSuccessRes = await fetch(`${BASE_URL}/api/auth/legal-consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${legacyToken}`,
      },
      body: JSON.stringify({ acceptedTerms: true }),
    });
    const reconsentSuccessData = await reconsentSuccessRes.json();
    console.log('Re-consent response:', reconsentSuccessRes.status, reconsentSuccessData);
    assert.strictEqual(reconsentSuccessRes.status, 200);
    assert.strictEqual(reconsentSuccessData.data.requiresLegalConsent, false);
    assert.strictEqual(reconsentSuccessData.data.user.legalConsent.termsVersion, TERMS_VERSION);
    assert.strictEqual(reconsentSuccessData.data.user.legalConsent.privacyVersion, PRIVACY_VERSION);

    // Verify DB updated
    const updatedLegacyUser = await User.findOne({ email: legacyEmail });
    assert(updatedLegacyUser?.legalConsent?.termsAcceptedAt instanceof Date);
    console.log('Updated legacy user in DB:', updatedLegacyUser?.legalConsent);
    console.log('✅ TEST 5 PASSED: Re-consent endpoint persists metadata and clears requiresLegalConsent.\n');

    // -------------------------------------------------------------------------
    // TEST 6: Policy Version Bump (e.g. Terms v0.9 -> v1.0)
    // -------------------------------------------------------------------------
    console.log('--- TEST 6: Policy Version Bump Simulation ---');
    // Set user's version to old version '0.9'
    await User.updateOne(
      { email: legacyEmail },
      {
        $set: {
          'legalConsent.termsVersion': '0.9',
          'legalConsent.privacyVersion': '0.9',
        },
      }
    );

    // Login with outdated consent
    const bumpedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: legacyEmail, password: 'Password123!' }),
    });
    const bumpedLoginData = await bumpedLoginRes.json();
    console.log('Login after policy version bump requiresLegalConsent:', bumpedLoginData.data?.requiresLegalConsent);
    assert.strictEqual(bumpedLoginData.data.requiresLegalConsent, true, 'User with old versions must require updated consent');

    // Re-consent to new version
    const upgradedRes = await fetch(`${BASE_URL}/api/auth/legal-consent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bumpedLoginData.data.accessToken}`,
      },
      body: JSON.stringify({ acceptedTerms: true }),
    });
    const upgradedData = await upgradedRes.json();
    assert.strictEqual(upgradedRes.status, 200);
    assert.strictEqual(upgradedData.data.requiresLegalConsent, false);
    assert.strictEqual(upgradedData.data.user.legalConsent.termsVersion, TERMS_VERSION);
    console.log('✅ TEST 6 PASSED: Material version changes correctly trigger re-consent gate.\n');

    console.log('================================================================================');
    console.log('🎉 ALL LEGAL CONSENT & PRIVACY SYSTEM BACKEND TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================================');
  } finally {
    // Clean up test users
    await User.deleteMany({ email: { $in: [testEmail1, legacyEmail] } });
    await mongoose.disconnect();
  }
}

runLegalConsentSuite().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
