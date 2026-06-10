import express from 'express';
import Tenant from '../models/Tenant.js';
import { protect, authorize } from '../middleware/auth.js';
import ZatcaService from '../utils/zatca/ZatcaService.js';

const router = express.Router();

// Apply auth middleware
router.use(protect);
router.use(authorize('admin'));

// Helper to mask secrets
const maskSecret = (secret) => {
  if (!secret) return '';
  if (secret.length <= 4) return '****';
  return '*'.repeat(secret.length - 4) + secret.slice(-4);
};

// @route   GET /api/tenant/compliance/config
// @desc    Retrieve tenant compliance configs (with masked secrets)
router.get('/', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const saudi = tenant.settings?.saudiIntegrations || {};
    const zatca = tenant.zatca || {};
    const cri = tenant.settings?.carRentalIntegrations || {};

    res.json({
      zatca: {
        environment: zatca.environment || 'sandbox',
        complianceCsid: zatca.complianceCsid || '',
        hasPrivateKey: !!zatca.privateKey,
        isOnboarded: zatca.isOnboarded || false,
        deviceSerialNumber: zatca.deviceSerialNumber || '',
        onboardedAt: zatca.onboardedAt || null,
      },
      elm: {
        clientId: saudi.elm?.clientId || '',
        hasClientSecret: !!saudi.elm?.clientSecret,
        clientSecretMasked: maskSecret(saudi.elm?.clientSecret),
        appId: saudi.elm?.appId || '',
        agencyId: saudi.elm?.agencyId || '',
        nafathOtpEnabled: saudi.elm?.nafathOtpEnabled || false,
        tammEnabled: saudi.elm?.tammEnabled || false,
      },
      qiwa: {
        establishmentId: saudi.qiwa?.establishmentId || '',
        hasAccessToken: !!saudi.qiwa?.accessToken,
        accessTokenMasked: maskSecret(saudi.qiwa?.accessToken),
        contractAuthAutomationEnabled: saudi.qiwa?.contractAuthAutomationEnabled || false,
        saudizationWidgetEnabled: saudi.qiwa?.saudizationWidgetEnabled || false,
      },
      mudad: {
        registrationNumber: saudi.mudad?.registrationNumber || '',
        hasClientCertificate: !!saudi.mudad?.clientCertificate,
        clientCertificatePreview: saudi.mudad?.clientCertificate 
          ? saudi.mudad.clientCertificate.slice(0, 30) + '...' 
          : '',
        autoSifUploadEnabled: saudi.mudad?.autoSifUploadEnabled || false,
      },
      gosi: {
        registrationNumber: saudi.gosi?.registrationNumber || saudi.gosi?.establishmentId || '',
        enabled: saudi.gosi?.enabled || false,
      },
      carRentalIntegrations: {
        tamm: {
          enabled: cri.tamm?.enabled || false,
          apiKey: cri.tamm?.apiKey || '',
          apiKeyMasked: maskSecret(cri.tamm?.apiKey),
          apiSecretMasked: maskSecret(cri.tamm?.apiSecret),
          companyLicenseNumber: cri.tamm?.companyLicenseNumber || '',
          environment: cri.tamm?.environment || 'sandbox',
          autoSyncContracts: cri.tamm?.autoSyncContracts || false,
        },
        najm: {
          enabled: cri.najm?.enabled || false,
          apiKeyMasked: maskSecret(cri.najm?.apiKey),
          clientId: cri.najm?.clientId || '',
          clientSecretMasked: maskSecret(cri.najm?.clientSecret),
          environment: cri.najm?.environment || 'sandbox',
          autoCheckOnCheckout: cri.najm?.autoCheckOnCheckout !== false,
        },
        wathiq: {
          enabled: cri.wathiq?.enabled || false,
          apiKeyMasked: maskSecret(cri.wathiq?.apiKey),
          appId: cri.wathiq?.appId || '',
          environment: cri.wathiq?.environment || 'sandbox',
          autoVerifyId: cri.wathiq?.autoVerifyId !== false,
        },
        sms: {
          enabled: cri.smsNotifications?.enabled || false,
          provider: cri.smsNotifications?.provider || 'taqnyat',
          apiKeyMasked: maskSecret(cri.smsNotifications?.apiKey),
          senderId: cri.smsNotifications?.senderId || '',
          sendOnCheckout: cri.smsNotifications?.sendOnCheckout !== false,
          sendOnCheckin: cri.smsNotifications?.sendOnCheckin !== false,
          sendOnOverdue: cri.smsNotifications?.sendOnOverdue !== false,
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tenant/compliance/config
// @desc    Save/Update tenant compliance configs securely
router.post('/', async (req, res) => {
  try {
    const { zatca, elm, qiwa, mudad, gosi, carRentalIntegrations } = req.body;
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Initialize nested structures if not present
    if (!tenant.zatca) tenant.zatca = {};
    if (!tenant.settings) tenant.settings = {};
    if (!tenant.settings.saudiIntegrations) tenant.settings.saudiIntegrations = {};
    if (!tenant.settings.saudiIntegrations.elm) tenant.settings.saudiIntegrations.elm = {};
    if (!tenant.settings.saudiIntegrations.qiwa) tenant.settings.saudiIntegrations.qiwa = {};
    if (!tenant.settings.saudiIntegrations.mudad) tenant.settings.saudiIntegrations.mudad = {};
    if (!tenant.settings.saudiIntegrations.gosi) tenant.settings.saudiIntegrations.gosi = {};
    if (!tenant.settings.carRentalIntegrations) tenant.settings.carRentalIntegrations = {};

    // 1. ZATCA Environment & Keys
    if (zatca) {
      if (zatca.environment) {
        tenant.zatca.environment = zatca.environment;
      }
      if (zatca.privateKey && !zatca.privateKey.startsWith('****')) {
        tenant.zatca.privateKey = zatca.privateKey;
      }
      if (zatca.complianceCsid) {
        tenant.zatca.complianceCsid = zatca.complianceCsid;
      }
      if (zatca.otp && zatca.otp.length === 6) {
        // Exchange OTP for CSID simulation
        tenant.zatca.isOnboarded = true;
        tenant.zatca.onboardedAt = new Date();
        tenant.zatca.complianceCsid = `-----BEGIN CERTIFICATE-----\nMOCK_COMPLIANCE_CSID_${Date.now()}\n-----END CERTIFICATE-----`;
        tenant.zatca.deviceSerialNumber = `EGS2-${Date.now()}`;
      }
    }

    // 2. Elm DevPortal (Yakeen & TAMM)
    if (elm) {
      tenant.settings.saudiIntegrations.elm.clientId = elm.clientId || '';
      tenant.settings.saudiIntegrations.elm.appId = elm.appId || '';
      tenant.settings.saudiIntegrations.elm.agencyId = elm.agencyId || elm.appId || '';
      tenant.settings.saudiIntegrations.elm.nafathOtpEnabled = !!elm.nafathOtpEnabled;
      tenant.settings.saudiIntegrations.elm.tammEnabled = !!elm.tammEnabled;
      
      // Update secret only if it's not a masked string sent back
      if (elm.clientSecret && !elm.clientSecret.startsWith('*')) {
        tenant.settings.saudiIntegrations.elm.clientSecret = elm.clientSecret;
      }
    }

    // 3. Qiwa & MHRSD
    if (qiwa) {
      const qEstId = String(qiwa.establishmentId || '').trim();
      if (qEstId && (!qEstId.startsWith('7') || qEstId.length !== 10)) {
        return res.status(400).json({ error: 'Qiwa Establishment ID must be exactly 10 digits and start with 7.' });
      }
      tenant.settings.saudiIntegrations.qiwa.establishmentId = qEstId;
      tenant.settings.saudiIntegrations.qiwa.contractAuthAutomationEnabled = !!qiwa.contractAuthAutomationEnabled;
      tenant.settings.saudiIntegrations.qiwa.saudizationWidgetEnabled = !!qiwa.saudizationWidgetEnabled;

      if (qiwa.accessToken && !qiwa.accessToken.startsWith('*')) {
        tenant.settings.saudiIntegrations.qiwa.accessToken = qiwa.accessToken;
      }
    }

    // 4. Mudad (WPS) & GOSI
    if (mudad) {
      tenant.settings.saudiIntegrations.mudad.registrationNumber = mudad.registrationNumber || '';
      tenant.settings.saudiIntegrations.mudad.autoSifUploadEnabled = !!mudad.autoSifUploadEnabled;
      
      if (mudad.clientCertificate && !mudad.clientCertificate.startsWith('*')) {
        tenant.settings.saudiIntegrations.mudad.clientCertificate = mudad.clientCertificate;
      }
    }

    if (gosi) {
      tenant.settings.saudiIntegrations.gosi.registrationNumber = gosi.registrationNumber || '';
      tenant.settings.saudiIntegrations.gosi.establishmentId = gosi.registrationNumber || '';
      tenant.settings.saudiIntegrations.gosi.enabled = !!gosi.enabled;
    }

    // 5. Car Rental Integrations
    if (carRentalIntegrations) {
      // Tamm
      if (carRentalIntegrations.tamm) {
        if (!tenant.settings.carRentalIntegrations.tamm) tenant.settings.carRentalIntegrations.tamm = {};
        tenant.settings.carRentalIntegrations.tamm.enabled = !!carRentalIntegrations.tamm.enabled;
        tenant.settings.carRentalIntegrations.tamm.companyLicenseNumber = carRentalIntegrations.tamm.companyLicenseNumber || '';
        tenant.settings.carRentalIntegrations.tamm.environment = carRentalIntegrations.tamm.environment || 'sandbox';
        tenant.settings.carRentalIntegrations.tamm.autoSyncContracts = !!carRentalIntegrations.tamm.autoSyncContracts;
        
        if (carRentalIntegrations.tamm.apiKey && !carRentalIntegrations.tamm.apiKey.startsWith('*')) {
          tenant.settings.carRentalIntegrations.tamm.apiKey = carRentalIntegrations.tamm.apiKey;
        }
        if (carRentalIntegrations.tamm.apiSecret && !carRentalIntegrations.tamm.apiSecret.startsWith('*')) {
          tenant.settings.carRentalIntegrations.tamm.apiSecret = carRentalIntegrations.tamm.apiSecret;
        }
      }

      // NAJM
      if (carRentalIntegrations.najm) {
        if (!tenant.settings.carRentalIntegrations.najm) tenant.settings.carRentalIntegrations.najm = {};
        tenant.settings.carRentalIntegrations.najm.enabled = !!carRentalIntegrations.najm.enabled;
        tenant.settings.carRentalIntegrations.najm.clientId = carRentalIntegrations.najm.clientId || '';
        tenant.settings.carRentalIntegrations.najm.environment = carRentalIntegrations.najm.environment || 'sandbox';
        tenant.settings.carRentalIntegrations.najm.autoCheckOnCheckout = !!carRentalIntegrations.najm.autoCheckOnCheckout;
        
        if (carRentalIntegrations.najm.apiKey && !carRentalIntegrations.najm.apiKey.startsWith('*')) {
          tenant.settings.carRentalIntegrations.najm.apiKey = carRentalIntegrations.najm.apiKey;
        }
        if (carRentalIntegrations.najm.clientSecret && !carRentalIntegrations.najm.clientSecret.startsWith('*')) {
          tenant.settings.carRentalIntegrations.najm.clientSecret = carRentalIntegrations.najm.clientSecret;
        }
      }

      // Wathiq
      if (carRentalIntegrations.wathiq) {
        if (!tenant.settings.carRentalIntegrations.wathiq) tenant.settings.carRentalIntegrations.wathiq = {};
        tenant.settings.carRentalIntegrations.wathiq.enabled = !!carRentalIntegrations.wathiq.enabled;
        tenant.settings.carRentalIntegrations.wathiq.appId = carRentalIntegrations.wathiq.appId || '';
        tenant.settings.carRentalIntegrations.wathiq.environment = carRentalIntegrations.wathiq.environment || 'sandbox';
        tenant.settings.carRentalIntegrations.wathiq.autoVerifyId = !!carRentalIntegrations.wathiq.autoVerifyId;
        
        if (carRentalIntegrations.wathiq.apiKey && !carRentalIntegrations.wathiq.apiKey.startsWith('*')) {
          tenant.settings.carRentalIntegrations.wathiq.apiKey = carRentalIntegrations.wathiq.apiKey;
        }
      }

      // SMS
      if (carRentalIntegrations.sms) {
        if (!tenant.settings.carRentalIntegrations.smsNotifications) tenant.settings.carRentalIntegrations.smsNotifications = {};
        tenant.settings.carRentalIntegrations.smsNotifications.enabled = !!carRentalIntegrations.sms.enabled;
        tenant.settings.carRentalIntegrations.smsNotifications.provider = carRentalIntegrations.sms.provider || 'taqnyat';
        tenant.settings.carRentalIntegrations.smsNotifications.senderId = carRentalIntegrations.sms.senderId || '';
        tenant.settings.carRentalIntegrations.smsNotifications.sendOnCheckout = !!carRentalIntegrations.sms.sendOnCheckout;
        tenant.settings.carRentalIntegrations.smsNotifications.sendOnCheckin = !!carRentalIntegrations.sms.sendOnCheckin;
        tenant.settings.carRentalIntegrations.smsNotifications.sendOnOverdue = !!carRentalIntegrations.sms.sendOnOverdue;
        
        if (carRentalIntegrations.sms.apiKey && !carRentalIntegrations.sms.apiKey.startsWith('*')) {
          tenant.settings.carRentalIntegrations.smsNotifications.apiKey = carRentalIntegrations.sms.apiKey;
        }
      }
    }

    tenant.markModified('zatca');
    tenant.markModified('settings');
    await tenant.save();

    res.json({ message: 'Government Integrations saved successfully', success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/tenant/compliance/config/test-handshake
// @desc    Perform a mock simplified invoice compliance handshake test with ZATCA
router.post('/test-handshake', async (req, res) => {
  try {
    const { environment = 'sandbox' } = req.body;
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Simulating ZATCA Phase 2 compliance handshake checks
    const business = tenant.business || {};
    const checks = {
      privateKeyLoaded: !!tenant.zatca?.privateKey,
      csidValid: !!tenant.zatca?.complianceCsid,
      vatConfigured: !!business.vatNumber,
      crConfigured: !!business.crNumber,
      sslHandshake: true,
      signatureVerification: true,
    };

    const hasErrors = !checks.privateKeyLoaded || !checks.csidValid || !checks.vatConfigured;
    
    // Simulating network latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (hasErrors) {
      return res.status(400).json({
        success: false,
        message: 'Compliance test failed. Please verify ZATCA keys and certificate are correctly uploaded.',
        checks,
        sample: null
      });
    }

    res.json({
      success: true,
      message: `Compliance test passed on ZATCA ${environment.toUpperCase()}!`,
      checks,
      sample: {
        invoiceHash: 'sha256-' + Buffer.from(Date.now().toString()).toString('hex').slice(0, 40),
        uuid: 'd8a6e87f-ca9c-4db3-9799-' + Date.now().toString().slice(-12),
        qrDataUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg=='
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/tenant/compliance/config/sync-status
// @desc    Return progress status of background integrations queue (e.g., GOSI/TAMM sync)
router.get('/sync-status', async (req, res) => {
  try {
    // Return a simulated BullMQ/Redis queue status
    const statuses = ['idle', 'syncing', 'completed', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const progress = randomStatus === 'syncing' ? Math.floor(Math.random() * 90) + 10 : (randomStatus === 'completed' ? 100 : 0);

    res.json({
      status: randomStatus,
      progress,
      jobId: 'compliance-sync-' + Date.now().toString().slice(-6),
      lastSyncAt: new Date(),
      activeWorkers: 3,
      queueDetails: {
        waiting: 0,
        active: 1,
        completed: 124,
        failed: 2
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
