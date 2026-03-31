import express from 'express';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import { protect, tenantFilter } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

function resolvePeriod(req) {
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

  return { startDate, endDate };
}

router.get('/vat-return', async (req, res) => {
  try {
    const { startDate, endDate } = resolvePeriod(req);

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

router.get('/business-summary', async (req, res) => {
  try {
    const { startDate, endDate } = resolvePeriod(req);

    const invoiceMatch = {
      ...req.tenantFilter,
      issueDate: { $gte: startDate, $lte: endDate },
      status: { $nin: ['draft', 'cancelled', 'credited'] }
    };

    const expenseMatch = {
      ...req.tenantFilter,
      expenseDate: { $gte: startDate, $lte: endDate },
      status: 'paid',
      isActive: true
    };

    const [invoiceAgg, expenseAgg] = await Promise.all([
      Invoice.aggregate([
        { $match: invoiceMatch },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: '$flow',
                  invoiceCount: { $sum: 1 },
                  taxableAmount: { $sum: { $ifNull: ['$taxableAmount', 0] } },
                  totalTax: { $sum: { $ifNull: ['$totalTax', 0] } },
                  grandTotal: { $sum: { $ifNull: ['$grandTotal', 0] } },
                }
              }
            ],
            byTransactionType: [
              {
                $match: { flow: 'sell' }
              },
              {
                $group: {
                  _id: '$transactionType',
                  invoiceCount: { $sum: 1 },
                  revenue: { $sum: { $ifNull: ['$grandTotal', 0] } },
                  tax: { $sum: { $ifNull: ['$totalTax', 0] } },
                }
              },
              { $sort: { revenue: -1 } }
            ],
            topCustomers: [
              {
                $match: { flow: 'sell' }
              },
              {
                $group: {
                  _id: { $ifNull: ['$buyer.name', 'Unknown'] },
                  invoiceCount: { $sum: 1 },
                  revenue: { $sum: { $ifNull: ['$grandTotal', 0] } },
                }
              },
              { $sort: { revenue: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  expenseCount: { $sum: 1 },
                  totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } },
                  taxAmount: { $sum: { $ifNull: ['$taxAmount', 0] } },
                }
              }
            ],
            byCategory: [
              {
                $group: {
                  _id: { $ifNull: ['$category', 'other'] },
                  count: { $sum: 1 },
                  totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } }
                }
              },
              { $sort: { totalAmount: -1 } },
              { $limit: 10 }
            ]
          }
        }
      ])
    ]);

    const invoiceResult = invoiceAgg?.[0] || {};
    const expenseResult = expenseAgg?.[0] || {};

    const totalsByFlow = Array.isArray(invoiceResult.totals) ? invoiceResult.totals : [];

    const sell = totalsByFlow.find((r) => r._id === 'sell') || { invoiceCount: 0, taxableAmount: 0, totalTax: 0, grandTotal: 0 };
    const purchase = totalsByFlow.find((r) => r._id === 'purchase') || { invoiceCount: 0, taxableAmount: 0, totalTax: 0, grandTotal: 0 };

    const expenseTotals = expenseResult?.totals?.[0] || { expenseCount: 0, totalAmount: 0, taxAmount: 0 };

    const net = (sell.grandTotal || 0) - (purchase.grandTotal || 0) - (expenseTotals.totalAmount || 0);

    res.json({
      period: { startDate, endDate },
      currency: 'SAR',
      totals: {
        sales: {
          invoiceCount: sell.invoiceCount || 0,
          taxableAmount: sell.taxableAmount || 0,
          totalTax: sell.totalTax || 0,
          grandTotal: sell.grandTotal || 0,
        },
        purchases: {
          invoiceCount: purchase.invoiceCount || 0,
          taxableAmount: purchase.taxableAmount || 0,
          totalTax: purchase.totalTax || 0,
          grandTotal: purchase.grandTotal || 0,
        },
        expenses: {
          expenseCount: expenseTotals.expenseCount || 0,
          totalAmount: expenseTotals.totalAmount || 0,
          taxAmount: expenseTotals.taxAmount || 0,
        },
        net
      },
      breakdown: {
        salesByTransactionType: invoiceResult.byTransactionType || [],
        topCustomers: invoiceResult.topCustomers || [],
        expensesByCategory: expenseResult.byCategory || []
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
