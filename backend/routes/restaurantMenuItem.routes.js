import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import RestaurantMenuItem from '../models/RestaurantMenuItem.js';
import { protect, tenantFilter, checkPermission, requireBusinessType } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(protect);
router.use(tenantFilter);
router.use(requireBusinessType('restaurant'));

router.get('/', checkPermission('restaurant', 'read'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, category, isActive = 'true' } = req.query;

    const query = { ...req.tenantFilter };

    if (isActive === 'false') query.isActive = false;
    else if (isActive === 'all') {
    } else query.isActive = true;

    if (category) query.category = category;

    if (search) {
      query.$or = [
        { sku: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { nameAr: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await RestaurantMenuItem.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RestaurantMenuItem.countDocuments(query);

    res.json({
      items,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', checkPermission('restaurant', 'read'), async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!item) return res.status(404).json({ error: 'Menu item not found' });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', checkPermission('restaurant', 'create'), async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(400).json({ error: 'No tenant associated with user' });
    }

    const item = await RestaurantMenuItem.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id,
    });

    res.status(201).json(item);
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ error: 'Duplicate SKU' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Image Upload Endpoint
router.post('/upload-image', checkPermission('restaurant', 'create'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    const tenantIdStr = req.user.tenantId.toString();
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'restaurant', tenantIdStr);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `menu-${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Convert to webp
    await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true }) // reasonable size for menu
      .webp({ quality: 80 })
      .toFile(filepath);

    const imageUrl = `/uploads/restaurant/${tenantIdStr}/${filename}`;
    
    res.json({ imageUrl });
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

router.put('/:id', checkPermission('restaurant', 'update'), async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) return res.status(404).json({ error: 'Menu item not found' });

    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', checkPermission('restaurant', 'delete'), async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { isActive: false },
      { new: true }
    );

    if (!item) return res.status(404).json({ error: 'Menu item not found' });

    res.json({ message: 'Menu item deactivated', item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
