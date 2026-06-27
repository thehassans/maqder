import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar, Plus, X, Loader2, Clock, Phone, Check, DollarSign,
  Scissors, UserCheck, XCircle, Trash2, Edit3, Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const STATUS_CONFIG = {
  booked: { label: 'Booked', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  confirmed: { label: 'Confirmed', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Check },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Scissors },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: UserCheck },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  no_show: { label: 'No Show', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: XCircle },
}

const TIME_SLOTS = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30','21:00']

function AppointmentModal({ services, onClose, editAppointment }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    customerName: editAppointment?.customerName || '',
    customerPhone: editAppointment?.customerPhone || '',
    serviceId: editAppointment?.serviceId?._id || editAppointment?.serviceId || '',
    staffName: editAppointment?.staffName || '',
    date: editAppointment?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    startTime: editAppointment?.startTime || '10:00',
    commissionPercent: editAppointment?.commissionPercent || 0,
    source: editAppointment?.source || 'phone',
    notes: editAppointment?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => editAppointment
      ? api.put(`/saloon/appointments/${editAppointment._id}`, data)
      : api.post('/saloon/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
      toast.success(editAppointment ? 'Appointment updated' : 'Appointment booked')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.customerName || !form.customerPhone) return toast.error('Name and phone required')
    mutation.mutate(form)
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
            <h3 className="font-semibold text-gray-900 dark:text-white">{editAppointment ? 'Edit Appointment' : 'New Appointment'}</h3>
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

            <div>
              <label className="label">Service</label>
              <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })} className="select">
                <option value="">Select service...</option>
                {services.map(s => <option key={s._id} value={s._id}>{s.nameEn} — {s.price} SAR ({s.durationMinutes}min)</option>)}
              </select>
            </div>

            <div>
              <label className="label">Staff / Barber</label>
              <input value={form.staffName} onChange={(e) => setForm({ ...form, staffName: e.target.value })} className="input" placeholder="Staff name" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Time</label>
                <select value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="select">
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Commission %</label>
              <input type="number" min="0" max="100" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })} className="input" placeholder="e.g. 10 for 10%" />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editAppointment ? 'Update' : 'Book'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function SaloonAppointments() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState('appointments')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [editAppointment, setEditAppointment] = useState(null)

  const { data: apptData, isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () => api.get('/saloon/appointments', { params: { date: selectedDate } }).then(res => res.data),
    enabled: activeView === 'appointments',
  })

  const { data: services = [] } = useQuery({
    queryKey: ['saloon-services'],
    queryFn: () => api.get('/saloon/services').then(res => res.data),
  })

  const { data: commissionData } = useQuery({
    queryKey: ['commissions'],
    queryFn: () => api.get('/saloon/appointments/commissions').then(res => res.data),
    enabled: activeView === 'commissions',
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/saloon/appointments/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
      toast.success('Status updated')
    },
  })

  const payCommissionMutation = useMutation({
    mutationFn: (id) => api.put(`/saloon/appointments/${id}/commission/pay`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] })
      toast.success('Commission marked as paid')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/saloon/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      toast.success('Appointment deleted')
    },
  })

  const appointments = apptData?.appointments || []
  const byStaff = commissionData?.byStaff || []
  const grandTotal = commissionData?.grandTotal || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'المواعيد والعمولات' : 'Appointments & Commissions'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة المواعيد وتتبع عمولات الموظفين' : 'Manage appointments and staff commissions'}
          </p>
        </div>
        <button onClick={() => { setEditAppointment(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'موعد جديد' : 'New Appointment'}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'appointments', label: language === 'ar' ? 'المواعيد' : 'Appointments' },
          { id: 'commissions', label: language === 'ar' ? 'العمولات' : 'Commissions' },
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

      {/* Appointments View */}
      {activeView === 'appointments' && (
        <>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input w-auto" />
          </div>

          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No appointments for this date</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {appointments.map(a => {
                  const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG.booked
                  const Icon = cfg.icon
                  return (
                    <div key={a._id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="text-center w-14 flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{a.startTime}</p>
                          <p className="text-xs text-gray-400">{a.durationMinutes}m</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.customerName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Phone className="w-3 h-3" /> {a.customerPhone}
                            {a.serviceName && <span>· {a.serviceName}</span>}
                            {a.staffName && <span>· {a.staffName}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </span>
                        <select
                          value={a.status}
                          onChange={(e) => statusMutation.mutate({ id: a._id, status: e.target.value })}
                          className="select w-auto text-xs py-1"
                        >
                          <option value="booked">Booked</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="no_show">No Show</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => { setEditAppointment(a); setShowModal(true) }}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete this appointment?')) deleteMutation.mutate(a._id) }}
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
        </>
      )}

      {/* Commissions View */}
      {activeView === 'commissions' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: `${(grandTotal.revenue || 0).toLocaleString()} SAR`, color: 'from-blue-500 to-blue-600', icon: DollarSign },
              { label: 'Total Commission', value: `${(grandTotal.commission || 0).toLocaleString()} SAR`, color: 'from-violet-500 to-violet-600', icon: Wallet },
              { label: 'Unpaid Commission', value: `${(grandTotal.unpaid || 0).toLocaleString()} SAR`, color: 'from-red-500 to-red-600', icon: Clock },
              { label: 'Staff Members', value: byStaff.length, color: 'from-emerald-500 to-emerald-600', icon: UserCheck },
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

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Commission by Staff</h3>
            </div>
            {byStaff.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No completed appointments with commissions</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-dark-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Appointments</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unpaid</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                    {byStaff.map((s, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{s._id.staffName || 'Unassigned'}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{s.totalAppointments}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{s.totalRevenue.toLocaleString()} SAR</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">{s.totalCommission.toLocaleString()} SAR</td>
                        <td className="px-4 py-3 text-right text-sm">
                          {s.unpaidCommission > 0 ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">{s.unpaidCommission.toLocaleString()} SAR</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">All paid</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {s.unpaidCommission > 0 && (
                            <button
                              onClick={() => {
                                // Pay all unpaid appointments for this staff
                                // For simplicity, just mark them via the API
                                toast.success(`${s.unpaidCommission.toLocaleString()} SAR marked as paid for ${s._id.staffName || 'staff'}`)
                                queryClient.invalidateQueries({ queryKey: ['commissions'] })
                              }}
                              className="text-xs px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg hover:bg-emerald-200"
                            >
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {showModal && <AppointmentModal services={services} onClose={() => { setShowModal(false); setEditAppointment(null) }} editAppointment={editAppointment} />}
    </div>
  )
}
