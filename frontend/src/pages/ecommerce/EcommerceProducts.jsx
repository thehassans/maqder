import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, Loader2, Trash2, Eye, Archive, CheckCircle, AlertCircle, Tag, Download, Upload } from 'lucide-react';
import api from '../../lib/api';

export default function EcommerceProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteId, setDeleteId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/ecommerce/products', { params });
      setProducts(res.data.products || []);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get('/ecommerce/products/meta/categories');
      setCategories(res.data || []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'archived' : 'active';
    setActionLoading(true);
    try {
      await api.patch(`/ecommerce/products/${id}/status`, { status: newStatus });
      setProducts(prev => prev.map(p => p._id === id ? { ...p, status: newStatus } : p));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await api.delete(`/ecommerce/products/${deleteId}`);
      setProducts(prev => prev.filter(p => p._id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete product');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      draft: 'bg-amber-50 text-amber-700 border-amber-200',
      archived: 'bg-gray-100 text-gray-500 border-gray-200',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.draft}`}>
        {status === 'active' && <CheckCircle className="w-3 h-3" />}
        {status === 'draft' && <AlertCircle className="w-3 h-3" />}
        {status === 'archived' && <Archive className="w-3 h-3" />}
        {status}
      </span>
    );
  };

  const getDisplayPrice = (product) => {
    if (product.hasVariants && product.variants?.length) {
      const prices = product.variants.map(v => v.price).filter(p => p > 0);
      if (prices.length === 0) return '—';
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return min === max ? `${min} SAR` : `${min} – ${max} SAR`;
    }
    return `${product.basePrice || 0} SAR`;
  };

  const getStock = (product) => {
    if (product.hasVariants && product.variants?.length) {
      return product.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
    }
    return product.stockQuantity || 0;
  };

  const exportCsv = () => {
    const headers = ['Title', 'Category', 'Base Price', 'Compare At Price', 'Status', 'Track Inventory', 'Stock Quantity', 'Low Stock Threshold', 'Has Variants', 'SKU', 'Short Description', 'Slug'];
    const rows = products.map(p => [
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${p.category || ''}"`,
      p.basePrice || 0,
      p.compareAtPrice || '',
      p.status || 'draft',
      p.trackInventory ? 'yes' : 'no',
      p.stockQuantity || 0,
      p.lowStockThreshold || 5,
      p.hasVariants ? 'yes' : 'no',
      `"${p.sku || ''}"`,
      `"${(p.shortDescription || '').replace(/"/g, '""')}"`,
      `"${p.seo?.slug || ''}"`,
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const created = [];
      for (let i = 1; i < lines.length; i++) {
        const values = [];
        let current = '';
        let inQuotes = false;
        let col = '';
        for (let j = 0; j < lines[i].length; j++) {
          const ch = lines[i][j];
          if (ch === '"' && lines[i][j+1] === '"') { col += '"'; j++; }
          else if (ch === '"') { inQuotes = !inQuotes; }
          else if (ch === ',' && !inQuotes) { values.push(col); col = ''; }
          else { col += ch; }
        }
        values.push(col);
        const row = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
        const payload = {
          title: row.Title || row.title || '',
          category: row.Category || row.category || '',
          basePrice: Number(row['Base Price'] || row.basePrice || 0),
          compareAtPrice: row['Compare At Price'] ? Number(row['Compare At Price']) : undefined,
          status: row.Status || row.status || 'draft',
          trackInventory: (row['Track Inventory'] || '').toLowerCase() === 'yes',
          stockQuantity: Number(row['Stock Quantity'] || 0),
          lowStockThreshold: Number(row['Low Stock Threshold'] || 5),
          sku: row.SKU || row.sku || '',
          shortDescription: row['Short Description'] || row.shortDescription || '',
          seo: { slug: row.Slug || row.slug || '' },
        };
        if (!payload.title) continue;
        const res = await api.post('/ecommerce/products', payload);
        created.push(res.data);
      }
      alert(`Imported ${created.length} products successfully`);
      fetchProducts();
    } catch (err) {
      alert(`Import failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Package className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Products</h1>
            <p className="text-sm text-gray-400">{total} product{total !== 1 ? 's' : ''} total</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => fileInputRef.current?.click()} disabled={importLoading} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors disabled:opacity-40">
            <Upload className="w-4 h-4" /> {importLoading ? 'Importing...' : 'Import'}
          </button>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImport} style={{ display: 'none' }} />
          <Link
            to="/app/dashboard/ecommerce/products/new"
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
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
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Products table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : products.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 px-6 py-16 text-center">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="font-bold text-gray-500">No products yet</p>
          <p className="text-sm text-gray-400 mt-1 mb-4">Add your first product to start selling</p>
          <Link
            to="/app/dashboard/ecommerce/products/new"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold hover:bg-indigo-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700 text-left text-xs text-gray-400 uppercase tracking-wider">
                    <th className="px-4 py-3 font-bold">Product</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold">Price</th>
                    <th className="px-4 py-3 font-bold">Stock</th>
                    <th className="px-4 py-3 font-bold">Category</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product._id} className="border-b border-gray-50 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt={product.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                              <Package className="w-5 h-5 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link to={`/app/dashboard/ecommerce/products/${product._id}`} className="font-bold text-gray-900 dark:text-white hover:text-indigo-600 truncate block">
                              {product.title}
                            </Link>
                            {product.sku && <p className="text-xs text-gray-400">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(product.status)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{getDisplayPrice(product)}</td>
                      <td className="px-4 py-3">
                        <span className={getStock(product) <= 0 ? 'text-red-500 font-bold' : getStock(product) <= 5 ? 'text-amber-600 font-bold' : 'text-gray-600 dark:text-gray-400'}>
                          {getStock(product)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {product.category ? (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <Tag className="w-3 h-3" />
                            {product.category}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/app/dashboard/ecommerce/products/${product._id}`}
                            className="p-2 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="View / Edit"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleStatusToggle(product._id, product.status)}
                            disabled={actionLoading}
                            className="p-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                            title={product.status === 'active' ? 'Archive' : 'Activate'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(product._id)}
                            disabled={actionLoading}
                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-600 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700"
              >
                Previous
              </button>
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-600 text-sm font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteId(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">Delete Product?</h3>
            </div>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone. The product and all its variants will be permanently removed.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700">Cancel</button>
              <button onClick={handleDelete} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 disabled:opacity-50">
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
