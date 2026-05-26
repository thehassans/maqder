import express from 'express';
import LaundryService from '../models/LaundryService.js';
import { protect, tenantFilter, checkPermission, requireBusinessType } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);
router.use(requireBusinessType('laundry'));

// GET /api/laundry/services
router.get('/', checkPermission('laundry', 'read'), async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = { tenantId: req.tenant._id };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const services = await LaundryService.find(query).sort({ category: 1, nameEn: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/laundry/services/seed
router.post('/seed', checkPermission('laundry', 'create'), async (req, res) => {
  try {
    const existingCount = await LaundryService.countDocuments({ tenantId: req.tenant._id });
    if (existingCount > 0) {
      return res.status(400).json({ error: 'Services already seeded' });
    }

    const defaultServices = [
      { nameEn: 'Shirt Wash & Iron', nameAr: 'غسيل وكوي قميص', category: 'wash_fold', billingType: 'per_piece', basePrice: 5, imageUrl: 'https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=500&q=80', treatments: ['Wash & Iron', 'Dry Clean'] },
      { nameEn: 'T-Shirt Wash & Fold', nameAr: 'غسيل وطي تي شيرت', category: 'wash_fold', billingType: 'per_piece', basePrice: 3, imageUrl: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&q=80', treatments: ['Wash & Fold'] },
      { nameEn: 'Pants / Trousers', nameAr: 'بنطلون', category: 'dry_clean', billingType: 'per_piece', basePrice: 7, imageUrl: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=80', treatments: ['Dry Clean', 'Wash & Iron'] },
      { nameEn: 'Suit (2 Piece)', nameAr: 'بدلة قطعتين', category: 'dry_clean', billingType: 'per_piece', basePrice: 25, imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&q=80', treatments: ['Dry Clean'] },
      { nameEn: 'Dress', nameAr: 'فستان', category: 'dry_clean', billingType: 'per_piece', basePrice: 20, imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&q=80', treatments: ['Dry Clean', 'Wash & Iron'] },
      { nameEn: 'Blanket / Comforter', nameAr: 'بطانية / لحاف', category: 'premium_care', billingType: 'per_piece', basePrice: 35, imageUrl: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=500&q=80', treatments: ['Wash & Fold'] },
      { nameEn: 'Carpet (per SQM)', nameAr: 'سجاد (بالمتر المربع)', category: 'premium_care', billingType: 'per_kg', basePrice: 15, imageUrl: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=500&q=80', treatments: ['Wash'] },
      { nameEn: 'Jacket / Coat', nameAr: 'جاكيت / معطف', category: 'dry_clean', billingType: 'per_piece', basePrice: 18, imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80', treatments: ['Dry Clean'] },
      { nameEn: 'Thobe (Traditional)', nameAr: 'ثوب', category: 'wash_fold', billingType: 'per_piece', basePrice: 6, imageUrl: 'https://images.unsplash.com/photo-1583307779774-8eb78b277d33?w=500&q=80', treatments: ['Wash & Iron', 'Dry Clean'] },
      { nameEn: 'Abaya', nameAr: 'عباية', category: 'dry_clean', billingType: 'per_piece', basePrice: 15, imageUrl: 'https://images.unsplash.com/photo-1585487000160-6ebcfceb0d03?w=500&q=80', treatments: ['Dry Clean', 'Wash & Iron'] },
      { nameEn: 'Shemagh', nameAr: 'شماغ', category: 'ironing', billingType: 'per_piece', basePrice: 4, imageUrl: 'https://images.unsplash.com/photo-1603251648218-c21c6ba4d9a5?w=500&q=80', treatments: ['Wash & Iron', 'Iron Only'] },
      { nameEn: 'Curtains (per kg)', nameAr: 'ستائر (بالكيلو)', category: 'premium_care', billingType: 'per_kg', basePrice: 10, imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=500&q=80', treatments: ['Wash & Fold'] }
    ];

    const servicesToInsert = defaultServices.map(s => ({
      ...s,
      tenantId: req.tenant._id,
      createdBy: req.user._id
    }));

    const inserted = await LaundryService.insertMany(servicesToInsert);
    res.status(201).json(inserted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/laundry/services
router.post('/', checkPermission('laundry', 'create'), async (req, res) => {
  try {
    const service = new LaundryService({
      ...req.body,
      tenantId: req.tenant._id,
      createdBy: req.user._id
    });
    await service.save();
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT /api/laundry/services/:id
router.put('/:id', checkPermission('laundry', 'update'), async (req, res) => {
  try {
    const service = await LaundryService.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/laundry/services/:id
router.delete('/:id', checkPermission('laundry', 'delete'), async (req, res) => {
  try {
    const service = await LaundryService.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenant._id },
      { isActive: false },
      { new: true }
    );
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ message: 'Service deactivated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
