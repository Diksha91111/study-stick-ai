process.env.NODE_ENV = 'test_runner';

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import { LearningPath } from '../models/LearningPath.js';
import { generateAccessToken } from '../utils/token.js';
import { connectDB } from '../config/db.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';

const originalExecute_global = aiOrchestrator.processRequest;
aiOrchestrator.processRequest = async (req: any) => {
  return {
    text: 'Mocked AI Explanation.',
    provider: 'gemini',
    model: 'gemini-3.5-flash'
  };
};

interface TestResult {
  test: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  detail: string;
}
const results: TestResult[] = [];
function pass(test: string, detail: string) {
  results.push({ test, status: 'PASSED', detail });
  console.log(`  ✅ PASSED  ${test} — ${detail}`);
}
function fail(test: string, detail: string) {
  results.push({ test, status: 'FAILED', detail });
  console.log(`  ❌ FAILED  ${test} — ${detail}`);
}

async function runTests() {
  await connectDB();
  const existingU1 = await User.findOne({ email: 'student1@example.com' });
  if (existingU1) {
    await ProgrammingProgress.deleteMany({ userId: existingU1._id });
    await LearningPath.deleteMany({ userId: existingU1._id });
    await User.deleteOne({ _id: existingU1._id });
  }

  const u1 = await User.create({
    name: 'Student One',
    email: 'student1@example.com',
    password: 'password123',
    isEmailVerified: true
  });
  const token1 = generateAccessToken({ userId: u1._id.toString(), email: u1.email });

  try {
    // 1. Empty progress & Prerequisites
    let res = await request(app).get('/api/learning-path').set('Authorization', `Bearer ${token1}`);
    if (res.body.data && res.body.data.path.recommendations.length > 0) {
      const rec = res.body.data.path.recommendations[0];
      if (rec.topic === 'Variables and data types') {
        pass('Empty Progress & Prerequisites', 'Recommended base topic when no progress exists');
      } else fail('Empty Progress & Prerequisites', 'Did not recommend base topic');
    } else fail('Empty Progress & Prerequisites', 'No recommendation generated');

    // 2. Insufficient data
    await ProgrammingProgress.create({
      userId: u1._id,
      topic: 'Variables and data types',
      attempts: 2, // < 3 attempts
      correctAnswers: 2
    });
    // We should dismiss the current rec to force a new one
    const firstRec = res.body.data.path.recommendations[0];
    res = await request(app)
      .patch(`/api/learning-path/recommendation/${firstRec._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ status: 'completed' });
    
    // It should still recommend 'Variables and data types' because it's not mastered (insufficient data)
    const nextRec = res.body.data.path.recommendations.find((r: any) => r.status === 'pending');
    if (nextRec && nextRec.topic === 'Variables and data types') {
      pass('Insufficient Data', 'Did not consider topic mastered with < 3 attempts');
    } else fail('Insufficient Data', 'Considered topic mastered prematurely');

    // 3. Weak topics
    // Master Variables
    await ProgrammingProgress.findOneAndUpdate(
      { userId: u1._id, topic: 'Variables and data types' },
      { attempts: 5, correctAnswers: 5 }
    );
    // Add weak progress for Conditions
    await ProgrammingProgress.create({
      userId: u1._id,
      topic: 'Conditions and loops',
      attempts: 5,
      correctAnswers: 1, // < 50% mastery
      recentErrors: ['SyntaxError']
    });

    res = await request(app)
      .patch(`/api/learning-path/recommendation/${nextRec._id}`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ status: 'completed' });

    const weakRec = res.body.data.path.recommendations.find((r: any) => r.status === 'pending');
    if (weakRec && weakRec.topic === 'Conditions and loops' && weakRec.reason.includes('Weak area')) {
      pass('Weak Topics', 'Prioritized weak topic in recommendations');
    } else fail('Weak Topics', 'Did not prioritize weak topic');

    // 4. AI quota fallback (Mocked)
    aiOrchestrator.processRequest = async () => { throw new Error('Quota exceeded'); };
    
    // Accept current and dismiss to trigger new generation
    await request(app).patch(`/api/learning-path/recommendation/${weakRec._id}`).set('Authorization', `Bearer ${token1}`).send({ status: 'accepted' });
    res = await request(app).patch(`/api/learning-path/recommendation/${weakRec._id}`).set('Authorization', `Bearer ${token1}`).send({ status: 'dismissed' });
    
    const fallbackRec = res.body.data.path.recommendations.find((r: any) => r.status === 'pending');
    if (fallbackRec && fallbackRec.aiExplanation === 'Focusing on this topic will build a solid foundation for your overall programming goals.') {
      pass('AI Quota Fallback', 'Used deterministic explanation when AI failed');
    } else fail('AI Quota Fallback', 'Fallback failed');
    aiOrchestrator.processRequest = originalExecute_global; // Restore

    // 5. Authorization
    res = await request(app).get('/api/learning-path');
    if (res.status === 401) pass('Authorization', 'Rejected request without token');
    else fail('Authorization', 'Allowed unauthorized request');

  } catch (e: any) {
    console.error(e);
    fail('Tests Execution', e.message);
  }

  if (u1) {
    await ProgrammingProgress.deleteMany({ userId: u1._id });
    await LearningPath.deleteMany({ userId: u1._id });
    await User.deleteOne({ _id: u1._id });
  }
  mongoose.disconnect();
}

async function main() {
  console.log('\n================================================================');
  console.log('🤖 STUDY STICK AI - LEARNING PATH VERIFICATION');
  console.log('================================================================\n');
  await runTests();
  const failed = results.filter(r => r.status === 'FAILED').length;
  if (failed > 0) process.exit(1);
}
main();
