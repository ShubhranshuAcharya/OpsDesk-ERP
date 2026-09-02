import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * GET /api/notifications
 * Returns a unified list of actionable notifications:
 *   - LOW_STOCK: Products where currentStock <= minStockAlert (and minStockAlert > 0)
 *   - FOLLOW_UP: Customers with a followUpDate on or before today
 *
 * No DB schema change needed — this is a pure aggregation over existing data.
 */
router.get('/', async (req: AuthRequest, res: any) => {
  try {
    const role = req.user!.role;
    const now = new Date();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // Fetch all due, uncompleted reminders for the requesting user
    let dueReminders: any[] = [];
    if (prisma.reminder) {
      dueReminders = await prisma.reminder.findMany({
        where: {
          userId: req.user!.id,
          scheduledFor: { lte: now },
          completed: false
        }
      });
    } else {
      console.warn('Prisma Reminder model not loaded. Please restart your dev server.');
    }

    // Mark any previously unnotified ones as notified
    const unnotified = dueReminders.filter(r => !r.notified);
    if (unnotified.length > 0) {
      await prisma.reminder.updateMany({
        where: { id: { in: unnotified.map(r => r.id) } },
        data: { notified: true }
      });
    }

    // 1. Low-stock products (all roles that can see inventory)
    const lowStockProducts: any[] = await prisma.$queryRaw`
      SELECT id, name, sku, "currentStock", "minStockAlert"
      FROM "products"
      WHERE "currentStock" <= "minStockAlert"
        AND "minStockAlert" > 0
      ORDER BY "currentStock" ASC
      LIMIT 20
    `;

    // 2. Follow-ups due today or overdue (ADMIN + SALES only)
    let overdueFollowUps: any[] = [];
    if (['ADMIN', 'SALES'].includes(role)) {
      overdueFollowUps = await prisma.customer.findMany({
        where: {
          followUpDate: { lte: endOfToday },
          status: { not: 'INACTIVE' },
        },
        select: { id: true, name: true, businessName: true, followUpDate: true },
        orderBy: { followUpDate: 'asc' },
        take: 20,
      });
    }

    // Unify into a single notification shape
    const notifications = [
      ...lowStockProducts.map((p) => ({
        id: `low-stock-${p.id}`,
        type: 'LOW_STOCK' as const,
        entityId: p.id,
        message: `${p.name} is low on stock (${p.currentStock} left)`,
        subMessage: `SKU: ${p.sku} · Min: ${p.minStockAlert}`,
        linkTo: `/inventory/${p.id}`,
        timestamp: null,
      })),
      ...overdueFollowUps.map((c) => {
        const followUp = new Date(c.followUpDate);
        const isOverdue = followUp < now;
        return {
          id: `follow-up-${c.id}`,
          type: 'FOLLOW_UP' as const,
          entityId: c.id,
          message: `Follow-up due: ${c.name}${c.businessName ? ` (${c.businessName})` : ''}`,
          subMessage: isOverdue ? 'Overdue' : 'Due today',
          linkTo: `/customers/${c.id}`,
          timestamp: c.followUpDate,
        };
      }),
      ...dueReminders.map(r => ({
        id: `reminder-${r.id}`,
        type: 'REMINDER' as const,
        entityId: r.id,
        message: 'Reminder',
        subMessage: r.title,
        linkTo: `?date=${r.scheduledFor.toISOString().split('T')[0]}`,
        timestamp: r.scheduledFor,
      }))
    ];

    res.json({ notifications, total: notifications.length });
  } catch (error) {
    console.error('Notifications Error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

export default router;
