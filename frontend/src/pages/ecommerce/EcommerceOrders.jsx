import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ListOrdered, Search, Loader2, Eye, Package, DollarSign, TrendingUp, ShoppingBag, X } from 'lucide-react';
import api from '../../lib/api';

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-violet-50 text-violet-700 border-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
  returned: 'bg-orange-50 text-orange-700 border-orange-200',
};

const PAYMENT_STYLES = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-red-50 text-red-600',
  refunded: 'bg-orange-50 text-orange-700',
  partially_refunded: 'bg-yellow-50 text-yellow-700',
};

const SHIP_STYLES = {
  unfulfilled: 'bg-gray-100 text-gray-500',
  fulfilled: 'bg-blue-50 text-blue-700',
  in_transit: 'bg-violet-50 text-violet-700',
  delivered: 'bg-emerald-50 text-emerald-700',
  returned: 'bg-orange-50 text-orange-700',
};

export default function EcommerceOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [shippingFilter, setShippingFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.paymentStatus = paymentFilter;
      if (shippingFilter) params.shippingStatus = shippingFilter;
      const res = await api.get('/ecommerce/orders', { params });
      setOrders(res.data.orders || []);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, paymentFilter, shippingFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/ecommerce/orders/meta/stats');
      setStats(res.data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const inputCls = "px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <ListOrdered className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-400">{total} order{total !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total Revenue', value: `${stats.totalRevenue?.toLocaleString() || 0} SAR`, icon: DollarSign, color: 'emerald' },
            { label: 'Total Orders', value: stats.totalOrders || 0, icon: ShoppingBag, color: 'indigo' },
            { label: 'Last 30 Days', value: stats.ordersLast30Days || 0, icon: TrendingUp, color: 'violet' },
            { label: 'Pending', value: stats.statusCounts?.pending || 0, icon: Package, color: 'amber' },
            { label: 'Completed', value: stats.statusCounts?.completed || 0, icon: Package, color: 'emerald' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-700">
                <div className={`w-8 h-8 rounded-lg bg-${s.color}-50 flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 text-${s.color}-600`} />
                </div>
                <p className="text-lg font-black text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, email, phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={inputCls}>
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
        <select value={paymentFilter} onChange={e => { setPaymentFilter(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">All Payments</option>
          <option value="pending">Payment Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select value={shippingFilter} onChange={e => { setShippingFilter(e.target.value); setPage(1); }} className={inputCls}>
          <option value="">All Shipping</option>
          <option value="unfulfilled">Unfulfilled</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="in_transit">In Transit</option>
          <option value="delivered">Delivered</option>
        </select>
        {(statusFilter || paymentFilter || shippingFilter || search) && (
          <button onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); setShippingFilter(''); setPage(1); }} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>

      {/* Orders table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
          <ListOrdered className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-500">No orders yet</p>
          <p className="text-sm text-gray-400 mt-1">Orders will appear here once customers start purchasing</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700 text-left text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-bold">Order</th>
                    <th className="px-4 py-3 font-bold">Customer</th>
                    <th className="px-4 py-3 font-bold">Date</th>
                    <th className="px-4 py-3 font-bold">Items</th>
                    <th className="px-4 py-3 font-bold">Total</th>
                    <th className="px-4 py-3 font-bold">Payment</th>
                    <th className="px-4 py-3 font-bold">Shipping</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/app/dashboard/ecommerce/orders/${order._id}`} className="font-bold text-indigo-600 hover:text-indigo-700">
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900 dark:text-white">{order.customer.name}</p>
                        {order.customer.phone && <p className="text-xs text-gray-400">{order.customer.phone}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{order.lineItems?.length || 0} item{(order.lineItems?.length || 0) !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{order.grandTotal?.toLocaleString()} {order.currency}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${PAYMENT_STYLES[order.payment?.status] || PAYMENT_STYLES.pending}`}>
                          {order.payment?.status || 'pending'}
                        </span>
                        <p className="text-xs text-gray-400 mt-0.5">{order.payment?.method?.toUpperCase()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${SHIP_STYLES[order.shipping?.status] || SHIP_STYLES.unfulfilled}`}>
                          {order.shipping?.status || 'unfulfilled'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${STATUS_STYLES[order.status] || STATUS_STYLES.pending}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/app/dashboard/ecommerce/orders/${order._id}`} className="inline-flex p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-600 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700">Previous</button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-600 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700">Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
