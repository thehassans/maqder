import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Loader2, Bike, Store, CheckCircle, XCircle,
  Clock, Package, DollarSign, TrendingUp, RefreshCw,
  Settings, Zap, AlertTriangle, ExternalLink, Truck,
  MapPin, Phone, User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import Money from '../../components/ui/Money'

const PLATFORMS = [
  { id: 'jahez', name: 'Jahez', color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20', url: 'jahez.net' },
  { id: 'hungerstation', name: 'HungerStation', color: 'bg-pink-500', textColor: 'text-pink-600', bgColor: 'bg-pink-50 dark:bg-pink-900/20', url: 'hungerstation.com' },
  { id: 'ninja', name: 'Ninja', color: 'bg-violet-500', textColor: 'text-violet-600', bgColor: 'bg-violet-50 dark:bg-violet-900/20', url: 'ninja.com.sa' },
  { id: 'keeta', name: 'Keeta', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', url: 'keeta.com' },
  { id: 'mrsool', name: 'Mrsool', color: 'bg-blue-500', textColor: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-900/20', url: 'mrsool.com' },
  { id: 'jumlaty', name: 'Jumlaty', color: 'bg-amber-500', textColor: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-900/20', url: 'jumlaty.com' },
  { id: 'direct', name: 'Direct Delivery', color: 'bg-gray-500', textColor: 'text-gray-600', bgColor: 'bg-gray-50 dark:bg-gray-900/20', url: 'in-house' },
]

const STATUS_CONFIG = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', border: 'border-l-amber-500' },
  accepted: { label: 'Accepted', icon: CheckCircle, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-l-blue-500' },
  preparing: { label: 'Preparing', icon: Package, color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', border: 'border-l-violet-500' },
  ready: { label: 'Ready', icon: CheckCircle, color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', border: 'border-l-cyan-500' },
  picked_up: { label: 'Picked Up', icon: Truck, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', border: 'border-l-indigo-500' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', border: 'border-l-emerald-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-l-red-500' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-l-red-500' },
}

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'platforms', label: 'Platforms', icon: Store },
  { id: 'payouts', label: 'Payouts', icon: DollarSign },
]

function PlatformModal({ onClose, editConfig }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    platform: editConfig?.platform || 'jahez',
    displayName: editConfig?.displayName || '',
    credentials: {
      apiKey: editConfig?.credentials?.apiKey || '',
      apiSecret: editConfig?.credentials?.apiSecret || '',
      merchantId: editConfig?.credentials?.merchantId || '',
      branchId: editConfig?.credentials?.branchId || '',
      webhookSecret: editConfig?.credentials?.webhookSecret || '',
    },
    autoAcceptOrders: editConfig?.autoAcceptOrders || false,
    autoSyncMenu: editConfig?.autoSyncMenu || false,
    commissionPercent: editConfig?.commissionPercent || 0,
    commissionFixed: editConfig?.commissionFixed || 0,
    deliveryFeeChargedTo: editConfig?.deliveryFeeChargedTo || 'customer',
  })

  const mutation = useMutation({
    mutationFn: (data) => editConfig
      ? api.put(`/restaurant/delivery/platforms/${editConfig._id}`, data)
      : api.post('/restaurant/delivery/platforms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-platforms'] })
      queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
      toast.success(editConfig ? 'Platform updated' : 'Platform connected')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    mutation.mutate({
      ...form,
      commissionPercent: Number(form.commissionPercent) || 0,
      commissionFixed: Number(form.commissionFixed) || 0,
    })
  }

  const selectedPlatform = PLATFORMS.find(p => p.id === form.platform)

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-800 z-10">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {editConfig ? 'Edit Platform' : 'Connect Platform'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-6 space-y-4">
            {!editConfig && (
              <div>
                <label className="label">Platform *</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.id} onClick={() => setForm({ ...form, platform: p.id })}
                      className={`p-3 rounded-xl border-2 text-sm font-medium flex items-center gap-2 ${form.platform === p.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}>
                      <span className={`w-3 h-3 rounded-full ${p.color}`} />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Display Name</label>
              <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} className="input" placeholder={`${selectedPlatform?.name} - Main Branch`} />
            </div>

            <div className="space-y-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 uppercase">API Credentials</p>
              <div>
                <label className="label text-xs">API Key</label>
                <input value={form.credentials.apiKey} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, apiKey: e.target.value } })} className="input text-sm" placeholder="Enter API key" />
              </div>
              <div>
                <label className="label text-xs">API Secret</label>
                <input type="password" value={form.credentials.apiSecret} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, apiSecret: e.target.value } })} className="input text-sm" placeholder="Enter API secret" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label text-xs">Merchant ID</label>
                  <input value={form.credentials.merchantId} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, merchantId: e.target.value } })} className="input text-sm" />
                </div>
                <div>
                  <label className="label text-xs">Branch ID</label>
                  <input value={form.credentials.branchId} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, branchId: e.target.value } })} className="input text-sm" />
                </div>
              </div>
              <div>
                <label className="label text-xs">Webhook Secret</label>
                <input value={form.credentials.webhookSecret} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, webhookSecret: e.target.value } })} className="input text-sm" placeholder="For verifying webhooks" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Commission %</label>
                <input type="number" step="0.1" min="0" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} className="input text-sm" />
              </div>
              <div>
                <label className="label text-xs">Fixed Commission</label>
                <input type="number" step="0.01" min="0" value={form.commissionFixed} onChange={(e) => setForm({ ...form, commissionFixed: e.target.value })} className="input text-sm" />
              </div>
            </div>

            <div>
              <label className="label text-xs">Delivery Fee Paid By</label>
              <select value={form.deliveryFeeChargedTo} onChange={(e) => setForm({ ...form, deliveryFeeChargedTo: e.target.value })} className="select text-sm">
                <option value="customer">Customer</option>
                <option value="restaurant">Restaurant</option>
                <option value="split">Split</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.autoAcceptOrders} onChange={(e) => setForm({ ...form, autoAcceptOrders: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-accept incoming orders</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.autoSyncMenu} onChange={(e) => setForm({ ...form, autoSyncMenu: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Auto-sync menu changes</span>
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700 sticky bottom-0 bg-white dark:bg-dark-800">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editConfig ? 'Update' : 'Connect'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function OrderCard({ order, onStatusChange, isRtl }) {
  const platform = PLATFORMS.find(p => p.id === order.platform) || PLATFORMS[0]
  const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

  return (
    <div className={`rounded-xl shadow-sm border-l-4 ${statusCfg.border} bg-white dark:bg-dark-800 border-y border-r border-gray-200 dark:border-dark-700 overflow-hidden`}>
      <div className="px-3 py-2 flex items-center justify-between border-b border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${platform.bgColor} ${platform.textColor}`}>{platform.name}</span>
          <span className="font-bold text-sm text-gray-900 dark:text-white">#{order.platformOrderNumber || order.platformOrderId}</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color} flex items-center gap-1`}>
          <statusCfg.icon className="w-3 h-3" /> {statusCfg.label}
        </span>
      </div>

      <div className="px-3 py-2 space-y-1">
        {order.customerName && <div className="flex items-center gap-1.5 text-xs text-gray-500"><User className="w-3 h-3" /> {order.customerName}</div>}
        {order.customerPhone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="w-3 h-3" /> {order.customerPhone}</div>}
        {order.deliveryAddress?.district && <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="w-3 h-3" /> {order.deliveryAddress.district}{order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ''}</div>}
      </div>

      <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700">
        {order.items?.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm py-0.5">
            <span className="text-gray-700 dark:text-gray-300"><strong>{item.quantity}x</strong> {item.name}</span>
            <span className="text-xs text-gray-400">{item.unitPrice?.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
        <div className="text-xs text-gray-400">
          Total: <strong className="text-gray-900 dark:text-white"><Money value={order.total} /></strong>
          {order.commissionAmount > 0 && <span className="ml-2 text-red-400">-{order.commissionAmount.toFixed(2)} commission</span>}
        </div>
        <div className="text-xs font-medium text-emerald-600">Net: <Money value={order.netPayout} /></div>
      </div>

      {order.status === 'pending' && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700 flex gap-1.5">
          <button onClick={() => onStatusChange(order._id, 'accepted')} className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Accept
          </button>
          <button onClick={() => onStatusChange(order._id, 'rejected')} className="flex-1 py-1.5 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium flex items-center justify-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      )}
      {order.status === 'accepted' && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700">
          <button onClick={() => onStatusChange(order._id, 'preparing')} className="w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium flex items-center justify-center gap-1">
            <Package className="w-3.5 h-3.5" /> Start Preparing
          </button>
        </div>
      )}
      {order.status === 'preparing' && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700">
          <button onClick={() => onStatusChange(order._id, 'ready')} className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Mark Ready
          </button>
        </div>
      )}
      {order.status === 'ready' && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700">
          <button onClick={() => onStatusChange(order._id, 'picked_up')} className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium flex items-center justify-center gap-1">
            <Truck className="w-3.5 h-3.5" /> Picked Up
          </button>
        </div>
      )}
      {order.status === 'picked_up' && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700">
          <button onClick={() => onStatusChange(order._id, 'delivered')} className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Delivered
          </button>
        </div>
      )}
      {order.driver?.name && (
        <div className="px-3 py-2 border-t border-gray-100 dark:border-dark-700 flex items-center gap-2 text-xs text-gray-500">
          <Bike className="w-3 h-3" /> {order.driver.name} {order.driver.phone && `· ${order.driver.phone}`}
        </div>
      )}
    </div>
  )
}

export default function RestaurantDelivery() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const isRtl = language === 'ar'
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [editConfig, setEditConfig] = useState(null)
  const [orderFilter, setOrderFilter] = useState({ platform: '', status: '' })

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['delivery-dashboard'],
    queryFn: () => api.get('/restaurant/delivery/dashboard').then(res => res.data),
    enabled: activeTab === 'dashboard',
  })

  const { data: platforms = [] } = useQuery({
    queryKey: ['delivery-platforms'],
    queryFn: () => api.get('/restaurant/delivery/platforms').then(res => res.data),
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['delivery-orders', orderFilter],
    queryFn: () => api.get('/restaurant/delivery/orders', { params: { ...orderFilter, limit: 100 } }).then(res => res.data),
    enabled: activeTab === 'orders',
    refetchInterval: 10000,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/restaurant/delivery/orders/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-orders'] })
      queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const testConnectionMutation = useMutation({
    mutationFn: (id) => api.post(`/restaurant/delivery/platforms/${id}/test-connection`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-platforms'] })
      toast.success(res.data?.message || 'Connection verified')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Connection failed'),
  })

  const syncMenuMutation = useMutation({
    mutationFn: (id) => api.post(`/restaurant/delivery/platforms/${id}/sync-menu`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['delivery-platforms'] })
      toast.success(res.data?.message || 'Menu synced')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Sync failed'),
  })

  const deletePlatformMutation = useMutation({
    mutationFn: (id) => api.delete(`/restaurant/delivery/platforms/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-platforms'] })
      queryClient.invalidateQueries({ queryKey: ['delivery-dashboard'] })
      toast.success('Platform disconnected')
    },
  })

  const summary = dashData?.summary || {}
  const dashPlatforms = dashData?.platforms || []
  const statusBreakdown = dashData?.statusBreakdown || {}
  const pendingPayouts = dashData?.pendingPayouts || []
  const dailyTrend = dashData?.dailyTrend || []
  const orders = ordersData?.orders || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isRtl ? 'تكامل منصات التوصيل' : 'Delivery Platforms'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {isRtl ? 'إدارة الطلبات من جاهز، هنقرستيشن، نينجا، كيتا والمزيد' : 'Manage orders from Jahez, HungerStation, Ninja, Keeta & more'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-dark-700 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
            {tab.id === 'orders' && summary.pendingOrders > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs">{summary.pendingOrders}</span>
            )}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <>
          {dashLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Orders', value: summary.totalOrders || 0, icon: Package, color: 'from-blue-500 to-blue-600' },
                  { label: 'Total Revenue', value: <Money value={summary.totalRevenue || 0} />, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
                  { label: 'Commission', value: <Money value={summary.totalCommission || 0} />, icon: TrendingUp, color: 'from-red-500 to-red-600' },
                  { label: 'Net Payout', value: <Money value={summary.totalNetPayout || 0} />, icon: DollarSign, color: 'from-violet-500 to-violet-600' },
                  { label: 'Pending', value: summary.pendingOrders || 0, icon: Clock, color: 'from-amber-500 to-amber-600' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} shadow-sm w-fit mb-2`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Platform Performance */}
              <div className="card p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Platform Performance</h3>
                <div className="space-y-3">
                  {dashPlatforms.map((p, i) => {
                    const platform = PLATFORMS.find(pl => pl.id === p.platform) || PLATFORMS[0]
                    const stats = p.stats || {}
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 rounded-full ${platform.color}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{platform.name}</p>
                            <p className="text-xs text-gray-400">{stats.count || 0} orders</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Revenue</p>
                            <p className="font-semibold text-gray-900 dark:text-white"><Money value={stats.revenue || 0} /></p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Commission</p>
                            <p className="font-semibold text-red-500"><Money value={stats.commission || 0} /></p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Net</p>
                            <p className="font-semibold text-emerald-600"><Money value={stats.netPayout || 0} /></p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {dashPlatforms.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No platforms connected</p>}
                </div>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['pending', 'preparing', 'ready', 'delivered'].map(s => {
                  const cfg = STATUS_CONFIG[s]
                  return (
                    <div key={s} className="card p-3 flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${cfg.color}`}><cfg.icon className="w-4 h-4" /></div>
                      <div><p className="text-xs text-gray-500">{cfg.label}</p><p className="text-lg font-bold text-gray-900 dark:text-white">{statusBreakdown[s] || 0}</p></div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <select value={orderFilter.platform} onChange={(e) => setOrderFilter(f => ({ ...f, platform: e.target.value }))} className="select w-auto text-sm">
              <option value="">All Platforms</option>
              {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={orderFilter.status} onChange={(e) => setOrderFilter(f => ({ ...f, status: e.target.value }))} className="select w-auto text-sm">
              <option value="">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="text-sm text-gray-400 ml-auto">{orders.length} orders</span>
          </div>

          {ordersLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {orders.map(order => (
                <OrderCard key={order._id} order={order} onStatusChange={(id, status) => statusMutation.mutate({ id, status })} isRtl={isRtl} />
              ))}
              {orders.length === 0 && <div className="col-span-full text-center py-12 text-gray-400"><Package className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No delivery orders</p></div>}
            </div>
          )}
        </>
      )}

      {/* Platforms Tab */}
      {activeTab === 'platforms' && (
        <>
          <div className="flex justify-end">
            <button onClick={() => { setEditConfig(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Connect Platform
            </button>
          </div>

          {/* Available platforms */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLATFORMS.map(p => {
              const config = platforms.find(c => c.platform === p.id)
              return (
                <div key={p.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center`}>
                        <Store className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                        <a href={`https://${p.url}`} target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:underline flex items-center gap-1">
                          {p.url} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    {config?.isConnected && <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Connected</span>}
                  </div>

                  {config ? (
                    <>
                      <div className="space-y-1 text-xs text-gray-500 mb-3">
                        {config.displayName && <p>{config.displayName}</p>}
                        <p>Commission: {config.commissionPercent}%{config.commissionFixed > 0 && ` + ${config.commissionFixed} SAR`}</p>
                        <p>Auto-accept: {config.autoAcceptOrders ? 'Yes' : 'No'}</p>
                        {config.lastOrderAt && <p>Last order: {new Date(config.lastOrderAt).toLocaleDateString()}</p>}
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => testConnectionMutation.mutate(config._id)} disabled={testConnectionMutation.isPending}
                          className="btn btn-secondary btn-sm flex-1 text-xs">
                          <Zap className="w-3 h-3" /> Test
                        </button>
                        <button onClick={() => syncMenuMutation.mutate(config._id)} disabled={syncMenuMutation.isPending}
                          className="btn btn-secondary btn-sm flex-1 text-xs">
                          {syncMenuMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync Menu
                        </button>
                        <button onClick={() => { setEditConfig(config); setShowModal(true) }} className="btn btn-secondary btn-sm text-xs"><Settings className="w-3 h-3" /></button>
                        <button onClick={() => { if (confirm('Disconnect this platform?')) deletePlatformMutation.mutate(config._id) }} className="text-xs text-red-500 p-1.5"><XCircle className="w-3.5 h-3.5" /></button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-3">Not connected. Click connect to start receiving orders from {p.name}.</p>
                      <button onClick={() => { setEditConfig(null); setShowModal(true) }} className={`btn btn-sm w-full ${p.bgColor} ${p.textColor} border-transparent`}>
                        <Plus className="w-3.5 h-3.5" /> Connect {p.name}
                      </button>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <>
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Pending Payouts by Platform</h3>
            {pendingPayouts.length > 0 ? (
              <div className="space-y-3">
                {pendingPayouts.map((p, i) => {
                  const platform = PLATFORMS.find(pl => pl.id === p._id) || PLATFORMS[0]
                  return (
                    <div key={i} className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${platform.color}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{platform.name}</p>
                          <p className="text-xs text-gray-400">{p.count} orders pending settlement</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Net Payout</p>
                        <p className="font-bold text-amber-600"><Money value={p.amount} /></p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No pending payouts</p>
            )}
          </div>

          {/* Daily Revenue Trend */}
          {dailyTrend.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daily Delivery Revenue</h3>
              <div className="flex items-end gap-1 h-32">
                {dailyTrend.map((d, i) => {
                  const max = Math.max(...dailyTrend.map(x => x.revenue), 1)
                  const h = Math.max(2, (d.revenue / max) * 100)
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                        <Money value={d.revenue} />
                      </div>
                      <div className="w-full rounded-t bg-emerald-500" style={{ height: `${h}%` }} />
                      <span className="text-[10px] text-gray-400 mt-1">{d.date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {showModal && <PlatformModal onClose={() => { setShowModal(false); setEditConfig(null) }} editConfig={editConfig} />}
    </div>
  )
}
