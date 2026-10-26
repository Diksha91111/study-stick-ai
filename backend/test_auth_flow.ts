async function runTests() {
  const headers = { 'Content-Type': 'application/json' };

  console.log('--- Test 1: Unknown email ---');
  const res1 = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'nobody@example.com', password: 'password123' }) });
  console.log('Unknown email status:', res1.status, (await res1.json()).message);

  console.log('\n--- Test 2: Unverified account ---');
  await fetch('http://localhost:5000/api/auth/register', { method: 'POST', headers, body: JSON.stringify({ name: 'Test Unverified', email: 'unverified@test.com', password: 'password123' }) });
  const res2 = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'unverified@test.com', password: 'password123' }) });
  console.log('Unverified login status:', res2.status, (await res2.json()).message);

  console.log('\n--- Test 3: Incorrect password ---');
  const res3 = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'test1@test.com', password: 'wrongpassword' }) });
  console.log('Incorrect password status:', res3.status, (await res3.json()).message);

  console.log('\n--- Test 4: Valid login ---');
  const res4 = await fetch('http://localhost:5000/api/auth/login', { method: 'POST', headers, body: JSON.stringify({ email: 'test1@test.com', password: 'password123' }) });
  const data4 = await res4.json();
  console.log('Valid login status:', res4.status, data4.message);
  
  const setCookie = res4.headers.get('set-cookie');
  const accessToken = data4.data.accessToken;

  console.log('\n--- Test 5: /auth/me while logged out (No Token) ---');
  const res5 = await fetch('http://localhost:5000/api/auth/me');
  console.log('/auth/me logged out status:', res5.status, (await res5.json()).message);

  console.log('\n--- Test 6: /auth/me with valid token ---');
  const res6 = await fetch('http://localhost:5000/api/auth/me', { headers: { Authorization: 'Bearer ' + accessToken } });
  console.log('/auth/me with token status:', res6.status, (await res6.json()).message);

  console.log('\n--- Test 7: Expired access token and valid refresh ---');
  const res7 = await fetch('http://localhost:5000/api/auth/refresh', { method: 'POST', headers: { Cookie: setCookie || '' } });
  console.log('Refresh status:', res7.status, (await res7.json()).message);

  console.log('\n--- Test 8: Expired or invalid refresh token ---');
  const res8 = await fetch('http://localhost:5000/api/auth/refresh', { method: 'POST', headers: { Cookie: 'refreshToken=invalid_token' } });
  console.log('Invalid refresh status:', res8.status, (await res8.json()).message);
}
runTests();
