import React, { useState, useEffect } from 'react';
import { Search, BookOpen, Edit2, Trash2, Plus, PackageX, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BookStoreProducts() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/bookstore/products/all');
      setProducts(res.data || []);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/bookstore/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const filtered = search
    ? products.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.isbn?.includes(search) ||
        p.author?.toLowerCase().includes(search.toLowerCase()) ||
        p.primaryBarcode?.includes(search)
      )
    : products;

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard/bookstore/dashboard" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Book Inventory</h1>
            <p className="text-sm text-gray-400">{products.length} titles in catalog</p>
          </div>
        </div>
        <Link
          to="/app/dashboard/bookstore/add-product"
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, ISBN, author, barcode..."
          className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none transition-all font-medium"
        />
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-3xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-700 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <th className="text-left py-4 px-6">Book</th>
                <th className="text-left py-4 px-4">ISBN</th>
                <th className="text-left py-4 px-4">Author</th>
                <th className="text-left py-4 px-4">Category</th>
                <th className="text-right py-4 px-4">Price</th>
                <th className="text-center py-4 px-4">Stock</th>
                <th className="text-center py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <PackageX className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-medium">No products found</p>
                  </td>
                </tr>
              ) : filtered.map(product => (
                <tr key={product._id} className="border-b border-gray-50 dark:border-dark-700 last:border-0 hover:bg-gray-50/50 dark:hover:bg-dark-700/30 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {product.coverImage ? (
                        <img src={product.coverImage} alt="" className="w-10 h-14 object-cover rounded" />
                      ) : (
                        <div className="w-10 h-14 bg-indigo-50 rounded flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-indigo-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-gray-900 dark:text-white line-clamp-1">{product.name}</p>
                        {product.publisher && <p className="text-xs text-gray-400">{product.publisher}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{product.isbn || '—'}</td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{product.author || '—'}</td>
                  <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-300">{product.category || '—'}</td>
                  <td className="py-4 px-4 text-right">
                    <p className="font-bold text-sm text-indigo-600">SAR {Number(product.retailPrice).toFixed(2)}</p>
                    {product.discountPrice > 0 && <p className="text-xs text-gray-400 line-through">SAR {Number(product.discountPrice).toFixed(2)}</p>}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`inline-flex items-center justify-center w-10 h-7 rounded-lg text-xs font-bold ${
                      product.stockQuantity <= 0
                        ? 'bg-rose-50 text-rose-600'
                        : product.stockQuantity <= (product.minimumStockAlertLevel || 5)
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {product.stockQuantity || 0}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`/app/dashboard/bookstore/add-product?id=${product._id}`} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(product._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
}
