const fetch = require('node-fetch'); // or just use global fetch if node 18+
async function test() {
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'test_srii_123', password: 'abc', public_key: 'def' })
  });
  const data = await res.json();
  console.log(res.status, data);
}
test().catch(console.error);
