import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  X,
  Package,
  Sparkles,
  Trash2,
  Edit3,
  Upload,
  Wand2,
  ImageIcon,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

/**
 * Furniture Products Management Page
 * Grid view of all furniture products with add/edit form and image upload.
 * Simplified for pure sales logic with open pricing support.
 */

export default function FurnitureProducts() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const isArabic = language === 'ar'
  const label = (en, ar) => (isArabic ? ar : en)
  const dir = isArabic ? 'rtl' : 'ltr'

  const translateCategory = (cat) => {
    if (!cat) return label('General', 'عام')
    const map = {
      'Sofa': label('Sofa', 'كنب'),
      'Bed': label('Bed', 'سرير'),
      'Carpet': label('Carpet', 'سجاد'),
      'Majlis': label('Majlis', 'مجالس'),
      'Dining': label('Dining', 'طعام')
    }
    return map[cat] || cat
  }

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [uploading, setUploading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    sku: '',
    category: '',
    size: '',
    color: '',
    salePrice: '0', // 0 triggers open price in POS
    primaryImage: '',
    description: '',
    isActive: true,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['furniture-products', search],
    queryFn: () =>
      api
        .get('/furniture/products', { params: { search, limit: 200 } })
        .then((res) => res.data.products || []),
  })

  const products = data || []

  const resetForm = () => {
    setForm({
      name: '',
      nameAr: '',
      sku: '',
      category: '',
      size: '',
      color: '',
      salePrice: '0',
      primaryImage: '',
      description: '',
      isActive: true,
    })
    setPreviewUrl('')
    setEditingId(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (product) => {
    setForm({
      name: product.name || '',
      nameAr: product.nameAr || '',
      sku: product.sku || '',
      category: product.category || '',
      size: product.size || '',
      color: product.color || '',
      salePrice: product.salePrice || '0',
      primaryImage: product.primaryImage || '',
      description: product.description || '',
      isActive: product.isActive !== false,
    })
    setPreviewUrl(product.primaryImage || '')
    setEditingId(product._id)
    setShowForm(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingId) {
        return api.put(`/furniture/products/${editingId}`, payload).then((r) => r.data)
      }
      return api.post('/furniture/products', payload).then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['furniture-products'] })
      setShowForm(false)
      resetForm()
    },
  })

  const handleSave = () => {
    const payload = {
      ...form,
      salePrice: Number(form.salePrice) || 0,
    }
    saveMutation.mutate(payload)
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/furniture/products/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['furniture-products'] }),
  })

  // Image compression helper
  const compressImage = (file, { maxWidth = 1200, maxHeight = 1200, quality = 0.85, type = 'image/jpeg' } = {}) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Image compression failed'))
            resolve(blob)
          },
          type,
          quality
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load image'))
      }
      img.src = objectUrl
    })
  }

  // Image upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressedBlob = await compressImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.85, type: 'image/jpeg' })
      const compressedFile = new File([compressedBlob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
      const fd = new FormData()
      fd.append('image', compressedFile)
      const res = await api.post('/furniture/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      setForm((f) => ({ ...f, primaryImage: res.data.imageUrl }))
      setPreviewUrl(res.data.imageUrl)
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally {
      setUploading(false)
    }
  }

  // Demo seed
  const demoMutation = useMutation({
    mutationFn: () => api.post('/furniture/seed-demo').then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['furniture-products'] }),
  })

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-500" />
            {label('Furniture Catalog', 'دليل الأثاث')}
          </h1>
          <p className="text-gray-500 mt-1">
            {label('Manage your premium furniture inventory', 'إدارة مخزون الأثاث الخاص بك')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={label('Search...', 'بحث...')}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm w-56 focus:ring-2 focus:ring-indigo-200 outline-none"
            />
          </div>
          <button
            onClick={() => demoMutation.mutate()}
            disabled={demoMutation.isPending}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            {label('Load Demo', 'تحميل تجريبي')}
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {label('Add Product', 'إضافة منتج')}
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">{label('Loading...', 'جاري التحميل...')}</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Sparkles className="w-12 h-12 mb-3 opacity-30" />
          <p>{label('No products found. Add your first item!', 'لا توجد منتجات. أضف منتجك الأول!')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((p) => (
            <motion.div
              key={p._id}
              layout
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden group">
                {p.primaryImage ? (
                  <img src={p.primaryImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(p)}
                    className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-sm hover:bg-white text-gray-600"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(p._id)}
                    className="bg-white/90 backdrop-blur p-2 rounded-xl shadow-sm hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base truncate">{p.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{p.sku}</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap">
                    {translateCategory(p.category)}
                  </span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-gray-500 text-sm">{label('Price', 'السعر')}</span>
                  <span className="text-lg font-bold text-gray-900">
                    {p.salePrice > 0 ? `SAR ${p.salePrice}` : label('Open Price', 'سعر مفتوح')}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between flex-none bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded-xl">
                    <Package className="w-5 h-5 text-indigo-600" />
                  </div>
                  {editingId ? label('Edit Product', 'تعديل منتج') : label('Add New Product', 'إضافة منتج جديد')}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-900 bg-white p-2 rounded-full shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 space-y-6">
                {/* Image Upload */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">{label('Product Image', 'صورة المنتج')}</label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-indigo-400 transition-colors group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {uploading ? label('Uploading...', 'جاري الرفع...') : label('Upload Image', 'رفع صورة')}
                      </button>
                      <p className="text-xs text-gray-400 mt-2">{label('High quality JPG, PNG, WebP', 'صيغ عالية الجودة')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label('Name (EN)', 'الاسم (إنجليزي)')} *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label('Name (AR)', 'الاسم (عربي)')}</label>
                    <input
                      value={form.nameAr}
                      onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none text-right transition-all"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label('SKU', 'الرمز')} *</label>
                    <input
                      value={form.sku}
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none uppercase transition-all"
                      placeholder="SOFA-001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label('Category', 'الفئة')}</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder={label('Sofa, Carpet...', 'كنب، سجاد...')}
                      list="categories"
                    />
                    <datalist id="categories">
                      <option value="Sofa" />
                      <option value="Bed" />
                      <option value="Carpet" />
                      <option value="Majlis" />
                      <option value="Dining" />
                    </datalist>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label('Size / Dimensions', 'المقاس / الأبعاد')}</label>
                    <input
                      value={form.size}
                      onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="2x3m / 3 Seater"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label('Color', 'اللون')}</label>
                    <input
                      value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">
                      {label('Default Price (SAR)', 'السعر الافتراضي')} 
                      <span className="text-xs text-gray-400 font-normal ml-2">({label('Leave 0 to set price at POS', 'اتركه 0 لتحديد السعر في نقطة البيع')})</span>
                    </label>
                    <input
                      type="number"
                      value={form.salePrice}
                      onChange={(e) => setForm((f) => ({ ...f, salePrice: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none text-lg font-bold text-indigo-700 transition-all"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">{label('Description', 'الوصف')}</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none resize-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-4 flex-none bg-gray-50/50">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3.5 rounded-xl bg-white border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  {label('Cancel', 'إلغاء')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !form.name || !form.sku}
                  className="flex-1 py-3.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  {saveMutation.isPending
                    ? label('Saving...', 'جاري الحفظ...')
                    : editingId
                    ? label('Update Product', 'تحديث المنتج')
                    : label('Save Product', 'حفظ المنتج')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
