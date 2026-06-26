import express from 'express';
import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';
import ZatcaLog from '../models/ZatcaLog.js';
import ZatcaAuditLog from '../models/ZatcaAuditLog.js';
import ZatcaQueue from '../models/ZatcaQueue.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  verifyQrIntegrity,
  computeInvoiceHash,
  verifyHashChain,
  rebuildHashChain,
  generateKeyPair,
  validateZatcaQrFields,
} from '../lib/zatcaQr.js';
import {
  encryptPrivateKey,
  decryptPrivateKey,
  isKeyEncrypted,
  encryptZatcaConfig,
  decryptZatcaConfig,
  createZatcaBackupBundle,
  restoreZatcaBackupBundle,
} from '../utils/zatcaKeyVault.js';
import { getCircuitBreakerStatus, processQueue } from '../services/zatcaQueueProcessor.js';

const router = express.Router();

router.use(protect);
router.use(authorize('super_admin'));

const logAuditEvent = async ({
  tenantId,
  action,
  severity = 'info',
  status = 'success',
  message,
  details = {},
  performedBy = null,
  performedByRole = 'super_admin',
  req = null,
  affectedInvoices = [],
  previousState = null,
  newState = null,
}) => {
  try {
    await ZatcaAuditLog.create({
      tenantId,
      action,
      severity,
      status,
      message,
      details,
      performedBy,
      performedByRole,
      ipAddress: req?.ip || null,
      userAgent: req?.headers?.['user-agent'] || null,
      affectedInvoices,
      previousState,
      newState,
    });
  } catch (err) {
    console.error('[ZatcaAuditLog] Failed to log event:', err.message);
  }
};

