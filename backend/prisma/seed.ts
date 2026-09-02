import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // 1. Seed Users
  const roles = [
    { email: 'admin@example.com', name: 'Admin User', role: 'ADMIN', pass: 'admin123' },
    { email: 'sales@example.com', name: 'Sales User', role: 'SALES', pass: 'sales123' },
    { email: 'warehouse@example.com', name: 'Warehouse User', role: 'WAREHOUSE', pass: 'warehouse123' },
    { email: 'accounts@example.com', name: 'Accounts User', role: 'ACCOUNTS', pass: 'accounts123' },
  ];

  const userIds: Record<string, string> = {};

  for (const r of roles) {
    const passwordHash = await bcrypt.hash(r.pass, 10);
    const user = await prisma.user.upsert({
      where: { email: r.email },
      update: { passwordHash, name: r.name, role: r.role as any, isActive: true },
      create: {
        email: r.email,
        name: r.name,
        role: r.role as any,
        passwordHash,
        isActive: true
      }
    });
    userIds[r.role] = user.id;
    console.log(`✅ Upserted ${r.role} user: ${r.email} (password: ${r.pass})`);
  }

  const adminId = userIds['ADMIN'];

  // 2. Seed Customers (15 sample customers)
  console.log('Seeding Customers...');
  const customersData = Array.from({ length: 15 }).map((_, i) => ({
    name: `Customer ${i + 1}`,
    mobile: `98765432${String(i).padStart(2, '0')}`,
    email: `customer${i + 1}@example.com`,
    businessName: i % 2 === 0 ? `Business ${i + 1} Ltd` : null,
    customerType: i % 3 === 0 ? 'DISTRIBUTOR' : i % 2 === 0 ? 'WHOLESALE' : 'RETAIL',
    status: i % 5 === 0 ? 'INACTIVE' : i % 4 === 0 ? 'LEAD' : 'ACTIVE',
    createdById: adminId
  }));

  const createdCustomers = [];
  for (const data of customersData) {
    const cust = await prisma.customer.upsert({
      where: { id: uuidv4() }, // just mock upsert, better to check by mobile
      update: {},
      create: data
    });
    createdCustomers.push(cust);
  }

  // 3. Seed Products (20 sample products, some below min stock)
  console.log('Seeding Products...');
  const productsData = Array.from({ length: 20 }).map((_, i) => {
    const minStock = 10 + (i % 5);
    // Make 3 products intentionally low stock
    const isLowStock = i < 3;
    const currentStock = isLowStock ? minStock - 2 : minStock + 20;

    return {
      name: `Product SKU-${100 + i}`,
      sku: `SKU-${100 + i}`,
      category: i % 2 === 0 ? 'Electronics' : 'Hardware',
      unitPrice: 15.00 + (i * 2.5),
      currentStock: currentStock,
      minStockAlert: minStock,
      location: `Aisle ${1 + (i % 4)}`
    };
  });

  const createdProducts = [];
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: { currentStock: p.currentStock, minStockAlert: p.minStockAlert },
      create: p
    });
    createdProducts.push(prod);
  }

  // 4. Seed Initial Stock Movements for Products
  console.log('Seeding Stock Movements...');
  for (const p of createdProducts) {
    // Only if no movements exist
    const count = await prisma.stockMovementLog.count({ where: { productId: p.id } });
    if (count === 0 && p.currentStock > 0) {
      await prisma.stockMovementLog.create({
        data: {
          productId: p.id,
          quantity: p.currentStock,
          movementType: 'IN',
          reason: 'Initial stock setup',
          createdById: adminId
        }
      });
    }
  }

  // 5. Seed Challans
  console.log('Seeding Challans...');
  const existingChallans = await prisma.salesChallan.count();
  if (existingChallans === 0) {
    // Draft Challan
    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-2026-000001',
        customerId: createdCustomers[0].id,
        status: 'DRAFT',
        totalQuantity: 2,
        createdById: adminId,
        items: {
          create: [{
            productId: createdProducts[0].id,
            productName: createdProducts[0].name,
            productSku: createdProducts[0].sku,
            unitPrice: createdProducts[0].unitPrice,
            quantity: 2,
            lineTotal: Number(createdProducts[0].unitPrice) * 2
          }]
        }
      }
    });

    // Confirmed Challan
    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-2026-000002',
        customerId: createdCustomers[1].id,
        status: 'CONFIRMED',
        totalQuantity: 5,
        confirmedAt: new Date(),
        createdById: adminId,
        items: {
          create: [{
            productId: createdProducts[1].id,
            productName: createdProducts[1].name,
            productSku: createdProducts[1].sku,
            unitPrice: createdProducts[1].unitPrice,
            quantity: 5,
            lineTotal: Number(createdProducts[1].unitPrice) * 5
          }]
        }
      }
    });

    // Cancelled Challan
    await prisma.salesChallan.create({
      data: {
        challanNumber: 'CH-2026-000003',
        customerId: createdCustomers[2].id,
        status: 'CANCELLED',
        totalQuantity: 1,
        createdById: adminId,
        items: {
          create: [{
            productId: createdProducts[2].id,
            productName: createdProducts[2].name,
            productSku: createdProducts[2].sku,
            unitPrice: createdProducts[2].unitPrice,
            quantity: 1,
            lineTotal: Number(createdProducts[2].unitPrice) * 1
          }]
        }
      }
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
