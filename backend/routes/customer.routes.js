import express from 'express';
import Customer from '../models/Customer.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

// @route   GET /api/customers
// @desc    Get all customers
router.get('/', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const { search, type, isActive, page = 1, limit = 20 } = req.query;
    
    const query = { ...req.tenantFilter };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { vatNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (type) {
      query.type = type;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Customer.countDocuments(query)
    ]);
    
    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/customers/search
// @desc    Quick search for autocomplete
router.get('/search', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json([]);
    }
    
    const customers = await Customer.find({
      ...req.tenantFilter,
      isActive: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { nameAr: { $regex: q, $options: 'i' } },
        { vatNumber: { $regex: q, $options: 'i' } }
      ]
    })
      .select('name nameAr email phone vatNumber type address')
      .limit(10);
    
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/customers/stats
// @desc    Get customer statistics
router.get('/stats', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const stats = await Customer.aggregate([
      { $match: req.tenantFilter },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
          active: [{ $match: { isActive: true } }, { $count: 'count' }],
          topByRevenue: [
            { $sort: { totalRevenue: -1 } },
            { $limit: 5 },
            { $project: { name: 1, totalRevenue: 1, totalInvoices: 1 } }
          ]
        }
      }
    ]);
    
    res.json({
      total: stats[0]?.total[0]?.count || 0,
      active: stats[0]?.active[0]?.count || 0,
      byType: stats[0]?.byType || [],
      topByRevenue: stats[0]?.topByRevenue || []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/customers/:id
// @desc    Get single customer
router.get('/:id', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/customers
// @desc    Create new customer
router.post('/', checkPermission('invoicing', 'create'), async (req, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(400).json({ error: 'No tenant associated with user' });
    }

    const customerData = {
      ...req.body,
      tenantId: req.user.tenantId
    };
    
    // Check for duplicate VAT number if provided
    if (customerData.vatNumber) {
      const existing = await Customer.findOne({
        tenantId: req.user.tenantId,
        vatNumber: customerData.vatNumber
      });
      
      if (existing) {
        return res.status(400).json({ error: 'Customer with this VAT number already exists' });
      }
    }
    
    const customer = new Customer(customerData);
    await customer.save();
    
    res.status(201).json(customer);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/customers/:id
// @desc    Update customer
router.put('/:id', checkPermission('invoicing', 'update'), async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true }
    );
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const tenantId = req.user?.role === 'super_admin' ? customer.tenantId : req.user?.tenantId
    if (!tenantId) {
      return res.status(400).json({ error: 'No tenant associated with user' });
    }
    
    // Check for duplicate VAT number if changed
    if (req.body.vatNumber && req.body.vatNumber !== customer.vatNumber) {
      const existing = await Customer.findOne({
        tenantId,
        vatNumber: req.body.vatNumber,
        _id: { $ne: req.params.id }
      });
      
      if (existing) {
        return res.status(400).json({ error: 'Customer with this VAT number already exists' });
      }
    }
    
    Object.assign(customer, req.body);
    await customer.save();
    
    res.json(customer);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/customers/:id
// @desc    Delete customer (soft delete)
router.delete('/:id', checkPermission('invoicing', 'delete'), async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      ...req.tenantFilter
    });
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Soft delete
    customer.isActive = false;
    await customer.save();
    
    res.json({ message: 'Customer deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
