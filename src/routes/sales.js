const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/sales/stats/overview:
 *   get:
 *     tags:
 *       - Sales
 *     summary: Get sales statistics overview
 *     description: Retrieve overall sales statistics and metrics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering statistics (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Sales statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalSales:
 *                   type: integer
 *                   description: Total number of sales
 *                 totalRevenue:
 *                   type: number
 *                   format: float
 *                   description: Total revenue amount
 *                 totalCustomers:
 *                   type: integer
 *                   description: Total number of customers
 *                 averageSale:
 *                   type: number
 *                   format: float
 *                   description: Average sale amount
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get all sales
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, customerId, paymentStatusId, saleStatusId } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const where = {};

    if (customerId) where.customerId = customerId;
    if (paymentStatusId) where.paymentStatusId = paymentStatusId;
    if (saleStatusId) where.saleStatusId = saleStatusId;

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: {
          customer: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          paymentMethod: true,
          paymentStatus: true,
          saleStatus: true,
          saleItems: {
            include: {
              product: true
            }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.sale.count({ where })
    ]);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single sale
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        paymentMethod: true,
        paymentStatus: true,
        saleStatus: true,
        saleItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json({ sale });
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sale
router.post('/', async (req, res) => {
  try {
    const {
      customerId,
      items,
      paymentMethodId,
      paymentStatusId,
      saleStatusId,
      discountAmount = 0,
      notes
    } = req.body;

    const userId = req.user.userId;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      const itemTotal = product.price * item.quantity;
      const itemTax = itemTotal * (product.taxRate / 100);

      subtotal += itemTotal;
      taxAmount += itemTax;
    }

    const totalAmount = subtotal + taxAmount - discountAmount;

    // Create sale in transaction
    const result = await prisma.$transaction(async (prisma) => {
      const sale = await prisma.sale.create({
        data: {
          customerId,
          userId,
          totalAmount,
          taxAmount,
          discountAmount,
          paymentMethodId,
          paymentStatusId,
          saleStatusId,
          notes,
          saleItems: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              taxAmount: (item.unitPrice * item.quantity * item.taxRate) / 100,
              totalPrice: (item.unitPrice * item.quantity) - (item.discount || 0)
            }))
          }
        },
        include: {
          customer: true,
          paymentMethod: true,
          paymentStatus: true,
          saleStatus: true,
          saleItems: {
            include: {
              product: true
            }
          }
        }
      });

      // Update inventory
      for (const item of items) {
        await prisma.inventory.updateMany({
          where: { productId: item.productId },
          data: {
            quantity: {
              decrement: item.quantity
            },
            lastUpdated: new Date()
          }
        });
      }

      // Update customer loyalty points and total purchases
      if (customerId) {
        await prisma.customer.update({
          where: { id: customerId },
          data: {
            totalPurchases: {
              increment: totalAmount
            },
            loyaltyPoints: {
              increment: Math.floor(totalAmount / 10) // 1 point per $10 spent
            }
          }
        });
      }

      return sale;
    });

    res.status(201).json({
      message: 'Sale created successfully',
      sale: result
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update sale status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatusId, saleStatusId } = req.body;

    const sale = await prisma.sale.update({
      where: { id },
      data: {
        paymentStatusId,
        saleStatusId
      },
      include: {
        paymentStatus: true,
        saleStatus: true
      }
    });

    res.json({
      message: 'Sale status updated successfully',
      sale
    });
  } catch (error) {
    console.error('Update sale status error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Sale not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get sales statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [totalSales, totalRevenue, totalCustomers] = await Promise.all([
      prisma.sale.count({ where: dateFilter }),
      prisma.sale.aggregate({
        where: dateFilter,
        _sum: { totalAmount: true }
      }),
      prisma.customer.count()
    ]);

    res.json({
      totalSales,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalCustomers,
      averageSale: totalSales > 0 ? (totalRevenue._sum.totalAmount || 0) / totalSales : 0
    });
  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;