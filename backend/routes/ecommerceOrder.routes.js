import express from 'express';
import { protect } from '../middleware/auth.js';
import Tenant from '../models/Tenant.js';
import EcommerceOrder from '../models/EcommerceOrder.js';
import EcommerceProduct from '../models/EcommerceProduct.js';
import { sendOrderStatusEmail } from '../utils/tenantEmailService.js';

const router = express.Router();

const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'ecommerce' });
    return tenant ? tenant._id : null;
  }
  return null;
};

// Valid status transitions
const VALID_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['completed', 'returned'],
  completed: [],
  cancelled: [],
  returned: [],
};

// --- LIST ORDERS ---
router.get('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { search, status, paymentStatus, shippingStatus, sort, page = 1, limit = 20 } = req.query;
    const filter = { tenantId };

    if (status) filter.status = status;
    if (paymentStatus) filter['payment.status'] = paymentStatus;
    if (shippingStatus) filter['shipping.status'] = shippingStatus;
    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'total-high': { grandTotal: -1 },
      'total-low': { grandTotal: 1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      EcommerceOrder.find(filter).sort(sortBy).skip(skip).limit(Number(limit)).lean(),
      EcommerceOrder.countDocuments(filter),
    ]);

    res.json({ orders, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ORDER STATS (for dashboard summary) ---
router.get('/meta/stats', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [statusCounts, revenueResult, count30d] = await Promise.all([
      EcommerceOrder.aggregate([
        { $match: { tenantId: tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      EcommerceOrder.aggregate([
        { $match: { tenantId: tenantId, status: { $nin: ['cancelled', 'returned'] } } },
        { $group: { _id: null, totalRevenue: { $sum: '$grandTotal' }, totalOrders: { $sum: 1 } } },
      ]),
      EcommerceOrder.countDocuments({ tenantId, createdAt: { $gte: thirtyDaysAgo } }),
    ]);

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      statusCounts: statusMap,
      totalRevenue: revenueResult[0]?.totalRevenue || 0,
      totalOrders: revenueResult[0]?.totalOrders || 0,
      ordersLast30Days: count30d,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ANALYTICS (full dashboard analytics) ---
router.get('/meta/analytics', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const now = new Date();
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

    const matchValid = { tenantId, status: { $nin: ['cancelled', 'returned'] } };

    const [
      revenueSeries,
      prevRevenue,
      topProducts,
      paymentBreakdown,
      statusCounts,
      productCount,
      totalRevenueAll,
      aovResult,
      recentOrders,
      categorySales,
    ] = await Promise.all([
      // Daily revenue series
      EcommerceOrder.aggregate([
        { $match: { ...matchValid, createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      // Previous period revenue for comparison
      EcommerceOrder.aggregate([
        { $match: { ...matchValid, createdAt: { $gte: prevStartDate, $lt: startDate } } },
        { $group: { _id: null, revenue: { $sum: '$grandTotal' }, orders: { $sum: 1 } } },
      ]),
      // Top products by revenue
      EcommerceOrder.aggregate([
        { $match: { ...matchValid, createdAt: { $gte: startDate } } },
        { $unwind: '$lineItems' },
        { $group: { _id: '$lineItems.productId', title: { $first: '$lineItems.productTitle' }, qty: { $sum: '$lineItems.quantity' }, revenue: { $sum: '$lineItems.lineTotal' } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
      // Payment method breakdown
      EcommerceOrder.aggregate([
        { $match: { tenantId, createdAt: { $gte: startDate } } },
        { $group: { _id: '$payment.method', count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } },
      ]),
      // Status distribution
      EcommerceOrder.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      // Product count
      EcommerceProduct.countDocuments({ tenantId, status: 'active' }),
      // All-time revenue
      EcommerceOrder.aggregate([
        { $match: matchValid },
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      ]),
      // AOV
      EcommerceOrder.aggregate([
        { $match: { ...matchValid, createdAt: { $gte: startDate } } },
        { $group: { _id: null, avgOrderValue: { $avg: '$grandTotal' }, totalRevenue: { $sum: '$grandTotal' }, orderCount: { $sum: 1 } } },
      ]),
      // Recent orders
      EcommerceOrder.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customer.name grandTotal status payment.status createdAt')
        .lean(),
      // Sales by category
      EcommerceOrder.aggregate([
        { $match: { ...matchValid, createdAt: { $gte: startDate } } },
        { $unwind: '$lineItems' },
        { $lookup: { from: 'ecommerceproducts', localField: 'lineItems.productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: { _id: { $ifNull: ['$product.category', 'Uncategorized'] }, revenue: { $sum: '$lineItems.lineTotal' }, qty: { $sum: '$lineItems.quantity' }, orders: { $sum: 1 } } },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]),
    ]);

    const currentRevenue = aovResult[0]?.totalRevenue || 0;
    const currentOrders = aovResult[0]?.orderCount || 0;
    const prevRev = prevRevenue[0]?.revenue || 0;
    const prevOrd = prevRevenue[0]?.orders || 0;
    const revenueChange = prevRev > 0 ? ((currentRevenue - prevRev) / prevRev * 100) : 0;
    const ordersChange = prevOrd > 0 ? ((currentOrders - prevOrd) / prevOrd * 100) : 0;
    const aov = aovResult[0]?.avgOrderValue || 0;

    const statusMap = {};
    statusCounts.forEach(s => { statusMap[s._id] = s.count; });

    const paymentMap = {};
    paymentBreakdown.forEach(p => { paymentMap[p._id] = { count: p.count, revenue: p.revenue }; });

    res.json({
      revenueSeries: revenueSeries.map(r => ({ date: r._id, revenue: r.revenue, orders: r.orders })),
      currentRevenue,
      currentOrders,
      revenueChange: Math.round(revenueChange * 10) / 10,
      ordersChange: Math.round(ordersChange * 10) / 10,
      aov: Math.round(aov * 100) / 100,
      topProducts,
      paymentBreakdown: paymentMap,
      statusCounts: statusMap,
      activeProducts: productCount,
      totalRevenueAll: totalRevenueAll[0]?.total || 0,
      totalOrdersAll: totalRevenueAll[0]?.count || 0,
      recentOrders,
      categorySales: categorySales.map(c => ({ category: c._id, revenue: c.revenue, qty: c.qty, orders: c.orders })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET SINGLE ORDER ---
router.get('/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const order = await EcommerceOrder.findOne({ _id: req.params.id, tenantId }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CREATE ORDER (admin manual order or storefront checkout) ---
router.post('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { customer, lineItems, shipping, payment, notes, source } = req.body;

    if (!customer || !customer.name) {
      return res.status(400).json({ error: 'Customer name is required' });
    }
    if (!lineItems || !lineItems.length) {
      return res.status(400).json({ error: 'At least one line item is required' });
    }

    // Validate products and compute totals with atomic stock deduction
    let subtotal = 0;
    let taxTotal = 0;
    const processedItems = [];

    for (const item of lineItems) {
      const product = await EcommerceProduct.findOne({ _id: item.productId, tenantId });
      if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
      if (product.status !== 'active') return res.status(400).json({ error: `Product not active: ${product.title}` });

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      let unitPrice = item.price ?? product.basePrice;
      let variantLabel = '';
      let variantId = null;

      if (product.hasVariants && item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant) return res.status(400).json({ error: `Variant not found for ${product.title}` });
        if (!variant.isActive) return res.status(400).json({ error: `Variant not available for ${product.title}` });
        unitPrice = variant.price || product.basePrice;
        variantId = variant._id;
        variantLabel = [variant.option1Value, variant.option2Value, variant.option3Value].filter(Boolean).join(' / ');

        // Atomic stock deduction for variant
        if (variant.trackInventory) {
          if (variant.stockQuantity < qty && !product.continueSellingWhenOOS) {
            return res.status(400).json({ error: `Insufficient stock for ${product.title} (${variantLabel})` });
          }
          const updated = await EcommerceProduct.updateOne(
            { _id: product._id, 'variants._id': variant._id, 'variants.stockQuantity': { $gte: qty } },
            { $inc: { 'variants.$.stockQuantity': -qty } }
          );
          if (updated.modifiedCount === 0 && !product.continueSellingWhenOOS) {
            return res.status(409).json({ error: `Stock race condition for ${product.title} (${variantLabel})` });
          }
        }
      } else {
        // Non-variant stock deduction
        if (product.trackInventory) {
          if (product.stockQuantity < qty && !product.continueSellingWhenOOS) {
            return res.status(400).json({ error: `Insufficient stock for ${product.title}` });
          }
          const updated = await EcommerceProduct.updateOne(
            { _id: product._id, stockQuantity: { $gte: qty } },
            { $inc: { stockQuantity: -qty } }
          );
          if (updated.modifiedCount === 0 && !product.continueSellingWhenOOS) {
            return res.status(409).json({ error: `Stock race condition for ${product.title}` });
          }
        }
      }

      const taxRate = product.taxRate || 15;
      const lineTax = unitPrice * qty * (taxRate / 100);
      const lineTotal = unitPrice * qty;
      subtotal += lineTotal;
      taxTotal += lineTax;

      processedItems.push({
        productId: product._id,
        productTitle: product.title,
        productImage: product.images?.[0]?.url || '',
        variantId,
        variantLabel,
        sku: product.hasVariants ? (variantId ? product.variants.id(variantId)?.sku : '') : product.sku,
        price: unitPrice,
        quantity: qty,
        taxRate,
        taxAmount: Math.round(lineTax * 100) / 100,
        lineTotal: Math.round(lineTotal * 100) / 100,
      });

      // Increment sales count
      EcommerceProduct.updateOne({ _id: product._id }, { $inc: { salesCount: qty } }).exec();
    }

    const shippingCost = shipping?.cost || 0;
    const discount = 0;
    const grandTotal = Math.round((subtotal + shippingCost + taxTotal - discount) * 100) / 100;

    const order = new EcommerceOrder({
      tenantId,
      customer,
      lineItems: processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount,
      shippingCost,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal,
      currency: 'SAR',
      payment: {
        method: payment?.method || 'cod',
        status: payment?.status || 'pending',
        amount: grandTotal,
        currency: 'SAR',
      },
      shipping: {
        method: shipping?.method || 'flat_rate',
        cost: shippingCost,
        status: 'unfulfilled',
      },
      source: source || 'admin',
      notes: notes || '',
      createdBy: req.user._id,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- UPDATE ORDER STATUS ---
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { status, note } = req.body;
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await EcommerceOrder.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Validate transition
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (status !== order.status && !allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
    }

    order.status = status;
    order.statusHistory.push({ status, note: note || '', changedBy: req.user._id, changedAt: new Date() });

    // Auto-update shipping status on certain transitions
    if (status === 'shipped' && order.shipping.status === 'unfulfilled') {
      order.shipping.status = 'in_transit';
      order.shipping.fulfilledAt = new Date();
    }
    if (status === 'delivered' && order.shipping.status !== 'delivered') {
      order.shipping.status = 'delivered';
      order.shipping.deliveredAt = new Date();
    }
    if (status === 'completed' && order.payment.status === 'pending' && order.payment.method === 'cod') {
      order.payment.status = 'paid';
      order.payment.paidAt = new Date();
    }

    await order.save();

    // Send customer email notification
    try {
      const tenant = await Tenant.findById(tenantId);
      if (tenant) sendOrderStatusEmail({ tenant, order, status, note }).catch(() => {});
    } catch {}

    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- UPDATE PAYMENT STATUS ---
router.patch('/:id/payment', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { status, providerTransactionId } = req.body;
    const validStatuses = ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status' });
    }

    const order = await EcommerceOrder.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.payment.status = status;
    if (providerTransactionId) order.payment.providerTransactionId = providerTransactionId;
    if (status === 'paid' && !order.payment.paidAt) order.payment.paidAt = new Date();

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- UPDATE SHIPPING / FULFILLMENT ---
router.patch('/:id/shipping', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { status, trackingNumber, courier } = req.body;
    const validStatuses = ['unfulfilled', 'fulfilled', 'in_transit', 'delivered', 'returned'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid shipping status' });
    }

    const order = await EcommerceOrder.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status) order.shipping.status = status;
    if (trackingNumber !== undefined) order.shipping.trackingNumber = trackingNumber;
    if (courier !== undefined) order.shipping.courier = courier;
    if (status === 'fulfilled' && !order.shipping.fulfilledAt) order.shipping.fulfilledAt = new Date();
    if (status === 'delivered' && !order.shipping.deliveredAt) order.shipping.deliveredAt = new Date();

    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- CANCEL ORDER (restock items) ---
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const order = await EcommerceOrder.findOne({ _id: req.params.id, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (['cancelled', 'completed', 'returned'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot cancel a ${order.status} order` });
    }

    // Restock items
    for (const item of order.lineItems) {
      if (item.variantId) {
        await EcommerceProduct.updateOne(
          { _id: item.productId, 'variants._id': item.variantId },
          { $inc: { 'variants.$.stockQuantity': item.quantity } }
        );
      } else {
        await EcommerceProduct.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } }
        );
      }
      // Decrement sales count
      EcommerceProduct.updateOne({ _id: item.productId }, { $inc: { salesCount: -item.quantity } }).exec();
    }

    order.status = 'cancelled';
    order.statusHistory.push({ status: 'cancelled', note: req.body.note || 'Order cancelled', changedBy: req.user._id, changedAt: new Date() });
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- UPDATE INTERNAL NOTES ---
router.patch('/:id/notes', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const order = await EcommerceOrder.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { notes: req.body.notes || '' },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
