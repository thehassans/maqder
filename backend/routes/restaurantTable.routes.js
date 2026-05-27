import express from 'express';
import RestaurantTable from '../models/RestaurantTable.js';
import { protect, tenantFilter, checkPermission, requireBusinessType } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);
router.use(requireBusinessType('restaurant'));

// Get all tables
router.get('/', checkPermission('restaurant', 'read'), async (req, res) => {
  try {
    const { status, isActive = 'true' } = req.query;
    const query = { ...req.tenantFilter };

    if (isActive === 'false') query.isActive = false;
    else if (isActive === 'all') {} 
    else query.isActive = true;

    if (status) query.status = status;

    const tables = await RestaurantTable.find(query).sort({ tableNumber: 1 });
    res.json(tables);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new table
router.post('/', checkPermission('restaurant', 'create'), async (req, res) => {
  try {
    const table = await RestaurantTable.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
    });
    res.status(201).json(table);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Table number already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update a table
router.put('/:id', checkPermission('restaurant', 'update'), async (req, res) => {
  try {
    const table = await RestaurantTable.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true, runValidators: true }
    );
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json(table);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deactivate a table
router.delete('/:id', checkPermission('restaurant', 'delete'), async (req, res) => {
  try {
    const table = await RestaurantTable.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { isActive: false },
      { new: true }
    );
    if (!table) return res.status(404).json({ error: 'Table not found' });
    res.json({ message: 'Table deactivated', table });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
