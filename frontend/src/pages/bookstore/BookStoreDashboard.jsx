import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShoppingCart, Wallet, BookOpen, AlertTriangle, ArrowRight, Loader2, PackageX, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../lib/api';

export default function BookStoreDashboard() {
  const { tenant } = useSelector(state => state.auth);
  const [invoices, setInvoices] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invoicesRes, invAlertsRes] = await Promise.all([
          api.get('/invoices', { params: { businessContext: 'bookstore', limit: 200 } }).catch(() => ({ data: { invoices: [] } })),
          api.get('/bookstore/products/inventory-alerts').catch(() => ({ data: null })),
        ]);
        setInvoices(invoicesRes.data?.invoices || []);
        setInventoryAlerts(invAlertsRes.data || null);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const { todayRevenue, todayCount, avgOrder, chartData, topProducts } = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let todayRev = 0;
    let todayCnt = 0;
    const dailyTotals = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyTotals[d.toISOString().split('T')[0]] = 0;
    }
    const productCounts = {};

    invoices.forEach(inv => {
      const dateStr = new Date(inv.issueDate || inv.createdAt).toISOString().split('T')[0];
      const total = inv.grandTotal || 0;
      if (dateStr === todayStr) {
        todayRev += total;
        todayCnt++;
      }
      if (dailyTotals[dateStr] !== undefined) dailyTotals[dateStr] += total;
      if (inv.lineItems && Array.isArray(inv.lineItems)) {
        inv.lineItems.forEach(item => {
          if (item.productName) {
            if (!productCounts[item.productName]) productCounts[item.productName] = { qty: 0, revenue: 0 };
            productCounts[item.productName].qty += item.quantity || 1;
            productCounts[item.productName].revenue += item.lineTotalWithTax || item.lineTotal || 0;
          }
        });
      }
    });

    const cData = Object.keys(dailyTotals).map(date => ({
      date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
      revenue: dailyTotals[date],
    }));

    const tProducts = Object.keys(productCounts)
      .map(name => ({ name, ...productCounts[name] }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      todayRevenue: todayRev,
      todayCount: todayCnt,
      avgOrder: todayCnt > 0 ? todayRev / todayCnt : 0,
      chartData: cData,
      topProducts: tProducts,
    };
  }, [invoices]);

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-10 h-10 animate-spin text-gray-300" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Bookstore Administration</h1>
          <p className="text-sm font-medium text-gray-400 mt-1 uppercase tracking-widest">Store Overview & Intelligence</p>
        </div>
        <Link
          to="/app/dashboard/bookstore/pos"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:shadow-xl hover:shadow-indigo-600/20 transition-all hover:-translate-y-0.5"
        >
          <BookOpen className="w-4 h-4" />
          Go to POS
          <ArrowRight className="w-4 h-4 ml-1 opacity-50" />
        </Link>
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Today's Revenue</p>
            <h3 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">SAR {todayRevenue.toFixed(2)}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Transactions Today</p>
            <h3 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">{todayCount} <span className="text-xl text-gray-300 font-medium">sales</span></h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Average Order Value</p>
            <h3 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white">SAR {avgOrder.toFixed(2)}</h3>
          </div>
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* INVENTORY ALERTS */}
      {inventoryAlerts?.summary && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gray-900 text-white flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Inventory Alerts</h2>
                <p className="text-xs font-medium text-gray-400">
                  {inventoryAlerts.summary.lowStock + inventoryAlerts.summary.outOfStock === 0
                    ? 'All stock levels healthy'
                    : `${inventoryAlerts.summary.lowStock + inventoryAlerts.summary.outOfStock} items need attention`}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-dark-700">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-500">
                <PackageX className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">{inventoryAlerts.summary.outOfStock || 0}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Out of Stock</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-dark-700">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">{inventoryAlerts.summary.lowStock || 0}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Low Stock</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-dark-700">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-500">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">{inventoryAlerts.summary.totalProducts || 0}</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Titles</p>
              </div>
            </div>
            <Link to="/app/dashboard/bookstore/products" className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-dark-700 hover:bg-gray-50 transition-colors">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gray-50 text-gray-500">
                <ArrowRight className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Manage</p>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Products</p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* CHARTS & TOP PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-dark-700">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-6">7-Day Revenue Trend</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} labelStyle={{ fontWeight: 'bold', color: '#111827' }} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorBookRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-dark-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-dark-700">
          <h2 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white mb-6">Top Selling Books</h2>
          <div className="space-y-5">
            {topProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-10">No sales data yet</div>
            ) : topProducts.map((p, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-400">
                    #{idx + 1}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">{p.name}</p>
                    <p className="text-xs font-medium text-gray-400">{p.qty} copies sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-500 text-sm">SAR {p.revenue.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
