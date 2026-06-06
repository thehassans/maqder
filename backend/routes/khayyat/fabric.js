import express from 'express';
import KhayyatFabric from '../../models/khayyat/KhayyatFabric.js';
import KhayyatStitching from '../../models/khayyat/KhayyatStitching.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const fabrics = await KhayyatFabric.find({ tenantId: req.user.tenantId })
      .populate('supplierId', 'nameEn nameAr code')
      .sort({ createdAt: -1 });
    res.json({ fabrics });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, madeIn, pricePerRoll, rollsInStock, stockMeters, supplierId } = req.body;
    if (!name) return res.status(400).json({ error: 'Fabric name is required' });

    const fabric = new KhayyatFabric({
      tenantId: req.user.tenantId,
      name,
      madeIn: madeIn || '',
      pricePerRoll: pricePerRoll || 0,
      rollsInStock: rollsInStock || 0,
      stockMeters: stockMeters || 0,
      supplierId: supplierId || null
    });

    await fabric.save();
    res.status(201).json({ fabric });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const fabric = await KhayyatFabric.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!fabric) return res.status(404).json({ error: 'Fabric not found' });

    if (req.body.name) fabric.name = req.body.name;
    if (req.body.madeIn !== undefined) fabric.madeIn = req.body.madeIn;
    if (req.body.pricePerRoll !== undefined) fabric.pricePerRoll = req.body.pricePerRoll;
    if (req.body.rollsInStock !== undefined) fabric.rollsInStock = req.body.rollsInStock;
    if (req.body.stockMeters !== undefined) fabric.stockMeters = req.body.stockMeters;
    if (req.body.supplierId !== undefined) fabric.supplierId = req.body.supplierId || null;

    await fabric.save();
    res.json({ fabric });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/stock', async (req, res) => {
  try {
    const { delta } = req.body;
    if (!delta) return res.status(400).json({ error: 'Invalid stock change' });

    const updated = await KhayyatFabric.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $inc: { rollsInStock: delta } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Fabric not found' });

    res.json({ fabric: updated });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const inUse = await KhayyatStitching.findOne({ tenantId: req.user.tenantId, fabricId: req.params.id }).select('_id').lean();
    if (inUse) return res.status(400).json({ error: 'Fabric is used by orders' });

    const deleted = await KhayyatFabric.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!deleted) return res.status(404).json({ error: 'Fabric not found' });

    res.json({ message: 'Fabric deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
