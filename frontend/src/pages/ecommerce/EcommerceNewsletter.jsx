import React, { useState, useEffect, useCallback } from 'react';
import { Mail, Loader2, Download, Trash2, Search } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ecommerce/settings');
      const ecommerce = res.data?.ecommerce || {};
      const subs = ecommerce.newsletterSubscribers || [];
      setSubscribers(subs);
    } catch (err) {
      console.error('Failed to load subscribers', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const filtered = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCsv = () => {
    const headers = ['Email', 'Subscribed At', 'Status', 'Unsubscribed At'];
    const rows = filtered.map(s => [
      s.email,
      s.subscribedAt ? new Date(s.subscribedAt).toISOString() : '',
      s.isActive ? 'active' : 'unsubscribed',
      s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : '',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeCount = subscribers.filter(s => s.isActive).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Mail className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Newsletter Subscribers</h1>
          <p className="text-sm text-gray-400">{subscribers.length} total · {activeCount} active</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email..."
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
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
          <Mail className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-500">No subscribers yet</p>
          <p className="text-sm text-gray-400 mt-1">Subscribers will appear here when customers sign up via the storefront</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700 text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold">Email</th>
                  <th className="px-4 py-3 font-bold">Subscribed</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => (
                  <tr key={i} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{sub.email}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${sub.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {sub.isActive ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
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
