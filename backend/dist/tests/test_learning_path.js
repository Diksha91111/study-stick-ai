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
const token_js_1 = require("../utils/token.js");
const db_js_1 = require("../config/db.js");
const aiOrchestrator_js_1 = require("../ai/core/aiOrchestrator.js");
const originalExecute_global = aiOrchestrator_js_1.aiOrchestrator.processRequest;
aiOrchestrator_js_1.aiOrchestrator.processRequest = async (req) => {
    return {
        text: 'Mocked AI Explanation.',
        provider: 'gemini',
        model: 'gemini-3.5-flash'
    };
};
const results = [];
function pass(test, detail) {
    results.push({ test, status: 'PASSED', detail });
    console.log(`  ✅ PASSED  ${test} — ${detail}`);
}
function fail(test, detail) {
    results.push({ test, status: 'FAILED', detail });
    console.log(`  ❌ FAILED  ${test} — ${detail}`);
}
async function runTests() {
    await (0, db_js_1.connectDB)();
    const existingU1 = await User_js_1.User.findOne({ email: 'student1@example.com' });
    if (existingU1) {
        await ProgrammingProgress_js_1.ProgrammingProgress.deleteMany({ userId: existingU1._id });
        await LearningPath_js_1.LearningPath.deleteMany({ userId: existingU1._id });
        await User_js_1.User.deleteOne({ _id: existingU1._id });
    }
    const u1 = await User_js_1.User.create({
        name: 'Student One',
        email: 'student1@example.com',
        password: 'password123',
        isEmailVerified: true
    });
    const token1 = (0, token_js_1.generateAccessToken)({ userId: u1._id.toString(), email: u1.email });
    try {
        // 1. Empty progress & Prerequisites
        let res = await (0, supertest_1.default)(server_js_1.default).get('/api/learning-path').set('Authorization', `Bearer ${token1}`);
        if (res.body.data && res.body.data.path.recommendations.length > 0) {
            const rec = res.body.data.path.recommendations[0];
            if (rec.topic === 'Variables and data types') {
                pass('Empty Progress & Prerequisites', 'Recommended base topic when no progress exists');
            }
            else
                fail('Empty Progress & Prerequisites', 'Did not recommend base topic');
        }
        else
            fail('Empty Progress & Prerequisites', 'No recommendation generated');
        // 2. Insufficient data
        await ProgrammingProgress_js_1.ProgrammingProgress.create({
            userId: u1._id,
            topic: 'Variables and data types',
            attempts: 2, // < 3 attempts
            correctAnswers: 2
        });
        // We should dismiss the current rec to force a new one
        const firstRec = res.body.data.path.recommendations[0];
        res = await (0, supertest_1.default)(server_js_1.default)
            .patch(`/api/learning-path/recommendation/${firstRec._id}`)
            .set('Authorization', `Bearer ${token1}`)
            .send({ status: 'completed' });
        // It should still recommend 'Variables and data types' because it's not mastered (insufficient data)
        const nextRec = res.body.data.path.recommendations.find((r) => r.status === 'pending');
        if (nextRec && nextRec.topic === 'Variables and data types') {
            pass('Insufficient Data', 'Did not consider topic mastered with < 3 attempts');
        }
        else
            fail('Insufficient Data', 'Considered topic mastered prematurely');
        // 3. Weak topics
        // Master Variables
        await ProgrammingProgress_js_1.ProgrammingProgress.findOneAndUpdate({ userId: u1._id, topic: 'Variables and data types' }, { attempts: 5, correctAnswers: 5 });
        // Add weak progress for Conditions
        await ProgrammingProgress_js_1.ProgrammingProgress.create({
            userId: u1._id,
            topic: 'Conditions and loops',
            attempts: 5,
            correctAnswers: 1, // < 50% mastery
            recentErrors: ['SyntaxError']
        });
        res = await (0, supertest_1.default)(server_js_1.default)
            .patch(`/api/learning-path/recommendation/${nextRec._id}`)
            .set('Authorization', `Bearer ${token1}`)
            .send({ status: 'completed' });
        const weakRec = res.body.data.path.recommendations.find((r) => r.status === 'pending');
        if (weakRec && weakRec.topic === 'Conditions and loops' && weakRec.reason.includes('Weak area')) {
            pass('Weak Topics', 'Prioritized weak topic in recommendations');
        }
        else
            fail('Weak Topics', 'Did not prioritize weak topic');
        // 4. AI quota fallback (Mocked)
        aiOrchestrator_js_1.aiOrchestrator.processRequest = async () => { throw new Error('Quota exceeded'); };
        // Accept current and dismiss to trigger new generation
        await (0, supertest_1.default)(server_js_1.default).patch(`/api/learning-path/recommendation/${weakRec._id}`).set('Authorization', `Bearer ${token1}`).send({ status: 'accepted' });
        res = await (0, supertest_1.default)(server_js_1.default).patch(`/api/learning-path/recommendation/${weakRec._id}`).set('Authorization', `Bearer ${token1}`).send({ status: 'dismissed' });
        const fallbackRec = res.body.data.path.recommendations.find((r) => r.status === 'pending');
        if (fallbackRec && fallbackRec.aiExplanation === 'Focusing on this topic will build a solid foundation for your overall programming goals.') {
            pass('AI Quota Fallback', 'Used deterministic explanation when AI failed');
        }
        else
            fail('AI Quota Fallback', 'Fallback failed');
        aiOrchestrator_js_1.aiOrchestrator.processRequest = originalExecute_global; // Restore
        // 5. Authorization
        res = await (0, supertest_1.default)(server_js_1.default).get('/api/learning-path');
        if (res.status === 401)
            pass('Authorization', 'Rejected request without token');
        else
            fail('Authorization', 'Allowed unauthorized request');
    }
    catch (e) {
        console.error(e);
        fail('Tests Execution', e.message);
    }
    if (u1) {
        await ProgrammingProgress_js_1.ProgrammingProgress.deleteMany({ userId: u1._id });
        await LearningPath_js_1.LearningPath.deleteMany({ userId: u1._id });
        await User_js_1.User.deleteOne({ _id: u1._id });
    }
    mongoose_1.default.disconnect();
}
async function main() {
    console.log('\n================================================================');
    console.log('🤖 STUDY STICK AI - LEARNING PATH VERIFICATION');
    console.log('================================================================\n');
    await runTests();
    const failed = results.filter(r => r.status === 'FAILED').length;
    if (failed > 0)
        process.exit(1);
}
main();
