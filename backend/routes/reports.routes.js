import express from 'express';
import Invoice from '../models/Invoice.js';
import { protect, tenantFilter } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

router.get('/vat-return', async (req, res) => {
  try {
    const now = new Date();

    const monthParam = Number(req.query.month);
    const yearParam = Number(req.query.year);

    const startDateParam = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDateParam = req.query.endDate ? new Date(req.query.endDate) : null;

    const hasStartEnd = startDateParam instanceof Date && !Number.isNaN(startDateParam.getTime()) &&
      endDateParam instanceof Date && !Number.isNaN(endDateParam.getTime());

    let startDate;
    let endDate;

    if (hasStartEnd) {
      startDate = startDateParam;
      endDate = endDateParam;
    } else if (Number.isFinite(monthParam) && monthParam >= 1 && monthParam <= 12 && Number.isFinite(yearParam) && yearParam >= 1970) {
      startDate = new Date(yearParam, monthParam - 1, 1);
      endDate = new Date(yearParam, monthParam, 0, 23, 59, 59, 999);
    } else {
      const month = now.getMonth();
      const year = now.getFullYear();
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
    }

    const match = {
      ...req.tenantFilter,
      issueDate: { $gte: startDate, $lte: endDate },
      status: { $nin: ['draft', 'cancelled', 'credited'] }
    };

    const [result] = await Invoice.aggregate([
      { $match: match },
      {
        $facet: {
          invoices: [
            {
              $group: {
                _id: null,
                invoiceCount: { $sum: 1 },
                taxableAmount: { $sum: '$taxableAmount' },
                totalTax: { $sum: '$totalTax' },
                grandTotal: { $sum: '$grandTotal' }
              }
            }
          ],
          byTaxCategory: [
            { $unwind: '$lineItems' },
            {
              $group: {
                _id: {
                  taxCategory: '$lineItems.taxCategory',
                  taxRate: '$lineItems.taxRate'
                },
                taxableAmount: { $sum: '$lineItems.lineTotal' },
                taxAmount: { $sum: '$lineItems.taxAmount' },
                totalWithTax: { $sum: '$lineItems.lineTotalWithTax' }
              }
            },
            { $sort: { '_id.taxCategory': 1, '_id.taxRate': -1 } }
          ],
          byTransactionType: [
            {
              $group: {
                _id: '$transactionType',
                invoiceCount: { $sum: 1 },
                taxableAmount: { $sum: '$taxableAmount' },
                totalTax: { $sum: '$totalTax' },
                grandTotal: { $sum: '$grandTotal' }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const invoices = result?.invoices?.[0] || { invoiceCount: 0, taxableAmount: 0, totalTax: 0, grandTotal: 0 };
    const byTaxCategory = result?.byTaxCategory || [];
    const byTransactionType = result?.byTransactionType || [];

    const totalsByCategory = {
      standardRated: { taxableAmount: 0, taxAmount: 0 },
      zeroRated: { taxableAmount: 0, taxAmount: 0 },
      exempt: { taxableAmount: 0, taxAmount: 0 },
      outOfScope: { taxableAmount: 0, taxAmount: 0 }
    };

    for (const row of byTaxCategory) {
      const category = row?._id?.taxCategory;
      const taxableAmount = row?.taxableAmount || 0;
      const taxAmount = row?.taxAmount || 0;

      if (category === 'S') {
        totalsByCategory.standardRated.taxableAmount += taxableAmount;
        totalsByCategory.standardRated.taxAmount += taxAmount;
      } else if (category === 'Z') {
        totalsByCategory.zeroRated.taxableAmount += taxableAmount;
        totalsByCategory.zeroRated.taxAmount += taxAmount;
      } else if (category === 'E') {
        totalsByCategory.exempt.taxableAmount += taxableAmount;
        totalsByCategory.exempt.taxAmount += taxAmount;
      } else if (category === 'O') {
        totalsByCategory.outOfScope.taxableAmount += taxableAmount;
        totalsByCategory.outOfScope.taxAmount += taxAmount;
      }
    }

    res.json({
      period: {
        startDate,
        endDate,
      },
      currency: 'SAR',
      totals: {
        invoiceCount: invoices.invoiceCount || 0,
        taxableAmount: invoices.taxableAmount || 0,
        totalTax: invoices.totalTax || 0,
        grandTotal: invoices.grandTotal || 0,
        byCategory: totalsByCategory
      },
      breakdown: {
        byTaxCategory,
        byTransactionType
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
