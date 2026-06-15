import express from 'express';
import { protect, checkPermission } from '../middleware/auth.js';
import BakalaProduct from '../models/BakalaProduct.js';
import BakalaCategory from '../models/BakalaCategory.js';
import BakalaBrand from '../models/BakalaBrand.js';
import BakalaUnit from '../models/BakalaUnit.js';
import Tenant from '../models/Tenant.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// --- PRODUCTS ---

// Temporary route to trigger CSV import
router.get('/trigger-import', protect, async (req, res) => {
  try {
    let targetTenantId = req.user.tenantId;
    if (!targetTenantId && req.user.role === 'super_admin') {
      const tenant = await Tenant.findOne({ businessTypes: 'bakala' });
      if (!tenant) return res.status(400).json({ error: 'No Bakala tenant found to import products into.' });
      targetTenantId = tenant._id;
    }

    const csvFilePath = path.join(__dirname, '../scripts/bakala_products.csv');
    if (!fs.existsSync(csvFilePath)) {
      return res.status(404).json({ error: 'CSV file not found at ' + csvFilePath });
    }

    const results = [];
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        let count = 0;
        for (const row of results) {
          const name = row['english items'] || row['english_items'] || 'Unknown Item';
          const nameAr = row['arabic items'] || row['arabic_items'] || '';
          const barcode = row['bracode'] || row['barcode'];
          const costPrice = parseFloat(row['purchase_price']) || 0;
          const retailPrice = parseFloat(row['sale_price']) || 0;
          const minimumStockAlertLevel = parseInt(row['alert_quantity']) || 0;
          const isActive = row['active'] === '1' || row['active'] === 'true' || row['active'] === '';

          if (!barcode) continue;

          try {
            await BakalaProduct.findOneAndUpdate(
              { tenantId: targetTenantId, primaryBarcode: barcode },
              {
                tenantId: targetTenantId,
                name,
                nameAr,
                primaryBarcode: barcode,
                barcodes: [barcode],
                costPrice,
                retailPrice,
                minimumStockAlertLevel,
                isActive,
                taxRate: 15,
                createdBy: req.user._id
              },
              { upsert: true, new: true }
            );
            count++;
          } catch (err) {
            console.error('Import error:', err);
          }
        }
        res.json({ success: true, message: `Successfully imported/updated ${count} products!` });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'bakala' });
    return tenant ? tenant._id : null;
  }
  return null;
};

router.get('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const filter = tenantId ? { tenantId } : {};
    const products = await BakalaProduct.find(filter).sort('-createdAt');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Expiry Report (for Balady/Municipality compliance)
router.get('/expiry-report', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    
    // Find products that have an expiryDate
    const products = await BakalaProduct.find({ 
      tenantId, 
      expiryDate: { $exists: true, $ne: null } 
    }).sort('expiryDate');

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET Inventory Alerts (low-stock, out-of-stock, expiry) for the Bakala alerts dashboard
router.get('/inventory-alerts', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const expiryWindowDays = Math.max(1, parseInt(req.query.expiryWindowDays, 10) || 30);
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + expiryWindowDays * 24 * 60 * 60 * 1000);

    const products = await BakalaProduct.find({ tenantId, isActive: { $ne: false } })
      .select('name nameAr primaryBarcode category brand unit stockQuantity minimumStockAlertLevel costPrice retailPrice expiryDate batchNumber')
      .lean();

    const lowStock = [];
    const outOfStock = [];
    const expired = [];
    const expiringSoon = [];
    let stockValueAtRisk = 0;

    for (const p of products) {
      const stock = Number(p.stockQuantity) || 0;
      const alertLevel = p.minimumStockAlertLevel != null ? Number(p.minimumStockAlertLevel) : 10;
      const cost = Number(p.costPrice) || 0;

      if (stock <= 0) {
        outOfStock.push(p);
      } else if (stock <= alertLevel) {
        lowStock.push(p);
        stockValueAtRisk += stock * cost;
      }

      if (p.expiryDate) {
        const exp = new Date(p.expiryDate);
        if (exp <= now) {
          expired.push(p);
          stockValueAtRisk += stock * cost;
        } else if (exp <= expiryThreshold) {
          expiringSoon.push(p);
        }
      }
    }

    const byStockAsc = (a, b) => (Number(a.stockQuantity) || 0) - (Number(b.stockQuantity) || 0);
    const byExpiryAsc = (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate);

    lowStock.sort(byStockAsc);
    outOfStock.sort(byStockAsc);
    expired.sort(byExpiryAsc);
    expiringSoon.sort(byExpiryAsc);

    res.json({
      generatedAt: now.toISOString(),
      expiryWindowDays,
      summary: {
        totalProducts: products.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
        expired: expired.length,
        expiringSoon: expiringSoon.length,
        stockValueAtRisk: Math.round(stockValueAtRisk * 100) / 100,
      },
      lowStock,
      outOfStock,
      expired,
      expiringSoon,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found for this user.' });
    
    const product = new BakalaProduct({ ...req.body, tenantId, createdBy: req.user._id });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const product = await BakalaProduct.findOneAndUpdate(
      { _id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const product = await BakalaProduct.findOneAndDelete({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CATEGORIES ---
router.get('/categories', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const filter = tenantId ? { tenantId } : {};
    const categories = await BakalaCategory.find(filter).sort('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found for this user.' });
    const category = new BakalaCategory({ ...req.body, tenantId });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/categories/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const category = await BakalaCategory.findOneAndUpdate(
      { _id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/categories/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    await BakalaCategory.findOneAndDelete({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BRANDS ---
router.get('/brands', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const filter = tenantId ? { tenantId } : {};
    const brands = await BakalaBrand.find(filter).sort('name');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/brands', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found for this user.' });
    const brand = new BakalaBrand({ ...req.body, tenantId });
    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/brands/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const brand = await BakalaBrand.findOneAndUpdate(
      { _id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/brands/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    await BakalaBrand.findOneAndDelete({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- UNITS ---
router.get('/units', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const filter = tenantId ? { tenantId } : {};
    const units = await BakalaUnit.find(filter).sort('name');
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/units', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found for this user.' });
    const unit = new BakalaUnit({ ...req.body, tenantId });
    await unit.save();
    res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/units/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const unit = await BakalaUnit.findOneAndUpdate(
      { _id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/units/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    await BakalaUnit.findOneAndDelete({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
