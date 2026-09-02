const axios = require('axios');

async function run() {
  const API_URL = 'http://localhost:3001/api';

  try {
    // 1. Login as Admin
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;

    // 2. Fetch a product to use
    const productsRes = await axios.get(`${API_URL}/products?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const product = productsRes.data.data[0];

    // Fetch a customer
    const customersRes = await axios.get(`${API_URL}/customers?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const customer = customersRes.data.data[0];

    console.log(`Using Product: ${product.name}, Current Stock: ${product.currentStock}`);

    // 3. Create a DRAFT challan that requests MORE than half the stock but less than total stock
    // So if 5 concurrent requests hit, they should conflict.
    // E.g., request currentStock - 1
    const qtyToOrder = Math.max(1, product.currentStock - 1);
    
    const draftRes1 = await axios.post(`${API_URL}/challans`, {
      customerId: customer.id,
      status: 'DRAFT',
      items: [{ productId: product.id, quantity: qtyToOrder }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const challanId1 = draftRes1.data.id;

    const draftRes2 = await axios.post(`${API_URL}/challans`, {
      customerId: customer.id,
      status: 'DRAFT',
      items: [{ productId: product.id, quantity: qtyToOrder }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const challanId2 = draftRes2.data.id;

    console.log(`Created Draft Challan ${challanId1} and ${challanId2} for ${qtyToOrder} units.`);

    // 4. Fire concurrent confirm requests
    console.log('Firing concurrent confirm requests...');
    const req1 = axios.put(`${API_URL}/challans/${challanId1}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => ({ id: 1, status: res.status, data: res.data })).catch(err => ({ id: 1, status: err.response?.status, error: err.response?.data }));

    const req2 = axios.put(`${API_URL}/challans/${challanId2}/confirm`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => ({ id: 2, status: res.status, data: res.data })).catch(err => ({ id: 2, status: err.response?.status, error: err.response?.data }));

    const results = await Promise.all([req1, req2]);
    
    console.log('\nResults:');
    let successCount = 0;
    results.forEach(r => {
      if (r.status === 200) {
        successCount++;
        console.log(`Request ${r.id}: SUCCESS`);
      } else {
        console.log(`Request ${r.id}: FAILED with ${r.status} -`, r.error);
      }
    });

    console.log(`\nSummary: ${successCount} succeeded, ${5 - successCount} failed.`);
    if (successCount === 1) {
      console.log('✅ Concurrency test PASSED (only 1 succeeded).');
    } else {
      console.log('❌ Concurrency test FAILED (expected exactly 1 success).');
    }

  } catch (error) {
    console.error('Test setup failed:', error.response?.data || error.message);
  }
}

run();
