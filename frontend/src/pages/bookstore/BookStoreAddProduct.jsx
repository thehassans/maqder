import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function BookStoreAddProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);

  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    isbn: '',
    primaryBarcode: '',
    author: '',
    authorAr: '',
    publisher: '',
    publisherAr: '',
    genre: '',
    language: 'English',
    edition: '',
    publicationYear: '',
    coverType: 'paperback',
    category: '',
    subCategory: '',
    description: '',
    unit: 'PCS',
    stockQuantity: 0,
    minimumStockAlertLevel: 5,
    costPrice: 0,
    retailPrice: 0,
    discountPrice: 0,
    taxRate: 15,
    isStationery: false,
    coverImage: '',
  });

  useEffect(() => {
    if (editId) {
      api.get('/bookstore/products/all').then(res => {
        const product = (res.data || []).find(p => p._id === editId);
        if (product) setForm(product);
      }).catch(() => toast.error('Failed to load product'));
    }
  }, [editId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEdit) {
        await api.put(`/bookstore/products/${editId}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/bookstore/products', form);
        toast.success('Product added');
      }
      navigate('/app/dashboard/bookstore/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/app/dashboard/bookstore/products')} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{isEdit ? 'Edit Product' : 'Add New Book / Product'}</h1>
          <p className="text-sm text-gray-400">{isEdit ? 'Update product details' : 'Add a new book or stationery item to inventory'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Book Details */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-5">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Book Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Title (English) *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="label">Title (Arabic)</label>
              <input name="nameAr" value={form.nameAr} onChange={handleChange} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">ISBN</label>
              <input name="isbn" value={form.isbn} onChange={handleChange} className="input" placeholder="978-3-16-148410-0" />
            </div>
            <div>
              <label className="label">Barcode (auto from ISBN if empty)</label>
              <input name="primaryBarcode" value={form.primaryBarcode} onChange={handleChange} className="input" placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="label">Author</label>
              <input name="author" value={form.author} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Author (Arabic)</label>
              <input name="authorAr" value={form.authorAr} onChange={handleChange} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">Publisher</label>
              <input name="publisher" value={form.publisher} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Publisher (Arabic)</label>
              <input name="publisherAr" value={form.publisherAr} onChange={handleChange} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">Genre / Category</label>
              <input name="genre" value={form.genre} onChange={handleChange} className="input" placeholder="Fiction, Non-fiction, Children..." />
            </div>
            <div>
              <label className="label">Language</label>
              <select name="language" value={form.language} onChange={handleChange} className="select">
                <option value="English">English</option>
                <option value="Arabic">Arabic</option>
                <option value="Bilingual">Bilingual</option>
                <option value="French">French</option>
                <option value="Urdu">Urdu</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Edition</label>
              <input name="edition" value={form.edition} onChange={handleChange} className="input" placeholder="1st, 2nd, Revised..." />
            </div>
            <div>
              <label className="label">Publication Year</label>
              <input name="publicationYear" type="number" value={form.publicationYear} onChange={handleChange} className="input" placeholder="2024" />
            </div>
            <div>
              <label className="label">Cover Type</label>
              <select name="coverType" value={form.coverType} onChange={handleChange} className="select">
                <option value="paperback">Paperback</option>
                <option value="hardcover">Hardcover</option>
                <option value="ebook">E-Book</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Cover Image URL</label>
              <input name="coverImage" value={form.coverImage} onChange={handleChange} className="input" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isStationery" checked={form.isStationery} onChange={handleChange} className="w-4 h-4 rounded text-indigo-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">This is a stationery item (not a book)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Pricing & Stock */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5">Pricing & Stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Cost Price (SAR)</label>
              <input name="costPrice" type="number" min="0" step="0.01" value={form.costPrice} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Retail Price (SAR) *</label>
              <input name="retailPrice" type="number" min="0" step="0.01" value={form.retailPrice} onChange={handleChange} required className="input" />
            </div>
            <div>
              <label className="label">Discount Price (SAR)</label>
              <input name="discountPrice" type="number" min="0" step="0.01" value={form.discountPrice} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Stock Quantity</label>
              <input name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Min Stock Alert</label>
              <input name="minimumStockAlertLevel" type="number" min="0" value={form.minimumStockAlertLevel} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input name="taxRate" type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={handleChange} className="input" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/app/dashboard/bookstore/products')} className="px-6 py-3 text-gray-600 bg-gray-100 rounded-2xl font-bold hover:bg-gray-200 transition-colors">
            Cancel
          </button>
          <button type="submit" className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Save className="w-5 h-5" />
            {isEdit ? 'Update Product' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
