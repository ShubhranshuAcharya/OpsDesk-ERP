import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const customerSchema = z.object({
  name: z.string().min(1),
  mobile: z.string().min(10),
  email: z.string().email().optional().nullable(),
  businessName: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  address: z.string().optional().nullable(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).default('LEAD'),
});

// GET /api/customers
router.get('/', authorize(['ADMIN', 'SALES', 'ACCOUNTS']), async (req, res) => {
  try {
    const { search, status, type, page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { mobile: { contains: search as string } },
        { businessName: { contains: search as string } }
      ];
    }
    
    if (status) {
      whereClause.status = status as string;
    }
    
    if (type) {
      whereClause.customerType = type as string;
    }

    const validSortFields = ['name', 'createdAt', 'followUpDate'];
    const orderByField = validSortFields.includes(sortBy as string) ? (sortBy as string) : 'createdAt';
    const orderByDirection = sortOrder === 'asc' ? 'asc' : 'desc';

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where: whereClause,
        orderBy: { [orderByField]: orderByDirection },
        skip,
        take: limitNum,
      }),
      prisma.customer.count({ where: whereClause })
    ]);
    
    res.json({
      data: customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customers.' });
  }
});

// GET /api/customers/:id
router.get('/:id', authorize(['ADMIN', 'SALES', 'ACCOUNTS']), async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id as string },
      include: {
        followUpNotes: {
          include: { createdBy: { select: { name: true } } },
          orderBy: { createdAt: 'desc' }
        },
        challans: {
          orderBy: { createdAt: 'desc' }
          // REMOVED 'take: 5' to fetch full history for detail page
        }
      }
    });
    
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch customer.' });
  }
});

// PUT /api/customers/:id
router.put('/:id', authorize(['ADMIN', 'SALES']), async (req: any, res: any) => {
  try {
    const data = customerSchema.parse(req.body);
    const customer = await prisma.customer.update({
      where: { id: req.params.id as string },
      data
    });
    res.json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') });
    res.status(500).json({ error: 'Failed to update customer.' });
  }
});

// POST /api/customers
router.post('/', authorize(['ADMIN', 'SALES']), async (req: any, res: any) => {
  try {
    const data = customerSchema.parse(req.body);
    
    const customer = await prisma.customer.create({
      data: {
        ...data,
        createdById: req.user!.id
      }
    });
    
    res.status(201).json(customer);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') });
    res.status(500).json({ error: 'Failed to create customer.' });
  }
});

// POST /api/customers/:id/notes
router.post('/:id/notes', authorize(['ADMIN', 'SALES']), async (req: any, res: any) => {
  try {
    const { note, followUpDate } = req.body;
    if (!note) return res.status(400).json({ error: 'Note is required.' });

    const newNote = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.followUpNote.create({
        data: {
          note,
          customerId: req.params.id as string,
          createdById: req.user!.id
        }
      });
      
      if (followUpDate) {
        await tx.customer.update({
          where: { id: req.params.id as string },
          data: { followUpDate: new Date(followUpDate) }
        });
      }
      
      return createdNote;
    });

    res.status(201).json(newNote);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add note.' });
  }
});

export default router;
