import express from 'express';
import { protect } from '../middleware/auth.js';
import Tenant from '../models/Tenant.js';

const router = express.Router();

const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'ecommerce' });
    return tenant ? tenant._id : null;
  }
  return null;
};

// Default theme configuration — the starting point for all new stores
const DEFAULT_THEME = {
  version: 1,
  layout: 'modern', // modern, classic, minimal
  colors: {
    primary: '#4f46e5',
    secondary: '#7c3aed',
    accent: '#ec4899',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textMuted: '#6b7280',
    headerBg: '#ffffff',
    footerBg: '#111827',
    footerText: '#9ca3af',
    buttonBg: '#4f46e5',
    buttonText: '#ffffff',
    priceColor: '#059669',
    salePriceColor: '#dc2626',
    borderColor: '#e5e7eb',
  },
  typography: {
    headingFont: 'Inter',
    bodyFont: 'Inter',
    headingSize: 'text-3xl',
    bodySize: 'text-base',
    headingWeight: 'font-bold',
    bodyWeight: 'font-normal',
    lineHeight: 'leading-relaxed',
  },
  header: {
    showLogo: true,
    logoText: '',
    logoImageUrl: '',
    showSearch: true,
    showCart: true,
    showCategories: true,
    announcementBar: {
      enabled: false,
      text: '',
      textAr: '',
      bgColor: '#4f46e5',
      textColor: '#ffffff',
    },
    sticky: true,
  },
  footer: {
    showAbout: true,
    aboutText: '',
    showContact: true,
    showSocialLinks: true,
    socialLinks: { instagram: '', twitter: '', facebook: '', tiktok: '', snapchat: '' },
    showPaymentIcons: true,
    copyrightText: '',
  },
  homepage: {
    sections: [
      { id: 'hero', type: 'hero', enabled: true, settings: { title: '', subtitle: '', imageUrl: '', buttonText: 'Shop Now', buttonLink: '/products' } },
      { id: 'featured', type: 'product-carousel', enabled: true, settings: { title: 'Featured Products', limit: 8 } },
      { id: 'categories', type: 'category-grid', enabled: true, settings: { title: 'Shop by Category', columns: 4 } },
      { id: 'newarrivals', type: 'product-carousel', enabled: true, settings: { title: 'New Arrivals', limit: 8 } },
      { id: 'newsletter', type: 'newsletter', enabled: false, settings: { title: 'Subscribe', subtitle: '' } },
    ],
  },
  productPage: {
    showBreadcrumbs: true,
    showRelatedProducts: true,
    relatedLimit: 4,
    showReviews: false,
    defaultImageZoom: true,
    showShareButtons: true,
  },
  cart: {
    style: 'drawer', // drawer, page, modal
    showRecommendations: true,
    freeShippingBar: true,
  },
  customCss: '',
};

// GET theme config (returns draft + published)
router.get('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId).select('ecommerce.theme').lean();
    const theme = tenant?.ecommerce?.theme || {};
    // Merge with defaults so the editor always has a complete config
    const draft = mergeDefaults(theme.draft || DEFAULT_THEME);
    const published = theme.published ? mergeDefaults(theme.published) : null;
    res.json({
      draft,
      published,
      draftUpdatedAt: theme.draftUpdatedAt || null,
      publishedAt: theme.publishedAt || null,
      hasUnpublishedChanges: !!theme.publishedAt && (!theme.draftUpdatedAt || new Date(theme.draftUpdatedAt) > new Date(theme.publishedAt)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Save draft
router.put('/draft', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.theme = tenant.ecommerce.theme || {};
    tenant.ecommerce.theme.draft = req.body;
    tenant.ecommerce.theme.draftUpdatedAt = new Date();
    await tenant.save();
    res.json({ draft: mergeDefaults(tenant.ecommerce.theme.draft), draftUpdatedAt: tenant.ecommerce.theme.draftUpdatedAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Publish draft → published
router.post('/publish', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.theme = tenant.ecommerce.theme || {};
    // If no draft exists, use defaults
    const draft = tenant.ecommerce.theme.draft || DEFAULT_THEME;
    tenant.ecommerce.theme.published = draft;
    tenant.ecommerce.theme.publishedAt = new Date();
    await tenant.save();
    res.json({ published: mergeDefaults(tenant.ecommerce.theme.published), publishedAt: tenant.ecommerce.theme.publishedAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset draft to default
router.post('/reset', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
    tenant.ecommerce = tenant.ecommerce || {};
    tenant.ecommerce.theme = tenant.ecommerce.theme || {};
    tenant.ecommerce.theme.draft = DEFAULT_THEME;
    tenant.ecommerce.theme.draftUpdatedAt = new Date();
    await tenant.save();
    res.json({ draft: DEFAULT_THEME, draftUpdatedAt: tenant.ecommerce.theme.draftUpdatedAt });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get defaults (for reference)
router.get('/defaults', protect, async (req, res) => {
  res.json(DEFAULT_THEME);
});

// Helper: deep merge user config over defaults
function mergeDefaults(userConfig) {
  if (!userConfig || typeof userConfig !== 'object') return DEFAULT_THEME;
  return {
    ...DEFAULT_THEME,
    ...userConfig,
    colors: { ...DEFAULT_THEME.colors, ...(userConfig.colors || {}) },
    typography: { ...DEFAULT_THEME.typography, ...(userConfig.typography || {}) },
    header: { ...DEFAULT_THEME.header, ...(userConfig.header || {}), announcementBar: { ...DEFAULT_THEME.header.announcementBar, ...((userConfig.header || {}).announcementBar || {}) } },
    footer: { ...DEFAULT_THEME.footer, ...(userConfig.footer || {}), socialLinks: { ...DEFAULT_THEME.footer.socialLinks, ...((userConfig.footer || {}).socialLinks || {}) } },
    homepage: { ...DEFAULT_THEME.homepage, ...(userConfig.homepage || {}), sections: userConfig.homepage?.sections || DEFAULT_THEME.homepage.sections },
    productPage: { ...DEFAULT_THEME.productPage, ...(userConfig.productPage || {}) },
    cart: { ...DEFAULT_THEME.cart, ...(userConfig.cart || {}) },
  };
}

export default router;
