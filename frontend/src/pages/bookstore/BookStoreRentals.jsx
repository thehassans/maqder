import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Search, Calendar, Clock, AlertTriangle, CheckCircle, X, Loader2, RotateCcw, DollarSign, BookMarked, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active: 'bg-blue-100 text-blue-600',
  returned: 'bg-emerald-100 text-emerald-600',
  overdue: 'bg-red-100 text-red-600',
  lost: 'bg-gray-200 text-gray-600',
};

export default function BookStoreRentals() {
  const [rentals, setRentals] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [returningRental, setReturningRental] = useState(null);
  const [form, setForm] = useState({
    productId: '',
    customerName: '',
    customerPhone: '',
    rentalFee: '',
    depositAmount: '',
    rentalDays: '14',
    notes: '',
  });

  useEffect(() => {
    fetchRentals();
    fetchProducts();
  }, []);

  const fetchRentals = async () => {
    try {
      const res = await api.get('/bookstore/rentals');
      setRentals(res.data || []);
    } catch (err) {
      toast.error('Failed to load rentals');
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

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = search.toLowerCase();
    setSearchResults(products.filter(p =>
      p.name?.toLowerCase().includes(lower) || p.isbn?.includes(search) || p.author?.toLowerCase().includes(lower)
    ).slice(0, 8));
  }, [search, products]);

  const selectBook = (book) => {
    setForm(prev => ({
      ...prev,
      productId: book._id,
      rentalFee: book.rentalPrice || '',
      depositAmount: book.rentalDeposit || '',
      rentalDays: String(book.maxRentalDays || 14),
    }));
    setSearch('');
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.customerName) {
      toast.error('Book and customer name are required');
      return;
    }
    try {
      await api.post('/bookstore/rentals', form);
      toast.success('Book rented out successfully');
      setShowForm(false);
      setForm({ productId: '', customerName: '', customerPhone: '', rentalFee: '', depositAmount: '', rentalDays: '14', notes: '' });
      fetchRentals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create rental');
    }
  };

  const handleReturn = async () => {
    if (!returningRental) return;
    try {
      const res = await api.post(`/bookstore/rentals/${returningRental._id}/return`);
      toast.success(`Book returned${res.data.lateFee > 0 ? ` — Late fee: SAR ${res.data.lateFee}` : ''}`);
      setReturningRental(null);
      fetchRentals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to process return');
    }
  };

  const handleMarkLost = async (id) => {
    if (!confirm('Mark this book as lost? Deposit will be forfeited.')) return;
    try {
      await api.post(`/bookstore/rentals/${id}/mark-lost`);
      toast.success('Book marked as lost');
      fetchRentals();
    } catch (err) {
      toast.error('Failed to mark as lost');
    }
  };

  const filteredRentals = filter === 'all' ? rentals : rentals.filter(r => r.status === filter);

  const isOverdue = (rental) => {
    if (rental.status !== 'active') return false;
    return new Date(rental.dueDate) < new Date();
  };

  const daysUntilDue = (dueDate) => {
    const diff = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[calc(100vh-8rem)]"><Loader2 className="w-10 h-10 animate-spin text-gray-300" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard/bookstore/dashboard" className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Book Rentals</h1>
            <p className="text-sm text-gray-400">Lend books, track due dates, and manage returns</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-indigo-600/10 hover:bg-indigo-700 transition-all"
        >
          <BookOpen className="w-4 h-4" />
          Rent Out Book
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Active', value: rentals.filter(r => r.status === 'active' && !isOverdue(r)).length, icon: Clock, color: 'blue' },
          { label: 'Overdue', value: rentals.filter(r => isOverdue(r)).length, icon: AlertTriangle, color: 'red' },
          { label: 'Returned', value: rentals.filter(r => r.status === 'returned').length, icon: CheckCircle, color: 'emerald' },
          { label: 'Lost', value: rentals.filter(r => r.status === 'lost').length, icon: AlertCircle, color: 'gray' },
        ].map(stat => (
          <div key={stat.label} className="bg-white dark:bg-dark-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-dark-700 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-500 flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {['all', 'active', 'overdue', 'returned', 'lost'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full font-bold text-sm capitalize transition-colors ${
              filter === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Rentals list */}
      {filteredRentals.length === 0 ? (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-12 shadow-sm border border-gray-100 dark:border-dark-700 text-center">
          <BookMarked className="w-12 h-12 mx-auto mb-4 text-gray-200" />
          <p className="font-bold text-gray-400">No rentals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRentals.map(rental => {
            const overdue = isOverdue(rental);
            const days = daysUntilDue(rental.dueDate);
            return (
              <div key={rental._id} className={`bg-white dark:bg-dark-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-dark-700 ${overdue ? 'border-red-200' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      overdue ? 'bg-red-50 text-red-500' : rental.status === 'returned' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'
                    }`}>
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{rental.productName}</p>
                      {rental.productIsbn && <p className="text-xs text-gray-400">ISBN: {rental.productIsbn}</p>}
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 dark:text-gray-300">{rental.customerName}</span>
                        {rental.customerPhone && <span className="text-xs text-gray-400">{rental.customerPhone}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_COLORS[rental.status] || 'bg-gray-100 text-gray-500'}`}>
                          {rental.status}
                        </span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(rental.dueDate).toLocaleDateString()}
                        </span>
                        {rental.status === 'active' && (
                          <span className={`text-xs font-bold ${days < 0 ? 'text-red-500' : days <= 2 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due today' : `${days} days left`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-indigo-600">SAR {Number(rental.rentalFee).toFixed(2)}</p>
                    {rental.depositAmount > 0 && <p className="text-xs text-gray-400">Deposit: SAR {Number(rental.depositAmount).toFixed(2)}</p>}
                    {rental.lateFee > 0 && <p className="text-xs text-red-500 font-bold">Late fee: SAR {Number(rental.lateFee).toFixed(2)}</p>}
                    {rental.status === 'returned' && (
                      <p className="text-xs font-bold text-emerald-600">Total: SAR {Number(rental.totalCharge).toFixed(2)}</p>
                    )}
                  </div>
                </div>
                {rental.status === 'active' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                    <button
                      onClick={() => setReturningRental(rental)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Return Book
                    </button>
                    <button
                      onClick={() => handleMarkLost(rental._id)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-500 rounded-xl font-bold text-sm hover:bg-gray-100 transition-colors"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Mark Lost
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rent out modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">Rent Out a Book</h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-xl hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Search Book *</label>
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by title, ISBN, or author..."
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-lg">
                    {searchResults.map(p => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => selectBook(p)}
                        className={`w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0 ${form.productId === p._id ? 'bg-indigo-50' : ''}`}
                      >
                        <div>
                          <p className="font-bold text-sm text-gray-900">{p.name}</p>
                          {p.author && <p className="text-xs text-gray-400">{p.author}</p>}
                        </div>
                        <span className="text-xs text-gray-400">Stock: {p.stockQuantity || 0}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.productId && (
                  <div className="mt-2 p-3 bg-indigo-50 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-bold text-indigo-700">Book selected</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Customer Name *</label>
                  <input value={form.customerName} onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))} required className="input" />
                </div>
                <div>
                  <label className="label">Customer Phone</label>
                  <input value={form.customerPhone} onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))} className="input" placeholder="05xxxxxxxx" />
                </div>
                <div>
                  <label className="label">Rental Fee (SAR)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" min="0" step="0.01" value={form.rentalFee} onChange={(e) => setForm(prev => ({ ...prev, rentalFee: e.target.value }))} className="input pl-10" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="label">Deposit (SAR)</label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" min="0" step="0.01" value={form.depositAmount} onChange={(e) => setForm(prev => ({ ...prev, depositAmount: e.target.value }))} className="input pl-10" placeholder="0.00" />
                  </div>
                </div>
                <div>
                  <label className="label">Rental Period (days)</label>
                  <input type="number" min="1" value={form.rentalDays} onChange={(e) => setForm(prev => ({ ...prev, rentalDays: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="label">Due Date (auto)</label>
                  <input
                    type="text"
                    disabled
                    value={(() => {
                      const d = new Date();
                      d.setDate(d.getDate() + parseInt(form.rentalDays || 14));
                      return d.toLocaleDateString();
                    })()}
                    className="input opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))} rows="2" className="input" placeholder="Condition notes, special instructions..." />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-gray-600 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Rent Out
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return confirmation modal */}
      {returningRental && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Return Book</h2>
                  <p className="text-sm text-gray-400">{returningRental.productName}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Customer</span>
                  <span className="font-bold text-gray-900">{returningRental.customerName}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Due Date</span>
                  <span className="font-bold text-gray-900">{new Date(returningRental.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-500">Rental Fee</span>
                  <span className="font-bold text-gray-900">SAR {Number(returningRental.rentalFee).toFixed(2)}</span>
                </div>
                {isOverdue(returningRental) && (
                  <div className="flex justify-between p-3 bg-red-50 rounded-xl">
                    <span className="text-sm text-red-500 font-bold">Late Fee ({Math.abs(daysUntilDue(returningRental.dueDate))} days)</span>
                    <span className="font-bold text-red-600">SAR {(Math.abs(daysUntilDue(returningRental.dueDate)) * (returningRental.lateFeePerDay || 5)).toFixed(2)}</span>
                  </div>
                )}
                {returningRental.depositAmount > 0 && (
                  <div className="flex justify-between p-3 bg-emerald-50 rounded-xl">
                    <span className="text-sm text-emerald-600 font-bold">Deposit to Refund</span>
                    <span className="font-bold text-emerald-700">SAR {Number(returningRental.depositAmount).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setReturningRental(null)} className="flex-1 py-3 text-gray-600 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button onClick={handleReturn} className="flex-1 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Confirm Return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
