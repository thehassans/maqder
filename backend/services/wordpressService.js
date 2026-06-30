import EcommerceProduct from '../models/EcommerceProduct.js';
import EcommerceOrder from '../models/EcommerceOrder.js';

/**
 * WordPress / WooCommerce sync service.
 * Supports pushing products to WooCommerce and pulling orders from WooCommerce
 * via the WooCommerce REST API (v3) and WordPress REST API.
 */

function getWcConfig(tenant) {
  const wp = tenant?.ecommerce?.wordpress || {};
  if (!wp.siteUrl || (!wp.consumerKey && !wp.appPassword)) return null;

  const baseUrl = wp.siteUrl.replace(/\/+$/, '');
  const wcApiBase = `${baseUrl}/wp-json/wc/v3`;
  const wpApiBase = `${baseUrl}/wp-json`;

  let authHeader = null;
  let authQuery = '';

  if (wp.consumerKey && wp.consumerSecret) {
    // WooCommerce REST API auth via query params (official method)
    authQuery = `consumer_key=${encodeURIComponent(wp.consumerKey)}&consumer_secret=${encodeURIComponent(wp.consumerSecret)}`;
  } else if (wp.username && wp.appPassword) {
    // WordPress Application Password auth via Basic Auth
    authHeader = 'Basic ' + Buffer.from(`${wp.username}:${wp.appPassword}`).toString('base64');
  }

  return { baseUrl, wcApiBase, wpApiBase, authHeader, authQuery, syncDirection: wp.syncDirection || 'push' };
}

async function wcRequest(config, endpoint, method = 'GET', body = null) {
  const url = `${config.wcApiBase}/${endpoint}${config.authQuery ? `?${config.authQuery}` : ''}`;
  const headers = { 'Content-Type': 'application/json' };
  if (config.authHeader) headers['Authorization'] = config.authHeader;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || `WooCommerce API error: ${res.status}`;
    return { success: false, status: res.status, error: msg, data };
  }
  return { success: true, data };
}

/**
 * Test the WordPress/WooCommerce connection.
 */
