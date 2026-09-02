import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import dayjs from 'dayjs';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(authorize(['ADMIN', 'ACCOUNTS']));

const dateQuerySchema = z.object({
  from: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid 'from' date" }),
  to: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid 'to' date" }),
}).refine(data => new Date(data.from) <= new Date(data.to), {
  message: "'from' date must be before or equal to 'to' date",
  path: ['from']
});

// GET /api/reports/sales-summary
router.get('/sales-summary', async (req: AuthRequest, res: any) => {
  try {
    const { from, to } = dateQuerySchema.parse(req.query);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    // ensure end of day for 'to'
    toDate.setHours(23, 59, 59, 999);

    // 1. Total challans by status
    const statusCounts = await prisma.salesChallan.groupBy({
      by: ['status'],
      where: { createdAt: { gte: fromDate, lte: toDate } },
      _count: { _all: true }
    });

    // 2. Total quantity sold (Confirmed only)
    const quantityAgg = await prisma.salesChallan.aggregate({
      where: { 
        status: 'CONFIRMED',
        createdAt: { gte: fromDate, lte: toDate }
      },
      _sum: { totalQuantity: true }
    });

    // 3. Trends (Draft vs Confirmed challans over time)
    // Fetch both statuses to build a dual-series trend
    const trendChallans = await prisma.salesChallan.findMany({
      where: {
        status: { in: ['CONFIRMED', 'DRAFT'] },
        createdAt: { gte: fromDate, lte: toDate }
      },
      select: { createdAt: true, status: true }
    });

    const trendsMap: Record<string, { confirmed: number, draft: number }> = {};
    trendChallans.forEach(c => {
      const dateStr = dayjs(c.createdAt).format('YYYY-MM-DD');
      if (!trendsMap[dateStr]) trendsMap[dateStr] = { confirmed: 0, draft: 0 };
      if (c.status === 'CONFIRMED') trendsMap[dateStr].confirmed++;
      if (c.status === 'DRAFT') trendsMap[dateStr].draft++;
    });

    const trends = Object.entries(trendsMap)
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));

    res.json({
      statusCounts: statusCounts.map(s => ({ status: s.status, count: s._count._all })),
      totalQuantity: quantityAgg._sum.totalQuantity || 0,
      trends
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') });
    console.error('Error in sales-summary:', error);
    res.status(500).json({ error: 'Failed to generate sales summary' });
  }
});

// GET /api/reports/customer-breakdown
router.get('/customer-breakdown', async (req: AuthRequest, res: any) => {
  try {
    const { from, to } = dateQuerySchema.parse(req.query);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const statusCounts = await prisma.customer.groupBy({
      by: ['status'],
      where: { createdAt: { lte: toDate } },
      _count: { _all: true }
    });

    const typeCounts = await prisma.customer.groupBy({
      by: ['customerType'],
      where: { createdAt: { lte: toDate } },
      _count: { _all: true }
    });

    // Top customers by confirmed quantity in range
    const topCustomers = await prisma.salesChallan.groupBy({
      by: ['customerId'],
      where: { 
        status: 'CONFIRMED',
        createdAt: { gte: fromDate, lte: toDate }
      },
      _sum: { totalQuantity: true },
      orderBy: { _sum: { totalQuantity: 'desc' } },
      take: 10
    });

    // Populate customer names
    const customerIds = topCustomers.map(c => c.customerId);
    const customersData = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, businessName: true }
    });

    const topCustomersEnriched = topCustomers.map(tc => {
      const cust = customersData.find(c => c.id === tc.customerId);
      return {
        id: tc.customerId,
        name: cust?.name || 'Unknown',
        businessName: cust?.businessName || null,
        totalQuantity: tc._sum.totalQuantity || 0
      };
    });

    res.json({
      statusCounts: statusCounts.map(s => ({ name: s.status, value: s._count._all })),
      typeCounts: typeCounts.map(t => ({ name: t.customerType, value: t._count._all })),
      topCustomers: topCustomersEnriched
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') });
    console.error('Error in customer-breakdown:', error);
    res.status(500).json({ error: 'Failed to generate customer breakdown' });
  }
});

// GET /api/reports/inventory-health
router.get('/inventory-health', async (req: AuthRequest, res: any) => {
  try {
    const { from, to } = dateQuerySchema.parse(req.query);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    // Reuse low stock logic (same as dashboard)
    // We get products where currentStock <= minStockAlert
    // Note: Prisma does not support column-to-column comparison in where clause directly yet, 
    // so we fetch and filter in JS.
    const allProducts = await prisma.product.findMany({
      select: { id: true, name: true, sku: true, currentStock: true, minStockAlert: true }
    });
    const lowStockProducts = allProducts.filter(p => p.currentStock <= p.minStockAlert);

    // Stock movements in range
    const movements = await prisma.stockMovementLog.groupBy({
      by: ['productId', 'movementType'],
      where: { createdAt: { gte: fromDate, lte: toDate } },
      _sum: { quantity: true }
    });

    // Aggregate IN/OUT by product
    const movementMap: Record<string, { id: string, name: string, sku: string, in: number, out: number, net: number }> = {};
    
    // Initialize map with products that had movements
    movements.forEach(m => {
      if (!movementMap[m.productId]) {
        const p = allProducts.find(prod => prod.id === m.productId);
        movementMap[m.productId] = { 
          id: m.productId, 
          name: p?.name || 'Unknown', 
          sku: p?.sku || 'Unknown',
          in: 0, 
          out: 0, 
          net: 0 
        };
      }
      
      const qty = m._sum.quantity || 0;
      if (m.movementType === 'IN') {
        movementMap[m.productId].in += qty;
        movementMap[m.productId].net += qty;
      } else {
        movementMap[m.productId].out += qty;
        movementMap[m.productId].net -= qty;
      }
    });

    const movementSummary = Object.values(movementMap).sort((a, b) => b.in + b.out - (a.in + a.out));

    res.json({
      lowStockCount: lowStockProducts.length,
      movementSummary
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') });
    console.error('Error in inventory-health:', error);
    res.status(500).json({ error: 'Failed to generate inventory health' });
  }
});

// GET /api/reports/followup-compliance
router.get('/followup-compliance', async (req: AuthRequest, res: any) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueCustomers = await prisma.customer.findMany({
      where: {
        status: { in: ['LEAD', 'ACTIVE'] },
        followUpDate: { lt: today }
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        mobile: true,
        status: true,
        followUpDate: true
      },
      orderBy: { followUpDate: 'asc' }
    });

    res.json({
      overdueCount: overdueCustomers.length,
      overdueCustomers
    });
  } catch (error) {
    console.error('Error in followup-compliance:', error);
    res.status(500).json({ error: 'Failed to generate followup compliance' });
  }
});

export default router;
