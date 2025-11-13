const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/products/{id}/inventory:
 *   put:
 *     tags:
 *       - Products
 *     summary: Update product inventory
 *     description: Update or create inventory record for a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: Current stock quantity
 *               minQuantity:
 *                 type: integer
 *                 description: Minimum stock level threshold
 *               maxQuantity:
 *                 type: integer
 *                 description: Maximum stock level threshold
 *               location:
 *                 type: string
 *                 description: Inventory location (defaults to 'default')
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inventory:
 *                   $ref: '#/components/schemas/Inventory'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Get all products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, categoryId } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const where = {
      isActive: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          inventories: true
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: take,
        total,
        pages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventories: true
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      sku,
      barcode,
      categoryId,
      price,
      cost,
      taxRate
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        barcode,
        categoryId,
        price: parseFloat(price),
        cost: parseFloat(cost || 0),
        taxRate: parseFloat(taxRate || 0)
      },
      include: {
        category: true
      }
    });

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'SKU or barcode already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      sku,
      barcode,
      categoryId,
      price,
      cost,
      taxRate,
      isActive
    } = req.body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        sku,
        barcode,
        categoryId,
        price: parseFloat(price),
        cost: parseFloat(cost || 0),
        taxRate: parseFloat(taxRate || 0),
        isActive
      },
      include: {
        category: true
      }
    });

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'SKU or barcode already exists' });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.product.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'Product not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Update inventory
router.put('/:id/inventory', async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, minQuantity, maxQuantity, location } = req.body;

    const inventory = await prisma.inventory.upsert({
      where: {
        productId_location: {
          productId: id,
          location: location || 'default'
        }
      },
      update: {
        quantity: parseInt(quantity),
        minQuantity: parseInt(minQuantity || 0),
        maxQuantity: parseInt(maxQuantity || 0),
        lastUpdated: new Date()
      },
      create: {
        productId: id,
        quantity: parseInt(quantity),
        minQuantity: parseInt(minQuantity || 0),
        maxQuantity: parseInt(maxQuantity || 0),
        location: location || 'default'
      }
    });

    res.json({
      message: 'Inventory updated successfully',
      inventory
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;