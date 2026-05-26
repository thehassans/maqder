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

    const defaultServicesRaw = [
      { nameEn: 'Shirt Wash & Iron', nameAr: 'غسيل وكوي قميص', category: 'wash_fold', billingType: 'per_piece', basePrice: 5, imgName: 'shirt', treatments: ['Wash & Iron', 'Dry Clean'] },
      { nameEn: 'T-Shirt Wash & Fold', nameAr: 'غسيل وطي تي شيرت', category: 'wash_fold', billingType: 'per_piece', basePrice: 3, imgName: 'tshirt', treatments: ['Wash & Fold'] },
      { nameEn: 'Pants / Trousers', nameAr: 'بنطلون', category: 'dry_clean', billingType: 'per_piece', basePrice: 7, imgName: 'pants', treatments: ['Dry Clean', 'Wash & Iron'] },
      { nameEn: 'Suit (2 Piece)', nameAr: 'بدلة قطعتين', category: 'dry_clean', billingType: 'per_piece', basePrice: 25, imgName: 'suit', treatments: ['Dry Clean'] },
      { nameEn: 'Dress', nameAr: 'فستان', category: 'dry_clean', billingType: 'per_piece', basePrice: 20, imgName: 'dress', treatments: ['Dry Clean', 'Wash & Iron'] },
      { nameEn: 'Blanket / Comforter', nameAr: 'بطانية / لحاف', category: 'premium_care', billingType: 'per_piece', basePrice: 35, imgName: 'blanket', treatments: ['Wash & Fold'] },
      { nameEn: 'Carpet (per SQM)', nameAr: 'سجاد (بالمتر المربع)', category: 'premium_care', billingType: 'per_kg', basePrice: 15, imgName: 'carpet', treatments: ['Wash'] },
      { nameEn: 'Jacket / Coat', nameAr: 'جاكيت / معطف', category: 'dry_clean', billingType: 'per_piece', basePrice: 18, imgName: 'jacket', treatments: ['Dry Clean'] },
      { nameEn: 'Thobe (Traditional)', nameAr: 'ثوب', category: 'wash_fold', billingType: 'per_piece', basePrice: 6, imgName: 'thobe', treatments: ['Wash & Iron', 'Dry Clean'] },
      { nameEn: 'Abaya', nameAr: 'عباية', category: 'dry_clean', billingType: 'per_piece', basePrice: 15, imgName: 'abaya', treatments: ['Dry Clean', 'Wash & Iron'] },
      { nameEn: 'Shemagh', nameAr: 'شماغ', category: 'ironing', billingType: 'per_piece', basePrice: 4, imgName: 'shemagh', treatments: ['Wash & Iron', 'Iron Only'] },
      { nameEn: 'Curtains (per kg)', nameAr: 'ستائر (بالكيلو)', category: 'premium_care', billingType: 'per_kg', basePrice: 10, imgName: 'curtains', treatments: ['Wash & Fold'] }
    ];

    const defaultServices = defaultServicesRaw.map(s => {
      const { imgName, ...rest } = s;
      return {
        ...rest,
        imageUrl: `/images/laundry/${imgName}.webp`
      };
    });

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
