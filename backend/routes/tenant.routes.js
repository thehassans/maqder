import express from 'express';
import Tenant from '../models/Tenant.js';
import { protect, authorize } from '../middleware/auth.js';
import ZatcaService from '../utils/zatca/ZatcaService.js';
import zlib from 'zlib';
import Customer from '../models/Customer.js';
import Employee from '../models/Employee.js';
import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import Product from '../models/Product.js';
import Project from '../models/Project.js';
import PurchaseOrder from '../models/PurchaseOrder.js';
import Shipment from '../models/Shipment.js';
import Supplier from '../models/Supplier.js';
import Task from '../models/Task.js';
import Warehouse from '../models/Warehouse.js';
import Payroll from '../models/Payroll.js';
import IoTDevice from '../models/IoTDevice.js';
import IoTReading from '../models/IoTReading.js';
import { WhatsAppConfig, WhatsAppContact, WhatsAppMessage, WhatsAppTemplate, QuickReply, Broadcast } from '../models/WhatsApp.js';
import { getPrimaryBusinessType, normalizeBusinessTypes } from '../utils/businessTypes.js';

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
    const { business, settings, branding, businessType, businessTypes } = req.body;
    
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
      const currentSettings = tenant.settings?.toObject?.() || tenant.settings || {};
      tenant.settings = {
        ...currentSettings,
        ...settings,
        communication: {
          ...(currentSettings.communication || {}),
          ...(settings.communication || {}),
          email: {
            ...(currentSettings.communication?.email || {}),
            ...(settings.communication?.email || {}),
          },
        },
        saudiIntegrations: {
          ...(currentSettings.saudiIntegrations || {}),
          ...(settings.saudiIntegrations || {}),
          gosi: {
            ...(currentSettings.saudiIntegrations?.gosi || {}),
            ...(settings.saudiIntegrations?.gosi || {}),
          },
        },
        invoiceBranding: {
          ...(currentSettings.invoiceBranding || {}),
          ...(settings.invoiceBranding || {}),
        },
      };
    }
    
    if (branding) {
      tenant.branding = { ...tenant.branding?.toObject?.() || tenant.branding || {}, ...branding };
    }

    if (businessType || businessTypes) {
      const nextBusinessTypes = normalizeBusinessTypes(businessTypes || businessType || tenant.businessTypes || tenant.businessType);
      tenant.businessTypes = nextBusinessTypes;
      tenant.businessType = businessType && nextBusinessTypes.includes(businessType)
        ? businessType
        : getPrimaryBusinessType({ businessTypes: nextBusinessTypes, businessType: tenant.businessType });
    }

    tenant.markModified('business');
    tenant.markModified('settings');
    tenant.markModified('branding');
    tenant.markModified('businessType');
    tenant.markModified('businessTypes');
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

