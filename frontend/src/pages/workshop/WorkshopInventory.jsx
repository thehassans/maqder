import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Search, AlertTriangle, X, Save, Trash2, Package
} from 'lucide-react'
import api from '../../lib/api'

function initForm() {
  return {
    sku: '', name: '', nameAr: '', description: '',
    category: '', subCategory: '',
    compatibleMakes: '', compatibleModels: '',
    oemPartNumbers: '', aftermarketPartNumbers: '',
    quantityOnHand: 0, reorderLevel: 5, reorderQuantity: 10,
    costPrice: 0, sellingPrice: 0, markupPercent: 20,
    supplierPartNumber: '', leadTimeDays: 1,
    warehouseLocation: '', binNumber: '',
  }
}

export default function WorkshopInventory() {
  const { language } = useSelector((state) => state.ui)
  const t = (en, ar) => language === 'ar' ? ar : en
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initForm())

  const { data: items = [] } = useQuery({
    queryKey: ['workshop-inventory', search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (categoryFilter) params.append('category', categoryFilter)
      const res = await api.get(`/workshop/inventory?${params}`)
      return res.data
    },
  })

  const categories = [...new Set(items.map(i => i.category).filter(Boolean))]

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/workshop/inventory/${id}`),
    onSuccess: () => { toast.success(t('Deleted', 'تم الحذف')); qc.invalidateQueries({ queryKey: ['workshop-inventory'] }) },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل')),
  })

  const openModal = (item) => {
    if (item) {
      setEditing(item)
      setForm({
        ...initForm(), ...item,
        compatibleMakes: (item.compatibleMakes || []).join(', '),
        compatibleModels: (item.compatibleModels || []).join(', '),
        oemPartNumbers: (item.oemPartNumbers || []).join(', '),
        aftermarketPartNumbers: (item.aftermarketPartNumbers || []).join(', '),
      })
    } else { setEditing(null); setForm(initForm()) }
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(initForm()) }

  const saveMut = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        compatibleMakes: form.compatibleMakes.split(',').map(s => s.trim()).filter(Boolean),
        compatibleModels: form.compatibleModels.split(',').map(s => s.trim()).filter(Boolean),
        oemPartNumbers: form.oemPartNumbers.split(',').map(s => s.trim()).filter(Boolean),
        aftermarketPartNumbers: form.aftermarketPartNumbers.split(',').map(s => s.trim()).filter(Boolean),
      }
      return editing
        ? api.put(`/workshop/inventory/${editing._id}`, payload)
        : api.post('/workshop/inventory', payload)
    },
    onSuccess: () => { toast.success(editing ? t('Updated', 'تم التحديث') : t('Created', 'تم الإنشاء')); qc.invalidateQueries({ queryKey: ['workshop-inventory'] }); closeModal() },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل')),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Spare Parts Inventory', 'مخزون قطع الغيار')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Track oils, filters, brake pads, and workshop hardware', 'تتبع الزيوت والفلاتر وفرامل السيارات ومستلزمات الورشة')}</p>
        </div>
        <button onClick={() => openModal(null)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('Add Part', 'إضافة قطعة')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search SKU, part number, or name...', 'البحث بـ SKU أو رقم القطعة أو الاسم...')}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
          <option value="">{t('All Categories', 'جميع الفئات')}</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('SKU', 'SKU')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Name', 'الاسم')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Category', 'الفئة')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Stock', 'المخزون')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Reorder Level', 'حد إعادة الطلب')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Cost', 'التكلفة')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Price', 'السعر')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {items.map(item => {
                const isLow = item.quantityOnHand <= item.reorderLevel
                return (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{item.sku}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{item.category || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'bg-green-50 text-green-600 dark:bg-green-900/20'}`}>
                        {isLow && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                        {item.quantityOnHand}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{item.reorderLevel}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{item.costPrice?.toFixed?.(2) ?? '0.00'}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{item.sellingPrice?.toFixed?.(2) ?? '0.00'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openModal(item)} className="text-primary-600 hover:underline text-xs font-medium mr-3">{t('Edit', 'تعديل')}</button>
                      <button onClick={() => { if (window.confirm(t('Delete part?', 'حذف القطعة؟'))) deleteMut.mutate(item._id) }} className="text-red-600 hover:underline text-xs font-medium">{t('Delete', 'حذف')}</button>
                    </td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">{t('No inventory items yet', 'لا توجد عناصر في المخزون بعد')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? t('Edit Part', 'تعديل قطعة') : t('Add Part', 'إضافة قطعة')}</h3>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-500">{t('SKU', 'SKU')} *</label><input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Name', 'الاسم')} *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Name (AR)', 'الاسم (عربي)')}</label><input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Category', 'الفئة')}</label><input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder={t('e.g. Brakes, Engine', 'مثال: فرامل، محرك')} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Sub-Category', 'الفئة الفرعية')}</label><input value={form.subCategory} onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Supplier Part Number', 'رقم القطعة لدى المورد')}</label><input value={form.supplierPartNumber} onChange={e => setForm(f => ({ ...f, supplierPartNumber: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Quantity on Hand', 'الكمية المتاحة')}</label><input type="number" value={form.quantityOnHand} onChange={e => setForm(f => ({ ...f, quantityOnHand: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Reorder Level', 'حد إعادة الطلب')}</label><input type="number" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Cost Price', 'سعر التكلفة')}</label><input type="number" value={form.costPrice} onChange={e => setForm(f => ({ ...f, costPrice: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Selling Price', 'سعر البيع')}</label><input type="number" value={form.sellingPrice} onChange={e => setForm(f => ({ ...f, sellingPrice: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div className="sm:col-span-2"><label className="text-xs font-medium text-gray-500">{t('Compatible Makes (comma-separated)', 'الشركات المتوافقة (مفصولة بفاصلة)')}</label><input value={form.compatibleMakes} onChange={e => setForm(f => ({ ...f, compatibleMakes: e.target.value }))} placeholder={t('Toyota, Honda, Nissan', 'تويوتا، هوندا، نيسان')} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div className="sm:col-span-2"><label className="text-xs font-medium text-gray-500">{t('Compatible Models (comma-separated)', 'الموديلات المتوافقة (مفصولة بفاصلة)')}</label><input value={form.compatibleModels} onChange={e => setForm(f => ({ ...f, compatibleModels: e.target.value }))} placeholder={t('Camry, Corolla, Accord', 'كامري، كورولا، أكورد')} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                </div>
                <div><label className="text-xs font-medium text-gray-500">{t('Description', 'الوصف')}</label><textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-dark-700">
                <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">{t('Cancel', 'إلغاء')}</button>
                <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saveMut.isPending ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
