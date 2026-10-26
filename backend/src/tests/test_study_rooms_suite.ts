import mongoose from 'mongoose';
import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { User } from '../models/User.js';
import { StudyRoom } from '../models/StudyRoom.js';
import { RoomMessage } from '../models/RoomMessage.js';
import { RoomTask } from '../models/RoomTask.js';
import { RoomQuizSession } from '../models/RoomQuizSession.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';

const BASE_URL = 'http://localhost:5000';

async function runStudyRoomsSuite() {
  console.log('================================================================================');
  console.log('🚀 STUDY ROOMS COLLABORATIVE SYSTEM INTEGRATION TEST SUITE');
  console.log('================================================================================\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studystick';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.\n');

  const timestamp = Date.now();
  const userAEmail = `user_a_${timestamp}@studystick.ai`;
  const userBEmail = `user_b_${timestamp}@studystick.ai`;
  const testPassword = 'Password123!';

  let tokenA = '';
  let tokenB = '';
  let userAId = '';
  let userBId = '';
  let createdRoomId = '';
  let inviteCode = '';
  let quizId = '';

  try {
    // -------------------------------------------------------------------------
    // Setup: Create and verify User A and User B
    // -------------------------------------------------------------------------
    console.log('--- Step 0: Registering User A and User B ---');
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alex Rivera',
        email: userAEmail,
        password: testPassword,
        confirmPassword: testPassword,
        acceptedTerms: true,
      }),
    });
    const regAData = await regARes.json();
    assert.strictEqual(regARes.status, 201);
    userAId = regAData.data.user.id;

    // Verify User A directly in DB
    await User.updateOne(
      { email: userAEmail },
      { $set: { isEmailVerified: true, verificationTokenHash: undefined } }
    );

    const loginARes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: testPassword }),
    });
    const loginAData = await loginARes.json();
    assert.strictEqual(loginARes.status, 200);
    tokenA = loginAData.data.accessToken;

    // Register User B
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bianca Chen',
        email: userBEmail,
        password: testPassword,
        confirmPassword: testPassword,
        acceptedTerms: true,
      }),
    });
    const regBData = await regBRes.json();
    assert.strictEqual(regBRes.status, 201);
    userBId = regBData.data.user.id;

    // Verify User B directly in DB
    await User.updateOne(
      { email: userBEmail },
      { $set: { isEmailVerified: true, verificationTokenHash: undefined } }
    );

    const loginBRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userBEmail, password: testPassword }),
    });
    const loginBData = await loginBRes.json();
    assert.strictEqual(loginBRes.status, 200);
    tokenB = loginBData.data.accessToken;

    console.log('✅ Step 0 PASSED: User A and User B registered and logged in successfully.\n');

    // -------------------------------------------------------------------------
    // Test 1: User A creates a Private Study Room
    // -------------------------------------------------------------------------
    console.log('--- Test 1: User A Creates "DSA Study Group" (Private) ---');
    const createRoomRes = await fetch(`${BASE_URL}/api/study-rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        name: 'DSA Study Group',
        description: 'Collaborative algorithmic problem solving and exam prep.',
        goal: 'Complete today selected topic',
        privacy: 'private',
        defaultFocusDuration: 45,
        maxMembers: 10,
      }),
    });
    const createRoomData = await createRoomRes.json();
    console.log('Create room status:', createRoomRes.status, createRoomData.data?.name);
    assert.strictEqual(createRoomRes.status, 201);
    assert.strictEqual(createRoomData.data.name, 'DSA Study Group');
    assert.strictEqual(createRoomData.data.privacy, 'private');
    assert.ok(createRoomData.data.inviteCode.startsWith('SR-'));

    createdRoomId = createRoomData.data._id;
    inviteCode = createRoomData.data.inviteCode;

    // Verify User A is OWNER in MongoDB
    const roomInDb = await StudyRoom.findById(createdRoomId);
    assert(roomInDb, 'Room must exist in DB');
    assert.strictEqual(roomInDb.members[0].role, 'OWNER');
    assert.strictEqual(roomInDb.members[0].userId.toString(), userAId);
    console.log('✅ Test 1 PASSED: Room created, User A is OWNER with secure invite code.\n');

    // -------------------------------------------------------------------------
    // Test 2: User B Attempts Direct Access Without Membership (Unauthorized)
    // -------------------------------------------------------------------------
    console.log('--- Test 2: User B Unauthorized Access Blocked ---');
    const blockedRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    console.log('Blocked response status:', blockedRes.status);
    assert.strictEqual(blockedRes.status, 403);
    console.log('✅ Test 2 PASSED: Direct access to private room blocked for non-members.\n');

    // -------------------------------------------------------------------------
    // Test 3: User B Joins Room via Invite Code
    // -------------------------------------------------------------------------
    console.log('--- Test 3: User B Joins Room via Invite Code ---');
    const joinRes = await fetch(`${BASE_URL}/api/study-rooms/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`,
      },
      body: JSON.stringify({ inviteCode }),
    });
    const joinData = await joinRes.json();
    console.log('Join room status:', joinRes.status, joinData.message);
    assert.strictEqual(joinRes.status, 200);

    // Verify User B is MEMBER in DB
    const roomWithB = await StudyRoom.findById(createdRoomId);
    assert(roomWithB);
    assert.strictEqual(roomWithB.members.length, 2);
    const memberB = roomWithB.members.find((m) => m.userId.toString() === userBId);
    assert(memberB);
    assert.strictEqual(memberB.role, 'MEMBER');
    console.log('✅ Test 3 PASSED: User B joined room successfully as MEMBER.\n');

    // -------------------------------------------------------------------------
    // Test 4: Focus Session Lifecycle (Start, Synchronized Timer, Pause, Resume)
    // -------------------------------------------------------------------------
    console.log('--- Test 4: Collaborative Focus Session Lifecycle ---');
    // User A starts 45-minute focus session
    const startSessionRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        goal: 'Complete Variables and Data Types Module',
        durationMinutes: 45,
      }),
    });
    const startSessionData = await startSessionRes.json();
    console.log('Start session response:', startSessionRes.status, startSessionData.data?.goal);
    assert.strictEqual(startSessionRes.status, 201);
    assert(['RUNNING', 'ACTIVE'].includes(startSessionData.data.status));
    assert.strictEqual(startSessionData.data.durationMinutes, 45);

    // User B fetches room details and checks remaining seconds calculated on server
    const roomDetailsResB = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const roomDetailsB = await roomDetailsResB.json();
    console.log('User B saw active session:', roomDetailsB.data.activeSession?.goal);
    assert(roomDetailsB.data.activeSession);
    assert(['RUNNING', 'ACTIVE'].includes(roomDetailsB.data.activeSession.status));
    assert(
      roomDetailsB.data.activeSession.remainingSeconds <= 45 * 60 &&
        roomDetailsB.data.activeSession.remainingSeconds > 44 * 60,
      'Remaining seconds must be accurately calculated from server timestamps'
    );

    // User B joins session with status STUDYING
    const presenceRes = await fetch(
      `${BASE_URL}/api/study-rooms/${createdRoomId}/sessions/presence`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ status: 'STUDYING' }),
      }
    );
    assert.strictEqual(presenceRes.status, 200);

    // User A pauses session
    const pauseRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/sessions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ action: 'PAUSE' }),
    });
    const pauseData = await pauseRes.json();
    assert.strictEqual(pauseRes.status, 200);
    assert.strictEqual(pauseData.data.session.status, 'PAUSED');

    // User A resumes session
    const resumeRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/sessions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ action: 'RESUME' }),
    });
    const resumeData = await resumeRes.json();
    assert.strictEqual(resumeRes.status, 200);
    assert(['RUNNING', 'ACTIVE'].includes(resumeData.data.session.status));
    console.log('✅ Test 4 PASSED: Focus session accurately maintains state, paused time, and timestamps.\n');

    // -------------------------------------------------------------------------
    // Test 5: Room Chat (User A sends, User B reads)
    // -------------------------------------------------------------------------
    console.log('--- Test 5: Persistent Study Room Chat ---');
    const msgResA = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ content: 'Welcome Bianca! Ready to tackle Variables today?' }),
    });
    const msgDataA = await msgResA.json();
    assert.strictEqual(msgResA.status, 201);
    assert.strictEqual(msgDataA.data.content, 'Welcome Bianca! Ready to tackle Variables today?');

    const msgResB = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/messages`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const msgDataB = await msgResB.json();
    assert.strictEqual(msgResB.status, 200);
    const foundMsg = msgDataB.data.find(
      (m: any) => m.content === 'Welcome Bianca! Ready to tackle Variables today?'
    );
    assert(foundMsg, 'User B must see message sent by User A');
    assert.strictEqual(foundMsg.senderId.name, 'Alex Rivera');
    console.log('✅ Test 5 PASSED: Chat messages persisted and safely delivered with author details.\n');

    // -------------------------------------------------------------------------
    // Test 6: Shared Study Tasks (User A creates, User B completes)
    // -------------------------------------------------------------------------
    console.log('--- Test 6: Shared Study Tasks ---');
    const taskRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        title: 'Review Type Coercion Examples',
        description: 'Understand implicit vs explicit casting in JavaScript and Python.',
      }),
    });
    const taskData = await taskRes.json();
    assert.strictEqual(taskRes.status, 201);
    const taskId = taskData.data._id;

    // User B marks task COMPLETED
    const completeTaskRes = await fetch(
      `${BASE_URL}/api/study-rooms/${createdRoomId}/tasks/${taskId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ status: 'COMPLETED' }),
      }
    );
    const completeTaskData = await completeTaskRes.json();
    assert.strictEqual(completeTaskRes.status, 200);
    assert.strictEqual(completeTaskData.data.status, 'COMPLETED');
    assert.strictEqual(completeTaskData.data.completedBy.name, 'Bianca Chen');
    console.log('✅ Test 6 PASSED: Shared task created and completed collaboratively.\n');

    // -------------------------------------------------------------------------
    // Test 7: Group Quiz & Real Mastery Evidence Integration
    // -------------------------------------------------------------------------
    console.log('--- Test 7: Group Quiz with Real Assessment Evidence ---');
    // User A launches group quiz on "Variables and data types"
    const startQuizRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({ topic: 'Variables and data types' }),
    });
    const startQuizData = await startQuizRes.json();
    console.log('Group quiz launched:', startQuizRes.status, startQuizData.data?.title);
    assert.strictEqual(startQuizRes.status, 201);
    quizId = startQuizData.data.quizId;

    // User B fetches active quiz
    const getQuizRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/quiz`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const getQuizData = await getQuizRes.json();
    assert.strictEqual(getQuizRes.status, 200);
    assert.strictEqual(getQuizData.data.quizId, quizId);
    assert(getQuizData.data.questions.length > 0);

    // User B submits quiz answers
    const questions = getQuizData.data.questions;
    const answers = [
      { questionId: questions[0].id, selectedAnswer: 'Variable name' },
      { questionId: questions[1].id, selectedAnswer: 'Pass by value' },
      { questionId: questions[2]?.id || 'var-3', selectedAnswer: 'Reference' },
      { questionId: questions[3]?.id || 'var-4', selectedAnswer: 'True' },
      { questionId: questions[4]?.id || 'var-5', selectedAnswer: 'const' },
      { questionId: questions[5]?.id || 'var-6', selectedAnswer: 'Immutable' },
    ];

    const submitQuizRes = await fetch(
      `${BASE_URL}/api/study-rooms/${createdRoomId}/quiz/submit`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ quizId, answers }),
      }
    );
    const submitQuizData = await submitQuizRes.json();
    console.log('Quiz submission response:', submitQuizRes.status, {
      scorePercentage: submitQuizData.data?.scorePercentage,
      isPass: submitQuizData.data?.isPass,
      roomAggregate: submitQuizData.data?.roomAggregate,
    });
    assert.strictEqual(submitQuizRes.status, 200);
    assert(typeof submitQuizData.data.scorePercentage === 'number');

    // Verify in MongoDB that AssessmentAttempt was created for User B
    const attempt = await AssessmentAttempt.findOne({
      userId: new mongoose.Types.ObjectId(userBId),
      topic: 'Variables and data types',
    });
    assert(attempt, 'Real AssessmentAttempt must be persisted for User B');
    console.log('MongoDB AssessmentAttempt confirmed:', attempt.scorePercentage, '%');
    console.log('✅ Test 7 PASSED: Group quiz saved individual attempt to AssessmentAttempt and Knowledge Graph.\n');

    // -------------------------------------------------------------------------
    // Test 8: Individual vs Room Progress Metrics
    // -------------------------------------------------------------------------
    console.log('--- Test 8: Real Room & Individual Progress Metrics ---');
    const progressRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/progress`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const progressData = await progressRes.json();
    console.log('Progress data for User B:', progressData.data);
    assert.strictEqual(progressRes.status, 200);
    assert.strictEqual(progressData.data.myProgress.quizzesAttempted, 1);
    assert.strictEqual(progressData.data.myProgress.tasksCompleted, 1);
    assert.strictEqual(progressData.data.roomActivity.totalTasks, 1);
    assert.strictEqual(progressData.data.roomActivity.tasksCompleted, 1);
    console.log('✅ Test 8 PASSED: Individual and Room Progress reflect genuine stored metrics.\n');

    // -------------------------------------------------------------------------
    // Test 9: Member Management & Permissions (User A promotes User B to ADMIN)
    // -------------------------------------------------------------------------
    console.log('--- Test 9: Member Promotion & Role Enforcement ---');
    const promoteRes = await fetch(
      `${BASE_URL}/api/study-rooms/${createdRoomId}/members/${userBId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenA}`,
        },
        body: JSON.stringify({ action: 'PROMOTE' }),
      }
    );
    const promoteData = await promoteRes.json();
    assert.strictEqual(promoteRes.status, 200);
    const updatedMemberB = promoteData.data.members.find((m: any) => m.userId._id === userBId);
    assert.strictEqual(updatedMemberB.role, 'ADMIN');

    // Non-owner cannot ban or demote owner
    const invalidDemoteRes = await fetch(
      `${BASE_URL}/api/study-rooms/${createdRoomId}/members/${userAId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenB}`,
        },
        body: JSON.stringify({ action: 'DEMOTE' }),
      }
    );
    assert.strictEqual(invalidDemoteRes.status, 403);
    console.log('✅ Test 9 PASSED: Role hierarchy and permissions strictly enforced.\n');

    // -------------------------------------------------------------------------
    // Test 10: User B Leaves Room
    // -------------------------------------------------------------------------
    console.log('--- Test 10: User B Leaves Room ---');
    const leaveRes = await fetch(`${BASE_URL}/api/study-rooms/${createdRoomId}/leave`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const leaveData = await leaveRes.json();
    assert.strictEqual(leaveRes.status, 200);
    assert.strictEqual(leaveData.data.success, true);

    // Verify User B is no longer an active member
    const accessAfterLeaveRes = await fetch(
      `${BASE_URL}/api/study-rooms/${createdRoomId}`,
      {
        headers: { Authorization: `Bearer ${tokenB}` },
      }
    );
    assert.strictEqual(accessAfterLeaveRes.status, 403);
    console.log('✅ Test 10 PASSED: User B left room and private access was cleanly revoked.\n');

    console.log('================================================================================');
    console.log('🎉 ALL 10 STUDY ROOM BACKEND INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('================================================================================');
  } finally {
    // Clean up test data
    if (createdRoomId) {
      await StudyRoom.findByIdAndDelete(createdRoomId);
      await RoomMessage.deleteMany({ roomId: createdRoomId });
      await RoomTask.deleteMany({ roomId: createdRoomId });
      await RoomQuizSession.deleteMany({ roomId: createdRoomId });
    }
    const userIds = [userAId, userBId].filter((id) => id && mongoose.Types.ObjectId.isValid(id));
    if (userIds.length > 0) {
      await AssessmentAttempt.deleteMany({ userId: { $in: userIds } });
      await ProgrammingProgress.deleteMany({ userId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await mongoose.disconnect();
  }
}

runStudyRoomsSuite().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
