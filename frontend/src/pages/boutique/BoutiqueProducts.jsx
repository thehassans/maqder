import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Plus,
  X,
  Shirt,
  Sparkles,
  Trash2,
  Edit3,
  Upload,
  Wand2,
  ImageIcon,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

/**
 * Boutique Products (Dresses) Management Page
 * Grid view of all boutique dresses with add/edit form and image upload.
 * Includes a "Load Demo Suit" button for quick testing.
 */

export default function BoutiqueProducts() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()
  const fileInputRef = useRef(null)

  const isArabic = language === 'ar'
  const label = (en, ar) => (isArabic ? ar : en)

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
    mode: 'FOR_RENT',
    dailyRate: '',
    rentalRates: '',
    securityDeposit: '',
    turnaroundHours: '24',
    rentalQuantity: '1',
    primaryImage: '',
    description: '',
    isActive: true,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['boutique-products', search],
    queryFn: () =>
      api
        .get('/boutique/products', { params: { search, limit: 200 } })
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
      mode: 'FOR_RENT',
      dailyRate: '',
      rentalRates: '',
      securityDeposit: '',
      turnaroundHours: '24',
      rentalQuantity: '1',
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
      mode: product.mode || 'FOR_RENT',
      dailyRate: product.dailyRate || '',
      rentalRates: product.rentalRates?.map((r) => `${r.days}:${r.rate}`).join(',') || '',
      securityDeposit: product.securityDeposit || '',
      turnaroundHours: String(product.turnaroundHours || 24),
      rentalQuantity: String(product.rentalQuantity || 1),
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
        return api.put(`/boutique/products/${editingId}`, payload).then((r) => r.data)
      }
      return api.post('/boutique/products', payload).then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-products'] })
      setShowForm(false)
      resetForm()
    },
  })

  const handleSave = () => {
    const rentalRates = form.rentalRates
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [days, rate] = s.split(':')
        return { days: Number(days), rate: Number(rate) }
      })
      .filter((r) => r.days > 0 && r.rate > 0)

    const payload = {
      ...form,
      dailyRate: Number(form.dailyRate) || 0,
      securityDeposit: Number(form.securityDeposit) || 0,
      turnaroundHours: Number(form.turnaroundHours) || 24,
      rentalQuantity: Number(form.rentalQuantity) || 1,
      rentalRates,
    }
    saveMutation.mutate(payload)
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/boutique/products/${id}`).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boutique-products'] }),
  })

  // Image upload
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/boutique/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
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
    mutationFn: () => api.post('/boutique/seed-demo').then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['boutique-products'] }),
  })

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shirt className="w-6 h-6 text-rose-500" />
            {label('Dresses', 'الفساتين')}
          </h1>
          <p className="text-gray-500 mt-1">
            {label('Manage boutique inventory and rental items', 'إدارة مخزون البوتيك وفساتين الإيجار')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={label('Search dresses...', 'ابحثي عن فستان...')}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm w-56 focus:ring-2 focus:ring-rose-200 outline-none"
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
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            {label('Add Dress', 'إضافة فستان')}
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">{label('Loading...', 'جاري التحميل...')}</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Sparkles className="w-12 h-12 mb-3 opacity-30" />
          <p>{label('No dresses found. Add your first dress!', 'لا يوجد فساتين. أضيفي أول فستان!')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <motion.div
              key={p._id}
              layout
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                {p.primaryImage ? (
                  <img src={p.primaryImage} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Shirt className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => openEdit(p)}
                    className="bg-white/90 backdrop-blur p-1.5 rounded-lg shadow-sm hover:bg-white text-gray-600"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(p._id)}
                    className="bg-white/90 backdrop-blur p-1.5 rounded-lg shadow-sm hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {p.mode === 'FOR_RENT' && (
                  <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
                    {label('RENTAL', 'إيجار')}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm truncate">{p.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{p.sku}</p>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-gray-500">{p.category}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.size}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-rose-600 font-bold">
                    {p.dailyRate > 0 ? `SAR ${p.dailyRate}/day` : label('Tiered pricing', 'أسعار متدرجة')}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {label('Deposit', 'تأمين')}: <Money value={p.securityDeposit || 0} />
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-none">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  {editingId ? label('Edit Dress', 'تعديل فستان') : label('Add New Dress', 'إضافة فستان جديد')}
                </h3>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">{label('Dress Image', 'صورة الفستان')}</label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-20 h-20 rounded-xl border border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-rose-300 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-300" />
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
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploading ? label('Uploading...', 'جاري الرفع...') : label('Upload Image', 'رفع صورة')}
                      </button>
                      <p className="text-[10px] text-gray-400 mt-1">{label('JPG, PNG, WebP up to 5MB', 'JPG أو PNG أو WebP حتى 5 ميجا')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">{label('Name (EN)', 'الاسم (إنجليزي)')} *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">{label('Name (AR)', 'الاسم (عربي)')}</label>
                    <input
                      value={form.nameAr}
                      onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none text-right"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('SKU', 'الرمز')} *</label>
                    <input
                      value={form.sku}
                      onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder="DRES-001"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('Category', 'الفئة')}</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder={label('Evening', 'سهرة')}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('Size', 'المقاس')}</label>
                    <input
                      value={form.size}
                      onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder="M / 38"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('Color', 'اللون')}</label>
                    <input
                      value={form.color}
                      onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder={label('Red', 'أحمر')}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('Daily Rate (SAR)', 'السعر اليومي')}</label>
                    <input
                      type="number"
                      value={form.dailyRate}
                      onChange={(e) => setForm((f) => ({ ...f, dailyRate: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder="150"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('Security Deposit', 'التأمين')}</label>
                    <input
                      type="number"
                      value={form.securityDeposit}
                      onChange={(e) => setForm((f) => ({ ...f, securityDeposit: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('Turnaround (hrs)', 'فترة التجهيز')}</label>
                    <input
                      type="number"
                      value={form.turnaroundHours}
                      onChange={(e) => setForm((f) => ({ ...f, turnaroundHours: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">{label('Quantity', 'الكمية')}</label>
                    <input
                      type="number"
                      value={form.rentalQuantity}
                      onChange={(e) => setForm((f) => ({ ...f, rentalQuantity: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">
                      {label('Rental Rates (days:rate, days:rate)', 'أسعار الإيجار (أيام:سعر، أيام:سعر)')}
                    </label>
                    <input
                      value={form.rentalRates}
                      onChange={(e) => setForm((f) => ({ ...f, rentalRates: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none"
                      placeholder="3:400, 7:800"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">{label('Description', 'الوصف')}</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-rose-200 outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 flex gap-3 flex-none">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {label('Cancel', 'إلغاء')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || !form.name || !form.sku}
                  className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {saveMutation.isPending
                    ? label('Saving...', 'جاري الحفظ...')
                    : editingId
                    ? label('Update', 'تحديث')
                    : label('Save Dress', 'حفظ الفستان')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