router.post('/zatca/test-connection', authorize('admin'), async (req, res) => {
  try {
    const { type = 'phase1' } = req.body || {};
    const tenant = await Tenant.findById(req.user.tenantId)
      .select('business zatca');

    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const business = tenant.business || {};
    const missingFields = [];

    if (!business.legalNameEn && !business.legalNameAr) missingFields.push('legalName');
    if (!business.vatNumber) missingFields.push('vatNumber');
    if (!business.crNumber) missingFields.push('crNumber');
    if (!business.address?.city) missingFields.push('address.city');
    if (!business.address?.district) missingFields.push('address.district');
    if (!business.address?.country) missingFields.push('address.country');

    if (type === 'phase2') {
      return res.json({
        success: true,
        type,
        status: tenant.zatca?.isOnboarded ? 'connected' : 'not_connected',
        checks: {
          hasPrivateKey: Boolean(tenant.zatca?.privateKey),
          hasComplianceCsid: Boolean(tenant.zatca?.complianceCsid),
          hasProductionCsid: Boolean(tenant.zatca?.productionCsid),
          isOnboarded: Boolean(tenant.zatca?.isOnboarded),
        },
        missingFields,
      });
    }

    if (type !== 'phase1') {
      return res.status(400).json({ error: 'Unsupported test type' });
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        type,
        status: 'missing_configuration',
        error: 'Missing required company details for ZATCA Phase 1 test',
        missingFields,
      });
    }

    const sampleIssueDate = new Date();
    const sampleInvoice = {
      invoiceNumber: `PH1-TEST-${Date.now()}`,
      invoiceType: '388',
      invoiceTypeCode: '0200000',
      issueDate: sampleIssueDate,
      issueTime: sampleIssueDate.toISOString().slice(11, 19),
      currency: 'SAR',
      buyer: {
        name: 'Phase 1 Test Customer',
        address: { country: 'SA' },
      },
      totalDiscount: 0,
      taxableAmount: 100,
      totalTax: 15,
      grandTotal: 115,
      lineItems: [{
        lineNumber: 1,
        productName: 'Phase 1 Test Item',
        quantity: 1,
        unitCode: 'PCE',
        unitPrice: 100,
        lineTotal: 100,
        taxAmount: 15,
        taxRate: 15,
        lineTotalWithTax: 115,
      }],
    };

    const zatcaService = new ZatcaService();
    const xml = zatcaService.generateXML(sampleInvoice, business, true);
    const invoiceHash = zatcaService.calculateHash(xml);
    const qrCodeData = zatcaService.generateTLV({
      sellerName: business.legalNameAr || business.legalNameEn,
      vatNumber: business.vatNumber,
      timestamp: sampleIssueDate.toISOString(),
      totalWithVat: sampleInvoice.grandTotal.toFixed(2),
      vatTotal: sampleInvoice.totalTax.toFixed(2),
    });
    const qrCodeImage = await zatcaService.generateQRCode(qrCodeData);

    return res.json({
      success: true,
      type,
      status: 'ready',
      checks: {
        vatConfigured: Boolean(business.vatNumber),
        crConfigured: Boolean(business.crNumber),
        xmlGenerated: Boolean(xml),
        hashGenerated: Boolean(invoiceHash),
        qrGenerated: Boolean(qrCodeImage),
      },
      missingFields,
      sample: {
        invoiceNumber: sampleInvoice.invoiceNumber,
        invoiceHash,
        qrCodeImage,
        xmlPreview: xml.slice(0, 400),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/backup', authorize('admin'), async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(404).json({ error: 'No tenant associated with user' });
    }

    const tenant = await Tenant.findById(req.user.tenantId).lean();
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `backup_${tenant.slug || tenant._id}_${dateStr}.jsonl.gz`;

    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    const gzip = zlib.createGzip({ level: zlib.constants.Z_BEST_SPEED });
    gzip.pipe(res);

    const writeLine = (obj) => gzip.write(`${JSON.stringify(obj)}\n`);

    writeLine({
      type: 'meta',
      version: 1,
      generatedAt: new Date().toISOString(),
      tenantId: String(req.user.tenantId),
    });

    writeLine({ type: 'tenant', doc: tenant });

    const collections = [
      { name: 'customers', model: Customer },
      { name: 'suppliers', model: Supplier },
      { name: 'employees', model: Employee },
      { name: 'payrolls', model: Payroll },
      { name: 'expenses', model: Expense },
      { name: 'invoices', model: Invoice },
      { name: 'products', model: Product },
      { name: 'warehouses', model: Warehouse },
      { name: 'projects', model: Project },
      { name: 'tasks', model: Task },
      { name: 'purchaseOrders', model: PurchaseOrder },
      { name: 'shipments', model: Shipment },
      { name: 'iotDevices', model: IoTDevice },
      { name: 'iotReadings', model: IoTReading },
      { name: 'whatsAppConfig', model: WhatsAppConfig },
      { name: 'whatsAppContacts', model: WhatsAppContact },
      { name: 'whatsAppMessages', model: WhatsAppMessage },
      { name: 'whatsAppTemplates', model: WhatsAppTemplate },
      { name: 'quickReplies', model: QuickReply },
      { name: 'broadcasts', model: Broadcast },
    ];

    for (const c of collections) {
      const cursor = c.model.find({ tenantId: req.user.tenantId }).lean().cursor();
      for await (const doc of cursor) {
        writeLine({ type: 'doc', collection: c.name, doc });
      }
    }

    gzip.end();
  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ error: error.message });
    }
    res.end();
  }
});

export default router;
