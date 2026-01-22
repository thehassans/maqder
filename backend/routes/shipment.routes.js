import express from 'express';
import Shipment from '../models/Shipment.js';
import Supplier from '../models/Supplier.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Product from '../models/Product.js';
import Warehouse from '../models/Warehouse.js';
import { protect, tenantFilter, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function generateShipmentNumber(tenantFilterValue) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const prefix = `SHP-${y}${m}${d}`;

  const last = await Shipment.findOne({
    ...tenantFilterValue,
    shipmentNumber: { $regex: `^${prefix}-` }
  })
    .sort({ createdAt: -1 })
    .select('shipmentNumber');

  let seq = 1;
  if (last?.shipmentNumber) {
    const parts = last.shipmentNumber.split('-');
    const lastSeq = Number(parts[parts.length - 1]);
    if (Number.isFinite(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

router.get('/', checkPermission('supply_chain', 'read'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 25,
      status,
      type,
      supplierId,
      purchaseOrderId,
      warehouseId,
      search
    } = req.query;

    const query = { ...req.tenantFilter, isActive: true };

    if (status) query.status = status;
    if (type) query.type = type;
    if (supplierId) query.supplierId = supplierId;
    if (purchaseOrderId) query.purchaseOrderId = purchaseOrderId;
    if (warehouseId) query.warehouseId = warehouseId;

    if (search) {
      query.$or = [
        { shipmentNumber: { $regex: search, $options: 'i' } },
        { trackingNumber: { $regex: search, $options: 'i' } },
        { carrier: { $regex: search, $options: 'i' } }
      ];
    }

    const shipments = await Shipment.find(query)
      .populate('supplierId', 'code nameEn nameAr')
      .populate('purchaseOrderId', 'poNumber')
      .populate('warehouseId', 'code nameEn nameAr')
      .sort({ shippedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Shipment.countDocuments(query);

    res.json({
      shipments,
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

router.get('/stats', checkPermission('supply_chain', 'read'), async (req, res) => {
  try {
    const stats = await Shipment.aggregate([
      { $match: { ...req.tenantFilter, isActive: true } },
      {
        $facet: {
          totals: [{ $group: { _id: null, total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } }, inTransit: { $sum: { $cond: [{ $eq: ['$status', 'in_transit'] }, 1, 0] } } } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byType: [{ $group: { _id: '$type', count: { $sum: 1 } } }],
          recent: [
            { $sort: { shippedAt: -1, createdAt: -1 } },
            { $limit: 5 },
            { $project: { shipmentNumber: 1, status: 1, type: 1, shippedAt: 1, expectedDelivery: 1 } }
          ]
        }
      }
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkPermission('supply_chain', 'read'), async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true })
      .populate('supplierId', 'code nameEn nameAr phone email')
      .populate('purchaseOrderId', 'poNumber status')
      .populate('warehouseId', 'code nameEn nameAr')
      .populate('lineItems.productId', 'sku nameEn nameAr barcode');

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPermission('supply_chain', 'create'), async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(400).json({ error: 'No tenant associated with user' });
    }

    if (req.body.supplierId) {
      const supplier = await Supplier.findOne({ _id: req.body.supplierId, ...req.tenantFilter, isActive: true });
      if (!supplier) {
        return res.status(400).json({ error: 'Invalid supplier' });
      }
    }

    if (req.body.purchaseOrderId) {
      const po = await PurchaseOrder.findOne({ _id: req.body.purchaseOrderId, ...req.tenantFilter });
      if (!po) {
        return res.status(400).json({ error: 'Invalid purchase order' });
      }
    }

    if (req.body.warehouseId) {
      const wh = await Warehouse.findOne({ _id: req.body.warehouseId, ...req.tenantFilter, isActive: true });
      if (!wh) {
        return res.status(400).json({ error: 'Invalid warehouse' });
      }
    }

    const lineItems = Array.isArray(req.body.lineItems) ? req.body.lineItems : [];
    const productIds = lineItems
      .map((li) => li.productId)
      .filter(Boolean)
      .map((id) => id.toString());

    const uniqueProductIds = [...new Set(productIds)];
    if (uniqueProductIds.length) {
      const existingCount = await Product.countDocuments({ _id: { $in: uniqueProductIds }, ...req.tenantFilter });
      if (existingCount !== uniqueProductIds.length) {
        return res.status(400).json({ error: 'Invalid product in line items' });
      }
    }

    const shipmentNumber = req.body.shipmentNumber || (await generateShipmentNumber(req.tenantFilter));

    const data = {
      ...req.body,
      shipmentNumber,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
      lineItems: lineItems.map((li) => ({
        productId: li.productId,
        description: li.description,
        quantity: toNumber(li.quantity, 0)
      }))
    };

    const shipment = await Shipment.create(data);
    res.status(201).json(shipment);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Duplicate shipment number' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkPermission('supply_chain', 'update'), async (req, res) => {
  try {
    const existing = await Shipment.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!existing) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (['delivered', 'cancelled'].includes(existing.status)) {
      return res.status(400).json({ error: 'Cannot update this shipment' });
    }

    if (req.body.supplierId) {
      const supplier = await Supplier.findOne({ _id: req.body.supplierId, ...req.tenantFilter, isActive: true });
      if (!supplier) {
        return res.status(400).json({ error: 'Invalid supplier' });
      }
    }

    if (req.body.purchaseOrderId) {
      const po = await PurchaseOrder.findOne({ _id: req.body.purchaseOrderId, ...req.tenantFilter });
      if (!po) {
        return res.status(400).json({ error: 'Invalid purchase order' });
      }
    }

    if (req.body.warehouseId) {
      const wh = await Warehouse.findOne({ _id: req.body.warehouseId, ...req.tenantFilter, isActive: true });
      if (!wh) {
        return res.status(400).json({ error: 'Invalid warehouse' });
      }
    }

    const updateData = { ...req.body };

    if (Array.isArray(req.body.lineItems)) {
      updateData.lineItems = req.body.lineItems.map((li) => ({
        productId: li.productId,
        description: li.description,
        quantity: toNumber(li.quantity, 0)
      }));
    }

    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, isActive: true },
      updateData,
      { new: true, runValidators: true }
    );

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/mark-in-transit', checkPermission('supply_chain', 'update'), async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status === 'cancelled' || shipment.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot change status' });
    }

    shipment.status = 'in_transit';
    if (!shipment.shippedAt) shipment.shippedAt = new Date();
    await shipment.save();

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/mark-delivered', checkPermission('supply_chain', 'update'), async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot deliver a cancelled shipment' });
    }

    shipment.status = 'delivered';
    shipment.deliveredAt = new Date();
    await shipment.save();

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/cancel', checkPermission('supply_chain', 'update'), async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (shipment.status === 'delivered') {
      return res.status(400).json({ error: 'Cannot cancel a delivered shipment' });
    }

    shipment.status = 'cancelled';
    await shipment.save();

    res.json(shipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('supply_chain', 'delete'), async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    res.json({ message: 'Shipment deactivated', shipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
