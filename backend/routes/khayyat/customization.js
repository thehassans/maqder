import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import KhayyatCustomization from '../../models/khayyat/KhayyatCustomization.js';
import { protect } from '../../middleware/auth.js';

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.use(protect);

// GET /api/khayyat/customizations
router.get('/', async (req, res) => {
  try {
    const filter = { tenantId: req.user.tenantId };
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    const customizations = await KhayyatCustomization.find(filter)
      .sort({ sortOrder: 1, createdAt: -1 });
      
    res.json({ success: true, customizations });
  } catch (error) {
    console.error('Fetch customizations error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/khayyat/customizations
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { category, nameEn, nameAr, extraPrice, isActive, sortOrder } = req.body;
    
    if (!category || !nameEn || !nameAr) {
      return res.status(400).json({ success: false, error: 'Category, English Name, and Arabic Name are required' });
    }

    let imageUrl = null;

    if (req.file) {
      const tenantIdStr = req.user.tenantId.toString();
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'khayyat', 'customizations', tenantIdStr);
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${category}-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadsDir, filename);

      await sharp(req.file.buffer)
        .resize({ width: 300, height: 300, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 85 })
        .toFile(filepath);

      imageUrl = `/uploads/khayyat/customizations/${tenantIdStr}/${filename}`;
    }

    const customization = new KhayyatCustomization({
      tenantId: req.user.tenantId,
      category,
      nameEn,
      nameAr,
      image: imageUrl,
      extraPrice: Number(extraPrice) || 0,
      isActive: isActive === 'false' ? false : true,
      sortOrder: Number(sortOrder) || 0
    });

    await customization.save();
    res.status(201).json({ success: true, customization });
  } catch (error) {
    console.error('Create customization error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/khayyat/customizations/:id
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const customization = await KhayyatCustomization.findOne({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!customization) {
      return res.status(404).json({ success: false, error: 'Customization not found' });
    }

    const { category, nameEn, nameAr, extraPrice, isActive, sortOrder } = req.body;

    if (category) customization.category = category;
    if (nameEn) customization.nameEn = nameEn;
    if (nameAr) customization.nameAr = nameAr;
    if (extraPrice !== undefined) customization.extraPrice = Number(extraPrice) || 0;
    if (isActive !== undefined) customization.isActive = isActive === 'false' ? false : true;
    if (sortOrder !== undefined) customization.sortOrder = Number(sortOrder) || 0;

    if (req.file) {
      const tenantIdStr = req.user.tenantId.toString();
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'khayyat', 'customizations', tenantIdStr);
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `${customization.category}-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
      const filepath = path.join(uploadsDir, filename);

      await sharp(req.file.buffer)
        .resize({ width: 300, height: 300, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
        .webp({ quality: 85 })
        .toFile(filepath);

      customization.image = `/uploads/khayyat/customizations/${tenantIdStr}/${filename}`;
    } else if (req.body.removeImage === 'true') {
        customization.image = null;
    }

    await customization.save();
    res.json({ success: true, customization });
  } catch (error) {
    console.error('Update customization error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/khayyat/customizations/:id
router.delete('/:id', async (req, res) => {
  try {
    const customization = await KhayyatCustomization.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId });
    if (!customization) {
      return res.status(404).json({ success: false, error: 'Customization not found' });
    }
    // Note: We leave the old image file to save logic complexity and prevent broken references 
    // if it was used in historical orders.
    
    res.json({ success: true, message: 'Customization deleted' });
  } catch (error) {
    console.error('Delete customization error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
