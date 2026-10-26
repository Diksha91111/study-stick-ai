process.env.NODE_ENV = 'test_runner';

import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import { User } from '../models/User.js';
import { generateAccessToken } from '../utils/token.js';
import { connectDB } from '../config/db.js';

import { Task } from '../models/Task.js';
import { SleepSchedule } from '../models/SleepSchedule.js';
import { TimetableSlot } from '../models/TimetableSlot.js';
import { StudySession } from '../models/StudySession.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import { LearningPath } from '../models/LearningPath.js';
import { FlashcardDeck, Flashcard } from '../models/Flashcard.js';

async function runTests() {
  await connectDB();
  const existingU1 = await User.findOne({ email: 'student1@example.com' });
  if (existingU1) {
    await Task.deleteMany({ userId: existingU1._id });
    await SleepSchedule.deleteMany({ userId: existingU1._id });
    await TimetableSlot.deleteMany({ userId: existingU1._id });
    await StudySession.deleteMany({ userId: existingU1._id });
    await ProgrammingProgress.deleteMany({ userId: existingU1._id });
    await LearningPath.deleteMany({ userId: existingU1._id });
    await FlashcardDeck.deleteMany({ userId: existingU1._id });
    await Flashcard.deleteMany({ userId: existingU1._id });
    await User.deleteOne({ _id: existingU1._id });
  }

  const u1 = await User.create({
    name: 'Student One',
    email: 'student1@example.com',
    password: 'password123',
    isEmailVerified: true
  });
  const token = generateAccessToken({ userId: u1._id.toString(), email: u1.email });
  const auth = `Bearer ${token}`;

  let passed = 0;
  let failed = 0;
  const test = async (name: string, fn: () => Promise<void> | void) => {
    try {
      await fn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (e: any) {
      console.log(`❌ FAIL: ${name}`);
      console.error(e.message || e);
      failed++;
    }
  };

  try {
    // 1. Create a task and configure available study hours.
    await test('Create task and configure constraints', async () => {
      const now = new Date();
      now.setDate(now.getDate() + 2); // Due in 2 days
      const taskRes = await request(app).post('/api/tasks').set('Authorization', auth).send({
        title: 'Phase 10 E2E Task',
        taskType: 'assignment',
        priority: 'high',
        dueDate: now.toISOString(),
        estimatedHours: 2,
      });
      if (taskRes.status !== 201) throw new Error('Task creation failed');

      const sleepRes = await request(app).put('/api/sleep').set('Authorization', auth).send({
        bedTime: '23:00',
        wakeTime: '07:00',
        targetSleepHours: 8,
      });
      if (sleepRes.status !== 200) throw new Error('Sleep configuration failed');

      const todayDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
      const slotRes = await request(app).post('/api/timetable').set('Authorization', auth).send({
        dayOfWeek: todayDay,
        startTime: '10:00',
        endTime: '12:00',
        slotType: 'college_lecture',
        title: 'Maths Lecture'
      });
      if (slotRes.status !== 201) throw new Error('Timetable slot creation failed');
    });

    // 2. Generate a daily study plan & 3. Verify fixed timetable constraints.
    let sessionId = '';
    await test('Generate daily study plan and verify constraints', async () => {
      const planRes = await request(app).post('/api/planner/generate').set('Authorization', auth);
      if (planRes.status !== 200) throw new Error('Failed to generate plan');
      const sessions = planRes.body.data;
      if (sessions.length === 0) throw new Error('No sessions generated for the task');

      const taskSession = sessions.find((s: any) => s.title.includes('Phase 10 E2E Task'));
      if (!taskSession) throw new Error('Task was not prioritized into a session');
      
      const sessionStartHour = new Date(taskSession.startTime).getHours();
      if (sessionStartHour < 7) throw new Error('Session scheduled during sleep time');
      if (sessionStartHour >= 10 && sessionStartHour < 12) throw new Error('Session scheduled during timetable slot');
      
      sessionId = taskSession._id;
    });

    // 4. Complete a planned session.
    await test('Complete a planned session', async () => {
      const res = await request(app).put(`/api/planner/sessions/${sessionId}/status`).set('Authorization', auth).send({ status: 'completed' });
      if (res.status !== 200 || res.body.data.status !== 'completed') throw new Error('Failed to mark session as completed');
    });

    // 5. Record a programming attempt and verify progress.
    await test('Record programming attempt', async () => {
      await request(app).post('/api/progress/record').set('Authorization', auth).send({ topic: 'Variables and data types', isCorrect: false });
      await request(app).post('/api/progress/record').set('Authorization', auth).send({ topic: 'Variables and data types', isCorrect: false });
      await request(app).post('/api/progress/record').set('Authorization', auth).send({ topic: 'Variables and data types', isCorrect: false });
      
      const dash = await request(app).get('/api/progress/dashboard').set('Authorization', auth);
      const data = dash.body.data.find((d: any) => d.topic === 'Variables and data types');
      if (!data || data.mastery !== 0) throw new Error('Progress not correctly updated');
    });

    // 6. Accept a learning-path recommendation.
    let lpRecId = '';
    await test('Generate and Accept LP recommendation', async () => {
      const lpRes = await request(app).get('/api/learning-path').set('Authorization', auth);
      if (lpRes.status !== 200) throw new Error('Failed to generate learning path');
      const recs = lpRes.body.data.path.recommendations;
      const pending = recs.find((r: any) => r.status === 'pending');
      if (!pending) throw new Error('No pending recommendation created based on weak progress');
      lpRecId = pending._id;

      const acceptRes = await request(app).patch(`/api/learning-path/recommendation/${lpRecId}`).set('Authorization', auth).send({ status: 'accepted' });
      if (acceptRes.status !== 200) throw new Error('Failed to accept LP recommendation');
    });

    // 7. Generate and review a flashcard.
    await test('Create deck and review flashcard', async () => {
      const deckRes = await request(app).post('/api/flashcards/decks').set('Authorization', auth).send({ title: 'E2E Deck' });
      const deckId = deckRes.body.data._id;
      
      const cardRes = await request(app).post('/api/flashcards/cards').set('Authorization', auth).send({
        deckId,
        front: 'What is a variable?',
        back: 'A storage location',
        programmingTopic: 'Variables and data types'
      });
      const cardId = cardRes.body.data._id;

      const reviewRes = await request(app).post(`/api/flashcards/cards/${cardId}/review`).set('Authorization', auth).send({
        rating: 'Good'
      });
      if (reviewRes.status !== 200) throw new Error('Failed to review flashcard');
    });

    // 8. Mark a session missed and reschedule it.
    await test('Miss and reschedule session', async () => {
      // First, create a new session manually for testing the reschedule endpoint since the other is completed.
      const now = new Date();
      const testSession = await StudySession.create({
        userId: u1._id,
        title: 'Temporary Session to Miss',
        sessionType: 'task',
        startTime: new Date(now.getTime() - 60000), // Started 1 min ago
        endTime: new Date(now.getTime() + 60000), // Ends in 1 min
        durationMinutes: 60,
        status: 'planned'
      });

      const missRes = await request(app).put(`/api/planner/sessions/${testSession._id}/status`).set('Authorization', auth).send({ status: 'missed' });
      if (missRes.status !== 200 || missRes.body.data.status !== 'missed') throw new Error('Failed to miss session');

      const rescheduleRes = await request(app).post(`/api/planner/sessions/${testSession._id}/reschedule`).set('Authorization', auth);
      if (rescheduleRes.status !== 200) throw new Error('Failed to reschedule session');
      if (rescheduleRes.body.data.status !== 'planned' || rescheduleRes.body.data.title !== 'Temporary Session to Miss') throw new Error('Rescheduled session data incorrect');
    });

    // 9. Regenerate the plan & 10. Confirm historical records remain intact.
    await test('Regenerate plan & verify history intact', async () => {
      await request(app).post('/api/planner/generate').set('Authorization', auth);

      const dashRes = await request(app).get('/api/planner/dashboard').set('Authorization', auth);
      const allSessions = dashRes.body.data.sessions;
      
      const completedSession = allSessions.find((s: any) => s._id.toString() === sessionId);
      if (!completedSession) throw new Error('Completed session was erased during regeneration!');
      if (completedSession.status !== 'completed') throw new Error('Completed session status was mutated!');
      
      const missedSession = allSessions.find((s: any) => s.title === 'Temporary Session to Miss' && s.status === 'missed');
      if (!missedSession) throw new Error('Missed session history was erased!');
    });

  } finally {
    console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0) process.exit(1);
    process.exit(0);
  }
}

runTests();
