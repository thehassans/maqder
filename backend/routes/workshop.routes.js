import express from 'express';
import WorkshopVehicle from '../models/WorkshopVehicle.js';
import WorkshopJobCard from '../models/WorkshopJobCard.js';
import WorkshopEstimate from '../models/WorkshopEstimate.js';
import WorkshopInventoryItem from '../models/WorkshopInventoryItem.js';
import WorkshopPurchaseOrder from '../models/WorkshopPurchaseOrder.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);
router.use(tenantFilter);

/* ─── VEHICLES ─── */

router.get('/vehicles', checkPermission('workshop', 'read'), async (req, res) => {
  try {
    const { search } = req.query;
    const filter = { ...req.tenantFilter };
    if (search) {
      filter.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }
    const vehicles = await WorkshopVehicle.find(filter).sort({ createdAt: -1 }).lean();
    res.json(vehicles);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/vehicles', checkPermission('workshop', 'create'), async (req, res) => {
  try {
    const data = { ...req.body, tenantId: req.user.tenantId };
    const vehicle = await WorkshopVehicle.create(data);
    res.status(201).json(vehicle);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/vehicles/:id', checkPermission('workshop', 'update'), async (req, res) => {
  try {
    const vehicle = await WorkshopVehicle.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter }, req.body, { new: true }
    );
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/vehicles/:id', checkPermission('workshop', 'delete'), async (req, res) => {
  try {
    const vehicle = await WorkshopVehicle.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── JOB CARDS ─── */

router.get('/job-cards', checkPermission('workshop', 'read'), async (req, res) => {
  try {
    const { status, vehicleId, customerId } = req.query;
    const filter = { ...req.tenantFilter };
    if (status) filter.status = status;
    if (vehicleId) filter.vehicleId = vehicleId;
    if (customerId) filter.customerId = customerId;
    const cards = await WorkshopJobCard.find(filter)
      .populate('customerId', 'name phone')
      .populate('vehicleId', 'plateNumber make model')
      .sort({ createdAt: -1 }).lean();
    res.json(cards);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/job-cards', checkPermission('workshop', 'create'), async (req, res) => {
  try {
    const count = await WorkshopJobCard.countDocuments({ ...req.tenantFilter });
    const jobCardNumber = `JC-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const data = { ...req.body, tenantId: req.user.tenantId, jobCardNumber, createdBy: req.user._id };
    const card = await WorkshopJobCard.create(data);
    res.status(201).json(card);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/job-cards/:id', checkPermission('workshop', 'update'), async (req, res) => {
  try {
    const card = await WorkshopJobCard.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter }, req.body, { new: true }
    );
    if (!card) return res.status(404).json({ error: 'Not found' });
    res.json(card);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/job-cards/:id', checkPermission('workshop', 'delete'), async (req, res) => {
  try {
    const card = await WorkshopJobCard.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!card) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── STATUS TRANSITION ─── */

router.post('/job-cards/:id/transition', checkPermission('workshop', 'update'), async (req, res) => {
  try {
    const { status } = req.body;
    const card = await WorkshopJobCard.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { status },
      { new: true }
    );
    if (!card) return res.status(404).json({ error: 'Not found' });
    res.json(card);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/* ─── ESTIMATES ─── */

router.get('/estimates', checkPermission('workshop', 'read'), async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    const estimates = await WorkshopEstimate.find(filter).sort({ createdAt: -1 }).lean();
    res.json(estimates);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/estimates', checkPermission('workshop', 'create'), async (req, res) => {
  try {
    const count = await WorkshopEstimate.countDocuments({ ...req.tenantFilter });
    const estimateNumber = `EST-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const data = { ...req.body, tenantId: req.user.tenantId, estimateNumber, createdBy: req.user._id };
    const estimate = await WorkshopEstimate.create(data);
    res.status(201).json(estimate);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/estimates/:id', checkPermission('workshop', 'update'), async (req, res) => {
  try {
    const estimate = await WorkshopEstimate.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter }, req.body, { new: true }
    );
    if (!estimate) return res.status(404).json({ error: 'Not found' });
    res.json(estimate);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

/* ─── INVENTORY ─── */

router.get('/inventory', checkPermission('workshop', 'read'), async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = { ...req.tenantFilter };
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { oemPartNumbers: { $regex: search, $options: 'i' } },
      ];
    }
    const items = await WorkshopInventoryItem.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/inventory', checkPermission('workshop', 'create'), async (req, res) => {
  try {
    const data = { ...req.body, tenantId: req.user.tenantId };
    const item = await WorkshopInventoryItem.create(data);
    res.status(201).json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/inventory/:id', checkPermission('workshop', 'update'), async (req, res) => {
  try {
    const item = await WorkshopInventoryItem.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter }, req.body, { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.delete('/inventory/:id', checkPermission('workshop', 'delete'), async (req, res) => {
  try {
    const item = await WorkshopInventoryItem.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ─── PURCHASE ORDERS ─── */

router.get('/purchase-orders', checkPermission('workshop', 'read'), async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    const pos = await WorkshopPurchaseOrder.find(filter).sort({ createdAt: -1 }).lean();
    res.json(pos);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/purchase-orders', checkPermission('workshop', 'create'), async (req, res) => {
  try {
    const count = await WorkshopPurchaseOrder.countDocuments({ ...req.tenantFilter });
    const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;
    const data = { ...req.body, tenantId: req.user.tenantId, poNumber, createdBy: req.user._id };
    const po = await WorkshopPurchaseOrder.create(data);
    res.status(201).json(po);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.put('/purchase-orders/:id', checkPermission('workshop', 'update'), async (req, res) => {
  try {
    const po = await WorkshopPurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter }, req.body, { new: true }
    );
    if (!po) return res.status(404).json({ error: 'Not found' });
    res.json(po);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

export default router;
