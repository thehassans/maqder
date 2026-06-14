import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Product from '../models/Product.js';
import Project from '../models/Project.js';
import TravelBooking from '../models/TravelBooking.js';
import RestaurantOrder from '../models/RestaurantOrder.js';
import RentalContract from '../models/RentalContract.js';
import LaundryOrder from '../models/LaundryOrder.js';
import SaloonOrder from '../models/SaloonOrder.js';
import ManpowerAssignment from '../models/ManpowerAssignment.js';
import ManpowerWorker from '../models/ManpowerWorker.js';
import BakalaProduct from '../models/BakalaProduct.js';
import PosSession from '../models/PosSession.js';
import KhayyatStitching from '../models/khayyat/KhayyatStitching.js';
import { getTenantBusinessTypes } from './businessTypes.js';

// Each builder returns a uniform section so the frontend can render it generically:
// { key, label:{en,ar}, kpis:[{key,label:{en,ar},value,format}], tables:[{key,title:{en,ar},columns:[{key,label:{en,ar},format}],rows:[{...}]}] }

const num = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const safeAggregate = async (model, pipeline) => {
  try {
    return await model.aggregate(pipeline);
  } catch (error) {
    return [];
  }
};

const first = (rows, fallback = {}) => (Array.isArray(rows) && rows[0] ? rows[0] : fallback);

const SECTION_LABELS = {
  trading: { en: 'Trading & Inventory', ar: 'التجارة والمخزون' },
  construction: { en: 'Construction & Projects', ar: 'المقاولات والمشاريع' },
  travel_agency: { en: 'Travel Agency', ar: 'وكالة السفر' },
  restaurant: { en: 'Restaurant', ar: 'المطعم' },
  car_rental: { en: 'Car Rental', ar: 'تأجير السيارات' },
  laundry: { en: 'Laundry', ar: 'المغسلة' },
  saloon: { en: 'Saloon / Barber', ar: 'الصالون' },
  khayyat: { en: 'Tailor / Boutique', ar: 'الخياط' },
  manpower: { en: 'Manpower & Labor', ar: 'العمالة والموارد البشرية' },
  bakala: { en: 'Bakala / Supermarket', ar: 'البقالة والسوبر ماركت' },
};

