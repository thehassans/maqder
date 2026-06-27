import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ruler, Plus, X, Loader2, Calendar, Phone, User, Clock,
  Check, Truck, AlertTriangle, Bell, Trash2, Edit3,
  ChevronDown, ChevronRight, Scissors, Package, MapPin,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const MEASUREMENT_FIELDS = [
  { key: 'length', label: 'Length' },
  { key: 'shoulderWidth', label: 'Shoulder Width' },
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'sleeveLength', label: 'Sleeve Length' },
  { key: 'bicep', label: 'Bicep' },
  { key: 'forearm', label: 'Forearm' },
  { key: 'neck', label: 'Neck' },
  { key: 'wrist', label: 'Wrist' },
  { key: 'cuffWidth', label: 'Cuff Width' },
  { key: 'expansion', label: 'Expansion' },
  { key: 'armhole', label: 'Armhole' },
  { key: 'bottom', label: 'Bottom' },
]

const THAWB_TYPES = [
  { value: 'saudi', label: 'Saudi' },
  { value: 'qatari', label: 'Qatari' },
  { value: 'emirati', label: 'Emirati' },
  { value: 'kuwaiti', label: 'Kuwaiti' },
  { value: 'omani', label: 'Omani' },
  { value: 'bahraini', label: 'Bahraini' },
  { value: 'noum', label: 'Noum' },
]

const FABRIC_COLORS = ['white', 'cream', 'offwhite', 'beige', 'grey', 'black', 'navy', 'brown']

const DELIVERY_STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Calendar },
  ready_for_pickup: { label: 'Ready for Pickup', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Check },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: X },
}

