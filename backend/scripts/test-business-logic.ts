import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createChallan(customerId: string, productId: string, quantity: number, createdById: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');
    
    if (product.currentStock < quantity) {
      throw new Error(`Insufficient stock for product: ${product.name}`);
    }

    const count = await tx.salesChallan.count();
    const challanNumber = `TEST-CH-${Date.now()}-${count}`;

    const challan = await tx.salesChallan.create({
      data: {
        challanNumber,
        customerId,
        status: 'CONFIRMED',
        totalQuantity: quantity,
        createdById,
        confirmedAt: new Date(),
        items: {
          create: [{
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            unitPrice: product.unitPrice,
            quantity: quantity,
            lineTotal: product.unitPrice * quantity
          }]
        }
      },
      include: { items: true }
    });

    await tx.product.update({
      where: { id: product.id },
      data: { currentStock: product.currentStock - quantity }
    });

    await tx.stockMovementLog.create({
      data: {
        productId: product.id,
        quantity: quantity,
        movementType: 'OUT',
        reason: `Sales Challan: ${challanNumber}`,
        createdById
      }
    });

    return challan;
  });
}

async function runTests() {
  console.log('--- Starting Business Logic Tests ---');
  let customerId = '';
  let productId = '';
  let adminId = '';

  try {
    // SETUP
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    adminId = admin?.id || (await prisma.user.create({ data: { name: 'Test', email: 'test@test.com', passwordHash: 'hash', role: 'ADMIN' } })).id;

    const customer = await prisma.customer.create({
      data: { name: 'Test Customer', mobile: '1234567890', customerType: 'RETAIL', status: 'ACTIVE', createdById: adminId }
    });
    customerId = customer.id;

    const product = await prisma.product.create({
      data: { name: 'Test Product', sku: `SKU-${Date.now()}`, unitPrice: 100, currentStock: 20 }
    });
    productId = product.id;

    console.log(`Setup Complete. Created Product with Stock: 20`);

    // TEST 1 (Success)
    console.log(`\nRunning Test 1: Order 15 units (Expect Success)`);
    await createChallan(customerId, productId, 15, adminId);
    
    const updatedProduct = await prisma.product.findUnique({ where: { id: productId } });
    if (updatedProduct?.currentStock === 5) {
      console.log(`✅ Success: Stock successfully reduced to 5.`);
    } else {
      throw new Error(`❌ Failure: Stock is ${updatedProduct?.currentStock}, expected 5.`);
    }

    // TEST 2 (Failure/Block)
    console.log(`\nRunning Test 2: Order 10 units (Expect Block due to Insufficient Stock)`);
    try {
      await createChallan(customerId, productId, 10, adminId);
      throw new Error(`❌ Failure: Challan was created successfully but it should have been blocked!`);
    } catch (err: any) {
      if (err.message.includes('Insufficient stock')) {
        console.log(`✅ Success: Transaction blocked. Error caught: ${err.message}`);
      } else {
        throw err;
      }
    }

  } catch (error: any) {
    console.error(error.message);
    process.exit(1);
  } finally {
    // CLEANUP
    console.log('\nCleaning up test data...');
    if (customerId) {
      const challans = await prisma.salesChallan.findMany({ where: { customerId } });
      for (const ch of challans) {
        await prisma.stockMovementLog.deleteMany({ where: { reason: { contains: ch.challanNumber } } });
      }
      await prisma.salesChallan.deleteMany({ where: { customerId } });
      await prisma.customer.delete({ where: { id: customerId } });
    }
    if (productId) {
      await prisma.product.delete({ where: { id: productId } });
    }
    console.log('Cleanup complete.');
    await prisma.$disconnect();
  }
}

runTests();
