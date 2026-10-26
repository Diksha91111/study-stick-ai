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
const token_js_1 = require("../utils/token.js");
const db_js_1 = require("../config/db.js");
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
    await User_js_1.User.deleteMany({ email: { $in: ['student1@example.com', 'student2@example.com'] } });
    const u1 = await User_js_1.User.create({
        name: 'Student One',
        email: 'student1@example.com',
        password: 'password123',
        isEmailVerified: true
    });
    const token1 = (0, token_js_1.generateAccessToken)({ userId: u1._id.toString(), email: u1.email });
    const u2 = await User_js_1.User.create({
        name: 'Student Two',
        email: 'student2@example.com',
        password: 'password123',
        isEmailVerified: true
    });
    const token2 = (0, token_js_1.generateAccessToken)({ userId: u2._id.toString(), email: u2.email });
    try {
        // 1. Empty state
        let res = await (0, supertest_1.default)(server_js_1.default).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
        if (res.body.data && res.body.data.length === 0)
            pass('Empty State', 'Dashboard returns empty array initially');
        else
            fail('Empty State', 'Did not return empty array');
        // 2. Record progress calculations
        await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Variables and data types', isCorrect: true });
        res = await (0, supertest_1.default)(server_js_1.default).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
        if (res.body.data[0].attempts === 1 && res.body.data[0].mastery === null && res.body.data[0].status === 'Not enough data') {
            pass('Calculations < 3 attempts', 'Mastery is null, status is Not enough data');
        }
        else
            fail('Calculations < 3 attempts', 'Incorrect state');
        await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Variables and data types', isCorrect: false });
        await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Variables and data types', isCorrect: true, hintUsed: true });
        res = await (0, supertest_1.default)(server_js_1.default).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
        if (res.body.data[0].attempts === 3 && res.body.data[0].mastery === 67 && res.body.data[0].status === 'Practicing') {
            pass('Calculations >= 3 attempts', 'Mastery calculated correctly, status updated');
        }
        else
            fail('Calculations >= 3 attempts', 'Incorrect state');
        // 3. Duplicate event handling
        const eventId = 'unique-event-123';
        await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Arrays and strings', isCorrect: true, eventId });
        await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Arrays and strings', isCorrect: true, eventId });
        res = await (0, supertest_1.default)(server_js_1.default).get('/api/progress/dashboard').set('Authorization', `Bearer ${token1}`);
        const arraysTopic = res.body.data.find((d) => d.topic === 'Arrays and strings');
        if (arraysTopic.attempts === 1) {
            pass('Duplicate Events', 'Ignored event with duplicate eventId');
        }
        else
            fail('Duplicate Events', 'Counted duplicate event');
        // 4. User Isolation
        res = await (0, supertest_1.default)(server_js_1.default).get('/api/progress/dashboard').set('Authorization', `Bearer ${token2}`);
        if (res.body.data.length === 0)
            pass('User Isolation', 'User 2 cannot see User 1 progress');
        else
            fail('User Isolation', 'Data leaked to User 2');
        // 5. Invalid Data
        res = await (0, supertest_1.default)(server_js_1.default).post('/api/progress/record').set('Authorization', `Bearer ${token1}`).send({ topic: 'Invalid Topic', isCorrect: true });
        if (res.status === 500 || res.status === 400)
            pass('Invalid Data', 'Rejected invalid topic');
        else
            fail('Invalid Data', 'Accepted invalid topic');
    }
    catch (e) {
        console.error(e);
        fail('Tests Execution', e.message);
    }
    await User_js_1.User.deleteMany({ email: { $in: ['student1@example.com', 'student2@example.com'] } });
    await ProgrammingProgress_js_1.ProgrammingProgress.deleteMany({});
    mongoose_1.default.disconnect();
}
async function main() {
    console.log('\n================================================================');
    console.log('🤖 STUDY STICK AI - PROGRESS TRACKER VERIFICATION');
    console.log('================================================================\n');
    await runTests();
    const failed = results.filter(r => r.status === 'FAILED').length;
    if (failed > 0)
        process.exit(1);
}
main();
