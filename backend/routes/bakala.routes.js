import express from 'express';
import { protect } from '../middleware/auth.js';
import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import ZatcaService from '../utils/zatca/ZatcaService.js';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * Sync offline Bakala invoices to the server
 * POST /api/bakala/sync
 */
router.post('/sync', protect, async (req, res) => {
  try {
    const { invoices } = req.body; // Array of offline invoices
    const tenantId = req.user.tenantId;

    if (!Array.isArray(invoices) || invoices.length === 0) {
      return res.status(400).json({ success: false, message: 'No invoices provided' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const zatcaConfig = tenant.zatca || {};
    const zatcaService = new ZatcaService({
      privateKey: zatcaConfig.privateKey,
      certificate: zatcaConfig.certificateSerialNumber, // Should be actual certificate in real scenario
      csid: zatcaConfig.productionCsid || zatcaConfig.complianceCsid,
      previousInvoiceHash: zatcaConfig.lastInvoiceHash
    });

    const syncedInvoices = [];
    const errors = [];

    // Process sequentially to maintain ZATCA chain hash
    for (const offlineInvoice of invoices) {
      try {
        // Prepare Invoice document
        const newInvoice = new Invoice({
          ...offlineInvoice,
          tenantId,
          flow: 'sell',
          businessContext: 'bakala',
          transactionType: 'B2C',
          invoiceTypeCode: '0200000', // Simplified tax invoice
          status: 'pending',
          createdBy: req.user._id,
        });

        // Generate Invoice Number if missing
        if (!newInvoice.invoiceNumber) {
          const count = await Invoice.countDocuments({ tenantId });
          newInvoice.invoiceNumber = `BAKALA-${count + 1}`;
        }

        // Apply ZATCA processing
        if (zatcaConfig.isOnboarded && zatcaConfig.privateKey) {
          const processed = await zatcaService.processInvoice(
            newInvoice.toObject(),
            tenant.business,
            true // isB2C
          );
          
          newInvoice.zatca = {
            ...processed,
            submissionStatus: 'pending' // Queued for background reporting worker
          };

          // Update tenant's last hash for chain
          tenant.zatca.lastInvoiceHash = processed.invoiceHash;
          tenant.zatca.invoiceCounter = processed.invoiceCounter;
        }

        await newInvoice.save();
        syncedInvoices.push({ offlineId: offlineInvoice.offlineId, uuid: newInvoice.zatca?.uuid || newInvoice._id });
        
      } catch (err) {
        errors.push({ offlineId: offlineInvoice.offlineId, error: err.message });
      }
    }

    if (zatcaConfig.isOnboarded && zatcaConfig.privateKey) {
      await tenant.save();
    }

    res.status(201).json({
      success: true,
      syncedInvoices,
      errors
    });
  } catch (error) {
    console.error('Bakala Sync Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
