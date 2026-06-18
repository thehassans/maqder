import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Search, Filter, MoreVertical, Wrench, CheckCircle,
  Clock, X, Save, Trash2, Car, User
} from 'lucide-react'
import api from '../../lib/api'

const STAGES = [
  { id: 'checkin', label: 'Check-In', color: 'bg-gray-400' },
  { id: 'legal_verification', label: 'Legal Verification', color: 'bg-indigo-500' },
  { id: 'estimation', label: 'Estimation', color: 'bg-sky-500' },
  { id: 'waiting_approval', label: 'Waiting Approval', color: 'bg-amber-500' },
  { id: 'approved', label: 'Approved', color: 'bg-teal-500' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
  { id: 'waiting_parts', label: 'Waiting Parts', color: 'bg-orange-500' },
  { id: 'quality_control', label: 'Quality Control', color: 'bg-violet-500' },
  { id: 'ready_pickup', label: 'Ready for Pickup', color: 'bg-green-500' },
  { id: 'invoiced', label: 'Invoiced', color: 'bg-cyan-500' },
  { id: 'delivered', label: 'Delivered', color: 'bg-emerald-600' },
]

const NEXT_MAP = {
  checkin: 'legal_verification',
  legal_verification: 'estimation',
  estimation: 'waiting_approval',
  waiting_approval: 'approved',
  approved: 'in_progress',
  in_progress: 'quality_control',
  waiting_parts: 'in_progress',
  quality_control: 'ready_pickup',
  ready_pickup: 'invoiced',
  invoiced: 'delivered',
}

function initForm() {
  return {
    customerId: '', vehicleId: '',
    customerComplaints: '', reportedSymptoms: '',
    bayNumber: '', expectedCompletion: '',
    preInspection: { fuelLevel: '', existingScratches: [], personalBelongings: [], photos: [] },
    repairPermit: { required: false, permitNumber: '', verificationStatus: 'not_required' },
    laborItems: [], partsItems: [],
    laborTotal: 0, partsTotal: 0, subtotal: 0, vatRate: 15, vatAmount: 0, grandTotal: 0, discount: 0,
    notes: '',
  }
}

export default function JobCards() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initForm())
  const [statusFilter, setStatusFilter] = useState('')

  const { data: cards = [] } = useQuery({
    queryKey: ['workshop-job-cards', statusFilter, search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)
      const res = await api.get(`/workshop/job-cards?${params}`)
      return res.data
    },
  })

  const { data: vehicles = [] } = useQuery({
    queryKey: ['workshop-vehicles'],
    queryFn: async () => (await api.get('/workshop/vehicles')).data,
  })

  const transitionMut = useMutation({
    mutationFn: ({ id, status }) => api.post(`/workshop/job-cards/${id}/transition`, { status }),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['workshop-job-cards'] }) },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/workshop/job-cards/${id}`),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['workshop-job-cards'] }) },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const openModal = (card) => {
    if (card) {
      setEditing(card)
      setForm({ ...initForm(), ...card })
    } else {
      setEditing(null)
      setForm(initForm())
    }
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(initForm()) }

  const saveMut = useMutation({
    mutationFn: () => editing
      ? api.put(`/workshop/job-cards/${editing._id}`, form)
      : api.post('/workshop/job-cards', form),
    onSuccess: () => { toast.success(editing ? 'Updated' : 'Created'); qc.invalidateQueries({ queryKey: ['workshop-job-cards'] }); closeModal() },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const stageGroups = STAGES.reduce((acc, s) => { acc[s.id] = cards.filter(c => c.status === s.id); return acc }, {})

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Job Cards</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage repair orders and track vehicle status</p>
        </div>
        <button onClick={() => openModal(null)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Job Card
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search job cards, vehicles..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
          <option value="">All Statuses</option>
          {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {STAGES.map(stage => (
            <div key={stage.id} className="w-72 flex-shrink-0">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-t-lg ${stage.color} text-white`}>
                <div className="w-2 h-2 rounded-full bg-white/80" />
                <span className="text-xs font-semibold uppercase tracking-wide">{stage.label}</span>
                <span className="ms-auto text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{stageGroups[stage.id]?.length ?? 0}</span>
              </div>
              <div className="bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 border-t-0 rounded-b-lg p-2 space-y-2 min-h-[120px]">
                <AnimatePresence>
                  {(stageGroups[stage.id] ?? []).map(card => (
                    <motion.div
                      key={card._id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-dark-700 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-dark-600 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openModal(card)}
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-bold text-primary-600">{card.jobCardNumber}</p>
                        <button onClick={e => { e.stopPropagation(); if (window.confirm('Delete job card?')) deleteMut.mutate(card._id) }} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{card.vehicleId?.plateNumber || 'Unknown Vehicle'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.customerId?.name || 'Unknown Customer'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{card.grandTotal?.toFixed?.(2) ?? '0.00'} SAR</span>
                        {NEXT_MAP[card.status] && (
                          <button
                            onClick={e => { e.stopPropagation(); transitionMut.mutate({ id: card._id, status: NEXT_MAP[card.status] }) }}
                            className="text-[10px] px-2 py-1 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium"
                          >
                            Move &rarr;
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? 'Edit Job Card' : 'New Job Card'}</h3>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Vehicle</label>
                    <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
                      <option value="">Select Vehicle</option>
                      {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Bay Number</label>
                    <input value={form.bayNumber} onChange={e => setForm(f => ({ ...f, bayNumber: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Expected Completion</label>
                    <input type="date" value={form.expectedCompletion} onChange={e => setForm(f => ({ ...f, expectedCompletion: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Repair Permit Required?</label>
                    <select value={form.repairPermit?.required ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, repairPermit: { ...f.repairPermit, required: e.target.value === 'true' } }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
                      <option value="false">No</option>
                      <option value="true">Yes (Bodywork)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Customer Complaints</label>
                  <textarea value={form.customerComplaints} onChange={e => setForm(f => ({ ...f, customerComplaints: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500">Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-dark-700">
                <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">Cancel</button>
                <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saveMut.isPending ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
