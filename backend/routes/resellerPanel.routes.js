import express from 'express';
import Reseller from '../models/Reseller.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require reseller role
router.use(protect);
router.use(authorize('reseller'));

// @route   GET /api/reseller/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const reseller = await Reseller.findOne({ _id: req.user.resellerId }).lean();
    if (!reseller) return res.status(404).json({ error: 'Reseller profile not found' });

    const [totalTenants, activeTenants, trialTenants, expiredTenants] = await Promise.all([
      Tenant.countDocuments({ resellerId: reseller._id }),
      Tenant.countDocuments({ resellerId: reseller._id, 'subscription.status': 'active' }),
      Tenant.countDocuments({ resellerId: reseller._id, 'subscription.plan': 'trial' }),
      Tenant.countDocuments({ resellerId: reseller._id, 'subscription.status': { $in: ['expired', 'terminated'] } }),
    ]);

    const recentTenants = await Tenant.find({ resellerId: reseller._id })
      .select('name slug businessType subscription isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      reseller,
      stats: { totalTenants, activeTenants, trialTenants, expiredTenants },
      recentTenants,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/reseller/tenants
router.get('/tenants', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, plan, search } = req.query;
    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;

    const query = { resellerId: req.user.resellerId };
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (plan) query['subscription.plan'] = plan;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'business.legalNameEn': { $regex: search, $options: 'i' } },
      ];
    }

    const tenants = await Tenant.find(query)
      .select('name slug businessType businessTypes business subscription isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean();

    const total = await Tenant.countDocuments(query);

    res.json({
      tenants,
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/reseller/tenants/:id
router.get('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findOne({ _id: req.params.id, resellerId: req.user.resellerId }).lean();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const users = await User.find({ tenantId: tenant._id }).select('-password').lean();

    res.json({ tenant, users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
