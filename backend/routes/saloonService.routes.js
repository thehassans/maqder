import express from 'express';
import { checkPermission } from '../middleware/auth.js';
import SaloonService from '../models/SaloonService.js';
import { generateActivityLog } from '../utils/activityLog.js';

const router = express.Router();

// @route   GET /api/saloon/services
router.get('/', checkPermission('saloon', 'read'), async (req, res) => {
  try {
    const { isActive, category } = req.query;
    const query = { tenantId: req.user.tenantId };
    
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (category) query.category = category;
    
    const services = await SaloonService.find(query).sort({ category: 1, nameEn: 1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/saloon/services
router.post('/', checkPermission('saloon', 'create'), async (req, res) => {
  try {
    const service = new SaloonService({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    });
    
    await service.save();
    generateActivityLog(req, 'saloon_service_created', `Created saloon service: ${service.nameEn}`, service._id, 'SaloonService');
    
    res.status(201).json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   PUT /api/saloon/services/:id
router.put('/:id', checkPermission('saloon', 'update'), async (req, res) => {
  try {
    const service = await SaloonService.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!service) return res.status(404).json({ error: 'Service not found' });
    
    generateActivityLog(req, 'saloon_service_updated', `Updated saloon service: ${service.nameEn}`, service._id, 'SaloonService');
    res.json(service);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// @route   DELETE /api/saloon/services/:id
router.delete('/:id', checkPermission('saloon', 'delete'), async (req, res) => {
  try {
    const service = await SaloonService.findOneAndDelete({ 
      _id: req.params.id, 
      tenantId: req.user.tenantId 
    });
    
    if (!service) return res.status(404).json({ error: 'Service not found' });
    
    generateActivityLog(req, 'saloon_service_deleted', `Deleted saloon service: ${service.nameEn}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/saloon/services/seed
router.post('/seed', checkPermission('saloon', 'create'), async (req, res) => {
  try {
    const existing = await SaloonService.countDocuments({ tenantId: req.user.tenantId });
    if (existing > 0) {
      return res.status(400).json({ error: 'Services already exist for this tenant. Cannot seed.' });
    }

    const demoServices = [
      {
        nameEn: 'Men\'s Haircut', nameAr: 'حلاقة شعر رجالي',
        category: 'Hair', durationMinutes: 30, price: 50, taxRate: 15,
        imageUrl: '/defaults/saloon/mens_haircut.png'
      },
      {
        nameEn: 'Beard Trim & Shape', nameAr: 'تحديد وتشذيب اللحية',
        category: 'Beard', durationMinutes: 20, price: 30, taxRate: 15,
        imageUrl: '/defaults/saloon/beard_trim.png'
      },
      {
        nameEn: 'Hot Towel Shave', nameAr: 'حلاقة بالمنشفة الساخنة',
        category: 'Beard', durationMinutes: 30, price: 40, taxRate: 15,
        imageUrl: '/defaults/saloon/hot_towel_shave.png'
      },
      {
        nameEn: 'Hair Dye / Color', nameAr: 'صبغة شعر',
        category: 'Hair', durationMinutes: 60, price: 100, taxRate: 15,
        imageUrl: '/defaults/saloon/hair_dye.png'
      },
      {
        nameEn: 'Facial Treatment', nameAr: 'تنظيف بشرة',
        category: 'Skin', durationMinutes: 45, price: 80, taxRate: 15,
        imageUrl: '/defaults/saloon/hot_towel_shave.png' // re-use hot towel image for facial
      },
      {
        nameEn: 'Kid\'s Haircut', nameAr: 'حلاقة أطفال',
        category: 'Hair', durationMinutes: 20, price: 35, taxRate: 15,
        imageUrl: '/defaults/saloon/mens_haircut.png' // re-use haircut image
      }
    ];

    const services = demoServices.map(s => ({
      ...s,
      tenantId: req.user.tenantId,
      createdBy: req.user._id
    }));

    await SaloonService.insertMany(services);
    res.status(201).json({ success: true, count: services.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
