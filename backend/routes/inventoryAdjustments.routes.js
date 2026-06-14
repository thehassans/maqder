import express from 'express';
import { protect } from '../middleware/auth.js';
import InventoryAdjustment from '../models/InventoryAdjustment.js';
import BakalaProduct from '../models/BakalaProduct.js';
import Tenant from '../models/Tenant.js';

const router = express.Router();

// Resolve the tenant to operate on (super_admins fall back to the bakala tenant).
const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'bakala' });
    return tenant ? tenant._id : null;
  }
  return null;
};

// Generate Adjustment Number
const generateAdjustmentNumber = async (tenantId) => {
  const count = await InventoryAdjustment.countDocuments({ tenantId });
  return `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

// Get all Adjustments
router.get('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.json([]);
    const adjustments = await InventoryAdjustment.find({ tenantId })
      .populate('adjustedBy', 'name')
      .sort('-createdAt');
    res.json(adjustments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Adjustment and update stock
router.post('/', protect, async (req, res) => {
  try {
    const { reason, notes, lines } = req.body;

    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found for this user.' });

    const adjustmentNumber = await generateAdjustmentNumber(tenantId);

    const adjustment = new InventoryAdjustment({
      tenantId,
      adjustmentNumber,
      reason,
      notes,
      adjustedBy: req.user._id,
      lines: lines || []
    });

    await adjustment.save();

    // Update Inventory
    for (const line of adjustment.lines) {
      if (line.productId) {
        // We set the stock directly to actualQuantity
        await BakalaProduct.findOneAndUpdate(
          { _id: line.productId, tenantId },
          { $set: { stockQuantity: line.actualQuantity } }
        );
      }
    }

    res.status(201).json(adjustment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Adjustment
router.get('/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const adjustment = await InventoryAdjustment.findOne({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) })
      .populate('adjustedBy', 'name');
    
    if (!adjustment) return res.status(404).json({ error: 'Adjustment not found' });
    res.json(adjustment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
