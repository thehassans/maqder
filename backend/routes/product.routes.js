import express from 'express';
import Product from '../models/Product.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

// @route   GET /api/products
router.get('/', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, category, status, search, lowStock } = req.query;
    
    const query = { ...req.tenantFilter };
    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { nameEn: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } }
      ];
    }
    
    let products = await Product.find(query)
      .select('-landedCostHistory')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    if (lowStock === 'true') {
      products = products.filter(p => {
        const minStock = p.stocks.reduce((min, s) => Math.min(min, s.reorderPoint), Infinity);
        return p.totalStock <= minStock;
      });
    }
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/products/lookup
router.get('/lookup', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const { barcode, sku, qrCode } = req.query;
    
    let query = { ...req.tenantFilter };
    if (barcode) query.barcode = barcode;
    else if (sku) query.sku = sku;
    else if (qrCode) query.qrCode = qrCode;
    else return res.status(400).json({ error: 'Provide barcode, sku, or qrCode' });
    
    const product = await Product.findOne(query).populate('stocks.warehouseId', 'nameEn nameAr code');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/products/stats
router.get('/stats', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { ...req.tenantFilter, isActive: true } },
      {
        $facet: {
          byCategory: [{ $group: { _id: '$category', count: { $sum: 1 }, totalValue: { $sum: { $multiply: ['$costPrice', '$totalStock'] } } } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          lowStock: [
            { $unwind: '$stocks' },
            { $match: { $expr: { $lte: ['$stocks.quantity', '$stocks.reorderPoint'] } } },
            { $count: 'count' }
          ],
          totals: [
            {
              $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalStock: { $sum: '$totalStock' },
                totalValue: { $sum: { $multiply: ['$costPrice', '$totalStock'] } }
              }
            }
          ]
        }
      }
    ]);
    
    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/products/:id
router.get('/:id', checkPermission('inventory', 'read'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate('stocks.warehouseId', 'nameEn nameAr code')
      .populate('suppliers.supplierId', 'name');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/products
router.post('/', checkPermission('inventory', 'create'), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };
    
    // Calculate totalStock from stocks array
    if (Array.isArray(productData.stocks)) {
      productData.totalStock = productData.stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    }
    
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/products/:id
router.put('/:id', checkPermission('inventory', 'update'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    
    // Recalculate totalStock if stocks array is provided
    if (Array.isArray(updateData.stocks)) {
      updateData.totalStock = updateData.stocks.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
    }
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/products/:id/stock
router.post('/:id/stock', checkPermission('inventory', 'update'), async (req, res) => {
  try {
    const { warehouseId, quantity, type = 'add' } = req.body;
    
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantFilter });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const quantityChange = type === 'add' ? quantity : -quantity;
    product.updateStock(warehouseId, quantityChange);
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/products/:id/landed-cost
router.post('/:id/landed-cost', checkPermission('inventory', 'update'), async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantFilter });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const unitCost = product.calculateLandedCost(req.body);
    await product.save();
    
    res.json({
      unitLandedCost: unitCost,
      averageLandedCost: product.averageLandedCost,
      product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/products/:id/transfer
router.post('/:id/transfer', checkPermission('inventory', 'update'), async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, quantity } = req.body;
    
    const product = await Product.findOne({ _id: req.params.id, ...req.tenantFilter });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const fromStock = product.stocks.find(s => s.warehouseId.toString() === fromWarehouseId);
    if (!fromStock || fromStock.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock in source warehouse' });
    }
    
    product.updateStock(fromWarehouseId, -quantity);
    product.updateStock(toWarehouseId, quantity);
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/products/:id
router.delete('/:id', checkPermission('inventory', 'delete'), async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { isActive: false, status: 'discontinued' },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deactivated', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
