import express from 'express';
import Invoice from '../models/Invoice.js';
import Employee from '../models/Employee.js';
import Product from '../models/Product.js';
import Payroll from '../models/Payroll.js';
import Customer from '../models/Customer.js';
import Expense from '../models/Expense.js';
import { protect, tenantFilter } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

// @route   GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [invoiceStats, employeeStats, productStats, payrollStats, recentInvoices, expiringDocuments, recentCustomers, topProducts, todayStats] = await Promise.all([
      // Invoice stats
      Invoice.aggregate([
        { $match: req.tenantFilter },
        {
          $facet: {
            total: [
              { $match: { status: { $nin: ['draft', 'cancelled', 'credited'] } } },
              { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' }, tax: { $sum: '$totalTax' } } }
            ],
            thisMonth: [
              {
                $match: {
                  issueDate: { $gte: new Date(currentYear, currentMonth - 1, 1) },
                  status: { $nin: ['draft', 'cancelled', 'credited'] }
                }
              },
              { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } }
            ],
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            zatcaStatus: [{ $group: { _id: '$zatca.submissionStatus', count: { $sum: 1 } } }]
          }
        }
      ]),
      
      // Employee stats
      Employee.aggregate([
        { $match: { ...req.tenantFilter, isActive: true } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            byNationality: [{ $group: { _id: '$nationality', count: { $sum: 1 } } }]
          }
        }
      ]),
      
      // Product stats
      Product.aggregate([
        { $match: { ...req.tenantFilter, isActive: true } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            totalValue: [{ $group: { _id: null, value: { $sum: { $multiply: ['$costPrice', '$totalStock'] } } } }],
            lowStock: [
              { $match: { $expr: { $lte: ['$totalStock', 10] } } },
              { $count: 'count' }
            ]
          }
        }
      ]),
      
      // Payroll stats for current month
      Payroll.aggregate([
        { $match: { ...req.tenantFilter, periodMonth: currentMonth, periodYear: currentYear } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalNet: { $sum: '$netPay' },
            totalGross: { $sum: '$grossPay' }
          }
        }
      ]),
      
      // Recent invoices
      Invoice.find(req.tenantFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('invoiceNumber buyer.name grandTotal status issueDate zatca.submissionStatus'),
      
      // Expiring documents
      Employee.aggregate([
        { $match: { ...req.tenantFilter, isActive: true } },
        { $unwind: '$documents' },
        {
          $match: {
            'documents.expiryDate': {
              $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              $gte: new Date()
            }
          }
        },
        {
          $project: {
            employeeId: 1,
            fullName: { $concat: ['$firstNameEn', ' ', '$lastNameEn'] },
            documentType: '$documents.type',
            documentNumber: '$documents.number',
            expiryDate: '$documents.expiryDate'
          }
        },
        { $limit: 10 }
      ]),

      // Recent customers
      Customer.find(req.tenantFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name nameAr email phone type createdAt'),

      // Top products by invoice count
      Invoice.aggregate([
        { $match: { ...req.tenantFilter, status: { $nin: ['draft', 'cancelled', 'credited'] } } },
        { $unwind: '$lineItems' },
        {
          $group: {
            _id: '$lineItems.productName',
            name: { $first: '$lineItems.productName' },
            nameAr: { $first: '$lineItems.productNameAr' },
            totalQty: { $sum: { $ifNull: ['$lineItems.quantity', 0] } },
            totalRevenue: {
              $sum: {
                $ifNull: [
                  '$lineItems.lineTotalWithTax',
                  { $multiply: ['$lineItems.quantity', '$lineItems.unitPrice'] }
                ]
              }
            }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 }
      ]),

      // Today's stats
      Invoice.aggregate([
        {
          $match: {
            ...req.tenantFilter,
            issueDate: { $gte: today, $lt: tomorrow },
            status: { $nin: ['draft', 'cancelled', 'credited'] }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: '$grandTotal' }
          }
        }
      ])
    ]);
    
    res.json({
      invoices: {
        total: invoiceStats[0]?.total[0] || { count: 0, revenue: 0, tax: 0 },
        thisMonth: invoiceStats[0]?.thisMonth[0] || { count: 0, revenue: 0 },
        byStatus: invoiceStats[0]?.byStatus || [],
        zatcaStatus: invoiceStats[0]?.zatcaStatus || []
      },
      employees: {
        total: employeeStats[0]?.total[0]?.count || 0,
        byStatus: employeeStats[0]?.byStatus || [],
        byNationality: employeeStats[0]?.byNationality || []
      },
      products: {
        total: productStats[0]?.total[0]?.count || 0,
        totalValue: productStats[0]?.totalValue[0]?.value || 0,
        lowStock: productStats[0]?.lowStock[0]?.count || 0
      },
      payroll: {
        currentMonth: { month: currentMonth, year: currentYear },
        stats: payrollStats
      },
      recentInvoices,
      expiringDocuments,
      recentCustomers,
      topProducts,
      todayStats: todayStats[0] || { count: 0, revenue: 0 }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/dashboard/charts/revenue
router.get('/charts/revenue', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const revenue = await Invoice.aggregate([
      {
        $match: {
          ...req.tenantFilter,
          issueDate: { $gte: startDate },
          status: { $nin: ['draft', 'cancelled', 'credited'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$issueDate' },
            month: { $month: '$issueDate' }
          },
          revenue: { $sum: '$grandTotal' },
          tax: { $sum: '$totalTax' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json(revenue);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/dashboard/charts/expenses
router.get('/charts/expenses', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const payrollExpenses = await Payroll.aggregate([
      {
        $match: {
          ...req.tenantFilter,
          periodStart: { $gte: startDate },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: { year: '$periodYear', month: '$periodMonth' },
          salaries: { $sum: '$netPay' },
          gosi: { $sum: '$gosi.totalContribution' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const otherExpenses = await Expense.aggregate([
      {
        $match: {
          ...req.tenantFilter,
          expenseDate: { $gte: startDate },
          status: 'paid',
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' }
          },
          other: { $sum: { $ifNull: ['$totalAmount', 0] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const byKey = new Map();

    for (const row of payrollExpenses || []) {
      const key = `${row?._id?.year}-${row?._id?.month}`;
      byKey.set(key, {
        _id: row._id,
        salaries: row.salaries || 0,
        gosi: row.gosi || 0,
        other: 0
      });
    }

    for (const row of otherExpenses || []) {
      const key = `${row?._id?.year}-${row?._id?.month}`;
      const existing = byKey.get(key) || { _id: row._id, salaries: 0, gosi: 0, other: 0 };
      byKey.set(key, {
        _id: existing._id || row._id,
        salaries: existing.salaries || 0,
        gosi: existing.gosi || 0,
        other: (existing.other || 0) + (row.other || 0)
      });
    }

    const merged = Array.from(byKey.values()).sort((a, b) => {
      const ay = a?._id?.year || 0;
      const by = b?._id?.year || 0;
      if (ay !== by) return ay - by;
      const am = a?._id?.month || 0;
      const bm = b?._id?.month || 0;
      return am - bm;
    });

    res.json(merged);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
