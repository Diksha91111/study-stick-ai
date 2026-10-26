import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BASE_URL = 'http://localhost:5000';

async function testFixVerification() {
  console.log('================================================================================');
  console.log('🧪 TESTING FIX FOR PRESENCE, SESSIONS/CONTROL, AND SESSIONS/PARTICIPANT');
  console.log('================================================================================\n');

  // Step 1: Login as User A and User B
  const timestamp = Date.now();
  const emailA = `fix_test_a_${timestamp}@studystick.ai`;
  const emailB = `fix_test_b_${timestamp}@studystick.ai`;
  const password = 'Password123!';

  // Register User A
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User A',
      email: emailA,
      password,
      confirmPassword: password,
      acceptedTerms: true,
    }),
  });
  assert.strictEqual(regARes.status, 201);

  // Register User B
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'User B',
      email: emailB,
      password,
      confirmPassword: password,
      acceptedTerms: true,
    }),
  });
  assert.strictEqual(regBRes.status, 201);

  // Verify in MongoDB
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studystick_ai';
  await mongoose.connect(mongoUri);
  const usersColl = mongoose.connection.collection('users');
  await usersColl.updateMany(
    { email: { $in: [emailA, emailB] } },
    { $set: { isEmailVerified: true } }
  );

  // Login User A
  const loginARes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailA, password }),
  });
  const loginAData = await loginARes.json();
  const tokenA = loginAData.data.accessToken;

  // Login User B
  const loginBRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: emailB, password }),
  });
  const loginBData = await loginBRes.json();
  const tokenB = loginBData.data.accessToken;

  console.log('✅ Step 1: Users registered, verified, and logged in.');

  // Step 2: User A creates a room
  const createRoomRes = await fetch(`${BASE_URL}/api/study-rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      name: 'Verification Hub',
      goal: 'Verify presence, control and participant routes',
      privacy: 'PRIVATE',
      defaultFocusDurationMinutes: 45,
    }),
  });
  const roomData = await createRoomRes.json();
  assert.strictEqual(createRoomRes.status, 201);
  const roomId = roomData.data._id;
  const inviteCode = roomData.data.inviteCode;
  console.log('✅ Step 2: Room created with ID:', roomId, 'invite:', inviteCode);

  // Step 3: User B joins room
  const joinRes = await fetch(`${BASE_URL}/api/study-rooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ inviteCode }),
  });
  assert.strictEqual(joinRes.status, 200);
  console.log('✅ Step 3: User B joined room successfully.');

  // Step 4: Test PATCH /api/study-rooms/:roomId/presence (User A and User B)
  console.log('\n--- Test 4: Testing /api/study-rooms/:roomId/presence ---');
  const presenceResA = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/presence`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ presence: 'ONLINE' }),
  });
  console.log('User A presence status:', presenceResA.status);
  assert.strictEqual(presenceResA.status, 200);

  const presenceResB = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/presence`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ presence: 'STUDYING' }),
  });
  console.log('User B presence status:', presenceResB.status);
  assert.strictEqual(presenceResB.status, 200);
  console.log('✅ Test 4 PASSED: /api/study-rooms/:roomId/presence returns 200 (NOT 404).');

  // Step 5: User A starts focus session
  console.log('\n--- Test 5: Starting focus session ---');
  const startSessionRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({
      goal: 'Deep Focus Session',
      durationMinutes: 45,
    }),
  });
  console.log('Start session status:', startSessionRes.status);
  assert.strictEqual(startSessionRes.status, 201);
  console.log('✅ Test 5 PASSED: Focus session started.');

  // Step 6: Test POST /api/study-rooms/:roomId/sessions/control (PAUSE, RESUME, END)
  console.log('\n--- Test 6: Testing /api/study-rooms/:roomId/sessions/control ---');
  const pauseRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ action: 'PAUSE' }),
  });
  console.log('Pause session status:', pauseRes.status);
  assert.strictEqual(pauseRes.status, 200);

  const resumeRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ action: 'RESUME' }),
  });
  console.log('Resume session status:', resumeRes.status);
  assert.strictEqual(resumeRes.status, 200);
  console.log('✅ Test 6 PASSED: /api/study-rooms/:roomId/sessions/control returns 200 (NOT 404).');

  // Step 7: Test POST /api/study-rooms/:roomId/sessions/participant (JOIN, BREAK, RESUME, LEAVE)
  console.log('\n--- Test 7: Testing /api/study-rooms/:roomId/sessions/participant ---');
  const joinParticipantRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions/participant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ action: 'JOIN' }),
  });
  console.log('Participant JOIN status:', joinParticipantRes.status);
  assert.strictEqual(joinParticipantRes.status, 200);

  const breakParticipantRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions/participant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ action: 'BREAK' }),
  });
  console.log('Participant BREAK status:', breakParticipantRes.status);
  assert.strictEqual(breakParticipantRes.status, 200);

  const resumeParticipantRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions/participant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ action: 'RESUME' }),
  });
  console.log('Participant RESUME status:', resumeParticipantRes.status);
  assert.strictEqual(resumeParticipantRes.status, 200);
  console.log('✅ Test 7 PASSED: /api/study-rooms/:roomId/sessions/participant returns 200 (NOT 404).');

  // Step 8: End focus session
  const endRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`,
    },
    body: JSON.stringify({ action: 'END' }),
  });
  console.log('End session status:', endRes.status);
  assert.strictEqual(endRes.status, 200);

  // Step 9: User B cannot control session (Authorization check)
  const unauthorizedControlRes = await fetch(`${BASE_URL}/api/study-rooms/${roomId}/sessions/control`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`,
    },
    body: JSON.stringify({ action: 'PAUSE' }),
  });
  console.log('Unauthorized control status for Member (expected 403):', unauthorizedControlRes.status);
  assert.strictEqual(unauthorizedControlRes.status, 403);
  console.log('✅ Step 9 PASSED: Member cannot control focus sessions (backend enforced).');

  await mongoose.disconnect();
  console.log('\n🎉 ALL FIX VERIFICATION TESTS PASSED SUCCESSFULLY! ZERO 404 ERRORS.');
}

testFixVerification().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
