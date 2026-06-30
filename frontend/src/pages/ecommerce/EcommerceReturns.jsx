import React, { useState, useEffect } from 'react';
import { RotateCcw, Loader2, CheckCircle, XCircle, Clock, Package, DollarSign, ChevronRight, X } from 'lucide-react';
import api from '../../lib/api';

const STATUS_CONFIG = {
  requested: { label: 'Requested', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  received: { label: 'Received', color: 'bg-violet-100 text-violet-700', icon: Package },
  refunded: { label: 'Refunded', color: 'bg-cyan-100 text-cyan-700', icon: DollarSign },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
};

const REASON_LABELS = {
  damaged: 'Damaged',
  wrong_item: 'Wrong Item',
  not_as_described: 'Not As Described',
  changed_mind: 'Changed Mind',
  quality_issue: 'Quality Issue',
  other: 'Other',
};

const NEXT_ACTIONS = {
  requested: [{ action: 'approved', label: 'Approve', color: 'bg-blue-600 hover:bg-blue-700' }, { action: 'rejected', label: 'Reject', color: 'bg-red-500 hover:bg-red-600' }],
  approved: [{ action: 'received', label: 'Mark Received', color: 'bg-violet-600 hover:bg-violet-700' }, { action: 'rejected', label: 'Reject', color: 'bg-red-500 hover:bg-red-600' }],
  received: [{ action: 'refunded', label: 'Mark Refunded', color: 'bg-cyan-600 hover:bg-cyan-700' }],
  refunded: [{ action: 'completed', label: 'Complete', color: 'bg-emerald-600 hover:bg-emerald-700' }],
};

export default function EcommerceReturns() {
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/ecommerce/returns/stats/summary'),
      api.get(`/ecommerce/returns?${statusFilter ? `status=${statusFilter}&` : ''}page=${page}&limit=20`),
    ]).then(([statsRes, listRes]) => {
      setStats(statsRes.data);
      setReturns(listRes.data.returns);
      setTotal(listRes.data.total);
      setTotalPages(listRes.data.totalPages);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [statusFilter, page]);

  const handleAction = async (returnId, action) => {
    setUpdating(true);
    try {
      const payload = { status: action };
      if (adminNotes) payload.adminNotes = adminNotes;
      await api.patch(`/ecommerce/returns/${returnId}`, payload);
      // Refresh
      const [statsRes, listRes] = await Promise.all([
        api.get('/ecommerce/returns/stats/summary'),
        api.get(`/ecommerce/returns?${statusFilter ? `status=${statusFilter}&` : ''}page=${page}&limit=20`),
      ]);
      setStats(statsRes.data);
      setReturns(listRes.data.returns);
      setTotal(listRes.data.total);
      setSelectedReturn(null);
      setAdminNotes('');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update return');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const fmtPrice = (n) => `${Number(n || 0).toFixed(2)} SAR`;
  const fmtDate = (d) => new Date(d).toLocaleString();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Returns & Refunds</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            const count = stats[key] || 0;
            return (
              <div key={key} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
                <div className={`w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center mx-auto mb-1`}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-lg font-bold">{count}</p>
                <p className="text-xs text-gray-500">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {stats && stats.totalRefunded > 0 && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-3 mb-6 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-cyan-600" />
          <span className="text-sm font-medium text-cyan-800">Total Refunded: {fmtPrice(stats.totalRefunded)}</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {['', 'requested', 'approved', 'received', 'refunded', 'completed', 'rejected'].map(s => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${
              statusFilter === s ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-gray-700 border-gray-200 hover:border-violet-300'
            }`}
          >
            {s === '' ? 'All' : STATUS_CONFIG[s]?.label || s}
          </button>
        ))}
      </div>

      {/* Returns table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Return #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Order #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Reason</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Refund</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <RotateCcw className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No return requests found
                </td>
              </tr>
            ) : returns.map(ret => {
              const cfg = STATUS_CONFIG[ret.status] || STATUS_CONFIG.requested;
              const Icon = cfg.icon;
              return (
                <tr key={ret._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedReturn(ret); setAdminNotes(ret.adminNotes || ''); }}>
                  <td className="px-4 py-3 font-medium text-gray-900">{ret.returnNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{ret.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{ret.customerName || '—'}</p>
                    <p className="text-xs text-gray-400">{ret.customerEmail || ret.customerPhone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{REASON_LABELS[ret.reason] || ret.reason}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtPrice(ret.refundAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(ret.createdAt)}</td>
                  <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-gray-300" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1} className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-lg border border-gray-200 bg-white disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Detail modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedReturn(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold">{selectedReturn.returnNumber}</h2>
                <p className="text-sm text-gray-400">Order: {selectedReturn.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedReturn(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Customer info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Customer</p>
                  <p className="font-medium">{selectedReturn.customerName || '—'}</p>
                  <p className="text-sm text-gray-500">{selectedReturn.customerEmail || ''}</p>
                  <p className="text-sm text-gray-500">{selectedReturn.customerPhone || ''}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Reason</p>
                  <p className="font-medium">{REASON_LABELS[selectedReturn.reason] || selectedReturn.reason}</p>
                  {selectedReturn.reasonDetails && <p className="text-sm text-gray-500 mt-1">{selectedReturn.reasonDetails}</p>}
                </div>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Items Being Returned</p>
                <div className="space-y-2">
                  {selectedReturn.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{item.productTitle}</p>
                        {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                        {item.returnReason && <p className="text-xs text-gray-500 mt-1">Reason: {item.returnReason}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{fmtPrice(item.price)}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refund info */}
              <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg border border-violet-100">
                <span className="text-sm font-medium text-violet-800">Refund Amount</span>
                <span className="text-lg font-bold text-violet-900">{fmtPrice(selectedReturn.refundAmount)}</span>
              </div>

              {/* Images */}
              {selectedReturn.images?.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Attached Images</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedReturn.images.map((img, i) => (
                      <img key={i} src={img} alt={`Return ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}

              {/* Admin notes */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Add internal notes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-violet-400"
                />
              </div>

              {/* Action buttons */}
              {NEXT_ACTIONS[selectedReturn.status] && (
                <div className="flex gap-2 pt-2">
                  {NEXT_ACTIONS[selectedReturn.status].map(btn => (
                    <button
                      key={btn.action}
                      onClick={() => handleAction(selectedReturn._id, btn.action)}
                      disabled={updating}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white ${btn.color} disabled:opacity-50`}
                    >
                      {updating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : btn.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Status timeline */}
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">Timeline</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <p>Requested: {fmtDate(selectedReturn.requestedAt)}</p>
                  {selectedReturn.reviewedAt && <p>Reviewed: {fmtDate(selectedReturn.reviewedAt)}</p>}
                  {selectedReturn.receivedAt && <p>Received: {fmtDate(selectedReturn.receivedAt)}</p>}
                  {selectedReturn.refundedAt && <p>Refunded: {fmtDate(selectedReturn.refundedAt)}</p>}
                  {selectedReturn.completedAt && <p>Completed: {fmtDate(selectedReturn.completedAt)}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
