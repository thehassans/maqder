import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, X, Loader2, Users, Phone, Clock, Check,
  UserCheck, XCircle, AlertCircle, ListOrdered, Trash2, Edit3,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Check },
  seated: { label: 'Seated', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: UserCheck },
  completed: { label: 'Completed', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  no_show: { label: 'No Show', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
  waitlist: { label: 'Waitlist', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: ListOrdered },
}

const TIME_SLOTS = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00']

function ReservationModal({ tables, onClose, editReservation }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    customerName: editReservation?.customerName || '',
    customerPhone: editReservation?.customerPhone || '',
    partySize: editReservation?.partySize || 2,
    date: editReservation?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    time: editReservation?.time || '19:00',
    tableId: editReservation?.tableId?._id || editReservation?.tableId || '',
    source: editReservation?.source || 'phone',
    occasion: editReservation?.occasion || 'none',
    specialRequests: editReservation?.specialRequests || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => editReservation
      ? api.put(`/restaurant/reservations/${editReservation._id}`, data)
      : api.post('/restaurant/reservations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      toast.success(editReservation ? 'Reservation updated' : 'Reservation created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.customerName || !form.customerPhone) return toast.error('Name and phone required')
    const table = tables.find(t => t._id === form.tableId)
    mutation.mutate({ ...form, tableNumber: table?.tableNumber })
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
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{editReservation ? 'Edit Reservation' : 'New Reservation'}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Customer Name *</label>
                <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} className="input" placeholder="05xxxxxxxx" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Party Size</label>
                <input type="number" min="1" value={form.partySize} onChange={(e) => setForm({ ...form, partySize: Number(e.target.value) })} className="input" />
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Time</label>
                <select value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="select">
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Table</label>
                <select value={form.tableId} onChange={(e) => setForm({ ...form, tableId: e.target.value })} className="select">
                  <option value="">Auto-assign</option>
                  {tables.map(t => <option key={t._id} value={t._id}>Table {t.tableNumber} ({t.seats} seats)</option>)}
                </select>
              </div>
              <div>
                <label className="label">Source</label>
                <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="select">
                  <option value="phone">Phone</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="online">Online</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Occasion</label>
              <select value={form.occasion} onChange={(e) => setForm({ ...form, occasion: e.target.value })} className="select">
                <option value="none">None</option>
                <option value="birthday">Birthday</option>
                <option value="anniversary">Anniversary</option>
                <option value="business">Business</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Special Requests</label>
              <textarea value={form.specialRequests} onChange={(e) => setForm({ ...form, specialRequests: e.target.value })} className="input" rows={2} placeholder="High chair, window seat, etc." />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editReservation ? 'Update' : 'Create'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function RestaurantReservations() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [editReservation, setEditReservation] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reservations-dashboard', selectedDate],
    queryFn: () => api.get('/restaurant/reservations/dashboard', { params: { date: selectedDate } }).then(res => res.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/restaurant/reservations/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-dashboard'] })
      toast.success('Status updated')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/restaurant/reservations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations-dashboard'] })
      toast.success('Reservation deleted')
    },
  })

  const summary = data?.summary || {}
  const reservations = data?.reservations || []
  const tables = data?.tables || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'حجوزات الطاولات' : 'Table Reservations'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة الحجوزات وقائمة الانتظار' : 'Manage reservations and waitlist'}
          </p>
        </div>
        <button onClick={() => { setEditReservation(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'حجز جديد' : 'New Reservation'}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-gray-400" />
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input w-auto" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: summary.total || 0, color: 'from-blue-500 to-blue-600', icon: Calendar },
          { label: 'Confirmed', value: summary.confirmed || 0, color: 'from-emerald-500 to-emerald-600', icon: Check },
          { label: 'Seated', value: summary.seated || 0, color: 'from-violet-500 to-violet-600', icon: UserCheck },
          { label: 'Covers', value: summary.totalCovers || 0, color: 'from-amber-500 to-amber-600', icon: Users },
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

      {/* Reservations List */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {language === 'ar' ? 'الحجوزات' : 'Reservations'} — {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No reservations for this date</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {reservations.map(r => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.confirmed
              const Icon = cfg.icon
              return (
                <div key={r._id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-center w-14 flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{r.time}</p>
                      <p className="text-xs text-gray-400">{r.durationMinutes}m</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{r.customerName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Users className="w-3 h-3" /> {r.partySize}
                        <Phone className="w-3 h-3" /> {r.customerPhone}
                        {r.tableNumber && <span>· Table {r.tableNumber}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                      <Icon className="w-3 h-3" /> {cfg.label}
                    </span>
                    <select
                      value={r.status}
                      onChange={(e) => statusMutation.mutate({ id: r._id, status: e.target.value })}
                      className="select w-auto text-xs py-1"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="seated">Seated</option>
                      <option value="completed">Completed</option>
                      <option value="no_show">No Show</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="waitlist">Waitlist</option>
                    </select>
                    <button
                      onClick={() => { setEditReservation(r); setShowModal(true) }}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm('Delete this reservation?')) deleteMutation.mutate(r._id) }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && <ReservationModal tables={tables} onClose={() => { setShowModal(false); setEditReservation(null) }} editReservation={editReservation} />}
    </div>
  )
}
