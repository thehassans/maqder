import express from 'express';
import { protect } from '../middleware/auth.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Product from '../models/Product.js';
import Tenant from '../models/Tenant.js';

const router = express.Router();

/**
 * POST /api/desktop/sync/auth
 * Authenticates desktop app and returns basic tenant info + Phase 2 check
 */
router.post('/auth', protect, async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.user.tenantId);
    
    // Check if Phase 2 is enabled
    const isPhase2 = tenant?.zatca?.phase === '2';

    res.json({
      success: true,
      tenant: {
        id: tenant._id,
        name: tenant.name,
        slug: tenant.slug,
        isPhase2
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/desktop/sync/push
 * Receives batched invoices and customers from desktop NeDB
 */
router.post('/push', protect, async (req, res) => {
  try {
    const { invoices = [], customers = [] } = req.body;
    const tenantId = req.user.tenantId;

    // Process Customers
    for (const cust of customers) {
      if (cust._id) {
        // If it's a desktop-generated ID that isn't a Mongo ObjectId, we might need to handle it.
        // Assuming desktop NeDB uses generated 16-char strings or UUIDs.
        // We can upsert by a unique field like email or phone, or just create new.
        // For simplicity, we'll strip the NeDB _id and create new if it doesn't match ObjectId format.
        
        const customerData = { ...cust, tenantId };
        if (typeof cust._id === 'string' && cust._id.length !== 24) {
          delete customerData._id; // Let Mongo generate _id
          await Customer.create(customerData);
        } else {
          await Customer.findByIdAndUpdate(cust._id, customerData, { upsert: true });
        }
      } else {
        await Customer.create({ ...cust, tenantId });
      }
    }

    // Process Invoices
    for (const inv of invoices) {
      const invoiceData = { ...inv, tenantId };
      if (typeof inv._id === 'string' && inv._id.length !== 24) {
        delete invoiceData._id;
        // Invoices generated offline should be inserted as new
        await Invoice.create(invoiceData);
      } else {
        await Invoice.findByIdAndUpdate(inv._id, invoiceData, { upsert: true });
      }
    }

    res.json({ success: true, message: 'Sync push completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/desktop/sync/pull
 * Returns updated products and customers since last sync
 */
router.get('/pull', protect, async (req, res) => {
  try {
    const { since } = req.query;
    const tenantId = req.user.tenantId;

    const query = { tenantId };
    if (since) {
      query.updatedAt = { $gte: new Date(since) };
    }

    const products = await Product.find(query);
    const customers = await Customer.find(query);

    res.json({
      success: true,
      data: {
        products,
        customers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
