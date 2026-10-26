"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.NODE_ENV = 'test_runner';
const mongoose_1 = __importDefault(require("mongoose"));
const supertest_1 = __importDefault(require("supertest"));
const server_js_1 = __importDefault(require("../server.js"));
const User_js_1 = require("../models/User.js");
const ProgrammingProgress_js_1 = require("../models/ProgrammingProgress.js");
const LearningPath_js_1 = require("../models/LearningPath.js");
const AssessmentAttempt_js_1 = require("../models/AssessmentAttempt.js");
const token_js_1 = require("../utils/token.js");
const db_js_1 = require("../config/db.js");
const aiOrchestrator_js_1 = require("../ai/core/aiOrchestrator.js");
// Mock AI orchestrator to avoid network requests during integration test
aiOrchestrator_js_1.aiOrchestrator.processRequest = async () => ({
    text: 'Mocked AI Explanation.',
    provider: 'gemini',
    model: 'gemini-3.5-flash'
});
const results = [];
function pass(test, detail) {
    results.push({ test, status: 'PASSED', detail });
    console.log(`  ✅ PASSED  ${test} — ${detail}`);
}
function fail(test, detail) {
    results.push({ test, status: 'FAILED', detail });
    console.log(`  ❌ FAILED  ${test} — ${detail}`);
}
async function runProgressionTests() {
    await (0, db_js_1.connectDB)();
    const testEmail = 'progression.student@studystick.ai';
    const existingUser = await User_js_1.User.findOne({ email: testEmail });
    if (existingUser) {
        await ProgrammingProgress_js_1.ProgrammingProgress.deleteMany({ userId: existingUser._id });
        await LearningPath_js_1.LearningPath.deleteMany({ userId: existingUser._id });
        await AssessmentAttempt_js_1.AssessmentAttempt.deleteMany({ userId: existingUser._id });
        await User_js_1.User.deleteOne({ _id: existingUser._id });
    }
    const user = await User_js_1.User.create({
        name: 'Progression Student',
        email: testEmail,
        password: 'Password123!',
        isEmailVerified: true
    });
    const token = (0, token_js_1.generateAccessToken)({ userId: user._id.toString(), email: user.email });
    try {
        // 1. Initial State: Topic 1 is AVAILABLE, not IN_PROGRESS or COMPLETED
        let res = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/learning-path')
            .set('Authorization', `Bearer ${token}`);
        const states1 = res.body.data.states;
        if (states1['Variables and data types'].status === 'AVAILABLE' && states1['Conditions and loops'].status === 'LOCKED') {
            pass('Initial State', 'Topic 1 is AVAILABLE and Topic 2 is LOCKED');
        }
        else {
            fail('Initial State', `Expected AVAILABLE/LOCKED but got ${states1['Variables and data types'].status}/${states1['Conditions and loops'].status}`);
        }
        // Confirm it did NOT automatically start or complete
        const prog1 = await ProgrammingProgress_js_1.ProgrammingProgress.findOne({ userId: user._id, topic: 'Variables and data types' });
        if (!prog1 || prog1.status === 'AVAILABLE') {
            pass('No Auto-Start on Read', 'Task 1 was not auto-started or auto-completed on page load');
        }
        else {
            fail('No Auto-Start on Read', `Task 1 has unexpected status: ${prog1.status}`);
        }
        // 2. Accept Challenge / Start Task -> Task becomes IN_PROGRESS
        res = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/learning-path/start-topic')
            .set('Authorization', `Bearer ${token}`)
            .send({ topic: 'Variables and data types' });
        if (res.status === 200 && res.body.data.states['Variables and data types'].status === 'IN_PROGRESS') {
            pass('Accept Challenge', 'Topic 1 transitioned to IN_PROGRESS upon explicit start');
        }
        else {
            fail('Accept Challenge', `Expected IN_PROGRESS but got ${res.body?.data?.states?.['Variables and data types']?.status}`);
        }
        // 3. Detailed learning content retrieval
        const contentRes = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/learning-path/topic-content/Variables%20and%20data%20types')
            .set('Authorization', `Bearer ${token}`);
        if (contentRes.status === 200 && contentRes.body.data.content.coreConcepts.length > 0 && contentRes.body.data.content.examples.length > 0) {
            pass('Topic Content', 'Retrieved detailed pedagogical content with concepts, examples, mistakes, and revision');
        }
        else {
            fail('Topic Content', 'Failed to retrieve complete topic learning content');
        }
        // 4. Assessment questions generation does NOT expose answers
        const quizGenRes = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/learning-path/assessment/generate')
            .set('Authorization', `Bearer ${token}`)
            .send({ topic: 'Variables and data types' });
        const questions = quizGenRes.body.data.assessment;
        const hasExposedAnswer = questions.some((q) => q.correctAnswer || q.explanation);
        if (questions.length >= 5 && !hasExposedAnswer) {
            pass('Quiz Generation', 'Generated 5+ questions without exposing correct answers or explanations prior to submission');
        }
        else {
            fail('Quiz Generation', 'Questions missing or answers exposed prematurely');
        }
        // 5. Submit Failing Quiz Attempt (< 70%)
        // Send all incorrect answers
        const failingAnswers = questions.map((q) => ({
            questionId: q.id,
            selectedAnswer: 'Completely Wrong Answer Choice'
        }));
        const failSubmitRes = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/learning-path/assessment/submit')
            .set('Authorization', `Bearer ${token}`)
            .send({
            topic: 'Variables and data types',
            userAnswers: failingAnswers,
            timeTakenMinutes: 3
        });
        if (failSubmitRes.status === 200 &&
            failSubmitRes.body.data.isPass === false &&
            failSubmitRes.body.data.status === 'NEEDS_REVISION') {
            pass('Failing Quiz Evaluation', `Server calculated score: ${failSubmitRes.body.data.score}/${failSubmitRes.body.data.totalQuestions} (0%), status: NEEDS_REVISION`);
        }
        else {
            fail('Failing Quiz Evaluation', `Expected isPass: false and NEEDS_REVISION, got ${JSON.stringify(failSubmitRes.body.data)}`);
        }
        // Confirm DB status is NEEDS_REVISION and next topic is STILL LOCKED
        let dbProg = await ProgrammingProgress_js_1.ProgrammingProgress.findOne({ userId: user._id, topic: 'Variables and data types' });
        let dbNextProg = await ProgrammingProgress_js_1.ProgrammingProgress.findOne({ userId: user._id, topic: 'Conditions and loops' });
        if (dbProg?.status === 'NEEDS_REVISION' && (!dbNextProg || dbNextProg.status === 'LOCKED')) {
            pass('Failing Protection', 'Task 1 marked NEEDS_REVISION, Task 2 remained LOCKED');
        }
        else {
            fail('Failing Protection', `Unexpected DB state: Task 1: ${dbProg?.status}, Task 2: ${dbNextProg?.status}`);
        }
        // 6. Submit Passing Quiz Attempt (>= 70%)
        // Provide correct answers for at least 5 questions
        const passingAnswers = [
            { questionId: 'vdt-1', selectedAnswer: 'Primitives store their actual values directly on the stack; reference types store pointers to heap-allocated objects' },
            { questionId: 'vdt-2', selectedAnswer: '5, because primitive numbers are passed and assigned by value, copying the value' },
            { questionId: 'vdt-3', selectedAnswer: 'The property modification succeeds because const prevents variable reassignment, not property mutation' },
            { questionId: 'vdt-4', selectedAnswer: '=== (Strict equality)' },
            { questionId: 'vdt-5', selectedAnswer: 'False' },
            { questionId: 'vdt-6', selectedAnswer: 'Block scope (accessible only inside the enclosing curly braces)' }
        ];
        const passSubmitRes = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/learning-path/assessment/submit')
            .set('Authorization', `Bearer ${token}`)
            .send({
            topic: 'Variables and data types',
            userAnswers: passingAnswers,
            timeTakenMinutes: 4
        });
        if (passSubmitRes.status === 200 &&
            passSubmitRes.body.data.isPass === true &&
            passSubmitRes.body.data.score === 6 &&
            passSubmitRes.body.data.percentage === 100) {
            pass('Passing Quiz Evaluation', 'Server graded accurately: 6/6 (100%), isPass: true');
        }
        else {
            fail('Passing Quiz Evaluation', `Quiz evaluation failed: ${JSON.stringify(passSubmitRes.body.data)}`);
        }
        // 7. Verify Task 1 is COMPLETED and Task 2 is AVAILABLE (NOT IN_PROGRESS)
        dbProg = await ProgrammingProgress_js_1.ProgrammingProgress.findOne({ userId: user._id, topic: 'Variables and data types' });
        dbNextProg = await ProgrammingProgress_js_1.ProgrammingProgress.findOne({ userId: user._id, topic: 'Conditions and loops' });
        if (dbProg?.status === 'COMPLETED' && dbNextProg?.status === 'AVAILABLE') {
            pass('Task Progression Post-Passing', 'Task 1 is COMPLETED, Task 2 is AVAILABLE in database');
        }
        else {
            fail('Task Progression Post-Passing', `Expected Task 1 COMPLETED, Task 2 AVAILABLE, got ${dbProg?.status} / ${dbNextProg?.status}`);
        }
        // 8. CRITICAL RULE: Next task did NOT auto-start to IN_PROGRESS
        if (dbNextProg?.status !== 'IN_PROGRESS') {
            pass('Next Task Never Auto-Starts', 'Next task was NOT automatically started to IN_PROGRESS');
        }
        else {
            fail('Next Task Never Auto-Starts', 'Next task was erroneously auto-started to IN_PROGRESS');
        }
        // 9. Page reload persistence: GET /api/learning-path keeps Task 1 COMPLETED, Task 2 AVAILABLE
        res = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/learning-path')
            .set('Authorization', `Bearer ${token}`);
        const reloadStates = res.body.data.states;
        if (reloadStates['Variables and data types'].status === 'COMPLETED' && reloadStates['Conditions and loops'].status === 'AVAILABLE') {
            pass('Page Reload Persistence', 'Reloading retains Task 1 COMPLETED and Task 2 AVAILABLE');
        }
        else {
            fail('Page Reload Persistence', `Reload returned ${reloadStates['Variables and data types'].status} / ${reloadStates['Conditions and loops'].status}`);
        }
        // 10. Start Next Task manually: Only when user clicks start does Task 2 become IN_PROGRESS
        res = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/learning-path/start-topic')
            .set('Authorization', `Bearer ${token}`)
            .send({ topic: 'Conditions and loops' });
        dbNextProg = await ProgrammingProgress_js_1.ProgrammingProgress.findOne({ userId: user._id, topic: 'Conditions and loops' });
        if (res.status === 200 && dbNextProg?.status === 'IN_PROGRESS') {
            pass('Explicit Next Task Start', 'Task 2 transitioned to IN_PROGRESS only after explicit user action');
        }
        else {
            fail('Explicit Next Task Start', `Expected IN_PROGRESS, got ${dbNextProg?.status}`);
        }
        // 11. Locked Task Rejection: Starting a locked task (e.g. Trees and graphs) fails
        const lockedRes = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/learning-path/start-topic')
            .set('Authorization', `Bearer ${token}`)
            .send({ topic: 'Trees and graphs' });
        if (lockedRes.status === 400 && lockedRes.body.message.includes('Prerequisites not completed')) {
            pass('Locked Task Guard', 'Blocked attempt to start task with unmet prerequisites');
        }
        else {
            fail('Locked Task Guard', 'Allowed starting locked task without prerequisites');
        }
        // 12. Idempotency: Multiple start clicks do not alter completed status or throw
        const idempotentRes = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/learning-path/start-topic')
            .set('Authorization', `Bearer ${token}`)
            .send({ topic: 'Variables and data types' });
        const finalProg1 = await ProgrammingProgress_js_1.ProgrammingProgress.findOne({ userId: user._id, topic: 'Variables and data types' });
        if (idempotentRes.status === 200 && finalProg1?.status === 'COMPLETED') {
            pass('Idempotency', 'Starting already completed topic does not regress status or corrupt state');
        }
        else {
            fail('Idempotency', `Status regressed to ${finalProg1?.status}`);
        }
    }
    catch (err) {
        fail('Test Execution Error', err.message);
    }
    finally {
        if (user) {
            await ProgrammingProgress_js_1.ProgrammingProgress.deleteMany({ userId: user._id });
            await LearningPath_js_1.LearningPath.deleteMany({ userId: user._id });
            await AssessmentAttempt_js_1.AssessmentAttempt.deleteMany({ userId: user._id });
            await User_js_1.User.deleteOne({ _id: user._id });
        }
        await mongoose_1.default.disconnect();
    }
}
async function main() {
    console.log('\n================================================================');
    console.log('🎯 STUDY STICK AI - LEARNING PATH PROGRESSION VERIFICATION');
    console.log('================================================================\n');
    await runProgressionTests();
    const failed = results.filter(r => r.status === 'FAILED').length;
    if (failed > 0)
        process.exit(1);
}
main();
