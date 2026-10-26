process.env.NODE_ENV = 'test_runner';

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import { LearningPath } from '../models/LearningPath.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { generateAccessToken } from '../utils/token.js';
import { connectDB } from '../config/db.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';

aiOrchestrator.processRequest = async () => ({
  text: 'Mocked explanation',
  provider: 'gemini',
  model: 'gemini-3.5-flash'
});

async function runComprehensive409Tests() {
  await connectDB();

  console.log('\n==================================================');
  console.log('🧪 RUNNING COMPREHENSIVE 409 CONFLICT VERIFICATION');
  console.log('==================================================\n');

  // Clean any leftover test users
  await User.deleteMany({ email: { $in: ['conflict.verified@studystick.ai', 'conflict.unverified@studystick.ai'] } });

  // 1. Concurrent GET /api/learning-path (React StrictMode Simulation)
  console.log('--- 1. Testing Concurrent GET /api/learning-path (React StrictMode Simulation) ---');
  const verifiedUser = await User.create({
    name: 'Verified Student',
    email: 'conflict.verified@studystick.ai',
    password: 'Password123!',
    isEmailVerified: true
  });
  const token = generateAccessToken({ userId: verifiedUser._id.toString(), email: verifiedUser.email });

  const parallelGetRequests = Array.from({ length: 5 }, () => 
    request(app).get('/api/learning-path').set('Authorization', `Bearer ${token}`)
  );
  const getResponses = await Promise.all(parallelGetRequests);
  const getStatuses = getResponses.map(r => r.status);
  console.log('Concurrent GET statuses:', getStatuses);
  if (getStatuses.some(s => s !== 200)) {
    throw new Error(`GET /api/learning-path failed under concurrency: ${JSON.stringify(getStatuses)}`);
  }
  console.log('✅ GET /api/learning-path: 100% success under concurrency, 0 conflicts.');

  // 2. Concurrent POST /api/learning-path/start-topic (Double Click / Rapid Submissions)
  console.log('\n--- 2. Testing Concurrent POST /api/learning-path/start-topic (Idempotency) ---');
  const parallelStartRequests = Array.from({ length: 5 }, () =>
    request(app)
      .post('/api/learning-path/start-topic')
      .set('Authorization', `Bearer ${token}`)
      .send({ topic: 'Variables and data types' })
  );
  const startResponses = await Promise.all(parallelStartRequests);
  const startStatuses = startResponses.map(r => r.status);
  console.log('Concurrent start-topic statuses:', startStatuses);
  if (startStatuses.some(s => s !== 200)) {
    throw new Error(`start-topic failed under concurrency: ${JSON.stringify(startStatuses)}`);
  }
  const progressDocs = await ProgrammingProgress.find({ userId: verifiedUser._id, topic: 'Variables and data types' });
  console.log(`Progress documents found in DB for user+topic: ${progressDocs.length} (must be exactly 1)`);
  if (progressDocs.length !== 1) {
    throw new Error(`Expected 1 progress document, found ${progressDocs.length}`);
  }
  console.log('✅ POST /api/learning-path/start-topic: Exactly 1 document created, all concurrent requests returned 200.');

  // 3. Concurrent Quiz Submission (Duplicate Submission Protection)
  console.log('\n--- 3. Testing Concurrent POST /api/learning-path/assessment/submit (Duplicate Guard) ---');
  const sampleAnswers = [
    { questionId: 'vdt-1', selectedAnswer: 'Primitives store their actual values directly on the stack; reference types store pointers to heap-allocated objects' },
    { questionId: 'vdt-2', selectedAnswer: '5, because primitive numbers are passed and assigned by value, copying the value' },
    { questionId: 'vdt-3', selectedAnswer: 'The property modification succeeds because const prevents variable reassignment, not property mutation' },
    { questionId: 'vdt-4', selectedAnswer: '=== (Strict equality)' },
    { questionId: 'vdt-5', selectedAnswer: 'False' }
  ];

  const parallelQuizSubmissions = Array.from({ length: 4 }, () =>
    request(app)
      .post('/api/learning-path/assessment/submit')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topic: 'Variables and data types',
        userAnswers: sampleAnswers,
        timeTakenMinutes: 3
      })
  );
  const quizResponses = await Promise.all(parallelQuizSubmissions);
  const quizStatuses = quizResponses.map(r => r.status);
  console.log('Concurrent assessment submit statuses:', quizStatuses);
  console.log('Quiz response body (first):', quizResponses[0].body);
  console.log('Quiz 500 error body:', quizResponses.find(r => r.status === 500)?.body);
  if (quizStatuses.some(s => s !== 200)) {
    throw new Error(`Assessment submit failed: ${JSON.stringify(quizStatuses)}`);
  }
  const attemptDocs = await AssessmentAttempt.find({ userId: verifiedUser._id, topic: 'Variables and data types' });
  console.log(`Assessment attempt documents found: ${attemptDocs.length} (must be 1 due to idempotent duplicate guard)`);
  if (attemptDocs.length !== 1) {
    throw new Error(`Expected 1 attempt document, found ${attemptDocs.length}`);
  }
  console.log('✅ Assessment submission: Exactly 1 attempt recorded, stats not multiplied.');

  // 4. Progression State Verification: Task 1 COMPLETED -> Task 2 AVAILABLE (NOT IN_PROGRESS)
  console.log('\n--- 4. Verifying Progression State After Passing Task 1 ---');
  const statesRes = await request(app).get('/api/learning-path').set('Authorization', `Bearer ${token}`);
  const task1State = statesRes.body.data.states['Variables and data types'];
  const task2State = statesRes.body.data.states['Conditions and loops'];
  console.log('Task 1 ("Variables and data types") status:', task1State.status);
  console.log('Task 2 ("Conditions and loops") status:', task2State.status);
  if (task1State.status !== 'COMPLETED') {
    throw new Error(`Expected Task 1 to be COMPLETED, got ${task1State.status}`);
  }
  if (task2State.status !== 'AVAILABLE') {
    throw new Error(`Expected Task 2 to be AVAILABLE (never auto-started), got ${task2State.status}`);
  }
  console.log('✅ State progression rules strictly satisfied: Task 1 COMPLETED, Task 2 AVAILABLE.');

  // 5. Auth Registration: Existing VERIFIED Account -> Legitimate 409 with EMAIL_ALREADY_EXISTS code
  console.log('\n--- 5. Testing POST /api/auth/register with Existing Verified Account ---');
  const registerVerifiedRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Duplicate Verified',
      email: 'conflict.verified@studystick.ai',
      password: 'Password123!'
    });
  console.log('Register verified account status:', registerVerifiedRes.status);
  console.log('Response body:', registerVerifiedRes.body);
  if (registerVerifiedRes.status !== 409) {
    throw new Error(`Expected 409, got ${registerVerifiedRes.status}`);
  }
  if (registerVerifiedRes.body.data?.code !== 'EMAIL_ALREADY_EXISTS') {
    throw new Error(`Expected error code EMAIL_ALREADY_EXISTS, got ${registerVerifiedRes.body.data?.code}`);
  }
  console.log('✅ Auth registration verified account: Correctly returned 409 with code EMAIL_ALREADY_EXISTS.');

  // 6. Auth Registration: Existing UNVERIFIED Account -> Resends OTP, returns 200 (NOT 409)
  console.log('\n--- 6. Testing POST /api/auth/register with Existing UNVERIFIED Account ---');
  const unverifiedUser = await User.create({
    name: 'Unverified Student',
    email: 'conflict.unverified@studystick.ai',
    password: 'Password123!',
    isEmailVerified: false
  });

  const registerUnverifiedRes = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Unverified Student',
      email: 'conflict.unverified@studystick.ai',
      password: 'NewPassword123!'
    });
  console.log('Register unverified account status:', registerUnverifiedRes.status);
  console.log('Response body:', registerUnverifiedRes.body);
  if (registerUnverifiedRes.status !== 200) {
    throw new Error(`Expected 200, got ${registerUnverifiedRes.status}`);
  }
  if (registerUnverifiedRes.body.data?.code !== 'EMAIL_NOT_VERIFIED') {
    throw new Error(`Expected code EMAIL_NOT_VERIFIED, got ${registerUnverifiedRes.body.data?.code}`);
  }
  const updatedUnverifiedUser = await User.findById(unverifiedUser._id).select('+verificationTokenExpires');
  if (!updatedUnverifiedUser?.verificationTokenExpires) {
    throw new Error('Fresh verification OTP expiration not set on unverified user!');
  }
  console.log('✅ Auth registration unverified account: Successfully resent OTP and returned 200 (no false 409).');

  // Clean up
  await ProgrammingProgress.deleteMany({ userId: verifiedUser._id });
  await LearningPath.deleteMany({ userId: verifiedUser._id });
  await AssessmentAttempt.deleteMany({ userId: verifiedUser._id });
  await User.deleteMany({ email: { $in: ['conflict.verified@studystick.ai', 'conflict.unverified@studystick.ai'] } });
  await mongoose.disconnect();

  console.log('\n🎉 ALL 409 CONFLICT VERIFICATION SCENARIOS PASSED WITH FLYING COLORS!\n');
}

runComprehensive409Tests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
