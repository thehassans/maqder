/**
 * Payment provider adapters for the ecommerce platform.
 * Each adapter implements:
 *   - createCheckoutSession({ amount, currency, orderId, orderNumber, customer, successUrl, cancelUrl, metadata })
 *   - verifyWebhook({ headers, rawBody })
 *   - getPaymentStatus(paymentId)
 *   - refund(paymentId, amount)
 */
import crypto from 'crypto';

// --- Moyasar ---
const moyasarAdapter = {
  async createCheckoutSession({ amount, currency, orderId, orderNumber, customer, successUrl, cancelUrl, config }) {
    const baseUrl = config.environment === 'production' ? 'https://api.moyasar.com/v1' : 'https://api.moyasar.com/v1';
    const body = {
      amount: Math.round(amount * 100), // Moyasar expects halalas (cents)
      currency: currency.toUpperCase(),
      description: `Order ${orderNumber}`,
      callback_url: successUrl,
      source: { type: 'creditcard', name: customer.name, message: `Payment for ${orderNumber}` },
      metadata: { orderId, orderNumber },
    };
    const res = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(config.secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Moyasar error: ${res.status}`);
    const data = await res.json();
    return {
      providerPaymentId: data.id,
      checkoutUrl: data.source?.transaction_url || null,
      status: data.status === 'paid' ? 'paid' : 'pending',
      raw: data,
    };
  },

  verifyWebhook({ headers, rawBody, config }) {
    // Moyasar sends a webhook token in headers
    const token = headers['moyasar-webhook-token'];
    if (!token || !config.secretKey) return false;
    return token === config.webhookSecret;
  },

  async getPaymentStatus(paymentId, config) {
    const baseUrl = 'https://api.moyasar.com/v1';
    const res = await fetch(`${baseUrl}/payments/${paymentId}`, {
      headers: { 'Authorization': `Basic ${Buffer.from(config.secretKey + ':').toString('base64')}` },
    });
    if (!res.ok) throw new Error(`Moyasar error: ${res.status}`);
    const data = await res.json();
    return { status: data.status === 'paid' ? 'paid' : data.status, raw: data };
  },

  async refund(paymentId, amount, config) {
    const res = await fetch(`https://api.moyasar.com/v1/payments/${paymentId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(config.secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({ amount: Math.round(amount * 100) }),
    });
    if (!res.ok) throw new Error(`Moyasar refund error: ${res.status}`);
    const data = await res.json();
    return { status: data.status, raw: data };
  },
};

// --- Tap Payments ---
const tapAdapter = {
  async createCheckoutSession({ amount, currency, orderId, orderNumber, customer, successUrl, cancelUrl, config }) {
    const baseUrl = config.environment === 'production' ? 'https://api.tap.company/v2' : 'https://api.tap.company/v2';
    const body = {
      amount: amount.toString(),
      currency: currency.toUpperCase(),
      customer: {
        first_name: customer.name,
        email: customer.email || '',
        phone: { country_code: '966', number: customer.phone || '' },
      },
      source: { id: 'src_all' },
      redirect: { url: successUrl },
      post: { url: config.webhookUrl || '' },
      metadata: { orderId, orderNumber },
    };
    const res = await fetch(`${baseUrl}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.secretKey}`,
        'lang_code': 'en',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Tap error: ${res.status}`);
    const data = await res.json();
    return {
      providerPaymentId: data.id,
      checkoutUrl: data.transaction?.url || null,
      status: data.status === 'CAPTURED' ? 'paid' : 'pending',
      raw: data,
    };
  },

  verifyWebhook({ headers, rawBody, config }) {
    // Tap uses x-callback signature
    const signature = headers['x-callback'];
    if (!signature || !config.secretKey) return false;
    return signature === config.webhookSecret;
  },

  async getPaymentStatus(chargeId, config) {
    const res = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
      headers: { 'Authorization': `Bearer ${config.secretKey}` },
    });
    if (!res.ok) throw new Error(`Tap error: ${res.status}`);
    const data = await res.json();
    return { status: data.status === 'CAPTURED' ? 'paid' : data.status, raw: data };
  },

  async refund(chargeId, amount, config) {
    const res = await fetch(`https://api.tap.company/v2/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.secretKey}`,
      },
      body: JSON.stringify({ charge_id: chargeId, amount: amount.toString(), currency: 'SAR' }),
    });
    if (!res.ok) throw new Error(`Tap refund error: ${res.status}`);
    const data = await res.json();
    return { status: data.status, raw: data };
  },
};

