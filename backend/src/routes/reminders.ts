import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import dayjs from 'dayjs';

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  scheduledFor: z.string().datetime()
});

// GET /api/reminders?month=YYYY-MM
router.get('/', async (req: AuthRequest, res: any) => {
  try {
    const userId = req.user!.id;
    const { month } = req.query; // format: 'YYYY-MM'

    let whereClause: any = { userId };

    if (month && typeof month === 'string') {
      const startOfMonth = dayjs(month).startOf('month').toDate();
      const endOfMonth = dayjs(month).endOf('month').toDate();
      whereClause.scheduledFor = {
        gte: startOfMonth,
        lte: endOfMonth
      };
    }

    let reminders: any[] = [];
    if (prisma.reminder) {
      reminders = await prisma.reminder.findMany({
        where: whereClause,
        orderBy: { scheduledFor: 'asc' }
      });
    } else {
      console.warn('Prisma Reminder model not loaded. Please restart your dev server.');
    }

    res.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// POST /api/reminders
router.post('/', async (req: AuthRequest, res: any) => {
  try {
    const data = createSchema.parse(req.body);
    const reminder = await prisma.reminder.create({
      data: {
        userId: req.user!.id,
        title: data.title,
        scheduledFor: new Date(data.scheduledFor),
      }
    });
    res.status(201).json(reminder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues });
    }
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// PATCH /api/reminders/:id
router.patch('/:id', async (req: AuthRequest, res: any) => {
  try {
    const id = req.params.id as string;
    const { completed, title, scheduledFor } = req.body;

    const existing = await prisma.reminder.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        ...(completed !== undefined && { completed }),
        ...(title !== undefined && { title }),
        ...(scheduledFor !== undefined && { scheduledFor: new Date(scheduledFor) })
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', async (req: AuthRequest, res: any) => {
  try {
    const id = req.params.id as string;

    const existing = await prisma.reminder.findFirst({
      where: { id, userId: req.user!.id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reminder not found' });
    }

    await prisma.reminder.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

export default router;
