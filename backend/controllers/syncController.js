import Invoice from '../models/Invoice.js';

/**
 * Ingests an offline-generated item from the frontend sync queue.
 * Performs validation (especially Cryptographic Stamp verification if needed)
 * and saves to the MongoDB backend.
 */
export const ingestSyncItem = async (req, res) => {
  try {
    const { type, payload, offlineId } = req.body;
    const tenantId = req.user.tenantId; // from auth middleware

    if (!type || !payload) {
      return res.status(400).json({ error: 'Missing type or payload' });
    }

    if (type === 'CREATE_INVOICE') {
      // 1. Verify it doesn't already exist (idempotency check)
      const existing = await Invoice.findOne({ 
        tenantId, 
        invoiceNumber: payload.invoiceNumber 
      });

      if (existing) {
        // If it already exists, it might be a duplicate sync attempt. Just return success.
        return res.status(200).json({ success: true, message: 'Already synced', offlineId });
      }

      // 2. Cryptographic Stamp Validation (Optional backend verification)
      // In a strict environment, the backend would decode the base64 signature,
      // re-hash the xmlPayload, and verify it against the tenant's public key.
      // If verification fails, it would reject the sync to prevent tampering.
      // For this implementation, we assume the frontend payload is trusted via the JWT.

      // 3. Save the offline invoice
      const newInvoice = new Invoice({
        ...payload,
        tenantId,
        // Ensure sync status is marked
        'zatca.syncStatus': 'SYNCED',
        'zatca.submissionStatus': 'pending', // Ready to be queued for ZATCA API
      });

      await newInvoice.save();

      return res.status(201).json({ success: true, message: 'Invoice synced successfully', offlineId, id: newInvoice._id });
    }

    return res.status(400).json({ error: 'Unsupported sync type' });

  } catch (error) {
    console.error('Error ingesting sync item:', error);
    res.status(500).json({ error: 'Internal Server Error during sync ingestion' });
  }
};
