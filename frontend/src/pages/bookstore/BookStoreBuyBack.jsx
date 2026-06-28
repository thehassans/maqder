import React, { useState, useEffect } from 'react';
import { ArrowLeft, Recycle, Search, BookOpen, DollarSign, Plus, Loader2, CheckCircle, Library } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const CONDITIONS = [
  { value: 'like_new', label: 'Like New', pct: 60 },
  { value: 'very_good', label: 'Very Good', pct: 50 },
  { value: 'good', label: 'Good', pct: 40 },
  { value: 'acceptable', label: 'Acceptable', pct: 25 },
  { value: 'poor', label: 'Poor', pct: 15 },
];

export default function BookStoreBuyBack() {
  const [allProducts, setAllProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [form, setForm] = useState({
    isbn: '',
    title: '',
    author: '',
    publisher: '',
    condition: 'good',
    buyBackPrice: '',
    resalePrice: '',
    customerName: '',
    customerPhone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [usedBooks, setUsedBooks] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchUsedBooks();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/bookstore/products');
      if (res.data.success) setAllProducts(res.data.products || []);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const fetchUsedBooks = async () => {
    try {
      const res = await api.get('/bookstore/used-books');
      setUsedBooks(res.data || []);
    } catch (err) {
      console.error('Failed to load used books', err);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = searchTerm.toLowerCase();
    setSearchResults(allProducts.filter(p =>
      p.name?.toLowerCase().includes(lower) ||
      p.isbn?.includes(searchTerm) ||
      p.author?.toLowerCase().includes(lower)
    ).slice(0, 8));
  }, [searchTerm, allProducts]);

  const selectBook = (book) => {
    setSelectedBook(book);
    setForm(prev => ({
      ...prev,
      isbn: book.isbn || '',
      title: book.name || '',
      author: book.author || '',
      publisher: book.publisher || '',
    }));
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleConditionChange = (condition) => {
    setForm(prev => {
      const cond = CONDITIONS.find(c => c.value === condition);
      const retail = selectedBook?.retailPrice || 0;
      const suggestedBuyBack = retail ? (retail * cond.pct / 100).toFixed(2) : '';
      const suggestedResale = retail ? (retail * 0.75).toFixed(2) : '';
      return {
        ...prev,
        condition,
        buyBackPrice: suggestedBuyBack,
        resalePrice: suggestedResale,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.buyBackPrice) {
      toast.error('Title and buy-back price are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/bookstore/buyback', form);
      toast.success(`Bought back "${form.title}" for SAR ${form.buyBackPrice}`);
      setForm({ isbn: '', title: '', author: '', publisher: '', condition: 'good', buyBackPrice: '', resalePrice: '', customerName: '', customerPhone: '' });
      setSelectedBook(null);
      fetchUsedBooks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Buy-back failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/app/dashboard/bookstore/dashboard" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Used Books Buy-Back</h1>
          <p className="text-sm text-gray-400">Buy books from customers and add to used inventory</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buy-back form */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-5">
            <Recycle className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Buy Back a Book</h3>
          </div>

          {/* Search existing catalog */}
          <div className="mb-4">
            <label className="label">Search Catalog (auto-fill)</label>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, ISBN, or author..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-200 outline-none"
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-lg">
                {searchResults.map(p => (
                  <button
                    key={p._id}
                    onClick={() => selectBook(p)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    <div>
                      <p className="font-bold text-sm text-gray-900">{p.name}</p>
                      {p.author && <p className="text-xs text-gray-400">{p.author}</p>}
                    </div>
                    <span className="font-bold text-sm text-emerald-600">SAR {Number(p.retailPrice).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">ISBN</label>
                <input value={form.isbn} onChange={(e) => setForm(prev => ({ ...prev, isbn: e.target.value }))} className="input" placeholder="978-..." />
              </div>
              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} required className="input" />
              </div>
              <div>
                <label className="label">Author</label>
                <input value={form.author} onChange={(e) => setForm(prev => ({ ...prev, author: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Publisher</label>
                <input value={form.publisher} onChange={(e) => setForm(prev => ({ ...prev, publisher: e.target.value }))} className="input" />
              </div>
            </div>

            {/* Condition selector */}
            <div>
              <label className="label">Condition</label>
              <div className="grid grid-cols-5 gap-2">
                {CONDITIONS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => handleConditionChange(c.value)}
                    className={`px-2 py-2.5 rounded-xl font-bold text-xs border transition-all ${
                      form.condition === c.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {c.label}
                    <span className="block text-[9px] opacity-70">{c.pct}%</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Buy-Back Price (SAR) *</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min="0" step="0.01" value={form.buyBackPrice} onChange={(e) => setForm(prev => ({ ...prev, buyBackPrice: e.target.value }))} required className="input pl-10" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="label">Resale Price (SAR)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min="0" step="0.01" value={form.resalePrice} onChange={(e) => setForm(prev => ({ ...prev, resalePrice: e.target.value }))} className="input pl-10" placeholder="0.00" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Customer Name</label>
                <input value={form.customerName} onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))} className="input" placeholder="Walk-in" />
              </div>
              <div>
                <label className="label">Customer Phone</label>
                <input value={form.customerPhone} onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))} className="input" placeholder="05xxxxxxxx" />
              </div>
            </div>

            {form.buyBackPrice && form.resalePrice && (
              <div className="p-4 bg-emerald-50 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Estimated Profit</p>
                  <p className="text-2xl font-black text-emerald-700">SAR {(Number(form.resalePrice) - Number(form.buyBackPrice)).toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-500">Buy: SAR {Number(form.buyBackPrice).toFixed(2)}</p>
                  <p className="text-xs text-emerald-500">Sell: SAR {Number(form.resalePrice).toFixed(2)}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Recycle className="w-5 h-5" />}
              Complete Buy-Back
            </button>
          </form>
        </div>

        {/* Used books inventory */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-5">
            <Library className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Used Books Inventory ({usedBooks.length})</h3>
          </div>
          {usedBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="font-bold text-gray-400">No used books yet</p>
              <p className="text-sm text-gray-400 mt-1">Buy-back books will appear here</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {usedBooks.map(book => (
                <div key={book._id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt="" className="w-10 h-14 object-cover rounded" />
                  ) : (
                    <div className="w-10 h-14 bg-emerald-50 rounded flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-emerald-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{book.name}</p>
                    {book.author && <p className="text-xs text-gray-400 truncate">{book.author}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full font-bold uppercase">{book.condition?.replace('_', ' ')}</span>
                      <span className="text-[10px] text-gray-400">Stock: {book.stockQuantity}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-emerald-600">SAR {Number(book.retailPrice).toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400">Bought: SAR {Number(book.buyBackPrice).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
