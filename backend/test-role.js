const axios = require('axios');

async function run() {
  const API_URL = 'http://localhost:3001/api';

  try {
    // 1. Login as Sales
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'sales@example.com',
      password: 'sales123'
    });
    const token = loginRes.data.token;

    // 2. Attempt to POST /products (Admin/Warehouse only)
    try {
      await axios.post(`${API_URL}/products`, {
        name: 'Test Product',
        sku: 'TEST-SKU-999',
        unitPrice: 10
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('❌ Role test FAILED (Request succeeded but should have failed)');
    } catch (err) {
      if (err.response?.status === 403) {
        console.log('✅ Role test PASSED (Received 403 Forbidden)');
      } else {
        console.log(`❌ Role test FAILED (Received ${err.response?.status} instead of 403)`);
      }
    }
  } catch (error) {
    console.error('Test setup failed:', error.response?.data || error.message);
  }
}

run();
