async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'priya.sharma@studystick.ai', password: 'Password123!' })
  });
  
  const cookiesStr = loginRes.headers.get('set-cookie');
  const match = cookiesStr.match(/refreshToken=([^;]+)/);
  const refreshTokenCookie = 'refreshToken=' + match[1];
  
  const refreshRes = await fetch('http://localhost:5000/api/auth/refresh', { method: 'POST', headers: { Cookie: refreshTokenCookie } });
  const data = await refreshRes.json();
  console.log('Refresh Status:', refreshRes.status, 'Message:', data.message);
}
test();
