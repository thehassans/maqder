import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, Clock, CalendarClock, PackageX, Trash2, Tag,
  TrendingDown, ChevronRight, X, Loader2, FileText, Gift, RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const URGENCY_CONFIG = {
  expired: { label: 'Expired', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700', icon: PackageX, barColor: 'bg-red-500' },
  expiring7: { label: '7 Days', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700', icon: AlertTriangle, barColor: 'bg-orange-500' },
  expiring14: { label: '14 Days', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700', icon: Clock, barColor: 'bg-amber-500' },
  expiring30: { label: '30 Days', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700', icon: CalendarClock, barColor: 'bg-blue-500' },
}

const REASONS = [
  { value: 'expired', label: 'Expired' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'spoiled', label: 'Spoiled' },
  { value: 'recalled', label: 'Recalled' },
  { value: 'quality_rejection', label: 'Quality Rejection' },
  { value: 'other', label: 'Other' },
]

const ACTIONS = [
  { value: 'disposed', label: 'Disposed' },
  { value: 'donated', label: 'Donated' },
  { value: 'returned_to_supplier', label: 'Returned to Supplier' },
  { value: 'discounted', label: 'Apply Discount' },
  { value: 'written_off', label: 'Written Off' },
]

function StatCard({ icon: Icon, label, value, sublabel, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </motion.div>
  )
}

function WasteModal({ product, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    quantity: product?.stockQuantity || 1,
    reason: product?.daysOverdue != null ? 'expired' : 'spoiled',
    reasonDetail: '',
    action: 'disposed',
    discountPercent: 0,
    notes: '',
  })

  const wasteMutation = useMutation({
    mutationFn: (data) => api.post('/bakala/expiry-waste/waste', {
      ...data,
      productId: product._id,
      batchNumber: product.batchNumber,
      expiryDate: product.expiryDate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expiry-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['waste-stats'] })
      queryClient.invalidateQueries({ queryKey: ['waste-entries'] })
      toast.success('Waste recorded & stock adjusted')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.quantity || form.quantity <= 0) return toast.error('Enter valid quantity')
    wasteMutation.mutate(form)
  }

  const wasteValue = (Number(product?.costPrice) || 0) * (Number(form.quantity) || 0)

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Record Waste</h3>
              <p className="text-xs text-gray-500">{product?.name}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50">
                <p className="text-xs text-gray-400">In Stock</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{product?.stockQuantity} {product?.unit}</p>
              </div>
              <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50">
                <p className="text-xs text-gray-400">Cost Price</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{(product?.costPrice || 0).toFixed(2)} SAR</p>
              </div>
            </div>

            {product?.expiryDate && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {product.daysOverdue != null
                    ? `Expired ${product.daysOverdue} days ago`
                    : `Expires in ${product.daysLeft} days`}
                </p>
              </div>
            )}

            <div>
              <label className="label">Quantity to Remove</label>
              <input
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                className="input"
                max={product?.stockQuantity}
                min={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Reason</label>
                <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="select">
                  {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Action</label>
                <select value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} className="select">
                  {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>

            {form.action === 'discounted' && (
              <div>
                <label className="label">Discount %</label>
                <input
                  type="number"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) })}
                  className="input"
                  min={0}
                  max={100}
                  placeholder="e.g. 30"
                />
              </div>
            )}

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
            </div>

            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-between">
              <span className="text-sm text-red-600 dark:text-red-400">Waste Value (cost)</span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400">{wasteValue.toFixed(2)} SAR</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={wasteMutation.isPending} className="btn btn-danger flex items-center gap-1.5">
              {wasteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Record Waste
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function ExpiryWasteManagement() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [wasteProduct, setWasteProduct] = useState(null)
  const [wastePage, setWastePage] = useState(1)

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['expiry-dashboard'],
    queryFn: () => api.get('/bakala/expiry-waste/expiry-dashboard').then(res => res.data),
    enabled: activeTab === 'dashboard',
  })

  const { data: wasteStats } = useQuery({
    queryKey: ['waste-stats'],
    queryFn: () => api.get('/bakala/expiry-waste/waste/stats').then(res => res.data),
    enabled: activeTab === 'waste',
  })

  const { data: wasteData, isLoading: wasteLoading } = useQuery({
    queryKey: ['waste-entries', wastePage],
    queryFn: () => api.get('/bakala/expiry-waste/waste', { params: { page: wastePage, limit: 20 } }).then(res => res.data),
    enabled: activeTab === 'waste',
  })

  const deleteWasteMutation = useMutation({
    mutationFn: (id) => api.delete(`/bakala/expiry-waste/waste/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waste-entries'] })
      queryClient.invalidateQueries({ queryKey: ['waste-stats'] })
      queryClient.invalidateQueries({ queryKey: ['expiry-dashboard'] })
      toast.success('Waste entry deleted, stock restored')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const summary = dashData?.summary || {}
  const wasteEntries = wasteData?.entries || []
  const wasteTotals = wasteStats?.totals?.[0] || {}

  function ProductRow({ product, urgency }) {
    const config = URGENCY_CONFIG[urgency]
    return (
      <motion.tr
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${config.color}`}>
              {product.daysOverdue != null ? `${product.daysOverdue}d overdue` : `${product.daysLeft}d left`}
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
          <p className="text-xs text-gray-400">{product.primaryBarcode} · {product.category || '—'}</p>
        </td>
        <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{product.stockQuantity} {product.unit}</td>
        <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{(product.costPrice || 0).toFixed(2)}</td>
        <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">
          {((product.costPrice || 0) * product.stockQuantity).toFixed(2)}
        </td>
        <td className="px-4 py-3 text-right">
          {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : '—'}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={() => setWasteProduct(product)}
            className="btn btn-danger btn-sm flex items-center gap-1 ml-auto"
          >
            <Trash2 className="w-3 h-3" /> Record
          </button>
        </td>
      </motion.tr>
    )
  }

  function ProductTable({ products, urgency, emptyMsg }) {
    if (!products?.length) {
      return (
        <div className="p-8 text-center text-gray-400">
          <PackageX className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">{emptyMsg}</p>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Urgency</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value at Risk</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expiry</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
            {products.map(p => <ProductRow key={p._id} product={p} urgency={urgency} />)}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'إدارة الانتهاء والهدر' : 'Expiry & Waste Management'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' ? 'تتبع المنتجات منتهية الصلاحية والهدر' : 'Track near-expiry products and record waste'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'dashboard'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {language === 'ar' ? 'لوحة الانتهاء' : 'Expiry Dashboard'}
        </button>
        <button
          onClick={() => setActiveTab('waste')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'waste'
              ? 'border-primary-500 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {language === 'ar' ? 'سجل الهدر' : 'Waste Log'}
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={PackageX} label={language === 'ar' ? 'منتهي الصلاحية' : 'Expired'} value={summary.expired || 0} sublabel={`${(summary.expiredValue || 0).toFixed(0)} SAR at risk`} color="from-red-500 to-red-600" delay={0} />
            <StatCard icon={AlertTriangle} label={language === 'ar' ? 'خلال ٧ أيام' : '7 Days'} value={summary.expiring7 || 0} color="from-orange-500 to-orange-600" delay={0.05} />
            <StatCard icon={Clock} label={language === 'ar' ? 'خلال ١٤ يوم' : '14 Days'} value={summary.expiring14 || 0} color="from-amber-500 to-amber-600" delay={0.1} />
            <StatCard icon={CalendarClock} label={language === 'ar' ? 'خلال ٣٠ يوم' : '30 Days'} value={summary.expiring30 || 0} sublabel={`${(summary.totalValueAtRisk || 0).toFixed(0)} SAR total at risk`} color="from-blue-500 to-blue-600" delay={0.15} />
          </div>

          {dashLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Expired */}
              {dashData?.expired?.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-dark-700">
                    <PackageX className="w-4 h-4 text-red-500" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {language === 'ar' ? 'منتهي الصلاحية' : 'Expired Products'} ({dashData.expired.length})
                    </h3>
                  </div>
                  <ProductTable products={dashData.expired} urgency="expired" emptyMsg="No expired products" />
                </div>
              )}

              {/* Expiring 7 days */}
              {dashData?.expiring7?.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-dark-700">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {language === 'ar' ? 'خلال ٧ أيام' : 'Expiring in 7 Days'} ({dashData.expiring7.length})
                    </h3>
                  </div>
                  <ProductTable products={dashData.expiring7} urgency="expiring7" emptyMsg="No products expiring soon" />
                </div>
              )}

              {/* Expiring 14 days */}
              {dashData?.expiring14?.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-dark-700">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {language === 'ar' ? 'خلال ١٤ يوم' : 'Expiring in 14 Days'} ({dashData.expiring14.length})
                    </h3>
                  </div>
                  <ProductTable products={dashData.expiring14} urgency="expiring14" emptyMsg="No products expiring in 14 days" />
                </div>
              )}

              {/* Expiring 30 days */}
              {dashData?.expiring30?.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-dark-700">
                    <CalendarClock className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {language === 'ar' ? 'خلال ٣٠ يوم' : 'Expiring in 30 Days'} ({dashData.expiring30.length})
                    </h3>
                  </div>
                  <ProductTable products={dashData.expiring30} urgency="expiring30" emptyMsg="No products expiring in 30 days" />
                </div>
              )}

              {!dashData?.expired?.length && !dashData?.expiring7?.length && !dashData?.expiring14?.length && !dashData?.expiring30?.length && (
                <div className="card p-12 text-center text-gray-400">
                  <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No expiry concerns. All products are within safe date range.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'waste' && (
        <>
          {/* Waste Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={FileText} label={language === 'ar' ? 'إجمالي السجلات' : 'Total Entries'} value={wasteTotals.totalEntries || 0} color="from-gray-500 to-gray-600" delay={0} />
            <StatCard icon={TrendingDown} label={language === 'ar' ? 'إجمالي الكمية' : 'Total Quantity'} value={wasteTotals.totalQuantity || 0} color="from-orange-500 to-orange-600" delay={0.05} />
            <StatCard icon={PackageX} label={language === 'ar' ? 'إجمالي قيمة الهدر' : 'Total Waste Value'} value={`${(wasteTotals.totalWasteValue || 0).toFixed(0)} SAR`} color="from-red-500 to-red-600" delay={0.1} />
            <StatCard icon={Tag} label={language === 'ar' ? 'حسب السبب' : 'By Reason'} value={(wasteStats?.byReason || []).length} color="from-amber-500 to-amber-600" delay={0.15} />
          </div>

          {/* By Reason Breakdown */}
          {wasteStats?.byReason?.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {language === 'ar' ? 'الهدر حسب السبب' : 'Waste by Reason'}
              </h3>
              <div className="space-y-2">
                {wasteStats.byReason.map((r, i) => {
                  const max = wasteStats.byReason[0]?.value || 1
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-32 capitalize">{r._id.replace(/_/g, ' ')}</span>
                      <div className="flex-1 h-6 rounded-full bg-gray-100 dark:bg-dark-900/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-500 transition-all"
                          style={{ width: `${(r.value / max) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-20 text-right">{r.value.toFixed(0)} SAR</span>
                      <span className="text-xs text-gray-400 w-8 text-right">{r.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Waste Log Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {language === 'ar' ? 'سجل الهدر' : 'Waste Log'}
              </h3>
            </div>
            {wasteLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
              </div>
            ) : wasteEntries.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No waste entries recorded</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {wasteEntries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.productName}</p>
                          <p className="text-xs text-gray-400">{entry.primaryBarcode}</p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{entry.quantity} {entry.unit}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 capitalize">
                            {entry.reason.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 capitalize">{entry.action.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-red-600 dark:text-red-400">{entry.wasteValue?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{new Date(entry.recordedAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (confirm('Delete this entry? Stock will be restored.')) {
                                deleteWasteMutation.mutate(entry._id)
                              }
                            }}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete & restore stock"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {wasteData?.pagination?.pages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-dark-700">
                <span className="text-xs text-gray-400">Page {wasteData.pagination.page} of {wasteData.pagination.pages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setWastePage(p => Math.max(1, p - 1))} disabled={wastePage === 1} className="btn btn-secondary btn-sm disabled:opacity-50">Prev</button>
                  <button onClick={() => setWastePage(p => p + 1)} disabled={wastePage >= wasteData.pagination.pages} className="btn btn-secondary btn-sm disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {wasteProduct && (
        <WasteModal product={wasteProduct} onClose={() => setWasteProduct(null)} />
      )}
    </div>
  )
}
