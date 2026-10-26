process.env.NODE_ENV = 'test_runner';

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import { generateAccessToken } from '../utils/token.js';
import { connectDB } from '../config/db.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';

const originalExecute_global = aiOrchestrator.processRequest;
aiOrchestrator.processRequest = async (req: any) => {
  return {
    text: '[{"questionText": "Mock Q1", "options": ["A", "B", "C", "D"], "correctAnswer": "A", "explanation": "It is A"}]',
    provider: 'gemini',
    model: 'gemini-3.5-flash'
  };
};

async function runTests() {
  await connectDB();
  const existingU1 = await User.findOne({ email: 'assessor@example.com' });
  if (existingU1) {
    await ProgrammingProgress.deleteMany({ userId: existingU1._id });
    await User.deleteOne({ _id: existingU1._id });
  }
  
  const u1 = await User.create({
    name: 'Test Assessor',
    email: 'assessor@example.com',
    password: 'password123',
    isEmailVerified: true
  });
  const token = generateAccessToken({ userId: u1._id.toString(), email: u1.email });

  try {
    console.log('Testing Assessment Engine & State Machine...\n');

    // Setup base unlocked record
    await ProgrammingProgress.create({
      userId: u1._id,
      topic: 'Variables and data types',
      status: 'AVAILABLE',
      attempts: 0,
      correctAnswers: 0,
      hintsRequested: 0,
      lessonsCompleted: 0,
      examScoreSum: 0,
      examQuestionsAttempted: 0,
      recentErrors: [],
    });

    // Setup base locked record (dependent on Variables)
    await ProgrammingProgress.create({
      userId: u1._id,
      topic: 'Conditions and loops',
      status: 'LOCKED',
      attempts: 0,
      correctAnswers: 0,
      hintsRequested: 0,
      lessonsCompleted: 0,
      examScoreSum: 0,
      examQuestionsAttempted: 0,
      recentErrors: [],
    });

    // 1. Generate Assessment
    let res = await request(app).post('/api/learning-path/assessment/generate').set('Authorization', `Bearer ${token}`).send({
      topic: 'Variables and data types'
    });
    if (res.body.data && res.body.data.assessment) {
      console.log('✅ PASSED - Generate Assessment: Parsed AI json correctly');
    } else throw new Error('Generate Assessment failed');

    // 2. Submit Failing Test
    res = await request(app).post('/api/learning-path/assessment/submit').set('Authorization', `Bearer ${token}`).send({
      topic: 'Variables and data types',
      userAnswers: [
        { questionText: "Q1", userAnswer: "B", correctAnswer: "A", explanation: "Mock" }
      ]
    });
    let p = await ProgrammingProgress.findOne({ userId: u1._id, topic: 'Variables and data types' });
    let dep = await ProgrammingProgress.findOne({ userId: u1._id, topic: 'Conditions and loops' });
    if (res.body.data.isPass === false && p?.status === 'NEEDS_REVISION' && dep?.status === 'LOCKED') {
      console.log('✅ PASSED - Submit Failing Test: State updated to NEEDS_REVISION, dependent kept LOCKED');
    } else throw new Error('Submit Failing Test failed: ' + JSON.stringify({ isPass: res.body.data.isPass, status: p?.status, depStatus: dep?.status }));

    // 3. Submit Passing Test
    res = await request(app).post('/api/learning-path/assessment/submit').set('Authorization', `Bearer ${token}`).send({
      topic: 'Variables and data types',
      userAnswers: [
        { questionText: "Q1", userAnswer: "A", correctAnswer: "A", explanation: "Mock" }
      ]
    });
    p = await ProgrammingProgress.findOne({ userId: u1._id, topic: 'Variables and data types' });
    dep = await ProgrammingProgress.findOne({ userId: u1._id, topic: 'Conditions and loops' });
    if (res.body.data.isPass === true && p?.status === 'COMPLETED' && dep?.status === 'AVAILABLE') {
      console.log('✅ PASSED - Submit Passing Test: State updated to COMPLETED, dependent unlocked to AVAILABLE');
    } else throw new Error('Submit Passing Test failed: ' + JSON.stringify({ isPass: res.body.data.isPass, status: p?.status, depStatus: dep?.status }));

    // 4. Repeated Submission (Idempotency)
    res = await request(app).post('/api/learning-path/assessment/submit').set('Authorization', `Bearer ${token}`).send({
      topic: 'Variables and data types',
      userAnswers: [
        { questionText: "Q1", userAnswer: "B", correctAnswer: "A", explanation: "Mock" }
      ]
    });
    if (res.body.data.success === true && res.body.data.message.includes('already completed')) {
      console.log('✅ PASSED - Idempotency: Repeated submission after completion was safely ignored');
    } else throw new Error('Idempotency failed');

    // 5. Shared Authentication / 401 Ensure
    res = await request(app).post('/api/learning-path/assessment/submit').send({
      topic: 'Variables and data types',
      userAnswers: []
    });
    if (res.status === 401) {
      console.log('✅ PASSED - Shared Authentication: 401 Unauthorized securely returned for unauthenticated requests');
    } else throw new Error('Authentication enforcement failed');

  } catch (e: any) {
    console.error(`\n❌ TEST SUITE FAILED: ${e.message}`);
    process.exitCode = 1;
  }

  aiOrchestrator.processRequest = originalExecute_global;
  if (u1) {
    await ProgrammingProgress.deleteMany({ userId: u1._id });
    await User.deleteOne({ _id: u1._id });
  }
  mongoose.disconnect();
}

runTests();
