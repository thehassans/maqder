import express from 'express';
import { protect } from '../middleware/auth.js';
import InventoryAdjustment from '../models/InventoryAdjustment.js';
import BakalaProduct from '../models/BakalaProduct.js';

const router = express.Router();

// Generate Adjustment Number
const generateAdjustmentNumber = async (tenantId) => {
  const count = await InventoryAdjustment.countDocuments({ tenantId });
  return `ADJ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
};

// Get all Adjustments
router.get('/', protect, async (req, res) => {
  try {
    const adjustments = await InventoryAdjustment.find({ tenantId: req.user.tenantId })
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

    const adjustmentNumber = await generateAdjustmentNumber(req.user.tenantId);

    const adjustment = new InventoryAdjustment({
      tenantId: req.user.tenantId,
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
          { _id: line.productId, tenantId: req.user.tenantId },
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
    const adjustment = await InventoryAdjustment.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
      .populate('adjustedBy', 'name');
    
    if (!adjustment) return res.status(404).json({ error: 'Adjustment not found' });
    res.json(adjustment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
