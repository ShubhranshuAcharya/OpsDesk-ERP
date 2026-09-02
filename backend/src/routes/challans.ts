import { Router } from 'express';
import { prisma } from '../db';
import { authenticate, authorize } from '../middleware/auth';
import { z } from 'zod';
import PDFDocument from 'pdfkit';

const router = Router();
router.use(authenticate);

const challanItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive()
});

const challanSchema = z.object({
  customerId: z.string(),
  status: z.enum(['DRAFT', 'CONFIRMED']),
  items: z.array(challanItemSchema).min(1)
});

// GET /api/challans
router.get('/', authorize(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), async (req, res) => {
  try {
    const { page = '1', limit = '15', status, customerId, startDate, endDate } = req.query;
    
    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    let whereClause: any = {};

    if (status) whereClause.status = status;
    if (customerId) whereClause.customerId = customerId;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = end;
      }
    }

    const [challans, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where: whereClause,
        skip,
        take: limitNum,
        include: {
          customer: { select: { name: true, businessName: true } },
          createdBy: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.salesChallan.count({ where: whereClause })
    ]);

    res.json({
      data: challans,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch challans.' });
  }
});

// GET /api/challans/:id/pdf
router.get('/:id/pdf', authorize(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), async (req: any, res: any) => {
  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id as string },
      include: {
        customer: true,
        items: true,
        createdBy: { select: { name: true } }
      }
    });

    if (!challan) return res.status(404).json({ error: 'Challan not found' });

    // Build PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${challan.challanNumber}.pdf"`
    );
    doc.pipe(res);

    const BRAND_BLUE = '#2E5AAC';
    const DARK = '#101828';
    const MUTED = '#6B7280';
    const LIGHT_GRAY = '#F3F4F6';
    const PAGE_WIDTH = 595 - 100; // A4 minus margins

    // ── Header ─────────────────────────────────────────────────────────────
    doc.rect(0, 0, 595, 80).fill(BRAND_BLUE);

    doc.fill('white')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('OpsDesk', 50, 22);

    doc.fontSize(9)
      .font('Helvetica')
      .text('Operations Portal', 50, 50);

    doc.fill('white')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('SALES CHALLAN', 0, 28, { align: 'right', width: 545 });

    doc.fontSize(9)
      .font('Helvetica')
      .text(`Status: ${challan.status}`, 0, 52, { align: 'right', width: 545 });

    // ── Challan Meta ───────────────────────────────────────────────────────
    doc.moveDown(3);
    const metaTop = doc.y;

    // Left column — challan info
    doc.fill(DARK).fontSize(10).font('Helvetica-Bold').text('Challan Number:', 50, metaTop);
    doc.fill(DARK).fontSize(11).font('Helvetica-Bold').text(challan.challanNumber, 50, metaTop + 14);

    doc.fill(MUTED).fontSize(9).font('Helvetica').text('Created:', 50, metaTop + 34);
    doc.fill(DARK).fontSize(9).text(
      new Date(challan.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      50, metaTop + 46
    );

    if (challan.confirmedAt) {
      doc.fill(MUTED).fontSize(9).text('Confirmed:', 50, metaTop + 62);
      doc.fill(DARK).fontSize(9).text(
        new Date(challan.confirmedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        50, metaTop + 74
      );
    }

    // Right column — customer info
    const rightCol = 310;
    doc.fill(MUTED).fontSize(9).font('Helvetica').text('Bill To:', rightCol, metaTop);
    doc.fill(DARK).fontSize(10).font('Helvetica-Bold').text(challan.customer.name, rightCol, metaTop + 14);

    let customerY = metaTop + 28;
    if (challan.customer.businessName) {
      doc.fill(DARK).fontSize(9).font('Helvetica').text(challan.customer.businessName, rightCol, customerY);
      customerY += 13;
    }
    if (challan.customer.mobile) {
      doc.fill(MUTED).fontSize(9).text(`Mobile: ${challan.customer.mobile}`, rightCol, customerY);
      customerY += 13;
    }
    if (challan.customer.address) {
      doc.fill(MUTED).fontSize(9).text(challan.customer.address, rightCol, customerY, { width: 185 });
    }

    // Prepared by
    const preparedByY = challan.confirmedAt ? metaTop + 90 : metaTop + 62;
    doc.fill(MUTED).fontSize(9).font('Helvetica').text('Prepared By:', 50, preparedByY);
    doc.fill(DARK).fontSize(9).text(challan.createdBy.name, 50, preparedByY + 12);

    // ── Divider ────────────────────────────────────────────────────────────
    const tableTop = Math.max(doc.y, customerY + 20) + 20;
    doc.moveTo(50, tableTop).lineTo(545, tableTop).lineWidth(1).strokeColor(BRAND_BLUE).stroke();

    // ── Items Table Header ─────────────────────────────────────────────────
    const tableHeaderY = tableTop + 8;
    doc.rect(50, tableHeaderY, PAGE_WIDTH, 20).fill(LIGHT_GRAY);

    doc.fill(MUTED).fontSize(8).font('Helvetica-Bold');
    doc.text('#',       55,  tableHeaderY + 6, { width: 20 });
    doc.text('SKU',     80,  tableHeaderY + 6, { width: 80 });
    doc.text('Product', 165, tableHeaderY + 6, { width: 170 });
    doc.text('Unit Price', 340, tableHeaderY + 6, { width: 70, align: 'right' });
    doc.text('Qty',     415, tableHeaderY + 6, { width: 40, align: 'right' });
    doc.text('Line Total', 460, tableHeaderY + 6, { width: 80, align: 'right' });

    // ── Items ───────────────────────────────────────────────────────────────
    let rowY = tableHeaderY + 22;
    challan.items.forEach((item: any, idx: number) => {
      const rowBg = idx % 2 === 0 ? 'white' : '#FAFAFA';
      doc.rect(50, rowY - 3, PAGE_WIDTH, 18).fill(rowBg);

      doc.fill(MUTED).fontSize(8).font('Helvetica').text(String(idx + 1), 55, rowY, { width: 20 });
      doc.fill(DARK).fontSize(8).text(item.productSku, 80, rowY, { width: 80 });
      doc.fill(DARK).fontSize(8).font('Helvetica').text(item.productName, 165, rowY, { width: 165, ellipsis: true });
      doc.fill(DARK).fontSize(8).text(`$${parseFloat(item.unitPrice).toFixed(2)}`, 340, rowY, { width: 70, align: 'right' });
      doc.fill(DARK).fontSize(8).font('Helvetica-Bold').text(String(item.quantity), 415, rowY, { width: 40, align: 'right' });
      doc.fill(BRAND_BLUE).fontSize(8).font('Helvetica-Bold').text(`$${parseFloat(item.lineTotal).toFixed(2)}`, 460, rowY, { width: 80, align: 'right' });

      rowY += 18;
    });

    // ── Totals ─────────────────────────────────────────────────────────────
    const totalsTop = rowY + 10;
    doc.moveTo(50, totalsTop).lineTo(545, totalsTop).lineWidth(0.5).strokeColor('#D1D5DB').stroke();

    const grandTotal = challan.items.reduce((s: number, i: any) => s + parseFloat(i.lineTotal), 0);

    doc.fill(MUTED).fontSize(9).font('Helvetica').text('Total Quantity:', 350, totalsTop + 10, { width: 110, align: 'right' });
    doc.fill(DARK).fontSize(9).font('Helvetica-Bold').text(String(challan.totalQuantity), 465, totalsTop + 10, { width: 75, align: 'right' });

    doc.rect(50, totalsTop + 28, PAGE_WIDTH, 26).fill(BRAND_BLUE);
    doc.fill('white').fontSize(10).font('Helvetica-Bold').text('GRAND TOTAL', 350, totalsTop + 36, { width: 110, align: 'right' });
    doc.fill('white').fontSize(12).font('Helvetica-Bold').text(`$${grandTotal.toFixed(2)}`, 465, totalsTop + 34, { width: 75, align: 'right' });

    // ── Footer ──────────────────────────────────────────────────────────────
    const footerY = 780;
    doc.moveTo(50, footerY).lineTo(545, footerY).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
    doc.fill(MUTED).fontSize(8).font('Helvetica')
      .text(
        `This is a computer-generated document. Generated on ${new Date().toLocaleString('en-IN')} by OpsDesk.`,
        50, footerY + 8, { align: 'center', width: PAGE_WIDTH }
      );

    doc.end();
  } catch (error) {
    console.error('PDF generation error:', error);
    // If headers already sent (pipe started), we can't send JSON. Just end.
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF.' });
    }
  }
});

