process.env.NODE_ENV = 'test_runner';

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import { generateAccessToken } from '../utils/token.js';
import { connectDB } from '../config/db.js';

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
  await User.deleteMany({ email: { $in: ['student1@example.com', 'student2@example.com'] } });

  const u1 = await User.create({
    name: 'Student One',
    email: 'student1@example.com',
    password: 'password123',
    isEmailVerified: true
  });
  const token1 = generateAccessToken({ userId: u1._id.toString(), email: u1.email });

  const u2 = await User.create({
    name: 'Student Two',
    email: 'student2@example.com',
    password: 'password123',
    isEmailVerified: true
  });
  const token2 = generateAccessToken({ userId: u2._id.toString(), email: u2.email });

  try {
    // 1. Empty state
    let res = await request(app).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
    if (res.body.data && res.body.data.length === 0) pass('Empty State', 'Dashboard returns empty array initially');
    else fail('Empty State', 'Did not return empty array');

    // 2. Record progress calculations
    await request(app).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Variables and data types', isCorrect: true });
    res = await request(app).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
    if (res.body.data[0].attempts === 1 && res.body.data[0].mastery === null && res.body.data[0].status === 'Not enough data') {
      pass('Calculations < 3 attempts', 'Mastery is null, status is Not enough data');
    } else fail('Calculations < 3 attempts', 'Incorrect state');

    await request(app).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Variables and data types', isCorrect: false });
    await request(app).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Variables and data types', isCorrect: true, hintUsed: true });
    
    res = await request(app).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
    if (res.body.data[0].attempts === 3 && res.body.data[0].mastery === 67 && res.body.data[0].status === 'Practicing') {
      pass('Calculations >= 3 attempts', 'Mastery calculated correctly, status updated');
    } else fail('Calculations >= 3 attempts', 'Incorrect state');

    // 3. Duplicate event handling
    const eventId = 'unique-event-123';
    await request(app).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Arrays and strings', isCorrect: true, eventId });
    await request(app).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Arrays and strings', isCorrect: true, eventId });
    
    res = await request(app).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
    const arraysTopic = res.body.data.find((d: any) => d.topic === 'Arrays and strings');
    if (arraysTopic.attempts === 1) {
      pass('Duplicate Events', 'Ignored event with duplicate eventId');
    } else fail('Duplicate Events', 'Counted duplicate event');

    // 4. User Isolation
    res = await request(app).get('/api/progress/dashboard').set('Authorization', `Bearer ${token2}`);
    if (res.body.data.length === 0) pass('User Isolation', 'User 2 cannot see User 1 progress');
    else fail('User Isolation', 'Data leaked to User 2');

    // 5. Invalid Data
    res = await request(app).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Invalid Topic', isCorrect: true });
    if (res.status === 500 || res.status === 400) pass('Invalid Data', 'Rejected invalid topic');
    else fail('Invalid Data', 'Accepted invalid topic');

  } catch (e: any) {
    console.error(e);
    fail('Tests Execution', e.message);
  }

  await User.deleteMany({ email: { $in: ['student1@example.com', 'student2@example.com'] } });
  await ProgrammingProgress.deleteMany({});
  mongoose.disconnect();
}

async function main() {
  console.log('\n================================================================');
  console.log('🤖 STUDY STICK AI - PROGRESS TRACKER VERIFICATION');
  console.log('================================================================\n');
  await runTests();
  const failed = results.filter(r => r.status === 'FAILED').length;
  if (failed > 0) process.exit(1);
}
main();
