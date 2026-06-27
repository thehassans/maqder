import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Tag, Calendar, Trash2, Edit3, X, Loader2, Zap, Gift,
  Package, Clock, Percent, TrendingUp, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const TYPE_CONFIG = {
  bogo: { label: 'Buy X Get Y Free', icon: Gift, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  bundle: { label: 'Bundle Deal', icon: Package, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  flash_sale: { label: 'Flash Sale', icon: Zap, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  category_discount: { label: 'Category Discount', icon: Percent, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  happy_hour: { label: 'Happy Hour', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  product_discount: { label: 'Product Discount', icon: Tag, color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' },
}

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
}

function getStatus(promo) {
  const now = new Date()
  if (now < new Date(promo.startDate)) return 'scheduled'
  if (now > new Date(promo.endDate)) return 'expired'
  if (!promo.isActive) return 'expired'
  return 'active'
}

function PromoModal({ promo, onClose }) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(promo?._id)
  const [form, setForm] = useState({
    name: promo?.name || '',
    nameAr: promo?.nameAr || '',
    description: promo?.description || '',
    type: promo?.type || 'flash_sale',
    startDate: promo?.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    endDate: promo?.endDate?.split('T')[0] || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    priority: promo?.priority || 0,
    isActive: promo?.isActive ?? true,
    rules: {
      buyQty: promo?.rules?.buyQty || 1,
      getQtyFree: promo?.rules?.getQtyFree || 1,
      discountPercent: promo?.rules?.discountPercent || 10,
      bundlePrice: promo?.rules?.bundlePrice || 0,
      applicableCategory: promo?.rules?.applicableCategory || '',
      startTime: promo?.rules?.startTime || '14:00',
      endTime: promo?.rules?.endTime || '17:00',
      applicableDays: promo?.rules?.applicableDays || [0, 1, 2, 3, 4, 5, 6],
      minPurchaseAmount: promo?.rules?.minPurchaseAmount || 0,
    },
  })

  const saveMutation = useMutation({
    mutationFn: (data) => isEdit
      ? api.put(`/bakala/promotions/${promo._id}`, data)
      : api.post('/bakala/promotions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success(isEdit ? 'Promotion updated' : 'Promotion created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.name) return toast.error('Name is required')
    saveMutation.mutate(form)
  }

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{isEdit ? 'Edit Promotion' : 'New Promotion'}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="Summer Sale" />
              </div>
              <div>
                <label className="label">Name (Arabic)</label>
                <input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} className="input" placeholder="تخفيضات الصيف" dir="rtl" />
              </div>
            </div>

            <div>
              <label className="label">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="select">
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Start Date</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
              </div>
            </div>

            {/* Type-specific rules */}
            {(form.type === 'bogo') && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Buy Quantity</label>
                  <input type="number" value={form.rules.buyQty} onChange={(e) => setForm({ ...form, rules: { ...form.rules, buyQty: Number(e.target.value) } })} className="input" min={1} />
                </div>
                <div>
                  <label className="label">Get Free</label>
                  <input type="number" value={form.rules.getQtyFree} onChange={(e) => setForm({ ...form, rules: { ...form.rules, getQtyFree: Number(e.target.value) } })} className="input" min={1} />
                </div>
              </div>
            )}

            {(form.type === 'flash_sale' || form.type === 'product_discount' || form.type === 'category_discount' || form.type === 'happy_hour') && (
              <div>
                <label className="label">Discount %</label>
                <input type="number" value={form.rules.discountPercent} onChange={(e) => setForm({ ...form, rules: { ...form.rules, discountPercent: Number(e.target.value) } })} className="input" min={0} max={100} />
              </div>
            )}

            {(form.type === 'category_discount' || form.type === 'bogo') && (
              <div>
                <label className="label">Applicable Category</label>
                <input value={form.rules.applicableCategory} onChange={(e) => setForm({ ...form, rules: { ...form.rules, applicableCategory: e.target.value } })} className="input" placeholder="e.g. Beverages" />
              </div>
            )}

            {form.type === 'bundle' && (
              <div>
                <label className="label">Bundle Price (SAR)</label>
                <input type="number" value={form.rules.bundlePrice} onChange={(e) => setForm({ ...form, rules: { ...form.rules, bundlePrice: Number(e.target.value) } })} className="input" min={0} />
              </div>
            )}

            {form.type === 'happy_hour' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" value={form.rules.startTime} onChange={(e) => setForm({ ...form, rules: { ...form.rules, startTime: e.target.value } })} className="input" />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" value={form.rules.endTime} onChange={(e) => setForm({ ...form, rules: { ...form.rules, endTime: e.target.value } })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Active Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const days = form.rules.applicableDays.includes(i)
                            ? form.rules.applicableDays.filter(x => x !== i)
                            : [...form.rules.applicableDays, i]
                          setForm({ ...form, rules: { ...form.rules, applicableDays: days } })
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium ${
                          form.rules.applicableDays.includes(i)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-dark-700 text-gray-500'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={saveMutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function Promotions() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('active')
  const [showModal, setShowModal] = useState(false)
  const [editPromo, setEditPromo] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['promotions', statusFilter],
    queryFn: () => api.get('/bakala/promotions', { params: { status: statusFilter, limit: 100 } }).then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/bakala/promotions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] })
      toast.success('Promotion deleted')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const promos = data?.promotions || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'العروض والتسعير' : 'Promotions & Pricing'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة العروض والخصومات' : 'Manage promotions, flash sales, and discounts'}
          </p>
        </div>
        <button onClick={() => { setEditPromo(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'عرض جديد' : 'New Promotion'}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2">
        {['active', 'scheduled', 'expired'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-dark-600'
            }`}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Promotions Grid */}
      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
      ) : promos.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Tag className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>No {statusFilter} promotions</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((promo, i) => {
            const typeCfg = TYPE_CONFIG[promo.type] || TYPE_CONFIG.flash_sale
            const status = getStatus(promo)
            const statusCfg = STATUS_CONFIG[status]
            const Icon = typeCfg.icon
            return (
              <motion.div
                key={promo._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${typeCfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{promo.name}</p>
                      <p className="text-xs text-gray-400">{typeCfg.label}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                </div>

                {promo.description && <p className="text-xs text-gray-500 dark:text-gray-400">{promo.description}</p>}

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(promo.startDate).toLocaleDateString()} → {new Date(promo.endDate).toLocaleDateString()}
                </div>

                {promo.rules.discountPercent > 0 && (
                  <div className="flex items-center gap-1 text-xs">
                    <Percent className="w-3 h-3 text-primary-500" />
                    <span className="font-semibold text-primary-600 dark:text-primary-400">{promo.rules.discountPercent}% off</span>
                  </div>
                )}
                {promo.type === 'bogo' && (
                  <div className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    Buy {promo.rules.buyQty} Get {promo.rules.getQtyFree} Free
                  </div>
                )}
                {promo.type === 'happy_hour' && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <Clock className="w-3 h-3" /> {promo.rules.startTime} - {promo.rules.endTime}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-dark-700">
                  <span className="text-xs text-gray-400">{promo.usageCount || 0} uses</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditPromo(promo); setShowModal(true) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this promotion?')) deleteMutation.mutate(promo._id) }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {showModal && <PromoModal promo={editPromo} onClose={() => { setShowModal(false); setEditPromo(null) }} />}
    </div>
  )
}
