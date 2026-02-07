import express from 'express';
import RestaurantOrder from '../models/RestaurantOrder.js';
import RestaurantMenuItem from '../models/RestaurantMenuItem.js';
import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import { protect, tenantFilter, checkPermission, requireBusinessType } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);
router.use(requireBusinessType('restaurant'));

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

async function generateOrderNumber(tenantFilterValue) {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  const prefix = `RO-${y}${m}${d}`;

  const last = await RestaurantOrder.findOne({
    ...tenantFilterValue,
    orderNumber: { $regex: `^${prefix}-` },
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .select('orderNumber');

  let seq = 1;
  if (last?.orderNumber) {
    const parts = last.orderNumber.split('-');
    const lastSeq = Number(parts[parts.length - 1]);
    if (Number.isFinite(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(3, '0')}`;
}

function computeTotals(lineItems = []) {
  const normalized = (Array.isArray(lineItems) ? lineItems : []).map((li) => {
    const quantity = toNumber(li.quantity, 0);
    const unitPrice = toNumber(li.unitPrice, 0);
    const taxRate = toNumber(li.taxRate ?? 15, 15);

    const lineSubtotal = quantity * unitPrice;
    const lineTax = lineSubtotal * (taxRate / 100);
    const lineTotal = lineSubtotal + lineTax;

    return {
      menuItemId: li.menuItemId,
      name: li.name,
      nameAr: li.nameAr,
      quantity,
      unitPrice,
      taxRate,
      lineSubtotal,
      lineTax,
      lineTotal,
    };
  });

  const subtotal = normalized.reduce((sum, li) => sum + (li.lineSubtotal || 0), 0);
  const totalTax = normalized.reduce((sum, li) => sum + (li.lineTax || 0), 0);
  const grandTotal = subtotal + totalTax;

  return { normalized, subtotal, totalTax, grandTotal };
}

async function enrichLineItemsWithMenuItems(lineItems, tenantFilterValue) {
  const items = Array.isArray(lineItems) ? lineItems : [];

  const ids = items
    .map((li) => li.menuItemId)
    .filter(Boolean)
    .map((id) => id.toString());

  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return items;

  const menuItems = await RestaurantMenuItem.find({ _id: { $in: uniqueIds }, ...tenantFilterValue }).lean();
  const byId = new Map(menuItems.map((m) => [String(m._id), m]));

  return items.map((li) => {
    const m = li.menuItemId ? byId.get(String(li.menuItemId)) : null;
    if (!m) return li;

    return {
      ...li,
      name: li.name || m.nameEn,
      nameAr: li.nameAr || m.nameAr,
      unitPrice: li.unitPrice ?? m.sellingPrice,
      taxRate: li.taxRate ?? m.taxRate,
    };
  });
}

router.get('/', checkPermission('restaurant', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 25, search, status } = req.query;

    const query = { ...req.tenantFilter, isActive: true };
    if (status) query.status = status;

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { tableNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await RestaurantOrder.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RestaurantOrder.countDocuments(query);

    res.json({
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/create-invoice', checkPermission('restaurant', 'update'), checkPermission('invoicing', 'create'), async (req, res) => {
  try {
    const order = await RestaurantOrder.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.invoiceId) {
      const existing = await Invoice.findOne({ _id: order.invoiceId, ...req.tenantFilter });
      if (existing) {
        return res.json({ invoice: existing, order });
      }
    }

    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const lastInvoice = await Invoice.findOne({ tenantId: req.user.tenantId, invoiceNumber: { $regex: '^INV-' } })
      .sort({ createdAt: -1 })
      .select('invoiceNumber');

    let invoiceCount = 1;
    if (lastInvoice?.invoiceNumber) {
      const maybe = parseInt(String(lastInvoice.invoiceNumber).split('-').pop());
      if (Number.isFinite(maybe)) invoiceCount = maybe + 1;
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount).padStart(6, '0')}`;

    const lineItems = (Array.isArray(order.lineItems) ? order.lineItems : []).map((li, i) => ({
      lineNumber: i + 1,
      productName: li.name,
      productNameAr: li.nameAr,
      quantity: toNumber(li.quantity, 0),
      unitCode: 'PCE',
      unitPrice: toNumber(li.unitPrice, 0),
      taxRate: toNumber(li.taxRate ?? 15, 15),
      taxCategory: 'S',
      productId: undefined,
    }));

    const paymentMethod =
      order.paymentMethod === 'cash'
        ? 'cash'
        : order.paymentMethod === 'transfer'
          ? 'bank_transfer'
          : 'other';

    const invoice = await Invoice.create({
      tenantId: req.user.tenantId,
      flow: 'sell',
      invoiceNumber,
      transactionType: 'B2C',
      invoiceTypeCode: '0200000',
      issueDate: new Date(),
      currency: order.currency || 'SAR',
      paymentMethod,
      contractNumber: order.orderNumber,
      restaurantOrderId: order._id,
      seller: {
        name: tenant.business.legalNameEn,
        nameAr: tenant.business.legalNameAr,
        vatNumber: tenant.business.vatNumber,
        crNumber: tenant.business.crNumber,
        address: tenant.business.address,
      },
      buyer: {
        name: order.customerName || 'Cash Customer',
        nameAr: order.customerName ? undefined : 'عميل نقدي',
        contactPhone: order.customerPhone,
      },
      lineItems,
      createdBy: req.user._id,
      notes: order.notes,
    });

    const updatedOrder = await RestaurantOrder.findOneAndUpdate(
      { _id: order._id, ...req.tenantFilter },
      { invoiceId: invoice._id, invoiceNumber: invoice.invoiceNumber, invoicedAt: new Date() },
      { new: true }
    );

    res.status(201).json({ invoice, order: updatedOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats', checkPermission('restaurant', 'read'), async (req, res) => {
  try {
    const stats = await RestaurantOrder.aggregate([
      { $match: { ...req.tenantFilter, isActive: true } },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                revenue: { $sum: '$grandTotal' },
                open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
              },
            },
          ],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          recent: [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            { $project: { orderNumber: 1, status: 1, tableNumber: 1, grandTotal: 1, createdAt: 1 } },
          ],
        },
      },
    ]);

    res.json(stats?.[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/kitchen', checkPermission('restaurant', 'read'), async (req, res) => {
  try {
    const { statuses } = req.query;

    let statusList = ['new', 'preparing', 'ready'];
    if (Array.isArray(statuses)) {
      statusList = statuses.map((s) => String(s));
    } else if (typeof statuses === 'string' && statuses.trim()) {
      statusList = statuses
        .split(',')
        .map((s) => String(s).trim())
        .filter(Boolean);
    }

    const query = {
      ...req.tenantFilter,
      isActive: true,
      status: 'open',
      kitchenStatus: { $in: statusList.length ? statusList : ['new', 'preparing', 'ready'] },
    };

    const orders = await RestaurantOrder.find(query).sort({ createdAt: 1 }).limit(200);

    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id/kitchen-status', checkPermission('restaurant', 'update'), async (req, res) => {
  try {
    const nextStatus = String(req.body?.kitchenStatus || '').trim();
    const allowed = new Set(['new', 'preparing', 'ready', 'served', 'cancelled']);
    if (!allowed.has(nextStatus)) {
      return res.status(400).json({ error: 'Invalid kitchenStatus' });
    }

    const patch = { kitchenStatus: nextStatus, kitchenStatusUpdatedAt: new Date() };
    if (nextStatus === 'cancelled') {
      patch.status = 'cancelled';
    }

    const updated = await RestaurantOrder.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, isActive: true },
      patch,
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/kitchen-ticket/printed', checkPermission('restaurant', 'update'), async (req, res) => {
  try {
    const updated = await RestaurantOrder.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, isActive: true },
      { kitchenPrintedAt: new Date() },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkPermission('restaurant', 'read'), async (req, res) => {
  try {
    const order = await RestaurantOrder.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPermission('restaurant', 'create'), async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(400).json({ error: 'No tenant associated with user' });
    }

    const orderNumber = req.body.orderNumber || (await generateOrderNumber(req.tenantFilter));
    const enriched = await enrichLineItemsWithMenuItems(req.body.lineItems, req.tenantFilter);
    const { normalized, subtotal, totalTax, grandTotal } = computeTotals(enriched);

    const order = await RestaurantOrder.create({
      ...req.body,
      orderNumber,
      lineItems: normalized,
      subtotal,
      totalTax,
      grandTotal,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
    });

    res.status(201).json(order);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Duplicate order number' });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', checkPermission('restaurant', 'update'), async (req, res) => {
  try {
    const existing = await RestaurantOrder.findOne({ _id: req.params.id, ...req.tenantFilter, isActive: true });
    if (!existing) return res.status(404).json({ error: 'Order not found' });

    const enriched = await enrichLineItemsWithMenuItems(req.body.lineItems, req.tenantFilter);
    const { normalized, subtotal, totalTax, grandTotal } = computeTotals(enriched);

    const patch = { ...req.body, lineItems: normalized, subtotal, totalTax, grandTotal };
    if (patch.status === 'cancelled' && !patch.kitchenStatus) {
      patch.kitchenStatus = 'cancelled';
      patch.kitchenStatusUpdatedAt = new Date();
    }

    if (patch.kitchenStatus && patch.kitchenStatus !== existing.kitchenStatus) {
      patch.kitchenStatusUpdatedAt = new Date();
    }

    const updated = await RestaurantOrder.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      patch,
      { new: true, runValidators: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('restaurant', 'delete'), async (req, res) => {
  try {
    const order = await RestaurantOrder.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { isActive: false },
      { new: true }
    );

    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({ message: 'Order deactivated', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
