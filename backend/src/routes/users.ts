import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const router = Router();
const prisma = new PrismaClient();

// Apply auth middleware to all routes in this router
router.use(authenticate);
router.use(authorize(['ADMIN']));

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  isActive: z.boolean().default(true),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
});

// GET /api/users
router.get('/', async (req: AuthRequest, res: any) => {
  try {
    const { search, role, status, page = '1', limit = '10' } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    let whereClause: any = {};
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search as string } },
        { email: { contains: search as string } }
      ];
    }
    
    if (role) {
      whereClause.role = role as string;
    }
    
    if (status) {
      whereClause.isActive = status === 'Active';
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where: whereClause })
    ]);

    res.json({
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users
router.post('/', async (req: AuthRequest, res: any) => {
  try {
    const data = userSchema.parse(req.body);
    
    if (!data.password) {
      return res.status(400).json({ error: 'Password is required when creating a user' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        passwordHash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    res.status(201).json(newUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req: AuthRequest, res: any) => {
  try {
    const data = userSchema.parse(req.body);
    const userId = req.params.id as string;

    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if email is changed
    if (data.email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email: data.email } });
      if (emailTaken) {
        return res.status(409).json({ error: 'Email is already in use by another user' });
      }
    }

    // Protect against self-demotion or self-deactivation
    if (req.user?.id === userId) {
      if (data.role !== 'ADMIN') {
        return res.status(400).json({ error: 'You cannot demote your own account from Admin.' });
      }
      if (data.isActive === false) {
        return res.status(400).json({ error: 'You cannot deactivate your own account.' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join(', ') });
    }
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
