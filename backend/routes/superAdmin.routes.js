import express from 'express';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import nodemailer from 'nodemailer';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Invoice from '../models/Invoice.js';
import Employee from '../models/Employee.js';
import SystemSettings from '../models/SystemSettings.js';
import { protect, authorize } from '../middleware/auth.js';
import { getPrimaryBusinessType, normalizeBusinessTypes } from '../utils/businessTypes.js';
import { sendTenantWelcomeEmail } from '../utils/emailService.js';

const router = express.Router();
const parsedDatabaseQueryTimeoutMs = Number(process.env.MONGODB_QUERY_TIMEOUT_MS || 10000);
const databaseQueryTimeoutMs = Number.isFinite(parsedDatabaseQueryTimeoutMs) && parsedDatabaseQueryTimeoutMs > 0 ? parsedDatabaseQueryTimeoutMs : 10000;

const withQueryTimeout = (query) => query.maxTimeMS(databaseQueryTimeoutMs);

const isDatabaseAvailabilityError = (error) => {
  const message = String(error?.message || '').toLowerCase();

  return message.includes('buffering timed out')
    || message.includes('timed out after')
    || message.includes('server selection')
    || message.includes('ecconnrefused')
    || message.includes('not connected')
    || message.includes('initial connection')
    || message.includes('topology is closed')
    || message.includes('client must be connected');
};

const sendRouteError = (res, error) => {
  if (isDatabaseAvailabilityError(error)) {
    return res.status(503).json({ error: 'Service temporarily unavailable. Please try again in a moment.' });
  }

  return res.status(500).json({ error: error.message });
};

router.use(protect);
router.use(authorize('super_admin'));

const getGlobalSettings = async () => {
  const existing = await SystemSettings.findOne({ key: 'global' });
  if (existing) {
    if (!existing.website) {
      existing.website = {};
      existing.markModified('website');
      await existing.save();
    }
    return existing;
  }
  return SystemSettings.create({ key: 'global', website: {} });
};

const maskApiKey = (key) => {
  if (!key) return '';
  const k = String(key);
  if (k.length <= 8) return `${k.slice(0, 2)}***${k.slice(-2)}`;
  return `${k.slice(0, 4)}***${k.slice(-4)}`;
};

const maskSecret = (value) => {
  if (!value) return '';
  const v = String(value);
  if (v.length <= 4) return '****';
  return `${v.slice(0, 2)}***${v.slice(-2)}`;
};

const getDefaultPricingPlans = () => [
  {
    id: 'starter',
    nameEn: 'Starter',
    nameAr: 'البداية',
    priceMonthly: 299,
    priceYearly: 2990,
    popular: false,
    featuresEn: ['ZATCA E-Invoicing', 'Up to 500 invoices/month', 'Inventory & Warehouses', 'Basic Reports', 'Up to 5 users', 'Email Support'],
    featuresAr: ['الفوترة الإلكترونية', 'حتى 500 فاتورة/شهر', 'المخزون والمستودعات', 'تقارير أساسية', 'حتى 5 مستخدمين', 'دعم بالبريد']
  },
  {
    id: 'professional',
    nameEn: 'Professional',
    nameAr: 'الاحترافية',
    priceMonthly: 699,
    priceYearly: 6990,
    popular: true,
    featuresEn: ['Everything in Starter', 'Unlimited Invoices', 'HR & Payroll (GOSI/WPS)', 'Expenses & Finance', 'Projects & Tasks', 'Advanced Reports', 'Up to 25 users', 'Priority Support'],
    featuresAr: ['كل ما في البداية', 'فواتير غير محدودة', 'الموارد البشرية والرواتب', 'المصروفات والمالية', 'المشاريع والمهام', 'تقارير متقدمة', 'حتى 25 مستخدم', 'دعم ذو أولوية']
  },
  {
    id: 'enterprise',
    nameEn: 'Enterprise',
    nameAr: 'المؤسسات',
    priceMonthly: 0,
    priceYearly: 0,
    popular: false,
    featuresEn: ['Everything in Professional', 'Unlimited users', 'Dedicated Account Manager', 'Custom Integrations', 'On-premise Option', '24/7 Phone Support', 'SLA Guarantee'],
    featuresAr: ['كل ما في الاحترافية', 'مستخدمون غير محدودين', 'مدير حساب مخصص', 'تكاملات مخصصة', 'خيار الخادم الخاص', 'دعم هاتفي 24/7', 'ضمان SLA']
  }
];

