"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = 'test_runner';
const supertest_1 = __importDefault(require("supertest"));
const server_js_1 = __importDefault(require("../server.js"));
const User_js_1 = require("../models/User.js");
const token_js_1 = require("../utils/token.js");
const db_js_1 = require("../config/db.js");
const Task_js_1 = require("../models/Task.js");
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const StudySession_js_1 = require("../models/StudySession.js");
const ProgrammingProgress_js_1 = require("../models/ProgrammingProgress.js");
const LearningPath_js_1 = require("../models/LearningPath.js");
const Flashcard_js_1 = require("../models/Flashcard.js");
async function runTests() {
    await (0, db_js_1.connectDB)();
    const existingU1 = await User_js_1.User.findOne({ email: 'student1@example.com' });
    if (existingU1) {
        await Task_js_1.Task.deleteMany({ userId: existingU1._id });
        await SleepSchedule_js_1.SleepSchedule.deleteMany({ userId: existingU1._id });
        await TimetableSlot_js_1.TimetableSlot.deleteMany({ userId: existingU1._id });
        await StudySession_js_1.StudySession.deleteMany({ userId: existingU1._id });
        await ProgrammingProgress_js_1.ProgrammingProgress.deleteMany({ userId: existingU1._id });
        await LearningPath_js_1.LearningPath.deleteMany({ userId: existingU1._id });
        await Flashcard_js_1.FlashcardDeck.deleteMany({ userId: existingU1._id });
        await Flashcard_js_1.Flashcard.deleteMany({ userId: existingU1._id });
        await User_js_1.User.deleteOne({ _id: existingU1._id });
    }
    const u1 = await User_js_1.User.create({
        name: 'Student One',
        email: 'student1@example.com',
        password: 'password123',
        isEmailVerified: true
    });
    const token = (0, token_js_1.generateAccessToken)({ userId: u1._id.toString(), email: u1.email });
    const auth = `Bearer ${token}`;
    let passed = 0;
    let failed = 0;
    const test = async (name, fn) => {
        try {
            await fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        }
        catch (e) {
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
            const taskRes = await (0, supertest_1.default)(server_js_1.default).post('/api/tasks').set('Authorization', auth).send({
                title: 'Phase 10 E2E Task',
                taskType: 'assignment',
                priority: 'high',
                dueDate: now.toISOString(),
                estimatedHours: 2,
            });
            if (taskRes.status !== 201)
                throw new Error('Task creation failed');
            const sleepRes = await (0, supertest_1.default)(server_js_1.default).put('/api/sleep').set('Authorization', auth).send({
                bedTime: '23:00',
                wakeTime: '07:00',
                targetSleepHours: 8,
            });
            if (sleepRes.status !== 200)
                throw new Error('Sleep configuration failed');
            const todayDay = new Date().getDay() === 0 ? 7 : new Date().getDay();
            const slotRes = await (0, supertest_1.default)(server_js_1.default).post('/api/timetable').set('Authorization', auth).send({
                dayOfWeek: todayDay,
                startTime: '10:00',
                endTime: '12:00',
                slotType: 'college_lecture',
                title: 'Maths Lecture'
            });
            if (slotRes.status !== 201)
                throw new Error('Timetable slot creation failed');
        });
        // 2. Generate a daily study plan & 3. Verify fixed timetable constraints.
        let sessionId = '';
        await test('Generate daily study plan and verify constraints', async () => {
            const planRes = await (0, supertest_1.default)(server_js_1.default).post('/api/planner/generate').set('Authorization', auth);
            if (planRes.status !== 200)
                throw new Error('Failed to generate plan');
            const sessions = planRes.body.data;
            if (sessions.length === 0)
                throw new Error('No sessions generated for the task');
            const taskSession = sessions.find((s) => s.title.includes('Phase 10 E2E Task'));
            if (!taskSession)
                throw new Error('Task was not prioritized into a session');
            const sessionStartHour = new Date(taskSession.startTime).getHours();
            if (sessionStartHour < 7)
                throw new Error('Session scheduled during sleep time');
            if (sessionStartHour >= 10 && sessionStartHour < 12)
                throw new Error('Session scheduled during timetable slot');
            sessionId = taskSession._id;
        });
        // 4. Complete a planned session.
        await test('Complete a planned session', async () => {
            const res = await (0, supertest_1.default)(server_js_1.default).put(`/api/planner/sessions/${sessionId}/status`).set('Authorization', auth).send({ status: 'completed' });
            if (res.status !== 200 || res.body.data.status !== 'completed')
                throw new Error('Failed to mark session as completed');
        });
        // 5. Record a programming attempt and verify progress.
        await test('Record programming attempt', async () => {
            await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', auth).send({ topic: 'Variables and data types', isCorrect: false });
            await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', auth).send({ topic: 'Variables and data types', isCorrect: false });
            await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', auth).send({ topic: 'Variables and data types', isCorrect: false });
            const dash = await (0, supertest_1.default)(server_js_1.default).get('/api/progress/dashboard').set('Authorization', auth);
            const data = dash.body.data.find((d) => d.topic === 'Variables and data types');
            if (!data || data.mastery !== 0)
                throw new Error('Progress not correctly updated');
        });
        // 6. Accept a learning-path recommendation.
        let lpRecId = '';
        await test('Generate and Accept LP recommendation', async () => {
            const lpRes = await (0, supertest_1.default)(server_js_1.default).get('/api/learning-path').set('Authorization', auth);
            if (lpRes.status !== 200)
                throw new Error('Failed to generate learning path');
            const recs = lpRes.body.data.path.recommendations;
            const pending = recs.find((r) => r.status === 'pending');
            if (!pending)
                throw new Error('No pending recommendation created based on weak progress');
            lpRecId = pending._id;
            const acceptRes = await (0, supertest_1.default)(server_js_1.default).patch(`/api/learning-path/recommendation/${lpRecId}`).set('Authorization', auth).send({ status: 'accepted' });
            if (acceptRes.status !== 200)
                throw new Error('Failed to accept LP recommendation');
        });
        // 7. Generate and review a flashcard.
        await test('Create deck and review flashcard', async () => {
            const deckRes = await (0, supertest_1.default)(server_js_1.default).post('/api/flashcards/decks').set('Authorization', auth).send({ title: 'E2E Deck' });
            const deckId = deckRes.body.data._id;
            const cardRes = await (0, supertest_1.default)(server_js_1.default).post('/api/flashcards/cards').set('Authorization', auth).send({
                deckId,
                front: 'What is a variable?',
                back: 'A storage location',
                programmingTopic: 'Variables and data types'
            });
            const cardId = cardRes.body.data._id;
            const reviewRes = await (0, supertest_1.default)(server_js_1.default).post(`/api/flashcards/cards/${cardId}/review`).set('Authorization', auth).send({
                rating: 'Good'
            });
            if (reviewRes.status !== 200)
                throw new Error('Failed to review flashcard');
        });
        // 8. Mark a session missed and reschedule it.
        await test('Miss and reschedule session', async () => {
            // First, create a new session manually for testing the reschedule endpoint since the other is completed.
            const now = new Date();
            const testSession = await StudySession_js_1.StudySession.create({
                userId: u1._id,
                title: 'Temporary Session to Miss',
                sessionType: 'task',
                startTime: new Date(now.getTime() - 60000), // Started 1 min ago
                endTime: new Date(now.getTime() + 60000), // Ends in 1 min
                durationMinutes: 60,
                status: 'planned'
            });
            const missRes = await (0, supertest_1.default)(server_js_1.default).put(`/api/planner/sessions/${testSession._id}/status`).set('Authorization', auth).send({ status: 'missed' });
            if (missRes.status !== 200 || missRes.body.data.status !== 'missed')
                throw new Error('Failed to miss session');
            const rescheduleRes = await (0, supertest_1.default)(server_js_1.default).post(`/api/planner/sessions/${testSession._id}/reschedule`).set('Authorization', auth);
            if (rescheduleRes.status !== 200)
                throw new Error('Failed to reschedule session');
            if (rescheduleRes.body.data.status !== 'planned' || rescheduleRes.body.data.title !== 'Temporary Session to Miss')
                throw new Error('Rescheduled session data incorrect');
        });
        // 9. Regenerate the plan & 10. Confirm historical records remain intact.
        await test('Regenerate plan & verify history intact', async () => {
            await (0, supertest_1.default)(server_js_1.default).post('/api/planner/generate').set('Authorization', auth);
            const dashRes = await (0, supertest_1.default)(server_js_1.default).get('/api/planner/dashboard').set('Authorization', auth);
            const allSessions = dashRes.body.data.sessions;
            const completedSession = allSessions.find((s) => s._id.toString() === sessionId);
            if (!completedSession)
                throw new Error('Completed session was erased during regeneration!');
            if (completedSession.status !== 'completed')
                throw new Error('Completed session status was mutated!');
            const missedSession = allSessions.find((s) => s.title === 'Temporary Session to Miss' && s.status === 'missed');
            if (!missedSession)
                throw new Error('Missed session history was erased!');
        });
    }
    finally {
        console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
        if (failed > 0)
            process.exit(1);
        process.exit(0);
    }
}
runTests();
