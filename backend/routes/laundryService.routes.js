import express from 'express';
import LaundryService from '../models/LaundryService.js';
import { protect, tenantFilter, checkPermission, requireBusinessType } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);
router.use(requireBusinessType('laundry'));

// GET /api/laundry/services
router.get('/', checkPermission('laundry', 'read'), async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = { tenantId: req.tenant._id };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const services = await LaundryService.find(query).sort({ category: 1, nameEn: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/laundry/services
router.post('/', checkPermission('laundry', 'create'), async (req, res) => {
  try {
    const service = new LaundryService({
      ...req.body,
      tenantId: req.tenant._id,
      createdBy: req.user._id
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/laundry/services/:id
router.put('/:id', checkPermission('laundry', 'update'), async (req, res) => {
  try {
    const service = await LaundryService.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/laundry/services/:id
router.delete('/:id', checkPermission('laundry', 'delete'), async (req, res) => {
  try {
    const service = await LaundryService.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      { isActive: false },
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
