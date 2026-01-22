import express from 'express';
import JobCostingJob from '../models/JobCostingJob.js';
import JobCostEntry from '../models/JobCostEntry.js';
import Project from '../models/Project.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function generateJobCode(tenantFilterValue) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const prefix = `JBC-${y}${m}${d}`;

  const last = await JobCostingJob.findOne({
    ...tenantFilterValue,
    code: { $regex: `^${prefix}-` }
  })
    .sort({ createdAt: -1 })
    .select('code');

  let seq = 1;
  if (last?.code) {
    const parts = last.code.split('-');
    const lastSeq = Number(parts[parts.length - 1]);
    if (Number.isFinite(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

router.get('/jobs', checkPermission('job_costing', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 25, status, search, projectId, isActive } = req.query;

    const query = { ...req.tenantFilter };

    if (isActive === 'false') {
      query.isActive = false;
    } else if (isActive === 'all') {
      // no filter
    } else {
      query.isActive = true;
    }

    if (status) query.status = status;
    if (projectId) query.projectId = projectId;

    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } }
      ];
    }

    const jobs = await JobCostingJob.find(query)
      .populate('projectId', 'code nameEn nameAr status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await JobCostingJob.countDocuments(query);

    const jobIds = jobs.map((j) => j._id);

    const costs = await JobCostEntry.aggregate([
      { $match: { ...req.tenantFilter, isActive: true, jobId: { $in: jobIds } } },
      { $group: { _id: '$jobId', totalCost: { $sum: '$totalCost' }, entries: { $sum: 1 } } }
    ]);

    const costMap = Object.fromEntries(costs.map((c) => [c._id.toString(), c]));

    const jobsWithCosts = jobs.map((j) => {
      const summary = costMap[j._id.toString()];
      return {
        ...j.toObject(),
        costSummary: {
          totalCost: summary?.totalCost || 0,
          entries: summary?.entries || 0
        }
      };
    });

    res.json({
      jobs: jobsWithCosts,
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

router.get('/jobs/stats', checkPermission('job_costing', 'read'), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [jobStats] = await JobCostingJob.aggregate([
      { $match: { ...req.tenantFilter, isActive: true } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: {
                    $cond: [{ $in: ['$status', ['planned', 'active', 'on_hold']] }, 1, 0]
                  }
                },
                completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
                budget: { $sum: '$budget' }
              }
            }
          ],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          overdue: [
            {
              $match: {
                dueDate: { $ne: null, $lt: now },
                status: { $nin: ['completed', 'cancelled'] }
              }
            },
            { $count: 'count' }
          ]
        }
      }
    ]);

    const [costStats] = await JobCostEntry.aggregate([
      { $match: { ...req.tenantFilter, isActive: true } },
      {
        $facet: {
          totalCost: [{ $group: { _id: null, totalCost: { $sum: '$totalCost' } } }],
          monthCost: [
            { $match: { date: { $gte: startOfMonth } } },
            { $group: { _id: null, totalCost: { $sum: '$totalCost' } } }
          ],
          byType: [{ $group: { _id: '$type', totalCost: { $sum: '$totalCost' }, entries: { $sum: 1 } } }]
        }
      }
    ]);

    res.json({
      ...(jobStats || {}),
      costs: costStats || {}
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/jobs/:id', checkPermission('job_costing', 'read'), async (req, res) => {
  try {
    const job = await JobCostingJob.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate('projectId', 'code nameEn nameAr status');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const [summary] = await JobCostEntry.aggregate([
      { $match: { ...req.tenantFilter, jobId: job._id, isActive: true } },
      {
        $facet: {
          totals: [{ $group: { _id: null, totalCost: { $sum: '$totalCost' }, entries: { $sum: 1 } } }],
          byType: [{ $group: { _id: '$type', totalCost: { $sum: '$totalCost' }, entries: { $sum: 1 } } }],
          recent: [
            { $sort: { date: -1, createdAt: -1 } },
            { $limit: 5 },
            { $project: { date: 1, type: 1, description: 1, totalCost: 1, quantity: 1, unitCost: 1 } }
          ]
        }
      }
    ]);

    const totals = summary?.totals?.[0] || { totalCost: 0, entries: 0 };

    res.json({
      ...job.toObject(),
      costSummary: {
        totals,
        byType: summary?.byType || [],
        recent: summary?.recent || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/jobs', checkPermission('job_costing', 'create'), async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(400).json({ error: 'No tenant associated with user' });
    }

    if (req.body.projectId) {
      const project = await Project.findOne({ _id: req.body.projectId, ...req.tenantFilter, isActive: true });
      if (!project) {
        return res.status(400).json({ error: 'Invalid project' });
      }
    }

    const code = req.body.code || (await generateJobCode(req.tenantFilter));

    const jobData = {
      ...req.body,
      code,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
      budget: toNumber(req.body.budget, 0)
    };

    const job = await JobCostingJob.create(jobData);
    res.status(201).json(job);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Duplicate job code' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/jobs/:id', checkPermission('job_costing', 'update'), async (req, res) => {
  try {
    const existing = await JobCostingJob.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!existing) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (req.body.projectId) {
      const project = await Project.findOne({ _id: req.body.projectId, ...req.tenantFilter, isActive: true });
      if (!project) {
        return res.status(400).json({ error: 'Invalid project' });
      }
    }

    const updateData = { ...req.body };
    if (typeof updateData.budget !== 'undefined') {
      updateData.budget = toNumber(updateData.budget, existing.budget);
    }

    if (updateData.status === 'completed' && !existing.completedAt) {
      updateData.completedAt = new Date();
    }

    if (updateData.status && updateData.status !== 'completed') {
      updateData.completedAt = undefined;
    }

    const job = await JobCostingJob.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      updateData,
      { new: true, runValidators: true }
    );

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/jobs/:id', checkPermission('job_costing', 'delete'), async (req, res) => {
  try {
    const job = await JobCostingJob.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { isActive: false },
      { new: true }
    );

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ message: 'Job deactivated', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/jobs/:id/costs', checkPermission('job_costing', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, type, startDate, endDate } = req.query;

    const job = await JobCostingJob.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const query = { ...req.tenantFilter, jobId: job._id, isActive: true };

    if (type) query.type = type;

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const costs = await JobCostEntry.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await JobCostEntry.countDocuments(query);

    res.json({
      costs,
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

router.post('/jobs/:id/costs', checkPermission('job_costing', 'create'), async (req, res) => {
  try {
    const job = await JobCostingJob.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const quantity = toNumber(req.body.quantity, 0);
    const unitCost = toNumber(req.body.unitCost, 0);
    const totalCost = Math.max(0, quantity) * Math.max(0, unitCost);

    const cost = await JobCostEntry.create({
      tenantId: req.user.tenantId,
      jobId: job._id,
      date: req.body.date ? new Date(req.body.date) : new Date(),
      type: req.body.type || 'material',
      description: req.body.description,
      quantity: Math.max(0, quantity),
      unitCost: Math.max(0, unitCost),
      totalCost,
      reference: req.body.reference,
      notes: req.body.notes,
      createdBy: req.user._id
    });

    res.status(201).json(cost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/costs/:id', checkPermission('job_costing', 'update'), async (req, res) => {
  try {
    const existing = await JobCostEntry.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!existing) {
      return res.status(404).json({ error: 'Cost entry not found' });
    }

    const quantity = typeof req.body.quantity !== 'undefined' ? toNumber(req.body.quantity, existing.quantity) : existing.quantity;
    const unitCost = typeof req.body.unitCost !== 'undefined' ? toNumber(req.body.unitCost, existing.unitCost) : existing.unitCost;
    const totalCost = Math.max(0, quantity) * Math.max(0, unitCost);

    const updateData = {
      ...req.body,
      quantity,
      unitCost,
      totalCost
    };

    if (req.body.date) {
      updateData.date = new Date(req.body.date);
    }

    const cost = await JobCostEntry.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    res.json(cost);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/costs/:id', checkPermission('job_costing', 'delete'), async (req, res) => {
  try {
    const cost = await JobCostEntry.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!cost) {
      return res.status(404).json({ error: 'Cost entry not found' });
    }

    res.json({ message: 'Cost entry deactivated', cost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
