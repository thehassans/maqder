import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, BookOpen, Upload, Loader2, Shirt, GraduationCap, Package, Search, Plus, X, Boxes } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const PRODUCT_TYPES = [
  { value: 'book', label: 'Book', labelAr: 'كتاب', icon: BookOpen, color: 'indigo' },
  { value: 'uniform', label: 'Uniform', labelAr: 'زي مدرسي', icon: Shirt, color: 'emerald' },
  { value: 'stationery', label: 'Stationery', labelAr: 'قرطاسية', icon: Package, color: 'amber' },
  { value: 'course', label: 'Course', labelAr: 'دورة', icon: GraduationCap, color: 'rose' },
  { value: 'bundle', label: 'Bundle', labelAr: 'حزمة', icon: Boxes, color: 'violet' },
  { value: 'other', label: 'Other', labelAr: 'أخرى', icon: Package, color: 'gray' },
];

export default function BookStoreAddProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  const isEdit = Boolean(editId);

  const [form, setForm] = useState({
    productType: 'book',
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
    stockQuantity: '',
    minimumStockAlertLevel: 5,
    costPrice: '',
    retailPrice: '',
    discountPrice: '',
    taxRate: 15,
    isStationery: false,
    coverImage: '',
    seriesName: '',
    seriesNumber: '',
    seriesTotal: '',
    // Uniform fields
    uniformSize: '',
    uniformColor: '',
    uniformGender: 'unisex',
    uniformGradeLevel: '',
    uniformSchoolName: '',
    // Course fields
    courseName: '',
    courseLevel: '',
    courseSubject: '',
    courseDurationWeeks: '',
    courseStartDate: '',
    courseEndDate: '',
    courseInstructor: '',
    courseSchedule: '',
    courseCapacity: '',
    courseLocation: '',
    courseBooks: [],
    // Bundle fields
    bundleItems: [],
    bundleOriginalPrice: '',
    bundleDiscountPercent: '',
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [bookSearch, setBookSearch] = useState('');

  useEffect(() => {
    if (editId) {
      api.get('/bookstore/products/all').then(res => {
        const product = (res.data || []).find(p => p._id === editId);
        if (product) setForm(product);
      }).catch(() => toast.error('Failed to load product'));
    }
  }, [editId]);

  useEffect(() => {
    if (form.productType === 'course') {
      api.get('/bookstore/books/list')
        .then(res => {
          setAvailableBooks(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to load books list:', err?.response?.data || err);
        });
    }
    if (form.productType === 'bundle') {
      api.get('/bookstore/products/all')
        .then(res => {
          setAvailableBooks((res.data || []).filter(p => p.productType !== 'bundle' && p.isActive !== false));
        })
        .catch((err) => {
          console.error('Failed to load products for bundle:', err?.response?.data || err);
        });
    }
  }, [form.productType]);

  const handleAddBundleItem = (productId) => {
    if (!form.bundleItems?.some(bi => bi.productId === productId)) {
      setForm(prev => ({ ...prev, bundleItems: [...(prev.bundleItems || []), { productId, quantity: 1 }] }));
    }
  };

  const handleRemoveBundleItem = (productId) => {
    setForm(prev => ({ ...prev, bundleItems: (prev.bundleItems || []).filter(bi => bi.productId !== productId) }));
  };

  const handleBundleItemQty = (productId, qty) => {
    setForm(prev => ({
      ...prev,
      bundleItems: (prev.bundleItems || []).map(bi => bi.productId === productId ? { ...bi, quantity: Math.max(1, qty) } : bi),
    }));
  };

  const handleAddBook = (bookId) => {
    if (!form.courseBooks?.includes(bookId)) {
      setForm(prev => ({ ...prev, courseBooks: [...(prev.courseBooks || []), bookId] }));
    }
  };

  const handleRemoveBook = (bookId) => {
    setForm(prev => ({ ...prev, courseBooks: (prev.courseBooks || []).filter(id => id !== bookId) }));
  };

  const normalizeNumeric = (value) => value === '' ? '' : Number(value);
  const isNumericField = (name) => ['stockQuantity', 'minimumStockAlertLevel', 'costPrice', 'retailPrice', 'discountPrice', 'taxRate', 'publicationYear', 'seriesNumber', 'seriesTotal', 'courseDurationWeeks', 'courseCapacity', 'bundleOriginalPrice', 'bundleDiscountPercent'].includes(name);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : isNumericField(name) ? normalizeNumeric(value) : value }));
  };

  const handleTypeChange = (type) => {
    setForm(prev => ({ ...prev, productType: type, isStationery: type === 'stationery' }));
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/bookstore/upload-cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, coverImage: res.data.imageUrl }));
      toast.success('Cover image uploaded');
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const prepareFormPayload = (rawForm) => {
    const numericFields = ['stockQuantity', 'minimumStockAlertLevel', 'costPrice', 'retailPrice', 'discountPrice', 'taxRate', 'publicationYear', 'seriesNumber', 'seriesTotal', 'courseDurationWeeks', 'courseCapacity', 'bundleOriginalPrice', 'bundleDiscountPercent'];
    const payload = { ...rawForm };
    numericFields.forEach(field => {
      if (payload[field] === '' || payload[field] == null) {
        payload[field] = 0;
      } else {
        payload[field] = Number(payload[field]);
      }
    });
    return payload;
  };

  const handleAutoFillCourseBooks = () => {
    const searchTerms = [form.courseName, form.courseLevel, form.courseSubject].filter(Boolean).join(' ').toLowerCase();
    if (!searchTerms.trim()) return;
    const gradeMatch = searchTerms.match(/\b(grade\s*\d+|\d+th|\d+st|\d+nd|\d+rd|g\d+|\d+)\b/);
    const subjectMatch = form.courseSubject?.toLowerCase().trim();
    const matches = availableBooks.filter(book => {
      if ((form.courseBooks || []).includes(book._id)) return false;
      const bookText = `${book.name || ''} ${book.category || ''} ${book.genre || ''} ${book.subject || ''}`.toLowerCase();
      if (subjectMatch && bookText.includes(subjectMatch)) return true;
      if (gradeMatch) {
        const gradePatterns = [gradeMatch[0], gradeMatch[0].replace(/\s/g, '')];
        return gradePatterns.some(p => bookText.includes(p));
      }
      return false;
    });
    if (matches.length === 0) {
      toast('No matching books found for this course');
      return;
    }
    setForm(prev => ({ ...prev, courseBooks: [...(prev.courseBooks || []), ...matches.map(b => b._id)] }));
    toast.success(`Added ${matches.length} book${matches.length > 1 ? 's' : ''} to course`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = prepareFormPayload(form);
    try {
      if (isEdit) {
        await api.put(`/bookstore/products/${editId}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/bookstore/products', payload);
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
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
          <p className="text-sm text-gray-400">{isEdit ? 'Update product details' : 'Add books, uniforms, stationery, courses, and more'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Type Selector */}
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Product Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {PRODUCT_TYPES.map(({ value, label, labelAr, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleTypeChange(value)}
                className={`flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all ${
                  form.productType === value
                    ? `border-${color}-500 bg-${color}-50 text-${color}-700`
                    : 'border-gray-200 text-gray-400 hover:border-gray-300'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-bold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Book Details */}
        {form.productType === 'book' && (
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
              <label className="label">Cover Image</label>
              <div className="flex items-center gap-3">
                {form.coverImage && (
                  <img src={form.coverImage} alt="Cover" className="w-12 h-16 object-cover rounded-lg border border-gray-200" />
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Upload Cover
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
              </div>
              <input name="coverImage" value={form.coverImage} onChange={handleChange} className="input mt-2" placeholder="Or paste URL..." />
            </div>
            <div className="md:col-span-2">
              <label className="label">Series Tracking</label>
              <div className="grid grid-cols-3 gap-3">
                <input name="seriesName" value={form.seriesName} onChange={handleChange} className="input" placeholder="Series name (e.g. Harry Potter)" />
                <input name="seriesNumber" type="number" value={form.seriesNumber} onChange={handleChange} className="input" placeholder="Book # in series" />
                <input name="seriesTotal" type="number" value={form.seriesTotal} onChange={handleChange} className="input" placeholder="Total books in series" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" className="input" />
            </div>
          </div>
        </div>
        )}

        {/* Uniform Details */}
        {form.productType === 'uniform' && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-5">
            <Shirt className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Uniform Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Item Name (English) *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="e.g. School Uniform Shirt" />
            </div>
            <div>
              <label className="label">Item Name (Arabic)</label>
              <input name="nameAr" value={form.nameAr} onChange={handleChange} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input name="primaryBarcode" value={form.primaryBarcode} onChange={handleChange} className="input" placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="label">School Name</label>
              <input name="uniformSchoolName" value={form.uniformSchoolName} onChange={handleChange} className="input" placeholder="e.g. Al-Noor International School" />
            </div>
            <div>
              <label className="label">Size</label>
              <select name="uniformSize" value={form.uniformSize} onChange={handleChange} className="select">
                <option value="">Select size</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
                <option value="3-4">3-4 years</option>
                <option value="5-6">5-6 years</option>
                <option value="7-8">7-8 years</option>
                <option value="9-10">9-10 years</option>
                <option value="11-12">11-12 years</option>
                <option value="13-14">13-14 years</option>
              </select>
            </div>
            <div>
              <label className="label">Color</label>
              <input name="uniformColor" value={form.uniformColor} onChange={handleChange} className="input" placeholder="e.g. Navy Blue" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select name="uniformGender" value={form.uniformGender} onChange={handleChange} className="select">
                <option value="unisex">Unisex</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">Grade Level</label>
              <input name="uniformGradeLevel" value={form.uniformGradeLevel} onChange={handleChange} className="input" placeholder="e.g. Grade 1-3" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="2" className="input" />
            </div>
          </div>
        </div>
        )}

        {/* Course Details */}
        {form.productType === 'course' && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap className="w-5 h-5 text-rose-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Course Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Course Name (English) *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="e.g. Complete Grade 5 Math Course" />
            </div>
            <div>
              <label className="label">Course Name (Arabic)</label>
              <input name="nameAr" value={form.nameAr} onChange={handleChange} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">Barcode / SKU</label>
              <input name="primaryBarcode" value={form.primaryBarcode} onChange={handleChange} className="input" placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="label">Subject</label>
              <input name="courseSubject" value={form.courseSubject} onChange={handleChange} className="input" placeholder="e.g. Mathematics, Science, Arabic" />
            </div>
            <div>
              <label className="label">Level / Grade</label>
              <input name="courseLevel" value={form.courseLevel} onChange={handleChange} className="input" placeholder="e.g. Grade 5, Beginner, Advanced" />
            </div>
            <div>
              <label className="label">Duration (weeks)</label>
              <input name="courseDurationWeeks" type="number" value={form.courseDurationWeeks} onChange={handleChange} className="input" placeholder="e.g. 12" />
            </div>
            <div>
              <label className="label">Start Date</label>
              <input name="courseStartDate" type="date" value={form.courseStartDate ? form.courseStartDate.split('T')[0] : ''} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">End Date</label>
              <input name="courseEndDate" type="date" value={form.courseEndDate ? form.courseEndDate.split('T')[0] : ''} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Instructor</label>
              <input name="courseInstructor" value={form.courseInstructor} onChange={handleChange} className="input" placeholder="Teacher name" />
            </div>
            <div>
              <label className="label">Schedule</label>
              <input name="courseSchedule" value={form.courseSchedule} onChange={handleChange} className="input" placeholder="e.g. Sat/Mon/Wed 4-6 PM" />
            </div>
            <div>
              <label className="label">Capacity (max students)</label>
              <input name="courseCapacity" type="number" value={form.courseCapacity} onChange={handleChange} className="input" placeholder="e.g. 20" />
            </div>
            <div>
              <label className="label">Location</label>
              <input name="courseLocation" value={form.courseLocation} onChange={handleChange} className="input" placeholder="e.g. Classroom 3 / Online" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="2" className="input" />
            </div>

            {/* Auto-fill course books */}
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAutoFillCourseBooks}
                disabled={!form.courseLevel && !form.courseSubject && !form.courseName}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Boxes className="w-4 h-4" />
                Auto-fill course books
              </button>
              <p className="text-xs text-gray-400 mt-1.5">Matches books by course level and subject</p>
            </div>

            {/* Course Books Selector */}
            <div className="md:col-span-2">
              <label className="label">Course Books (select books included in this course)</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Search books to add..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-rose-200 outline-none"
                />
              </div>
              {bookSearch && (
                <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-sm">
                  {availableBooks
                    .filter(b =>
                      b.name?.toLowerCase().includes(bookSearch.toLowerCase()) ||
                      b.isbn?.includes(bookSearch) ||
                      b.author?.toLowerCase().includes(bookSearch.toLowerCase())
                    )
                    .filter(b => !(form.courseBooks || []).includes(b._id))
                    .slice(0, 8)
                    .map(book => (
                      <button
                        key={book._id}
                        type="button"
                        onClick={() => { handleAddBook(book._id); setBookSearch(''); }}
                        className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                      >
                        {book.coverImage ? (
                          <img src={book.coverImage} alt="" className="w-8 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-8 h-10 bg-indigo-50 rounded flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-indigo-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{book.name}</p>
                          {book.author && <p className="text-xs text-gray-400 truncate">{book.author}</p>}
                        </div>
                        <Plus className="w-4 h-4 text-rose-500" />
                      </button>
                    ))}
                  {availableBooks.filter(b =>
                    b.name?.toLowerCase().includes(bookSearch.toLowerCase()) ||
                    b.isbn?.includes(bookSearch) ||
                    b.author?.toLowerCase().includes(bookSearch.toLowerCase())
                  ).filter(b => !(form.courseBooks || []).includes(b._id)).length === 0 && (
                    <p className="text-sm text-gray-400 p-3 text-center">No books found</p>
                  )}
                </div>
              )}
              {/* Selected books list */}
              {(form.courseBooks || []).length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected Books ({(form.courseBooks || []).length})</p>
                  {(form.courseBooks || []).map(bookId => {
                    const book = availableBooks.find(b => b._id === bookId);
                    if (!book) return (
                      <div key={bookId} className="flex items-center justify-between p-2.5 bg-rose-50 rounded-xl">
                        <span className="text-sm text-gray-500">Loading...</span>
                        <button type="button" onClick={() => handleRemoveBook(bookId)} className="text-red-500 hover:text-red-700">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                    return (
                      <div key={bookId} className="flex items-center gap-3 p-2.5 bg-rose-50 rounded-xl">
                        {book.coverImage ? (
                          <img src={book.coverImage} alt="" className="w-8 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-8 h-10 bg-white rounded flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-rose-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{book.name}</p>
                          {book.author && <p className="text-xs text-gray-400 truncate">{book.author}</p>}
                        </div>
                        <span className="text-sm font-bold text-rose-600">SAR {Number(book.retailPrice).toFixed(2)}</span>
                        <button type="button" onClick={() => handleRemoveBook(bookId)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Bundle Details */}
        {form.productType === 'bundle' && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-5">
            <Boxes className="w-5 h-5 text-violet-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bundle Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="label">Bundle Name (English) *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="e.g. Grade 5 Full Set" />
            </div>
            <div>
              <label className="label">Bundle Name (Arabic)</label>
              <input name="nameAr" value={form.nameAr} onChange={handleChange} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">Barcode / SKU</label>
              <input name="primaryBarcode" value={form.primaryBarcode} onChange={handleChange} className="input" placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" value={form.category} onChange={handleChange} className="input" placeholder="e.g. Grade 5, Back to School" />
            </div>
          </div>

          {/* Item selector */}
          <div className="mb-4">
            <label className="label">Bundle Items (select products to include)</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Search products to add..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-violet-200 outline-none"
              />
            </div>
            {bookSearch && (
              <div className="mt-2 max-h-40 overflow-y-auto bg-white border border-gray-100 rounded-xl shadow-sm">
                {availableBooks
                  .filter(b =>
                    b.name?.toLowerCase().includes(bookSearch.toLowerCase()) ||
                    b.isbn?.includes(bookSearch) ||
                    b.primaryBarcode?.includes(bookSearch)
                  )
                  .filter(b => !(form.bundleItems || []).some(bi => bi.productId === b._id))
                  .slice(0, 8)
                  .map(prod => (
                    <button
                      key={prod._id}
                      type="button"
                      onClick={() => { handleAddBundleItem(prod._id); setBookSearch(''); }}
                      className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                    >
                      <div className="w-8 h-10 bg-violet-50 rounded flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4 text-violet-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{prod.name}</p>
                        <p className="text-xs text-gray-400 truncate capitalize">{prod.productType || 'book'} · SAR {Number(prod.retailPrice).toFixed(2)}</p>
                      </div>
                      <Plus className="w-4 h-4 text-violet-500" />
                    </button>
                  ))}
                {availableBooks.filter(b =>
                  b.name?.toLowerCase().includes(bookSearch.toLowerCase()) ||
                  b.isbn?.includes(bookSearch) ||
                  b.primaryBarcode?.includes(bookSearch)
                ).filter(b => !(form.bundleItems || []).some(bi => bi.productId === b._id)).length === 0 && (
                  <p className="text-sm text-gray-400 p-3 text-center">No products found</p>
                )}
              </div>
            )}
          </div>

          {/* Selected items list */}
          {(form.bundleItems || []).length > 0 && (
            <div className="space-y-2 mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Selected Items ({(form.bundleItems || []).length})</p>
              {(form.bundleItems || []).map(bi => {
                const prod = availableBooks.find(b => b._id === bi.productId);
                if (!prod) return (
                  <div key={bi.productId} className="flex items-center justify-between p-2.5 bg-violet-50 rounded-xl">
                    <span className="text-sm text-gray-500">Loading...</span>
                    <button type="button" onClick={() => handleRemoveBundleItem(bi.productId)} className="text-red-500"><X className="w-4 h-4" /></button>
                  </div>
                );
                return (
                  <div key={bi.productId} className="flex items-center gap-3 p-2.5 bg-violet-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{prod.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{prod.productType || 'book'} · SAR {Number(prod.retailPrice).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => handleBundleItemQty(bi.productId, (bi.quantity || 1) - 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">−</button>
                      <span className="w-8 text-center text-sm font-bold">{bi.quantity || 1}</span>
                      <button type="button" onClick={() => handleBundleItemQty(bi.productId, (bi.quantity || 1) + 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center">+</button>
                    </div>
                    <span className="text-sm font-bold text-violet-600 w-20 text-right">SAR {(Number(prod.retailPrice) * (bi.quantity || 1)).toFixed(2)}</span>
                    <button type="button" onClick={() => handleRemoveBundleItem(bi.productId)} className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bundle pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div>
              <label className="label">Original Total (auto-calculated)</label>
              <input
                type="number"
                value={(() => {
                  const total = (form.bundleItems || []).reduce((sum, bi) => {
                    const prod = availableBooks.find(b => b._id === bi.productId);
                    return sum + (Number(prod?.retailPrice || 0) * (bi.quantity || 1));
                  }, 0);
                  return total.toFixed(2);
                })()}
                readOnly
                className="input bg-gray-50"
              />
            </div>
            <div>
              <label className="label">Discount %</label>
              <input name="bundleDiscountPercent" type="number" min="0" max="100" step="0.01" value={form.bundleDiscountPercent} onChange={handleChange} className="input" placeholder="e.g. 10" />
            </div>
            <div>
              <label className="label">Bundle Price (SAR) *</label>
              <input name="retailPrice" type="number" min="0" step="0.01" value={form.retailPrice} onChange={handleChange} required className="input" placeholder="Price after discount" />
            </div>
          </div>
        </div>
        )}

        {/* Stationery / Other Details */}
        {(form.productType === 'stationery' || form.productType === 'other') && (
        <div className="bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-dark-700">
          <div className="flex items-center gap-2 mb-5">
            <Package className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{form.productType === 'stationery' ? 'Stationery Details' : 'Product Details'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Item Name (English) *</label>
              <input name="name" value={form.name} onChange={handleChange} required className="input" placeholder="e.g. Notebook, Pen, Ruler" />
            </div>
            <div>
              <label className="label">Item Name (Arabic)</label>
              <input name="nameAr" value={form.nameAr} onChange={handleChange} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">Barcode</label>
              <input name="primaryBarcode" value={form.primaryBarcode} onChange={handleChange} className="input" placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="label">Category</label>
              <input name="category" value={form.category} onChange={handleChange} className="input" placeholder="e.g. Notebooks, Pens, Art Supplies" />
            </div>
            <div>
              <label className="label">Brand / Publisher</label>
              <input name="publisher" value={form.publisher} onChange={handleChange} className="input" />
            </div>
            <div>
              <label className="label">Unit</label>
              <select name="unit" value={form.unit} onChange={handleChange} className="select">
                <option value="PCS">Pieces</option>
                <option value="BOX">Box</option>
                <option value="PACK">Pack</option>
                <option value="SET">Set</option>
                <option value="DOZEN">Dozen</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="2" className="input" />
            </div>
          </div>
        </div>
        )}

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
            {form.productType !== 'course' && (
              <>
                <div>
                  <label className="label">Stock Quantity</label>
                  <input name="stockQuantity" type="number" min="0" value={form.stockQuantity} onChange={handleChange} className="input" />
                </div>
                <div>
                  <label className="label">Min Stock Alert</label>
                  <input name="minimumStockAlertLevel" type="number" min="0" value={form.minimumStockAlertLevel} onChange={handleChange} className="input" />
                </div>
              </>
            )}
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
