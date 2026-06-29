import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import Tenant from '../models/Tenant.js';
import { clearTenantHostCache } from '../middleware/resolveTenantByHost.js';

const router = express.Router();

const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'ecommerce' });
    return tenant ? tenant._id : null;
  }
  return null;
};

// Mask a secret value for safe display in the admin UI.
const mask = (val) => {
  if (!val || typeof val !== 'string') return '';
  if (val.length <= 4) return '••••';
  return `••••${val.slice(-4)}`;
};

// Strip/mask provider secrets before returning ecommerce config to the client.
const sanitizeEcommerce = (ecom) => {
  if (!ecom) return ecom;
  const clone = JSON.parse(JSON.stringify(ecom));
  for (const key of ['moyasar', 'tap', 'paytabs', 'stripe']) {
    const p = clone.payments?.[key];
    if (p) {
      p.secretKey = p.secretKey ? mask(p.secretKey) : '';
      p.webhookSecret = p.webhookSecret ? mask(p.webhookSecret) : '';
    }
  }
  for (const key of ['smsa', 'aramex', 'naqel', 'imile']) {
    const c = clone.couriers?.[key];
    if (c) {
      c.apiKey = c.apiKey ? mask(c.apiKey) : '';
      c.apiSecret = c.apiSecret ? mask(c.apiSecret) : '';
    }
  }
  // Mask CAPI tokens
  if (clone.pixels?.snapchatCapi?.token) clone.pixels.snapchatCapi.token = mask(clone.pixels.snapchatCapi.token);
  if (clone.pixels?.tiktokCapi?.accessToken) clone.pixels.tiktokCapi.accessToken = mask(clone.pixels.tiktokCapi.accessToken);
  return clone;
};

// --- STORE SETTINGS ---

