import React, { useState, useEffect, useCallback } from 'react';
import { Star, Check, X, Trash2, Loader2, MessageSquare } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceReviews() {
  const [data, setData] = useState({ reviews: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filter) params.set('status', filter);
      const res = await api.get(`/ecommerce/reviews?${params}`);
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleAction = async (id, action) => {
    try {
      if (action === 'delete') {
        await api.delete(`/ecommerce/reviews/${id}`);
      } else {
        await api.put(`/ecommerce/reviews/${id}/${action}`);
      }
      fetchReviews();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const statusColors = { pending: 'bg-amber-50 text-amber-700', approved: 'bg-emerald-50 text-emerald-700', rejected: 'bg-red-50 text-red-600' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Product Reviews</h1>
          <p className="text-sm text-gray-400">Moderate customer reviews</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }} className={`px-4 py-2 rounded-full text-sm font-bold ${filter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {s || 'All'} {s === 'pending' && data.total > 0 && filter === 'pending' ? `(${data.total})` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : data.reviews.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-2xl p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.reviews.map(review => (
            <div key={review._id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white">{review.customerName}</span>
                    {review.verifiedPurchase && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Verified</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${statusColors[review.status]}`}>{review.status}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} size={14} className={n <= review.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  {review.title && <p className="font-bold text-sm text-gray-900 dark:text-white mb-1">{review.title}</p>}
                  {review.body && <p className="text-sm text-gray-600 dark:text-gray-400">{review.body}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {review.productId?.title || 'Product'} · {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {review.status !== 'approved' && (
                    <button onClick={() => handleAction(review._id, 'approve')} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Approve">
                      <Check size={16} />
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button onClick={() => handleAction(review._id, 'reject')} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100" title="Reject">
                      <X size={16} />
                    </button>
                  )}
                  <button onClick={() => handleAction(review._id, 'delete')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
