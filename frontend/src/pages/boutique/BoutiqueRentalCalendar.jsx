import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, X, Loader2, Scissors, AlertTriangle, Phone,
  Check, Clock, Trash2, Edit3, ChevronLeft, ChevronRight, Ruler,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const ALTERATION_TYPES = [
  { value: 'hem', label: 'Hem' },
  { value: 'take_in', label: 'Take In' },
  { value: 'let_out', label: 'Let Out' },
  { value: 'strap_adjust', label: 'Strap Adjust' },
  { value: 'bust_adjust', label: 'Bust Adjust' },
  { value: 'length_adjust', label: 'Length Adjust' },
  { value: 'beading', label: 'Beading' },
  { value: 'custom', label: 'Custom' },
  { value: 'other', label: 'Other' },
]

const STATUS_CONFIG = {
  requested: { label: 'Requested', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Scissors },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: X },
}

function AlterationModal({ onClose, editAlteration }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    customerName: editAlteration?.customerName || '',
    customerPhone: editAlteration?.customerPhone || '',
    alterationType: editAlteration?.alterationType || 'hem',
    description: editAlteration?.description || '',
    assignedTo: editAlteration?.assignedTo || '',
    cost: editAlteration?.cost || 0,
    chargeToCustomer: editAlteration?.chargeToCustomer || 0,
    dueDate: editAlteration?.dueDate?.split('T')[0] || '',
    measurements: editAlteration?.measurements || {},
    damageReported: editAlteration?.damageReported || false,
    damageDescription: editAlteration?.damageDescription || '',
    damageFee: editAlteration?.damageFee || 0,
    notes: editAlteration?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => editAlteration
      ? api.put(`/boutique/calendar/alterations/${editAlteration._id}`, data)
      : api.post('/boutique/calendar/alterations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alterations'] })
      toast.success(editAlteration ? 'Alteration updated' : 'Alteration created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.customerName || !form.description) return toast.error('Name and description required')
    mutation.mutate({
      ...form,
      cost: Number(form.cost) || 0,
      chargeToCustomer: Number(form.chargeToCustomer) || 0,
      damageFee: Number(form.damageFee) || 0,
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
            <h3 className="font-semibold text-gray-900 dark:text-white">{editAlteration ? 'Edit Alteration' : 'New Alteration'}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Customer Name *</label>
                <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="input" placeholder="05xxxxxxxx" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select value={form.alterationType} onChange={(e) => setForm({ ...form, alterationType: e.target.value })} className="select">
                  {ALTERATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assigned To</label>
                <input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="input" placeholder="Tailor name" />
              </div>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>

            {/* Measurements */}
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Ruler className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Measurements (cm)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {['bust', 'waist', 'hips', 'length', 'shoulder', 'sleeveLength'].map(m => (
                  <div key={m}>
                    <label className="text-xs text-gray-500 capitalize">{m.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      type="number"
                      value={form.measurements?.[m] || ''}
                      onChange={(e) => setForm({ ...form, measurements: { ...form.measurements, [m]: Number(e.target.value) || undefined } })}
                      className="input text-sm py-1"
                      placeholder="—"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Cost (SAR)</label>
                <input type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Charge Customer</label>
                <input type="number" step="0.01" value={form.chargeToCustomer} onChange={(e) => setForm({ ...form, chargeToCustomer: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" />
              </div>
            </div>

            {/* Damage tracking */}
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.damageReported} onChange={(e) => setForm({ ...form, damageReported: e.target.checked })} className="w-4 h-4 rounded" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Damage Reported</span>
              </label>
              {form.damageReported && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input value={form.damageDescription} onChange={(e) => setForm({ ...form, damageDescription: e.target.value })} className="input text-sm" placeholder="Damage description" />
                  <input type="number" step="0.01" value={form.damageFee} onChange={(e) => setForm({ ...form, damageFee: e.target.value })} className="input text-sm" placeholder="Damage fee (SAR)" />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700 sticky bottom-0 bg-white dark:bg-dark-800">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editAlteration ? 'Update' : 'Create'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function BoutiqueRentalCalendar() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState('calendar')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editAlteration, setEditAlteration] = useState(null)

  const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  const { data: calData, isLoading: calLoading } = useQuery({
    queryKey: ['boutique-calendar', monthStr],
    queryFn: () => api.get('/boutique/calendar', { params: { month: monthStr } }).then(res => res.data),
    enabled: activeView === 'calendar',
  })

  const { data: altData, isLoading: altLoading } = useQuery({
    queryKey: ['alterations'],
    queryFn: () => api.get('/boutique/calendar/alterations').then(res => res.data),
    enabled: activeView === 'alterations',
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/boutique/calendar/alterations/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alterations'] })
      toast.success('Status updated')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/boutique/calendar/alterations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alterations'] })
      toast.success('Alteration deleted')
    },
  })

  const calendar = calData?.calendar || {}
  const overdue = calData?.overdue || []
  const alterations = altData?.alterations || []

  // Build calendar grid
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date().toISOString().split('T')[0]

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'تقويم الإيجار والتعديلات' : 'Rental Calendar & Alterations'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'تقويم الإيجار البصري وتتبع التعديلات والأضرار' : 'Visual rental calendar and alteration/damage tracking'}
          </p>
        </div>
        <button onClick={() => { setEditAlteration(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'تعديل جديد' : 'New Alteration'}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'calendar', label: language === 'ar' ? 'التقويم' : 'Calendar' },
          { id: 'alterations', label: language === 'ar' ? 'التعديلات' : 'Alterations' },
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

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <>
          {/* Overdue Alert */}
          {overdue.length > 0 && (
            <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">{overdue.length} Overdue Rental{overdue.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-1">
                {overdue.map(o => (
                  <div key={o.rentalId} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{o.rentalNumber} — {o.customerName}</span>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" /> {o.customerPhone}
                      <span className="text-red-600 dark:text-red-400 font-medium">{o.daysLate}d late</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendar */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><ChevronLeft className="w-4 h-4" /></button>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{MONTH_NAMES[month]} {year}</h3>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><ChevronRight className="w-4 h-4" /></button>
            </div>

            {calLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
            ) : (
              <>
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 dark:border-dark-700">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="p-2 text-center text-xs font-medium text-gray-500 uppercase">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const events = calendar[dateKey] || []
                    const isToday = dateKey === today
                    return (
                      <div key={day} className={`min-h-[80px] border-b border-r border-gray-100 dark:border-dark-700 p-1 ${isToday ? 'bg-primary-50 dark:bg-primary-900/10' : ''}`}>
                        <p className={`text-xs font-medium mb-1 ${isToday ? 'text-primary-600' : 'text-gray-500'}`}>{day}</p>
                        <div className="space-y-0.5">
                          {events.slice(0, 3).map((ev, idx) => (
                            <div key={idx} className="text-[10px] px-1 py-0.5 rounded truncate bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400" title={`${ev.rentalNumber} — ${ev.customerName}`}>
                              {ev.rentalNumber}
                            </div>
                          ))}
                          {events.length > 3 && <p className="text-[10px] text-gray-400 px-1">+{events.length - 3} more</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-violet-100 dark:bg-violet-900/30" /> Rental</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-primary-50 dark:bg-primary-900/10" /> Today</div>
          </div>
        </>
      )}

      {/* Alterations View */}
      {activeView === 'alterations' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alterations</h3>
          </div>
          {altLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
          ) : alterations.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Scissors className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No alterations yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-dark-700">
              {alterations.map(a => {
                const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.requested
                const Icon = cfg.icon
                return (
                  <div key={a._id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.customerName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="capitalize">{a.alterationType.replace(/_/g, ' ')}</span>
                          {a.productName && <span>· {a.productName}</span>}
                          {a.dueDate && <><Clock className="w-3 h-3" /> {new Date(a.dueDate).toLocaleDateString()}</>}
                          {a.damageReported && <span className="text-red-500">· Damage</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                      <select
                        value={a.status}
                        onChange={(e) => statusMutation.mutate({ id: a._id, status: e.target.value })}
                        className="select w-auto text-xs py-1"
                      >
                        <option value="requested">Requested</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button onClick={() => { setEditAlteration(a); setShowModal(true) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(a._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showModal && <AlterationModal onClose={() => { setShowModal(false); setEditAlteration(null) }} editAlteration={editAlteration} />}
    </div>
  )
}