const mergeWebsiteDefaults = (website) => {
  const defaultsDoc = new SystemSettings({ key: 'global' });
  const defaults = defaultsDoc.website?.toObject?.() || defaultsDoc.website || {};
  const current = website?.toObject?.() || website || {};
  const currentPlans = current.pricing?.plans;
  const hasPlans = Array.isArray(currentPlans) && currentPlans.length > 0;
  return {
    ...defaults,
    ...current,
    hero: { ...(defaults.hero || {}), ...(current.hero || {}) },
    cta: { ...(defaults.cta || {}), ...(current.cta || {}) },
    demo: { ...(defaults.demo || {}), ...(current.demo || {}) },
    pricing: {
      ...(defaults.pricing || {}),
      ...(current.pricing || {}),
      plans: hasPlans ? currentPlans : getDefaultPricingPlans()
    }
  };
};

const mergeEmailDefaults = (email) => {
  const defaultsDoc = new SystemSettings({ key: 'global', website: {}, email: {} });
  const defaults = defaultsDoc.email?.toObject?.() || defaultsDoc.email || {};
  const current = email?.toObject?.() || email || {};
  return {
    ...defaults,
    ...current,
    templates: {
      ...(defaults.templates || {}),
      ...(current.templates || {}),
      tenantCreated: {
        ...(defaults.templates?.tenantCreated || {}),
        ...(current.templates?.tenantCreated || {})
      },
      invoice: {
        ...(defaults.templates?.invoice || {}),
        ...(current.templates?.invoice || {})
      }
    }
  };
};

const serializeEmailSettings = (email) => ({
  ...email,
  smtpPass: '',
  hasSmtpPass: !!email?.smtpPass,
  smtpPassMasked: maskSecret(email?.smtpPass)
});

const mergeGlobalEmailPayload = ({ settings, payload = {} }) => {
  const currentEmail = mergeEmailDefaults(settings?.email);

  const nextEmail = {
    ...currentEmail,
    ...payload,
    templates: {
      ...(currentEmail.templates || {}),
      ...(payload.templates || {}),
      tenantCreated: {
        ...(currentEmail.templates?.tenantCreated || {}),
        ...(payload.templates?.tenantCreated || {})
      },
      invoice: {
        ...(currentEmail.templates?.invoice || {}),
        ...(payload.templates?.invoice || {})
      }
    }
  };

  if (payload.smtpPass !== undefined) {
    const trimmedPassword = String(payload.smtpPass || '').trim();
    nextEmail.smtpPass = trimmedPassword || currentEmail.smtpPass || '';
  }

  return nextEmail;
};

const resolveGlobalEmailTransportConfig = ({ settings, payload = {} }) => {
  const nextEmail = mergeGlobalEmailPayload({ settings, payload });
  const website = settings?.website?.toObject?.() || settings?.website || {};
  const smtpPort = Number(nextEmail.smtpPort || 587);

  return {
    email: nextEmail,
    config: {
      enabled: nextEmail.enabled === true,
      host: String(nextEmail.smtpHost || '').trim(),
      port: Number.isFinite(smtpPort) ? smtpPort : 587,
      secure: nextEmail.smtpSecure === true,
      user: String(nextEmail.smtpUser || '').trim(),
      pass: String(nextEmail.smtpPass || '').trim(),
      fromName: String(nextEmail.fromName || website.brandName || 'Maqder ERP').trim(),
      fromEmail: String(nextEmail.fromEmail || nextEmail.smtpUser || '').trim(),
      replyTo: String(nextEmail.replyTo || website.contactEmail || '').trim(),
      brandName: String(website.brandName || 'Maqder ERP').trim(),
    }
  };
};

const ensureGlobalEmailConfigReady = (config, { requireEnabled = false } = {}) => {
  if (requireEnabled && !config?.enabled) {
    throw new Error('Email delivery is disabled');
  }

  if (!config?.host || !config?.user || !config?.pass || !config?.fromEmail) {
    throw new Error('Email SMTP settings are incomplete');
  }
};

const resolveSmtpTransportOptions = (config) => {
  const port = Number(config?.port || 587);
  const normalizedPort = Number.isFinite(port) ? port : 587;
  const useImplicitSsl = normalizedPort === 465;

  return {
    host: config.host,
    port: normalizedPort,
    secure: useImplicitSsl,
    requireTLS: !useImplicitSsl && (config?.secure === true || normalizedPort === 587),
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };
};

