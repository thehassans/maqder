import express from 'express';
import Tenant from '../models/Tenant.js';
import EcommerceProduct from '../models/EcommerceProduct.js';
import EcommerceOrder from '../models/EcommerceOrder.js';
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
    const { search, category, sort, page = 1, limit = 24 } = req.query;
    const filter = { tenantId, status: 'active' };

    if (search) filter.$text = { $search: search };
    if (category) filter.category = category;

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

export default router;