// --- PayTabs ---
const paytabsAdapter = {
  async createCheckoutSession({ amount, currency, orderId, orderNumber, customer, successUrl, cancelUrl, config }) {
    const baseUrl = config.environment === 'production'
      ? 'https://secure.paytabs.com/payment/request'
      : 'https://secure.paytabs.sa/payment/request';
    const body = {
      profile_id: config.merchantId,
      tran_type: 'sale',
      tran_class: 'ecom',
      cart_id: orderNumber,
      cart_description: `Order ${orderNumber}`,
      cart_currency: currency.toUpperCase(),
      cart_amount: amount.toString(),
      customer_details: {
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
      },
      callback: successUrl,
      return: successUrl,
    };
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.secretKey,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PayTabs error: ${res.status}`);
    const data = await res.json();
    return {
      providerPaymentId: data.tran_ref,
      checkoutUrl: data.redirect_url || null,
      status: 'pending',
      raw: data,
    };
  },

  verifyWebhook({ headers, rawBody, config }) {
    // PayTabs sends a server-to-server callback with a hash signature
    const hash = headers['hash'];
    if (!hash || !config.secretKey) return false;
    return hash === config.webhookSecret;
  },

  async getPaymentStatus(tranRef, config) {
    const baseUrl = 'https://secure.paytabs.com/payment/query';
    const res = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.secretKey,
      },
      body: JSON.stringify({ profile_id: config.merchantId, tran_ref: tranRef }),
    });
    if (!res.ok) throw new Error(`PayTabs error: ${res.status}`);
    const data = await res.json();
    return { status: data.payment_result?.response_status === 'A' ? 'paid' : 'pending', raw: data };
  },

  async refund(tranRef, amount, config) {
    const res = await fetch('https://secure.paytabs.com/payment/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': config.secretKey,
      },
      body: JSON.stringify({
        profile_id: config.merchantId,
        tran_type: 'refund',
        tran_class: 'ecom',
        tran_ref: tranRef,
        cart_amount: amount.toString(),
        cart_currency: 'SAR',
      }),
    });
    if (!res.ok) throw new Error(`PayTabs refund error: ${res.status}`);
    const data = await res.json();
    return { status: data.payment_result?.response_status, raw: data };
  },
};

// --- Stripe ---
const stripeAdapter = {
  async createCheckoutSession({ amount, currency, orderId, orderNumber, customer, successUrl, cancelUrl, config }) {
    const baseUrl = 'https://api.stripe.com/v1';
    const body = new URLSearchParams({
      'mode': 'payment',
      'success_url': successUrl,
      'cancel_url': cancelUrl,
      'client_reference_id': orderId,
      'line_items[0][price_data][currency]': currency.toLowerCase(),
      'line_items[0][price_data][product_data][name]': `Order ${orderNumber}`,
      'line_items[0][price_data][unit_amount]': String(Math.round(amount * 100)),
      'line_items[0][quantity]': '1',
      'customer_email': customer.email || '',
    });
    const res = await fetch(`${baseUrl}/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) throw new Error(`Stripe error: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return {
      providerPaymentId: data.id,
      checkoutUrl: data.url,
      status: data.payment_status === 'paid' ? 'paid' : 'pending',
      raw: data,
    };
  },

  verifyWebhook({ headers, rawBody, config }) {
    // Stripe sends a stripe-signature header: t=timestamp,v1=signature
    const sig = headers['stripe-signature'];
    if (!sig || !config.webhookSecret) return false;

    // Parse the signature header
    const parts = sig.split(',');
    const timestampPart = parts.find(p => p.startsWith('t='));
    const signaturePart = parts.find(p => p.startsWith('v1='));
    if (!timestampPart || !signaturePart) return false;

    const timestamp = timestampPart.split('=')[1];
    const signature = signaturePart.split('=')[1];

    // Prevent replay attacks — reject if older than 5 minutes
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
    if (age > 300) return false;

    // Compute expected signature: HMAC-SHA256(timestamp + '.' + rawBody, webhookSecret)
    const payload = `${timestamp}.${rawBody}`;
    const expected = crypto.createHmac('sha256', config.webhookSecret).update(payload).digest('hex');

    // Use timing-safe comparison
    try {
      const a = Buffer.from(signature, 'hex');
      const b = Buffer.from(expected, 'hex');
      if (a.length !== b.length) return false;
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  },

  async getPaymentStatus(sessionId, config) {
    const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { 'Authorization': `Bearer ${config.secretKey}` },
    });
    if (!res.ok) throw new Error(`Stripe error: ${res.status}`);
    const data = await res.json();
    return { status: data.payment_status === 'paid' ? 'paid' : data.payment_status, raw: data };
  },

  async refund(paymentIntentId, amount, config) {
    const body = new URLSearchParams({
      'payment_intent': paymentIntentId,
      'amount': String(Math.round(amount * 100)),
    });
    const res = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    if (!res.ok) throw new Error(`Stripe refund error: ${res.status}`);
    const data = await res.json();
    return { status: data.status, raw: data };
  },
};

export const paymentAdapters = {
  moyasar: moyasarAdapter,
  tap: tapAdapter,
  paytabs: paytabsAdapter,
  stripe: stripeAdapter,
};

export function getPaymentAdapter(provider) {
  return paymentAdapters[provider] || null;
}

/**
 * Create a checkout session with the tenant's configured payment provider.
 * @param {string} provider - 'moyasar' | 'tap' | 'paytabs' | 'stripe'
 * @param {object} params - Checkout parameters
 * @param {object} config - Provider config from tenant.ecommerce.payments[provider]
 */
export async function createCheckoutSession(provider, params, config) {
  const adapter = getPaymentAdapter(provider);
  if (!adapter) throw new Error(`Unknown payment provider: ${provider}`);
  if (!config?.enabled) throw new Error(`${provider} is not enabled`);
  if (!config?.secretKey) throw new Error(`${provider} secret key not configured`);
  return adapter.createCheckoutSession({ ...params, config });
}

/**
 * Verify a webhook from a payment provider.
 */
export function verifyPaymentWebhook(provider, { headers, rawBody, config }) {
  const adapter = getPaymentAdapter(provider);
  if (!adapter) return false;
  return adapter.verifyWebhook({ headers, rawBody, config });
}

/**
 * Query payment status from provider.
 */
export async function getPaymentStatus(provider, paymentId, config) {
  const adapter = getPaymentAdapter(provider);
  if (!adapter) throw new Error(`Unknown payment provider: ${provider}`);
  return adapter.getPaymentStatus(paymentId, config);
}

/**
 * Refund a payment.
 */
export async function refundPayment(provider, paymentId, amount, config) {
  const adapter = getPaymentAdapter(provider);
  if (!adapter) throw new Error(`Unknown payment provider: ${provider}`);
  return adapter.refund(paymentId, amount, config);
}