router.get('/settings', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId).select('ecommerce slug').lean();
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    res.json({ slug: tenant.slug, ecommerce: sanitizeEcommerce(tenant.ecommerce || {}) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update general store settings, commerce defaults, and SEO (no secrets here).
router.put('/settings', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const allowed = ['storeStatus', 'storeName', 'storeNameAr', 'subdomain', 'currency', 'defaultTaxRate', 'pricesIncludeTax', 'weightUnit', 'seo'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[`ecommerce.${key}`] = req.body[key];
    }

    const tenant = await Tenant.findByIdAndUpdate(tenantId, { $set: update }, { new: true }).select('ecommerce slug');
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    clearTenantHostCache();
    res.json({ slug: tenant.slug, ecommerce: sanitizeEcommerce(tenant.ecommerce) });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- DOMAINS ---

router.get('/domains', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId).select('ecommerce.domains').lean();
    res.json(tenant?.ecommerce?.domains || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/domains', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const hostname = String(req.body.hostname || '').trim().toLowerCase();
    if (!hostname || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(hostname)) {
      return res.status(400).json({ error: 'Invalid domain name' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.domains = tenant.ecommerce.domains || [];

    if (tenant.ecommerce.domains.some(d => d.hostname === hostname)) {
      return res.status(409).json({ error: 'Domain already added' });
    }

    const verificationToken = `maqder-verify-${crypto.randomBytes(12).toString('hex')}`;
    tenant.ecommerce.domains.push({
      hostname,
      type: 'custom',
      status: 'pending',
      verificationToken,
      sslStatus: 'none',
      isPrimary: tenant.ecommerce.domains.length === 0,
    });
    await tenant.save();
    clearTenantHostCache(hostname);
    res.status(201).json(tenant.ecommerce.domains);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify a custom domain by checking its CNAME/TXT record (DNS lookup).
router.post('/domains/:id/verify', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const domain = tenant.ecommerce?.domains?.id(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    // DNS verification via TXT record _maqder-verify.<hostname>
    let verified = false;
    try {
      const dns = await import('dns');
      const resolveTxt = dns.promises.resolveTxt;
      const records = await resolveTxt(`_maqder-verify.${domain.hostname}`).catch(() => []);
      const flat = records.flat().join(' ');
      verified = flat.includes(domain.verificationToken);
    } catch {
      verified = false;
    }

    domain.status = verified ? 'verified' : 'failed';
    if (verified) {
      domain.verifiedAt = new Date();
      domain.sslStatus = 'pending'; // SSL provisioning handled by Cloudflare-for-SaaS job
    }
    await tenant.save();
    clearTenantHostCache(domain.hostname);
    res.json({ verified, domain });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/domains/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const domain = tenant.ecommerce?.domains?.id(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });
    const hostname = domain.hostname;
    domain.deleteOne();
    await tenant.save();
    clearTenantHostCache(hostname);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- PAYMENTS --- (secrets only updated when a non-masked value is sent)
router.put('/payments', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.payments = tenant.ecommerce.payments || {};

    const body = req.body || {};
    if (body.defaultProvider !== undefined) tenant.ecommerce.payments.defaultProvider = body.defaultProvider;
    if (body.codEnabled !== undefined) tenant.ecommerce.payments.codEnabled = body.codEnabled;

    for (const key of ['moyasar', 'tap', 'paytabs', 'stripe']) {
      if (!body[key]) continue;
      const incoming = body[key];
      const current = tenant.ecommerce.payments[key] || {};
      current.enabled = incoming.enabled ?? current.enabled;
      current.environment = incoming.environment ?? current.environment;
      current.publishableKey = incoming.publishableKey ?? current.publishableKey;
      current.merchantId = incoming.merchantId ?? current.merchantId;
      // Only overwrite secrets if a fresh (non-masked) value was provided
      if (incoming.secretKey && !incoming.secretKey.startsWith('••••')) current.secretKey = incoming.secretKey;
      if (incoming.webhookSecret && !incoming.webhookSecret.startsWith('••••')) current.webhookSecret = incoming.webhookSecret;
      tenant.ecommerce.payments[key] = current;
    }

    await tenant.save();
    res.json(sanitizeEcommerce(tenant.ecommerce).payments);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- COURIERS ---
router.put('/couriers', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.couriers = tenant.ecommerce.couriers || {};

    const body = req.body || {};
    if (body.flatRate) tenant.ecommerce.couriers.flatRate = { ...tenant.ecommerce.couriers.flatRate, ...body.flatRate };

    for (const key of ['smsa', 'aramex', 'naqel', 'imile']) {
      if (!body[key]) continue;
      const incoming = body[key];
      const current = tenant.ecommerce.couriers[key] || {};
      current.enabled = incoming.enabled ?? current.enabled;
      current.environment = incoming.environment ?? current.environment;
      current.accountNumber = incoming.accountNumber ?? current.accountNumber;
      if (incoming.apiKey && !incoming.apiKey.startsWith('••••')) current.apiKey = incoming.apiKey;
      if (incoming.apiSecret && !incoming.apiSecret.startsWith('••••')) current.apiSecret = incoming.apiSecret;
      tenant.ecommerce.couriers[key] = current;
    }

    await tenant.save();
    res.json(sanitizeEcommerce(tenant.ecommerce).couriers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- PIXELS (tracking pixel configuration) ---
router.put('/pixels', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.pixels = tenant.ecommerce.pixels || {};

    const body = req.body || {};
    const pixelKeys = ['googleAnalytics', 'facebookPixel', 'tiktokPixel', 'snapchatPixel', 'twitterPixel', 'googleAds', 'snapchatCapi', 'tiktokCapi'];

    for (const key of pixelKeys) {
      if (!body[key]) continue;
      const incoming = body[key];
      const current = tenant.ecommerce.pixels[key] || {};
      current.enabled = incoming.enabled ?? current.enabled;
      if (key === 'googleAnalytics') current.measurementId = incoming.measurementId ?? current.measurementId;
      if (key === 'facebookPixel') current.pixelId = incoming.pixelId ?? current.pixelId;
      if (key === 'tiktokPixel') current.pixelId = incoming.pixelId ?? current.pixelId;
      if (key === 'snapchatPixel') current.pixelId = incoming.pixelId ?? current.pixelId;
      if (key === 'twitterPixel') current.pixelId = incoming.pixelId ?? current.pixelId;
      if (key === 'googleAds') {
        current.conversionId = incoming.conversionId ?? current.conversionId;
        current.conversionLabel = incoming.conversionLabel ?? current.conversionLabel;
      }
      if (key === 'snapchatCapi') {
        current.pixelId = incoming.pixelId ?? current.pixelId;
        if (incoming.token && !incoming.token.startsWith('••••')) current.token = incoming.token;
      }
      if (key === 'tiktokCapi') {
        current.pixelCode = incoming.pixelCode ?? current.pixelCode;
        if (incoming.accessToken && !incoming.accessToken.startsWith('••••')) current.accessToken = incoming.accessToken;
      }
      tenant.ecommerce.pixels[key] = current;
    }

    await tenant.save();
    // Sanitize CAPI tokens before returning
    const pixels = JSON.parse(JSON.stringify(tenant.ecommerce.pixels));
    if (pixels.snapchatCapi?.token) pixels.snapchatCapi.token = mask(pixels.snapchatCapi.token);
    if (pixels.tiktokCapi?.accessToken) pixels.tiktokCapi.accessToken = mask(pixels.tiktokCapi.accessToken);
    res.json(pixels);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
