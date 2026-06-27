import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench, Plus, X, Loader2, Car, AlertTriangle, DollarSign,
  CheckCircle2, Clock, TrendingUp, Trash2, Edit3, Calendar,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const MAINTENANCE_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'tire_change', label: 'Tire Change' },
  { value: 'brake_service', label: 'Brake Service' },
  { value: 'battery', label: 'Battery' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'fahas_renewal', label: 'Fahas Renewal' },
  { value: 'insurance_renewal', label: 'Insurance Renewal' },
  { value: 'istimara_renewal', label: 'Istimara Renewal' },
  { value: 'repair', label: 'Repair' },
  { value: 'other', label: 'Other' },
]

const ALERT_TYPE_CONFIG = {
  insurance: { label: 'Insurance', color: 'text-red-600 dark:text-red-400', icon: AlertTriangle },
  fahas: { label: 'Fahas', color: 'text-orange-600 dark:text-orange-400', icon: AlertTriangle },
  istimara: { label: 'Istimara', color: 'text-amber-600 dark:text-amber-400', icon: AlertTriangle },
  oil_change: { label: 'Oil Change', color: 'text-blue-600 dark:text-blue-400', icon: Wrench },
}

const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function MaintenanceModal({ cars, onClose, editRecord }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    carId: editRecord?.carId?._id || editRecord?.carId || '',
    maintenanceType: editRecord?.maintenanceType || 'oil_change',
    description: editRecord?.description || '',
    scheduledDate: editRecord?.scheduledDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    cost: editRecord?.cost || 0,
    laborCost: editRecord?.laborCost || 0,
    partsCost: editRecord?.partsCost || 0,
    vendor: editRecord?.vendor || '',
    odometerAtService: editRecord?.odometerAtService || '',
    nextServiceDate: editRecord?.nextServiceDate?.split('T')[0] || '',
    nextServiceOdometer: editRecord?.nextServiceOdometer || '',
    status: editRecord?.status || 'scheduled',
    notes: editRecord?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => editRecord
      ? api.put(`/rental/maintenance/${editRecord._id}`, data)
      : api.post('/rental/maintenance', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] })
      toast.success(editRecord ? 'Record updated' : 'Maintenance scheduled')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.carId || !form.description) return toast.error('Car and description required')
    mutation.mutate({
      ...form,
      cost: Number(form.cost) || 0,
      laborCost: Number(form.laborCost) || 0,
      partsCost: Number(form.partsCost) || 0,
      odometerAtService: form.odometerAtService ? Number(form.odometerAtService) : undefined,
      nextServiceOdometer: form.nextServiceOdometer ? Number(form.nextServiceOdometer) : undefined,
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
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-800 z-10">
            <h3 className="font-semibold text-gray-900 dark:text-white">{editRecord ? 'Edit Maintenance' : 'Schedule Maintenance'}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="label">Vehicle *</label>
              <select value={form.carId} onChange={(e) => setForm({ ...form, carId: e.target.value })} className="select">
                <option value="">Select car...</option>
                {cars.map(c => <option key={c._id} value={c._id}>{c.make} {c.model} {c.year} — {c.plateNumber}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select value={form.maintenanceType} onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })} className="select">
                  {MAINTENANCE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select">
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Scheduled Date</label>
                <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Vendor</label>
                <input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} className="input" placeholder="Service center" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Cost (SAR)</label>
                <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Labor</label>
                <input type="number" step="0.01" value={form.laborCost} onChange={(e) => setForm({ ...form, laborCost: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Parts</label>
                <input type="number" step="0.01" value={form.partsCost} onChange={(e) => setForm({ ...form, partsCost: e.target.value })} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Odometer at Service</label>
                <input type="number" value={form.odometerAtService} onChange={(e) => setForm({ ...form, odometerAtService: e.target.value })} className="input" placeholder="km" />
              </div>
              <div>
                <label className="label">Next Service Odometer</label>
                <input type="number" value={form.nextServiceOdometer} onChange={(e) => setForm({ ...form, nextServiceOdometer: e.target.value })} className="input" placeholder="km" />
              </div>
            </div>

            <div>
              <label className="label">Next Service Date</label>
              <input type="date" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} className="input" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700 sticky bottom-0 bg-white dark:bg-dark-800">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editRecord ? 'Update' : 'Schedule'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function RentalMaintenancePage() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState('dashboard')
  const [showModal, setShowModal] = useState(false)
  const [editRecord, setEditRecord] = useState(null)

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['maintenance-dashboard'],
    queryFn: () => api.get('/rental/maintenance/dashboard').then(res => res.data),
    enabled: activeView === 'dashboard',
  })

  const { data: cars = [] } = useQuery({
    queryKey: ['rental-cars'],
    queryFn: () => api.get('/rental/cars', { params: { limit: 100 } }).then(res => res.data),
  })

  const { data: recordsData, isLoading: recLoading } = useQuery({
    queryKey: ['maintenance-records'],
    queryFn: () => api.get('/rental/maintenance', { params: { limit: 50 } }).then(res => res.data),
    enabled: activeView === 'records',
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/rental/maintenance/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] })
      toast.success('Record deleted')
    },
  })

  const summary = dashData?.summary || {}
  const alerts = dashData?.alerts || []
  const statusCounts = dashData?.statusCounts || {}
  const upcomingMaintenance = dashData?.upcomingMaintenance || []
  const costSummary = dashData?.costSummary || []
  const costByCar = dashData?.costByCar || []
  const activeRentals = dashData?.activeRentals || []

  const records = recordsData?.records || []

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'الصيانة واستخدام الأسطول' : 'Maintenance & Fleet Utilization'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'جدولة الصيانة وتتبع استخدام السيارات' : 'Schedule maintenance and track fleet utilization'}
          </p>
        </div>
        <button onClick={() => { setEditRecord(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'صيانة جديدة' : 'New Maintenance'}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'dashboard', label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard' },
          { id: 'records', label: language === 'ar' ? 'السجلات' : 'Records' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {activeView === 'dashboard' && (
        <>
          {dashLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Cars', value: summary.totalCars || 0, color: 'from-blue-500 to-blue-600', icon: Car },
                  { label: 'Available', value: summary.available || 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle2 },
                  { label: 'Rented', value: summary.rented || 0, sublabel: `${summary.utilizationRate || 0}% utilization`, color: 'from-violet-500 to-violet-600', icon: TrendingUp },
                  { label: 'Active Alerts', value: summary.activeAlerts || 0, color: 'from-red-500 to-red-600', icon: AlertTriangle },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} shadow-sm w-fit mb-2`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    {s.sublabel && <p className="text-xs text-gray-400">{s.sublabel}</p>}
                  </motion.div>
                ))}
              </div>

              {/* Fleet Status Bar */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Fleet Status</h3>
                <div className="flex h-6 rounded-full overflow-hidden">
                  {[
                    { label: 'Available', count: statusCounts.AVAILABLE || 0, color: 'bg-emerald-500' },
                    { label: 'Rented', count: statusCounts.RENTED || 0, color: 'bg-violet-500' },
                    { label: 'Reserved', count: statusCounts.RESERVED || 0, color: 'bg-blue-500' },
                    { label: 'Maintenance', count: statusCounts.MAINTENANCE || 0, color: 'bg-amber-500' },
                    { label: 'Pending', count: statusCounts.PENDING_INSPECTION || 0, color: 'bg-red-500' },
                  ].map(s => (
                    s.count > 0 && (
                      <div key={s.label} className={`${s.color} flex items-center justify-center text-xs text-white font-medium`} style={{ width: `${(s.count / (summary.totalCars || 1)) * 100}%` }} title={`${s.label}: ${s.count}`}>
                        {s.count}
                      </div>
                    )
                  ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                  {[
                    { label: 'Available', color: 'bg-emerald-500' },
                    { label: 'Rented', color: 'bg-violet-500' },
                    { label: 'Reserved', color: 'bg-blue-500' },
                    { label: 'Maintenance', color: 'bg-amber-500' },
                    { label: 'Pending', color: 'bg-red-500' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center gap-1.5">
                      <div className={`w-3 h-3 rounded ${s.color}`} /> {s.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Alerts */}
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Compliance & Service Alerts</h3>
                  </div>
                  {alerts.length === 0 ? (
                    <div className="p-6 text-center text-gray-400">
                      <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-50" />
                      <p className="text-sm">No alerts — all good!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200 dark:divide-dark-700 max-h-[300px] overflow-y-auto">
                      {alerts.map((a, i) => {
                        const cfg = ALERT_TYPE_CONFIG[a.type] || ALERT_TYPE_CONFIG.other
                        const Icon = cfg.icon || AlertTriangle
                        return (
                          <div key={i} className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{a.carDisplay}</p>
                                <p className="text-xs text-gray-400 capitalize">{cfg.label}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {a.daysLeft !== undefined ? (
                                <p className={`text-sm font-bold ${a.daysLeft <= 7 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {a.daysLeft}d left
                                </p>
                              ) : a.kmLeft !== undefined ? (
                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {a.kmLeft} km left
                                </p>
                              ) : null}
                              {a.expiryDate && <p className="text-xs text-gray-400">{new Date(a.expiryDate).toLocaleDateString()}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Maintenance Cost Chart */}
                {costSummary.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Maintenance Cost (6 months)</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={costSummary.map(c => ({ month: c._id, cost: c.totalCost, count: c.count }))}>
                        <defs>
                          <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="cost" stroke="#f59e0b" fill="url(#colorCost)" strokeWidth={2} name="Cost (SAR)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Cost by Car */}
              {costByCar.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Maintenance Cost by Car (6 months)</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={costByCar.map(c => ({ name: c._id.carDisplay?.split(' - ')[0] || 'Car', cost: c.totalCost, count: c.count }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="cost" fill="#6366f1" radius={[4, 4, 0, 0]} name="Cost (SAR)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Upcoming Maintenance */}
              {upcomingMaintenance.length > 0 && (
                <div className="card overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upcoming Maintenance</h3>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-dark-700">
                    {upcomingMaintenance.map(m => {
                      const cfg = STATUS_CONFIG[m.status] || STATUS_CONFIG.scheduled
                      return (
                        <div key={m._id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Wrench className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{m.carDisplay}</p>
                              <p className="text-xs text-gray-400 capitalize">{m.maintenanceType.replace(/_/g, ' ')} · {m.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {m.scheduledDate && <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(m.scheduledDate).toLocaleDateString()}</span>}
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Records View */}
      {activeView === 'records' && (
        <div className="card overflow-hidden">
          {recLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Wrench className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No maintenance records</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {records.map(r => {
                    const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.scheduled
                    return (
                      <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{r.carDisplay}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 capitalize">{r.maintenanceType.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">{r.description}</td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{r.cost?.toLocaleString() || 0} SAR</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span></td>
                        <td className="px-4 py-3 text-right text-xs text-gray-400">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : r.completedDate ? new Date(r.completedDate).toLocaleDateString() : '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => { setEditRecord(r); setShowModal(true) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { if (confirm('Delete this record?')) deleteMutation.mutate(r._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showModal && <MaintenanceModal cars={cars} onClose={() => { setShowModal(false); setEditRecord(null) }} editRecord={editRecord} />}
    </div>
  )
}
