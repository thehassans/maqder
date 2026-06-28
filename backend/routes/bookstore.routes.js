import express from 'express';
import { protect } from '../middleware/auth.js';
import BookStoreProduct from '../models/BookStoreProduct.js';
import SchoolSupplyList from '../models/SchoolSupplyList.js';
import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import PosSession from '../models/PosSession.js';
import ZatcaService from '../utils/zatca/ZatcaService.js';
import mongoose from 'mongoose';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const getTargetTenantId = async (user) => {
  if (user.tenantId) return user.tenantId;
  if (user.role === 'super_admin') {
    const tenant = await Tenant.findOne({ businessTypes: 'bookstore' });
    return tenant ? tenant._id : null;
  }
  return null;
};

// --- PRODUCTS ---

router.get('/products', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const filter = tenantId ? { tenantId, isActive: true } : {};
    const products = await BookStoreProduct.find(filter)
      .select('name nameAr isbn primaryBarcode author publisher genre language retailPrice discountPrice taxRate unit stockQuantity category coverImage seriesName seriesNumber seriesTotal')
      .lean();
    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/products/all', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const filter = tenantId ? { tenantId } : {};
    const products = await BookStoreProduct.find(filter).sort('-createdAt');
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/barcode/:code', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const code = String(req.params.code || '').trim();
    if (!code) return res.status(400).json({ error: 'Barcode/ISBN required' });
    const product = await BookStoreProduct.findOne({
      tenantId,
      $or: [{ primaryBarcode: code }, { barcodes: code }, { isbn: code }],
    });
    if (!product) return res.status(404).json({ error: 'Product not found', found: false });
    res.json({ found: true, product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found for this user.' });

    const body = { ...req.body };
    if (!body.primaryBarcode || !String(body.primaryBarcode).trim()) {
      body.primaryBarcode = body.isbn || `INT${Date.now()}${Math.floor(Math.random() * 100)}`;
    }
    if (!Array.isArray(body.barcodes) || body.barcodes.length === 0) {
      body.barcodes = [body.primaryBarcode];
    }

    const exists = await BookStoreProduct.findOne({ tenantId, primaryBarcode: body.primaryBarcode });
    if (exists) {
      return res.status(409).json({ error: 'A product with this barcode/ISBN already exists.', product: exists });
    }

    const product = new BookStoreProduct({ ...body, tenantId, createdBy: req.user._id });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/products/:id/add-stock', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const { quantity, costPrice } = req.body;
    const qty = Number(quantity);
    if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than zero.' });

    const product = await BookStoreProduct.findOne({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    product.stockQuantity = (Number(product.stockQuantity) || 0) + qty;
    if (costPrice !== undefined && costPrice !== null && costPrice !== '') {
      product.costPrice = Number(costPrice) || product.costPrice;
    }
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/products/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const product = await BookStoreProduct.findOneAndUpdate(
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

router.delete('/products/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const product = await BookStoreProduct.findOneAndDelete({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/products/inventory-alerts', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const products = await BookStoreProduct.find({ tenantId, isActive: { $ne: false } })
      .select('name nameAr isbn primaryBarcode author stockQuantity minimumStockAlertLevel costPrice retailPrice')
      .lean();

    const lowStock = [];
    const outOfStock = [];

    for (const p of products) {
      const stock = Number(p.stockQuantity) || 0;
      const alertLevel = p.minimumStockAlertLevel != null ? Number(p.minimumStockAlertLevel) : 5;

      if (stock <= 0) {
        outOfStock.push(p);
      } else if (stock <= alertLevel) {
        lowStock.push(p);
      }
    }

    lowStock.sort((a, b) => (Number(a.stockQuantity) || 0) - (Number(b.stockQuantity) || 0));
    outOfStock.sort((a, b) => (Number(a.stockQuantity) || 0) - (Number(b.stockQuantity) || 0));

    res.json({
      summary: {
        totalProducts: products.length,
        lowStock: lowStock.length,
        outOfStock: outOfStock.length,
      },
      lowStock,
      outOfStock,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- POS SYNC (offline invoices) ---

router.post('/sync', protect, async (req, res) => {
  try {
    const { invoices } = req.body;
    const tenantId = req.user.tenantId;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ success: false, message: 'No invoices provided' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const zatcaConfig = tenant.zatca || {};
    const zatcaService = new ZatcaService({
      privateKey: zatcaConfig.privateKey,
      certificate: zatcaConfig.certificateSerialNumber,
      csid: zatcaConfig.productionCsid || zatcaConfig.complianceCsid,
      previousInvoiceHash: zatcaConfig.lastInvoiceHash,
    });

    const syncedInvoices = [];
    const errors = [];

    for (const offlineInvoice of invoices) {
      try {
        const cleanedInvoice = {
          ...offlineInvoice,
          paymentMethod: offlineInvoice.paymentMethod === 'split' ? 'split' : (['mada', 'apple_pay'].includes(offlineInvoice.paymentMethod) ? 'card' : (offlineInvoice.paymentMethod || 'cash')),
          payments: offlineInvoice.payments || [],
          lineItems: offlineInvoice.lineItems?.map(line => {
            const l = { ...line };
            if (l.productId && !mongoose.Types.ObjectId.isValid(l.productId)) {
              delete l.productId;
            }
            return l;
          }) || [],
        };

        const isDraft = String(cleanedInvoice.status || '').trim().toLowerCase() === 'draft';
        const initialStatus = isDraft ? 'draft' : (tenant.zatca?.phase === 1 ? 'approved' : 'pending');

        const newInvoice = new Invoice({
          ...cleanedInvoice,
          tenantId,
          flow: 'sell',
          businessContext: 'bookstore',
          transactionType: 'B2C',
          invoiceTypeCode: '0200000',
          status: initialStatus,
          createdBy: req.user._id,
        });

        if (!newInvoice.invoiceNumber) {
          const lastInvoice = await Invoice.findOne({ tenantId, invoiceNumber: { $regex: '^BOOK-' } })
            .sort({ createdAt: -1 })
            .select('invoiceNumber');

          let seq = 1;
          if (lastInvoice && lastInvoice.invoiceNumber) {
            const parts = lastInvoice.invoiceNumber.split('-');
            const lastSeq = parseInt(parts[1], 10);
            if (!isNaN(lastSeq)) seq = lastSeq + 1;
          }
          newInvoice.invoiceNumber = `BOOK-${seq}`;
        }

        if (zatcaConfig.isOnboarded && zatcaConfig.privateKey) {
          const processed = await zatcaService.processInvoice(newInvoice.toObject(), tenant.business, true);
          newInvoice.zatca = { ...processed, submissionStatus: 'pending' };
          tenant.zatca.lastInvoiceHash = processed.invoiceHash;
          tenant.zatca.invoiceCounter = processed.invoiceCounter;
        }

        await newInvoice.save();

        for (const line of newInvoice.lineItems) {
          if (line.productId) {
            await BookStoreProduct.findByIdAndUpdate(line.productId, {
              $inc: { stockQuantity: -line.quantity },
            });
          }
        }

        syncedInvoices.push({ offlineId: offlineInvoice.offlineId, uuid: newInvoice.zatca?.uuid || newInvoice._id });
      } catch (err) {
        console.error('BookStore Invoice Sync Error:', err);
        errors.push({ offlineId: offlineInvoice.offlineId, error: err.message });
      }
    }

    if (zatcaConfig.isOnboarded && zatcaConfig.privateKey) {
      await tenant.save();
    }

    res.status(201).json({ success: true, syncedInvoices, errors });
  } catch (error) {
    console.error('BookStore Sync Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- POS SESSION / SHIFT MANAGEMENT ---

router.get('/shift/current', protect, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    const requireShift = tenant?.settings?.bookstore?.requireShift !== false;

    if (!requireShift) {
      return res.json({
        success: true,
        session: {
          _id: 'auto',
          tenantId: req.user.tenantId,
          userId: req.user._id,
          status: 'open',
          openingBalance: 0,
          openedAt: new Date(),
          cashDrops: [],
        },
      });
    }

    const session = await PosSession.findOne({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      status: 'open',
    });
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/shift/open', protect, async (req, res) => {
  try {
    const existing = await PosSession.findOne({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      status: 'open',
    });
    if (existing) return res.status(400).json({ success: false, message: 'Shift already open' });

    const session = new PosSession({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      openingBalance: req.body.openingBalance || 0,
    });
    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/shift/drop', protect, async (req, res) => {
  try {
    const session = await PosSession.findOne({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      status: 'open',
    });
    if (!session) return res.status(400).json({ success: false, message: 'No open shift' });

    session.cashDrops.push({ amount: req.body.amount, reason: req.body.reason });
    await session.save();
    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/shift/close', protect, async (req, res) => {
  try {
    const session = await PosSession.findOne({
      tenantId: req.user.tenantId,
      userId: req.user._id,
      status: 'open',
    });
    if (!session) return res.status(400).json({ success: false, message: 'No open shift' });

    session.closedAt = new Date();
    session.actualClosingBalance = req.body.actualClosingBalance || 0;
    session.totalSales = req.body.totalSales || 0;
    session.totalCash = req.body.totalCash || 0;
    session.totalCard = req.body.totalCard || 0;

    const dropsTotal = session.cashDrops.reduce((acc, d) => acc + d.amount, 0);
    session.expectedClosingBalance = session.openingBalance + session.totalCash - dropsTotal;
    session.cashDiscrepancy = session.actualClosingBalance - session.expectedClosingBalance;

    session.status = 'closed';
    await session.save();

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- COVER IMAGE UPLOAD ---

router.post('/upload-cover', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

    const tenantIdStr = req.user.tenantId.toString();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'bookstore', tenantIdStr);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `cover-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer)
      .resize({ width: 600, height: 900, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(filepath);

    const imageUrl = `/uploads/bookstore/${tenantIdStr}/${filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('BookStore cover upload error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

// --- CSV / EXCEL IMPORT ---

router.post('/import-csv', protect, upload.single('file'), async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const results = [];
    const buffer = req.file.buffer.toString('utf-8');
    const lines = buffer.split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    let count = 0;
    let errors = 0;

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim(); });

      const name = row['name'] || row['title'] || row['english_name'] || '';
      if (!name) { errors++; continue; }

      const barcode = row['barcode'] || row['isbn'] || `INT${Date.now()}${Math.floor(Math.random() * 10000)}`;
      const existing = await BookStoreProduct.findOne({ tenantId, primaryBarcode: barcode });
      if (existing) { errors++; continue; }

      try {
        await BookStoreProduct.findOneAndUpdate(
          { tenantId, primaryBarcode: barcode },
          {
            tenantId,
            name,
            nameAr: row['name_ar'] || row['arabic_name'] || '',
            isbn: row['isbn'] || '',
            primaryBarcode: barcode,
            barcodes: [barcode],
            author: row['author'] || '',
            authorAr: row['author_ar'] || '',
            publisher: row['publisher'] || '',
            publisherAr: row['publisher_ar'] || '',
            genre: row['genre'] || row['category'] || '',
            category: row['category'] || '',
            language: row['language'] || 'English',
            edition: row['edition'] || '',
            publicationYear: parseInt(row['publication_year']) || null,
            coverType: row['cover_type'] || 'paperback',
            seriesName: row['series_name'] || row['series'] || '',
            seriesNumber: parseInt(row['series_number']) || null,
            seriesTotal: parseInt(row['series_total']) || null,
            isStationery: row['is_stationery'] === 'true' || row['is_stationery'] === '1',
            costPrice: parseFloat(row['cost_price']) || 0,
            retailPrice: parseFloat(row['retail_price']) || parseFloat(row['price']) || 0,
            discountPrice: parseFloat(row['discount_price']) || 0,
            stockQuantity: parseInt(row['stock_quantity']) || 0,
            minimumStockAlertLevel: parseInt(row['min_stock_alert']) || 5,
            taxRate: parseFloat(row['tax_rate']) || 15,
            coverImage: row['cover_image_url'] || '',
            createdBy: req.user._id,
          },
          { upsert: true, new: true }
        );
        count++;
      } catch (err) {
        console.error('Import error row', i, ':', err);
        errors++;
      }
    }

    res.json({ success: true, imported: count, errors, total: lines.length - 1 });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- SERIES TRACKING ---

router.get('/series/:seriesName/next-volume', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const seriesName = decodeURIComponent(req.params.seriesName);
    const books = await BookStoreProduct.find({ tenantId, seriesName })
      .sort({ seriesNumber: 1 })
      .select('name nameAr isbn primaryBarcode author seriesName seriesNumber seriesTotal retailPrice discountPrice coverImage stockQuantity')
      .lean();

    if (books.length === 0) return res.json({ books: [], nextVolume: null });

    const maxNumber = Math.max(...books.map(b => b.seriesNumber || 0));
    const seriesTotal = books[0]?.seriesTotal || null;
    const nextVolume = seriesTotal && maxNumber < seriesTotal ? maxNumber + 1 : null;

    res.json({ books, nextVolume, seriesTotal, currentMax: maxNumber });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/series', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const series = await BookStoreProduct.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), seriesName: { $exists: true, $ne: '' } } },
      { $group: { _id: '$seriesName', count: { $sum: 1 }, books: { $push: { name: '$name', seriesNumber: '$seriesNumber', _id: '$_id' } } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ series });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- BESTSELLER REPORT ---

router.get('/reports/bestsellers', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const { startDate, endDate } = req.query;
    const matchStage = {
      tenantId: new mongoose.Types.ObjectId(tenantId),
      businessContext: 'bookstore',
    };
    if (startDate || endDate) {
      matchStage.issueDate = {};
      if (startDate) matchStage.issueDate.$gte = new Date(startDate);
      if (endDate) matchStage.issueDate.$lte = new Date(endDate);
    }

    const [byGenre, byAuthor, byProduct] = await Promise.all([
      Invoice.aggregate([
        { $match: matchStage },
        { $unwind: '$lineItems' },
        { $lookup: { from: 'bookstoreproducts', localField: 'lineItems.productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: { $ifNull: ['$product.genre', 'Unknown'] },
          totalSold: { $sum: '$lineItems.quantity' },
          revenue: { $sum: '$lineItems.lineTotalWithTax' },
          count: { $sum: 1 },
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 20 },
      ]),
      Invoice.aggregate([
        { $match: matchStage },
        { $unwind: '$lineItems' },
        { $lookup: { from: 'bookstoreproducts', localField: 'lineItems.productId', foreignField: '_id', as: 'product' } },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        { $group: {
          _id: { $ifNull: ['$product.author', 'Unknown'] },
          totalSold: { $sum: '$lineItems.quantity' },
          revenue: { $sum: '$lineItems.lineTotalWithTax' },
          count: { $sum: 1 },
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 20 },
      ]),
      Invoice.aggregate([
        { $match: matchStage },
        { $unwind: '$lineItems' },
        { $group: {
          _id: '$lineItems.productName',
          totalSold: { $sum: '$lineItems.quantity' },
          revenue: { $sum: '$lineItems.lineTotalWithTax' },
          count: { $sum: 1 },
        }},
        { $sort: { totalSold: -1 } },
        { $limit: 20 },
      ]),
    ]);

    res.json({ byGenre, byAuthor, byProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- SCHOOL SUPPLY LISTS ---

router.get('/supply-lists', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });
    const lists = await SchoolSupplyList.find({ tenantId, isActive: true }).sort('schoolName grade').lean();
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/supply-lists', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    if (!tenantId) return res.status(400).json({ error: 'No tenant found.' });

    const items = req.body.items || [];
    const totalEstimatedPrice = items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);

    const list = new SchoolSupplyList({
      ...req.body,
      tenantId,
      items,
      totalEstimatedPrice,
      createdBy: req.user._id,
    });
    await list.save();
    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/supply-lists/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const items = req.body.items || [];
    const totalEstimatedPrice = items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);

    const list = await SchoolSupplyList.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { ...req.body, items, totalEstimatedPrice },
      { new: true, runValidators: true }
    );
    if (!list) return res.status(404).json({ error: 'Supply list not found' });
    res.json(list);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/supply-lists/:id', protect, async (req, res) => {
  try {
    const tenantId = await getTargetTenantId(req.user);
    const list = await SchoolSupplyList.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      { isActive: false },
      { new: true }
    );
    if (!list) return res.status(404).json({ error: 'Supply list not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
