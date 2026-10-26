import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../server.js';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { Profile } from '../models/Profile.js';
import { Subject } from '../models/Subject.js';
import { Exam } from '../models/Exam.js';
import { AIConversation } from '../models/AIConversation.js';

async function runE2ETests() {
  console.log('====================================================');
  console.log('🧪 RUNNING AI STUDY ASSISTANT E2E INTEGRATION TESTS');
  console.log('====================================================\n');

  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    // Cleanup prior test data
    const testEmail = `assistant.test.${Date.now()}@studystick.ai`;
    await User.deleteMany({ email: /assistant\.test/ });

    // 1. Create Test User & Generate Auth Token
    console.log('\n--- Step 1: User Registration & Auth Token ---');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('TestPass123!', salt);
    const testUser = await User.create({
      name: 'Ananya Roy',
      email: testEmail,
      password: hashedPassword,
      isEmailVerified: true,
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'TestPass123!',
    });

    if (loginRes.status !== 200 || !loginRes.body.data?.accessToken) {
      throw new Error(`Login failed with status ${loginRes.status}`);
    }
    const token = loginRes.body.data.accessToken;
    console.log('✅ Authenticated successfully. Bearer Token acquired.');

    // 2. Create Student Profile, Subject, and Exam Records
    console.log('\n--- Step 2: Seeding Academic Profile (DBMS Subject & Exam) ---');
    await Profile.create({
      userId: testUser._id,
      collegeName: 'IIT Delhi',
      branch: 'Computer Science',
      currentSemester: 5,
    });

    const dbmsSubject = await Subject.create({
      userId: testUser._id,
      name: 'Database Management Systems',
      code: 'CS503',
      credits: 4,
      syllabusProgress: 35,
      category: 'college_core',
    });

    const dbmsExam = await Exam.create({
      userId: testUser._id,
      subjectId: dbmsSubject._id,
      title: 'DBMS Midterm Examination',
      examType: 'college_midterm',
      examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days away
      targetScore: 85,
    });
    console.log(`✅ Seeded Profile: Subject "${dbmsSubject.name}" & Exam "${dbmsExam.title}" (Due in 5 days).`);

    // 3. Unauthorized Access Rejection Check
    console.log('\n--- Step 3: Security Check - Reject Unauthorized Requests ---');
    const unauthRes = await request(app).get('/api/ai/conversations');
    if (unauthRes.status === 401) {
      console.log('✅ Unauthorized request correctly rejected with HTTP 401.');
    } else {
      throw new Error(`Expected HTTP 401 for unauthorized request, got ${unauthRes.status}`);
    }

    // 4. Create AI Conversation Session
    console.log('\n--- Step 4: Create AI Conversation Session ---');
    const createConvRes = await request(app)
      .post('/api/ai/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'DBMS Prep Strategy Session',
        tutorMode: 'explain',
      });

    if (createConvRes.status !== 201) {
      throw new Error(`Failed to create conversation: ${createConvRes.body.message}`);
    }
    const convId = createConvRes.body.data._id;
    console.log(`✅ Conversation created: ID=${convId}, Mode=${createConvRes.body.data.tutorMode}`);

    // 5. Send Chat Message through AI Orchestrator
    console.log('\n--- Step 5: Send Student Query to AI Assistant Endpoint ---');
    const chatRes = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'How should I prepare for DBMS?',
        conversationId: convId,
        tutorMode: 'explain',
      });

    // Check if configuration error or real response
    if (chatRes.status === 503) {
      console.log(`ℹ️ Config status 503 expected when API key is unconfigured: "${chatRes.body.message}"`);
    } else if (chatRes.status === 200) {
      console.log('✅ AI Orchestrator processed request and returned response successfully.');
      console.log(`   Provider: ${chatRes.body.data.provider}`);
      console.log(`   Model: ${chatRes.body.data.model}`);
    } else {
      throw new Error(`Chat API error (${chatRes.status}): ${chatRes.body.message}`);
    }

    // 6. Verify Conversation Persistence in DB
    console.log('\n--- Step 6: Verify Conversation Persistence Across Sessions ---');
    const getConvRes = await request(app)
      .get(`/api/ai/conversations/${convId}`)
      .set('Authorization', `Bearer ${token}`);

    if (getConvRes.status === 200 && getConvRes.body.data._id === convId) {
      console.log(`✅ Conversation persisted in MongoDB with ${getConvRes.body.data.messages.length} messages.`);
    } else {
      throw new Error('Failed to retrieve persisted conversation from DB');
    }

    // 7. Update / Rename Conversation
    console.log('\n--- Step 7: Rename & Update Session ---');
    const patchRes = await request(app)
      .patch(`/api/ai/conversations/${convId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'DBMS Exam Sprint Prep' });

    if (patchRes.status === 200 && patchRes.body.data.title === 'DBMS Exam Sprint Prep') {
      console.log('✅ Conversation renamed successfully.');
    } else {
      throw new Error('Failed to update conversation title');
    }

    console.log('\n====================================================');
    console.log('🎉 ALL AI ASSISTANT E2E INTEGRATION TESTS PASSED!');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ E2E test failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runE2ETests();
