import axios from 'axios';

const API = 'http://localhost:3001/api';

const accounts = [
  { email: 'admin@example.com', password: 'admin123', role: 'ADMIN' },
  { email: 'sales@example.com', password: 'sales123', role: 'SALES' },
  { email: 'warehouse@example.com', password: 'warehouse123', role: 'WAREHOUSE' },
  { email: 'accounts@example.com', password: 'accounts123', role: 'ACCOUNTS' },
];

async function testLogin() {
  console.log('=== Authentication Module — Full Test ===\n');

  for (const acc of accounts) {
    try {
      const res = await axios.post(`${API}/auth/login`, {
        email: acc.email,
        password: acc.password,
        rememberMe: true
      });

      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      if (!res.data.token) throw new Error('No token in response');
      if (res.data.user.role !== acc.role) throw new Error(`Role mismatch: expected ${acc.role}, got ${res.data.user.role}`);

      // Test GET /me with the token
      const meRes = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${res.data.token}` }
      });
      if (meRes.data.email !== acc.email) throw new Error(`/me returned wrong email`);

      console.log(`✅ ${acc.role.padEnd(10)} | Login OK | JWT OK | /me OK | ${acc.email}`);
    } catch (err: any) {
      console.error(`❌ ${acc.role.padEnd(10)} | FAILED | ${acc.email}`);
      console.error(`   ${err.response?.data?.message || err.response?.data?.error || err.message}`);
      process.exit(1);
    }
  }

  // Test invalid credentials
  try {
    await axios.post(`${API}/auth/login`, { email: 'admin@example.com', password: 'wrongpassword' });
    console.error('❌ Invalid password test FAILED — expected 401 but got 200');
    process.exit(1);
  } catch (err: any) {
    if (err.response?.status === 401) {
      console.log(`✅ ${'SECURITY'.padEnd(10)} | Invalid password correctly returns 401`);
    } else {
      console.error(`❌ Unexpected status: ${err.response?.status}`);
      process.exit(1);
    }
  }

  console.log('\n🎉 All authentication tests passed!');
}

testLogin();
