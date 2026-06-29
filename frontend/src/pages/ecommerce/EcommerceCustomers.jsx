import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Loader2, Download, ChevronRight } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceCustomers() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ecommerce/orders', { params: { limit: 200 } });
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const customers = React.useMemo(() => {
    const map = {};
    orders.forEach(o => {
      const key = o.customer?.phone || o.customer?.email || o.customer?.name || 'unknown';
      if (!map[key]) {
        map[key] = {
          name: o.customer?.name || '—',
          email: o.customer?.email || '',
          phone: o.customer?.phone || '',
          city: o.customer?.city || '',
          orderCount: 0,
          totalSpent: 0,
          lastOrder: o.createdAt,
          orderIds: [],
        };
      }
      map[key].orderCount++;
      map[key].totalSpent += o.grandTotal || 0;
      map[key].orderIds.push(o._id);
      if (new Date(o.createdAt) > new Date(map[key].lastOrder)) {
        map[key].lastOrder = o.createdAt;
      }
    });
    return Object.values(map).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'City', 'Orders', 'Total Spent', 'Last Order'];
    const rows = filtered.map(c => [
      `"${c.name}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.city}"`,
      c.orderCount,
      c.totalSpent,
      c.lastOrder ? new Date(c.lastOrder).toLocaleDateString() : '',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Users className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-400">{customers.length} customers from {orders.length} orders</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button onClick={exportCsv} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-500">No customers found</p>
          <p className="text-sm text-gray-400 mt-1">Customers will appear here once orders are placed</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700 text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold">Name</th>
                  <th className="px-4 py-3 font-bold">Contact</th>
                  <th className="px-4 py-3 font-bold">City</th>
                  <th className="px-4 py-3 font-bold">Orders</th>
                  <th className="px-4 py-3 font-bold">Total Spent</th>
                  <th className="px-4 py-3 font-bold">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-4 py-3">
                      {c.phone && <p className="text-gray-600 dark:text-gray-300">{c.phone}</p>}
                      {c.email && <p className="text-gray-400 text-xs">{c.email}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.city || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">{c.orderCount}</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-600">{c.totalSpent} SAR</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(c.lastOrder)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
