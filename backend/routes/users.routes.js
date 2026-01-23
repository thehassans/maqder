import express from 'express';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

const sanitizeUserForClient = (u) => {
  if (!u) return null;
  const obj = typeof u.toObject === 'function' ? u.toObject() : u;
  const { password, ...rest } = obj;
  return rest;
};

router.get('/', checkPermission('settings', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, isActive } = req.query;

    const query = { ...req.tenantFilter };

    if (typeof isActive !== 'undefined') {
      query.isActive = String(isActive) === 'true';
    }

    if (role) query.role = role;

    if (search) {
      const q = String(search).trim();
      query.$or = [
        { email: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { firstNameAr: { $regex: q, $options: 'i' } },
        { lastNameAr: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', checkPermission('settings', 'read'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated with user' });

    const [tenant, activeCount, totalCount] = await Promise.all([
      Tenant.findById(tenantId).select('subscription.maxUsers'),
      User.countDocuments({ tenantId, isActive: true }),
      User.countDocuments({ tenantId }),
    ]);

    res.json({
      maxUsers: tenant?.subscription?.maxUsers ?? 0,
      activeUsers: activeCount,
      totalUsers: totalCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPermission('settings', 'create'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated with user' });

    const tenant = await Tenant.findById(tenantId).select('subscription.maxUsers');
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const maxUsers = Number(tenant.subscription?.maxUsers ?? 0);
    if (Number.isFinite(maxUsers) && maxUsers > 0) {
      const activeCount = await User.countDocuments({ tenantId, isActive: true });
      if (activeCount >= maxUsers) {
        return res.status(403).json({ error: 'User limit reached for this tenant' });
      }
    }

    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const firstName = String(req.body?.firstName || '').trim();
    const lastName = String(req.body?.lastName || '').trim();

    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!firstName) return res.status(400).json({ error: 'First name is required' });
    if (!lastName) return res.status(400).json({ error: 'Last name is required' });

    const existing = await User.findOne({ tenantId, email });
    if (existing) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const role = String(req.body?.role || 'viewer');
    if (role === 'super_admin') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];

    const created = await User.create({
      tenantId,
      email,
      password,
      firstName,
      lastName,
      firstNameAr: req.body?.firstNameAr,
      lastNameAr: req.body?.lastNameAr,
      phone: req.body?.phone,
      role,
      permissions,
      isActive: true,
    });

    const saved = await User.findById(created._id).select('-password');
    res.status(201).json(sanitizeUserForClient(saved));
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Duplicate user email' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkPermission('settings', 'update'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated with user' });

    const existing = await User.findOne({ _id: req.params.id, tenantId }).select('+password');
    if (!existing) return res.status(404).json({ error: 'User not found' });

    if (String(existing._id) === String(req.user?._id)) {
      return res.status(400).json({ error: 'You cannot modify your own user from here' });
    }

    if (typeof req.body?.email !== 'undefined') {
      const email = String(req.body.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const dupe = await User.findOne({ tenantId, email, _id: { $ne: existing._id } });
      if (dupe) return res.status(400).json({ error: 'User already exists' });
      existing.email = email;
    }

    if (typeof req.body?.firstName !== 'undefined') existing.firstName = String(req.body.firstName || '').trim();
    if (typeof req.body?.lastName !== 'undefined') existing.lastName = String(req.body.lastName || '').trim();
    if (typeof req.body?.firstNameAr !== 'undefined') existing.firstNameAr = req.body.firstNameAr;
    if (typeof req.body?.lastNameAr !== 'undefined') existing.lastNameAr = req.body.lastNameAr;
    if (typeof req.body?.phone !== 'undefined') existing.phone = req.body.phone;

    if (typeof req.body?.role !== 'undefined') {
      const role = String(req.body.role || 'viewer');
      if (role === 'super_admin') return res.status(400).json({ error: 'Invalid role' });
      existing.role = role;
    }

    if (typeof req.body?.permissions !== 'undefined') {
      existing.permissions = Array.isArray(req.body.permissions) ? req.body.permissions : [];
    }

    if (typeof req.body?.isActive !== 'undefined') {
      existing.isActive = Boolean(req.body.isActive);
    }

    if (req.body?.password) {
      const password = String(req.body.password);
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      existing.password = password;
    }

    await existing.save();

    const saved = await User.findById(existing._id).select('-password');
    res.json(sanitizeUserForClient(saved));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('settings', 'delete'), async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return res.status(400).json({ error: 'No tenant associated with user' });

    const existing = await User.findOne({ _id: req.params.id, tenantId });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    if (String(existing._id) === String(req.user?._id)) {
      return res.status(400).json({ error: 'You cannot deactivate your own user' });
    }

    existing.isActive = false;
    await existing.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
