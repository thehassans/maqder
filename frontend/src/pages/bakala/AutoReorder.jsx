import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  ShoppingCart, AlertTriangle, PackageX, Loader2, TrendingUp,
  Clock, DollarSign, Zap, RefreshCw, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const URGENCY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300', icon: PackageX },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300', icon: Clock },
}

function StatCard({ icon: Icon, label, value, sublabel, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
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

export default function AutoReorder() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [selectedSupplier, setSelectedSupplier] = useState('')
  const [selectedItems, setSelectedItems] = useState(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['reorder-dashboard'],
    queryFn: () => api.get('/bakala/reorder/dashboard').then(res => res.data),
  })

  const createPOMutation = useMutation({
    mutationFn: (payload) => api.post('/purchase-orders', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reorder-dashboard'] })
      toast.success('Purchase order created')
      setSelectedItems(new Set())
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to create PO'),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    )
  }

  const summary = data?.summary || {}
  const reorderItems = data?.reorderItems || []
  const suppliers = data?.suppliers || []

  const toggleItem = (id) => {
    const next = new Set(selectedItems)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedItems(next)
  }

  const toggleAll = () => {
    if (selectedItems.size === reorderItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(reorderItems.map(i => i._id)))
    }
  }

  const handleCreatePO = () => {
    const items = reorderItems.filter(i => selectedItems.has(i._id))
    if (!items.length) return toast.error('Select items to reorder')
    if (!selectedSupplier) return toast.error('Select a supplier')

    const poData = {
      supplierId: selectedSupplier,
      expectedDeliveryDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: 'Auto-generated from reorder dashboard',
      lineItems: items.map((item, idx) => ({
        lineNumber: idx + 1,
        productId: item._id,
        productName: item.name,
        quantity: item.suggestedReorderQty,
        unitCost: item.costPrice,
        taxRate: 15,
        lineTotal: Math.round(item.suggestedReorderQty * item.costPrice * 100) / 100,
      })),
    }

    createPOMutation.mutate(poData)
  }

  const selectedItemsData = reorderItems.filter(i => selectedItems.has(i._id))
  const selectedTotal = selectedItemsData.reduce((s, i) => s + i.reorderValue, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'إعادة الطلب التلقائي' : 'Auto-Reorder & Restocking'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'منتجات تحتاج إعادة طلب بناءً على المبيعات' : 'Products needing reorder based on sales velocity'}
          </p>
        </div>
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['reorder-dashboard'] })}
          className="btn btn-secondary flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label={language === 'ar' ? 'تحتاج إعادة طلب' : 'Need Reorder'} value={summary.needsReorder || 0} sublabel={`of ${summary.totalProducts || 0} products`} color="from-orange-500 to-orange-600" delay={0} />
        <StatCard icon={PackageX} label={language === 'ar' ? 'حرج (نفد)' : 'Critical (Out)'} value={summary.criticalCount || 0} color="from-red-500 to-red-600" delay={0.05} />
        <StatCard icon={DollarSign} label={language === 'ar' ? 'قيمة إعادة الطلب' : 'Reorder Value'} value={`${(summary.totalReorderValue || 0).toLocaleString()} SAR`} color="from-blue-500 to-blue-600" delay={0.1} />
        <StatCard icon={TrendingUp} label={language === 'ar' ? 'محدد' : 'Selected'} value={selectedItems.size} sublabel={`${selectedTotal.toFixed(0)} SAR`} color="from-violet-500 to-violet-600" delay={0.15} />
      </div>

      {/* Action Bar */}
      {reorderItems.length > 0 && (
        <div className="card p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-1">
            <button onClick={toggleAll} className="btn btn-secondary btn-sm">
              {selectedItems.size === reorderItems.length ? 'Deselect All' : 'Select All'}
            </button>
            <span className="text-sm text-gray-500">{selectedItems.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="select w-auto">
              <option value="">Select supplier...</option>
              {suppliers.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            <button
              onClick={handleCreatePO}
              disabled={!selectedItems.size || !selectedSupplier || createPOMutation.isPending}
              className="btn btn-action-dark flex items-center gap-1.5 disabled:opacity-50"
            >
              {createPOMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              Create PO
            </button>
          </div>
        </div>
      )}

      {/* Reorder Table */}
      <div className="card overflow-hidden">
        {reorderItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Check className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-50" />
            <p>All products are well-stocked. No reorders needed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === reorderItems.length && reorderItems.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Alert Level</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sales (30d)</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Velocity/day</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Days Left</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Urgency</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Suggested Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reorder Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {reorderItems.map((item) => {
                  const uCfg = URGENCY_CONFIG[item.urgency] || URGENCY_CONFIG.medium
                  const UIcon = uCfg.icon
                  return (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`hover:bg-gray-50 dark:hover:bg-dark-800 ${selectedItems.has(item._id) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item._id)}
                          onChange={() => toggleItem(item._id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.primaryBarcode} · {item.category || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">
                        {item.stockQuantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">{item.minimumStockAlertLevel}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{item.salesQty30d}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-500">{item.dailyVelocity}</td>
                      <td className="px-4 py-3 text-right text-sm">
                        {item.daysOfStock === null ? (
                          <span className="text-gray-400">—</span>
                        ) : item.daysOfStock <= 3 ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">{item.daysOfStock}d</span>
                        ) : (
                          <span className="text-gray-500">{item.daysOfStock}d</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${uCfg.color}`}>
                          <UIcon className="w-3 h-3" /> {uCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{item.suggestedReorderQty}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        {item.reorderValue.toLocaleString()} SAR
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