// @route   GET /api/super-admin/zatca/audit-logs
// @desc    Get ZATCA audit logs with filtering
router.get('/audit-logs', async (req, res) => {
  try {
    const { tenantId, action, severity, status, page = 1, limit = 50, startDate, endDate } = req.query;
    const query = {};
    if (tenantId) query.tenantId = tenantId;
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ZatcaAuditLog.find(query)
      .populate('tenantId', 'name slug business.legalNameEn')
      .populate('performedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ZatcaAuditLog.countDocuments(query);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/zatca/stats
// @desc    Get global ZATCA compliance statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalTenants,
      onboardedTenants,
      phase1Tenants,
      phase2Tenants,
      totalInvoices,
      syncedInvoices,
      pendingInvoices,
      failedInvoices,
      recentAlerts,
    ] = await Promise.all([
      Tenant.countDocuments({ isActive: true }),
      Tenant.countDocuments({ 'zatca.isOnboarded': true }),
      Tenant.countDocuments({ 'zatca.phase': 1, isActive: true }),
      Tenant.countDocuments({ 'zatca.phase': 2, isActive: true }),
      Invoice.countDocuments({ 'zatca.qrCodeData': { $exists: true, $ne: '' } }),
      Invoice.countDocuments({ 'zatca.submissionStatus': { $in: ['cleared', 'reported', 'submitted'] } }),
      Invoice.countDocuments({ 'zatca.submissionStatus': 'pending' }),
      Invoice.countDocuments({ 'zatca.submissionStatus': { $in: ['rejected', 'failed'] } }),
      ZatcaAuditLog.find({ severity: { $in: ['warning', 'critical'] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('tenantId', 'name slug')
        .lean(),
    ]);

    res.json({
      tenants: {
        total: totalTenants,
        onboarded: onboardedTenants,
        phase1: phase1Tenants,
        phase2: phase2Tenants,
      },
      invoices: {
        total: totalInvoices,
        synced: syncedInvoices,
        pending: pendingInvoices,
        failed: failedInvoices,
      },
      recentAlerts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/zatca/tenant/:id/status
// @desc    Get detailed ZATCA status for a specific tenant
router.get('/tenant/:id/status', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select('name slug business zatca settings.saudiIntegrations');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const invoiceStats = await Invoice.aggregate([
      { $match: { tenantId: tenant._id, 'zatca.qrCodeData': { $exists: true, $ne: '' } } },
      {
        $group: {
          _id: '$zatca.submissionStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const lastInvoice = await Invoice.findOne({ tenantId: tenant._id })
      .sort({ issueDate: -1 })
      .select('invoiceNumber issueDate zatca.invoiceHash zatca.submissionStatus zatca.qrCodeData')
      .lean();

    const recentLogs = await ZatcaAuditLog.find({ tenantId: tenant._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    let qrIntegrity = null;
    if (lastInvoice?.zatca?.qrCodeData) {
      qrIntegrity = verifyQrIntegrity(lastInvoice.zatca.qrCodeData);
    }

    res.json({
      tenant,
      invoiceStats: invoiceStats.reduce((acc, s) => { acc[s._id || 'unknown'] = s.count; return acc; }, {}),
      lastInvoice,
      qrIntegrity,
      recentLogs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/verify-chain
// @desc    Verify the invoice hash chain for a tenant
router.post('/tenant/:id/verify-chain', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const invoices = await Invoice.find({
      tenantId: tenant._id,
      'zatca.qrCodeData': { $exists: true, $ne: '' },
    })
      .sort({ issueDate: 1, createdAt: 1 })
      .select('invoiceNumber issueDate grandTotal totalTax seller lineItems zatca')
      .lean();

    if (invoices.length === 0) {
      return res.json({
        tenantId: tenant._id,
        totalInvoices: 0,
        validLinks: 0,
        brokenLinks: 0,
        results: [],
        message: 'No ZATCA invoices found for this tenant.',
      });
    }

    const DEFAULT_SEED = 'NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==';
    let previousHash = tenant.zatca?.lastInvoiceHash || DEFAULT_SEED;
    const results = [];
    let validLinks = 0;
    let brokenLinks = 0;

    for (const invoice of invoices) {
      const verification = verifyHashChain(invoice, previousHash);
      results.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        valid: verification.valid,
        storedHash: invoice.zatca?.invoiceHash || invoice.zatca?.xmlHash || '',
        expectedHash: verification.expectedChainedHash,
      });

      if (verification.valid) {
        validLinks++;
        previousHash = verification.expectedChainedHash;
      } else {
        brokenLinks++;
        previousHash = invoice.zatca?.invoiceHash || verification.expectedChainedHash;
      }
    }

    await logAuditEvent({
      tenantId: tenant._id,
      action: 'chain_verification',
      severity: brokenLinks > 0 ? 'warning' : 'info',
      status: brokenLinks > 0 ? 'partial' : 'success',
      message: `Chain verification: ${validLinks} valid, ${brokenLinks} broken out of ${invoices.length} invoices`,
      details: { totalInvoices: invoices.length, validLinks, brokenLinks },
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });

    res.json({
      tenantId: tenant._id,
      totalInvoices: invoices.length,
      validLinks,
      brokenLinks,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/rebuild-chain
// @desc    Disaster recovery: rebuild the invoice hash chain for a tenant
router.post('/tenant/:id/rebuild-chain', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { seedHash, dryRun = false } = req.body;

    const invoices = await Invoice.find({
      tenantId: tenant._id,
      'zatca.qrCodeData': { $exists: true, $ne: '' },
    })
      .sort({ issueDate: 1, createdAt: 1 })
      .select('_id invoiceNumber issueDate grandTotal totalTax seller lineItems zatca')
      .lean();

    if (invoices.length === 0) {
      return res.json({
        tenantId: tenant._id,
        rebuilt: 0,
        message: 'No ZATCA invoices found for this tenant.',
      });
    }

    const chainData = rebuildHashChain(invoices, seedHash);

    if (!dryRun) {
      const previousState = {
        lastInvoiceHash: tenant.zatca?.lastInvoiceHash,
        invoiceCounter: tenant.zatca?.invoiceCounter,
      };

      const bulkOps = chainData.map((item) => ({
        updateOne: {
          filter: { _id: item.invoiceId },
          update: {
            $set: {
              'zatca.previousInvoiceHash': item.previousInvoiceHash,
              'zatca.invoiceHash': item.invoiceHash,
            },
          },
        },
      }));

      await Invoice.bulkWrite(bulkOps);

      const lastChainEntry = chainData[chainData.length - 1];
      tenant.zatca = {
        ...(tenant.zatca?.toObject?.() || tenant.zatca || {}),
        lastInvoiceHash: lastChainEntry.invoiceHash,
        invoiceCounter: chainData.length,
      };
      tenant.markModified('zatca');
      await tenant.save();

      const newState = {
        lastInvoiceHash: lastChainEntry.invoiceHash,
        invoiceCounter: chainData.length,
      };

      await logAuditEvent({
        tenantId: tenant._id,
        action: 'chain_recovery',
        severity: 'critical',
        status: 'success',
        message: `Hash chain rebuilt for ${chainData.length} invoices`,
        details: { seedHash: seedHash || 'default', invoiceCount: chainData.length, dryRun: false },
        performedBy: req.user?.id,
        performedByRole: 'super_admin',
        req,
        affectedInvoices: chainData.map((c) => c.invoiceId),
        previousState,
        newState,
      });
    } else {
      await logAuditEvent({
        tenantId: tenant._id,
        action: 'chain_recovery',
        severity: 'info',
        status: 'success',
        message: `Chain rebuild dry run for ${chainData.length} invoices`,
        details: { invoiceCount: chainData.length, dryRun: true },
        performedBy: req.user?.id,
        performedByRole: 'super_admin',
        req,
      });
    }

    res.json({
      tenantId: tenant._id,
      rebuilt: chainData.length,
      dryRun,
      chain: chainData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/rotate-keys
// @desc    Generate a new ECDSA key pair for a tenant (key rotation)
router.post('/tenant/:id/rotate-keys', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const previousState = {
      hasPrivateKey: !!tenant.zatca?.privateKey,
      hasComplianceCsid: !!tenant.zatca?.complianceCsid,
    };

    const { privateKey, publicKey } = generateKeyPair();

    if (!tenant.zatca) tenant.zatca = {};
    tenant.zatca.privateKey = privateKey;
    tenant.zatca.publicKey = publicKey;
    tenant.zatca.keyRotatedAt = new Date();
    tenant.zatca.isOnboarded = false;
    tenant.zatca.complianceCsid = '';
    tenant.markModified('zatca');
    await tenant.save();

    const newState = {
      hasPrivateKey: true,
      hasPublicKey: true,
      keyRotatedAt: tenant.zatca.keyRotatedAt,
      isOnboarded: false,
    };

    await logAuditEvent({
      tenantId: tenant._id,
      action: 'key_rotation',
      severity: 'critical',
      status: 'success',
      message: 'ZATCA ECDSA key pair rotated. Tenant must re-onboard with new CSR.',
      details: { keyRotatedAt: tenant.zatca.keyRotatedAt },
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
      previousState,
      newState,
    });

    res.json({
      success: true,
      message: 'Key pair generated. Tenant must re-onboard with ZATCA using the new keys.',
      keyRotatedAt: tenant.zatca.keyRotatedAt,
      publicKeyPreview: publicKey.substring(0, 50) + '...',
    });
  } catch (error) {
    await logAuditEvent({
      tenantId: req.params.id,
      action: 'key_rotation',
      severity: 'critical',
      status: 'failed',
      message: `Key rotation failed: ${error.message}`,
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/verify-qr
// @desc    Verify QR integrity for all invoices of a tenant
router.post('/tenant/:id/verify-qr', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const invoices = await Invoice.find({
      tenantId: tenant._id,
      'zatca.qrCodeData': { $exists: true, $ne: '' },
    })
      .select('invoiceNumber zatca.qrCodeData')
      .sort({ issueDate: -1 })
      .limit(500)
      .lean();

    const results = [];
    let validCount = 0;
    let invalidCount = 0;

    for (const invoice of invoices) {
      const integrity = verifyQrIntegrity(invoice.zatca.qrCodeData);
      results.push({
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        valid: integrity.valid,
        errors: integrity.errors,
        decoded: integrity.decoded,
      });
      if (integrity.valid) validCount++;
      else invalidCount++;
    }

    await logAuditEvent({
      tenantId: tenant._id,
      action: 'qr_integrity_check',
      severity: invalidCount > 0 ? 'warning' : 'info',
      status: invalidCount > 0 ? 'partial' : 'success',
      message: `QR integrity check: ${validCount} valid, ${invalidCount} invalid out of ${invoices.length}`,
      details: { totalChecked: invoices.length, validCount, invalidCount },
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });

    res.json({
      tenantId: tenant._id,
      totalChecked: invoices.length,
      validCount,
      invalidCount,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/zatca/tenant/:id/logs
// @desc    Get ZATCA logs for a specific tenant
router.get('/tenant/:id/logs', async (req, res) => {
  try {
    const { page = 1, limit = 50, action, status, startDate, endDate } = req.query;
    const query = { tenantId: req.params.id };
    if (action) query.action = action;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      ZatcaAuditLog.find(query)
        .populate('performedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      ZatcaAuditLog.countDocuments(query),
    ]);

    res.json({
      logs,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/disaster-recovery
// @desc    Full disaster recovery: rebuild chain + regenerate QR codes + audit log
router.post('/tenant/:id/disaster-recovery', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { seedHash, regenerateQr = false } = req.body;
    const previousState = {
      lastInvoiceHash: tenant.zatca?.lastInvoiceHash,
      invoiceCounter: tenant.zatca?.invoiceCounter,
      isOnboarded: tenant.zatca?.isOnboarded,
    };

    const invoices = await Invoice.find({
      tenantId: tenant._id,
      'zatca.qrCodeData': { $exists: true, $ne: '' },
    })
      .sort({ issueDate: 1, createdAt: 1 })
      .lean();

    if (invoices.length === 0) {
      return res.json({
        tenantId: tenant._id,
        recovered: 0,
        message: 'No ZATCA invoices found for this tenant.',
      });
    }

    const chainData = rebuildHashChain(invoices, seedHash);

    const bulkOps = chainData.map((item) => ({
      updateOne: {
        filter: { _id: item.invoiceId },
        update: {
          $set: {
            'zatca.previousInvoiceHash': item.previousInvoiceHash,
            'zatca.invoiceHash': item.invoiceHash,
          },
        },
      },
    }));

    await Invoice.bulkWrite(bulkOps);

    const lastChainEntry = chainData[chainData.length - 1];
    tenant.zatca = {
      ...(tenant.zatca?.toObject?.() || tenant.zatca || {}),
      lastInvoiceHash: lastChainEntry.invoiceHash,
      invoiceCounter: chainData.length,
    };
    tenant.markModified('zatca');
    await tenant.save();

    const newState = {
      lastInvoiceHash: lastChainEntry.invoiceHash,
      invoiceCounter: chainData.length,
      isOnboarded: tenant.zatca?.isOnboarded,
    };

    await logAuditEvent({
      tenantId: tenant._id,
      action: 'disaster_recovery',
      severity: 'critical',
      status: 'success',
      message: `Disaster recovery completed: ${chainData.length} invoices processed, hash chain rebuilt`,
      details: {
        seedHash: seedHash || 'default',
        invoiceCount: chainData.length,
        regenerateQr,
      },
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
      affectedInvoices: chainData.map((c) => c.invoiceId),
      previousState,
      newState,
    });

    res.json({
      success: true,
      tenantId: tenant._id,
      recovered: chainData.length,
      chain: chainData,
      message: 'Disaster recovery completed. Hash chain rebuilt successfully.',
    });
  } catch (error) {
    await logAuditEvent({
      tenantId: req.params.id,
      action: 'disaster_recovery',
      severity: 'critical',
      status: 'failed',
      message: `Disaster recovery failed: ${error.message}`,
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/zatca/tenant/:id/encryption-status
// @desc    Check if tenant ZATCA private key is encrypted at rest
router.get('/tenant/:id/encryption-status', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id).select('zatca.privateKey zatca.keyRotatedAt');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const hasKey = !!tenant.zatca?.privateKey;
    const encrypted = isKeyEncrypted(tenant.zatca?.privateKey);

    res.json({
      tenantId: tenant._id,
      hasPrivateKey: hasKey,
      isEncrypted: encrypted,
      keyRotatedAt: tenant.zatca?.keyRotatedAt || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/encrypt-key
// @desc    Encrypt an existing plaintext private key at rest
router.post('/tenant/:id/encrypt-key', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.zatca?.privateKey) {
      return res.status(400).json({ error: 'No private key found for this tenant' });
    }

    if (isKeyEncrypted(tenant.zatca.privateKey)) {
      return res.json({ success: true, message: 'Private key is already encrypted', alreadyEncrypted: true });
    }

    const previousState = { wasEncrypted: false };
    tenant.zatca.privateKey = encryptPrivateKey(tenant.zatca.privateKey);
    tenant.markModified('zatca');
    await tenant.save();
    const newState = { wasEncrypted: true };

    await logAuditEvent({
      tenantId: tenant._id,
      action: 'config_update',
      severity: 'warning',
      status: 'success',
      message: 'ZATCA private key encrypted at rest using AES-256-GCM',
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
      previousState,
      newState,
    });

    res.json({ success: true, message: 'Private key encrypted at rest using AES-256-GCM' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/backup-keys
// @desc    Export an encrypted backup bundle of tenant ZATCA keys and config
router.post('/tenant/:id/backup-keys', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (!tenant.zatca?.privateKey) {
      return res.status(400).json({ error: 'No ZATCA keys found for this tenant' });
    }

    const { bundle, checksum } = createZatcaBackupBundle(tenant);

    await logAuditEvent({
      tenantId: tenant._id,
      action: 'config_update',
      severity: 'critical',
      status: 'success',
      message: 'ZATCA key backup bundle exported',
      details: { checksum: checksum.substring(0, 16) + '...' },
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });

    res.json({
      success: true,
      tenantId: tenant._id,
      tenantName: tenant.name,
      bundle,
      checksum,
      exportedAt: new Date().toISOString(),
      message: 'Keep this bundle and checksum safe. The bundle is encrypted and can only be decrypted with the server encryption key.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/tenant/:id/restore-keys
// @desc    Restore ZATCA keys from an encrypted backup bundle
router.post('/tenant/:id/restore-keys', async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const { bundle, checksum } = req.body;
    if (!bundle || !checksum) {
      return res.status(400).json({ error: 'Bundle and checksum are required' });
    }

    const restored = restoreZatcaBackupBundle(bundle, checksum);
    const previousState = {
      phase: tenant.zatca?.phase,
      isOnboarded: tenant.zatca?.isOnboarded,
      hasPrivateKey: !!tenant.zatca?.privateKey,
    };

    tenant.zatca = {
      phase: restored.zatca.phase,
      isOnboarded: restored.zatca.isOnboarded,
      complianceCsid: restored.zatca.complianceCsid,
      productionCsid: restored.zatca.productionCsid,
      privateKey: encryptPrivateKey(restored.zatca.privateKey),
      certificateSerialNumber: restored.zatca.certificateSerialNumber,
      lastInvoiceHash: restored.zatca.lastInvoiceHash,
      invoiceCounter: restored.zatca.invoiceCounter,
      deviceSerialNumber: restored.zatca.deviceSerialNumber,
      onboardedAt: restored.zatca.onboardedAt,
      environment: restored.zatca.environment,
    };
    tenant.markModified('zatca');
    await tenant.save();

    const newState = {
      phase: tenant.zatca.phase,
      isOnboarded: tenant.zatca.isOnboarded,
      hasPrivateKey: true,
    };

    await logAuditEvent({
      tenantId: tenant._id,
      action: 'disaster_recovery',
      severity: 'critical',
      status: 'success',
      message: 'ZATCA keys restored from backup bundle',
      details: { sourceTenant: restored.tenantName, sourceSlug: restored.tenantSlug },
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
      previousState,
      newState,
    });

    res.json({
      success: true,
      message: 'ZATCA keys restored successfully',
      restoredConfig: {
        phase: tenant.zatca.phase,
        isOnboarded: tenant.zatca.isOnboarded,
        environment: tenant.zatca.environment,
        hasPrivateKey: true,
      },
    });
  } catch (error) {
    await logAuditEvent({
      tenantId: req.params.id,
      action: 'disaster_recovery',
      severity: 'critical',
      status: 'failed',
      message: `Key restore failed: ${error.message}`,
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/zatca/queue/status
// @desc    Get ZATCA queue status and circuit breaker states
router.get('/queue/status', async (req, res) => {
  try {
    const [
      queued,
      processing,
      reported,
      cleared,
      failed,
      cancelled,
      totalRetries,
    ] = await Promise.all([
      ZatcaQueue.countDocuments({ status: 'queued' }),
      ZatcaQueue.countDocuments({ status: 'processing' }),
      ZatcaQueue.countDocuments({ status: 'reported' }),
      ZatcaQueue.countDocuments({ status: 'cleared' }),
      ZatcaQueue.countDocuments({ status: 'failed' }),
      ZatcaQueue.countDocuments({ status: 'cancelled' }),
      ZatcaQueue.aggregate([
        { $group: { _id: null, total: { $sum: '$retryCount' }, maxRetry: { $max: '$retryCount' } } },
      ]),
    ]);

    const circuitBreakers = getCircuitBreakerStatus();
    const trippedBreakers = circuitBreakers.filter((cb) => cb.tripped);

    const recentFailed = await ZatcaQueue.find({ status: 'failed' })
      .populate('tenantId', 'name slug')
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('invoiceNumber lastError retryCount updatedAt tenantId')
      .lean();

    res.json({
      queue: {
        queued,
        processing,
        reported,
        cleared,
        failed,
        cancelled,
        totalRetries: totalRetries[0]?.total || 0,
        maxRetryCount: totalRetries[0]?.maxRetry || 0,
      },
      circuitBreakers: {
        total: circuitBreakers.length,
        tripped: trippedBreakers.length,
        details: trippedBreakers,
      },
      recentFailed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/queue/process
// @desc    Manually trigger queue processing
router.post('/queue/process', async (req, res) => {
  try {
    const { batchSize = 25 } = req.body;
    const results = await processQueue(Math.min(batchSize, 100));

    await logAuditEvent({
      tenantId: null,
      action: 'manual_sync',
      severity: 'info',
      status: results.failed > 0 ? 'partial' : 'success',
      message: `Manual queue processing: ${results.success} success, ${results.failed} failed, ${results.skipped} skipped`,
      details: results,
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST /api/super-admin/zatca/queue/:id/retry
// @desc    Manually retry a failed queue item
router.post('/queue/:id/retry', async (req, res) => {
  try {
    const queueItem = await ZatcaQueue.findById(req.params.id);
    if (!queueItem) {
      return res.status(404).json({ error: 'Queue item not found' });
    }

    queueItem.status = 'queued';
    queueItem.retryCount = 0;
    queueItem.lastError = '';
    queueItem.nextRetryAt = null;
    queueItem.circuitBreakerTripped = false;
    await queueItem.save();

    await logAuditEvent({
      tenantId: queueItem.tenantId,
      action: 'manual_sync',
      severity: 'info',
      status: 'success',
      message: `Manual retry triggered for invoice ${queueItem.invoiceNumber}`,
      performedBy: req.user?.id,
      performedByRole: 'super_admin',
      req,
    });

    res.json({ success: true, message: `Queue item for invoice ${queueItem.invoiceNumber} reset and queued for retry` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/super-admin/zatca/queue/tenant/:id
// @desc    Get queue items for a specific tenant
router.get('/queue/tenant/:id', async (req, res) => {
  try {
    const { page = 1, limit = 50, status } = req.query;
    const query = { tenantId: req.params.id };
    if (status) query.status = status;

    const [items, total] = await Promise.all([
      ZatcaQueue.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      ZatcaQueue.countDocuments(query),
    ]);

    res.json({
      items,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
