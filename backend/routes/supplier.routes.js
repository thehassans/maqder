import express from 'express';
import Supplier from '../models/Supplier.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

// @route   GET /api/suppliers
router.get('/', checkPermission('supply_chain', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive } = req.query;

    const query = { ...req.tenantFilter };

    if (isActive === 'false') {
      query.isActive = false;
    } else if (isActive === 'all') {
      // no filter
    } else {
      query.isActive = true;
    }

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
        { vatNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Supplier.countDocuments(query);

    res.json({
      suppliers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/suppliers/stats
router.get('/stats', checkPermission('supply_chain', 'read'), async (req, res) => {
  try {
    const stats = await Supplier.aggregate([
      { $match: { ...req.tenantFilter } },
      {
        $facet: {
          totals: [{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } }],
          byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
          byCity: [{ $group: { _id: '$address.city', count: { $sum: 1 } } }]
        }
      }
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/suppliers/:id
router.get('/:id', checkPermission('supply_chain', 'read'), async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ _id: req.params.id, ...req.tenantFilter });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/suppliers
router.post('/', checkPermission('supply_chain', 'create'), async (req, res) => {
  try {
    const data = {
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    };

    const supplier = await Supplier.create(data);
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/suppliers/:id
router.put('/:id', checkPermission('supply_chain', 'update'), async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true, runValidators: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/suppliers/:id
router.delete('/:id', checkPermission('supply_chain', 'delete'), async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { isActive: false },
      { new: true }
    );

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json({ message: 'Supplier deactivated', supplier });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
