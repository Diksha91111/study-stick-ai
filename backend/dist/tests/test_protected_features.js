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
const db_js_1 = require("../config/db.js");
const crypto_1 = __importDefault(require("crypto"));
const hashToken = (token) => crypto_1.default.createHash('sha256').update(token).digest('hex');
const results = [];
function record(name, passed, detail) {
    results.push({ name, passed, detail });
    const icon = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} [${name}]: ${detail}`);
}
async function run() {
    console.log('\n--- VERIFYING PROTECTED FEATURES WITH AUTH LIFECYCLE ---');
    await (0, db_js_1.connectDB)();
    const testEmail = `__protected_test_${Date.now()}@example.com`;
    const testPassword = 'ProtectedPass123!';
    try {
        // 1. Verify all protected endpoints return 401 when unauthenticated
        const unauthMe = await (0, supertest_1.default)(server_js_1.default).get('/api/auth/me');
        record('Unauthenticated /api/auth/me', unauthMe.status === 401, `Status: ${unauthMe.status}`);
        const unauthLP = await (0, supertest_1.default)(server_js_1.default).get('/api/learning-path');
        record('Unauthenticated /api/learning-path', unauthLP.status === 401, `Status: ${unauthLP.status}`);
        const unauthFlashcards = await (0, supertest_1.default)(server_js_1.default).get('/api/flashcards/decks');
        record('Unauthenticated /api/flashcards/decks', unauthFlashcards.status === 401, `Status: ${unauthFlashcards.status}`);
        const unauthAI = await (0, supertest_1.default)(server_js_1.default).get('/api/ai/providers');
        record('Unauthenticated /api/ai/providers', unauthAI.status === 401, `Status: ${unauthAI.status}`);
        const unauthProgress = await (0, supertest_1.default)(server_js_1.default).get('/api/progress/dashboard');
        record('Unauthenticated /api/progress/dashboard', unauthProgress.status === 401, `Status: ${unauthProgress.status}`);
        const unauthExec = await (0, supertest_1.default)(server_js_1.default).post('/api/execution/run').send({ code: 'print(1)', language: 'python' });
        record('Unauthenticated /api/execution/run', unauthExec.status === 401, `Status: ${unauthExec.status}`);
        // 2. Register real user & verify via OTP flow
        const regRes = await (0, supertest_1.default)(server_js_1.default).post('/api/auth/register').send({
            name: 'Protected Test User',
            email: testEmail,
            password: testPassword,
        });
        record('Register user for protected testing', regRes.status === 201, `Status: ${regRes.status}`);
        // Retrieve verification token hash from DB to get the valid OTP
        const dbUser = await User_js_1.User.findOne({ email: testEmail }).select('+verificationTokenHash');
        if (!dbUser)
            throw new Error('User not found in DB after registration');
        // Simulate OTP entry: verify with valid token/otp
        // Since we know the token expires in future, let's verify using verificationTokenHash or test with resend
        // In our authController, verifyEmail accepts req.body.otp or token.
        // For testing, let's set a known OTP to test the actual verifyEmail route:
        const knownOtp = '654321';
        dbUser.verificationTokenHash = hashToken(knownOtp);
        dbUser.verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000);
        await dbUser.save();
        const verifyRes = await (0, supertest_1.default)(server_js_1.default).post('/api/auth/verify-email').send({
            email: testEmail,
            otp: knownOtp,
        });
        record('Verify email with 6-digit OTP', verifyRes.status === 200, `Status: ${verifyRes.status}`);
        // 3. Login
        const loginRes = await (0, supertest_1.default)(server_js_1.default).post('/api/auth/login').send({
            email: testEmail,
            password: testPassword,
        });
        record('Login verified user', loginRes.status === 200, `Status: ${loginRes.status}`);
        const accessToken = loginRes.body.data?.tokens?.accessToken || loginRes.body.data?.accessToken;
        const cookies = loginRes.headers['set-cookie'];
        record('Access token received', Boolean(accessToken), `Token: ${Boolean(accessToken)}`);
        // 4. Test all protected features with valid access token
        const authMe = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);
        record('Authenticated /api/auth/me', authMe.status === 200 && authMe.body.data?.user?.email === testEmail, `Status: ${authMe.status}`);
        const authLP = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/learning-path')
            .set('Authorization', `Bearer ${accessToken}`);
        record('Authenticated /api/learning-path', authLP.status === 200, `Status: ${authLP.status}`);
        const authFlashcards = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/flashcards/decks')
            .set('Authorization', `Bearer ${accessToken}`);
        record('Authenticated /api/flashcards/decks', authFlashcards.status === 200, `Status: ${authFlashcards.status}`);
        const authAI = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/ai/providers')
            .set('Authorization', `Bearer ${accessToken}`);
        record('Authenticated /api/ai/providers', authAI.status === 200, `Status: ${authAI.status}`);
        const authProgress = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/progress/dashboard')
            .set('Authorization', `Bearer ${accessToken}`);
        record('Authenticated /api/progress/dashboard', authProgress.status === 200, `Status: ${authProgress.status}`);
        const authExec = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/execution/run')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ code: 'console.log("hello");', language: 'javascript' });
        record('Authenticated /api/execution/run', authExec.status === 200, `Status: ${authExec.status}`);
        // 5. Test Refresh and Re-access
        const refreshRes = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/auth/refresh')
            .set('Cookie', cookies);
        record('Token refresh via cookie', refreshRes.status === 200, `Status: ${refreshRes.status}`);
        const newAccessToken = refreshRes.body.data?.accessToken;
        const authMeAfterRefresh = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${newAccessToken}`);
        record('Authenticated /api/auth/me after refresh', authMeAfterRefresh.status === 200, `Status: ${authMeAfterRefresh.status}`);
        // 6. Test Logout & Access Revocation
        const logoutRes = await (0, supertest_1.default)(server_js_1.default)
            .post('/api/auth/logout')
            .set('Authorization', `Bearer ${newAccessToken}`)
            .set('Cookie', cookies);
        record('Logout user', logoutRes.status === 200, `Status: ${logoutRes.status}`);
        const postLogoutMe = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/auth/me')
            .set('Cookie', logoutRes.headers['set-cookie'] || []);
        record('/api/auth/me unauthorized after logout', postLogoutMe.status === 401, `Status: ${postLogoutMe.status}`);
        const postLogoutLP = await (0, supertest_1.default)(server_js_1.default)
            .get('/api/learning-path')
            .set('Cookie', logoutRes.headers['set-cookie'] || []);
        record('/api/learning-path unauthorized after logout', postLogoutLP.status === 401, `Status: ${postLogoutLP.status}`);
    }
    finally {
        // Cleanup only the temporary test user
        await User_js_1.User.deleteMany({ email: testEmail });
        console.log(`Cleaned up temporary test user ${testEmail}`);
        await mongoose_1.default.disconnect();
    }
    const failed = results.filter((r) => !r.passed);
    console.log(`\nProtected Features Test Summary: ${results.length - failed.length}/${results.length} PASSED`);
    if (failed.length > 0) {
        console.error('FAILED TESTS:', failed);
        process.exit(1);
    }
    else {
        console.log('🎉 ALL PROTECTED FEATURES AUTHENTICATION TESTS PASSED!');
        process.exit(0);
    }
}
run().catch(async (err) => {
    console.error('Fatal error during test:', err);
    await mongoose_1.default.disconnect();
    process.exit(1);
});
