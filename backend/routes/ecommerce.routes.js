import express from 'express';
import crypto from 'crypto';
import { protect } from '../middleware/auth.js';
import Tenant from '../models/Tenant.js';
import EcommerceProduct from '../models/EcommerceProduct.js';
import { clearTenantHostCache } from '../middleware/resolveTenantByHost.js';
import { provisionCloudflareDomain, verifyDomainViaCloudflare, removeCloudflareDomain, getSSLStatus, isCloudflareConfigured, verifyCloudflareCredentials, listZones } from '../services/cloudflareService.js';
import { testWordPressConnection, runWordPressSync } from '../services/wordpressService.js';

const router = express.Router();

const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'ecommerce' });
    return tenant ? tenant._id : null;
  }
  return null;
};

const getTenantCloudflareConfig = (tenant) => {
  const cf = tenant?.ecommerce?.cloudflare || {};
  if (cf.apiToken && cf.zoneId) {
    return {
      apiToken: cf.apiToken,
      zoneId: cf.zoneId,
      fallbackOrigin: cf.fallbackOrigin || process.env.CLOUDFLARE_FALLBACK_ORIGIN || 'origin.maqder.com',
    };
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
  // Mask Cloudflare API token
  if (clone.cloudflare?.apiToken) clone.cloudflare.apiToken = mask(clone.cloudflare.apiToken);
  // Mask WordPress credentials
  if (clone.wordpress?.consumerKey) clone.wordpress.consumerKey = mask(clone.wordpress.consumerKey);
  if (clone.wordpress?.consumerSecret) clone.wordpress.consumerSecret = mask(clone.wordpress.consumerSecret);
  if (clone.wordpress?.appPassword) clone.wordpress.appPassword = mask(clone.wordpress.appPassword);
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

    const allowed = ['storeStatus', 'storeName', 'storeNameAr', 'subdomain', 'currency', 'defaultTaxRate', 'pricesIncludeTax', 'weightUnit', 'seo', 'lowStockAlertEnabled', 'lowStockAlertEmail', 'lowStockThreshold'];
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

// --- LOW STOCK CHECK ---
router.get('/low-stock', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const tenant = await Tenant.findById(tenantId).select('ecommerce.lowStockThreshold').lean();
    const defaultThreshold = tenant?.ecommerce?.lowStockThreshold || 5;

    const products = await EcommerceProduct.find({
      tenantId,
      status: 'active',
      trackInventory: true,
      $expr: { $lte: [
        { $ifNull: ['$stockQuantity', 0] },
        { $ifNull: ['$lowStockThreshold', defaultThreshold] }
      ]},
    }).select('title sku stockQuantity lowStockThreshold images category').lean();

    res.json({ products, count: products.length, threshold: defaultThreshold });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DOMAINS ---

router.get('/domains', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId).select('ecommerce.domains ecommerce.cloudflare').lean();
    const tenantCf = getTenantCloudflareConfig(tenant);
    res.setHeader('x-cloudflare-configured', (isCloudflareConfigured() || Boolean(tenantCf)) ? 'true' : 'false');
    res.setHeader('x-tenant-cloudflare-connected', tenantCf ? 'true' : 'false');
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
      // Only set as primary if there are no other domains; will be updated after CF provisioning
      isPrimary: tenant.ecommerce.domains.length === 0,
    });
    await tenant.save();
    clearTenantHostCache(hostname);

    // Auto-provision via Cloudflare for SaaS if configured (global or tenant-level)
    const tenantCfConfig = getTenantCloudflareConfig(tenant);
    if (isCloudflareConfigured() || tenantCfConfig) {
      try {
        const cfResult = await provisionCloudflareDomain(hostname, verificationToken, tenantCfConfig || undefined);
        const d = tenant.ecommerce.domains.id(tenant.ecommerce.domains[tenant.ecommerce.domains.length - 1]._id);
        if (d) {
          if (cfResult?.configured && cfResult?.success) {
            d.cfHostnameId = cfResult.cfHostnameId || '';
            d.cfCnameTarget = cfResult.cnameTarget || '';
            d.cfTxtName = cfResult.txtName || '';
            d.cfTxtValue = cfResult.txtValue || '';
            d.sslStatus = cfResult.sslStatus || 'pending';
            d.cfStatus = cfResult.cfStatus || 'pending';
            d.cfErrorMessage = '';
          } else if (cfResult?.configured) {
            // CF is configured but provisioning failed — store error and mark domain as failed
            d.cfErrorMessage = cfResult.errors?.[0] || 'Cloudflare provisioning failed';
            d.status = 'failed';
            d.isPrimary = false; // don't route traffic to a failed domain
          }
          await tenant.save();
        }
      } catch (err) {
        // Cloudflare provisioning failed — user can still verify manually
        const d = tenant.ecommerce.domains.id(tenant.ecommerce.domains[tenant.ecommerce.domains.length - 1]._id);
        if (d) {
          d.cfErrorMessage = err.message || 'Cloudflare provisioning failed';
          d.status = 'failed';
          d.isPrimary = false;
          await tenant.save();
        }
      }
    }

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

    // Try Cloudflare verification first, fall back to DNS lookup
    let verified = false;
    let sslStatus = 'none';

    const tenantCfConfig = getTenantCloudflareConfig(tenant);
    if (isCloudflareConfigured() || tenantCfConfig) {
      try {
        const cfResult = await verifyDomainViaCloudflare(domain.hostname, domain.verificationToken, domain.cfHostnameId, tenantCfConfig || undefined);
        if (cfResult.configured) {
          verified = cfResult.verified;
          domain.cfStatus = cfResult.cfStatus || domain.cfStatus;
          if (cfResult.cfHostnameId) domain.cfHostnameId = cfResult.cfHostnameId;
          if (verified) {
            const sslResult = await getSSLStatus(domain.hostname, domain.cfHostnameId, tenantCfConfig || undefined);
            sslStatus = sslResult.status || 'pending';
          }
        }
      } catch (err) {
        // Fall through to DNS lookup
      }
    }

    // Fallback: DNS verification via TXT record _maqder-verify.<hostname>
    if (!verified) {
      try {
        const dns = await import('dns');
        const resolveTxt = dns.promises.resolveTxt;
        const records = await resolveTxt(`_maqder-verify.${domain.hostname}`).catch(() => []);
        const flat = records.flat().join(' ');
        verified = flat.includes(domain.verificationToken);
      } catch {
        verified = false;
      }
    }

    domain.status = verified ? 'verified' : 'failed';
    if (verified) {
      domain.verifiedAt = new Date();
      domain.sslStatus = sslStatus !== 'none' ? sslStatus : 'pending';
      domain.cfErrorMessage = '';
    }
    await tenant.save();
    clearTenantHostCache(domain.hostname);
    res.json({ verified, domain });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Retry Cloudflare for SaaS provisioning for a failed domain
router.post('/domains/:id/retry-cloudflare', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const tenantCfConfig = getTenantCloudflareConfig(tenant);
    if (!isCloudflareConfigured() && !tenantCfConfig) return res.status(400).json({ error: 'Cloudflare not configured' });

    const domain = tenant.ecommerce?.domains?.id(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });

    // Clean up any existing CF custom hostname first
    if (domain.cfHostnameId) {
      try {
        await removeCloudflareDomain(domain.hostname, domain.cfHostnameId, tenantCfConfig || undefined);
      } catch {
        // ignore
      }
    }

    // Re-provision
    const cfResult = await provisionCloudflareDomain(domain.hostname, domain.verificationToken, tenantCfConfig || undefined);
    if (cfResult?.configured && cfResult?.success) {
      domain.cfHostnameId = cfResult.cfHostnameId || '';
      domain.cfCnameTarget = cfResult.cnameTarget || '';
      domain.cfTxtName = cfResult.txtName || '';
      domain.cfTxtValue = cfResult.txtValue || '';
      domain.sslStatus = cfResult.sslStatus || 'pending';
      domain.cfStatus = cfResult.cfStatus || 'pending';
      domain.cfErrorMessage = '';
      domain.status = 'pending';
      await tenant.save();
      clearTenantHostCache(domain.hostname);
      return res.json({ success: true, domain, message: 'Cloudflare provisioning retried' });
    }

    domain.cfErrorMessage = cfResult.errors?.[0] || 'Cloudflare retry failed';
    domain.status = 'failed';
    await tenant.save();
    res.status(400).json({ error: domain.cfErrorMessage, domain });
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

    // Clean up Cloudflare for SaaS custom hostname if configured
    const tenantCfConfig = getTenantCloudflareConfig(tenant);
    if (isCloudflareConfigured() || tenantCfConfig) {
      try {
        await removeCloudflareDomain(hostname, domain.cfHostnameId, tenantCfConfig || undefined);
      } catch {
        // Non-critical — domain already removed from tenant
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Connect tenant Cloudflare account — accepts just an API token, auto-detects zone
router.put('/domains/cloudflare', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { apiToken, zoneId, fallbackOrigin } = req.body || {};
    if (!apiToken) return res.status(400).json({ error: 'Cloudflare API token is required' });

    // Verify token works
    const verify = await verifyCloudflareCredentials({ apiToken, zoneId: zoneId || 'placeholder' });
    if (!verify.valid) return res.status(400).json({ error: verify.error || 'Invalid Cloudflare token' });

    // List zones accessible by this token
    const zonesRes = await listZones({ apiToken });
    if (!zonesRes.success || zonesRes.zones.length === 0) {
      return res.status(400).json({ error: 'No zones found for this token. Ensure the token has Zone:Read permission.' });
    }

    // If multiple zones and no zoneId specified, return the list for the user to pick
    let resolvedZoneId = zoneId;
    if (!resolvedZoneId) {
      if (zonesRes.zones.length === 1) {
        resolvedZoneId = zonesRes.zones[0].id;
      } else {
        return res.json({ success: false, needsZoneSelection: true, zones: zonesRes.zones });
      }
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.cloudflare = {
      apiToken,
      zoneId: resolvedZoneId,
      fallbackOrigin: fallbackOrigin || process.env.CLOUDFLARE_FALLBACK_ORIGIN || 'origin.maqder.com',
      connectedAt: new Date(),
    };
    await tenant.save();

    res.json({ success: true, cloudflare: sanitizeEcommerce(tenant.ecommerce).cloudflare });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disconnect tenant Cloudflare account
router.delete('/domains/cloudflare', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.cloudflare = { apiToken: '', zoneId: '', fallbackOrigin: '', connectedAt: null };
    await tenant.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Set a domain as primary
router.put('/domains/:id/primary', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const domain = tenant.ecommerce?.domains?.id(req.params.id);
    if (!domain) return res.status(404).json({ error: 'Domain not found' });
    if (domain.status !== 'verified') return res.status(400).json({ error: 'Domain must be verified first' });
    tenant.ecommerce.domains.forEach(d => { d.isPrimary = (d._id.toString() === req.params.id); });
    await tenant.save();
    clearTenantHostCache();
    res.json(tenant.ecommerce.domains);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Refresh SSL status for all domains
router.post('/domains/refresh-ssl', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const domains = tenant.ecommerce?.domains || [];
    const tenantCfConfig = getTenantCloudflareConfig(tenant);
    for (const domain of domains) {
      if (domain.status === 'verified' && (isCloudflareConfigured() || tenantCfConfig)) {
        try {
          const sslResult = await getSSLStatus(domain.hostname, domain.cfHostnameId, tenantCfConfig || undefined);
          domain.sslStatus = sslResult.status || domain.sslStatus;
        } catch {
          // keep existing status
        }
      }
    }
    await tenant.save();
    res.json(tenant.ecommerce.domains);
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

// ── WordPress / WooCommerce Integration ──

// Get WordPress settings
router.get('/wordpress', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const wp = tenant.ecommerce?.wordpress || {};
    res.json({
      enabled: wp.enabled || false,
      siteUrl: wp.siteUrl || '',
      syncDirection: wp.syncDirection || 'push',
      lastSyncAt: wp.lastSyncAt || null,
      lastSyncStatus: wp.lastSyncStatus || '',
      lastSyncError: wp.lastSyncError || '',
      autoSync: wp.autoSync || false,
      hasCredentials: !!(wp.consumerKey || wp.appPassword),
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save WordPress settings and credentials
router.put('/wordpress', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    const existing = tenant.ecommerce.wordpress || {};
    const body = req.body || {};

    tenant.ecommerce.wordpress = {
      enabled: body.enabled ?? existing.enabled ?? false,
      siteUrl: (body.siteUrl ?? existing.siteUrl) || '',
      consumerKey: (body.consumerKey ?? existing.consumerKey) || '',
      consumerSecret: (body.consumerSecret ?? existing.consumerSecret) || '',
      username: (body.username ?? existing.username) || '',
      appPassword: (body.appPassword ?? existing.appPassword) || '',
      syncDirection: body.syncDirection || existing.syncDirection || 'push',
      autoSync: body.autoSync ?? existing.autoSync ?? false,
      lastSyncAt: existing.lastSyncAt || null,
      lastSyncStatus: existing.lastSyncStatus || '',
      lastSyncError: existing.lastSyncError || '',
    };
    await tenant.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Test WordPress connection
router.post('/wordpress/test', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    const result = await testWordPressConnection(tenant);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Run WordPress sync
router.post('/wordpress/sync', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const result = await runWordPressSync(tenant);

    // Update sync status
    const hasErrors = (result.results?.push?.errors?.length > 0) || (result.results?.pull?.errors?.length > 0);
    tenant.ecommerce.wordpress.lastSyncAt = new Date();
    tenant.ecommerce.wordpress.lastSyncStatus = hasErrors ? 'partial' : 'success';
    tenant.ecommerce.wordpress.lastSyncError = hasErrors ? 'Some items had errors' : '';
    await tenant.save();

    res.json(result);
  } catch (error) {
    // Mark sync as failed
    try {
      const tenantId = await getTargetTenantId(req.user);
      const tenant = await Tenant.findById(tenantId);
      if (tenant) {
        tenant.ecommerce.wordpress.lastSyncAt = new Date();
        tenant.ecommerce.wordpress.lastSyncStatus = 'failed';
        tenant.ecommerce.wordpress.lastSyncError = error.message;
        await tenant.save();
      }
    } catch {}
    res.status(400).json({ error: error.message });
  }
});

export default router;
