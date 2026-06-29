import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Store, Loader2, TrendingUp, TrendingDown, ShoppingBag, DollarSign, Package, ArrowUpRight, ArrowDownRight, CreditCard, Truck, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
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

export default function EcommerceDashboard() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await api.get(`/ecommerce/orders/meta/analytics?days=${days}`);
      setAnalytics(res.data);
    } catch {
      // ignore
    }
  }, [days]);

  useEffect(() => {
    api.get('/ecommerce/settings').then(res => setSettings(res.data?.ecommerce || {})).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([fetchAnalytics()]).finally(() => setLoading(false));
  }, [fetchAnalytics]);

  useEffect(() => {
    api.get('/ecommerce/products?limit=200').then(res => {
      const products = res.data.products || [];
      const lowStock = products.filter(p => p.trackInventory && p.stockQuantity <= (p.lowStockThreshold || 5));
      setLowStockProducts(lowStock);
    }).catch(() => {});
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const storeLive = settings.storeStatus === 'live';
  const a = analytics || {};

  // Simple SVG sparkline for revenue chart
  const maxRevenue = Math.max(...(a.revenueSeries || []).map(d => d.revenue), 1);
  const chartWidth = 600;
  const chartHeight = 120;
  const points = (a.revenueSeries || []).map((d, i) => {
    const x = (i / Math.max((a.revenueSeries || []).length - 1, 1)) * chartWidth;
    const y = chartHeight - (d.revenue / maxRevenue) * chartHeight;
    return `${x},${y}`;
  }).join(' ');
  const areaPoints = `0,${chartHeight} ${points} ${chartWidth},${chartHeight}`;

  const fmtCurrency = (v) => `${(v || 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} SAR`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short' }) : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Store className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              {settings.storeName || 'E-Commerce Dashboard'}
            </h1>
            <p className="text-sm text-gray-400">
              {storeLive ? 'Store is live' : settings.storeStatus === 'paused' ? 'Store is paused' : 'Store is in draft mode'}
            </p>
          </div>
        </div>
        {/* Period selector */}
        <div className="flex gap-1 bg-gray-100 dark:bg-dark-700 rounded-full p-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${days === d ? 'bg-indigo-600 text-white' : 'text-gray-500'}`}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Store status banner */}
      {!storeLive && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Your store is not live yet</p>
            <p className="text-xs text-amber-600">Add products, customize your theme, and publish your store to start selling.</p>
          </div>
        </div>
      )}

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-bold text-red-800">Low Stock Alert — {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} need attention</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockProducts.slice(0, 8).map(p => (
              <Link key={p._id} to={`/app/dashboard/ecommerce/products/${p._id}`} className="inline-flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">
                {p.title} — {p.stockQuantity} left
              </Link>
            ))}
            {lowStockProducts.length > 8 && (
              <span className="inline-flex items-center px-3 py-1.5 text-xs text-red-500">+{lowStockProducts.length - 8} more</span>
            )}
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={`Revenue (${days}d)`} value={fmtCurrency(a.currentRevenue)} change={a.revenueChange} icon={DollarSign} color="emerald" />
        <StatCard label={`Orders (${days}d)`} value={a.currentOrders || 0} change={a.ordersChange} icon={ShoppingBag} color="indigo" />
        <StatCard label="Avg Order Value" value={fmtCurrency(a.aov)} icon={TrendingUp} color="violet" />
        <StatCard label="Active Products" value={a.activeProducts || 0} icon={Package} color="amber" />
      </div>

      {/* Revenue chart + status distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Revenue Trend</h3>
          {(a.revenueSeries || []).length > 0 ? (
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 20}`} className="w-full" style={{ height: '140px' }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={areaPoints} fill="url(#revGrad)" />
              <polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-300 text-sm">No revenue data yet</div>
          )}
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{fmtDate(a.revenueSeries?.[0]?.date)}</span>
            <span>{fmtDate(a.revenueSeries?.[a.revenueSeries?.length - 1]?.date)}</span>
          </div>
        </div>

        {/* Status distribution */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Status</h3>
          <div className="space-y-2">
            {Object.entries(a.statusCounts || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{count}</span>
              </div>
            ))}
            {Object.keys(a.statusCounts || {}).length === 0 && (
              <p className="text-sm text-gray-300 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top products + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700">
            <h3 className="font-bold text-gray-900 dark:text-white">Top Products</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-dark-700/50">
            {(a.topProducts || []).map((p, idx) => (
              <div key={p._id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.title}</p>
                  <p className="text-xs text-gray-400">{p.qty} sold</p>
                </div>
                <p className="text-sm font-bold text-emerald-600">{fmtCurrency(p.revenue)}</p>
              </div>
            ))}
            {(a.topProducts || []).length === 0 && (
              <div className="px-5 py-12 text-center">
                <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No sales data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">Recent Orders</h3>
            <Link to="/app/dashboard/ecommerce/orders" className="text-xs text-indigo-600 font-bold hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-dark-700/50">
            {(a.recentOrders || []).map(order => (
              <Link key={order._id} to={`/app/dashboard/ecommerce/orders/${order._id}`} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{order.orderNumber}</p>
                  <p className="text-xs text-gray-400">{order.customer?.name} · {fmtDate(order.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{fmtCurrency(order.grandTotal)}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>{order.status}</span>
                </div>
              </Link>
            ))}
            {(a.recentOrders || []).length === 0 && (
              <div className="px-5 py-12 text-center">
                <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment breakdown + Quick links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment breakdown */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {Object.entries(a.paymentBreakdown || {}).map(([method, data]) => (
              <div key={method} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">{method}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{data.count} orders</p>
                  <p className="text-xs text-gray-400">{fmtCurrency(data.revenue)}</p>
                </div>
              </div>
            ))}
            {Object.keys(a.paymentBreakdown || {}).length === 0 && (
              <p className="text-sm text-gray-300 text-center py-4">No payment data</p>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/app/dashboard/ecommerce/products/new" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-dark-600 hover:border-indigo-200 transition-colors">
              <Package className="w-6 h-6 text-indigo-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Add Product</span>
            </Link>
            <Link to="/app/dashboard/ecommerce/theme" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-dark-600 hover:border-violet-200 transition-colors">
              <TrendingUp className="w-6 h-6 text-violet-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Edit Theme</span>
            </Link>
            <Link to="/app/dashboard/ecommerce/payments" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-dark-600 hover:border-emerald-200 transition-colors">
              <CreditCard className="w-6 h-6 text-emerald-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Payments</span>
            </Link>
            <Link to="/app/dashboard/ecommerce/couriers" className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 dark:border-dark-600 hover:border-blue-200 transition-colors">
              <Truck className="w-6 h-6 text-blue-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Couriers</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, change, icon: Icon, color }) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  return (
    <div className="bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-dark-700">
      <div className={`w-10 h-10 rounded-xl bg-${color}-50 flex items-center justify-center mb-3`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {change !== undefined && change !== 0 && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive ? 'text-emerald-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : isNegative ? <ArrowDownRight size={12} /> : null}
            {Math.abs(change)}%
          </span>
        )}
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  );
}
