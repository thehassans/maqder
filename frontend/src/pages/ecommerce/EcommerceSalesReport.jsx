import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, Download, Loader2, Calendar, TrendingUp, ShoppingBag, DollarSign, Package, Clock, Users, CreditCard, Tag, Receipt } from 'lucide-react';
import api from '../../lib/api';

const STATUS_COLORS = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  processing: 'bg-indigo-50 text-indigo-700',
  shipped: 'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-50 text-red-600',
  returned: 'bg-orange-50 text-orange-700',
};

const CHART_COLORS = ['#4f46e5', '#059669', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#6366f1'];

export default function EcommerceSalesReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ startDate, endDate });
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/ecommerce/orders/meta/sales-report?${params}`);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load sales report', err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, statusFilter]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const fmtCurrency = (v) => `${(v || 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} SAR`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  const fmtNumber = (v) => (v || 0).toLocaleString('en');

  const exportCsv = () => {
    if (!report) return;
    const sections = [];

    sections.push('=== SALES REPORT SUMMARY ===');
    sections.push(['Metric', 'Value'].join(','));
    const s = report.summary;
    const summaryRows = [
      ['Period Start', fmtDate(report.period.startDate)],
      ['Period End', fmtDate(report.period.endDate)],
      ['Total Revenue', s.totalRevenue],
      ['Total Orders', s.totalOrders],
      ['Total Items', s.totalItems],
      ['Avg Order Value', s.avgOrderValue],
      ['Min Order', s.minOrder],
      ['Max Order', s.maxOrder],
      ['Subtotal', s.totalSubtotal],
      ['Shipping', s.totalShipping],
      ['Tax', s.totalTax],
      ['Discount', s.totalDiscount],
      ['Effective Tax Rate (%)', s.effectiveTaxRate],
    ];
    summaryRows.forEach(r => sections.push(r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')));

    sections.push('');
    sections.push('=== PRODUCT PERFORMANCE ===');
    sections.push(['Product', 'SKU', 'Qty Sold', 'Revenue', 'Avg Price', 'Orders'].join(','));
    (report.productPerformance || []).forEach(p => {
      sections.push([`"${p.title || ''}"`, `"${p.sku || ''}"`, p.qtySold, p.revenue, Math.round((p.avgPrice || 0) * 100) / 100, p.ordersCount].join(','));
    });

    sections.push('');
    sections.push('=== CATEGORY BREAKDOWN ===');
    sections.push(['Category', 'Revenue', 'Qty', 'Orders'].join(','));
    (report.categoryBreakdown || []).forEach(c => {
      sections.push([`"${c.category || ''}"`, c.revenue, c.qty, c.orders].join(','));
    });

    sections.push('');
    sections.push('=== TOP CUSTOMERS ===');
    sections.push(['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Avg Order'].join(','));
    (report.topCustomers || []).forEach(c => {
      sections.push([`"${c.name || ''}"`, `"${c.email || ''}"`, `"${c.phone || ''}"`, c.orderCount, c.totalSpent, Math.round((c.avgOrder || 0) * 100) / 100].join(','));
    });

    sections.push('');
    sections.push('=== PAYMENT METHODS ===');
    sections.push(['Method', 'Count', 'Revenue'].join(','));
    (report.paymentMethods || []).forEach(p => {
      sections.push([`"${p.method || ''}"`, p.count, p.revenue].join(','));
    });

    sections.push('');
    sections.push('=== DAILY SERIES ===');
    sections.push(['Date', 'Revenue', 'Orders', 'Items'].join(','));
    (report.dailySeries || []).forEach(d => {
      sections.push([d.date, d.revenue, d.orders, d.items].join(','));
    });

    const csv = sections.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url;
    el.download = `sales-report-${startDate}-to-${endDate}.csv`;
    el.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !report) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const r = report || {};
  const s = r.summary || {};

  // Chart data
  const maxRevenue = Math.max(...(r.dailySeries || []).map(d => d.revenue), 1);
  const chartWidth = 800;
  const chartHeight = 160;
  const seriesPoints = (r.dailySeries || []).map((d, i) => {
    const x = (i / Math.max((r.dailySeries || []).length - 1, 1)) * chartWidth;
    const y = chartHeight - (d.revenue / maxRevenue) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const seriesArea = `0,${chartHeight} ${seriesPoints} ${chartWidth},${chartHeight}`;

  // Hourly chart
  const maxHourly = Math.max(...(r.hourlyDistribution || []).map(h => h.revenue), 1);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Sales Report</h1>
            <p className="text-sm text-gray-400">Detailed performance analysis with custom date ranges</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <span className="text-gray-400 text-sm">—</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="returned">Returned</option>
          </select>
          <button onClick={exportCsv} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Quick date presets */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: 'Today', days: 0 },
          { label: 'Yesterday', days: 1, offset: 1 },
          { label: 'Last 7 days', days: 7 },
          { label: 'Last 30 days', days: 30 },
          { label: 'Last 90 days', days: 90 },
          { label: 'This month', custom: 'month' },
          { label: 'This year', custom: 'year' },
        ].map(preset => (
          <button key={preset.label} onClick={() => {
            if (preset.custom === 'month') {
              const d = new Date();
              setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            } else if (preset.custom === 'year') {
              const d = new Date();
              setStartDate(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            } else if (preset.offset) {
              const d = new Date(Date.now() - preset.offset * 24 * 60 * 60 * 1000);
              setStartDate(d.toISOString().split('T')[0]);
              setEndDate(d.toISOString().split('T')[0]);
            } else if (preset.days === 0) {
              const d = new Date().toISOString().split('T')[0];
              setStartDate(d);
              setEndDate(d);
            } else {
              setStartDate(new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }
          }} className="px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 dark:border-dark-600 text-gray-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all">
            {preset.label}
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <KpiCard icon={DollarSign} label="Total Revenue" value={fmtCurrency(s.totalRevenue)} color="emerald" />
        <KpiCard icon={ShoppingBag} label="Total Orders" value={fmtNumber(s.totalOrders)} color="indigo" />
        <KpiCard icon={TrendingUp} label="Avg Order Value" value={fmtCurrency(s.avgOrderValue)} color="violet" />
        <KpiCard icon={Package} label="Items Sold" value={fmtNumber(s.totalItems)} color="amber" />
        <KpiCard icon={Receipt} label="Tax Collected" value={fmtCurrency(s.totalTax)} color="rose" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Subtotal" value={fmtCurrency(s.totalSubtotal)} />
        <MiniStat label="Shipping" value={fmtCurrency(s.totalShipping)} />
        <MiniStat label="Discounts" value={fmtCurrency(s.totalDiscount)} />
        <MiniStat label="Effective Tax Rate" value={`${s.effectiveTaxRate}%`} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap border-b border-gray-100 dark:border-dark-700 pb-2">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'products', label: 'Products' },
          { key: 'categories', label: 'Categories' },
          { key: 'customers', label: 'Customers' },
          { key: 'payments', label: 'Payments' },
          { key: 'hourly', label: 'Hourly' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Revenue chart */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
            {(r.dailySeries || []).length > 0 ? (
              <>
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full" style={{ height: '180px' }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={seriesArea} fill="url(#revGrad)" />
                  <polyline points={seriesPoints} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{fmtDate(r.dailySeries?.[0]?.date)}</span>
                  <span>{fmtDate(r.dailySeries?.[r.dailySeries?.length - 1]?.date)}</span>
                </div>
              </>
            ) : (
              <div className="h-32 flex items-center justify-center text-gray-300 text-sm">No data for this period</div>
            )}
          </div>

          {/* Status distribution + Payment methods */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Status Distribution</h3>
              <div className="space-y-2">
                {(r.statusDistribution || []).map(s => (
                  <div key={s.status} className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-2">{s.count}</span>
                      <span className="text-xs text-gray-400 ml-2">{fmtCurrency(s.revenue)}</span>
                    </div>
                  </div>
                ))}
                {(r.statusDistribution || []).length === 0 && <p className="text-sm text-gray-300 text-center py-4">No data</p>}
              </div>
            </div>

            <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
              <div className="space-y-3">
                {(r.paymentMethods || []).map(p => (
                  <div key={p.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">{p.method || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{p.count} orders</p>
                      <p className="text-xs text-gray-400">{fmtCurrency(p.revenue)}</p>
                    </div>
                  </div>
                ))}
                {(r.paymentMethods || []).length === 0 && <p className="text-sm text-gray-300 text-center py-4">No payment data</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Product Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">#</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">Product</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">SKU</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase text-gray-400">Qty Sold</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase text-gray-400">Avg Price</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase text-gray-400">Orders</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase text-gray-400">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(r.productPerformance || []).map((p, idx) => (
                  <tr key={p.productId || idx} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                    <td className="px-5 py-3 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">{p.title || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{p.sku || '—'}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-700 dark:text-gray-300">{p.qtySold}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{fmtCurrency(p.avgPrice)}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{p.ordersCount}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">{fmtCurrency(p.revenue)}</td>
                  </tr>
                ))}
                {(r.productPerformance || []).length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No product data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sales by Category</h3>
          {(r.categoryBreakdown || []).length > 0 ? (
            <div className="space-y-3">
              {(() => {
                const maxRev = Math.max(...r.categoryBreakdown.map(c => c.revenue), 1);
                return r.categoryBreakdown.map((c, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{c.category || 'Uncategorized'}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtCurrency(c.revenue)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 dark:bg-dark-700 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{
                        width: `${(c.revenue / maxRev * 100)}%`,
                        background: CHART_COLORS[i % 10],
                      }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{c.qty} sold · {c.orders} orders</p>
                  </div>
                ));
              })()}
            </div>
          ) : <p className="text-sm text-gray-300 text-center py-4">No category data</p>}
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Top Customers by Revenue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700">
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">#</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">Email</th>
                  <th className="px-5 py-3 text-left text-xs font-bold uppercase text-gray-400">Phone</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase text-gray-400">Orders</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase text-gray-400">Avg Order</th>
                  <th className="px-5 py-3 text-right text-xs font-bold uppercase text-gray-400">Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {(r.topCustomers || []).map((c, idx) => (
                  <tr key={idx} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                    <td className="px-5 py-3 text-gray-400 font-bold">{idx + 1}</td>
                    <td className="px-5 py-3 font-bold text-gray-900 dark:text-white">{c.name || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{c.email || '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{c.phone || '—'}</td>
                    <td className="px-5 py-3 text-right font-bold text-gray-700 dark:text-gray-300">{c.orderCount}</td>
                    <td className="px-5 py-3 text-right text-gray-500">{fmtCurrency(c.avgOrder)}</td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-600">{fmtCurrency(c.totalSpent)}</td>
                  </tr>
                ))}
                {(r.topCustomers || []).length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No customer data for this period</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Payment Method Breakdown</h3>
            <div className="space-y-4">
              {(r.paymentMethods || []).map((p, i) => {
                const totalRev = (r.paymentMethods || []).reduce((sum, x) => sum + x.revenue, 0) || 1;
                return (
                  <div key={p.method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">{p.method || 'N/A'}</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{fmtCurrency(p.revenue)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-gray-100 dark:bg-dark-700 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(p.revenue / totalRev * 100)}%`, background: CHART_COLORS[i % 10] }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{p.count} orders · {Math.round(p.revenue / totalRev * 100)}% of revenue</p>
                  </div>
                );
              })}
              {(r.paymentMethods || []).length === 0 && <p className="text-sm text-gray-300 text-center py-4">No payment data</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Status Breakdown</h3>
            <div className="space-y-3">
              {(r.statusDistribution || []).map(s => {
                const totalOrders = (r.statusDistribution || []).reduce((sum, x) => sum + x.count, 0) || 1;
                return (
                  <div key={s.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                      <span className="text-xs text-gray-400">{Math.round(s.count / totalOrders * 100)}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{s.count}</span>
                      <span className="text-xs text-gray-400 ml-2">{fmtCurrency(s.revenue)}</span>
                    </div>
                  </div>
                );
              })}
              {(r.statusDistribution || []).length === 0 && <p className="text-sm text-gray-300 text-center py-4">No status data</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'hourly' && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-500" /> Hourly Sales Distribution
          </h3>
          {(r.hourlyDistribution || []).length > 0 ? (
            <div className="flex items-end gap-1 h-48 mt-4">
              {Array.from({ length: 24 }, (_, h) => {
                const data = r.hourlyDistribution.find(d => d.hour === h);
                const height = data ? (data.revenue / maxHourly) * 100 : 0;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="w-full rounded-t transition-all hover:opacity-80" style={{
                      height: `${Math.max(height, 2)}%`,
                      background: height > 0 ? '#4f46e5' : '#e5e7eb',
                      minHeight: '4px',
                    }} title={data ? `${h}:00 — ${fmtCurrency(data.revenue)} (${data.orders} orders)` : `${h}:00 — No sales`} />
                    <span className="text-[10px] text-gray-400">{h}</span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-gray-300 text-center py-4">No hourly data</p>}
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="bg-white dark:bg-dark-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-dark-700">
      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
