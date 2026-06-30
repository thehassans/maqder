import React, { useState, useEffect } from 'react';
import { ShoppingCart, Mail, CheckCircle, Clock, TrendingUp, Loader2, Send, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceAbandonedCarts() {
  const [stats, setStats] = useState(null);
  const [carts, setCarts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/ecommerce/abandoned-carts/stats'),
      api.get(`/ecommerce/abandoned-carts?${statusFilter ? `status=${statusFilter}&` : ''}page=${page}&limit=20`),
    ]).then(([statsRes, cartsRes]) => {
      setStats(statsRes.data);
      setCarts(cartsRes.data.carts);
      setTotal(cartsRes.data.total);
      setTotalPages(cartsRes.data.totalPages);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter, page]);

  const handleSendRecovery = async (cartId) => {
    setSending(cartId);
    try {
      await api.post(`/ecommerce/abandoned-carts/${cartId}/send-recovery`);
      setCarts(prev => prev.map(c => c._id === cartId ? { ...c, recoveryEmailSent: true } : c));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send recovery email');
    } finally {
      setSending(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const fmtPrice = (n) => `${Number(n || 0).toFixed(2)} SAR`;
  const fmtDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Abandoned Cart Recovery</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-500">Abandoned</span>
          </div>
          <p className="text-2xl font-bold">{stats?.abandoned || 0}</p>
          <p className="text-sm text-gray-400 mt-1">{fmtPrice(stats?.lostRevenue)} at risk</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">Emails Sent</span>
          </div>
          <p className="text-2xl font-bold">{stats?.emailed || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Recovered</span>
          </div>
          <p className="text-2xl font-bold">{stats?.recovered || 0}</p>
          <p className="text-sm text-gray-400 mt-1">{fmtPrice(stats?.recoveredRevenue)} recovered</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-violet-500" />
            <span className="text-sm text-gray-500">Recovery Rate</span>
          </div>
          <p className="text-2xl font-bold">
            {stats && stats.emailed > 0 ? Math.round((stats.recovered / stats.emailed) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['', 'abandoned', 'recovered'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              statusFilter === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Carts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Items</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Total</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Email Sent</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Updated</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {carts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  No abandoned carts found
                </td>
              </tr>
            ) : carts.map(cart => (
              <React.Fragment key={cart._id}>
                <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpanded(expanded === cart._id ? null : cart._id)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {expanded === cart._id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      <div>
                        <p className="font-medium text-gray-900">{cart.customerEmail || cart.customerPhone || 'Unknown'}</p>
                        <p className="text-xs text-gray-400">{cart.customerPhone || ''}</p>
                      </div>
                    </div>
                  </td>
                <td className="px-4 py-3">
                  <p className="text-gray-700">{cart.items.length} item(s)</p>
                  <p className="text-xs text-gray-400 truncate max-w-xs">
                    {cart.items.map(i => `${i.title} x${i.quantity}`).join(', ')}
                  </p>
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtPrice(cart.cartTotal)}</td>
                <td className="px-4 py-3 text-center">
                  {cart.recoveryEmailSent ? (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600"><Mail className="w-3 h-3" /> Sent</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    cart.status === 'recovered' ? 'bg-green-100 text-green-700' :
                    cart.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {cart.status === 'recovered' && <CheckCircle className="w-3 h-3" />}
                    {cart.status === 'abandoned' && <Clock className="w-3 h-3" />}
                    {cart.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(cart.updatedAt)}</td>
                <td className="px-4 py-3 text-center">
                  {cart.status === 'abandoned' && cart.customerEmail && !cart.recoveryEmailSent && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSendRecovery(cart._id); }}
                      disabled={sending === cart._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50"
                    >
                      {sending === cart._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Send
                    </button>
                  )}
                  {cart.recoveryEmailSent && (
                    <span className="text-xs text-blue-600 font-bold">Sent</span>
                  )}
                </td>
              </tr>
              {expanded === cart._id && (
                <tr className="bg-gray-50">
                  <td colSpan={7} className="px-4 py-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cart Items</p>
                      {cart.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">{item.title} × {item.quantity}</span>
                          <span className="text-gray-500 font-medium">{fmtPrice((item.price || 0) * (item.quantity || 1))}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-900">Cart Total</span>
                        <span className="font-bold text-gray-900">{fmtPrice(cart.cartTotal)}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
