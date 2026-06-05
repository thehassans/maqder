import express from 'express';
import { authorize } from '../middleware/auth.js';
import Invoice from '../models/Invoice.js';
import Customer from '../models/Customer.js';
import Expense from '../models/Expense.js';

const router = express.Router();

router.get('/export', authorize('admin'), async (req, res) => {
  try {
    const tenantId = req.user.tenantId;

    const [invoices, customers, expenses] = await Promise.all([
      Invoice.find({ tenantId }).lean(),
      Customer.find({ tenantId }).lean(),
      Expense.find({ tenantId }).lean()
    ]);

    const backupData = {
      tenantId,
      timestamp: new Date().toISOString(),
      data: {
        invoices,
        customers,
        expenses
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=backup-${new Date().toISOString().split('T')[0]}.json`);
    
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
