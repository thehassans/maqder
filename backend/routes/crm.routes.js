import express from 'express';
import CRMLead from '../models/CRMLead.js';
import CRMDeal from '../models/CRMDeal.js';
import CRMActivity from '../models/CRMActivity.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

function cleanBody(body) {
  const cleaned = {};
  for (const [key, value] of Object.entries(body)) {
    if (value === '') {
      cleaned[key] = null;
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/* ─────────── LEADS ─────────── */

router.get('/leads', checkPermission('crm', 'read'), async (req, res) => {
  try {
    const { search, status, assignedTo, page = 1, limit = 50 } = req.query;
    const filter = { ...req.tenantFilter };
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(200, Math.max(1, Number(limit)));
    const parsedLimit = Math.min(200, Math.max(1, Number(limit)));
    const [leads, total] = await Promise.all([
      CRMLead.find(filter).sort('-createdAt').skip(skip).limit(parsedLimit).populate('assignedTo', 'name').populate('customerId', 'name').lean(),
      CRMLead.countDocuments(filter),
    ]);
    res.json({ leads, pagination: { page: Number(page), limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/leads/:id', checkPermission('crm', 'read'), async (req, res) => {
  try {
    const lead = await CRMLead.findOne({ _id: req.params.id, ...req.tenantFilter }).populate('assignedTo', 'name').populate('customerId', 'name').lean();
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json(lead);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/leads', checkPermission('crm', 'create'), async (req, res) => {
  try {
    const lead = await CRMLead.create({ ...cleanBody(req.body), tenantId: req.user.tenantId, createdBy: req.user._id });
    res.status(201).json(lead);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/leads/:id', checkPermission('crm', 'update'), async (req, res) => {
  try {
    const lead = await CRMLead.findOneAndUpdate({ _id: req.params.id, ...req.tenantFilter }, cleanBody(req.body), { new: true, runValidators: true });
    if (!lead) return res.status(404).json({ error: 'Not found' });
    res.json(lead);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/leads/:id', checkPermission('crm', 'delete'), async (req, res) => {
  try {
    const lead = await CRMLead.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!lead) return res.status(404).json({ error: 'Not found' });
    await CRMActivity.deleteMany({ leadId: req.params.id, ...req.tenantFilter });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─────────── DEALS ─────────── */

router.get('/deals', checkPermission('crm', 'read'), async (req, res) => {
  try {
    const { search, stage, assignedTo, page = 1, limit = 50 } = req.query;
    const filter = { ...req.tenantFilter };
    if (stage) filter.stage = stage;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(200, Math.max(1, Number(limit)));
    const parsedLimit = Math.min(200, Math.max(1, Number(limit)));
    const [deals, total] = await Promise.all([
      CRMDeal.find(filter).sort('-updatedAt').skip(skip).limit(parsedLimit).populate('assignedTo', 'name').populate('leadId', 'name').populate('customerId', 'name').lean(),
      CRMDeal.countDocuments(filter),
    ]);
    res.json({ deals, pagination: { page: Number(page), limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/deals/:id', checkPermission('crm', 'read'), async (req, res) => {
  try {
    const deal = await CRMDeal.findOne({ _id: req.params.id, ...req.tenantFilter }).populate('assignedTo', 'name').populate('leadId', 'name').populate('customerId', 'name').lean();
    if (!deal) return res.status(404).json({ error: 'Not found' });
    res.json(deal);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/deals', checkPermission('crm', 'create'), async (req, res) => {
  try {
    const deal = await CRMDeal.create({ ...cleanBody(req.body), tenantId: req.user.tenantId, createdBy: req.user._id });
    res.status(201).json(deal);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/deals/:id', checkPermission('crm', 'update'), async (req, res) => {
  try {
    const updates = cleanBody(req.body);
    if (updates.stage === 'closed_won' || updates.stage === 'closed_lost') {
      updates.actualCloseDate = new Date();
    }
    const deal = await CRMDeal.findOneAndUpdate({ _id: req.params.id, ...req.tenantFilter }, updates, { new: true, runValidators: true });
    if (!deal) return res.status(404).json({ error: 'Not found' });
    res.json(deal);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/deals/:id', checkPermission('crm', 'delete'), async (req, res) => {
  try {
    const deal = await CRMDeal.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!deal) return res.status(404).json({ error: 'Not found' });
    await CRMActivity.deleteMany({ dealId: req.params.id, ...req.tenantFilter });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─────────── ACTIVITIES ─────────── */

router.get('/activities', checkPermission('crm', 'read'), async (req, res) => {
  try {
    const { leadId, dealId, customerId, type, page = 1, limit = 50 } = req.query;
    const filter = { ...req.tenantFilter };
    if (leadId) filter.leadId = leadId;
    if (dealId) filter.dealId = dealId;
    if (customerId) filter.customerId = customerId;
    if (type) filter.type = type;
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(200, Math.max(1, Number(limit)));
    const parsedLimit = Math.min(200, Math.max(1, Number(limit)));
    const [activities, total] = await Promise.all([
      CRMActivity.find(filter).sort('-createdAt').skip(skip).limit(parsedLimit).populate('createdBy', 'name').lean(),
      CRMActivity.countDocuments(filter),
    ]);
    res.json({ activities, pagination: { page: Number(page), limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/activities', checkPermission('crm', 'create'), async (req, res) => {
  try {
    const activity = await CRMActivity.create({ ...cleanBody(req.body), tenantId: req.user.tenantId, createdBy: req.user._id });
    res.status(201).json(activity);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/activities/:id', checkPermission('crm', 'update'), async (req, res) => {
  try {
    const activity = await CRMActivity.findOneAndUpdate({ _id: req.params.id, ...req.tenantFilter }, cleanBody(req.body), { new: true, runValidators: true });
    if (!activity) return res.status(404).json({ error: 'Not found' });
    res.json(activity);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/activities/:id', checkPermission('crm', 'delete'), async (req, res) => {
  try {
    const activity = await CRMActivity.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!activity) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─────────── STATS / PIPELINE ─────────── */

router.get('/stats', checkPermission('crm', 'read'), async (req, res) => {
  try {
    const [leadTotal, dealTotal, activityTotal, pipeline, leadStatus] = await Promise.all([
      CRMLead.countDocuments({ ...req.tenantFilter }),
      CRMDeal.countDocuments({ ...req.tenantFilter }),
      CRMActivity.countDocuments({ ...req.tenantFilter }),
      CRMDeal.aggregate([
        { $match: { ...req.tenantFilter } },
        { $group: { _id: '$stage', count: { $sum: 1 }, value: { $sum: '$value' } } },
      ]),
      CRMLead.aggregate([
        { $match: { ...req.tenantFilter } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    const dealValue = pipeline.reduce((s, p) => s + (p.value || 0), 0);
    const wonValue = pipeline.filter(p => p._id === 'closed_won').reduce((s, p) => s + (p.value || 0), 0);
    res.json({ leadTotal, dealTotal, activityTotal, pipeline, leadStatus, dealValue, wonValue });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
