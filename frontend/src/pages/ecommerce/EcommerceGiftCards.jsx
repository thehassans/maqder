import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Gift, Plus, Search, Trash2, Ban, CheckCircle, Loader2, Copy, X } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceGiftCards() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ amount: '', recipientName: '', recipientEmail: '', note: '', expiresAt: '' });
  const [copiedCode, setCopiedCode] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['gift-cards', page, search, statusFilter],
    queryFn: () => api.get('/ecommerce/gift-cards', { params: { page, limit: 25, search, status: statusFilter } }).then(res => res.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['gift-card-stats'],
    queryFn: () => api.get('/ecommerce/gift-cards/stats').then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/ecommerce/gift-cards', data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-stats'] });
      setShowCreate(false);
      setCreateForm({ amount: '', recipientName: '', recipientEmail: '', note: '', expiresAt: '' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/ecommerce/gift-cards/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-stats'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/ecommerce/gift-cards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-cards'] });
      queryClient.invalidateQueries({ queryKey: ['gift-card-stats'] });
    },
  });

  const giftCards = data?.giftCards || [];
  const totalPages = data?.totalPages || 1;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!createForm.amount || parseFloat(createForm.amount) < 1) return;
    createMutation.mutate({
      amount: parseFloat(createForm.amount),
      recipientName: createForm.recipientName,
      recipientEmail: createForm.recipientEmail,
      note: createForm.note,
      expiresAt: createForm.expiresAt || null,
    });
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const statusColors = {
    active: { bg: '#d1fae5', text: '#059669', label: 'Active' },
    redeemed: { bg: '#dbeafe', text: '#3b82f6', label: 'Redeemed' },
    expired: { bg: '#fee2e2', text: '#dc2626', label: 'Expired' },
    disabled: { bg: '#f3f4f6', text: '#6b7280', label: 'Disabled' },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gift className="w-7 h-7 text-indigo-600" /> Gift Cards
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage gift cards for your store</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold text-sm"
        >
          <Plus size={18} /> Create Gift Card
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active', value: stats?.active || 0, color: '#059669' },
          { label: 'Redeemed', value: stats?.redeemed || 0, color: '#3b82f6' },
          { label: 'Total Value', value: `${stats?.totalValue || 0} SAR`, color: '#4f46e5' },
          { label: 'Remaining Balance', value: `${stats?.totalBalance || 0} SAR`, color: '#f59e0b' },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs font-bold text-gray-400 uppercase">{stat.label}</p>
            <p className="text-xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by code..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="redeemed">Redeemed</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : giftCards.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <Gift className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-bold text-gray-400">No gift cards found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-left text-xs font-bold text-gray-400 uppercase">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {giftCards.map(card => {
                  const sc = statusColors[card.status] || statusColors.active;
                  return (
                    <tr key={card._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-600">{card.code}</span>
                          <button onClick={() => handleCopy(card.code)} className="text-gray-400 hover:text-indigo-600">
                            {copiedCode === card.code ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold">{card.amount} {card.currency}</td>
                      <td className="px-4 py-3">
                        <span className={card.balance > 0 ? 'text-green-600 font-bold' : 'text-gray-400'}>{card.balance} {card.currency}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                        {card.recipientName || '—'}
                        {card.recipientEmail && <div className="text-xs text-gray-400">{card.recipientEmail}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold" style={{ background: sc.bg, color: sc.text }}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {card.expiresAt ? new Date(card.expiresAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(card.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {card.status === 'active' && (
                            <button
                              onClick={() => updateMutation.mutate({ id: card._id, status: 'disabled' })}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="Disable"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                          {card.status === 'disabled' && (
                            <button
                              onClick={() => updateMutation.mutate({ id: card._id, status: 'active' })}
                              className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                              title="Enable"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => { if (confirm('Delete this gift card?')) deleteMutation.mutate(card._id); }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2"><Gift className="w-5 h-5 text-indigo-600" /> Create Gift Card</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Amount (SAR) *</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={createForm.amount}
                  onChange={e => setCreateForm({ ...createForm, amount: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  placeholder="100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Recipient Name</label>
                  <input
                    value={createForm.recipientName}
                    onChange={e => setCreateForm({ ...createForm, recipientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Recipient Email</label>
                  <input
                    type="email"
                    value={createForm.recipientEmail}
                    onChange={e => setCreateForm({ ...createForm, recipientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Note (optional)</label>
                <input
                  value={createForm.note}
                  onChange={e => setCreateForm({ ...createForm, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                  placeholder="Happy Birthday!"
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Expiry Date (optional)</label>
                <input
                  type="date"
                  value={createForm.expiresAt}
                  onChange={e => setCreateForm({ ...createForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              {createMutation.isError && (
                <p className="text-sm text-red-600">{createMutation.error?.response?.data?.error || 'Failed to create'}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg font-bold text-sm">Cancel</button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm disabled:opacity-50">
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
