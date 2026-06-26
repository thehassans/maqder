import express from 'express';
import Tenant from '../models/Tenant.js';
import Invoice from '../models/Invoice.js';
import ZatcaLog from '../models/ZatcaLog.js';
import ZatcaAuditLog from '../models/ZatcaAuditLog.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  verifyQrIntegrity,
  computeInvoiceHash,
  verifyHashChain,
  rebuildHashChain,
  generateKeyPair,
  validateZatcaQrFields,
} from '../lib/zatcaQr.js';

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

export default router;
