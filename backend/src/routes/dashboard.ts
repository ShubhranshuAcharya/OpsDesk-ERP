import { Router } from 'express';
import { prisma } from '../db';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

router.get('/', async (req: any, res: any) => {
  try {
    const role = req.user!.role;
    
    // Time calculations
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    // 1. KPIs
    const [
      totalCustomers,
      totalCustomersLastMonth,
      activeLeads,
      activeLeadsLastMonth,
      lowStockItems,
      challansThisMonth,
      challansLastMonth
    ] = await Promise.all([
      // Total Customers
      prisma.customer.count(),
      prisma.customer.count({ where: { createdAt: { lt: startOfMonth } } }),
      
      // Active Leads
      prisma.customer.count({ where: { status: 'LEAD' } }),
      prisma.customer.count({ where: { status: 'LEAD', createdAt: { lt: startOfMonth } } }),
      
      // Low Stock Items (where currentStock <= minStockAlert AND minStockAlert > 0)
      // Actually we just want items that have reached their alert threshold.
      prisma.product.count({
        where: {
          minStockAlert: { gt: 0 },
          currentStock: { lte: prisma.product.fields.minStockAlert } // Wait, Prisma doesn't support comparing two fields directly in count yet without raw SQL, let's fetch all and filter in memory if small, or use raw. For MVP we'll fetch raw.
        }
      }).catch(() => 0), // Fallback
      
      // Challans
      prisma.salesChallan.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.salesChallan.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
    ]);

    // Prisma workaround for comparing fields: Raw query
    const lowStockRaw: any[] = await prisma.$queryRaw`SELECT count(*) as count FROM "products" WHERE "currentStock" <= "minStockAlert" AND "minStockAlert" > 0`;
    const actualLowStockItems = Number(lowStockRaw[0]?.count || 0);

    // Calculate Deltas (simple difference for now, or percentage)
    const calcDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const kpis = {
      totalCustomers: { value: totalCustomers, delta: calcDelta(totalCustomers, totalCustomersLastMonth) },
      activeLeads: { value: activeLeads, delta: calcDelta(activeLeads, activeLeadsLastMonth) },
      lowStockItems: { value: actualLowStockItems, delta: 0 }, // Hard to compute delta without historical snapshots
      challansThisMonth: { value: challansThisMonth, delta: calcDelta(challansThisMonth, challansLastMonth) }
    };

    // 2. Panels
    // Stock Alerts (Products below min stock)
    const stockAlertsRaw: any[] = await prisma.$queryRaw`SELECT id, name, sku, "currentStock", "minStockAlert" FROM "products" WHERE "currentStock" <= "minStockAlert" AND "minStockAlert" > 0 LIMIT 10`;
    
    // Follow-ups Today (Admin/Sales only)
    let followUpsToday: any[] = [];
    if (['ADMIN', 'SALES'].includes(role)) {
      followUpsToday = await prisma.customer.findMany({
        where: {
          followUpDate: {
            gte: startOfToday,
            lt: endOfToday
          }
        },
        select: { id: true, name: true, businessName: true, mobile: true, followUpDate: true },
        take: 10
      });
    }

    // Recent Challans
    const recentChallans = await prisma.salesChallan.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } }
      }
    });

    // 3. New Dashboard Widgets
    // Challan Pipeline
    const pipelineRaw = await prisma.salesChallan.groupBy({
      by: ['status'],
      where: { createdAt: { gte: startOfMonth } },
      _count: { _all: true }
    });
    const challanPipeline = {
      DRAFT: pipelineRaw.find(p => p.status === 'DRAFT')?._count._all || 0,
      CONFIRMED: pipelineRaw.find(p => p.status === 'CONFIRMED')?._count._all || 0,
      CANCELLED: pipelineRaw.find(p => p.status === 'CANCELLED')?._count._all || 0,
    };

    // Top Products
    const topOutMovements = await prisma.stockMovementLog.groupBy({
      by: ['productId'],
      where: { movementType: 'OUT', createdAt: { gte: startOfMonth } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });
    const productIds = topOutMovements.map(m => m.productId);
    const productsData = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true, sku: true } });
    const topProducts = topOutMovements.map(m => {
      const p = productsData.find(x => x.id === m.productId);
      return { id: m.productId, name: p?.name, sku: p?.sku, quantity: m._sum.quantity || 0 };
    });

    // Recent Activity Feed
    const recentMovements = await prisma.stockMovementLog.findMany({ take: 3, orderBy: { createdAt: 'desc' }, include: { product: { select: { name: true } }, createdBy: { select: { name: true } } } });
    const recentChalls = await prisma.salesChallan.findMany({ take: 3, orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } });
    const recentCusts = await prisma.customer.findMany({ take: 3, orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } });
    
    let activityFeed: any[] = [];
    recentMovements.forEach(m => activityFeed.push({
      id: m.id, date: m.createdAt,
      actionStr: `${m.createdBy.name} ${m.movementType === 'IN' ? 'restocked' : 'deducted'} ${m.product.name} (${m.movementType === 'IN' ? '+' : '-'}${m.quantity})`
    }));
    recentChalls.forEach(c => activityFeed.push({
      id: c.id, date: c.createdAt,
      actionStr: `${c.createdBy.name} ${c.status === 'CONFIRMED' ? 'confirmed' : 'created'} challan ${c.challanNumber}`
    }));
    recentCusts.forEach(c => activityFeed.push({
      id: c.id, date: c.createdAt,
      actionStr: `${c.createdBy.name} added customer '${c.name}'`
    }));
    
    activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime());
    const recentActivity = activityFeed.slice(0, 8);

    res.json({
      kpis,
      panels: {
        stockAlerts: stockAlertsRaw,
        followUpsToday,
        recentChallans,
        challanPipeline,
        topProducts,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to aggregate dashboard data.' });
  }
});

export default router;
