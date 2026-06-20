import express from 'express';
import Invoice from '../models/Invoice.js';
import Employee from '../models/Employee.js';
import Product from '../models/Product.js';
import Payroll from '../models/Payroll.js';
import Customer from '../models/Customer.js';
import Expense from '../models/Expense.js';
import TravelBooking from '../models/TravelBooking.js';
import RestaurantOrder from '../models/RestaurantOrder.js';
import RentalContract from '../models/RentalContract.js';
import LaundryOrder from '../models/LaundryOrder.js';
import BoutiqueRental from '../models/BoutiqueRental.js';
import BoutiqueProduct from '../models/BoutiqueProduct.js';
import { protect, tenantFilter } from '../middleware/auth.js';
import { getTenantBusinessTypes } from '../utils/businessTypes.js';

const router = express.Router();

router.use(protect);
router.use(tenantFilter);

// @route   GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const businessTypes = getTenantBusinessTypes(req.tenant);
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const topProductsSince = new Date();
    topProductsSince.setMonth(topProductsSince.getMonth() - 6);

    const [invoiceStats, employeeStats, productStats, payrollStats, recentInvoices, expiringDocuments, recentCustomers, topProducts, todayStats, travelStats, restaurantStats] = await Promise.all([
      // Invoice stats
      Invoice.aggregate([
        { $match: req.tenantFilter },
        {
          $facet: {
            total: [
              { $match: { status: { $nin: ['draft', 'cancelled', 'credited'] } } },
              { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$taxableAmount' }, tax: { $sum: '$totalTax' }, discount: { $sum: { $ifNull: ['$totalDiscount', 0] } } } }
            ],
            thisMonth: [
              {
                $match: {
                  issueDate: { $gte: new Date(currentYear, currentMonth - 1, 1) },
                  status: { $nin: ['draft', 'cancelled', 'credited'] }
                }
              },
              { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$taxableAmount' }, discount: { $sum: { $ifNull: ['$totalDiscount', 0] } } } }
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
      
      // Product stats (Trading only)
      businessTypes.includes('trading')
        ? Product.aggregate([
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
          ])
        : Promise.resolve([
            {
              total: [{ count: 0 }],
              totalValue: [{ value: 0 }],
              lowStock: [{ count: 0 }]
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
        .select('invoiceNumber buyer.name grandTotal status issueDate zatca.submissionStatus')
        .lean(),
      
      // Expiring documents
      Employee.aggregate([
        { $match: { ...req.tenantFilter, isActive: true } },
        {
          $project: {
            employeeId: 1,
            firstNameEn: 1,
            lastNameEn: 1,
            expiryCandidates: {
              $concatArrays: [
                {
                  $map: {
                    input: { $ifNull: ['$documents', []] },
                    as: 'doc',
                    in: {
                      documentType: '$$doc.type',
                      documentNumber: '$$doc.number',
                      expiryDate: '$$doc.expiryDate'
                    }
                  }
                },
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ['$nationalIdType', 'iqama'] },
                        { $ne: ['$nationalIdExpiry', null] }
                      ]
                    },
                    [{ documentType: 'iqama', documentNumber: '$nationalId', expiryDate: '$nationalIdExpiry' }],
                    []
                  ]
                }
              ]
            }
          }
        },
        { $unwind: '$expiryCandidates' },
        {
          $match: {
            'expiryCandidates.expiryDate': {
              $lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
              $gte: new Date()
            }
          }
        },
        {
          $project: {
            employeeId: 1,
            fullName: { $concat: ['$firstNameEn', ' ', '$lastNameEn'] },
            documentType: '$expiryCandidates.documentType',
            documentNumber: '$expiryCandidates.documentNumber',
            expiryDate: '$expiryCandidates.expiryDate'
          }
        },
        { $limit: 10 }
      ]),

      // Recent customers
      Customer.find(req.tenantFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name nameAr email phone type createdAt')
        .lean(),

      // Top products by invoice count (last 6 months — avoids scanning all invoices)
      Invoice.aggregate([
        { $match: { ...req.tenantFilter, issueDate: { $gte: topProductsSince }, status: { $nin: ['draft', 'cancelled', 'credited'] } } },
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
            revenue: { $sum: '$taxableAmount' }
          }
        }
      ]),

      businessTypes.includes('travel_agency')
        ? TravelBooking.aggregate([
            { $match: { ...req.tenantFilter, isActive: true } },
            {
              $facet: {
                totals: [
                  {
                    $group: {
                      _id: null,
                      total: { $sum: 1 },
                      revenue: { $sum: '$grandTotal' },
                      open: {
                        $sum: {
                          $cond: [{ $in: ['$status', ['draft', 'confirmed', 'ticketed']] }, 1, 0]
                        }
                      }
                    }
                  }
                ],
                byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                recent: [
                  { $sort: { createdAt: -1 } },
                  { $limit: 5 },
                  { $project: { bookingNumber: 1, status: 1, customerName: 1, grandTotal: 1, createdAt: 1 } }
                ]
              }
            }
          ])
        : Promise.resolve([{ totals: [{ total: 0, revenue: 0, open: 0 }], byStatus: [], recent: [] }]),

      businessTypes.includes('restaurant')
        ? RestaurantOrder.aggregate([
            { $match: { ...req.tenantFilter, isActive: true } },
            {
              $facet: {
                totals: [
                  {
                    $group: {
                      _id: null,
                      total: { $sum: 1 },
                      revenue: { $sum: '$grandTotal' },
                      open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } }
                    }
                  }
                ],
                byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                recent: [
                  { $sort: { createdAt: -1 } },
                  { $limit: 5 },
                  { $project: { orderNumber: 1, status: 1, tableNumber: 1, grandTotal: 1, createdAt: 1 } }
                ]
              }
            }
          ])
        : Promise.resolve([{ totals: [{ total: 0, revenue: 0, open: 0 }], byStatus: [], recent: [] }]),

      businessTypes.includes('boutique')
        ? BoutiqueRental.aggregate([
            { $match: req.tenantFilter },
            {
              $facet: {
                totals: [
                  {
                    $group: {
                      _id: null,
                      total: { $sum: 1 },
                      revenue: { $sum: '$grandTotal' },
                      pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] } },
                      pendingReturns: { $sum: { $cond: [{ $in: ['$status', ['reserved', 'picked_up', 'late_return']] }, 1, 0] } },
                      overdueReturns: { $sum: { $cond: [{ $eq: ['$status', 'late_return'] }, 1, 0] } }
                    }
                  }
                ],
                today: [
                  { $match: { createdAt: { $gte: today, $lt: tomorrow } } },
                  { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } }
                ],
                thisMonth: [
                  { $match: { createdAt: { $gte: new Date(currentYear, currentMonth - 1, 1) } } },
                  { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: '$grandTotal' } } }
                ],
                byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                recent: [
                  { $sort: { createdAt: -1 } },
                  { $limit: 5 },
                  { $project: { rentalNumber: 1, status: 1, customerName: 1, grandTotal: 1, paymentStatus: 1, createdAt: 1 } }
                ]
              }
            }
          ])
        : Promise.resolve([{ totals: [{ total: 0, revenue: 0, pending: 0, pendingReturns: 0, overdueReturns: 0 }], today: [{ count: 0, revenue: 0 }], thisMonth: [{ count: 0, revenue: 0 }], byStatus: [], recent: [] }]),

      businessTypes.includes('boutique')
        ? BoutiqueProduct.aggregate([
            { $match: { ...req.tenantFilter, isActive: true } },
            {
              $facet: {
                total: [{ $count: 'count' }],
                available: [{ $match: { $expr: { $gt: ['$rentalQuantity', 0] } } }, { $count: 'count' }],
                outOfStock: [{ $match: { $expr: { $lte: ['$rentalQuantity', 0] } } }, { $count: 'count' }]
              }
            }
          ])
        : Promise.resolve([{ total: [{ count: 0 }], available: [{ count: 0 }], outOfStock: [{ count: 0 }] }])
    ]);
    
    res.json({
      invoices: {
        total: invoiceStats[0]?.total[0] || { count: 0, revenue: 0, tax: 0, discount: 0 },
        thisMonth: invoiceStats[0]?.thisMonth[0] || { count: 0, revenue: 0, discount: 0 },
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
      todayStats: todayStats[0] || { count: 0, revenue: 0 },
      travel: travelStats?.[0] || { totals: [{ total: 0, revenue: 0, open: 0 }], byStatus: [], recent: [] },
      restaurant: restaurantStats?.[0] || { totals: [{ total: 0, revenue: 0, open: 0 }], byStatus: [], recent: [] },
      boutique: {
        rentals: boutiqueRentalStats?.[0] || { totals: [{ total: 0, revenue: 0, pending: 0, pendingReturns: 0, overdueReturns: 0 }], today: [{ count: 0, revenue: 0 }], thisMonth: [{ count: 0, revenue: 0 }], byStatus: [], recent: [] },
        products: boutiqueProductStats?.[0] || { total: [{ count: 0 }], available: [{ count: 0 }], outOfStock: [{ count: 0 }] }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET /api/dashboard/charts/revenue
router.get('/charts/revenue', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    const businessTypes = getTenantBusinessTypes(req.tenant);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));
    
    const byKey = new Map();

    const addRevenue = (year, month, revenue, tax, count) => {
      const key = `${year}-${month}`;
      const existing = byKey.get(key) || { _id: { year, month }, revenue: 0, tax: 0, count: 0 };
      byKey.set(key, {
        _id: existing._id,
        revenue: existing.revenue + (revenue || 0),
        tax: existing.tax + (tax || 0),
        count: existing.count + (count || 0)
      });
    };
    
    // 1. Invoices (Trading, Travel Agency, Construction)
    const invoiceRevenue = await Invoice.aggregate([
      {
        $match: {
          ...req.tenantFilter,
          issueDate: { $gte: startDate },
          status: { $nin: ['draft', 'cancelled', 'credited'] },
          flow: 'sell' // Only sales invoices count towards revenue
        }
      },
      {
        $facet: {
          standard: [
            // Standard Invoices
            {
              $group: {
                _id: { year: { $year: '$issueDate' }, month: { $month: '$issueDate' } },
                revenue: { $sum: { $ifNull: ['$taxableAmount', 0] } },
                tax: { $sum: { $ifNull: ['$totalTax', 0] } },
                count: { $sum: 1 }
              }
            }
          ],
          travelMargin: [
            // Travel Margin specific logic (since margin isn't part of standard taxableAmount sometimes)
            { $unwind: '$lineItems' },
            { $match: { 'lineItems.isTravelMargin': true } },
            {
              $group: {
                _id: { year: { $year: '$issueDate' }, month: { $month: '$issueDate' } },
                revenue: { $sum: { $ifNull: ['$lineItems.marginTaxable', 0] } },
                tax: { $sum: { $ifNull: ['$lineItems.taxAmount', 0] } },
                count: { $sum: 0 } // Don't double count the invoice
              }
            }
          ]
        }
      }
    ]);

    invoiceRevenue[0]?.standard?.forEach(r => addRevenue(r._id.year, r._id.month, r.revenue, r.tax, r.count));
    if (businessTypes.includes('travel_agency')) {
       // If travel agency, standard taxableAmount might be 0 for margin lines, so we add marginTaxable
       invoiceRevenue[0]?.travelMargin?.forEach(r => addRevenue(r._id.year, r._id.month, r.revenue, r.tax, r.count));
    }

    // 2. Car Rental
    if (businessTypes.includes('car_rental')) {
      const rentalRevenue = await RentalContract.aggregate([
        {
          $match: {
            ...req.tenantFilter,
            createdAt: { $gte: startDate },
            status: { $in: ['active', 'completed'] }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$subtotal', 0] } },
            tax: { $sum: { $ifNull: ['$totalVat', 0] } },
            count: { $sum: 1 }
          }
        }
      ]);
      rentalRevenue.forEach(r => addRevenue(r._id.year, r._id.month, r.revenue, r.tax, r.count));
    }

    // 3. Laundry
    if (businessTypes.includes('laundry')) {
      const laundryRevenue = await LaundryOrder.aggregate([
        {
          $match: {
            ...req.tenantFilter,
            createdAt: { $gte: startDate },
            status: { $nin: ['cancelled'] }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$subtotal', 0] } },
            tax: { $sum: { $ifNull: ['$totalVat', 0] } },
            count: { $sum: 1 }
          }
        }
      ]);
      laundryRevenue.forEach(r => addRevenue(r._id.year, r._id.month, r.revenue, r.tax, r.count));
    }

    // 4. Restaurant
    if (businessTypes.includes('restaurant')) {
      const restaurantRevenue = await RestaurantOrder.aggregate([
        {
          $match: {
            ...req.tenantFilter,
            createdAt: { $gte: startDate },
            status: { $nin: ['cancelled'] }
          }
        },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            revenue: { $sum: { $ifNull: ['$subtotal', 0] } },
            tax: { $sum: { $ifNull: ['$totalVat', 0] } },
            count: { $sum: 1 }
          }
        }
      ]);
      restaurantRevenue.forEach(r => addRevenue(r._id.year, r._id.month, r.revenue, r.tax, r.count));
    }
    
    const merged = Array.from(byKey.values()).sort((a, b) => {
      if (a._id.year !== b._id.year) return a._id.year - b._id.year;
      return a._id.month - b._id.month;
    });

    res.json(merged);
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
          other: { $sum: { $ifNull: ['$amount', 0] } },
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
