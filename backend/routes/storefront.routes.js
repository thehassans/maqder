import express from 'express';
import mongoose from 'mongoose';
import Tenant from '../models/Tenant.js';
import EcommerceProduct from '../models/EcommerceProduct.js';
import EcommerceOrder from '../models/EcommerceOrder.js';
import EcommerceReview from '../models/EcommerceReview.js';
import { resolveTenantByHost } from '../middleware/resolveTenantByHost.js';
import { createCheckoutSession } from '../services/paymentService.js';
import { fireServerSideEvents, getPublicPixelConfig } from '../services/pixelService.js';

const router = express.Router();

// All storefront routes use host-based tenant resolution (no JWT auth)
router.use(resolveTenantByHost);

// --- STORE INFO (theme, store name, SEO) ---
router.get('/info', async (req, res) => {
  try {
    const tenant = req.storeTenant;
    const ecommerce = tenant.ecommerce || {};
    const theme = ecommerce.theme?.published || {};
    res.json({
      storeName: ecommerce.storeName || tenant.name,
      storeNameAr: ecommerce.storeNameAr || '',
      storeStatus: ecommerce.storeStatus,
      currency: ecommerce.currency || 'SAR',
      theme,
      seo: ecommerce.seo || {},
      logo: theme.header?.logoImageUrl || '',
      logoText: theme.header?.logoText || ecommerce.storeName || tenant.name,
      pixels: getPublicPixelConfig(ecommerce.pixels),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- LIST PRODUCTS (public, active only) ---
router.get('/products', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { search, category, sort, page = 1, limit = 24, minPrice, maxPrice, inStock } = req.query;
    const filter = { tenantId, status: 'active' };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.basePrice = {};
      if (minPrice) filter.basePrice.$gte = Number(minPrice);
      if (maxPrice) filter.basePrice.$lte = Number(maxPrice);
    }
    if (inStock === 'true') {
      filter.$or = [
        { trackInventory: false },
        { trackInventory: true, stockQuantity: { $gt: 0 } },
        { hasVariants: true, 'variants.stockQuantity': { $gt: 0 } },
      ];
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      'price-low': { basePrice: 1 },
      'price-high': { basePrice: -1 },
      popular: { salesCount: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      EcommerceProduct.find(filter)
        .select('title titleAr basePrice compareAtPrice images category hasVariants variants.sku variants.price variants.stockQuantity seo.slug')
        .sort(sortBy)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      EcommerceProduct.countDocuments(filter),
    ]);

    // Get distinct categories for filter
    const categories = await EcommerceProduct.distinct('category', { tenantId, status: 'active' });

    res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)), categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BATCH REVIEW STATS (for product cards) ---
router.get('/review-stats', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { productIds } = req.query;
    if (!productIds) return res.json({});
    const ids = productIds.split(',').filter(Boolean);
    const stats = await EcommerceReview.aggregate([
      { $match: { tenantId, productId: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) }, status: 'approved' } },
      { $group: { _id: '$productId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const result = {};
    stats.forEach(s => { result[s._id] = { avgRating: Math.round(s.avgRating * 10) / 10, count: s.count }; });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CATEGORY LANDING PAGE DATA ---
router.get('/category/:slug', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { slug } = req.params;
    const category = decodeURIComponent(slug);

    const [products, total, subCategories] = await Promise.all([
      EcommerceProduct.find({ tenantId, status: 'active', category })
        .select('title titleAr basePrice compareAtPrice images category hasVariants variants.sku variants.price variants.stockQuantity seo.slug salesCount')
        .sort({ salesCount: -1, createdAt: -1 })
        .limit(24)
        .lean(),
      EcommerceProduct.countDocuments({ tenantId, status: 'active', category }),
      EcommerceProduct.distinct('subcategory', { tenantId, status: 'active', category }),
    ]);

    if (total === 0) return res.status(404).json({ error: 'Category not found' });

    res.json({
      category,
      products,
      total,
      subCategories: subCategories.filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET SINGLE PRODUCT (by ID or slug) ---
router.get('/products/:id', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { id } = req.params;
    let product;

    // Try by ID first, then by slug
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await EcommerceProduct.findOne({ _id: id, tenantId, status: 'active' }).lean();
    }
    if (!product) {
      product = await EcommerceProduct.findOne({ 'seo.slug': id, tenantId, status: 'active' }).lean();
    }

    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Increment views
    EcommerceProduct.updateOne({ _id: product._id }, { $inc: { viewsCount: 1 } }).exec();

    // Get related products (same category, exclude current)
    const related = await EcommerceProduct.find({
      tenantId, status: 'active', category: product.category, _id: { $ne: product._id },
    })
      .select('title basePrice images seo.slug')
      .limit(4)
      .lean();

    res.json({ product, related });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SHIPPING ESTIMATE (public, for checkout preview) ---
router.post('/shipping/estimate', async (req, res) => {
  try {
    const ecommerce = req.storeTenant.ecommerce || {};
    const { subtotal } = req.body;
    const flatRate = ecommerce.couriers?.flatRate || {};
    let shippingCost = 0;
    let freeShipping = false;
    if (flatRate.enabled) {
      const threshold = flatRate.freeShippingThreshold || 0;
      const cartSubtotal = Number(subtotal) || 0;
      if (threshold > 0 && cartSubtotal >= threshold) {
        shippingCost = 0;
        freeShipping = true;
      } else {
        shippingCost = flatRate.price || 0;
      }
    }
    res.json({ shippingCost, freeShipping, flatRateEnabled: !!flatRate.enabled });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CREATE ORDER (public checkout) ---
router.post('/orders', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const ecommerce = req.storeTenant.ecommerce || {};
    const { customer, items, paymentMethod } = req.body;

    if (!customer || !customer.name) return res.status(400).json({ error: 'Customer name is required' });
    if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' });

    // Validate products and compute totals with atomic stock deduction
    let subtotal = 0;
    let taxTotal = 0;
    const processedItems = [];
    const currency = ecommerce.currency || 'SAR';
    const defaultTaxRate = ecommerce.defaultTaxRate || 15;
    const pricesIncludeTax = ecommerce.pricesIncludeTax ?? true;

    for (const item of items) {
      const product = await EcommerceProduct.findOne({ _id: item.productId, tenantId, status: 'active' });
      if (!product) return res.status(400).json({ error: `Product not found` });

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      let unitPrice = product.basePrice;
      let variantLabel = '';
      let variantId = null;

      if (product.hasVariants && item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (!variant || !variant.isActive) return res.status(400).json({ error: `Variant not available for ${product.title}` });
        unitPrice = variant.price || product.basePrice;
        variantId = variant._id;
        variantLabel = [variant.option1Value, variant.option2Value, variant.option3Value].filter(Boolean).join(' / ');

        if (variant.trackInventory && variant.stockQuantity < qty && !product.continueSellingWhenOOS) {
          return res.status(400).json({ error: `Out of stock: ${product.title} (${variantLabel})` });
        }
        await EcommerceProduct.updateOne(
          { _id: product._id, 'variants._id': variant._id, 'variants.stockQuantity': { $gte: qty } },
          { $inc: { 'variants.$.stockQuantity': -qty } }
        );
      } else {
        if (product.trackInventory && product.stockQuantity < qty && !product.continueSellingWhenOOS) {
          return res.status(400).json({ error: `Out of stock: ${product.title}` });
        }
        await EcommerceProduct.updateOne(
          { _id: product._id, stockQuantity: { $gte: qty } },
          { $inc: { stockQuantity: -qty } }
        );
      }

      const taxRate = product.taxRate || defaultTaxRate;
      const lineTotal = unitPrice * qty;
      const lineTax = pricesIncludeTax ? 0 : lineTotal * (taxRate / 100);
      subtotal += lineTotal;
      taxTotal += lineTax;

      processedItems.push({
        productId: product._id,
        productTitle: product.title,
        productImage: product.images?.[0]?.url || '',
        variantId,
        variantLabel,
        sku: product.hasVariants ? '' : product.sku,
        price: unitPrice,
        quantity: qty,
        taxRate,
        taxAmount: Math.round(lineTax * 100) / 100,
        lineTotal: Math.round(lineTotal * 100) / 100,
      });

      EcommerceProduct.updateOne({ _id: product._id }, { $inc: { salesCount: qty } }).exec();
    }

    // Calculate shipping (flat rate for now)
    const flatRate = ecommerce.couriers?.flatRate || {};
    let shippingCost = 0;
    if (flatRate.enabled) {
      shippingCost = subtotal >= (flatRate.freeShippingThreshold || Infinity) ? 0 : (flatRate.price || 0);
    }

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
      currency,
      payment: {
        method: paymentMethod || 'cod',
        status: 'pending',
        amount: grandTotal,
        currency,
      },
      shipping: {
        method: flatRate.enabled ? 'flat_rate' : 'pickup',
        cost: shippingCost,
        status: 'unfulfilled',
      },
      source: 'storefront',
      customerIp: req.ip || '',
    });

    await order.save();

    // Fire server-side pixel events (CAPI)
    const pixelConfig = ecommerce.pixels || {};
    fireServerSideEvents('Purchase', {
      eventId: `purchase_${order.orderNumber}`,
      customData: { value: order.grandTotal, currency: order.currency, content_ids: processedItems.map(i => i.productId.toString()), content_type: 'product', num_items: processedItems.length },
      userData: { email: order.customer.email, phone: order.customer.phone },
    }, pixelConfig).catch(() => {});

    res.status(201).json({ order, orderId: order._id, orderNumber: order.orderNumber });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- INITIATE PAYMENT FOR ORDER ---
router.post('/checkout/:orderId', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const ecommerce = req.storeTenant.ecommerce || {};
    const order = await EcommerceOrder.findOne({ _id: req.params.orderId, tenantId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const provider = req.body.provider || ecommerce.payments?.defaultProvider;
    if (!provider || provider === 'cod') {
      order.payment.method = 'cod';
      order.payment.status = 'pending';
      await order.save();
      return res.json({ provider: 'cod', checkoutUrl: null });
    }

    const config = ecommerce.payments?.[provider];
    if (!config?.enabled) return res.status(400).json({ error: `${provider} is not enabled` });

    const host = req.headers['x-forwarded-host'] || req.headers.host || '';
    const origin = `https://${host}`;
    const result = await createCheckoutSession(provider, {
      amount: order.grandTotal,
      currency: order.currency,
      orderId: order._id.toString(),
      orderNumber: order.orderNumber,
      customer: order.customer,
      successUrl: `${origin}/checkout/success?order=${order.orderNumber}`,
      cancelUrl: `${origin}/checkout/cancel?order=${order.orderNumber}`,
    }, config);

    order.payment.method = provider;
    order.payment.provider = provider;
    order.payment.providerTransactionId = result.providerPaymentId;
    await order.save();

    res.json({ provider, checkoutUrl: result.checkoutUrl, paymentId: result.providerPaymentId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- ORDER TRACKING (public, lookup by order number + phone/email) ---
router.post('/track-order', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { orderNumber, phone, email } = req.body;

    if (!orderNumber) return res.status(400).json({ error: 'Order number is required' });

    const order = await EcommerceOrder.findOne({ tenantId, orderNumber: orderNumber.trim() }).lean();
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Verify phone or email matches
    const phoneMatch = phone && order.customer.phone && order.customer.phone.replace(/\s/g, '') === phone.replace(/\s/g, '');
    const emailMatch = email && order.customer.email && order.customer.email.toLowerCase() === email.toLowerCase().trim();
    if (!phoneMatch && !emailMatch) {
      return res.status(403).json({ error: 'Phone or email does not match this order' });
    }

    // Return sanitized order info (no sensitive data)
    res.json({
      _id: order._id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      total: order.grandTotal,
      currency: order.currency || 'SAR',
      itemCount: order.lineItems?.length || 0,
      items: order.lineItems?.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })) || [],
      shippingStatus: order.shipping?.status || 'unfulfilled',
      trackingNumber: order.shipping?.trackingNumber || '',
      paymentStatus: order.payment?.status || 'pending',
      paymentMethod: order.payment?.method || '',
      statusHistory: order.statusHistory?.map(h => ({ status: h.status, date: h.changedAt, note: h.note })) || [],
      estimatedDelivery: order.shipping?.estimatedDelivery || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BULK ORDER LOOKUP (find all orders by phone or email) ---
router.post('/track-orders', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { phone, email } = req.body;
    if (!phone && !email) return res.status(400).json({ error: 'Phone or email is required' });

    const filter = { tenantId };
    if (phone) filter['customer.phone'] = { $regex: phone.replace(/\s/g, ''), $options: 'i' };
    else if (email) filter['customer.email'] = email.toLowerCase().trim();

    const orders = await EcommerceOrder.find(filter)
      .select('orderNumber status createdAt grandTotal currency lineItems shipping.status shipping.trackingNumber payment.status')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    if (orders.length === 0) return res.status(404).json({ error: 'No orders found' });

    res.json({
      orders: orders.map(o => ({
        orderNumber: o.orderNumber,
        status: o.status,
        createdAt: o.createdAt,
        total: o.grandTotal,
        currency: o.currency || 'SAR',
        itemCount: o.lineItems?.length || 0,
        shippingStatus: o.shipping?.status || 'unfulfilled',
        trackingNumber: o.shipping?.trackingNumber || '',
        paymentStatus: o.payment?.status || 'pending',
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RETURN REQUEST (public, customer submits return) ---
router.post('/returns/request', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { orderId, orderNumber, phone, email, items, reason, reasonDetails, images } = req.body;

    if (!orderId || !items || items.length === 0) {
      return res.status(400).json({ error: 'Order ID and items are required' });
    }

    const order = await EcommerceOrder.findOne({ tenantId, _id: orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Verify phone or email matches
    const phoneMatch = phone && order.customer.phone && order.customer.phone.replace(/\s/g, '') === phone.replace(/\s/g, '');
    const emailMatch = email && order.customer.email && order.customer.email.toLowerCase() === email.toLowerCase().trim();
    if (!phoneMatch && !emailMatch) {
      return res.status(403).json({ error: 'Phone or email does not match this order' });
    }

    if (!['delivered', 'completed'].includes(order.status)) {
      return res.status(400).json({ error: 'Returns can only be requested for delivered orders' });
    }

    // Check for existing pending return
    const EcommerceReturn = (await import('../models/EcommerceReturn.js')).default;
    const existing = await EcommerceReturn.findOne({
      tenantId, orderId, status: { $in: ['requested', 'approved', 'received'] },
    });
    if (existing) {
      return res.status(400).json({ error: 'A return request is already in progress for this order' });
    }

    const refundAmount = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    const ret = await EcommerceReturn.create({
      tenantId,
      orderId,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name || '',
      customerEmail: order.customer?.email || '',
      customerPhone: order.customer?.phone || '',
      items,
      reason: reason || 'other',
      reasonDetails: reasonDetails || '',
      refundAmount,
      images: images || [],
    });

    res.json({ success: true, returnNumber: ret.returnNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- RETURN STATUS CHECK (public) ---
router.post('/returns/status', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { orderId, phone, email } = req.body;

    const EcommerceReturn = (await import('../models/EcommerceReturn.js')).default;
    const ret = await EcommerceReturn.findOne({ tenantId, orderId }).sort({ createdAt: -1 }).lean();
    if (!ret) return res.json({ return: null });

    // Verify phone or email
    const phoneMatch = phone && ret.customerPhone && ret.customerPhone.replace(/\s/g, '') === phone.replace(/\s/g, '');
    const emailMatch = email && ret.customerEmail && ret.customerEmail.toLowerCase() === email.toLowerCase().trim();
    if (!phoneMatch && !emailMatch) {
      return res.status(403).json({ error: 'Phone or email does not match' });
    }

    res.json({
      return: {
        returnNumber: ret.returnNumber,
        status: ret.status,
        reason: ret.reason,
        refundAmount: ret.refundAmount,
        createdAt: ret.createdAt,
        items: ret.items,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NEWSLETTER SUBSCRIPTION ---
router.post('/newsletter/subscribe', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { email } = req.body;

    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });

    // Store subscriber on tenant ecommerce config
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Store not found' });

    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.newsletterSubscribers = tenant.ecommerce.newsletterSubscribers || [];

    const exists = tenant.ecommerce.newsletterSubscribers.find(s => s.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      if (!exists.isActive) {
        exists.isActive = true;
        exists.resubscribedAt = new Date();
        await tenant.save();
      }
      return res.json({ subscribed: true, message: 'Already subscribed' });
    }

    tenant.ecommerce.newsletterSubscribers.push({
      email: email.toLowerCase().trim(),
      subscribedAt: new Date(),
      isActive: true,
    });

    await tenant.save();
    res.json({ subscribed: true, message: 'Subscribed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- NEWSLETTER UNSUBSCRIBE ---
router.post('/newsletter/unsubscribe', async (req, res) => {
  try {
    const tenantId = req.storeTenant._id;
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Store not found' });

    const subscriber = (tenant.ecommerce?.newsletterSubscribers || []).find(s => s.email === email.toLowerCase().trim());
    if (subscriber) {
      subscriber.isActive = false;
      subscriber.unsubscribedAt = new Date();
      await tenant.save();
    }

    res.json({ unsubscribed: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
