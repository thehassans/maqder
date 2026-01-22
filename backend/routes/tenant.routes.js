import express from 'express';
import Tenant from '../models/Tenant.js';
import { protect, authorize } from '../middleware/auth.js';
import ZatcaService from '../utils/zatca/ZatcaService.js';

const router = express.Router();

router.use(protect);

// @route   GET /api/tenants/current
router.get('/current', async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(404).json({ error: 'No tenant associated with user' });
    }
    
    const tenant = await Tenant.findById(req.user.tenantId);
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/tenants/current
router.put('/current', authorize('admin'), async (req, res) => {
  try {
    const { business, settings, branding } = req.body;
    
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Merge business fields instead of replacing entire object
    if (business) {
      tenant.business = {
        ...tenant.business?.toObject?.() || tenant.business || {},
        ...business,
        address: {
          ...tenant.business?.address?.toObject?.() || tenant.business?.address || {},
          ...business.address
        }
      };
    }
    
    if (settings) {
      tenant.settings = { ...tenant.settings?.toObject?.() || tenant.settings || {}, ...settings };
    }
    
    if (branding) {
      tenant.branding = { ...tenant.branding?.toObject?.() || tenant.branding || {}, ...branding };
    }

    tenant.markModified('business');
    tenant.markModified('settings');
    tenant.markModified('branding');
    await tenant.save();
    
    res.json(tenant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tenants/zatca/generate-keys
router.post('/zatca/generate-keys', authorize('admin'), async (req, res) => {
  try {
    const { privateKey, publicKey } = ZatcaService.generateKeyPair();
    
    await Tenant.findByIdAndUpdate(req.user.tenantId, {
      'zatca.privateKey': privateKey
    });
    
    res.json({
      message: 'Keys generated successfully',
      publicKey
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tenants/zatca/onboard
router.post('/zatca/onboard', authorize('admin'), async (req, res) => {
  try {
    const { otp } = req.body;
    const tenant = await Tenant.findById(req.user.tenantId);
    
    if (!tenant.zatca?.privateKey) {
      return res.status(400).json({ error: 'Generate keys first' });
    }
    
    // In production, this would call ZATCA API for compliance check
    // and exchange OTP for CSID
    
    await Tenant.findByIdAndUpdate(req.user.tenantId, {
      'zatca.isOnboarded': true,
      'zatca.onboardedAt': new Date(),
      'zatca.deviceSerialNumber': `EGS1-${Date.now()}`
    });
    
    res.json({ message: 'ZATCA onboarding initiated', status: 'pending_verification' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/tenants/zatca/status
router.get('/zatca/status', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId)
      .select('zatca.isOnboarded zatca.onboardedAt zatca.invoiceCounter zatca.deviceSerialNumber');
    
    res.json({
      isOnboarded: tenant.zatca?.isOnboarded || false,
      onboardedAt: tenant.zatca?.onboardedAt,
      invoiceCounter: tenant.zatca?.invoiceCounter || 0,
      deviceSerialNumber: tenant.zatca?.deviceSerialNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
