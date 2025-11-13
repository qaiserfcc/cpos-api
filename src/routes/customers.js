const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/customers/{id}/stats:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get customer statistics
 *     description: Retrieve statistical information about a customer's purchasing behavior
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 customerId:
 *                   type: string
 *                 totalPurchases:
 *                   type: number
 *                   format: float
 *                   description: Total amount spent by customer
 *                 totalOrders:
 *                   type: integer
 *                   description: Total number of orders
 *                 averageOrderValue:
 *                   type: number
 *                   format: float
 *                   description: Average order value
 *                 loyaltyPoints:
 *                   type: integer
 *                   description: Customer loyalty points
 *                 lastOrderDate:
 *                   type: string
 *                   format: date-time
 *                   description: Date of last order
 *       404:
 *         description: Customer not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get all customers
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const where = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          _count: {
            select: { sales: true }
          }
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customer.count({ where })
    ]);

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single customer
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            saleItems: {
              include: {
                product: true
              }
            },
            paymentMethod: true,
            paymentStatus: true,
            saleStatus: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create customer
router.post('/', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country
    } = req.body;

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country: country || 'US'
      }
    });

    res.status(201).json({
      message: 'Customer created successfully',
      customer
    });
  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update customer
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country
    } = req.body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        country
      }
    });

    res.json({
      message: 'Customer updated successfully',
      customer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Customer not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete customer
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id }
    });

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Customer not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Get customer statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      select: {
        id: true,
        totalPurchases: true,
        loyaltyPoints: true,
        sales: {
          select: {
            totalAmount: true,
            createdAt: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const totalOrders = customer.sales.length;
    const averageOrderValue = totalOrders > 0 ? customer.totalPurchases / totalOrders : 0;

    // Calculate last order date
    const lastOrderDate = customer.sales.length > 0
      ? customer.sales.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
      : null;

    res.json({
      customerId: id,
      totalPurchases: customer.totalPurchases,
      totalOrders,
      averageOrderValue,
      loyaltyPoints: customer.loyaltyPoints,
      lastOrderDate
    });
  } catch (error) {
    console.error('Get customer stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;