function MeasurementModal({ onClose, editProfile }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    customerId: editProfile?.customerId?._id || editProfile?.customerId || '',
    customerName: editProfile?.customerName || '',
    customerPhone: editProfile?.customerPhone || '',
    profileName: editProfile?.profileName || 'Self',
    relationType: editProfile?.relationType || 'self',
    defaultThawbType: editProfile?.defaultThawbType || 'saudi',
    defaultFabricColor: editProfile?.defaultFabricColor || 'white',
    notes: editProfile?.notes || '',
    measurements: editProfile?.measurements || {},
  })

  const mutation = useMutation({
    mutationFn: (data) => editProfile
      ? api.put(`/khayyat/measurements/measurements/${editProfile._id}`, data)
      : api.post('/khayyat/measurements/measurements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-profiles'] })
      toast.success(editProfile ? 'Profile updated' : 'Profile created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.customerName) return toast.error('Customer name required')
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
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700 sticky top-0 bg-white dark:bg-dark-800 z-10">
            <h3 className="font-semibold text-gray-900 dark:text-white">{editProfile ? 'Edit Measurement Profile' : 'New Measurement Profile'}</h3>
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
                <label className="label">Profile Name</label>
                <input value={form.profileName} onChange={(e) => setForm({ ...form, profileName: e.target.value })} className="input" placeholder="Self, Son, Father..." />
              </div>
              <div>
                <label className="label">Relation</label>
                <input value={form.relationType} onChange={(e) => setForm({ ...form, relationType: e.target.value })} className="input" placeholder="self, son, father..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Default Thawb Type</label>
                <select value={form.defaultThawbType} onChange={(e) => setForm({ ...form, defaultThawbType: e.target.value })} className="select">
                  {THAWB_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Default Fabric Color</label>
                <select value={form.defaultFabricColor} onChange={(e) => setForm({ ...form, defaultFabricColor: e.target.value })} className="select">
                  {FABRIC_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Measurements Grid */}
            <div className="border border-gray-200 dark:border-dark-600 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <Ruler className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Measurements (cm)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {MEASUREMENT_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-gray-500">{f.label}</label>
                    <input
                      type="number"
                      step="0.5"
                      value={form.measurements?.[f.key] ?? ''}
                      onChange={(e) => setForm({ ...form, measurements: { ...form.measurements, [f.key]: e.target.value ? Number(e.target.value) : null } })}
                      className="input text-sm py-1"
                      placeholder="—"
                    />
                  </div>
                ))}
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
              {editProfile ? 'Update' : 'Create'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function DeliveryModal({ readyStitchings, onClose, editDelivery }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    customerName: editDelivery?.customerName || '',
    customerPhone: editDelivery?.customerPhone || '',
    customerAddress: editDelivery?.customerAddress || '',
    scheduledDate: editDelivery?.scheduledDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    timeSlot: editDelivery?.timeSlot || 'Evening',
    deliveryMethod: editDelivery?.deliveryMethod || 'pickup',
    driverName: editDelivery?.driverName || '',
    driverPhone: editDelivery?.driverPhone || '',
    codAmount: editDelivery?.codAmount || 0,
    notes: editDelivery?.notes || '',
    items: editDelivery?.items || [],
  })
  const [selectedStitchings, setSelectedStitchings] = useState(new Set())

  const toggleStitching = (s) => {
    const next = new Set(selectedStitchings)
    if (next.has(s._id)) next.delete(s._id)
    else next.add(s._id)
    setSelectedStitchings(next)
    const items = readyStitchings.filter(rs => next.has(rs._id))
    setForm({ ...form, items: items.map(s => ({ stitchingId: s._id, receiptNumber: s.receiptNumber, thawbType: s.thawbType, fabricColor: s.fabricColor, quantity: s.quantity, price: s.price })) })
  }

  const mutation = useMutation({
    mutationFn: (data) => editDelivery
      ? api.put(`/khayyat/measurements/deliveries/${editDelivery._id}`, data)
      : api.post('/khayyat/measurements/deliveries', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['deliveries'] })
      toast.success(editDelivery ? 'Delivery updated' : 'Delivery scheduled')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.customerName) return toast.error('Customer name required')
    mutation.mutate({ ...form, codAmount: Number(form.codAmount) || 0 })
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
            <h3 className="font-semibold text-gray-900 dark:text-white">{editDelivery ? 'Edit Delivery' : 'Schedule Delivery'}</h3>
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

            <div>
              <label className="label">Address</label>
              <input value={form.customerAddress} onChange={(e) => setForm({ ...form, customerAddress: e.target.value })} className="input" placeholder="Delivery address" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Scheduled Date</label>
                <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Time Slot</label>
                <select value={form.timeSlot} onChange={(e) => setForm({ ...form, timeSlot: e.target.value })} className="select">
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                  <option value="10:00-12:00">10:00-12:00</option>
                  <option value="14:00-16:00">14:00-16:00</option>
                  <option value="16:00-18:00">16:00-18:00</option>
                  <option value="18:00-20:00">18:00-20:00</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Delivery Method</label>
                <select value={form.deliveryMethod} onChange={(e) => setForm({ ...form, deliveryMethod: e.target.value })} className="select">
                  <option value="pickup">Pickup</option>
                  <option value="delivery">Delivery</option>
                  <option value="courier">Courier</option>
                </select>
              </div>
              <div>
                <label className="label">COD Amount (SAR)</label>
                <input type="number" step="0.01" value={form.codAmount} onChange={(e) => setForm({ ...form, codAmount: e.target.value })} className="input" />
              </div>
            </div>

            {form.deliveryMethod !== 'pickup' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Driver Name</label>
                  <input value={form.driverName} onChange={(e) => setForm({ ...form, driverName: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Driver Phone</label>
                  <input value={form.driverPhone} onChange={(e) => setForm({ ...form, driverPhone: e.target.value })} className="input" />
                </div>
              </div>
            )}

            {/* Ready stitchings selection */}
            {readyStitchings.length > 0 && (
              <div>
                <label className="label">Ready Stitchings ({readyStitchings.length})</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-dark-600 rounded-lg divide-y divide-gray-100 dark:divide-dark-700">
                  {readyStitchings.map(s => (
                    <label key={s._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer">
                      <input type="checkbox" checked={selectedStitchings.has(s._id)} onChange={() => toggleStitching(s)} className="w-4 h-4 rounded" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.receiptNumber} — {s.customerName}</p>
                        <p className="text-xs text-gray-400 capitalize">{s.thawbType} · {s.fabricColor || 'N/A'} · {s.price} SAR</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700 sticky bottom-0 bg-white dark:bg-dark-800">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editDelivery ? 'Update' : 'Schedule'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function KhayyatMeasurements() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState('measurements')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showMeasModal, setShowMeasModal] = useState(false)
  const [showDelModal, setShowDelModal] = useState(false)
  const [editProfile, setEditProfile] = useState(null)
  const [editDelivery, setEditDelivery] = useState(null)
  const [expandedProfile, setExpandedProfile] = useState(null)

  const { data: profileData, isLoading: profLoading } = useQuery({
    queryKey: ['measurement-profiles'],
    queryFn: () => api.get('/khayyat/measurements/measurements', { params: { limit: 100 } }).then(res => res.data),
    enabled: activeView === 'measurements',
  })

  const { data: delDashData, isLoading: delLoading } = useQuery({
    queryKey: ['deliveries-dashboard', selectedDate],
    queryFn: () => api.get('/khayyat/measurements/deliveries/dashboard', { params: { date: selectedDate } }).then(res => res.data),
    enabled: activeView === 'deliveries',
  })

  const { data: readyStitchings = [] } = useQuery({
    queryKey: ['ready-stitchings'],
    queryFn: () => api.get('/khayyat/measurements/deliveries/ready-stitchings/list').then(res => res.data),
    enabled: activeView === 'deliveries',
  })

  const delStatusMutation = useMutation({
    mutationFn: ({ id, status, deliveredTo, failedReason }) => api.put(`/khayyat/measurements/deliveries/${id}/status`, { status, deliveredTo, failedReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-dashboard'] })
      toast.success('Status updated')
    },
  })

  const reminderMutation = useMutation({
    mutationFn: (id) => api.put(`/khayyat/measurements/deliveries/${id}/reminder`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-dashboard'] })
      toast.success('Reminder sent')
    },
  })

  const deleteProfileMutation = useMutation({
    mutationFn: (id) => api.delete(`/khayyat/measurements/measurements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['measurement-profiles'] })
      toast.success('Profile archived')
    },
  })

  const deleteDeliveryMutation = useMutation({
    mutationFn: (id) => api.delete(`/khayyat/measurements/deliveries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries-dashboard'] })
      toast.success('Delivery deleted')
    },
  })

  const profiles = profileData?.profiles || []
  const deliveries = delDashData?.deliveries || []
  const overdue = delDashData?.overdue || []
  const summary = delDashData?.summary || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'القياسات والتوصيل' : 'Measurements & Delivery'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'ملفات القياس وجدولة التوصيل' : 'Measurement profiles and delivery scheduling'}
          </p>
        </div>
        {activeView === 'measurements' ? (
          <button onClick={() => { setEditProfile(null); setShowMeasModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {language === 'ar' ? 'ملف قياس جديد' : 'New Profile'}
          </button>
        ) : (
          <button onClick={() => { setEditDelivery(null); setShowDelModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {language === 'ar' ? 'توصيل جديد' : 'New Delivery'}
          </button>
        )}
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'measurements', label: language === 'ar' ? 'ملفات القياس' : 'Measurement Profiles' },
          { id: 'deliveries', label: language === 'ar' ? 'التوصيل' : 'Delivery Schedule' },
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

      {/* Measurements View */}
      {activeView === 'measurements' && (
        <div className="space-y-4">
          {profLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
          ) : profiles.length === 0 ? (
            <div className="card p-8 text-center text-gray-400">
              <Ruler className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No measurement profiles yet</p>
            </div>
          ) : (
            profiles.map(p => {
              const isExpanded = expandedProfile === p._id
              const filledCount = Object.values(p.measurements || {}).filter(v => v != null).length
              return (
                <div key={p._id} className="card overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800"
                    onClick={() => setExpandedProfile(isExpanded ? null : p._id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-sm">
                        <Ruler className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{p.customerName}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{p.profileName}</span>
                          <span>· {filledCount} measurements</span>
                          {p.customerPhone && <><Phone className="w-3 h-3" /> {p.customerPhone}</>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 capitalize">{p.defaultThawbType} · {p.defaultFabricColor}</span>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-200 dark:border-dark-700 p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                        {MEASUREMENT_FIELDS.map(f => {
                          const val = p.measurements?.[f.key]
                          return (
                            <div key={f.key} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-800 rounded-lg">
                              <span className="text-xs text-gray-500">{f.label}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{val != null ? `${val}cm` : '—'}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* History */}
                      {p.history?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-500 mb-2">History ({p.history.length} entries)</p>
                          <div className="space-y-1">
                            {p.history.slice(-3).reverse().map((h, i) => (
                              <div key={i} className="text-xs text-gray-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {new Date(h.recordedAt).toLocaleDateString()} — {h.notes || 'Updated'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {p.notes && <p className="text-xs text-gray-500 mb-3">{p.notes}</p>}

                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditProfile(p); setShowMeasModal(true) }} className="btn btn-secondary btn-sm flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={() => { if (confirm('Archive this profile?')) deleteProfileMutation.mutate(p._id) }} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5" /> Archive
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Deliveries View */}
      {activeView === 'deliveries' && (
        <>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input w-auto" />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Today', value: summary.total || 0, color: 'from-blue-500 to-blue-600', icon: Calendar },
              { label: 'Ready', value: summary.readyForPickup || 0, color: 'from-cyan-500 to-cyan-600', icon: Package },
              { label: 'Delivered', value: summary.delivered || 0, color: 'from-emerald-500 to-emerald-600', icon: Check },
              { label: 'Overdue', value: summary.overdueCount || 0, color: 'from-red-500 to-red-600', icon: AlertTriangle },
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

          {/* Overdue */}
          {overdue.length > 0 && (
            <div className="card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">{overdue.length} Overdue Delivery{overdue.length > 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-1">
                {overdue.map(o => (
                  <div key={o._id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{o.deliveryNumber} — {o.customerName}</span>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 text-gray-400" /> {o.customerPhone}
                      <span className="text-red-600 dark:text-red-400 font-medium">{Math.ceil((new Date() - new Date(o.scheduledDate)) / (1000 * 60 * 60 * 24))}d overdue</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deliveries List */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-dark-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Deliveries — {new Date(selectedDate).toLocaleDateString()}</h3>
            </div>
            {delLoading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
            ) : deliveries.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No deliveries scheduled</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-dark-700">
                {deliveries.map(d => {
                  const cfg = DELIVERY_STATUS_CONFIG[d.status] || DELIVERY_STATUS_CONFIG.scheduled
                  const Icon = cfg.icon
                  return (
                    <div key={d._id} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg ${cfg.color}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{d.customerName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <span>{d.deliveryNumber}</span>
                              {d.timeSlot && <><Clock className="w-3 h-3" /> {d.timeSlot}</>}
                              {d.customerPhone && <><Phone className="w-3 h-3" /> {d.customerPhone}</>}
                              <span className="capitalize">· {d.deliveryMethod}</span>
                              {d.items?.length > 0 && <span>· {d.items.length} item{d.items.length > 1 ? 's' : ''}</span>}
                              {d.codAmount > 0 && <span className="text-amber-600 dark:text-amber-400">· COD {d.codAmount} SAR</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          <select
                            value={d.status}
                            onChange={(e) => {
                              if (e.target.value === 'delivered') {
                                const name = prompt('Delivered to?') || ''
                                delStatusMutation.mutate({ id: d._id, status: 'delivered', deliveredTo: name })
                              } else if (e.target.value === 'failed') {
                                const reason = prompt('Failure reason?') || ''
                                delStatusMutation.mutate({ id: d._id, status: 'failed', failedReason: reason })
                              } else {
                                delStatusMutation.mutate({ id: d._id, status: e.target.value })
                              }
                            }}
                            className="select w-auto text-xs py-1"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          {d.status === 'scheduled' && (
                            <button onClick={() => reminderMutation.mutate(d._id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700" title="Send reminder">
                              <Bell className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => { setEditDelivery(d); setShowDelModal(true) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('Delete?')) deleteDeliveryMutation.mutate(d._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Items */}
                      {d.items?.length > 0 && (
                        <div className="mt-2 ml-9 flex flex-wrap gap-1">
                          {d.items.map((item, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-dark-700 rounded text-gray-500">
                              {item.receiptNumber} · {item.quantity}x
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showMeasModal && <MeasurementModal onClose={() => { setShowMeasModal(false); setEditProfile(null) }} editProfile={editProfile} />}
      {showDelModal && <DeliveryModal readyStitchings={readyStitchings} onClose={() => { setShowDelModal(false); setEditDelivery(null) }} editDelivery={editDelivery} />}
    </div>
  )
}