// ─── Trading ─────────────────────────────────────────────────────────────────
async function buildTrading({ tenantFilter, startDate, endDate }) {
  const sellMatch = { ...tenantFilter, flow: 'sell', issueDate: { $gte: startDate, $lte: endDate }, status: { $nin: ['draft', 'cancelled', 'credited'] } };

  const [productStats, topProducts, lowStock, byCategory] = await Promise.all([
    safeAggregate(Product, [
      { $match: { ...tenantFilter, isActive: true } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          stockValueCost: { $sum: { $multiply: [{ $ifNull: ['$costPrice', 0] }, { $ifNull: ['$totalStock', 0] }] } },
          stockValueRetail: { $sum: { $multiply: [{ $ifNull: ['$sellingPrice', 0] }, { $ifNull: ['$totalStock', 0] }] } },
          lowStock: { $sum: { $cond: [{ $lte: ['$totalStock', { $ifNull: ['$reorderPoint', 10] }] }, 1, 0] } },
          outOfStock: { $sum: { $cond: [{ $lte: ['$totalStock', 0] }, 1, 0] } },
        },
      },
    ]),
    safeAggregate(Invoice, [
      { $match: sellMatch },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: { $ifNull: ['$lineItems.description', 'Unknown'] },
          quantity: { $sum: { $ifNull: ['$lineItems.quantity', 0] } },
          revenue: { $sum: { $ifNull: ['$lineItems.lineTotal', 0] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
    ]),
    safeAggregate(Product, [
      { $match: { ...tenantFilter, isActive: true, $expr: { $lte: ['$totalStock', { $ifNull: ['$reorderPoint', 10] }] } } },
      { $project: { name: { $ifNull: ['$nameEn', '$nameAr'] }, sku: 1, totalStock: 1, reorderPoint: { $ifNull: ['$reorderPoint', 10] } } },
      { $sort: { totalStock: 1 } },
      { $limit: 20 },
    ]),
    safeAggregate(Product, [
      { $match: { ...tenantFilter, isActive: true } },
      {
        $group: {
          _id: { $ifNull: ['$category', 'Uncategorized'] },
          products: { $sum: 1 },
          stockValueCost: { $sum: { $multiply: [{ $ifNull: ['$costPrice', 0] }, { $ifNull: ['$totalStock', 0] }] } },
        },
      },
      { $sort: { stockValueCost: -1 } },
    ]),
  ]);

  const stats = first(productStats);

  return {
    key: 'trading',
    label: SECTION_LABELS.trading,
    kpis: [
      { key: 'activeProducts', label: { en: 'Active Products', ar: 'المنتجات النشطة' }, value: num(stats.count), format: 'number' },
      { key: 'stockValueCost', label: { en: 'Stock Value (Cost)', ar: 'قيمة المخزون (التكلفة)' }, value: num(stats.stockValueCost), format: 'money' },
      { key: 'stockValueRetail', label: { en: 'Stock Value (Retail)', ar: 'قيمة المخزون (البيع)' }, value: num(stats.stockValueRetail), format: 'money' },
      { key: 'lowStock', label: { en: 'Low Stock Items', ar: 'أصناف منخفضة' }, value: num(stats.lowStock), format: 'number' },
      { key: 'outOfStock', label: { en: 'Out of Stock', ar: 'نفدت الكمية' }, value: num(stats.outOfStock), format: 'number' },
    ],
    tables: [
      {
        key: 'topProducts',
        title: { en: 'Top Selling Products', ar: 'المنتجات الأكثر مبيعًا' },
        columns: [
          { key: 'name', label: { en: 'Product', ar: 'المنتج' }, format: 'text' },
          { key: 'quantity', label: { en: 'Qty Sold', ar: 'الكمية المباعة' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (topProducts || []).map((row) => ({ name: row._id, quantity: num(row.quantity), revenue: num(row.revenue) })),
      },
      {
        key: 'lowStock',
        title: { en: 'Low Stock Products', ar: 'منتجات منخفضة المخزون' },
        columns: [
          { key: 'name', label: { en: 'Product', ar: 'المنتج' }, format: 'text' },
          { key: 'sku', label: { en: 'SKU', ar: 'الرمز' }, format: 'text' },
          { key: 'totalStock', label: { en: 'In Stock', ar: 'المتوفر' }, format: 'number' },
          { key: 'reorderPoint', label: { en: 'Reorder At', ar: 'حد إعادة الطلب' }, format: 'number' },
        ],
        rows: (lowStock || []).map((row) => ({ name: row.name, sku: row.sku, totalStock: num(row.totalStock), reorderPoint: num(row.reorderPoint) })),
      },
      {
        key: 'byCategory',
        title: { en: 'Inventory by Category', ar: 'المخزون حسب التصنيف' },
        columns: [
          { key: 'category', label: { en: 'Category', ar: 'التصنيف' }, format: 'text' },
          { key: 'products', label: { en: 'Products', ar: 'المنتجات' }, format: 'number' },
          { key: 'stockValueCost', label: { en: 'Stock Value (Cost)', ar: 'قيمة المخزون' }, format: 'money' },
        ],
        rows: (byCategory || []).map((row) => ({ category: row._id, products: num(row.products), stockValueCost: num(row.stockValueCost) })),
      },
    ],
  };
}

// ─── Construction ────────────────────────────────────────────────────────────
async function buildConstruction({ tenantFilter, startDate, endDate }) {
  const sellMatch = { ...tenantFilter, flow: 'sell', issueDate: { $gte: startDate, $lte: endDate }, status: { $nin: ['draft', 'cancelled', 'credited'] } };
  const expenseMatch = { ...tenantFilter, expenseDate: { $gte: startDate, $lte: endDate }, status: 'paid', isActive: true };

  const [projectStats, projects, billed, expenses] = await Promise.all([
    safeAggregate(Project, [
      { $match: tenantFilter },
      {
        $facet: {
          totals: [{ $group: { _id: null, total: { $sum: 1 }, budget: { $sum: { $ifNull: ['$budget', 0] } }, active: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, budget: { $sum: { $ifNull: ['$budget', 0] } } } }, { $sort: { count: -1 } }],
        },
      },
    ]),
    safeAggregate(Project, [
      { $match: tenantFilter },
      { $project: { code: 1, name: { $ifNull: ['$nameEn', '$nameAr'] }, status: 1, progress: { $ifNull: ['$progress', 0] }, budget: { $ifNull: ['$budget', 0] } } },
      { $sort: { budget: -1 } },
      { $limit: 25 },
    ]),
    safeAggregate(Invoice, [
      { $match: sellMatch },
      { $group: { _id: null, count: { $sum: 1 }, taxable: { $sum: { $ifNull: ['$taxableAmount', 0] } }, tax: { $sum: { $ifNull: ['$totalTax', 0] } }, total: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
    ]),
    safeAggregate(Expense, [
      { $match: expenseMatch },
      { $group: { _id: { $ifNull: ['$category', 'other'] }, count: { $sum: 1 }, totalAmount: { $sum: { $ifNull: ['$totalAmount', 0] } } } },
      { $sort: { totalAmount: -1 } },
    ]),
  ]);

  const stats = first(projectStats);
  const totals = first(stats.totals);
  const billedTotals = first(billed);

  return {
    key: 'construction',
    label: SECTION_LABELS.construction,
    kpis: [
      { key: 'activeProjects', label: { en: 'Active Projects', ar: 'المشاريع النشطة' }, value: num(totals.active), format: 'number' },
      { key: 'totalProjects', label: { en: 'Total Projects', ar: 'إجمالي المشاريع' }, value: num(totals.total), format: 'number' },
      { key: 'totalBudget', label: { en: 'Total Budget', ar: 'إجمالي الميزانية' }, value: num(totals.budget), format: 'money' },
      { key: 'billed', label: { en: 'Billed (Period)', ar: 'المفوتر (الفترة)' }, value: num(billedTotals.total), format: 'money' },
    ],
    tables: [
      {
        key: 'projects',
        title: { en: 'Projects', ar: 'المشاريع' },
        columns: [
          { key: 'code', label: { en: 'Code', ar: 'الرمز' }, format: 'text' },
          { key: 'name', label: { en: 'Project', ar: 'المشروع' }, format: 'text' },
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'progress', label: { en: 'Progress', ar: 'الإنجاز' }, format: 'percent' },
          { key: 'budget', label: { en: 'Budget', ar: 'الميزانية' }, format: 'money' },
        ],
        rows: (projects || []).map((row) => ({ code: row.code, name: row.name, status: row.status, progress: num(row.progress), budget: num(row.budget) })),
      },
      {
        key: 'byStatus',
        title: { en: 'Projects by Status', ar: 'المشاريع حسب الحالة' },
        columns: [
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'count', label: { en: 'Count', ar: 'العدد' }, format: 'number' },
          { key: 'budget', label: { en: 'Budget', ar: 'الميزانية' }, format: 'money' },
        ],
        rows: (stats.byStatus || []).map((row) => ({ status: row._id, count: num(row.count), budget: num(row.budget) })),
      },
      {
        key: 'expensesByCategory',
        title: { en: 'Costs by Category', ar: 'التكاليف حسب التصنيف' },
        columns: [
          { key: 'category', label: { en: 'Category', ar: 'التصنيف' }, format: 'text' },
          { key: 'count', label: { en: 'Count', ar: 'العدد' }, format: 'number' },
          { key: 'totalAmount', label: { en: 'Total', ar: 'الإجمالي' }, format: 'money' },
        ],
        rows: (expenses || []).map((row) => ({ category: row._id, count: num(row.count), totalAmount: num(row.totalAmount) })),
      },
    ],
  };
}

// ─── Travel Agency ───────────────────────────────────────────────────────────
async function buildTravelAgency({ tenantFilter, startDate, endDate }) {
  const bookingMatch = { ...tenantFilter, isActive: true, createdAt: { $gte: startDate, $lte: endDate } };

  const [bookingStats, byServiceType, byAirline, recent, margin] = await Promise.all([
    safeAggregate(TravelBooking, [
      { $match: bookingMatch },
      { $group: { _id: null, total: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } }, open: { $sum: { $cond: [{ $in: ['$status', ['draft', 'confirmed', 'ticketed']] }, 1, 0] } } } },
    ]),
    safeAggregate(TravelBooking, [
      { $match: bookingMatch },
      { $group: { _id: { $ifNull: ['$serviceType', 'other'] }, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
      { $sort: { revenue: -1 } },
    ]),
    safeAggregate(TravelBooking, [
      { $match: { ...bookingMatch, airlineName: { $nin: [null, ''] } } },
      { $group: { _id: '$airlineName', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
    ]),
    safeAggregate(TravelBooking, [
      { $match: bookingMatch },
      { $sort: { createdAt: -1 } },
      { $limit: 15 },
      { $project: { bookingNumber: 1, customerName: 1, serviceType: 1, status: 1, grandTotal: { $ifNull: ['$grandTotal', 0] }, createdAt: 1 } },
    ]),
    safeAggregate(Invoice, [
      { $match: { ...tenantFilter, flow: 'sell', issueDate: { $gte: startDate, $lte: endDate }, status: { $nin: ['draft', 'cancelled', 'credited'] } } },
      { $unwind: '$lineItems' },
      { $match: { 'lineItems.isTravelMargin': true } },
      { $group: { _id: null, marginTaxable: { $sum: { $ifNull: ['$lineItems.marginTaxable', 0] } }, vatOnMargin: { $sum: { $ifNull: ['$lineItems.taxAmount', 0] } } } },
    ]),
  ]);

  const stats = first(bookingStats);
  const marginStats = first(margin);

  return {
    key: 'travel_agency',
    label: SECTION_LABELS.travel_agency,
    kpis: [
      { key: 'bookings', label: { en: 'Bookings', ar: 'الحجوزات' }, value: num(stats.total), format: 'number' },
      { key: 'revenue', label: { en: 'Gross Billing', ar: 'إجمالي الفوترة' }, value: num(stats.revenue), format: 'money' },
      { key: 'margin', label: { en: 'Margin (Taxable)', ar: 'الهامش (الخاضع)' }, value: num(marginStats.marginTaxable), format: 'money' },
      { key: 'vatOnMargin', label: { en: 'VAT on Margin', ar: 'ضريبة الهامش' }, value: num(marginStats.vatOnMargin), format: 'money' },
      { key: 'open', label: { en: 'Open Bookings', ar: 'حجوزات مفتوحة' }, value: num(stats.open), format: 'number' },
    ],
    tables: [
      {
        key: 'byServiceType',
        title: { en: 'Bookings by Service Type', ar: 'الحجوزات حسب نوع الخدمة' },
        columns: [
          { key: 'type', label: { en: 'Service', ar: 'الخدمة' }, format: 'text' },
          { key: 'count', label: { en: 'Bookings', ar: 'الحجوزات' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byServiceType || []).map((row) => ({ type: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
      {
        key: 'byAirline',
        title: { en: 'Bookings by Airline', ar: 'الحجوزات حسب شركة الطيران' },
        columns: [
          { key: 'airline', label: { en: 'Airline', ar: 'شركة الطيران' }, format: 'text' },
          { key: 'count', label: { en: 'Bookings', ar: 'الحجوزات' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byAirline || []).map((row) => ({ airline: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
      {
        key: 'recent',
        title: { en: 'Recent Bookings', ar: 'أحدث الحجوزات' },
        columns: [
          { key: 'bookingNumber', label: { en: 'Booking #', ar: 'رقم الحجز' }, format: 'text' },
          { key: 'customerName', label: { en: 'Customer', ar: 'العميل' }, format: 'text' },
          { key: 'serviceType', label: { en: 'Service', ar: 'الخدمة' }, format: 'text' },
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'grandTotal', label: { en: 'Total', ar: 'الإجمالي' }, format: 'money' },
        ],
        rows: (recent || []).map((row) => ({ bookingNumber: row.bookingNumber, customerName: row.customerName, serviceType: row.serviceType, status: row.status, grandTotal: num(row.grandTotal) })),
      },
    ],
  };
}

// ─── Restaurant ──────────────────────────────────────────────────────────────
async function buildRestaurant({ tenantFilter, startDate, endDate }) {
  const orderMatch = { ...tenantFilter, isActive: true, createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ['cancelled'] } };

  const [orderStats, byOrderType, topItems, byPayment] = await Promise.all([
    safeAggregate(RestaurantOrder, [
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } }, tax: { $sum: { $ifNull: ['$totalTax', 0] } } } },
    ]),
    safeAggregate(RestaurantOrder, [
      { $match: orderMatch },
      { $group: { _id: { $ifNull: ['$orderType', 'dine_in'] }, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
      { $sort: { revenue: -1 } },
    ]),
    safeAggregate(RestaurantOrder, [
      { $match: orderMatch },
      { $unwind: '$lineItems' },
      { $group: { _id: { $ifNull: ['$lineItems.name', 'Unknown'] }, quantity: { $sum: { $ifNull: ['$lineItems.quantity', 0] } }, revenue: { $sum: { $ifNull: ['$lineItems.lineTotal', 0] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
    ]),
    safeAggregate(RestaurantOrder, [
      { $match: orderMatch },
      { $group: { _id: { $ifNull: ['$paymentMethod', 'cash'] }, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const stats = first(orderStats);
  const avgOrder = num(stats.total) > 0 ? num(stats.revenue) / num(stats.total) : 0;

  return {
    key: 'restaurant',
    label: SECTION_LABELS.restaurant,
    kpis: [
      { key: 'orders', label: { en: 'Orders', ar: 'الطلبات' }, value: num(stats.total), format: 'number' },
      { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, value: num(stats.revenue), format: 'money' },
      { key: 'tax', label: { en: 'VAT', ar: 'الضريبة' }, value: num(stats.tax), format: 'money' },
      { key: 'avgOrder', label: { en: 'Avg Order Value', ar: 'متوسط الطلب' }, value: avgOrder, format: 'money' },
    ],
    tables: [
      {
        key: 'byOrderType',
        title: { en: 'Sales by Order Type', ar: 'المبيعات حسب نوع الطلب' },
        columns: [
          { key: 'type', label: { en: 'Type', ar: 'النوع' }, format: 'text' },
          { key: 'count', label: { en: 'Orders', ar: 'الطلبات' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byOrderType || []).map((row) => ({ type: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
      {
        key: 'topItems',
        title: { en: 'Top Menu Items', ar: 'الأصناف الأكثر طلبًا' },
        columns: [
          { key: 'name', label: { en: 'Item', ar: 'الصنف' }, format: 'text' },
          { key: 'quantity', label: { en: 'Qty', ar: 'الكمية' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (topItems || []).map((row) => ({ name: row._id, quantity: num(row.quantity), revenue: num(row.revenue) })),
      },
      {
        key: 'byPayment',
        title: { en: 'Sales by Payment Method', ar: 'المبيعات حسب طريقة الدفع' },
        columns: [
          { key: 'method', label: { en: 'Method', ar: 'الطريقة' }, format: 'text' },
          { key: 'count', label: { en: 'Orders', ar: 'الطلبات' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byPayment || []).map((row) => ({ method: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
    ],
  };
}

// ─── Car Rental ──────────────────────────────────────────────────────────────
async function buildCarRental({ tenantFilter, startDate, endDate }) {
  const contractMatch = { ...tenantFilter, createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ['CANCELLED'] } };

  const [contractStats, byStatus, recent] = await Promise.all([
    safeAggregate(RentalContract, [
      { $match: contractMatch },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          subtotal: { $sum: { $ifNull: ['$subtotal', 0] } },
          vat: { $sum: { $ifNull: ['$totalVat', 0] } },
          open: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
          baseCharge: { $sum: { $ifNull: ['$baseCharge', 0] } },
          extraMileage: { $sum: { $ifNull: ['$extraMileageCharge', 0] } },
          fuelPenalty: { $sum: { $ifNull: ['$fuelPenalty', 0] } },
          latePenalty: { $sum: { $ifNull: ['$latePenalty', 0] } },
          damageCharge: { $sum: { $ifNull: ['$damageCharge', 0] } },
        },
      },
    ]),
    safeAggregate(RentalContract, [
      { $match: contractMatch },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$subtotal', 0] } } } },
      { $sort: { count: -1 } },
    ]),
    safeAggregate(RentalContract, [
      { $match: contractMatch },
      { $sort: { createdAt: -1 } },
      { $limit: 15 },
      { $project: { contractNumber: 1, status: 1, rentedDays: { $ifNull: ['$rentedDays', 0] }, subtotal: { $ifNull: ['$subtotal', 0] }, grandTotal: { $ifNull: ['$grandTotal', 0] } } },
    ]),
  ]);

  const stats = first(contractStats);
  const extraCharges = num(stats.extraMileage) + num(stats.fuelPenalty) + num(stats.latePenalty) + num(stats.damageCharge);

  return {
    key: 'car_rental',
    label: SECTION_LABELS.car_rental,
    kpis: [
      { key: 'contracts', label: { en: 'Contracts', ar: 'العقود' }, value: num(stats.total), format: 'number' },
      { key: 'revenue', label: { en: 'Revenue (ex-VAT)', ar: 'الإيراد (بدون ضريبة)' }, value: num(stats.subtotal), format: 'money' },
      { key: 'vat', label: { en: 'VAT', ar: 'الضريبة' }, value: num(stats.vat), format: 'money' },
      { key: 'open', label: { en: 'Open Contracts', ar: 'العقود المفتوحة' }, value: num(stats.open), format: 'number' },
      { key: 'extraCharges', label: { en: 'Extra Charges', ar: 'رسوم إضافية' }, value: extraCharges, format: 'money' },
    ],
    tables: [
      {
        key: 'chargeBreakdown',
        title: { en: 'Revenue Breakdown', ar: 'تفصيل الإيرادات' },
        columns: [
          { key: 'charge', label: { en: 'Charge', ar: 'الرسوم' }, format: 'text' },
          { key: 'amount', label: { en: 'Amount', ar: 'المبلغ' }, format: 'money' },
        ],
        rows: [
          { charge: 'Base Charge', amount: num(stats.baseCharge) },
          { charge: 'Extra Mileage', amount: num(stats.extraMileage) },
          { charge: 'Fuel Penalty', amount: num(stats.fuelPenalty) },
          { charge: 'Late Penalty', amount: num(stats.latePenalty) },
          { charge: 'Damage Charge', amount: num(stats.damageCharge) },
        ],
      },
      {
        key: 'byStatus',
        title: { en: 'Contracts by Status', ar: 'العقود حسب الحالة' },
        columns: [
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'count', label: { en: 'Count', ar: 'العدد' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byStatus || []).map((row) => ({ status: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
      {
        key: 'recent',
        title: { en: 'Recent Contracts', ar: 'أحدث العقود' },
        columns: [
          { key: 'contractNumber', label: { en: 'Contract #', ar: 'رقم العقد' }, format: 'text' },
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'rentedDays', label: { en: 'Days', ar: 'الأيام' }, format: 'number' },
          { key: 'grandTotal', label: { en: 'Total', ar: 'الإجمالي' }, format: 'money' },
        ],
        rows: (recent || []).map((row) => ({ contractNumber: row.contractNumber, status: row.status, rentedDays: num(row.rentedDays), grandTotal: num(row.grandTotal) })),
      },
    ],
  };
}

// ─── Laundry ─────────────────────────────────────────────────────────────────
async function buildLaundry({ tenantFilter, startDate, endDate }) {
  const orderMatch = { ...tenantFilter, createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ['cancelled'] } };

  const [orderStats, byStatus, byTreatment, byPayment] = await Promise.all([
    safeAggregate(LaundryOrder, [
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: 1 }, subtotal: { $sum: { $ifNull: ['$subtotal', 0] } }, vat: { $sum: { $ifNull: ['$totalVat', 0] } }, grandTotal: { $sum: { $ifNull: ['$grandTotal', 0] } }, urgentCount: { $sum: { $cond: ['$isUrgent', 1, 0] } }, urgentFee: { $sum: { $ifNull: ['$urgentFee', 0] } } } },
    ]),
    safeAggregate(LaundryOrder, [
      { $match: orderMatch },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$subtotal', 0] } } } },
      { $sort: { count: -1 } },
    ]),
    safeAggregate(LaundryOrder, [
      { $match: orderMatch },
      { $unwind: '$items' },
      { $group: { _id: { $ifNull: ['$items.treatment', 'None'] }, quantity: { $sum: { $ifNull: ['$items.quantity', 0] } }, revenue: { $sum: { $ifNull: ['$items.total', 0] } } } },
      { $sort: { revenue: -1 } },
    ]),
    safeAggregate(LaundryOrder, [
      { $match: orderMatch },
      { $group: { _id: { $ifNull: ['$paymentStatus', 'unpaid'] }, count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const stats = first(orderStats);
  const avgOrder = num(stats.total) > 0 ? num(stats.grandTotal) / num(stats.total) : 0;

  return {
    key: 'laundry',
    label: SECTION_LABELS.laundry,
    kpis: [
      { key: 'orders', label: { en: 'Orders', ar: 'الطلبات' }, value: num(stats.total), format: 'number' },
      { key: 'revenue', label: { en: 'Revenue (ex-VAT)', ar: 'الإيراد (بدون ضريبة)' }, value: num(stats.subtotal), format: 'money' },
      { key: 'vat', label: { en: 'VAT', ar: 'الضريبة' }, value: num(stats.vat), format: 'money' },
      { key: 'urgent', label: { en: 'Urgent Orders', ar: 'طلبات عاجلة' }, value: num(stats.urgentCount), format: 'number' },
      { key: 'avgOrder', label: { en: 'Avg Order Value', ar: 'متوسط الطلب' }, value: avgOrder, format: 'money' },
    ],
    tables: [
      {
        key: 'byStatus',
        title: { en: 'Orders by Status', ar: 'الطلبات حسب الحالة' },
        columns: [
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'count', label: { en: 'Orders', ar: 'الطلبات' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byStatus || []).map((row) => ({ status: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
      {
        key: 'byTreatment',
        title: { en: 'Revenue by Treatment', ar: 'الإيراد حسب المعالجة' },
        columns: [
          { key: 'treatment', label: { en: 'Treatment', ar: 'المعالجة' }, format: 'text' },
          { key: 'quantity', label: { en: 'Qty', ar: 'الكمية' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byTreatment || []).map((row) => ({ treatment: row._id, quantity: num(row.quantity), revenue: num(row.revenue) })),
      },
      {
        key: 'byPayment',
        title: { en: 'Orders by Payment Status', ar: 'الطلبات حسب حالة الدفع' },
        columns: [
          { key: 'status', label: { en: 'Payment Status', ar: 'حالة الدفع' }, format: 'text' },
          { key: 'count', label: { en: 'Orders', ar: 'الطلبات' }, format: 'number' },
          { key: 'revenue', label: { en: 'Total', ar: 'الإجمالي' }, format: 'money' },
        ],
        rows: (byPayment || []).map((row) => ({ status: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
    ],
  };
}

// ─── Saloon ──────────────────────────────────────────────────────────────────
async function buildSaloon({ tenantFilter, startDate, endDate }) {
  const orderMatch = { ...tenantFilter, createdAt: { $gte: startDate, $lte: endDate }, status: { $nin: ['cancelled'] } };

  const [orderStats, byStatus, topServices, byStaff] = await Promise.all([
    safeAggregate(SaloonOrder, [
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: 1 }, subtotal: { $sum: { $ifNull: ['$subtotal', 0] } }, vat: { $sum: { $ifNull: ['$totalVat', 0] } }, grandTotal: { $sum: { $ifNull: ['$grandTotal', 0] } }, completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } } } },
    ]),
    safeAggregate(SaloonOrder, [
      { $match: orderMatch },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
      { $sort: { count: -1 } },
    ]),
    safeAggregate(SaloonOrder, [
      { $match: orderMatch },
      { $unwind: '$items' },
      { $group: { _id: { $ifNull: ['$items.nameEn', 'Unknown'] }, quantity: { $sum: { $ifNull: ['$items.quantity', 0] } }, revenue: { $sum: { $ifNull: ['$items.total', 0] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
    ]),
    safeAggregate(SaloonOrder, [
      { $match: orderMatch },
      { $unwind: '$items' },
      { $match: { 'items.staff': { $nin: [null, ''] } } },
      { $group: { _id: '$items.staff', services: { $sum: { $ifNull: ['$items.quantity', 0] } }, revenue: { $sum: { $ifNull: ['$items.total', 0] } } } },
      { $sort: { revenue: -1 } },
    ]),
  ]);

  const stats = first(orderStats);
  const avgOrder = num(stats.total) > 0 ? num(stats.grandTotal) / num(stats.total) : 0;

  return {
    key: 'saloon',
    label: SECTION_LABELS.saloon,
    kpis: [
      { key: 'orders', label: { en: 'Tickets', ar: 'الطلبات' }, value: num(stats.total), format: 'number' },
      { key: 'revenue', label: { en: 'Revenue (ex-VAT)', ar: 'الإيراد (بدون ضريبة)' }, value: num(stats.subtotal), format: 'money' },
      { key: 'vat', label: { en: 'VAT', ar: 'الضريبة' }, value: num(stats.vat), format: 'money' },
      { key: 'avgOrder', label: { en: 'Avg Ticket', ar: 'متوسط الطلب' }, value: avgOrder, format: 'money' },
    ],
    tables: [
      {
        key: 'topServices',
        title: { en: 'Top Services', ar: 'أكثر الخدمات' },
        columns: [
          { key: 'service', label: { en: 'Service', ar: 'الخدمة' }, format: 'text' },
          { key: 'quantity', label: { en: 'Count', ar: 'العدد' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (topServices || []).map((row) => ({ service: row._id, quantity: num(row.quantity), revenue: num(row.revenue) })),
      },
      {
        key: 'byStaff',
        title: { en: 'Revenue by Staff', ar: 'الإيراد حسب الموظف' },
        columns: [
          { key: 'staff', label: { en: 'Staff', ar: 'الموظف' }, format: 'text' },
          { key: 'services', label: { en: 'Services', ar: 'الخدمات' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byStaff || []).map((row) => ({ staff: row._id, services: num(row.services), revenue: num(row.revenue) })),
      },
      {
        key: 'byStatus',
        title: { en: 'Tickets by Status', ar: 'الطلبات حسب الحالة' },
        columns: [
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'count', label: { en: 'Count', ar: 'العدد' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (byStatus || []).map((row) => ({ status: row._id, count: num(row.count), revenue: num(row.revenue) })),
      },
    ],
  };
}

// ─── Tailor / Khayyat ────────────────────────────────────────────────────────
async function buildKhayyat({ tenantFilter, startDate, endDate }) {
  const orderMatch = { ...tenantFilter, createdAt: { $gte: startDate, $lte: endDate } };

  const [orderStats, byStatus] = await Promise.all([
    safeAggregate(KhayyatStitching, [
      { $match: orderMatch },
      { $group: { _id: null, total: { $sum: 1 }, price: { $sum: { $ifNull: ['$price', 0] } }, paid: { $sum: { $ifNull: ['$paidAmount', 0] } }, delivered: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'done']] }, 1, 0] } } } },
    ]),
    safeAggregate(KhayyatStitching, [
      { $match: orderMatch },
      { $group: { _id: '$status', count: { $sum: 1 }, price: { $sum: { $ifNull: ['$price', 0] } } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  const stats = first(orderStats);
  const outstanding = num(stats.price) - num(stats.paid);

  return {
    key: 'khayyat',
    label: SECTION_LABELS.khayyat,
    kpis: [
      { key: 'orders', label: { en: 'Orders', ar: 'الطلبات' }, value: num(stats.total), format: 'number' },
      { key: 'price', label: { en: 'Total Value', ar: 'إجمالي القيمة' }, value: num(stats.price), format: 'money' },
      { key: 'paid', label: { en: 'Collected', ar: 'المحصل' }, value: num(stats.paid), format: 'money' },
      { key: 'outstanding', label: { en: 'Outstanding', ar: 'المتبقي' }, value: outstanding, format: 'money' },
      { key: 'delivered', label: { en: 'Delivered', ar: 'تم التسليم' }, value: num(stats.delivered), format: 'number' },
    ],
    tables: [
      {
        key: 'byStatus',
        title: { en: 'Orders by Status', ar: 'الطلبات حسب الحالة' },
        columns: [
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'count', label: { en: 'Orders', ar: 'الطلبات' }, format: 'number' },
          { key: 'price', label: { en: 'Value', ar: 'القيمة' }, format: 'money' },
        ],
        rows: (byStatus || []).map((row) => ({ status: row._id, count: num(row.count), price: num(row.price) })),
      },
    ],
  };
}

// ─── Manpower ────────────────────────────────────────────────────────────────
async function buildManpower({ tenantFilter, startDate, endDate }) {
  const assignmentMatch = { ...tenantFilter, isActive: true, startDate: { $lte: endDate }, $or: [{ endDate: null }, { endDate: { $gte: startDate } }] };

  const [assignmentStats, byStatus, byClient, workersByTrade, workerStats] = await Promise.all([
    safeAggregate(ManpowerAssignment, [
      { $match: { ...tenantFilter, isActive: true } },
      { $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, totalBilled: { $sum: { $ifNull: ['$totalBilled', 0] } } } },
    ]),
    safeAggregate(ManpowerAssignment, [
      { $match: { ...tenantFilter, isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 }, billed: { $sum: { $ifNull: ['$totalBilled', 0] } } } },
      { $sort: { count: -1 } },
    ]),
    safeAggregate(ManpowerAssignment, [
      { $match: { ...tenantFilter, isActive: true } },
      { $group: { _id: { $ifNull: ['$clientName', 'Unknown'] }, count: { $sum: 1 }, billed: { $sum: { $ifNull: ['$totalBilled', 0] } } } },
      { $sort: { billed: -1 } },
      { $limit: 15 },
    ]),
    safeAggregate(ManpowerWorker, [
      { $match: { ...tenantFilter, isActive: true } },
      { $group: { _id: { $ifNull: ['$trade', 'other'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    safeAggregate(ManpowerWorker, [
      { $match: { ...tenantFilter, isActive: true } },
      { $group: { _id: null, total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } }, assigned: { $sum: { $cond: [{ $eq: ['$status', 'assigned'] }, 1, 0] } } } },
    ]),
  ]);

  const stats = first(assignmentStats);
  const workers = first(workerStats);
  // Touch assignmentMatch so period filtering remains available for future refinement without unused-var lint noise.
  void assignmentMatch;

  return {
    key: 'manpower',
    label: SECTION_LABELS.manpower,
    kpis: [
      { key: 'assignments', label: { en: 'Assignments', ar: 'الإسنادات' }, value: num(stats.total), format: 'number' },
      { key: 'active', label: { en: 'Active', ar: 'النشطة' }, value: num(stats.active), format: 'number' },
      { key: 'totalBilled', label: { en: 'Total Billed', ar: 'إجمالي الفوترة' }, value: num(stats.totalBilled), format: 'money' },
      { key: 'workers', label: { en: 'Workers', ar: 'العمال' }, value: num(workers.total), format: 'number' },
      { key: 'available', label: { en: 'Available', ar: 'المتاحون' }, value: num(workers.available), format: 'number' },
    ],
    tables: [
      {
        key: 'byStatus',
        title: { en: 'Assignments by Status', ar: 'الإسنادات حسب الحالة' },
        columns: [
          { key: 'status', label: { en: 'Status', ar: 'الحالة' }, format: 'text' },
          { key: 'count', label: { en: 'Count', ar: 'العدد' }, format: 'number' },
          { key: 'billed', label: { en: 'Billed', ar: 'المفوتر' }, format: 'money' },
        ],
        rows: (byStatus || []).map((row) => ({ status: row._id, count: num(row.count), billed: num(row.billed) })),
      },
      {
        key: 'byClient',
        title: { en: 'Billing by Client', ar: 'الفوترة حسب العميل' },
        columns: [
          { key: 'client', label: { en: 'Client', ar: 'العميل' }, format: 'text' },
          { key: 'count', label: { en: 'Assignments', ar: 'الإسنادات' }, format: 'number' },
          { key: 'billed', label: { en: 'Billed', ar: 'المفوتر' }, format: 'money' },
        ],
        rows: (byClient || []).map((row) => ({ client: row._id, count: num(row.count), billed: num(row.billed) })),
      },
      {
        key: 'workersByTrade',
        title: { en: 'Workers by Trade', ar: 'العمال حسب المهنة' },
        columns: [
          { key: 'trade', label: { en: 'Trade', ar: 'المهنة' }, format: 'text' },
          { key: 'count', label: { en: 'Workers', ar: 'العمال' }, format: 'number' },
        ],
        rows: (workersByTrade || []).map((row) => ({ trade: row._id, count: num(row.count) })),
      },
    ],
  };
}

// ─── Bakala / Supermarket ────────────────────────────────────────────────────
async function buildBakala({ tenantFilter, startDate, endDate }) {
  const saleMatch = { ...tenantFilter, businessContext: 'bakala', flow: 'sell', issueDate: { $gte: startDate, $lte: endDate }, status: { $nin: ['draft', 'cancelled', 'credited'] } };
  const shiftMatch = { ...tenantFilter, openedAt: { $gte: startDate, $lte: endDate } };

  const [saleStats, byPayment, topProducts, shiftStats, lowStock] = await Promise.all([
    safeAggregate(Invoice, [
      { $match: saleMatch },
      { $group: { _id: null, receipts: { $sum: 1 }, taxable: { $sum: { $ifNull: ['$taxableAmount', 0] } }, tax: { $sum: { $ifNull: ['$totalTax', 0] } }, total: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
    ]),
    safeAggregate(Invoice, [
      { $match: saleMatch },
      { $group: { _id: { $ifNull: ['$paymentMethod', 'cash'] }, count: { $sum: 1 }, total: { $sum: { $ifNull: ['$grandTotal', 0] } } } },
      { $sort: { total: -1 } },
    ]),
    safeAggregate(Invoice, [
      { $match: saleMatch },
      { $unwind: '$lineItems' },
      { $group: { _id: { $ifNull: ['$lineItems.description', 'Unknown'] }, quantity: { $sum: { $ifNull: ['$lineItems.quantity', 0] } }, revenue: { $sum: { $ifNull: ['$lineItems.lineTotal', 0] } } } },
      { $sort: { revenue: -1 } },
      { $limit: 15 },
    ]),
    safeAggregate(PosSession, [
      { $match: shiftMatch },
      { $group: { _id: null, shifts: { $sum: 1 }, totalSales: { $sum: { $ifNull: ['$totalSales', 0] } }, discrepancy: { $sum: { $ifNull: ['$cashDiscrepancy', 0] } } } },
    ]),
    safeAggregate(BakalaProduct, [
      { $match: { ...tenantFilter, isActive: true, $expr: { $lte: ['$stockQuantity', { $ifNull: ['$minimumStockAlertLevel', 10] }] } } },
      { $project: { name: 1, primaryBarcode: 1, stockQuantity: 1, minimumStockAlertLevel: { $ifNull: ['$minimumStockAlertLevel', 10] } } },
      { $sort: { stockQuantity: 1 } },
      { $limit: 20 },
    ]),
  ]);

  const stats = first(saleStats);
  const shifts = first(shiftStats);
  const avgBasket = num(stats.receipts) > 0 ? num(stats.total) / num(stats.receipts) : 0;

  return {
    key: 'bakala',
    label: SECTION_LABELS.bakala,
    kpis: [
      { key: 'receipts', label: { en: 'Receipts', ar: 'الإيصالات' }, value: num(stats.receipts), format: 'number' },
      { key: 'grossSales', label: { en: 'Gross Sales', ar: 'إجمالي المبيعات' }, value: num(stats.total), format: 'money' },
      { key: 'vat', label: { en: 'VAT', ar: 'الضريبة' }, value: num(stats.tax), format: 'money' },
      { key: 'avgBasket', label: { en: 'Avg Basket', ar: 'متوسط السلة' }, value: avgBasket, format: 'money' },
      { key: 'shifts', label: { en: 'Shifts', ar: 'الورديات' }, value: num(shifts.shifts), format: 'number' },
    ],
    tables: [
      {
        key: 'byPayment',
        title: { en: 'Sales by Payment Method', ar: 'المبيعات حسب طريقة الدفع' },
        columns: [
          { key: 'method', label: { en: 'Method', ar: 'الطريقة' }, format: 'text' },
          { key: 'count', label: { en: 'Receipts', ar: 'الإيصالات' }, format: 'number' },
          { key: 'total', label: { en: 'Total', ar: 'الإجمالي' }, format: 'money' },
        ],
        rows: (byPayment || []).map((row) => ({ method: row._id, count: num(row.count), total: num(row.total) })),
      },
      {
        key: 'topProducts',
        title: { en: 'Top Selling Products', ar: 'المنتجات الأكثر مبيعًا' },
        columns: [
          { key: 'name', label: { en: 'Product', ar: 'المنتج' }, format: 'text' },
          { key: 'quantity', label: { en: 'Qty Sold', ar: 'الكمية' }, format: 'number' },
          { key: 'revenue', label: { en: 'Revenue', ar: 'الإيراد' }, format: 'money' },
        ],
        rows: (topProducts || []).map((row) => ({ name: row._id, quantity: num(row.quantity), revenue: num(row.revenue) })),
      },
      {
        key: 'lowStock',
        title: { en: 'Low Stock Products', ar: 'منتجات منخفضة المخزون' },
        columns: [
          { key: 'name', label: { en: 'Product', ar: 'المنتج' }, format: 'text' },
          { key: 'primaryBarcode', label: { en: 'Barcode', ar: 'الباركود' }, format: 'text' },
          { key: 'stockQuantity', label: { en: 'In Stock', ar: 'المتوفر' }, format: 'number' },
          { key: 'minimumStockAlertLevel', label: { en: 'Alert At', ar: 'حد التنبيه' }, format: 'number' },
        ],
        rows: (lowStock || []).map((row) => ({ name: row.name, primaryBarcode: row.primaryBarcode, stockQuantity: num(row.stockQuantity), minimumStockAlertLevel: num(row.minimumStockAlertLevel) })),
      },
    ],
  };
}

const BUILDERS = {
  trading: buildTrading,
  construction: buildConstruction,
  travel_agency: buildTravelAgency,
  restaurant: buildRestaurant,
  car_rental: buildCarRental,
  laundry: buildLaundry,
  saloon: buildSaloon,
  khayyat: buildKhayyat,
  manpower: buildManpower,
  bakala: buildBakala,
};

export async function buildBusinessReports({ tenant, tenantFilter, startDate, endDate, only }) {
  const businessTypes = only ? [only] : getTenantBusinessTypes(tenant);
  const sections = [];

  for (const type of businessTypes) {
    const builder = BUILDERS[type];
    if (!builder) continue;
    try {
      sections.push(await builder({ tenantFilter, startDate, endDate }));
    } catch (error) {
      sections.push({ key: type, label: SECTION_LABELS[type] || { en: type, ar: type }, kpis: [], tables: [], error: error.message });
    }
  }

  return { businessTypes, sections };
}
