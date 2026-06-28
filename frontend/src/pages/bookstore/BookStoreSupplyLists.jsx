import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, GraduationCap, BookOpen, ShoppingCart, X, Loader2, Save, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BookStoreSupplyLists() {
  const [lists, setLists] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    schoolName: '',
    schoolNameAr: '',
    grade: '',
    gradeAr: '',
    academicYear: '2025-2026',
    items: [],
  });

  useEffect(() => {
    fetchLists();
    fetchProducts();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await api.get('/bookstore/supply-lists');
      setLists(res.data || []);
    } catch (err) {
      toast.error('Failed to load supply lists');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await api.get('/bookstore/products');
      if (res.data.success) setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const handleAddItem = (product) => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: product._id,
        name: product.name,
        quantity: 1,
        estimatedPrice: product.discountPrice > 0 ? product.discountPrice : product.retailPrice,
      }],
    }));
    setSearch('');
  };

  const handleRemoveItem = (idx) => {
    setForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));
  };

  const handleItemChange = (idx, field, value) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, [field]: Number(value) } : item),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.schoolName || !form.grade || form.items.length === 0) {
      toast.error('School name, grade, and at least one item are required');
      return;
    }
    try {
      await api.post('/bookstore/supply-lists', form);
      toast.success('Supply list created');
      setShowForm(false);
      setForm({ schoolName: '', schoolNameAr: '', grade: '', gradeAr: '', academicYear: '2025-2026', items: [] });
      fetchLists();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create supply list');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this supply list?')) return;
    try {
      await api.delete(`/bookstore/supply-lists/${id}`);
      setLists(prev => prev.filter(l => l._id !== id));
      toast.success('Supply list deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filteredProducts = search
    ? products.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.isbn?.includes(search))
    : products.slice(0, 6);

  const formTotal = form.items.reduce((sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 1), 0);

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-10 h-10 animate-spin text-gray-300" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard/bookstore/dashboard" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">School Supply Lists</h1>
            <p className="text-sm text-gray-400">Pre-built stationery bundles per school and grade</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Existing lists */}
      {lists.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-dark-700 text-center">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="font-bold text-gray-400">No supply lists yet</p>
          <p className="text-sm text-gray-400 mt-1">Create pre-built bundles for schools and grades</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map(list => (
            <div key={list._id} className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{list.schoolName}</h3>
                    <p className="text-xs text-gray-400">{list.grade} • {list.academicYear}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(list._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1.5 mb-4">
                {list.items.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.name}</span>
                    <span className="text-gray-400 font-medium">x{item.quantity}</span>
                  </div>
                ))}
                {list.items.length > 5 && <p className="text-xs text-gray-400">+{list.items.length - 5} more items</p>}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-dark-700">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{list.items.length} items</span>
                <span className="font-bold text-indigo-600">SAR {Number(list.totalEstimatedPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">New Supply List</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">School Name *</label>
                  <input value={form.schoolName} onChange={(e) => setForm(prev => ({ ...prev, schoolName: e.target.value }))} required className="input" placeholder="Al-Noor International School" />
                </div>
                <div>
                  <label className="label">School Name (Arabic)</label>
                  <input value={form.schoolNameAr} onChange={(e) => setForm(prev => ({ ...prev, schoolNameAr: e.target.value }))} className="input" dir="rtl" />
                </div>
                <div>
                  <label className="label">Grade *</label>
                  <input value={form.grade} onChange={(e) => setForm(prev => ({ ...prev, grade: e.target.value }))} required className="input" placeholder="Grade 5, Year 3..." />
                </div>
                <div>
                  <label className="label">Grade (Arabic)</label>
                  <input value={form.gradeAr} onChange={(e) => setForm(prev => ({ ...prev, gradeAr: e.target.value }))} className="input" dir="rtl" />
                </div>
                <div className="col-span-2">
                  <label className="label">Academic Year</label>
                  <input value={form.academicYear} onChange={(e) => setForm(prev => ({ ...prev, academicYear: e.target.value }))} className="input" placeholder="2025-2026" />
                </div>
              </div>

              {/* Product search */}
              <div>
                <label className="label">Add Items</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search products to add..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none"
                  />
                </div>
                {filteredProducts.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-lg">
                    {filteredProducts.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => handleAddItem(p)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        <div>
                          <p className="font-bold text-sm text-gray-900">{p.name}</p>
                          {p.author && <p className="text-xs text-gray-400">{p.author}</p>}
                        </div>
                        <span className="font-bold text-sm text-indigo-600">SAR {Number(p.discountPrice > 0 ? p.discountPrice : p.retailPrice).toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items list */}
              {form.items.length > 0 && (
                <div className="space-y-2">
                  <label className="label">Items ({form.items.length})</label>
                  {form.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-bold text-sm text-gray-900">{item.name}</p>
                      </div>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                        className="w-16 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center font-bold text-sm"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.estimatedPrice}
                        onChange={(e) => handleItemChange(idx, 'estimatedPrice', e.target.value)}
                        className="w-24 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center font-bold text-sm"
                      />
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-sm font-bold text-gray-500">Total Estimated:</span>
                    <span className="text-lg font-black text-indigo-600">SAR {formTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-600 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <Save className="w-5 h-5" />
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
