import express from 'express';
import { protect, checkPermission } from '../middleware/auth.js';
import BakalaProduct from '../models/BakalaProduct.js';
import BakalaCategory from '../models/BakalaCategory.js';
import BakalaBrand from '../models/BakalaBrand.js';
import BakalaUnit from '../models/BakalaUnit.js';
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
              { tenantId: req.user.tenantId, primaryBarcode: barcode },
              {
                tenantId: req.user.tenantId,
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

router.get('/', protect, async (req, res) => {
  try {
    const products = await BakalaProduct.find({ tenantId: req.user.tenantId }).sort('-createdAt');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const product = new BakalaProduct({ ...req.body, tenantId: req.user.tenantId, createdBy: req.user._id });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const product = await BakalaProduct.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
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
    const product = await BakalaProduct.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CATEGORIES ---
router.get('/categories', protect, async (req, res) => {
  try {
    const categories = await BakalaCategory.find({ tenantId: req.user.tenantId }).sort('name');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/categories', protect, async (req, res) => {
  try {
    const category = new BakalaCategory({ ...req.body, tenantId: req.user.tenantId });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/categories/:id', protect, async (req, res) => {
  try {
    await BakalaCategory.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BRANDS ---
router.get('/brands', protect, async (req, res) => {
  try {
    const brands = await BakalaBrand.find({ tenantId: req.user.tenantId }).sort('name');
    res.json(brands);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/brands', protect, async (req, res) => {
  try {
    const brand = new BakalaBrand({ ...req.body, tenantId: req.user.tenantId });
    await brand.save();
    res.status(201).json(brand);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/brands/:id', protect, async (req, res) => {
  try {
    await BakalaBrand.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- UNITS ---
router.get('/units', protect, async (req, res) => {
  try {
    const units = await BakalaUnit.find({ tenantId: req.user.tenantId }).sort('name');
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/units', protect, async (req, res) => {
  try {
    const unit = new BakalaUnit({ ...req.body, tenantId: req.user.tenantId });
    await unit.save();
    res.status(201).json(unit);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/units/:id', protect, async (req, res) => {
  try {
    await BakalaUnit.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
