import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

async function runE2ETests() {
  console.log('--- Starting API E2E Check ---');
  let token = '';

  try {
    // 1. Authentication
    console.log('\n[1] Checking Authentication...');
    try {
      await axios.post(`${API_URL}/auth/seed-admin`);
    } catch (e) {
      // Ignore if already seeded
    }

    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    token = loginRes.data.token;
    if (!token) throw new Error('Token not received');
    console.log('✅ Login successful. Received JWT.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Customers
    console.log('\n[2] Checking Customers CRM Module...');
    const custRes = await axios.post(`${API_URL}/customers`, {
      name: 'E2E Test Customer',
      mobile: '9998887776',
      email: 'e2e@customer.com',
      customerType: 'RETAIL',
      status: 'ACTIVE'
    }, { headers });
    const customerId = custRes.data.id;
    console.log(`✅ Customer created: ${customerId}`);

    const getCustRes = await axios.get(`${API_URL}/customers/${customerId}`, { headers });
    if (getCustRes.data.name !== 'E2E Test Customer') throw new Error('Customer fetch mismatch');
    console.log('✅ Customer fetch successful.');

    // 3. Products & Inventory
    console.log('\n[3] Checking Products & Inventory Module...');
    const prodRes = await axios.post(`${API_URL}/products`, {
      name: 'E2E Test Product',
      sku: `E2E-SKU-${Date.now()}`,
      unitPrice: 50.00,
      currentStock: 100,
      minStockAlert: 10
    }, { headers });
    const productId = prodRes.data.id;
    console.log(`✅ Product created: ${productId}`);

    // Adjust Stock
    await axios.put(`${API_URL}/products/${productId}/stock`, {
      quantity: 50,
      movementType: 'IN',
      reason: 'E2E Restock'
    }, { headers });
    console.log('✅ Stock adjustment (IN) successful.');

    const getProdRes = await axios.get(`${API_URL}/products`, { headers });
    const updatedProd = getProdRes.data.find((p: any) => p.id === productId);
    if (updatedProd.currentStock !== 150) throw new Error(`Stock mismatch: expected 150, got ${updatedProd.currentStock}`);
    console.log('✅ Inventory levels updated correctly.');

    // 4. Sales Challans
    console.log('\n[4] Checking Sales Challan Module...');
    const draftRes = await axios.post(`${API_URL}/challans`, {
      customerId,
      status: 'DRAFT',
      items: [{ productId, quantity: 25 }]
    }, { headers });
    const challanId = draftRes.data.id;
    console.log(`✅ Draft Challan created: ${challanId}`);

    await axios.put(`${API_URL}/challans/${challanId}/confirm`, {}, { headers });
    console.log('✅ Challan confirmed successfully.');

    const finalProdRes = await axios.get(`${API_URL}/products`, { headers });
    const finalProd = finalProdRes.data.find((p: any) => p.id === productId);
    if (finalProd.currentStock !== 125) throw new Error(`Stock deduction failed: expected 125, got ${finalProd.currentStock}`);
    console.log('✅ Stock deducted accurately on Challan confirmation.');

    console.log('\n🎉 All E2E Core API Tests Passed Successfully!');

  } catch (error: any) {
    console.error('\n❌ E2E Test Failed!');
    if (error.response) {
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runE2ETests();
