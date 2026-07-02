import express from 'express';
import jwt from 'jsonwebtoken';
import Reseller from '../models/Reseller.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ─── Super-admin reseller CRUD ───────────────────────────────────────────────

// All routes require super_admin
router.use(protect);
router.use(authorize('super_admin'));

// @route   GET /api/super-admin/resellers
router.get('/resellers', async (req, res) => {
  try {
    const { search, isActive } = req.query;
    const query = {};
    if (isActive === 'true') query.isActive = true;
    if (isActive === 'false') query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }

    const resellers = await Reseller.find(query).sort({ createdAt: -1 }).lean();

    // Attach tenant counts
    const resellerIds = resellers.map(r => r._id);
    const tenantCounts = await Tenant.aggregate([
      { $match: { resellerId: { $in: resellerIds } } },
      { $group: { _id: '$resellerId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(tenantCounts.map(item => [String(item._id), item.count || 0]));

    const result = resellers.map(r => ({
      ...r,
      tenantCount: countMap.get(String(r._id)) || 0,
    }));

    res.json({ resellers: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/resellers/:id
router.get('/resellers/:id', async (req, res) => {
  try {
    const reseller = await Reseller.findById(req.params.id).lean();
    if (!reseller) return res.status(404).json({ error: 'Reseller not found' });

    const tenants = await Tenant.find({ resellerId: reseller._id })
      .select('name slug businessType businessTypes subscription isActive createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ reseller, tenants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/resellers
router.post('/resellers', async (req, res) => {
  try {
    const { name, email, phone, company, commissionRate, notes, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if email already exists as a user
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Create reseller record
    const reseller = await Reseller.create({
      name,
      email,
      phone: phone || '',
      company: company || '',
      commissionRate: commissionRate || 0,
      notes: notes || '',
      createdBy: req.user._id,
    });

    // Create reseller login user
    if (password) {
      await User.create({
        email: email.toLowerCase(),
        password,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || 'Reseller',
        role: 'reseller',
        resellerId: reseller._id,
        isActive: true,
      });
    }

    res.status(201).json({ reseller });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/super-admin/resellers/:id
router.put('/resellers/:id', async (req, res) => {
  try {
    const { name, email, phone, company, commissionRate, isActive, notes } = req.body;
    const reseller = await Reseller.findById(req.params.id);
    if (!reseller) return res.status(404).json({ error: 'Reseller not found' });

    if (name !== undefined) reseller.name = name;
    if (email !== undefined) reseller.email = email;
    if (phone !== undefined) reseller.phone = phone;
    if (company !== undefined) reseller.company = company;
    if (commissionRate !== undefined) reseller.commissionRate = commissionRate;
    if (isActive !== undefined) reseller.isActive = isActive;
    if (notes !== undefined) reseller.notes = notes;

    await reseller.save();
    res.json({ reseller });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/super-admin/resellers/:id
router.delete('/resellers/:id', async (req, res) => {
  try {
    const reseller = await Reseller.findById(req.params.id);
    if (!reseller) return res.status(404).json({ error: 'Reseller not found' });

    // Unlink tenants
    await Tenant.updateMany({ resellerId: reseller._id }, { $unset: { resellerId: '' } });

    // Deactivate reseller user
    await User.updateOne({ resellerId: reseller._id, role: 'reseller' }, { isActive: false });

    await Reseller.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reseller deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