const serializeTenantForSuperAdmin = (tenant) => {
  const serializedTenant = tenant?.toObject?.() || tenant;
  const currentSettings = serializedTenant?.settings || {};
  const currentCommunication = currentSettings.communication || {};
  const currentEmail = currentCommunication.email || {};

  return {
    ...serializedTenant,
    settings: {
      ...currentSettings,
      communication: {
        ...currentCommunication,
        email: serializeEmailSettings(currentEmail)
      }
    }
  };
};

const mergeTenantEmailSettings = ({ existingTenant, incomingSettings }) => {
  const currentSettings = existingTenant?.settings?.toObject?.() || existingTenant?.settings || {};
  if (!incomingSettings) {
    return currentSettings;
  }

  const currentCommunication = currentSettings.communication || {};
  const currentEmail = currentCommunication.email || {};
  const incomingCommunication = incomingSettings.communication || {};
  const hasIncomingEmail = Object.prototype.hasOwnProperty.call(incomingCommunication, 'email');
  const incomingEmail = hasIncomingEmail ? (incomingCommunication.email || {}) : null;

  let nextEmail = currentEmail;
  if (hasIncomingEmail) {
    nextEmail = {
      ...currentEmail,
      ...incomingEmail,
      enabled: incomingEmail?.enabled !== undefined ? incomingEmail.enabled === true : currentEmail.enabled,
      autoSendInvoices: incomingEmail?.autoSendInvoices !== undefined ? incomingEmail.autoSendInvoices === true : currentEmail.autoSendInvoices,
      smtpSecure: incomingEmail?.smtpSecure !== undefined ? incomingEmail.smtpSecure === true : currentEmail.smtpSecure,
      smtpPort: incomingEmail?.smtpPort !== undefined ? Number(incomingEmail.smtpPort || 587) : currentEmail.smtpPort,
    };

    if (incomingEmail && Object.prototype.hasOwnProperty.call(incomingEmail, 'smtpPass')) {
      const trimmedPassword = String(incomingEmail.smtpPass || '').trim();
      nextEmail.smtpPass = trimmedPassword || currentEmail.smtpPass || '';
    }

    delete nextEmail.hasSmtpPass;
    delete nextEmail.smtpPassMasked;
    nextEmail.inboundAddress = String(nextEmail.inboundAddress || `${existingTenant.slug}@inbound.maqder.local`).trim().toLowerCase();
  }

  const nextCommunication = {
    ...currentCommunication,
    ...incomingCommunication,
    ...(hasIncomingEmail ? { email: nextEmail } : {}),
  };

  return {
    ...currentSettings,
    ...incomingSettings,
    communication: nextCommunication,
    invoiceBranding: {
      ...(currentSettings.invoiceBranding || {}),
      ...(incomingSettings.invoiceBranding || {})
    }
  };
};

