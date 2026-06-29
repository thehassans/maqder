import express from 'express';
import { protect } from '../middleware/auth.js';
import Tenant from '../models/Tenant.js';
import EcommerceProduct from '../models/EcommerceProduct.js';

const router = express.Router();

const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'ecommerce' });
    return tenant ? tenant._id : null;
  }
  return null;
};

// --- LIST PRODUCTS ---
router.get('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { search, status, category, sort, page = 1, limit = 20 } = req.query;
    const filter = { tenantId };

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'title-az': { title: 1 },
      'title-za': { title: -1 },
      'price-low': { basePrice: 1 },
      'price-high': { basePrice: -1 },
      'best-selling': { salesCount: -1 },
    };
    const sortBy = sortOptions[sort] || sortOptions.newest;

    const skip = (Number(page) - 1) * Number(limit);
    const [products, total] = await Promise.all([
      EcommerceProduct.find(filter).sort(sortBy).skip(skip).limit(Number(limit)).lean(),
      EcommerceProduct.countDocuments(filter),
    ]);

    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GET SINGLE PRODUCT ---
router.get('/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const product = await EcommerceProduct.findOne({ _id: req.params.id, tenantId }).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CREATE PRODUCT ---
router.post('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const body = req.body;
    if (!body.title || !body.title.trim()) {
      return res.status(400).json({ error: 'Product title is required' });
    }

    const product = new EcommerceProduct({
      tenantId,
      title: body.title.trim(),
      titleAr: body.titleAr || '',
      description: body.description || '',
      descriptionAr: body.descriptionAr || '',
      productType: body.productType || 'physical',
      status: body.status || 'draft',
      category: body.category || '',
      tags: body.tags || [],
      vendor: body.vendor || '',
      brand: body.brand || '',
      basePrice: body.basePrice || 0,
      compareAtPrice: body.compareAtPrice || 0,
      costPrice: body.costPrice || 0,
      taxRate: body.taxRate ?? 15,
      taxIncluded: body.taxIncluded ?? true,
      currency: body.currency || 'SAR',
      hasVariants: body.hasVariants || false,
      option1Name: body.option1Name || '',
      option2Name: body.option2Name || '',
      option3Name: body.option3Name || '',
      variants: body.variants || [],
      stockQuantity: body.stockQuantity || 0,
      trackInventory: body.trackInventory ?? true,
      continueSellingWhenOOS: body.continueSellingWhenOOS || false,
      sku: body.sku || '',
      barcode: body.barcode || '',
      weight: body.weight || 0,
      weightUnit: body.weightUnit || 'g',
      requiresShipping: body.requiresShipping ?? true,
      images: body.images || [],
      seo: body.seo || {},
      createdBy: req.user._id,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- UPDATE PRODUCT ---
router.put('/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const body = req.body;
    const allowed = [
      'title', 'titleAr', 'description', 'descriptionAr', 'productType', 'status',
      'category', 'tags', 'vendor', 'brand', 'basePrice', 'compareAtPrice', 'costPrice',
      'taxRate', 'taxIncluded', 'currency', 'hasVariants', 'option1Name', 'option2Name',
      'option3Name', 'variants', 'stockQuantity', 'trackInventory', 'continueSellingWhenOOS',
      'sku', 'barcode', 'weight', 'weightUnit', 'requiresShipping', 'images', 'seo',
    ];

    const update = { updatedBy: req.user._id };
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    const product = await EcommerceProduct.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: update },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- DELETE PRODUCT ---
router.delete('/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const result = await EcommerceProduct.deleteOne({ _id: req.params.id, tenantId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TOGGLE STATUS (quick activate/archive) ---
router.patch('/:id/status', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const { status } = req.body;
    if (!['draft', 'active', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const product = await EcommerceProduct.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { $set: { status, updatedBy: req.user._id } },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// --- GET CATEGORIES (distinct) ---
router.get('/meta/categories', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const categories = await EcommerceProduct.distinct('category', { tenantId, category: { $ne: '' } });
    res.json(categories.sort());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
