import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Package, DollarSign, Receipt, BarChart3, Loader2, Download, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'profit', label: 'Profit Margins', icon: DollarSign },
  { id: 'slow', label: 'Slow-Moving', icon: AlertTriangle },
  { id: 'category', label: 'By Category', icon: TrendingUp },
  { id: 'vat', label: 'VAT Report', icon: Receipt },
];

export default function BookStoreReports() {
  const [tab, setTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [range, setRange] = useState('30d');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchReport();
  }, [tab, range, dateRange.startDate, dateRange.endDate]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = '';
      let params = {};
      switch (tab) {
        case 'dashboard': url = '/bookstore/reports/dashboard'; params = { range }; break;
        case 'profit': url = '/bookstore/reports/profit-margins'; break;
        case 'slow': url = '/bookstore/reports/slow-moving'; params = { days: 90 }; break;
        case 'category': url = '/bookstore/reports/sales-by-category'; params = dateRange; break;
        case 'vat': url = '/bookstore/reports/vat'; params = dateRange; break;
        default: url = '/bookstore/reports/dashboard';
      }
      const res = await api.get(url, { params });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (n) => Number(n || 0).toFixed(2);
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app/dashboard/bookstore/dashboard" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-sm text-gray-400">Sales, inventory, and tax insights</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); setData(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold transition-all ${
              tab === id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10'
                : 'bg-white dark:bg-dark-800 text-gray-500 border border-gray-100 dark:border-dark-700 hover:border-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Date range for category & vat */}
      {(tab === 'category' || tab === 'vat') && (
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} className="input max-w-[180px]" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} className="input max-w-[180px]" />
        </div>
      )}

      {/* Range selector for dashboard */}
      {tab === 'dashboard' && (
        <div className="flex items-center gap-2">
          {['7d', '30d', '90d', '1y'].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                range === r ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              {r === '7d' ? '7 Days' : r === '30d' ? '30 Days' : r === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <>
          {/* DASHBOARD */}
          {tab === 'dashboard' && data && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Revenue', value: `SAR ${fmt(data.summary?.totalRevenue)}`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Total Tax', value: `SAR ${fmt(data.summary?.totalTax)}`, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Invoices', value: data.summary?.invoiceCount || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Avg Invoice', value: `SAR ${fmt(data.summary?.avgInvoiceValue)}`, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-2xl p-5`}>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily sales chart */}
                <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Daily Sales</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {(data.dailySales || []).slice(-20).map(d => (
                      <div key={d._id} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-24 shrink-0">{d._id}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, (d.revenue / Math.max(...(data.dailySales || []).map(s => s.revenue), 1)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-20 text-right">SAR {fmt(d.revenue)}</span>
                      </div>
                    ))}
                    {(data.dailySales || []).length === 0 && <p className="text-gray-400 text-sm text-center py-8">No sales data</p>}
                  </div>
                </div>

                {/* Top products */}
                <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top Products</h3>
                  <div className="space-y-2">
                    {(data.topProducts || []).map((p, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="flex-1 text-sm font-medium text-gray-900 truncate">{p._id}</span>
                        <span className="text-xs text-gray-400">{p.totalSold} sold</span>
                        <span className="text-sm font-bold text-indigo-600">SAR {fmt(p.revenue)}</span>
                      </div>
                    ))}
                    {(data.topProducts || []).length === 0 && <p className="text-gray-400 text-sm text-center py-8">No sales data</p>}
                  </div>
                </div>
              </div>

              {/* Payment breakdown */}
              {(data.paymentBreakdown || []).length > 0 && (
                <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {data.paymentBreakdown.map(p => (
                      <div key={p._id} className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-xs font-bold text-gray-500 uppercase">{p._id}</p>
                        <p className="text-xl font-black text-gray-900">SAR {fmt(p.total)}</p>
                        <p className="text-xs text-gray-400">{p.count} transactions</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PROFIT MARGINS */}
          {tab === 'profit' && data && (
            <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="text-left py-4 px-6">Product</th>
                      <th className="text-left py-4 px-4">Type</th>
                      <th className="text-right py-4 px-4">Cost</th>
                      <th className="text-right py-4 px-4">Sell Price</th>
                      <th className="text-right py-4 px-4">Profit</th>
                      <th className="text-right py-4 px-4">Margin %</th>
                      <th className="text-center py-4 px-4">Stock</th>
                      <th className="text-right py-4 px-6">Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(p => (
                      <tr key={p._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-6 text-sm font-medium text-gray-900">{p.name}</td>
                        <td className="py-3 px-4"><span className="text-xs text-gray-500 capitalize">{p.productType}</span></td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">{fmt(p.costPrice)}</td>
                        <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">{fmt(p.sellPrice)}</td>
                        <td className={`py-3 px-4 text-right text-sm font-bold ${p.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(p.profit)}</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${p.margin >= 30 ? 'bg-emerald-50 text-emerald-600' : p.margin >= 10 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'}`}>
                            {p.margin}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">{p.stockQuantity}</td>
                        <td className="py-3 px-6 text-right text-sm text-gray-600">{fmt(p.stockValue)}</td>
                      </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan="8" className="text-center py-12 text-gray-400">No products found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SLOW-MOVING */}
          {tab === 'slow' && data && (
            <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
              <div className="p-4 bg-amber-50 border-b border-amber-100">
                <p className="text-sm text-amber-700 font-medium">Products with stock but no sales in the last 90 days</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="text-left py-4 px-6">Product</th>
                      <th className="text-left py-4 px-4">Type</th>
                      <th className="text-center py-4 px-4">Stock</th>
                      <th className="text-right py-4 px-4">Stock Value</th>
                      <th className="text-center py-4 px-4">Units Sold (90d)</th>
                      <th className="text-left py-4 px-4">Last Sold</th>
                      <th className="text-center py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map(p => (
                      <tr key={p._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="py-3 px-6 text-sm font-medium text-gray-900">{p.name}</td>
                        <td className="py-3 px-4 text-xs text-gray-500 capitalize">{p.productType}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">{p.stockQuantity}</td>
                        <td className="py-3 px-4 text-right text-sm text-gray-600">{fmt(p.stockValue)}</td>
                        <td className="py-3 px-4 text-center text-sm text-gray-600">{p.unitsSold}</td>
                        <td className="py-3 px-4 text-xs text-gray-500">{p.lastSoldDate ? fmtDate(p.lastSoldDate) : 'Never'}</td>
                        <td className="py-3 px-6 text-center">
                          {p.isSlowMoving ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600">
                              <AlertTriangle className="w-3 h-3" /> Slow
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && <tr><td colSpan="7" className="text-center py-12 text-gray-400">No inventory with stock</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SALES BY CATEGORY */}
          {tab === 'category' && data && (
            <div className="space-y-6">
              {[
                { title: 'By Category', data: data.byCategory },
                { title: 'By Product Type', data: data.byProductType },
                { title: 'By Grade / Level', data: data.byGrade },
              ].map(section => (
                <div key={section.title} className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{section.title}</h3>
                  <div className="space-y-2">
                    {(section.data || []).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <span className="flex-1 text-sm font-medium text-gray-900 capitalize">{item._id}</span>
                        <span className="text-xs text-gray-400">{item.totalSold} sold</span>
                        <span className="text-sm font-bold text-indigo-600 w-28 text-right">SAR {fmt(item.revenue)}</span>
                      </div>
                    ))}
                    {(section.data || []).length === 0 && <p className="text-gray-400 text-sm text-center py-6">No data for this period</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VAT REPORT */}
          {tab === 'vat' && data && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">VAT Summary</h3>
                    <p className="text-sm text-gray-400">{data.tenant?.nameEn} · VAT: {data.tenant?.vatNumber || '—'}</p>
                    <p className="text-xs text-gray-400">{fmtDate(data.period?.startDate)} — {fmtDate(data.period?.endDate)}</p>
                  </div>
                  <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100">
                    <Download className="w-4 h-4" /> Print
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase">Taxable Amount</p>
                    <p className="text-xl font-black text-gray-900">SAR {fmt(data.summary?.taxableAmount)}</p>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-rose-500 uppercase">VAT Collected</p>
                    <p className="text-xl font-black text-rose-600">SAR {fmt(data.summary?.totalTax)}</p>
                  </div>
                  <div className="bg-indigo-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-indigo-500 uppercase">Total (incl. VAT)</p>
                    <p className="text-xl font-black text-indigo-600">SAR {fmt(data.summary?.totalGrand)}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-4">
                    <p className="text-xs font-bold text-emerald-500 uppercase">Invoices</p>
                    <p className="text-xl font-black text-emerald-600">{data.summary?.invoiceCount || 0}</p>
                  </div>
                </div>
              </div>

              {data.byTaxRate && data.byTaxRate.length > 0 && (
                <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">By Tax Rate</h3>
                  <div className="space-y-2">
                    {data.byTaxRate.map((r, i) => (
                      <div key={i} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                        <span className="text-sm font-bold text-gray-900 w-20">{r._id}%</span>
                        <span className="text-sm text-gray-600 flex-1">Taxable: SAR {fmt(r.taxableAmount)}</span>
                        <span className="text-sm font-bold text-rose-600">VAT: SAR {fmt(r.taxAmount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white p-6 pb-4">Invoice List</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                        <th className="text-left py-3 px-6">Invoice #</th>
                        <th className="text-left py-3 px-4">Date</th>
                        <th className="text-right py-3 px-4">Subtotal</th>
                        <th className="text-right py-3 px-4">Discount</th>
                        <th className="text-right py-3 px-4">VAT</th>
                        <th className="text-right py-3 px-6">Total</th>
                        <th className="text-center py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.invoices || []).slice(0, 100).map(inv => (
                        <tr key={inv._id} className="border-b border-gray-50 last:border-0">
                          <td className="py-3 px-6 text-sm font-medium text-gray-900">{inv.invoiceNumber || '—'}</td>
                          <td className="py-3 px-4 text-xs text-gray-500">{fmtDate(inv.issueDate)}</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-600">{fmt(inv.subtotal)}</td>
                          <td className="py-3 px-4 text-right text-sm text-gray-600">{fmt(inv.totalDiscount)}</td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-rose-600">{fmt(inv.totalTax)}</td>
                          <td className="py-3 px-6 text-right text-sm font-bold text-gray-900">{fmt(inv.grandTotal)}</td>
                          <td className="py-3 px-4 text-center"><span className="text-xs text-gray-500">{inv.status}</span></td>
                        </tr>
                      ))}
                      {(data.invoices || []).length === 0 && <tr><td colSpan="7" className="text-center py-12 text-gray-400">No invoices in this period</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