// @route   GET /api/super-admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await Promise.all([
      Tenant.countDocuments({ isActive: true }),
      Tenant.countDocuments({ 'subscription.status': 'active' }),
      User.countDocuments({ isActive: true }),
      Invoice.aggregate([
        { $group: { _id: null, total: { $sum: '$grandTotal' }, count: { $sum: 1 } } }
      ])
    ]);
    
    const recentTenants = await Tenant.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name slug business.legalNameEn subscription createdAt');
    
    const subscriptionStats = await Tenant.aggregate([
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);
    
    const monthlyRevenue = await Tenant.aggregate([
      { $match: { 'subscription.status': 'active' } },
      { $group: { _id: '$subscription.plan', total: { $sum: '$subscription.price' }, count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalTenants: stats[0],
      activeSubscriptions: stats[1],
      totalUsers: stats[2],
      invoiceStats: stats[3][0] || { total: 0, count: 0 },
      recentTenants,
      subscriptionStats,
      monthlyRevenue
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings/website', async (req, res) => {
  try {
    const settings = await getGlobalSettings();
    const website = mergeWebsiteDefaults(settings.website);
    res.json({
      website: {
        ...website,
        demo: {
          ...(website.demo?.toObject?.() || website.demo || {}),
          password: '',
          hasPassword: !!website?.demo?.password,
          passwordMasked: maskSecret(website?.demo?.password)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/website', async (req, res) => {
  try {
    const payload = req.body?.website || req.body || {};
    const settings = await getGlobalSettings();
    const currentWebsite = mergeWebsiteDefaults(settings.website);

    const nextWebsite = {
      ...currentWebsite,
      ...payload,
      hero: {
        ...(currentWebsite.hero || {}),
        ...(payload.hero || {})
      },
      cta: {
        ...(currentWebsite.cta || {}),
        ...(payload.cta || {})
      },
      pricing: {
        ...(currentWebsite.pricing || {}),
        ...(payload.pricing || {})
      },
      demo: {
        ...(currentWebsite.demo || {}),
        ...(payload.demo || {})
      }
    };

    const nextDemo = { ...(nextWebsite.demo || {}) };
    if (payload?.demo && Object.prototype.hasOwnProperty.call(payload.demo, 'password')) {
      const trimmed = String(payload.demo.password || '').trim();
      if (trimmed) {
        nextDemo.password = trimmed;
      } else {
        nextDemo.password = currentWebsite?.demo?.password;
      }
    }
    nextWebsite.demo = nextDemo;

    settings.website = nextWebsite;
    settings.markModified('website');
    await settings.save();

    const website = mergeWebsiteDefaults(settings.website);
    res.json({
      website: {
        ...website,
        demo: {
          ...(website.demo?.toObject?.() || website.demo || {}),
          password: '',
          hasPassword: !!website?.demo?.password,
          passwordMasked: maskSecret(website?.demo?.password)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/settings/email', async (req, res) => {
  try {
    const settings = await getGlobalSettings();
    const email = mergeEmailDefaults(settings.email);
    res.json({ email: serializeEmailSettings(email) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/email', async (req, res) => {
  try {
    const payload = req.body?.email || req.body || {};
    const settings = await getGlobalSettings();
    const { email: nextEmail } = resolveGlobalEmailTransportConfig({ settings, payload });

    settings.email = nextEmail;
    settings.markModified('email');
    await settings.save();

    res.json({ email: serializeEmailSettings(mergeEmailDefaults(settings.email)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/email/test-connection', async (req, res) => {
  try {
    const payload = req.body?.email || req.body || {};
    const settings = await getGlobalSettings();
    const { config } = resolveGlobalEmailTransportConfig({ settings, payload });

    ensureGlobalEmailConfigReady(config);

    const transporter = nodemailer.createTransport(resolveSmtpTransportOptions(config));

    await transporter.verify();

    res.json({
      connected: true,
      message: 'SMTP connection verified successfully',
      host: config.host,
      port: config.port,
      secure: config.secure,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || 'Failed to verify SMTP connection' });
  }
});

router.get('/settings/gemini', async (req, res) => {
  try {
    const settings = await getGlobalSettings();
    const hasApiKey = !!settings.gemini?.apiKey;
    res.json({
      enabled: hasApiKey,
      model: settings.gemini?.model || 'gemini-3-flash-preview',
      hasApiKey,
      apiKeyMasked: maskApiKey(settings.gemini?.apiKey)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/gemini', async (req, res) => {
  try {
    const { model, apiKey } = req.body || {};

    const settings = await getGlobalSettings();
    const nextGemini = {
      ...(settings.gemini?.toObject?.() || settings.gemini || {}),
      model: (model || settings.gemini?.model || 'gemini-3-flash-preview').trim()
    };

    if (apiKey !== undefined) {
      const trimmed = String(apiKey || '').trim();
      if (trimmed) nextGemini.apiKey = trimmed;
    }

    settings.gemini = nextGemini;
    settings.markModified('gemini');
    await settings.save();

    const hasApiKey = !!settings.gemini?.apiKey;
    res.json({
      enabled: hasApiKey,
      model: settings.gemini?.model || 'gemini-3-flash-preview',
      hasApiKey,
      apiKeyMasked: maskApiKey(settings.gemini?.apiKey)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/gemini/test', async (req, res) => {
  try {
    const settings = await getGlobalSettings();
    const providedKey = req.body.apiKey; // Allow testing with a new key before saving
    
    const apiKey = providedKey || settings.gemini?.apiKey;
    
    if (!apiKey) {
      return res.status(400).json({ error: 'Gemini API key is missing' });
    }

    const model = settings.gemini?.model || 'gemini-3-flash-preview'; // Default to 3-flash as per request snippet, or keep 2.5? The request used 3-flash. I will allow fallback but prefer settings.
    
    const client = new GoogleGenAI({ apiKey });
    const response = await client.models.generateContent({
      model: model,
      contents: "Explain how AI works in a few words",
    });

    const text = response?.text || '';
    res.json({ success: true, model, responseText: text });
  } catch (error) {
    const apiError = error.response?.data?.error?.message || error.response?.data?.error || error.message;
    res.status(500).json({ error: apiError });
  }
});

// @route   GET /api/super-admin/tenants
router.get('/tenants', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, plan, search } = req.query;
    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    const safePage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
    const safeLimit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
    const normalizedSearch = String(search || '').trim();
    
    const query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (plan) query['subscription.plan'] = plan;
    if (normalizedSearch) {
      query.$or = [
        { name: { $regex: normalizedSearch, $options: 'i' } },
        { 'business.legalNameEn': { $regex: normalizedSearch, $options: 'i' } },
        { 'business.vatNumber': { $regex: normalizedSearch, $options: 'i' } }
      ];
    }
    
    const tenants = await withQueryTimeout(
      Tenant.find(query)
        .select('name slug business subscription isActive createdAt settings.communication.email')
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean()
    );
    
    const total = await withQueryTimeout(Tenant.countDocuments(query));

    if (tenants.length === 0) {
      return res.json({
        tenants: [],
        pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) }
      });
    }
    
    const tenantIds = tenants.map((tenant) => tenant._id);
    const userCounts = await User.aggregate([
      { $match: { tenantId: { $in: tenantIds } } },
      { $group: { _id: '$tenantId', count: { $sum: 1 } } }
    ]).option({ maxTimeMS: databaseQueryTimeoutMs });
    const userCountMap = new Map(userCounts.map((item) => [String(item._id), item.count || 0]));
    
    const tenantsWithCounts = tenants.map(t => ({
      ...serializeTenantForSuperAdmin(t),
      userCount: userCountMap.get(String(t._id)) || 0
    }));
    
    res.json({
      tenants: tenantsWithCounts,
      pagination: { page: safePage, limit: safeLimit, total, pages: Math.ceil(total / safeLimit) }
    });
  } catch (error) {
    sendRouteError(res, error);
  }
});

// @route   GET /api/super-admin/tenants/:id
router.get('/tenants/:id', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const users = await User.find({ tenantId: tenant._id }).select('-password');
    const invoiceStats = await Invoice.aggregate([
      { $match: { tenantId: tenant._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$grandTotal' } } }
    ]);
    const employeeCount = await Employee.countDocuments({ tenantId: tenant._id, isActive: true });
    
    res.json({
      tenant: serializeTenantForSuperAdmin(tenant),
      users,
      invoiceStats,
      employeeCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/tenants
router.post('/tenants', async (req, res) => {
  try {
    const { name, slug, businessType, businessTypes, business, subscription, adminUser, branding, settings } = req.body;

    const nextBusinessTypes = normalizeBusinessTypes(businessTypes || businessType);
    const primaryBusinessType = businessType && nextBusinessTypes.includes(businessType)
      ? businessType
      : getPrimaryBusinessType({ businessTypes: nextBusinessTypes, businessType });

    // Create tenant
    const tenant = await Tenant.create({
      name,
      slug,
      businessType: primaryBusinessType,
      businessTypes: nextBusinessTypes,
      business,
      ...(settings ? { settings: mergeTenantEmailSettings({ existingTenant: { settings: {}, slug }, incomingSettings: settings }) } : {}),
      ...(branding ? { branding } : {}),
      subscription: {
        ...subscription,
        startDate: new Date(),
        endDate: new Date(Date.now() + (subscription?.billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000)
      },
      createdBy: req.user._id
    });
    
    let createdAdminUser = null;

    // Create admin user for tenant
    if (adminUser) {
      createdAdminUser = await User.create({
        ...adminUser,
        tenantId: tenant._id,
        role: 'admin'
      });
    }

    const welcomeEmail = await sendTenantWelcomeEmail({
      tenant,
      adminUser: createdAdminUser,
      preferredLanguage: createdAdminUser?.preferences?.language || tenant?.settings?.language,
    });
    
    res.status(201).json({
      ...serializeTenantForSuperAdmin(tenant),
      welcomeEmail,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/super-admin/tenants/:id
router.put('/tenants/:id', async (req, res) => {
  try {
    const existingTenant = await Tenant.findById(req.params.id);
    if (!existingTenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const hasBusinessTypePayload = Object.prototype.hasOwnProperty.call(req.body || {}, 'businessType') || Object.prototype.hasOwnProperty.call(req.body || {}, 'businessTypes');
    const nextBusinessTypes = hasBusinessTypePayload
      ? normalizeBusinessTypes(req.body?.businessTypes || req.body?.businessType)
      : normalizeBusinessTypes(existingTenant.businessTypes || existingTenant.businessType);
    const primaryBusinessType = hasBusinessTypePayload
      ? (req.body?.businessType && nextBusinessTypes.includes(req.body.businessType)
          ? req.body.businessType
          : getPrimaryBusinessType({ businessTypes: nextBusinessTypes, businessType: req.body?.businessType }))
      : getPrimaryBusinessType(existingTenant);
    const nextSubscription = req.body?.subscription
      ? {
          ...(existingTenant.subscription?.toObject?.() || existingTenant.subscription || {}),
          ...(req.body.subscription || {}),
        }
      : undefined;

    if (nextSubscription) {
      const nextFeatures = Array.isArray(nextSubscription.features) ? nextSubscription.features.filter(Boolean) : [];
      nextSubscription.features = nextSubscription.hasEmailAddon === true
        ? [...new Set([...nextFeatures, 'email_automation'])]
        : nextFeatures.filter((feature) => feature !== 'email_automation');
    }

    const nextSettings = req.body?.settings
      ? mergeTenantEmailSettings({ existingTenant, incomingSettings: req.body.settings })
      : undefined;

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(nextSettings ? { settings: nextSettings } : {}),
        ...(nextSubscription ? { subscription: nextSubscription } : {}),
        businessType: primaryBusinessType,
        businessTypes: nextBusinessTypes,
      },
      { new: true, runValidators: true }
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(serializeTenantForSuperAdmin(tenant));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/super-admin/tenants/:id/subscription
router.put('/tenants/:id/subscription', async (req, res) => {
  try {
    const { plan, status, maxUsers, maxInvoices, features, billingCycle, price, hasEmailAddon } = req.body;
    
    const updateData = { 'subscription.plan': plan };
    if (status) updateData['subscription.status'] = status;
    if (maxUsers) updateData['subscription.maxUsers'] = maxUsers;
    if (maxInvoices) updateData['subscription.maxInvoices'] = maxInvoices;
    if (features) {
      const featureList = Array.isArray(features) ? features.filter(Boolean) : [];
      updateData['subscription.features'] = hasEmailAddon === true
        ? [...new Set([...featureList, 'email_automation'])]
        : featureList.filter((feature) => feature !== 'email_automation');
    }
    if (billingCycle) updateData['subscription.billingCycle'] = billingCycle;
    if (price !== undefined) updateData['subscription.price'] = price;
    if (hasEmailAddon !== undefined) updateData['subscription.hasEmailAddon'] = hasEmailAddon === true;
    if (!features && hasEmailAddon !== undefined) {
      const existingTenant = await Tenant.findById(req.params.id).select('subscription.features');
      const existingFeatures = Array.isArray(existingTenant?.subscription?.features) ? existingTenant.subscription.features.filter(Boolean) : [];
      updateData['subscription.features'] = hasEmailAddon === true
        ? [...new Set([...existingFeatures, 'email_automation'])]
        : existingFeatures.filter((feature) => feature !== 'email_automation');
    }
    
    // Extend end date
    if (status === 'active') {
      const days = billingCycle === 'yearly' ? 365 : 30;
      updateData['subscription.endDate'] = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    
    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/super-admin/tenants/:id/toggle-status
router.put('/tenants/:id/toggle-status', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    tenant.isActive = !tenant.isActive;
    await tenant.save();
    
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 50, tenantId, role, search } = req.query;
    
    const query = {};
    if (tenantId) query.tenantId = tenantId;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .populate('tenantId', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/users
router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/super-admin/users/:id
router.put('/users/:id', async (req, res) => {
  try {
    const { password, ...updateData } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update password separately if provided
    if (password) {
      user.password = password;
      await user.save();
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE /api/super-admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/tenants/:id/login-as
router.post('/tenants/:id/login-as', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    // Find the admin user for this tenant
    const adminUser = await User.findOne({ 
      tenantId: tenant._id, 
      role: 'admin',
      isActive: true 
    });
    
    if (!adminUser) {
      return res.status(404).json({ error: 'No admin user found for this tenant' });
    }
    
    // Generate token for the admin user
    const token = jwt.sign({ id: adminUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
    
    res.json({
      token,
      user: {
        id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
        permissions: adminUser.permissions,
        preferences: adminUser.preferences
      },
      tenant: {
        _id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        business: tenant.business,
        branding: tenant.branding,
        settings: tenant.settings,
        subscription: tenant.subscription
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/reports/revenue
router.get('/reports/revenue', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const match = {};
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }
    
    const revenue = await Invoice.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          totalRevenue: { $sum: '$grandTotal' },
          totalTax: { $sum: '$totalTax' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } }
    ]);
    
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
