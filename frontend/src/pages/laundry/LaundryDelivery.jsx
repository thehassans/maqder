import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, X, Loader2, Truck, MapPin, Check, XCircle,
  Package, User, Phone, Trash2, Play, Navigation,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const STOP_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  arrived: { label: 'Arrived', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  skipped: { label: 'Skipped', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
}

const ROUTE_STATUS_CONFIG = {
  planned: { label: 'Planned', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function CreateRouteModal({ onClose }) {
  const queryClient = useQueryClient()
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0])
  const [driverName, setDriverName] = useState('')
  const [stopType, setStopType] = useState('pickup')
  const [selectedOrders, setSelectedOrders] = useState(new Set())

  const { data: availableOrders = [] } = useQuery({
    queryKey: ['available-orders', stopType],
    queryFn: () => api.get('/laundry/routes/available-orders/list', { params: { stopType } }).then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/laundry/routes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] })
      toast.success('Route created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const toggleOrder = (id) => {
    const next = new Set(selectedOrders)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedOrders(next)
  }

  const handleCreate = () => {
    if (!selectedOrders.size) return toast.error('Select at least one order')
    const orders = availableOrders.filter(o => selectedOrders.has(o._id))
    createMutation.mutate({
      routeDate,
      driverName,
      stops: orders.map(o => ({
        orderId: o._id,
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        stopType,
      })),
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Create Delivery Route</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Route Date</label>
                <input type="date" value={routeDate} onChange={(e) => setRouteDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Driver Name</label>
                <input value={driverName} onChange={(e) => setDriverName(e.target.value)} className="input" placeholder="Driver name" />
              </div>
            </div>

            <div>
              <label className="label">Stop Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setStopType('pickup'); setSelectedOrders(new Set()) }}
                  className={`p-2 rounded-lg text-sm font-medium border-2 ${stopType === 'pickup' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                >
                  Pickup
                </button>
                <button
                  onClick={() => { setStopType('delivery'); setSelectedOrders(new Set()) }}
                  className={`p-2 rounded-lg text-sm font-medium border-2 ${stopType === 'delivery' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                >
                  Delivery
                </button>
              </div>
            </div>

            <div>
              <label className="label">Available Orders ({availableOrders.length})</label>
              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-dark-600 rounded-lg divide-y divide-gray-100 dark:divide-dark-700">
                {availableOrders.length === 0 ? (
                  <p className="p-4 text-center text-gray-400 text-sm">No orders available for {stopType}</p>
                ) : (
                  availableOrders.map(o => (
                    <label key={o._id} className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer">
                      <input type="checkbox" checked={selectedOrders.has(o._id)} onChange={() => toggleOrder(o._id)} className="w-4 h-4 rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{o.orderNumber} — {o.customerName}</p>
                        <p className="text-xs text-gray-400">{o.customerPhone} · {o.status}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={createMutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Route ({selectedOrders.size})
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function LaundryDelivery() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [expandedRoute, setExpandedRoute] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-routes'],
    queryFn: () => api.get('/laundry/routes').then(res => res.data),
  })

  const startMutation = useMutation({
    mutationFn: (id) => api.put(`/laundry/routes/${id}/start`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] })
      toast.success('Route started')
    },
  })

  const stopMutation = useMutation({
    mutationFn: ({ routeId, stopId, status, failedReason }) => api.put(`/laundry/routes/${routeId}/stop/${stopId}`, { status, failedReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] })
      toast.success('Stop updated')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/laundry/routes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-routes'] })
      toast.success('Route deleted')
    },
  })

  const routes = data?.routes || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'إدارة التوصيل والمسارات' : 'Delivery & Route Management'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'تخطيط مسارات التوصيل وتتبع السائقين' : 'Plan delivery routes and track drivers'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'مسار جديد' : 'New Route'}
        </button>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
        ) : routes.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">
            <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No delivery routes yet</p>
          </div>
        ) : (
          routes.map(route => {
            const cfg = ROUTE_STATUS_CONFIG[route.status] || ROUTE_STATUS_CONFIG.planned
            const isExpanded = expandedRoute === route._id
            return (
              <motion.div key={route._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800"
                  onClick={() => setExpandedRoute(isExpanded ? null : route._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                      <Truck className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{route.routeNumber}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" /> {new Date(route.routeDate).toLocaleDateString()}
                        {route.driverName && <><User className="w-3 h-3" /> {route.driverName}</>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{route.completedStops}/{route.totalStops} stops</p>
                      <div className="w-24 h-1.5 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${route.totalStops > 0 ? (route.completedStops / route.totalStops) * 100 : 0}%` }} />
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-dark-700">
                    {/* Action bar */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-800/50">
                      <div className="flex gap-2">
                        {route.status === 'planned' && (
                          <button onClick={() => startMutation.mutate(route._id)} className="btn btn-secondary btn-sm flex items-center gap-1">
                            <Play className="w-3.5 h-3.5" /> Start Route
                          </button>
                        )}
                      </div>
                      {route.status !== 'completed' && route.status !== 'in_progress' && (
                        <button
                          onClick={() => { if (confirm('Delete this route?')) deleteMutation.mutate(route._id) }}
                          className="text-xs text-red-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>

                    {/* Stops */}
                    <div className="divide-y divide-gray-200 dark:divide-dark-700">
                      {route.stops.map((stop, idx) => {
                        const sCfg = STOP_STATUS_CONFIG[stop.status] || STOP_STATUS_CONFIG.pending
                        return (
                          <div key={stop._id || idx} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${stop.stopType === 'pickup' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                {stop.sequence}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {stop.stopType === 'pickup' ? 'Pickup' : 'Delivery'} — {stop.customerName}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>{stop.orderNumber}</span>
                                  <Phone className="w-3 h-3" /> {stop.customerPhone}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sCfg.color}`}>{sCfg.label}</span>
                              {route.status === 'in_progress' && stop.status === 'pending' && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => stopMutation.mutate({ routeId: route._id, stopId: stop._id, status: 'completed' })}
                                    className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 hover:bg-emerald-200"
                                    title="Mark completed"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const reason = prompt('Failure reason?') || 'N/A'
                                      stopMutation.mutate({ routeId: route._id, stopId: stop._id, status: 'failed', failedReason: reason })
                                    }}
                                    className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-900/30 hover:bg-red-200"
                                    title="Mark failed"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {showModal && <CreateRouteModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
