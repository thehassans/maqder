import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Save, Loader2, Trash2, X, AlertCircle, CheckCircle, Search, TrendingUp } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceBundles() {
  const [data, setData] = useState({ bundles: [], total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', slug: '', items: [], bundlePrice: 0, compareAtPrice: 0,
    image: '', badgeText: '', isActive: true, startsAt: '', endsAt: '',
  });

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/ecommerce/bundles?page=1&limit=50');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load bundles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBundles(); }, [fetchBundles]);

  const searchProducts = async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/ecommerce/products?search=${encodeURIComponent(q)}&limit=10`);
      setSearchResults(res.data.products || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(t);
  }, [productSearch]);

  const addProductToBundle = (product) => {
    if (form.items.find(i => i.productId === product._id)) return;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: product._id, quantity: 1, title: product.title, price: product.basePrice, image: product.images?.[0]?.url || '' }],
    }));
    setProductSearch('');
    setSearchResults([]);
  };

  const removeItem = (idx) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const updateItemQty = (idx, qty) => {
    setForm(prev => ({ ...prev, items: prev.items.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, qty) } : it) }));
  };

  const resetForm = () => {
    setForm({ title: '', description: '', slug: '', items: [], bundlePrice: 0, compareAtPrice: 0, image: '', badgeText: '', isActive: true, startsAt: '', endsAt: '' });
    setEditing(null);
    setProductSearch('');
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || form.items.length < 2 || !form.bundlePrice) {
      setError('Title, at least 2 products, and bundle price are required');
      return;
    }
    setError('');
    try {
      const payload = {
        ...form,
        items: form.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        startsAt: form.startsAt || null,
        endsAt: form.endsAt || null,
      };
      if (editing) {
        await api.put(`/ecommerce/bundles/${editing}`, payload);
        setSuccess('Bundle updated');
      } else {
        await api.post('/ecommerce/bundles', payload);
        setSuccess('Bundle created');
      }
      setShowForm(false);
      resetForm();
      fetchBundles();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save bundle');
    }
  };

  const handleEdit = (bundle) => {
    setEditing(bundle._id);
    setForm({
      title: bundle.title || '',
      description: bundle.description || '',
      slug: bundle.slug || '',
      items: (bundle.items || []).map(i => ({ productId: i.productId, quantity: i.quantity, title: '', price: 0, image: '' })),
      bundlePrice: bundle.bundlePrice || 0,
      compareAtPrice: bundle.compareAtPrice || 0,
      image: bundle.image || '',
      badgeText: bundle.badgeText || '',
      isActive: bundle.isActive !== false,
      startsAt: bundle.startsAt ? new Date(bundle.startsAt).toISOString().slice(0, 10) : '',
      endsAt: bundle.endsAt ? new Date(bundle.endsAt).toISOString().slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this bundle?')) return;
    try {
      await api.delete(`/ecommerce/bundles/${id}`);
      fetchBundles();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all';
  const labelCls = 'block text-xs font-bold text-gray-500 mb-1';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-indigo-600" /> Product Bundles</h1>
          <p className="text-sm text-gray-500 mt-1">Create product bundles with discounted pricing</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> New Bundle
        </button>
      </div>

      {error && <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm font-medium"><AlertCircle className="w-4 h-4" /> {error}</div>}
      {success && <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-600 text-sm font-medium"><CheckCircle className="w-4 h-4" /> {success}</div>}

      {showForm && (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">{editing ? 'Edit Bundle' : 'Create Bundle'}</h2>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Title</label><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Summer Essentials Bundle" required /></div>
              <div><label className={labelCls}>Slug (optional)</label><input className={inputCls} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="summer-essentials" /></div>
            </div>
            <div><label className={labelCls}>Description</label><textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Bundle description" /></div>

            {/* Product search */}
            <div>
              <label className={labelCls}>Add Products</label>
              <div className="relative">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input className={`${inputCls} pl-10`} value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Search products to add..." />
                  </div>
                  {searching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map(p => (
                      <button key={p._id} type="button" onClick={() => addProductToBundle(p)} className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-dark-700 text-left transition-colors">
                        {p.images?.[0]?.url && <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{p.title}</p>
                          <p className="text-xs text-gray-500">{p.basePrice} SAR</p>
                        </div>
                        <Plus className="w-4 h-4 text-indigo-600" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Selected items */}
            {form.items.length > 0 && (
              <div className="space-y-2">
                <label className={labelCls}>Bundle Items ({form.items.length})</label>
                {form.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-dark-700/50 border border-gray-200 dark:border-dark-600">
                    {item.image && <img src={item.image} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                    <span className="flex-1 text-sm font-semibold truncate">{item.title || `Product ${item.productId}`}</span>
                    <input type="number" min="1" className="w-16 px-2 py-1 rounded-lg border border-gray-200 dark:border-dark-600 text-sm text-center" value={item.quantity} onChange={e => updateItemQty(idx, parseInt(e.target.value) || 1)} />
                    <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Bundle Price (SAR)</label><input type="number" step="0.01" className={inputCls} value={form.bundlePrice} onChange={e => setForm({ ...form, bundlePrice: parseFloat(e.target.value) || 0 })} required /></div>
              <div><label className={labelCls}>Compare-at Price (SAR)</label><input type="number" step="0.01" className={inputCls} value={form.compareAtPrice} onChange={e => setForm({ ...form, compareAtPrice: parseFloat(e.target.value) || 0 })} placeholder="Original total" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Badge Text (optional)</label><input className={inputCls} value={form.badgeText} onChange={e => setForm({ ...form, badgeText: e.target.value })} placeholder="Save 20%" /></div>
              <div><label className={labelCls}>Image URL (optional)</label><input className={inputCls} value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Start Date</label><input type="date" className={inputCls} value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} /></div>
              <div><label className={labelCls}>End Date</label><input type="date" className={inputCls} value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
            <div className="flex gap-3">
              <button type="submit" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors"><Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Bundle</button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 font-bold text-sm hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Bundles list */}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : data.bundles.length === 0 ? (
        <div className="text-center py-16"><Package className="w-12 h-12 text-gray-200 mx-auto mb-3" /><p className="text-sm text-gray-400">No bundles yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.bundles.map(bundle => (
            <div key={bundle._id} className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm">{bundle.title}</h3>
                  {bundle.badgeText && <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">{bundle.badgeText}</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${bundle.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{bundle.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              {bundle.image && <img src={bundle.image} alt="" className="w-full h-32 rounded-xl object-cover" />}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-bold text-indigo-600">{bundle.bundlePrice} SAR</span>
                {bundle.compareAtPrice > 0 && <span className="text-gray-400 line-through text-xs">{bundle.compareAtPrice} SAR</span>}
              </div>
              <div className="text-xs text-gray-500">{bundle.items?.length || 0} products · {bundle.salesCount || 0} sales · {bundle.viewsCount || 0} views</div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(bundle)} className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 text-xs font-bold hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">Edit</button>
                <button onClick={() => handleDelete(bundle._id)} className="px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
