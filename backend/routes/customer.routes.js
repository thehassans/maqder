import express from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/customers/recover-vat
// @desc    Recover VAT numbers dropped during migration and deduplicate customers
// Publicly accessible for one-time fix
router.get('/recover-vat', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const customersCollection = db.collection('customers');
    
    // 1. Deduplicate customers (keep the best one, delete others, reassign invoices)
    const allCustomers = await Customer.find({});
    const nameGroups = {};
    
    for (const c of allCustomers) {
      if (!c.name || !c.tenantId) continue;
      const key = `${c.tenantId}_${c.name.trim().toLowerCase()}`;
      if (!nameGroups[key]) nameGroups[key] = [];
      nameGroups[key].push(c);
    }
    
    let deletedDups = 0;
    let reassignedInvoices = 0;

    for (const key in nameGroups) {
      if (nameGroups[key].length > 1) {
        const group = nameGroups[key];
        // Sort by quality: prefer ones with vatNumber, phone, and more invoices
        group.sort((a, b) => {
           const scoreA = (a.vatNumber ? 10 : 0) + (a.phone ? 5 : 0) + (a.totalInvoices || 0);
           const scoreB = (b.vatNumber ? 10 : 0) + (b.phone ? 5 : 0) + (b.totalInvoices || 0);
           return scoreB - scoreA; // descending
        });
        
        const kept = group[0];
        const toDelete = group.slice(1);
        
        for (const dup of toDelete) {
          // Reassign any invoices pointing to the duplicate
          const result = await mongoose.model('Invoice').updateMany(
            { customerId: dup._id },
            { $set: { customerId: kept._id } }
          );
          reassignedInvoices += result.modifiedCount || 0;
          
          // Delete duplicate
          await Customer.deleteOne({ _id: dup._id });
          deletedDups++;
        }
      }
    }

    // 2. Recover VAT from hidden 'taxNumber'
    const customersWithTaxNum = await customersCollection.find({
      taxNumber: { $exists: true, $ne: '' },
      $or: [
        { vatNumber: { $exists: false } },
        { vatNumber: '' },
        { vatNumber: null }
      ]
    }).toArray();

    let directFixedCount = 0;
    for (const c of customersWithTaxNum) {
      await customersCollection.updateOne(
        { _id: c._id },
        { $set: { vatNumber: c.taxNumber } }
      );
      directFixedCount++;
    }

    // 3. Fallback to invoice data
    const customersToFix = await Customer.find({ vatNumber: { $in: [null, '', undefined] } });
    let fallbackFixedCount = 0;

    for (const customer of customersToFix) {
      const invoice = await mongoose.model('Invoice').findOne({
        customerId: customer._id,
        'buyer.vatNumber': { $exists: true, $ne: '' }
      }).select('buyer.vatNumber');

      if (invoice && invoice.buyer && invoice.buyer.vatNumber) {
        customer.vatNumber = invoice.buyer.vatNumber;
        await customer.save();
        fallbackFixedCount++;
      }
    }

    res.json({
      message: 'Cleanup & VAT Recovery Complete',
      duplicatesDeleted: deletedDups,
      invoicesReassigned: reassignedInvoices,
      recoveredFromHiddenField: directFixedCount,
      recoveredFromInvoices: fallbackFixedCount,
      totalVATRecovered: directFixedCount + fallbackFixedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.use(protect);
router.use(tenantFilter);

// @route   GET /api/customers
// @desc    Get all customers
router.get('/', checkPermission('invoicing', 'read'), async (req, res) => {
  try {
    const { search, type, isActive, page = 1, limit = 20 } = req.query;
    
    const query = { ...req.tenantFilter };
    
    if (search) {
      const cleanSearch = String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { customerCode: { $regex: cleanSearch, $options: 'i' } },
        { name: { $regex: cleanSearch, $options: 'i' } },
        { nameAr: { $regex: cleanSearch, $options: 'i' } },
        { email: { $regex: cleanSearch, $options: 'i' } },
        { phone: { $regex: cleanSearch, $options: 'i' } },
        { mobile: { $regex: cleanSearch, $options: 'i' } },
        { vatNumber: { $regex: cleanSearch, $options: 'i' } }
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
    
    if (!q || String(q).trim().length < 2) {
      return res.json([]);
    }
    
    const cleanQ = String(q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const customers = await Customer.find({
      ...req.tenantFilter,
      isActive: true,
      $or: [
        { customerCode: { $regex: cleanQ, $options: 'i' } },
        { name: { $regex: cleanQ, $options: 'i' } },
        { nameAr: { $regex: cleanQ, $options: 'i' } },
        { vatNumber: { $regex: cleanQ, $options: 'i' } },
        { phone: { $regex: cleanQ, $options: 'i' } },
        { mobile: { $regex: cleanQ, $options: 'i' } }
      ]
    })
      .select('customerCode name nameAr email phone vatNumber type address')
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
    
    if (!customerData.customerCode) {
      // Auto-generate a 4 digit customer code
      const count = await Customer.countDocuments({ tenantId: req.user.tenantId });
      customerData.customerCode = (1000 + count).toString();
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