export async function testWordPressConnection(tenant) {
  const config = getWcConfig(tenant);
  if (!config) return { success: false, error: 'WordPress not configured' };

  try {
    const res = await wcRequest(config, 'system_status');
    if (res.success) {
      return { success: true, info: { version: res.data?.version, woocommerce_version: res.data?.woocommerce_version } };
    }
    // Fallback: try wp-json root
    const wpRes = await fetch(config.wpApiBase);
    if (wpRes.ok) {
      const wpData = await wpRes.json();
      return { success: true, info: { wordpress_version: wpData?.name || 'WordPress' } };
    }
    return { success: false, error: res.error || 'Connection failed' };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Push all active products to WooCommerce.
 */
export async function pushProductsToWooCommerce(tenant) {
  const config = getWcConfig(tenant);
  if (!config) return { success: false, error: 'WordPress not configured' };

  const tenantId = tenant._id;
  const products = await EcommerceProduct.find({ tenantId, status: 'active' }).lean();
  let pushed = 0;
  let errors = [];

  for (const product of products) {
    const wcProduct = {
      name: product.title,
      type: 'simple',
      regular_price: String(product.basePrice || 0),
      description: product.description || '',
      short_description: product.shortDescription || '',
      status: 'publish',
      sku: product.sku || '',
      manage_stock: !!product.trackInventory,
      stock_quantity: product.stockQuantity || 0,
      images: (product.images || []).map((img, i) => ({ src: img.url, position: i })),
      categories: product.category ? [{ name: product.category }] : [],
      tags: (product.tags || []).map(t => ({ name: t })),
    };

    try {
      // Check if product already exists by SKU
      let existingId = null;
      if (product.sku) {
        const lookup = await wcRequest(config, `products?sku=${encodeURIComponent(product.sku)}`);
        if (lookup.success && Array.isArray(lookup.data) && lookup.data.length > 0) {
          existingId = lookup.data[0].id;
        }
      }

      const res = await wcRequest(config, `products${existingId ? `/${existingId}` : ''}`, existingId ? 'PUT' : 'POST', wcProduct);
      if (res.success) {
        pushed++;
        // Store WC product ID back to our product
        await EcommerceProduct.updateOne({ _id: product._id }, { $set: { 'integration.wordpressProductId': res.data.id } });
      } else {
        errors.push({ product: product.title, error: res.error });
      }
    } catch (err) {
      errors.push({ product: product.title, error: err.message });
    }
  }

  return { success: true, pushed, total: products.length, errors };
}

/**
 * Pull orders from WooCommerce into our system.
 */
export async function pullOrdersFromWooCommerce(tenant) {
  const config = getWcConfig(tenant);
  if (!config) return { success: false, error: 'WordPress not configured' };

  const tenantId = tenant._id;
  let pulled = 0;
  let errors = [];

  try {
    // Get recent orders (last 50)
    const res = await wcRequest(config, 'orders?per_page=50&orderby=date&order=desc');
    if (!res.success) return { success: false, error: res.error };

    for (const wcOrder of res.data || []) {
      // Check if we already imported this order
      const existing = await EcommerceOrder.findOne({ tenantId, 'integration.wordpressOrderId': wcOrder.id });
      if (existing) continue;

      try {
        const order = new EcommerceOrder({
          tenantId,
          orderNumber: `WC-${wcOrder.number || wcOrder.id}`,
          status: mapWcOrderStatus(wcOrder.status),
          customer: {
            name: `${wcOrder.billing?.first_name || ''} ${wcOrder.billing?.last_name || ''}`.trim() || 'Guest',
            email: wcOrder.billing?.email || '',
            phone: wcOrder.billing?.phone || '',
          },
          items: (wcOrder.line_items || []).map(item => ({
            productId: null,
            title: item.name,
            quantity: item.quantity,
            price: parseFloat(item.price || 0),
            total: parseFloat(item.total || 0),
          })),
          subtotal: parseFloat(wcOrder.total || 0),
          total: parseFloat(wcOrder.total || 0),
          currency: wcOrder.currency || 'SAR',
          paymentStatus: wcOrder.payment_method ? (wcOrder.date_paid ? 'paid' : 'pending') : 'pending',
          paymentMethod: wcOrder.payment_method_title || '',
          shippingAddress: {
            name: `${wcOrder.shipping?.first_name || ''} ${wcOrder.shipping?.last_name || ''}`.trim(),
            address1: wcOrder.shipping?.address_1 || '',
            city: wcOrder.shipping?.city || '',
            state: wcOrder.shipping?.state || '',
            postcode: wcOrder.shipping?.postcode || '',
            country: wcOrder.shipping?.country || '',
          },
          integration: {
            wordpressOrderId: wcOrder.id,
            source: 'woocommerce',
          },
        });
        await order.save();
        pulled++;
      } catch (err) {
        errors.push({ order: wcOrder.id, error: err.message });
      }
    }

    return { success: true, pulled, errors };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Run a full sync based on the configured sync direction.
 */
export async function runWordPressSync(tenant) {
  const config = getWcConfig(tenant);
  if (!config) return { success: false, error: 'WordPress not configured' };

  const results = { push: null, pull: null };

  if (config.syncDirection === 'push' || config.syncDirection === 'two-way') {
    results.push = await pushProductsToWooCommerce(tenant);
  }

  if (config.syncDirection === 'pull' || config.syncDirection === 'two-way') {
    results.pull = await pullOrdersFromWooCommerce(tenant);
  }

  return { success: true, results };
}

function mapWcOrderStatus(wcStatus) {
  const map = {
    'pending': 'pending',
    'processing': 'processing',
    'on-hold': 'on-hold',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'failed': 'failed',
  };
  return map[wcStatus] || 'pending';
}
