import express from 'express';
import KhayyatStitching from '../../models/khayyat/KhayyatStitching.js';
import Customer from '../../models/Customer.js';
import KhayyatWorker from '../../models/khayyat/KhayyatWorker.js';
import User from '../../models/User.js';
import KhayyatEmbroideryDesign from '../../models/khayyat/KhayyatEmbroideryDesign.js';
import KhayyatFabric from '../../models/khayyat/KhayyatFabric.js';
import { protect } from '../../middleware/auth.js';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });


const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, workerId } = req.query;
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(200, Number(limit) || 20));
    const query = { tenantId: req.user.tenantId };
    
    if (status) query.status = status;
    if (workerId) query.workerId = workerId;
    if (search) {
      query.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { oldInvoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [stitchings, total] = await Promise.all([
      KhayyatStitching.find(query)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum)
        .populate('customerId', 'name phone')
        .populate('workerId', 'name phone')
        .populate('fabricId', 'name madeIn pricePerRoll rollsInStock')
        .lean(),
      KhayyatStitching.countDocuments(query)
    ]);
    
    res.json({
      stitchings,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const stitching = await KhayyatStitching.findOne({ 
      _id: req.params.id, 
      tenantId: req.user.tenantId 
    })
      .populate('customerId')
      .populate('workerId', 'name phone')
      .populate('fabricId', 'name madeIn pricePerRoll rollsInStock');
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }
    
    res.json({ stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', upload.single('measurementImage'), async (req, res) => {
  try {
    let { 
      customerId, 
      customerName,
      customerPhone,
      quantity, 
      price, 
      paidAmount,
      description, 
      dueDate,
      receiptNumber,
      thawbType,
      fabricColor,
      fabricId,
      customFabricName,
      rollsUsed,
      measurements,
      styleOptions
    } = req.body;

    if (typeof measurements === 'string') {
      try { measurements = JSON.parse(measurements); } catch (e) {}
    }
    if (typeof styleOptions === 'string') {
      try { styleOptions = JSON.parse(styleOptions); } catch (e) {}
    }

    let customer;
    if (customerId) {
      customer = await Customer.findOne({ _id: customerId, tenantId: req.user.tenantId });
    } else {
      customer = new Customer({
        tenantId: req.user.tenantId,
        name: customerName,
        phone: customerPhone,
      });
      await customer.save();
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    if (fabricId && rollsUsed > 0) {
      await KhayyatFabric.findOneAndUpdate(
        { _id: fabricId, tenantId: req.user.tenantId },
        { $inc: { rollsInStock: -rollsUsed } }
      );
    }

    const stitching = new KhayyatStitching({
      tenantId: req.user.tenantId,
      customerId: customer._id,
      receiptNumber: receiptNumber || `RCPT-${Date.now()}`,
      thawbType: thawbType || 'saudi',
      fabricColor: fabricColor || null,
      fabricId: fabricId || null,
      customFabricName: customFabricName || '',
      rollsUsed: rollsUsed || 0,
      measurements: measurements || {},
      styleOptions: styleOptions || {},
      quantity: quantity || 1,
      price: price || 0,
      paidAmount: paidAmount || 0,
      description: description || '',
      dueDate: dueDate || null
    });

    if (req.file) {
      const tenantIdStr = req.user.tenantId.toString();
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'khayyat', tenantIdStr, 'measurements');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = `measurement-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadsDir, filename);
      await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);
      stitching.measurementImage = `/uploads/khayyat/${tenantIdStr}/measurements/${filename}`;
      stitching.measurementImageUpdatedAt = Date.now();
    }

    await stitching.save();
    res.status(201).json({ message: 'Stitching created successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

router.put('/:id', upload.single('measurementImage'), async (req, res) => {
  try {
    const stitching = await KhayyatStitching.findOne({ 
      _id: req.params.id, 
      tenantId: req.user.tenantId 
    });
    
    if (!stitching) {
      return res.status(404).json({ error: 'Stitching not found' });
    }

    let { status, workerId, measurements, styleOptions, removeMeasurementImage } = req.body;

    if (typeof measurements === 'string') {
      try { measurements = JSON.parse(measurements); } catch (e) {}
    }
    if (typeof styleOptions === 'string') {
      try { styleOptions = JSON.parse(styleOptions); } catch (e) {}
    }

    if (status) stitching.status = status;
    if (workerId !== undefined) stitching.workerId = workerId || null;
    if (measurements) stitching.measurements = measurements;
    if (styleOptions) stitching.styleOptions = styleOptions;

    if (removeMeasurementImage === 'true') {
      stitching.measurementImage = '';
      stitching.measurementImageUpdatedAt = Date.now();
    }

    if (req.file) {
      const tenantIdStr = req.user.tenantId.toString();
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'khayyat', tenantIdStr, 'measurements');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filename = `measurement-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadsDir, filename);
      await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(filepath);
      stitching.measurementImage = `/uploads/khayyat/${tenantIdStr}/measurements/${filename}`;
      stitching.measurementImageUpdatedAt = Date.now();
    }

    await stitching.save();
    res.json({ message: 'Stitching updated successfully', stitching });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