// GET /api/challans/:id
router.get('/:id', authorize(['ADMIN', 'SALES', 'ACCOUNTS', 'WAREHOUSE']), async (req, res) => {
  try {
    const challan = await prisma.salesChallan.findUnique({
      where: { id: req.params.id as string },
      include: {
        customer: true,
        items: true,
        createdBy: { select: { name: true } }
      }
    });
    if (!challan) return res.status(404).json({ error: 'Challan not found' });
    res.json(challan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challan details.' });
  }
});

// Helper for throwing structured stock errors
function throwStockError(failures: { name: string, required: number, available: number }[]) {
  throw new Error(JSON.stringify({ type: 'STOCK_ERROR', failures }));
}

// POST /api/challans
router.post('/', authorize(['ADMIN', 'SALES']), async (req: any, res: any) => {
  try {
    const data = challanSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch product details for snapshot
      const productIds = data.items.map(item => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      
      if (products.length !== productIds.length) {
        throw new Error('One or more products not found');
      }

      const productMap = new Map(products.map(p => [p.id, p]));

      // 2. Validate stock if CONFIRMED
      if (data.status === 'CONFIRMED') {
        const failures: { name: string, required: number, available: number }[] = [];
        for (const item of data.items) {
          const product = productMap.get(item.productId)!;
          if (product.currentStock < item.quantity) {
            failures.push({ name: product.name, required: item.quantity, available: product.currentStock });
          }
        }
        if (failures.length > 0) throwStockError(failures);
      }

      // 3. Generate Challan Number
      const count = await tx.salesChallan.count();
      const challanNumber = `CH-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      // 4. Create Challan
      const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);

      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId: data.customerId,
          status: data.status,
          totalQuantity,
          createdById: req.user!.id,
          confirmedAt: data.status === 'CONFIRMED' ? new Date() : null,
          items: {
            create: data.items.map(item => {
              const p = productMap.get(item.productId)!;
              return {
                productId: p.id,
                productName: p.name,
                productSku: p.sku,
                unitPrice: p.unitPrice,
                quantity: item.quantity,
                lineTotal: Number(p.unitPrice) * item.quantity
              };
            })
          }
        },
        include: { items: true }
      });

      // 5. Deduct stock and log movement if CONFIRMED
      if (data.status === 'CONFIRMED') {
        for (const item of data.items) {
          const p = productMap.get(item.productId)!;
          
          const updatedProduct = await tx.product.update({
            where: { id: p.id },
            data: { currentStock: { decrement: item.quantity } }
          });

          if (updatedProduct.currentStock < 0) {
            throwStockError([{ name: p.name, required: item.quantity, available: updatedProduct.currentStock + item.quantity }]);
          }

          await tx.stockMovementLog.create({
            data: {
              productId: p.id,
              quantity: item.quantity,
              movementType: 'OUT',
              reason: `Sales Challan: ${challanNumber}`,
              createdById: req.user!.id
            }
          });
        }
      }

      return challan;
    });

    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') });
    
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.type === 'STOCK_ERROR') {
        return res.status(400).json({ error: 'INSUFFICIENT_STOCK', failures: parsed.failures });
      }
    } catch (e) {
      // not a JSON error
    }
    
    res.status(400).json({ error: error.message || 'Failed to create challan.' });
  }
});

// PUT /api/challans/:id
router.put('/:id', authorize(['ADMIN', 'SALES']), async (req: any, res: any) => {
  try {
    const data = challanSchema.parse(req.body);
    
    // We only allow editing DRAFT challans. Status transitions (CONFIRMED) must go through the dedicated endpoint or we must check if status changed.
    // For safety, this endpoint will only update DRAFT challans and leave them as DRAFT.
    if (data.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Please use the /confirm endpoint to confirm a challan.' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.salesChallan.findUnique({
        where: { id: req.params.id as string },
        include: { items: true }
      });

      if (!existing) throw new Error('Challan not found');
      if (existing.status !== 'DRAFT') throw new Error('Only DRAFT challans can be edited');

      // 1. Verify all products exist and are active
      const productIds = data.items.map(i => i.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } }
      });

      if (products.length !== productIds.length) {
        throw new Error('One or more products are invalid or inactive');
      }

      const productMap = new Map(products.map(p => [p.id, p]));

      // 2. Delete old items and insert new ones
      await tx.challanItem.deleteMany({
        where: { challanId: existing.id }
      });

      let totalValue = 0;
      let totalQuantity = 0;

      const newItems = data.items.map(item => {
        const p = productMap.get(item.productId)!;
        const lineTotal = Number(p.unitPrice) * item.quantity;
        totalValue += lineTotal;
        totalQuantity += item.quantity;
        return {
          productId: p.id,
          productName: p.name,
          productSku: p.sku,
          unitPrice: p.unitPrice,
          quantity: item.quantity,
          lineTotal
        };
      });

      const updatedChallan = await tx.salesChallan.update({
        where: { id: existing.id },
        data: {
          customer: { connect: { id: data.customerId } },
          totalQuantity,
          items: {
            create: newItems
          }
        },
        include: { items: true }
      });

      return updatedChallan;
    });

    res.status(200).json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') });
    res.status(400).json({ error: error.message || 'Failed to update draft challan.' });
  }
});


// PUT /api/challans/:id/confirm
router.put('/:id/confirm', authorize(['ADMIN', 'SALES']), async (req: any, res: any) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({
        where: { id: req.params.id as string },
        include: { items: true }
      });

      if (!challan) throw new Error('Challan not found');
      if (challan.status !== 'DRAFT') throw new Error('Only DRAFT challans can be confirmed');

      // Check stock
      const failures: { name: string, required: number, available: number }[] = [];
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Product not found: ${item.productName}`);
        
        if (product.currentStock < item.quantity) {
          failures.push({ name: product.name, required: item.quantity, available: product.currentStock });
        }
      }
      
      if (failures.length > 0) throwStockError(failures);

      // Deduct stock
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        
        const updatedProduct = await tx.product.update({
          where: { id: product!.id },
          data: { currentStock: { decrement: item.quantity } }
        });

        if (updatedProduct.currentStock < 0) {
          throwStockError([{ name: product!.name, required: item.quantity, available: updatedProduct.currentStock + item.quantity }]);
        }

        await tx.stockMovementLog.create({
          data: {
            productId: product!.id,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Sales Challan Confirmed: ${challan.challanNumber}`,
            createdById: req.user!.id
          }
        });
      }

      // Update challan
      const updatedChallan = await tx.salesChallan.update({
        where: { id: challan.id },
        data: { status: 'CONFIRMED', confirmedAt: new Date() }
      });

      return updatedChallan;
    });

    res.json(result);
  } catch (error: any) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed.type === 'STOCK_ERROR') {
        return res.status(400).json({ error: 'INSUFFICIENT_STOCK', failures: parsed.failures });
      }
    } catch (e) {}
    res.status(400).json({ error: error.message || 'Failed to confirm challan.' });
  }
});

const cancelSchema = z.object({
  reason: z.string().optional(),
  restock: z.boolean().default(false)
});

// PUT /api/challans/:id/cancel
router.put('/:id/cancel', authorize(['ADMIN', 'SALES']), async (req: any, res: any) => {
  try {
    const { reason, restock } = cancelSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.findUnique({ 
        where: { id: req.params.id as string },
        include: { items: true }
      });
      
      if (!challan) throw new Error('Challan not found');
      if (challan.status === 'CANCELLED') throw new Error('Challan is already cancelled');
      
      if (challan.status === 'CONFIRMED' && !reason) {
        throw new Error('Reason is required to cancel a CONFIRMED challan');
      }

      // If CONFIRMED and restock is true, return items to inventory
      if (challan.status === 'CONFIRMED' && restock) {
        for (const item of challan.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            await tx.product.update({
              where: { id: product.id },
              data: { currentStock: { increment: item.quantity } }
            });
  
            await tx.stockMovementLog.create({
              data: {
                productId: product.id,
                quantity: item.quantity,
                movementType: 'IN',
                reason: `Restock from cancelled challan: ${challan.challanNumber}. Reason: ${reason}`,
                createdById: req.user!.id
              }
            });
          }
        }
      }

      const updated = await tx.salesChallan.update({
        where: { id: challan.id },
        data: { status: 'CANCELLED' }
      });
      
      return updated;
    });

    res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ') });
    res.status(400).json({ error: error.message || 'Failed to cancel challan.' });
  }
});

export default router;
