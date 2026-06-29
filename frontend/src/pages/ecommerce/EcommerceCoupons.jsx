import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Save, Loader2, Trash2, X, AlertCircle, CheckCircle, Copy, TrendingUp, DollarSign } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceCoupons() {
  const [data, setData] = useState({ coupons: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [analytics, setAnalytics] = useState({});
  const [form, setForm] = useState({
    code: '', description: '', type: 'percentage', value: 10, minSubtotal: 0, maxDiscount: 0,
    usageLimit: 0, perCustomerLimit: 0, startsAt: '', endsAt: '', isActive: true,
  });

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const [couponsRes, analyticsRes] = await Promise.all([
        api.get('/ecommerce/coupons?page=1&limit=50'),
        api.get('/ecommerce/coupons/analytics').catch(() => null),
      ]);
      setData(couponsRes.data);
      if (analyticsRes?.data?.analytics) {
        const map = {};
        analyticsRes.data.analytics.forEach(a => { map[a.code] = a; });
        setAnalytics(map);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const resetForm = () => {
    setForm({ code: '', description: '', type: 'percentage', value: 10, minSubtotal: 0, maxDiscount: 0, usageLimit: 0, perCustomerLimit: 0, startsAt: '', endsAt: '', isActive: true });
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (payload.startsAt) payload.startsAt = new Date(payload.startsAt).toISOString();
      if (payload.endsAt) payload.endsAt = new Date(payload.endsAt).toISOString();
      if (editing) {
        await api.put(`/ecommerce/coupons/${editing}`, payload);
        setSuccess('Coupon updated');
      } else {
        await api.post('/ecommerce/coupons', payload);
        setSuccess('Coupon created');
      }
      setTimeout(() => setSuccess(''), 3000);
      resetForm();
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    }
  };

  const handleEdit = (coupon) => {
    setEditing(coupon._id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minSubtotal: coupon.minSubtotal || 0,
      maxDiscount: coupon.maxDiscount || 0,
      usageLimit: coupon.usageLimit || 0,
      perCustomerLimit: coupon.perCustomerLimit || 0,
      startsAt: coupon.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : '',
      endsAt: coupon.endsAt ? new Date(coupon.endsAt).toISOString().slice(0, 16) : '',
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/ecommerce/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
  const labelCls = "block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Tag className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Discount Coupons</h1>
            <p className="text-sm text-gray-400">Create and manage coupon codes</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 text-sm">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700"><AlertCircle size={16} />{error}</div>}
      {success && <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle size={16} />{success}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 dark:text-white">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
            <button type="button" onClick={resetForm} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Code *</label>
              <input className={inputCls} value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" required disabled={!!editing} />
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>{form.type === 'percentage' ? 'Percentage' : 'Amount'}</label>
              <input type="number" step="0.01" className={inputCls} value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={labelCls}>Min Subtotal</label>
              <input type="number" step="0.01" className={inputCls} value={form.minSubtotal} onChange={e => setForm({ ...form, minSubtotal: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label className={labelCls}>Max Discount</label>
              <input type="number" step="0.01" className={inputCls} value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: parseFloat(e.target.value) || 0 })} placeholder="0 = no cap" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Usage Limit</label>
              <input type="number" className={inputCls} value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: parseInt(e.target.value) || 0 })} placeholder="0 = unlimited" />
            </div>
            <div>
              <label className={labelCls}>Start Date</label>
              <input type="datetime-local" className={inputCls} value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>End Date</label>
              <input type="datetime-local" className={inputCls} value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <input className={inputCls} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Summer sale 20% off" />
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded" />
              Active
            </label>
          </div>
          <button type="submit" className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 text-sm">
            <Save size={16} /> {editing ? 'Update' : 'Create'} Coupon
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="space-y-3">
          {data.coupons.map(coupon => (
            <div key={coupon._id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-gray-900 dark:text-white">{coupon.code}</p>
                    <button onClick={() => { navigator.clipboard.writeText(coupon.code); }} className="p-1 rounded text-gray-400 hover:text-gray-600"><Copy size={12} /></button>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${coupon.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {coupon.type === 'percentage' ? `${coupon.value}% off` : coupon.type === 'fixed' ? `${coupon.value} SAR off` : 'Free shipping'}
                    {coupon.minSubtotal > 0 && ` · min ${coupon.minSubtotal} SAR`}
                    {coupon.usageLimit > 0 && ` · ${coupon.usedCount}/${coupon.usageLimit} used`}
                  </p>
                  {coupon.description && <p className="text-xs text-gray-400 mt-0.5">{coupon.description}</p>}
                  {analytics[coupon.code] && analytics[coupon.code].orderCount > 0 && (
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600"><TrendingUp size={12} /> {analytics[coupon.code].orderCount} orders</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><DollarSign size={12} /> {analytics[coupon.code].totalRevenue.toLocaleString()} SAR revenue</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">−{analytics[coupon.code].totalDiscount.toLocaleString()} SAR discounted</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(coupon)} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">Edit</button>
                <button onClick={() => handleDelete(coupon._id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {data.coupons.length === 0 && (
            <div className="bg-white dark:bg-dark-800 rounded-2xl p-12 text-center">
              <Tag className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No coupons yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
