import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench, Plus, X, Loader2, Car, AlertTriangle, Bell,
  CheckCircle2, Clock, Trash2, Edit3, History, BellOff,
  Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const REMINDER_TYPES = [
  { value: 'oil_change', label: 'Oil Change' },
  { value: 'tire_rotation', label: 'Tire Rotation' },
  { value: 'brake_check', label: 'Brake Check' },
  { value: 'general_inspection', label: 'General Inspection' },
  { value: 'fahas_renewal', label: 'Fahas Renewal' },
  { value: 'insurance_renewal', label: 'Insurance Renewal' },
  { value: 'istimara_renewal', label: 'Istimara Renewal' },
  { value: 'battery_check', label: 'Battery Check' },
  { value: 'coolant_flush', label: 'Coolant Flush' },
  { value: 'transmission_service', label: 'Transmission Service' },
  { value: 'custom', label: 'Custom' },
]

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  snoozed: { label: 'Snoozed', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400' },
  disabled: { label: 'Disabled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

function ReminderModal({ vehicles, onClose, editReminder }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    vehicleId: editReminder?.vehicleId?._id || editReminder?.vehicleId || '',
    reminderType: editReminder?.reminderType || 'oil_change',
    customLabel: editReminder?.customLabel || '',
    intervalKm: editReminder?.intervalKm || 0,
    intervalDays: editReminder?.intervalDays || 0,
    lastServiceKm: editReminder?.lastServiceKm || 0,
    lastServiceDate: editReminder?.lastServiceDate?.split('T')[0] || '',
    alertDaysBefore: editReminder?.alertDaysBefore || 7,
    alertKmBefore: editReminder?.alertKmBefore || 500,
    notes: editReminder?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => editReminder
      ? api.put(`/workshop/service/reminders/${editReminder._id}`, data)
      : api.post('/workshop/service/reminders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminder-dashboard'] })
      toast.success(editReminder ? 'Reminder updated' : 'Reminder created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.vehicleId) return toast.error('Vehicle required')
    mutation.mutate({
      ...form,
      intervalKm: Number(form.intervalKm) || 0,
      intervalDays: Number(form.intervalDays) || 0,
      lastServiceKm: Number(form.lastServiceKm) || 0,
      alertDaysBefore: Number(form.alertDaysBefore) || 7,
      alertKmBefore: Number(form.alertKmBefore) || 500,
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
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-800 z-10">
            <h3 className="font-semibold text-gray-900 dark:text-white">{editReminder ? 'Edit Reminder' : 'New Service Reminder'}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="label">Vehicle *</label>
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="select">
                <option value="">Select vehicle...</option>
                {vehicles.map(v => <option key={v._id} value={v._id}>{v.make} {v.model} {v.year || ''} — {v.plateNumber}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Reminder Type</label>
              <select value={form.reminderType} onChange={(e) => setForm({ ...form, reminderType: e.target.value })} className="select">
                {REMINDER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {form.reminderType === 'custom' && (
              <div>
                <label className="label">Custom Label</label>
                <input value={form.customLabel} onChange={(e) => setForm({ ...form, customLabel: e.target.value })} className="input" placeholder="e.g., AC Service" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Interval (days)</label>
                <input type="number" min="0" value={form.intervalDays} onChange={(e) => setForm({ ...form, intervalDays: e.target.value })} className="input" placeholder="e.g., 180" />
              </div>
              <div>
                <label className="label">Interval (km)</label>
                <input type="number" min="0" value={form.intervalKm} onChange={(e) => setForm({ ...form, intervalKm: e.target.value })} className="input" placeholder="e.g., 10000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Last Service Date</label>
                <input type="date" value={form.lastServiceDate} onChange={(e) => setForm({ ...form, lastServiceDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Last Service Km</label>
                <input type="number" min="0" value={form.lastServiceKm} onChange={(e) => setForm({ ...form, lastServiceKm: e.target.value })} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Alert Days Before</label>
                <input type="number" min="0" value={form.alertDaysBefore} onChange={(e) => setForm({ ...form, alertDaysBefore: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Alert Km Before</label>
                <input type="number" min="0" value={form.alertKmBefore} onChange={(e) => setForm({ ...form, alertKmBefore: e.target.value })} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700 sticky bottom-0 bg-white dark:bg-dark-800">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editReminder ? 'Update' : 'Create'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function WorkshopServiceHistory() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState('reminders')
  const [showModal, setShowModal] = useState(false)
  const [editReminder, setEditReminder] = useState(null)
  const [vehicleSearch, setVehicleSearch] = useState('')
  const [selectedVehicleId, setSelectedVehicleId] = useState(null)

  const { data: dashData } = useQuery({
    queryKey: ['reminder-dashboard'],
    queryFn: () => api.get('/workshop/service/reminders/dashboard').then(res => res.data),
    enabled: activeView === 'reminders',
  })

  const { data: remindersData, isLoading: remLoading } = useQuery({
    queryKey: ['reminders'],
    queryFn: () => api.get('/workshop/service/reminders', { params: { limit: 100 } }).then(res => res.data),
    enabled: activeView === 'reminders',
  })

  const { data: vehicles = [] } = useQuery({
    queryKey: ['workshop-vehicles'],
    queryFn: () => api.get('/workshop/vehicles', { params: { limit: 100 } }).then(res => res.data),
    enabled: activeView === 'history',
  })

  const { data: historyData, isLoading: histLoading } = useQuery({
    queryKey: ['service-history', selectedVehicleId],
    queryFn: () => api.get(`/workshop/service/service-history/${selectedVehicleId}`).then(res => res.data),
    enabled: activeView === 'history' && !!selectedVehicleId,
  })

  const snoozeMutation = useMutation({
    mutationFn: (id) => api.put(`/workshop/service/reminders/${id}/snooze`, { days: 7 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminder-dashboard'] })
      toast.success('Reminder snoozed 7 days')
    },
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, serviceDate, serviceKm }) => api.put(`/workshop/service/reminders/${id}/complete`, { serviceDate, serviceKm }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminder-dashboard'] })
      toast.success('Service marked complete — next cycle scheduled')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/workshop/service/reminders/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminder-dashboard'] })
      toast.success('Reminder deleted')
    },
  })

  const summary = dashData?.summary || {}
  const overdueReminders = dashData?.overdueReminders || []
  const reminders = remindersData?.reminders || []
  const filteredVehicles = vehicles.filter(v =>
    !vehicleSearch ||
    v.plateNumber?.includes(vehicleSearch) ||
    v.make?.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.model?.toLowerCase().includes(vehicleSearch.toLowerCase())
  )

  const timeline = historyData?.timeline || []
  const vehicleStats = historyData?.stats || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'سجل الخدمة والتذكيرات' : 'Service History & Reminders'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'سجل الخدمة لكل سيارة وتذكيرات الصيانة الدورية' : 'Per-vehicle service timeline and recurring maintenance reminders'}
          </p>
        </div>
        <button onClick={() => { setEditReminder(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'تذكير جديد' : 'New Reminder'}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'reminders', label: language === 'ar' ? 'التذكيرات' : 'Reminders' },
          { id: 'history', label: language === 'ar' ? 'السجل' : 'Service History' },
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

      {/* Reminders View */}
      {activeView === 'reminders' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active', value: summary.totalActive || 0, color: 'from-emerald-500 to-emerald-600', icon: Bell },
              { label: 'Overdue', value: summary.overdue || 0, color: 'from-red-500 to-red-600', icon: AlertTriangle },
              { label: 'Upcoming (30d)', value: summary.upcoming || 0, color: 'from-amber-500 to-amber-600', icon: Clock },
              { label: 'Total', value: (summary.totalActive || 0), color: 'from-blue-500 to-blue-600', icon: Wrench },
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

          {/* Overdue Reminders */}
          {overdueReminders.length > 0 && (
            <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Overdue Reminders</span>
              </div>
              <div className="space-y-2">
                {overdueReminders.map(r => (
                  <div key={r._id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{r.vehicleDisplay}</span>
                      <span className="text-gray-400 ml-2 capitalize">{r.customLabel || r.reminderType.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.customerPhone && <span className="text-xs text-gray-400">{r.customerPhone}</span>}
                      <button onClick={() => completeMutation.mutate({ id: r._id, serviceDate: new Date().toISOString().split('T')[0] })} className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200">
                        Mark Done
                      </button>
                      <button onClick={() => snoozeMutation.mutate(r._id)} className="text-xs px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-lg hover:bg-amber-200">
                        Snooze 7d
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Reminders */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">All Reminders</h3>
            </div>
            {remLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
            ) : reminders.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No reminders yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {reminders.map(r => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.active
                  const isOverdue = r.status === 'active' && r.nextDueDate && new Date(r.nextDueDate) < new Date()
                  return (
                    <div key={r._id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-gray-100 text-gray-500 dark:bg-dark-700'}`}>
                          <Wrench className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.vehicleDisplay}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="capitalize">{r.customLabel || r.reminderType.replace(/_/g, ' ')}</span>
                            {r.nextDueDate && <><Clock className="w-3 h-3" /> {new Date(r.nextDueDate).toLocaleDateString()}</>}
                            {r.nextDueKm && <span>· {r.nextDueKm.toLocaleString()} km</span>}
                            {r.intervalDays > 0 && <span>· every {r.intervalDays}d</span>}
                            {r.intervalKm > 0 && <span>· every {r.intervalKm.toLocaleString()}km</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                        {r.status === 'active' && (
                          <>
                            <button onClick={() => completeMutation.mutate({ id: r._id, serviceDate: new Date().toISOString().split('T')[0] })} className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 hover:bg-emerald-200" title="Mark complete">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => snoozeMutation.mutate(r._id)} className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 hover:bg-amber-200" title="Snooze 7 days">
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button onClick={() => { setEditReminder(r); setShowModal(true) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(r._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Service History View */}
      {activeView === 'history' && (
        <>
          {/* Vehicle Search */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-gray-400" />
              <input value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} className="input flex-1" placeholder="Search by plate, make, or model..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
              {filteredVehicles.slice(0, 30).map(v => (
                <button
                  key={v._id}
                  onClick={() => setSelectedVehicleId(v._id)}
                  className={`p-3 rounded-lg text-left border-2 transition-colors ${selectedVehicleId === v._id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'}`}
                >
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{v.make} {v.model} {v.year || ''}</p>
                  <p className="text-xs text-gray-400">{v.plateNumber} · {v.currentOdometer?.toLocaleString() || 0} km</p>
                </button>
              ))}
            </div>
          </div>

          {/* Service History Timeline */}
          {selectedVehicleId && (
            <>
              {histLoading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
              ) : historyData ? (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Total Jobs', value: vehicleStats.totalJobs || 0, color: 'from-blue-500 to-blue-600', icon: Wrench },
                      { label: 'Completed', value: vehicleStats.completedJobs || 0, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle2 },
                      { label: 'Total Spent', value: `${(vehicleStats.totalSpent || 0).toLocaleString()} SAR`, color: 'from-violet-500 to-violet-600', icon: Car },
                      { label: 'Odometer', value: `${(vehicleStats.currentOdometer || 0).toLocaleString()} km`, color: 'from-amber-500 to-amber-600', icon: Clock },
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

                  {/* Timeline */}
                  <div className="card overflow-hidden">
                    <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <History className="w-4 h-4" /> Service Timeline
                      </h3>
                    </div>
                    {timeline.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p>No service history yet</p>
                      </div>
                    ) : (
                      <div className="p-4">
                        <div className="relative">
                          {timeline.map((item, i) => (
                            <div key={i} className="flex gap-4 pb-6 last:pb-0">
                              {/* Line */}
                              {i < timeline.length - 1 && <div className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200 dark:bg-dark-600" />}
                              {/* Dot */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.type === 'job_card' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30'}`}>
                                {item.type === 'job_card' ? <Wrench className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                              </div>
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.title}</p>
                                  <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                                </div>
                                {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                                {item.cost > 0 && <p className="text-xs text-gray-400 mt-1">Cost: {item.cost.toLocaleString()} SAR</p>}
                                {item.mechanics?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {item.mechanics.map((m, idx) => <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-gray-500">{m}</span>)}
                                  </div>
                                )}
                                {item.status && <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-gray-500 capitalize">{item.status.replace(/_/g, ' ')}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Active Reminders for this vehicle */}
                  {historyData.reminders?.length > 0 && (
                    <div className="card overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Bell className="w-4 h-4" /> Active Reminders
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-dark-700">
                        {historyData.reminders.filter(r => r.status === 'active' || r.status === 'snoozed').map(r => (
                          <div key={r._id} className="flex items-center justify-between px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{r.customLabel || r.reminderType.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-400">
                                {r.nextDueDate && `Due: ${new Date(r.nextDueDate).toLocaleDateString()}`}
                                {r.nextDueKm && ` · At ${r.nextDueKm.toLocaleString()} km`}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[r.status]?.color || STATUS_CONFIG.active.color}`}>{STATUS_CONFIG[r.status]?.label || 'Active'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-8 text-center text-gray-400">
                  <Car className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Select a vehicle to view service history</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {showModal && <ReminderModal vehicles={vehicles} onClose={() => { setShowModal(false); setEditReminder(null) }} editReminder={editReminder} />}
    </div>
  )
}
