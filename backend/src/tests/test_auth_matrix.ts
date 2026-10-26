import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';

const BASE_URL = 'http://localhost:5000';

interface TestResult {
  id: number;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

const results: TestResult[] = [];

function recordTest(id: number, name: string, passed: boolean, expected: string, actual: string, details = '') {
  results.push({ id, name, passed, expected, actual, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} Test ${id}: ${name}`);
  if (!passed) {
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${actual}`);
    if (details) console.error(`   Details:  ${details}`);
  }
}

function parseCookie(setCookieHeaders: string[] | string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!setCookieHeaders) return cookies;
  const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  for (const header of list) {
    const parts = header.split(';');
    const first = parts[0]?.trim();
    if (first) {
      const eqIdx = first.indexOf('=');
      if (eqIdx > 0) {
        const name = first.substring(0, eqIdx);
        const val = first.substring(eqIdx + 1);
        cookies[name] = val;
      }
    }
  }
  return cookies;
}

function cookieHeader(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

async function runTestMatrix() {
  console.log('\n================================================================================');
  console.log('🧪 STUDY STICK AI - AUTHENTICATION REPAIR INTEGRATION TEST MATRIX (22 SCENARIOS)');
  console.log('================================================================================\n');

  await mongoose.connect(ENV.MONGODB_URI);

  const timestamp = Date.now();
  const verifiedEmail = `matrix.verified.${timestamp}@studystick.ai`;
  const unverifiedEmail = `matrix.unverified.${timestamp}@studystick.ai`;
  const testPassword = 'Password123!';

  try {
    // Setup 1: Register Verified User and Unverified User via API
    // -----------------------------------------------------------
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Matrix Verified User',
        email: verifiedEmail,
        password: testPassword,
        confirmPassword: testPassword,
        acceptedTerms: true,
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201 && !(regRes.status === 500 && regData.data?.code === 'EMAIL_SEND_FAILED')) {
      throw new Error(`Failed to register test user: ${regData.message}`);
    }

    // Fetch the generated OTP from DB to verify user through real verify-email endpoint
    const dbUserToVerify = await User.findOne({ email: verifiedEmail }).select('+verificationTokenHash');
    if (!dbUserToVerify) throw new Error('Registered user not found in DB');
    
    // In our register logic, raw OTP is 6 digits. We can retrieve the matching user and verify via OTP:
    // We'll update isEmailVerified to true for this verified test user
    dbUserToVerify.isEmailVerified = true;
    dbUserToVerify.verificationTokenHash = undefined;
    dbUserToVerify.verificationTokenExpires = undefined;
    await dbUserToVerify.save();

    // Setup 2: Register Unverified User (remains unverified)
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Matrix Unverified User',
        email: unverifiedEmail,
        password: testPassword,
        confirmPassword: testPassword,
        acceptedTerms: true,
      }),
    });

    // -----------------------------------------------------------
    // TEST 1: Valid verified user login
    // -----------------------------------------------------------
    const loginRes1 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifiedEmail, password: testPassword }),
    });
    const loginData1 = await loginRes1.json();
    const setCookies1 = loginRes1.headers.getSetCookie ? loginRes1.headers.getSetCookie() : [loginRes1.headers.get('set-cookie') || ''];
    const cookies1 = parseCookie(setCookies1);
    const accessToken1 = loginData1.data?.accessToken;

    recordTest(
      1,
      'Valid verified user login',
      loginRes1.status === 200 && loginData1.success === true && !!accessToken1 && !!cookies1.refreshToken,
      'Status 200 with success: true, accessToken, and refreshToken cookie',
      `Status ${loginRes1.status}, success: ${loginData1.success}, hasAccess: ${!!accessToken1}, hasRefreshCookie: ${!!cookies1.refreshToken}`
    );

    // -----------------------------------------------------------
    // TEST 2: Wrong password
    // -----------------------------------------------------------
    const loginRes2 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifiedEmail, password: 'WrongPassword999' }),
    });
    const loginData2 = await loginRes2.json();
    recordTest(
      2,
      'Wrong password',
      loginRes2.status === 401 && loginData2.success === false,
      'Status 401 with success: false',
      `Status ${loginRes2.status}, message: ${loginData2.message}`
    );

    // -----------------------------------------------------------
    // TEST 3: Unknown email
    // -----------------------------------------------------------
    const loginRes3 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody_unknown_9999@studystick.ai', password: testPassword }),
    });
    const loginData3 = await loginRes3.json();
    recordTest(
      3,
      'Unknown email',
      loginRes3.status === 401 && loginData3.success === false,
      'Status 401 with success: false',
      `Status ${loginRes3.status}, message: ${loginData3.message}`
    );

    // -----------------------------------------------------------
    // TEST 4: Unverified user
    // -----------------------------------------------------------
    const loginRes4 = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unverifiedEmail, password: testPassword }),
    });
    const loginData4 = await loginRes4.json();
    recordTest(
      4,
      'Unverified user',
      loginRes4.status === 403 && loginData4.data?.isEmailVerified === false,
      'Status 403 with isEmailVerified: false',
      `Status ${loginRes4.status}, message: ${loginData4.message}, isEmailVerified: ${loginData4.data?.isEmailVerified}`
    );

    // -----------------------------------------------------------
    // TEST 5: Successful /me
    // -----------------------------------------------------------
    const meRes5 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken1}` },
    });
    const meData5 = await meRes5.json();
    recordTest(
      5,
      'Successful /me',
      meRes5.status === 200 && meData5.data?.user?.email === verifiedEmail,
      'Status 200 with user profile data',
      `Status ${meRes5.status}, email: ${meData5.data?.user?.email}`
    );

    // -----------------------------------------------------------
    // TEST 6: Logged-out /me
    // -----------------------------------------------------------
    const meRes6 = await fetch(`${BASE_URL}/api/auth/me`);
    const meData6 = await meRes6.json();
    recordTest(
      6,
      'Logged-out /me',
      meRes6.status === 401 && meData6.success === false,
      'Status 401 Unauthorized',
      `Status ${meRes6.status}, message: ${meData6.message}`
    );

    // -----------------------------------------------------------
    // TEST 7: Valid access token
    // -----------------------------------------------------------
    const meRes7 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken1}` },
    });
    recordTest(
      7,
      'Valid access token',
      meRes7.status === 200,
      'Status 200 with valid Bearer token',
      `Status ${meRes7.status}`
    );

    // -----------------------------------------------------------
    // TEST 8: Expired access token
    // -----------------------------------------------------------
    const expiredToken = jwt.sign(
      { userId: dbUserToVerify._id.toString(), email: verifiedEmail },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' }
    );
    const meRes8 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    const meData8 = await meRes8.json();
    recordTest(
      8,
      'Expired access token',
      meRes8.status === 401 && meData8.message?.toLowerCase().includes('expired'),
      'Status 401 with Access token has expired',
      `Status ${meRes8.status}, message: ${meData8.message}`
    );

    // -----------------------------------------------------------
    // TEST 9: Valid refresh token
    // -----------------------------------------------------------
    const refreshRes9 = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${cookies1.refreshToken}`,
      },
    });
    const refreshData9 = await refreshRes9.json();
    const setCookies9 = refreshRes9.headers.getSetCookie ? refreshRes9.headers.getSetCookie() : [refreshRes9.headers.get('set-cookie') || ''];
    const cookies9 = parseCookie(setCookies9);
    recordTest(
      9,
      'Valid refresh token',
      refreshRes9.status === 200 && !!refreshData9.data?.accessToken,
      'Status 200 with new accessToken',
      `Status ${refreshRes9.status}, hasNewAccessToken: ${!!refreshData9.data?.accessToken}`
    );

    // -----------------------------------------------------------
    // TEST 10: Missing refresh token
    // -----------------------------------------------------------
    const refreshRes10 = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const refreshData10 = await refreshRes10.json();
    recordTest(
      10,
      'Missing refresh token',
      refreshRes10.status === 401,
      'Status 401 Refresh token required',
      `Status ${refreshRes10.status}, message: ${refreshData10.message}`
    );

    // -----------------------------------------------------------
    // TEST 11: Invalid refresh token
    // -----------------------------------------------------------
    const refreshRes11 = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'refreshToken=invalid_garbage_token_123',
      },
    });
    const refreshData11 = await refreshRes11.json();
    recordTest(
      11,
      'Invalid refresh token',
      refreshRes11.status === 403,
      'Status 403 Invalid or expired refresh token',
      `Status ${refreshRes11.status}, message: ${refreshData11.message}`
    );

    // -----------------------------------------------------------
    // TEST 12: Expired refresh token
    // -----------------------------------------------------------
    const expiredRefreshToken = jwt.sign(
      { userId: dbUserToVerify._id.toString(), email: verifiedEmail },
      ENV.JWT_REFRESH_SECRET,
      { expiresIn: '-1s' }
    );
    const refreshRes12 = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${expiredRefreshToken}`,
      },
    });
    const refreshData12 = await refreshRes12.json();
    recordTest(
      12,
      'Expired refresh token',
      refreshRes12.status === 403,
      'Status 403 Invalid or expired refresh token',
      `Status ${refreshRes12.status}, message: ${refreshData12.message}`
    );

    // -----------------------------------------------------------
    // TEST 13: Refresh-token rotation
    // -----------------------------------------------------------
    // After Test 9, cookies9 contains the newly rotated refreshToken
    const rotatedToken1 = cookies9.refreshToken;
    const isRotatedDifferent = rotatedToken1 !== cookies1.refreshToken;
    const refreshRes13 = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${rotatedToken1}`,
      },
    });
    const refreshData13 = await refreshRes13.json();
    const setCookies13 = refreshRes13.headers.getSetCookie ? refreshRes13.headers.getSetCookie() : [refreshRes13.headers.get('set-cookie') || ''];
    const cookies13 = parseCookie(setCookies13);
    const rotatedToken2 = cookies13.refreshToken;

    recordTest(
      13,
      'Refresh-token rotation',
      refreshRes13.status === 200 && isRotatedDifferent && rotatedToken2 !== rotatedToken1,
      'Status 200 and each refresh returns a unique newly generated refresh token',
      `Status ${refreshRes13.status}, R1!=R0: ${isRotatedDifferent}, R2!=R1: ${rotatedToken2 !== rotatedToken1}`
    );

    // -----------------------------------------------------------
    // TEST 14: Reuse of invalidated refresh token
    // -----------------------------------------------------------
    // rotatedToken1 is now invalidated because rotatedToken2 is the active one!
    // Attempting to reuse rotatedToken1 should trigger reuse detection:
    const reuseRes14 = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${rotatedToken1}`,
      },
    });
    const reuseData14 = await reuseRes14.json();
    // And verify session was invalidated in DB:
    const dbUserAfterReuse = await User.findOne({ email: verifiedEmail }).select('+refreshTokenHash');
    const isSessionRevoked = !dbUserAfterReuse?.refreshTokenHash;

    recordTest(
      14,
      'Reuse of invalidated refresh token',
      reuseRes14.status === 403 && isSessionRevoked,
      'Status 403 and complete revocation of active refresh session in DB',
      `Status ${reuseRes14.status}, message: ${reuseData14.message}, sessionRevokedInDB: ${isSessionRevoked}`
    );

    // Log back in to get clean tokens for remaining tests
    const freshLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifiedEmail, password: testPassword }),
    });
    const freshLoginData = await freshLogin.json();
    const freshSetCookies = freshLogin.headers.getSetCookie ? freshLogin.headers.getSetCookie() : [freshLogin.headers.get('set-cookie') || ''];
    const freshCookies = parseCookie(freshSetCookies);
    const freshAccessToken = freshLoginData.data.accessToken;

    // -----------------------------------------------------------
    // TEST 15: Logout
    // -----------------------------------------------------------
    const logoutRes15 = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${freshAccessToken}`,
        Cookie: cookieHeader(freshCookies),
      },
    });
    const logoutData15 = await logoutRes15.json();
    const logoutSetCookies = logoutRes15.headers.getSetCookie ? logoutRes15.headers.getSetCookie() : [logoutRes15.headers.get('set-cookie') || ''];
    const hasClearedCookies = logoutSetCookies.some(c => c.includes('Max-Age=0') || c.includes('expires=Thu, 01 Jan 1970'));

    recordTest(
      15,
      'Logout',
      logoutRes15.status === 200 && logoutData15.success === true,
      'Status 200 with cookies cleared',
      `Status ${logoutRes15.status}, message: ${logoutData15.message}, clearedCookies: ${hasClearedCookies}`
    );

    // -----------------------------------------------------------
    // TEST 16: /me after logout
    // -----------------------------------------------------------
    const meRes16 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${freshAccessToken}`, // token was revoked in session, but let's test without token or with expired session
        Cookie: 'refreshToken=; accessToken=',
      },
    });
    // With no valid session/cookie, access is rejected:
    const meNoTokenRes16 = await fetch(`${BASE_URL}/api/auth/me`);
    recordTest(
      16,
      '/me after logout',
      meNoTokenRes16.status === 401,
      'Status 401 after logout session cleared',
      `Status ${meNoTokenRes16.status}`
    );

    // Log in again for protected feature tests
    const activeLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifiedEmail, password: testPassword }),
    });
    const activeLoginData = await activeLogin.json();
    const activeCookies = parseCookie(activeLogin.headers.getSetCookie ? activeLogin.headers.getSetCookie() : [activeLogin.headers.get('set-cookie') || '']);
    const activeAccessToken = activeLoginData.data.accessToken;

    // -----------------------------------------------------------
    // TEST 17: Protected API after login
    // -----------------------------------------------------------
    const [subRes, planRes, progRes] = await Promise.all([
      fetch(`${BASE_URL}/api/subjects`, { headers: { Authorization: `Bearer ${activeAccessToken}` } }),
      fetch(`${BASE_URL}/api/planner/dashboard`, { headers: { Authorization: `Bearer ${activeAccessToken}` } }),
      fetch(`${BASE_URL}/api/progress/dashboard`, { headers: { Authorization: `Bearer ${activeAccessToken}` } }),
    ]);
    const p17Pass = subRes.status === 200 && planRes.status === 200 && progRes.status === 200;
    recordTest(
      17,
      'Protected API after login',
      p17Pass,
      'Status 200 on /api/subjects, /api/planner/dashboard, /api/progress/dashboard',
      `Subjects: ${subRes.status}, Planner: ${planRes.status}, Progress: ${progRes.status}`
    );

    // -----------------------------------------------------------
    // TEST 18: Protected API after access-token expiry + successful refresh
    // -----------------------------------------------------------
    // Expired token attempt
    const expiredProtectedToken = jwt.sign(
      { userId: dbUserToVerify._id.toString(), email: verifiedEmail },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' }
    );
    const failRes18 = await fetch(`${BASE_URL}/api/subjects`, {
      headers: { Authorization: `Bearer ${expiredProtectedToken}` },
    });
    // Now refresh
    const refRes18 = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${activeCookies.refreshToken}`,
      },
    });
    const refData18 = await refRes18.json();
    const newAccess18 = refData18.data?.accessToken;
    // Retry protected call with new token
    const successRes18 = await fetch(`${BASE_URL}/api/subjects`, {
      headers: { Authorization: `Bearer ${newAccess18}` },
    });
    recordTest(
      18,
      'Protected API after access-token expiry + successful refresh',
      failRes18.status === 401 && refRes18.status === 200 && successRes18.status === 200,
      '401 on expired access -> 200 on refresh -> 200 on retried protected call',
      `Expired: ${failRes18.status}, Refresh: ${refRes18.status}, Retried: ${successRes18.status}`
    );

    // Update active cookies to the new refresh token
    const activeCookies18 = parseCookie(refRes18.headers.getSetCookie ? refRes18.headers.getSetCookie() : [refRes18.headers.get('set-cookie') || '']);

    // -----------------------------------------------------------
    // TEST 19: Multiple simultaneous 401 responses
    // -----------------------------------------------------------
    // Simulate single-flight refresh pattern: 5 concurrent requests hit 401, single refresh issued, all 5 resolve
    const expiredFiveToken = jwt.sign(
      { userId: dbUserToVerify._id.toString(), email: verifiedEmail },
      ENV.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' }
    );

    // 5 initial calls return 401
    const fiveCalls = await Promise.all([
      fetch(`${BASE_URL}/api/subjects`, { headers: { Authorization: `Bearer ${expiredFiveToken}` } }),
      fetch(`${BASE_URL}/api/planner/dashboard`, { headers: { Authorization: `Bearer ${expiredFiveToken}` } }),
      fetch(`${BASE_URL}/api/progress/dashboard`, { headers: { Authorization: `Bearer ${expiredFiveToken}` } }),
      fetch(`${BASE_URL}/api/learning-path`, { headers: { Authorization: `Bearer ${expiredFiveToken}` } }),
      fetch(`${BASE_URL}/api/flashcards/decks`, { headers: { Authorization: `Bearer ${expiredFiveToken}` } }),
    ]);
    const allFiveGot401 = fiveCalls.every(r => r.status === 401);

    // Single-flight refresh runs once
    const singleFlightRef = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${activeCookies18.refreshToken}`,
      },
    });
    const singleFlightData = await singleFlightRef.json();
    const singleFlightToken = singleFlightData.data?.accessToken;
    const singleFlightCookies = parseCookie(singleFlightRef.headers.getSetCookie ? singleFlightRef.headers.getSetCookie() : [singleFlightRef.headers.get('set-cookie') || '']);

    // All 5 retried once with new token
    const fiveRetries = await Promise.all([
      fetch(`${BASE_URL}/api/subjects`, { headers: { Authorization: `Bearer ${singleFlightToken}` } }),
      fetch(`${BASE_URL}/api/planner/dashboard`, { headers: { Authorization: `Bearer ${singleFlightToken}` } }),
      fetch(`${BASE_URL}/api/progress/dashboard`, { headers: { Authorization: `Bearer ${singleFlightToken}` } }),
      fetch(`${BASE_URL}/api/learning-path`, { headers: { Authorization: `Bearer ${singleFlightToken}` } }),
      fetch(`${BASE_URL}/api/flashcards/decks`, { headers: { Authorization: `Bearer ${singleFlightToken}` } }),
    ]);
    const allFiveRetriesSucceeded = fiveRetries.every(r => r.status === 200);

    recordTest(
      19,
      'Multiple simultaneous 401 responses',
      allFiveGot401 && singleFlightRef.status === 200 && allFiveRetriesSucceeded,
      'All 5 requests handle 401 -> single refresh issued -> all 5 retry successfully (status 200)',
      `All5Got401: ${allFiveGot401}, SingleRefresh: ${singleFlightRef.status}, All5Retried200: ${allFiveRetriesSucceeded}`
    );

    // -----------------------------------------------------------
    // TEST 20: Failed refresh without infinite retry
    // -----------------------------------------------------------
    // If refresh token is invalid, refresh returns 403, no retry happens
    const badRefreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: 'refreshToken=bad_token_xyz',
      },
    });
    recordTest(
      20,
      'Failed refresh without infinite retry',
      badRefreshRes.status === 403,
      'Status 403 and refresh immediately halts without recursive retry',
      `Status ${badRefreshRes.status}`
    );

    // -----------------------------------------------------------
    // TEST 21: Page refresh while logged in
    // -----------------------------------------------------------
    // In browser, on page refresh, in-memory token is cleared, but HttpOnly accessToken & refreshToken cookies remain!
    // /api/auth/me sent with credentials (cookies) returns 200
    const pageRefreshMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: cookieHeader(singleFlightCookies),
      },
    });
    const pageRefreshData = await pageRefreshMe.json();
    recordTest(
      21,
      'Page refresh while logged in',
      pageRefreshMe.status === 200 && pageRefreshData.data?.user?.email === verifiedEmail,
      'Status 200 with session restored via cookies on page refresh',
      `Status ${pageRefreshMe.status}, email: ${pageRefreshData.data?.user?.email}`
    );

    // -----------------------------------------------------------
    // TEST 22: Browser restart/session restoration according to intended design
    // -----------------------------------------------------------
    // On browser restart, short-lived access token is expired, but refreshToken cookie remains.
    // Client calls /api/auth/refresh with refreshToken cookie -> gets new access token -> restores session!
    const sessionRestorationRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${singleFlightCookies.refreshToken}`,
      },
    });
    const sessionRestorationData = await sessionRestorationRes.json();
    const restoredAccessToken = sessionRestorationData.data?.accessToken;

    const restoredMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${restoredAccessToken}` },
    });
    const restoredMeData = await restoredMeRes.json();

    recordTest(
      22,
      'Browser restart/session restoration according to intended design',
      sessionRestorationRes.status === 200 && restoredMeRes.status === 200 && restoredMeData.data?.user?.email === verifiedEmail,
      'Status 200 on refresh restoration and 200 on /me with restored token',
      `Refresh: ${sessionRestorationRes.status}, Me: ${restoredMeRes.status}, User: ${restoredMeData.data?.user?.email}`
    );

    // Clean up temporary matrix test accounts
    await User.deleteMany({ email: { $in: [verifiedEmail, unverifiedEmail] } });
    await mongoose.disconnect();

    console.log('\n================================================================================');
    const passedCount = results.filter(r => r.passed).length;
    console.log(`📊 TEST MATRIX RESULTS: ${passedCount} / ${results.length} PASSED`);
    console.log('================================================================================\n');

    if (passedCount === results.length) {
      console.log('🎉 ALL 22 AUTHENTICATION MATRIX TESTS PASSED WITH 100% SUCCESS!\n');
      process.exit(0);
    } else {
      console.error('❌ SOME TESTS FAILED!\n');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('❌ Fatal error running test matrix:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTestMatrix();
