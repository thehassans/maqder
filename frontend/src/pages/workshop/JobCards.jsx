import { useState, useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Search, X, Save, Trash2, Car, User, Wrench,
  CheckCircle, AlertTriangle, Package, ChevronRight,
  ClipboardList, Droplets, Battery, Hammer, Calculator,
  ArrowRight, Ban, FileText
} from 'lucide-react'
import api from '../../lib/api'

const STAGES_EN = [
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
const STAGES_AR = [
  { id: 'checkin', label: 'تسجيل دخول', color: 'bg-gray-400' },
  { id: 'legal_verification', label: 'التحقق القانوني', color: 'bg-indigo-500' },
  { id: 'estimation', label: 'التقدير', color: 'bg-sky-500' },
  { id: 'waiting_approval', label: 'بانتظار الموافقة', color: 'bg-amber-500' },
  { id: 'approved', label: 'تمت الموافقة', color: 'bg-teal-500' },
  { id: 'in_progress', label: 'قيد التنفيذ', color: 'bg-blue-500' },
  { id: 'waiting_parts', label: 'بانتظار القطع', color: 'bg-orange-500' },
  { id: 'quality_control', label: 'مراقبة الجودة', color: 'bg-violet-500' },
  { id: 'ready_pickup', label: 'جاهز للاستلام', color: 'bg-green-500' },
  { id: 'invoiced', label: 'تمت الفوترة', color: 'bg-cyan-500' },
  { id: 'delivered', label: 'تم التسليم', color: 'bg-emerald-600' },
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

const FUEL_OPTS = [
  { value: 'empty', en: 'Empty', ar: 'فارغ' },
  { value: 'quarter', en: '1/4', ar: 'ربع' },
  { value: 'half', en: '1/2', ar: 'نصف' },
  { value: 'three_quarter', en: '3/4', ar: 'ثلاثة أرباع' },
  { value: 'full', en: 'Full', ar: 'ممتلئ' },
]

function initForm() {
  return {
    customerId: '', vehicleId: '',
    customerComplaints: '', reportedSymptoms: '',
    bayNumber: '', expectedCompletion: '',
    preInspection: { fuelLevel: '', existingScratches: [], personalBelongings: [], photos: [] },
    repairPermit: { required: false, permitNumber: '', verificationStatus: 'not_required' },
    assignedMechanics: [], partsUsed: [],
    laborTotal: 0, partsTotal: 0, subtotal: 0, vatRate: 15, vatAmount: 0, grandTotal: 0, discount: 0,
    notes: '',
  }
}

function computeTotals(form) {
  const labor = Array.isArray(form.assignedMechanics) ? form.assignedMechanics : []
  const parts = Array.isArray(form.partsUsed) ? form.partsUsed : []
  const laborTotal = labor.reduce((s, l) => s + ((l.actualHours || l.estimatedHours || 0) * (l.hourlyRate || 100)), 0)
  const partsTotal = parts.reduce((s, p) => s + ((p.quantity || 0) * (p.unitPrice || 0)), 0)
  const subtotal = laborTotal + partsTotal - (form.discount || 0)
  const vatRate = form.vatRate ?? 15
  const vatAmount = subtotal * (vatRate / 100)
  const grandTotal = subtotal + vatAmount
  return { laborTotal, partsTotal, subtotal, vatRate, vatAmount, grandTotal }
}

export default function JobCards() {
  const { language } = useSelector((state) => state.ui)
  const t = (en, ar) => language === 'ar' ? ar : en
  const STAGES = language === 'ar' ? STAGES_AR : STAGES_EN
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initForm())
  const [statusFilter, setStatusFilter] = useState('')
  const [activeTab, setActiveTab] = useState('info')
  const [partSearch, setPartSearch] = useState('')
  const [customerQuery, setCustomerQuery] = useState('')

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

  const { data: inventory = [] } = useQuery({
    queryKey: ['workshop-inventory', partSearch],
    queryFn: async () => {
      const params = partSearch ? `?search=${encodeURIComponent(partSearch)}` : ''
      const res = await api.get(`/workshop/inventory${params}`)
      return res.data
    },
    enabled: showModal && activeTab === 'parts',
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['workshop-customers', customerQuery],
    queryFn: async () => {
      const res = await api.get(`/workshop/customers/lookup?q=${encodeURIComponent(customerQuery)}`)
      return res.data
    },
    enabled: customerQuery.length > 1,
  })

  const transitionMut = useMutation({
    mutationFn: ({ id, status }) => api.post(`/workshop/job-cards/${id}/transition`, { status }),
    onSuccess: () => { toast.success(t('Status updated', 'تم تحديث الحالة')); qc.invalidateQueries({ queryKey: ['workshop-job-cards'] }) },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل')),
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/workshop/job-cards/${id}`),
    onSuccess: () => { toast.success(t('Deleted', 'تم الحذف')); qc.invalidateQueries({ queryKey: ['workshop-job-cards'] }) },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل')),
  })

  const updateForm = useCallback((updater) => {
    setForm(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      const totals = computeTotals(next)
      return { ...next, ...totals }
    })
  }, [])

  const openModal = (card) => {
    if (card) {
      setEditing(card)
      const merged = { ...initForm(), ...card }
      const totals = computeTotals(merged)
      setForm({ ...merged, ...totals })
    } else {
      setEditing(null)
      setForm(initForm())
    }
    setActiveTab('info')
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditing(null); setForm(initForm()); setActiveTab('info'); setPartSearch(''); setCustomerQuery('') }

  const saveMut = useMutation({
    mutationFn: () => editing
      ? api.put(`/workshop/job-cards/${editing._id}`, form)
      : api.post('/workshop/job-cards', form),
    onSuccess: () => { toast.success(editing ? t('Updated', 'تم التحديث') : t('Created', 'تم الإنشاء')); qc.invalidateQueries({ queryKey: ['workshop-job-cards'] }); closeModal() },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل')),
  })

  // ─── Labor helpers ───
  const addLabor = () => updateForm(f => ({
    ...f,
    assignedMechanics: [...(f.assignedMechanics || []), { taskDescription: '', estimatedHours: 1, actualHours: 0, hourlyRate: 100 }]
  }))
  const removeLabor = (idx) => updateForm(f => ({
    ...f,
    assignedMechanics: f.assignedMechanics.filter((_, i) => i !== idx)
  }))
  const setLaborField = (idx, field, value) => updateForm(f => {
    const list = [...f.assignedMechanics]
    list[idx] = { ...list[idx], [field]: value }
    return { ...f, assignedMechanics: list }
  })

  // ─── Parts helpers ───
  const addPart = (item) => {
    updateForm(f => ({
      ...f,
      partsUsed: [...(f.partsUsed || []), {
        inventoryItemId: item._id,
        partNumber: item.sku,
        description: item.name,
        quantity: 1,
        unitCost: item.costPrice || 0,
        unitPrice: item.sellingPrice || 0,
        isFromStock: true,
      }]
    }))
    setPartSearch('')
  }
  const removePart = (idx) => updateForm(f => ({
    ...f,
    partsUsed: f.partsUsed.filter((_, i) => i !== idx)
  }))
  const setPartField = (idx, field, value) => updateForm(f => {
    const list = [...f.partsUsed]
    list[idx] = { ...list[idx], [field]: value }
    return { ...f, partsUsed: list }
  })

  // ─── Pre-inspection helpers ───
  const addScratch = () => updateForm(f => ({
    ...f,
    preInspection: { ...f.preInspection, existingScratches: [...(f.preInspection.existingScratches || []), { description: '', location: '' }] }
  }))
  const removeScratch = (idx) => updateForm(f => ({
    ...f,
    preInspection: { ...f.preInspection, existingScratches: f.preInspection.existingScratches.filter((_, i) => i !== idx) }
  }))
  const setScratch = (idx, field, value) => updateForm(f => {
    const list = [...f.preInspection.existingScratches]
    list[idx] = { ...list[idx], [field]: value }
    return { ...f, preInspection: { ...f.preInspection, existingScratches: list } }
  })
  const addBelonging = () => updateForm(f => ({
    ...f,
    preInspection: { ...f.preInspection, personalBelongings: [...(f.preInspection.personalBelongings || []), { item: '', quantity: 1 }] }
  }))
  const removeBelonging = (idx) => updateForm(f => ({
    ...f,
    preInspection: { ...f.preInspection, personalBelongings: f.preInspection.personalBelongings.filter((_, i) => i !== idx) }
  }))
  const setBelonging = (idx, field, value) => updateForm(f => {
    const list = [...f.preInspection.personalBelongings]
    list[idx] = { ...list[idx], [field]: value }
    return { ...f, preInspection: { ...f.preInspection, personalBelongings: list } }
  })

  const stageGroups = useMemo(() =>
    STAGES.reduce((acc, s) => { acc[s.id] = cards.filter(c => c.status === s.id); return acc }, {}),
  [STAGES, cards])

  const totals = computeTotals(form)

  const tabs = [
    { id: 'info', label: t('Info', 'معلومات'), icon: ClipboardList },
    { id: 'inspection', label: t('Inspection', 'فحص'), icon: CheckCircle },
    { id: 'labor', label: t('Labor', 'العمالة'), icon: Hammer },
    { id: 'parts', label: t('Parts', 'القطع'), icon: Package },
    { id: 'financials', label: t('Totals', 'الإجمالي'), icon: Calculator },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Job Cards', 'بطاقات الإصلاح')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Manage repair orders and track vehicle status', 'إدارة أوامر الإصلاح ومتابعة حالة المركبات')}</p>
        </div>
        <button onClick={() => openModal(null)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('New Job Card', 'بطاقة إصلاح جديدة')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={t('Search job cards, vehicles...', 'البحث في بطاقات الإصلاح والمركبات...')}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
          <option value="">{t('All Statuses', 'جميع الحالات')}</option>
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
                        <button onClick={e => { e.stopPropagation(); if (window.confirm(t('Delete job card?', 'حذف بطاقة الإصلاح؟'))) deleteMut.mutate(card._id) }} className="text-gray-400 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">{card.vehicleId?.plateNumber || t('Unknown Vehicle', 'مركبة غير معروفة')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.customerId?.name || t('Unknown Customer', 'عميل غير معروف')}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{card.grandTotal?.toFixed?.(2) ?? '0.00'} SAR</span>
                        {NEXT_MAP[card.status] && (
                          <button
                            onClick={e => { e.stopPropagation(); transitionMut.mutate({ id: card._id, status: NEXT_MAP[card.status] }) }}
                            className="text-[10px] px-2 py-1 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100 font-medium"
                          >
                            {t('Move', 'نقل')} &rarr;
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
              className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? t('Edit Job Card', 'تعديل بطاقة الإصلاح') : t('New Job Card', 'بطاقة إصلاح جديدة')}</h3>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-2 border-b border-gray-100 dark:border-dark-700 overflow-x-auto">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        active ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-dark-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  )
                })}
              </div>

              <div className="p-5 space-y-4">
                {/* ── Info Tab ── */}
                {activeTab === 'info' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">{t('Customer', 'العميل')}</label>
                        <div className="relative">
                          <input
                            value={customerQuery}
                            onChange={e => setCustomerQuery(e.target.value)}
                            placeholder={t('Search customer...', 'البحث عن عميل...')}
                            className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm"
                          />
                          {customers.length > 0 && customerQuery.length > 1 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {customers.map(c => (
                                <button key={c._id} onClick={() => { setForm(f => ({ ...f, customerId: c._id })); setCustomerQuery(c.name); setForm(f => ({ ...f, customerId: c._id })) }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-700">
                                  {c.name} <span className="text-gray-400 text-xs">{c.phone}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {form.customerId && <p className="text-xs text-green-600 mt-1">{t('Customer linked', 'تم ربط العميل')}</p>}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">{t('Vehicle', 'المركبة')}</label>
                        <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
                          <option value="">{t('Select Vehicle', 'اختر مركبة')}</option>
                          {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.make} {v.model}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">{t('Bay Number', 'رقم الركن')}</label>
                        <input value={form.bayNumber} onChange={e => setForm(f => ({ ...f, bayNumber: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">{t('Expected Completion', 'تاريخ الانتهاء المتوقع')}</label>
                        <input type="date" value={form.expectedCompletion?.slice?.(0, 10) || ''} onChange={e => setForm(f => ({ ...f, expectedCompletion: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500">{t('Repair Permit Required?', 'هل يتطلب تصريح إصلاح؟')}</label>
                        <select value={form.repairPermit?.required ? 'true' : 'false'} onChange={e => updateForm(f => ({ ...f, repairPermit: { ...f.repairPermit, required: e.target.value === 'true' } }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
                          <option value="false">{t('No', 'لا')}</option>
                          <option value="true">{t('Yes (Bodywork)', 'نعم (أعمال هيكل)')}</option>
                        </select>
                      </div>
                      {form.repairPermit?.required && (
                        <div>
                          <label className="text-xs font-medium text-gray-500">{t('Permit Number', 'رقم التصريح')}</label>
                          <input value={form.repairPermit?.permitNumber || ''} onChange={e => updateForm(f => ({ ...f, repairPermit: { ...f.repairPermit, permitNumber: e.target.value } }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">{t('Customer Complaints', 'شكاوى العميل')}</label>
                      <textarea value={form.customerComplaints || ''} onChange={e => setForm(f => ({ ...f, customerComplaints: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500">{t('Notes', 'ملاحظات')}</label>
                      <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                    </div>
                  </div>
                )}

                {/* ── Inspection Tab ── */}
                {activeTab === 'inspection' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500">{t('Fuel Level', 'مستوى الوقود')}</label>
                        <select value={form.preInspection?.fuelLevel || ''} onChange={e => updateForm(f => ({ ...f, preInspection: { ...f.preInspection, fuelLevel: e.target.value } }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
                          <option value="">{t('Select', 'اختر')}</option>
                          {FUEL_OPTS.map(o => <option key={o.value} value={o.value}>{t(o.en, o.ar)}</option>)}
                        </select>
                      </div>
                      <div className="flex items-end gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 pb-2">
                          <input type="checkbox" checked={!!form.preInspection?.spareWheel} onChange={e => updateForm(f => ({ ...f, preInspection: { ...f.preInspection, spareWheel: e.target.checked } }))} />
                          {t('Spare Wheel', 'الإطار الاحتياطي')}
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 pb-2">
                          <input type="checkbox" checked={!!form.preInspection?.jackKit} onChange={e => updateForm(f => ({ ...f, preInspection: { ...f.preInspection, jackKit: e.target.checked } }))} />
                          {t('Jack Kit', 'عدة الرفع')}
                        </label>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-500">{t('Existing Scratches / Damage', 'الخدوش / الأضرار الموجودة')}</label>
                        <button onClick={addScratch} className="text-xs text-primary-600 hover:underline">{t('+ Add', '+ إضافة')}</button>
                      </div>
                      <div className="space-y-2">
                        {(form.preInspection?.existingScratches || []).map((sc, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={sc.location} onChange={e => setScratch(i, 'location', e.target.value)} placeholder={t('Location', 'الموقع')} className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs" />
                            <input value={sc.description} onChange={e => setScratch(i, 'description', e.target.value)} placeholder={t('Description', 'الوصف')} className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs" />
                            <button onClick={() => removeScratch(i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-500">{t('Personal Belongings', 'الممتلكات الشخصية')}</label>
                        <button onClick={addBelonging} className="text-xs text-primary-600 hover:underline">{t('+ Add', '+ إضافة')}</button>
                      </div>
                      <div className="space-y-2">
                        {(form.preInspection?.personalBelongings || []).map((b, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input value={b.item} onChange={e => setBelonging(i, 'item', e.target.value)} placeholder={t('Item', 'العنصر')} className="flex-1 px-3 py-1.5 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs" />
                            <input type="number" value={b.quantity} onChange={e => setBelonging(i, 'quantity', Number(e.target.value))} placeholder={t('Qty', 'الكمية')} className="w-20 px-3 py-1.5 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-xs" />
                            <button onClick={() => removeBelonging(i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Labor Tab ── */}
                {activeTab === 'labor' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{t('Mechanic Tasks', 'مهام الميكانيكي')}</h4>
                      <button onClick={addLabor} className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 font-medium">{t('+ Add Task', '+ إضافة مهمة')}</button>
                    </div>
                    <div className="space-y-2">
                      {(form.assignedMechanics || []).map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-dark-900 p-2 rounded-lg">
                          <div className="col-span-5">
                            <input value={item.taskDescription} onChange={e => setLaborField(i, 'taskDescription', e.target.value)} placeholder={t('Task description', 'وصف المهمة')} className="w-full px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-xs" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={item.estimatedHours} onChange={e => setLaborField(i, 'estimatedHours', Number(e.target.value))} placeholder={t('Est hrs', 'ساعات متوقعة')} className="w-full px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-xs" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={item.actualHours} onChange={e => setLaborField(i, 'actualHours', Number(e.target.value))} placeholder={t('Actual hrs', 'ساعات فعلية')} className="w-full px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-xs" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={item.hourlyRate} onChange={e => setLaborField(i, 'hourlyRate', Number(e.target.value))} placeholder={t('Rate', 'السعر')} className="w-full px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-xs" />
                          </div>
                          <div className="col-span-1 text-right">
                            <button onClick={() => removeLabor(i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                      {(!form.assignedMechanics || form.assignedMechanics.length === 0) && (
                        <div className="text-center text-gray-400 text-sm py-4">{t('No labor tasks added', 'لم تتم إضافة مهام عمالة')}</div>
                      )}
                    </div>
                    <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('Labor Total', 'إجمالي العمالة')}: {totals.laborTotal.toFixed(2)} SAR
                    </div>
                  </div>
                )}

                {/* ── Parts Tab ── */}
                {activeTab === 'parts' && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input value={partSearch} onChange={e => setPartSearch(e.target.value)} placeholder={t('Search inventory parts...', 'البحث في مخزون القطع...')} className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
                    </div>
                    {partSearch.length > 1 && inventory.length > 0 && (
                      <div className="border border-gray-200 dark:border-dark-700 rounded-lg max-h-32 overflow-y-auto">
                        {inventory.map(item => (
                          <button key={item._id} onClick={() => addPart(item)} className="w-full flex items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-dark-700 border-b border-gray-100 dark:border-dark-700 last:border-0">
                            <span>{item.sku} — {item.name}</span>
                            <span className="text-xs text-gray-500">{item.quantityOnHand} {t('in stock', 'متوفر')}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="space-y-2">
                      {(form.partsUsed || []).map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 dark:bg-dark-900 p-2 rounded-lg">
                          <div className="col-span-4">
                            <span className="text-xs text-gray-900 dark:text-white font-medium">{item.description}</span>
                            <span className="text-[10px] text-gray-500 block">{item.partNumber}</span>
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={item.quantity} onChange={e => setPartField(i, 'quantity', Number(e.target.value))} min={1} className="w-full px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-xs" />
                          </div>
                          <div className="col-span-2">
                            <input type="number" value={item.unitPrice} onChange={e => setPartField(i, 'unitPrice', Number(e.target.value))} className="w-full px-2 py-1.5 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded text-xs" />
                          </div>
                          <div className="col-span-3 text-xs text-gray-700 dark:text-gray-300 text-right">
                            {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)} SAR
                          </div>
                          <div className="col-span-1 text-right">
                            <button onClick={() => removePart(i)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                      {(!form.partsUsed || form.partsUsed.length === 0) && (
                        <div className="text-center text-gray-400 text-sm py-4">{t('No parts added', 'لم تتم إضافة قطع')}</div>
                      )}
                    </div>
                    <div className="text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('Parts Total', 'إجمالي القطع')}: {totals.partsTotal.toFixed(2)} SAR
                    </div>
                  </div>
                )}

                {/* ── Financials Tab ── */}
                {activeTab === 'financials' && (
                  <div className="space-y-4 max-w-md ms-auto">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('Labor Total', 'إجمالي العمالة')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{totals.laborTotal.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('Parts Total', 'إجمالي القطع')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{totals.partsTotal.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t('Discount', 'الخصم')}</span>
                      <input type="number" value={form.discount} onChange={e => updateForm(f => ({ ...f, discount: Number(e.target.value) }))} className="w-24 px-2 py-1 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-sm text-right" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('Subtotal', 'المجموع الفرعي')}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{totals.subtotal.toFixed(2)} SAR</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{t('VAT', 'ضريبة القيمة المضافة')}</span>
                      <div className="flex items-center gap-2">
                        <input type="number" value={form.vatRate} onChange={e => updateForm(f => ({ ...f, vatRate: Number(e.target.value) }))} className="w-16 px-2 py-1 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded text-sm text-right" />
                        <span className="text-gray-900 dark:text-white font-medium">{totals.vatAmount.toFixed(2)} SAR</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 dark:border-dark-700 pt-3 flex justify-between text-lg font-bold text-primary-600">
                      <span>{t('Grand Total', 'الإجمالي الكلي')}</span>
                      <span>{totals.grandTotal.toFixed(2)} SAR</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-100 dark:border-dark-700">
                <div className="text-xs text-gray-500">
                  {editing && <span>{t('Status', 'الحالة')}: {STAGES.find(s => s.id === editing.status)?.label}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">{t('Cancel', 'إلغاء')}</button>
                  <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                    <Save className="w-4 h-4" /> {saveMut.isPending ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
