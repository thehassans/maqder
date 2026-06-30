import React, { useState, useEffect, useCallback } from 'react';
import { Package, Search, Loader2, Save, AlertTriangle, CheckCircle, XCircle, Download, Layers } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [saving, setSaving] = useState(null);
  const [edits, setEdits] = useState({});

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (search) params.search = search;
      const res = await api.get('/ecommerce/products', { params });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const getStock = (p) => {
    if (p.hasVariants && p.variants?.length) {
      return p.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }
    return p.stockQuantity || 0;
  };

  const getThreshold = (p) => p.lowStockThreshold || 5;

  const isLowStock = (p) => p.trackInventory && getStock(p) <= getThreshold(p) && getStock(p) > 0;
  const isOutOfStock = (p) => p.trackInventory && getStock(p) <= 0;
  const isTracked = (p) => p.trackInventory !== false;

  const filtered = products.filter(p => {
    if (filter === 'low' && !isLowStock(p)) return false;
    if (filter === 'out' && !isOutOfStock(p)) return false;
    if (filter === 'tracked' && !isTracked(p)) return false;
    return true;
  });

  const handleStockChange = (productId, value) => {
    setEdits(prev => ({ ...prev, [productId]: value }));
  };

  const handleSave = async (productId) => {
    const newStock = parseInt(edits[productId]);
    if (isNaN(newStock)) return;
    setSaving(productId);
    try {
      await api.patch(`/ecommerce/products/${productId}`, { stockQuantity: newStock });
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, stockQuantity: newStock } : p));
      setEdits(prev => { const next = { ...prev }; delete next[productId]; return next; });
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update stock');
    } finally {
      setSaving(null);
    }
  };

  const handleThresholdSave = async (productId, threshold) => {
    setSaving(`threshold-${productId}`);
    try {
      await api.patch(`/ecommerce/products/${productId}`, { lowStockThreshold: threshold });
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, lowStockThreshold: threshold } : p));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update threshold');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveAll = async () => {
    const entries = Object.entries(edits).filter(([, v]) => v !== undefined && v !== '');
    if (entries.length === 0) return;
    setSaving('bulk');
    try {
      await Promise.all(entries.map(([pid, val]) =>
        api.patch(`/ecommerce/products/${pid}`, { stockQuantity: parseInt(val) })
      ));
      const updates = Object.fromEntries(entries);
      setProducts(prev => prev.map(p => updates[p._id] !== undefined ? { ...p, stockQuantity: parseInt(updates[p._id]) } : p));
      setEdits({});
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk save failed');
    } finally {
      setSaving(null);
    }
  };

  const exportCsv = () => {
    const headers = ['Title', 'SKU', 'Current Stock', 'Low Stock Threshold', 'Tracked', 'Status'];
    const rows = filtered.map(p => {
      const stock = getStock(p);
      const tracked = isTracked(p);
      const status = !tracked ? 'Untracked' : isOutOfStock(p) ? 'Out of Stock' : isLowStock(p) ? 'Low Stock' : 'In Stock';
      return [`"${(p.title || '').replace(/"/g, '""')}"`, p.sku || '', stock, getThreshold(p), tracked ? 'Yes' : 'No', status].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summary = {
    total: products.length,
    tracked: products.filter(isTracked).length,
    low: products.filter(isLowStock).length,
    out: products.filter(isOutOfStock).length,
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <Package className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Inventory Management</h1>
          <p className="text-sm text-gray-400">{summary.total} products · {summary.tracked} tracked · {summary.low} low stock · {summary.out} out of stock</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-400 font-bold uppercase">Total Products</p>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{summary.total}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-400 font-bold uppercase">Tracked</p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{summary.tracked}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-400 font-bold uppercase">Low Stock</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{summary.low}</p>
        </div>
        <div className="bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 p-4">
          <p className="text-xs text-gray-400 font-bold uppercase">Out of Stock</p>
          <p className="text-2xl font-black text-red-600 mt-1">{summary.out}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm font-bold">
          <option value="all">All Products</option>
          <option value="tracked">Tracked Only</option>
          <option value="low">Low Stock</option>
          <option value="out">Out of Stock</option>
        </select>
        <button onClick={exportCsv} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
          <Download className="w-4 h-4" /> Export
        </button>
        {Object.keys(edits).length > 0 && (
          <button onClick={handleSaveAll} disabled={saving === 'bulk'} className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
            {saving === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Save All ({Object.keys(edits).length})
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-500">No products found</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700 text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-4 py-3 font-bold">Product</th>
                  <th className="px-4 py-3 font-bold">SKU</th>
                  <th className="px-4 py-3 font-bold">Current Stock</th>
                  <th className="px-4 py-3 font-bold">Adjust</th>
                  <th className="px-4 py-3 font-bold">Low Stock Threshold</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const stock = getStock(p);
                  const threshold = getThreshold(p);
                  const tracked = isTracked(p);
                  const hasEdit = edits[p._id] !== undefined;
                  return (
                    <tr key={p._id} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900 dark:text-white">{p.title}</p>
                        {p.hasVariants && <p className="text-xs text-gray-400">{p.variants?.length} variants</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.sku || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${isOutOfStock(p) ? 'text-red-600' : isLowStock(p) ? 'text-amber-600' : 'text-gray-900 dark:text-white'}`}>{stock}</span>
                      </td>
                      <td className="px-4 py-3">
                        {tracked ? (
                          <input
                            type="number"
                            value={hasEdit ? edits[p._id] : stock}
                            onChange={e => handleStockChange(p._id, e.target.value)}
                            className="w-20 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">Not tracked</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {tracked ? (
                          <input
                            type="number"
                            defaultValue={threshold}
                            onBlur={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v !== threshold) handleThresholdSave(p._id, v); }}
                            className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {!tracked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Untracked</span>
                        ) : isOutOfStock(p) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600"><XCircle className="w-3 h-3" /> Out of Stock</span>
                        ) : isLowStock(p) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700"><AlertTriangle className="w-3 h-3" /> Low Stock</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700"><CheckCircle className="w-3 h-3" /> In Stock</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasEdit && (
                          <button
                            onClick={() => handleSave(p._id)}
                            disabled={saving === p._id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {saving === p._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            Save
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
