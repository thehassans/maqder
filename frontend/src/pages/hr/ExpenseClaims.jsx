import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, FileText, Clock, CheckCircle2, XCircle, Wallet,
  Trash2, Send, Check, X, Car, Utensils, Plane, Building, Phone,
  BookOpen, Coffee, Package, Calculator, ChevronDown, ChevronRight,
  TrendingUp, AlertCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Send },
  pending_approval: { label: 'Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  approved: { label: 'Approved', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  reimbursed: { label: 'Reimbursed', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', icon: Wallet },
}

const CATEGORY_ICONS = {
  travel: Plane, meals: Utensils, accommodation: Building, transport: Car,
  office_supplies: Package, client_entertainment: Coffee, training: BookOpen,
  mileage: Car, per_diem: Calculator, telecom: Phone, other: FileText,
}

const CATEGORIES = [
  { value: 'travel', label: 'Travel' },
  { value: 'meals', label: 'Meals' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'transport', label: 'Transport' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'client_entertainment', label: 'Client Entertainment' },
  { value: 'training', label: 'Training' },
  { value: 'mileage', label: 'Mileage (2.5 SAR/km)' },
  { value: 'per_diem', label: 'Per Diem' },
  { value: 'telecom', label: 'Telecom' },
  { value: 'other', label: 'Other' },
]

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </motion.div>
  )
}

function ClaimFormModal({ claim, onClose }) {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const isEdit = Boolean(claim?._id)

  const [form, setForm] = useState({
    employeeId: claim?.employeeId?._id || claim?.employeeId || '',
    title: claim?.title || '',
    description: claim?.description || '',
    expensePeriodFrom: claim?.expensePeriod?.from?.split('T')[0] || '',
    expensePeriodTo: claim?.expensePeriod?.to?.split('T')[0] || '',
    lines: claim?.lines?.length ? claim.lines : [{ category: 'other', description: '', date: '', amount: 0, taxAmount: 0, distanceKm: '', perDiemDays: '', perDiemType: 'domestic' }],
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-lookup'],
    queryFn: () => api.get('/employees', { params: { limit: 200, isActive: true } }).then(res => res.data.employees || res.data),
  })

  const saveMutation = useMutation({
    mutationFn: (data) => {
      const payload = {
        ...data,
        expensePeriod: {
          from: data.expensePeriodFrom || undefined,
          to: data.expensePeriodTo || undefined,
        },
      }
      delete payload.expensePeriodFrom
      delete payload.expensePeriodTo
      return isEdit
        ? api.put(`/expense-claims/${claim._id}`, payload)
        : api.post('/expense-claims', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] })
      queryClient.invalidateQueries({ queryKey: ['expense-claims-stats'] })
      toast.success(isEdit ? 'Claim updated' : 'Claim created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const submitMutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, submit: true, expensePeriod: { from: data.expensePeriodFrom || undefined, to: data.expensePeriodTo || undefined } }
      delete payload.expensePeriodFrom
      delete payload.expensePeriodTo
      return isEdit
        ? api.put(`/expense-claims/${claim._id}`, payload)
        : api.post('/expense-claims', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] })
      queryClient.invalidateQueries({ queryKey: ['expense-claims-stats'] })
      toast.success('Claim submitted for approval')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const addLine = () => {
    setForm({ ...form, lines: [...form.lines, { category: 'other', description: '', date: '', amount: 0, taxAmount: 0, distanceKm: '', perDiemDays: '', perDiemType: 'domestic' }] })
  }

  const removeLine = (idx) => {
    setForm({ ...form, lines: form.lines.filter((_, i) => i !== idx) })
  }

  const updateLine = (idx, field, value) => {
    const lines = [...form.lines]
    lines[idx] = { ...lines[idx], [field]: value }
    setForm({ ...form, lines })
  }

  const totalAmount = form.lines.reduce((sum, l) => {
    let amt = Number(l.amount || 0)
    if (l.category === 'mileage' && l.distanceKm) amt = Number(l.distanceKm) * 2.5
    if (l.category === 'per_diem' && l.perDiemDays) {
      const rates = { domestic: 200, gulf: 350, international: 500 }
      amt = Number(l.perDiemDays) * (rates[l.perDiemType] || 200)
    }
    return sum + amt + Number(l.taxAmount || 0)
  }, 0)

  const handleSave = () => {
    if (!form.employeeId) return toast.error('Select an employee')
    if (!form.title) return toast.error('Title is required')
    if (!form.lines.length) return toast.error('Add at least one line item')
    saveMutation.mutate(form)
  }

  const handleSubmit = () => {
    if (!form.employeeId) return toast.error('Select an employee')
    if (!form.title) return toast.error('Title is required')
    if (!form.lines.length) return toast.error('Add at least one line item')
    submitMutation.mutate(form)
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
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {isEdit ? `Edit ${claim.claimNumber}` : 'New Expense Claim'}
            </h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Employee *</label>
                <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} className="select">
                  <option value="">Select employee</option>
                  {(employees || []).map(emp => (
                    <option key={emp._id} value={emp._id}>
                      {emp.firstNameEn} {emp.lastNameEn} ({emp.employeeId})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Title *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" placeholder="e.g. Business trip to Riyadh" />
              </div>
              <div>
                <label className="label">Period From</label>
                <input type="date" value={form.expensePeriodFrom} onChange={(e) => setForm({ ...form, expensePeriodFrom: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Period To</label>
                <input type="date" value={form.expensePeriodTo} onChange={(e) => setForm({ ...form, expensePeriodTo: e.target.value })} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" rows={2} />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Expense Lines</label>
                <button onClick={addLine} className="btn btn-secondary btn-sm flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Line
                </button>
              </div>
              <div className="space-y-2">
                {form.lines.map((line, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-gray-200 dark:border-dark-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400">Line {idx + 1}</span>
                      {form.lines.length > 1 && (
                        <button onClick={() => removeLine(idx)} className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <label className="text-xs text-gray-400">Category</label>
                        <select value={line.category} onChange={(e) => updateLine(idx, 'category', e.target.value)} className="select text-sm">
                          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Description</label>
                        <input value={line.description} onChange={(e) => updateLine(idx, 'description', e.target.value)} className="input text-sm" placeholder="What was it for?" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400">Date</label>
                        <input type="date" value={line.date ? line.date.split('T')[0] : ''} onChange={(e) => updateLine(idx, 'date', e.target.value)} className="input text-sm" />
                      </div>
                      {line.category === 'mileage' ? (
                        <div>
                          <label className="text-xs text-gray-400">Distance (km)</label>
                          <input type="number" value={line.distanceKm || ''} onChange={(e) => updateLine(idx, 'distanceKm', e.target.value)} className="input text-sm" placeholder="0" />
                        </div>
                      ) : line.category === 'per_diem' ? (
                        <>
                          <div>
                            <label className="text-xs text-gray-400">Days</label>
                            <input type="number" value={line.perDiemDays || ''} onChange={(e) => updateLine(idx, 'perDiemDays', e.target.value)} className="input text-sm" placeholder="0" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400">Type</label>
                            <select value={line.perDiemType} onChange={(e) => updateLine(idx, 'perDiemType', e.target.value)} className="select text-sm">
                              <option value="domestic">Domestic (200/day)</option>
                              <option value="gulf">Gulf (350/day)</option>
                              <option value="international">International (500/day)</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="text-xs text-gray-400">Amount (SAR)</label>
                          <input type="number" value={line.amount || ''} onChange={(e) => updateLine(idx, 'amount', e.target.value)} className="input text-sm" placeholder="0.00" />
                        </div>
                      )}
                    </div>
                    {line.category !== 'mileage' && line.category !== 'per_diem' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-400">VAT Amount</label>
                          <input type="number" value={line.taxAmount || ''} onChange={(e) => updateLine(idx, 'taxAmount', e.target.value)} className="input text-sm" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-400">Receipt URL</label>
                          <input value={line.receiptUrl || ''} onChange={(e) => updateLine(idx, 'receiptUrl', e.target.value)} className="input text-sm" placeholder="https://..." />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-900/50 flex items-center justify-between">
                <span className="text-sm text-gray-500">Total Claim Amount</span>
                <span className="text-lg font-bold text-gray-900 dark:text-white">{totalAmount.toLocaleString()} SAR</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} disabled={saveMutation.isPending} className="btn btn-secondary flex items-center gap-1.5">
                {saveMutation.isPending ? <Clock className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Save Draft
              </button>
              <button onClick={handleSubmit} disabled={submitMutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
                {submitMutation.isPending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Submit for Approval
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function ClaimDetailModal({ claimId, onClose, onAction }) {
  const { data: claim, isLoading } = useQuery({
    queryKey: ['expense-claim', claimId],
    queryFn: () => api.get(`/expense-claims/${claimId}`).then(res => res.data),
    enabled: Boolean(claimId),
  })

  const [actionComment, setActionComment] = useState('')
  const [showActionBox, setShowActionBox] = useState(null)

  const statusConfig = claim ? STATUS_CONFIG[claim.status] : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{claim?.claimNumber || 'Expense Claim'}</h3>
              <p className="text-xs text-gray-500">{claim?.title}</p>
            </div>
            {statusConfig && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color} flex items-center gap-1`}>
                <statusConfig.icon className="w-3 h-3" /> {statusConfig.label}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : claim ? (
            <div className="flex-1 overflow-auto p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50">
                  <p className="text-xs text-gray-400">Employee</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{claim.employeeName}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50">
                  <p className="text-xs text-gray-400">Department</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{claim.department || '—'}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50">
                  <p className="text-xs text-gray-400">Total Amount</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{claim.totalAmount?.toLocaleString()} SAR</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-900/50">
                  <p className="text-xs text-gray-400">Submitted</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{new Date(claim.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {claim.description && (
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-900/50">
                  <p className="text-xs text-gray-400 mb-1">Description</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{claim.description}</p>
                </div>
              )}

              {/* Line Items */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Expense Lines</h4>
                <div className="space-y-2">
                  {claim.lines?.map((line, i) => {
                    const Icon = CATEGORY_ICONS[line.category] || FileText
                    return (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 dark:border-dark-700">
                        <Icon className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{line.description}</p>
                          <p className="text-xs text-gray-400">
                            {line.category.replace(/_/g, ' ')} · {line.date ? new Date(line.date).toLocaleDateString() : '—'}
                            {line.distanceKm ? ` · ${line.distanceKm} km` : ''}
                            {line.perDiemDays ? ` · ${line.perDiemDays} days` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{line.totalAmount?.toLocaleString()} SAR</p>
                          {line.taxAmount > 0 && <p className="text-xs text-gray-400">incl. {line.taxAmount} VAT</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Approval Trail */}
              {claim.approvalTrail?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Approval Trail</h4>
                  <div className="space-y-2">
                    {claim.approvalTrail.map((step, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {step.status === 'approved' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-gray-700 dark:text-gray-300">{step.approverName}</span>
                        <span className="text-xs text-gray-400">{new Date(step.actedAt).toLocaleDateString()}</span>
                        {step.comment && <span className="text-xs text-gray-400 italic">— "{step.comment}"</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Box */}
              {showActionBox && (
                <div className="p-3 rounded-xl border border-gray-200 dark:border-dark-700 space-y-2">
                  <textarea
                    value={actionComment}
                    onChange={(e) => setActionComment(e.target.value)}
                    className="input text-sm"
                    rows={2}
                    placeholder={showActionBox === 'approve' ? 'Approval comment (optional)' : 'Reason for rejection'}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setShowActionBox(null); setActionComment('') }} className="btn btn-secondary btn-sm">Cancel</button>
                    <button
                      onClick={() => onAction(showActionBox, claim._id, actionComment)}
                      className={`btn btn-sm ${showActionBox === 'approve' ? 'btn-action-dark' : 'btn-danger'}`}
                    >
                      Confirm {showActionBox === 'approve' ? 'Approve' : 'Reject'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {claim && ['submitted', 'pending_approval'].includes(claim.status) && !showActionBox && (
            <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
              <button onClick={() => setShowActionBox('reject')} className="btn btn-danger btn-sm flex items-center gap-1.5">
                <X className="w-4 h-4" /> Reject
              </button>
              <button onClick={() => setShowActionBox('approve')} className="btn btn-action-dark btn-sm flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Approve
              </button>
            </div>
          )}
          {claim && claim.status === 'approved' && (
            <div className="flex items-center justify-end p-4 border-t border-gray-200 dark:border-dark-700">
              <button onClick={() => onAction('reimburse', claim._id)} className="btn btn-action-dark btn-sm flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> Mark Reimbursed
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function ExpenseClaims() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editClaim, setEditClaim] = useState(null)
  const [detailClaim, setDetailClaim] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['expense-claims', page, search, statusFilter],
    queryFn: () => api.get('/expense-claims', { params: { page, search, limit: 25, status: statusFilter } }).then(res => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['expense-claims-stats'],
    queryFn: () => api.get('/expense-claims/stats').then(res => res.data),
  })

  const actionMutation = useMutation({
    mutationFn: ({ action, id, comment }) => {
      if (action === 'approve') return api.post(`/expense-claims/${id}/approve`, { comment })
      if (action === 'reject') return api.post(`/expense-claims/${id}/reject`, { comment })
      if (action === 'reimburse') return api.post(`/expense-claims/${id}/reimburse`, { method: 'payroll' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-claims'] })
      queryClient.invalidateQueries({ queryKey: ['expense-claims-stats'] })
      setDetailClaim(null)
      toast.success('Action completed')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const claims = data?.claims || []
  const totals = stats?.totals?.[0] || {}

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'مطالبات المصروفات' : 'Expense Claims'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة مصروفات الموظفين والموافقات' : 'Employee expense claims and approvals'}
          </p>
        </div>
        <button onClick={() => { setEditClaim(null); setShowForm(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'مطالبة جديدة' : 'New Claim'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label={language === 'ar' ? 'إجمالي المطالبات' : 'Total Claims'} value={totals.totalClaims || 0} color="from-primary-500 to-primary-600" delay={0} />
        <StatCard icon={Clock} label={language === 'ar' ? 'قيد الانتظار' : 'Pending'} value={totals.pendingCount || 0} color="from-amber-500 to-amber-600" delay={0.05} />
        <StatCard icon={CheckCircle2} label={language === 'ar' ? 'معتمدة' : 'Approved'} value={totals.approvedCount || 0} color="from-emerald-500 to-emerald-600" delay={0.1} />
        <StatCard icon={Wallet} label={language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'} value={`${(totals.totalAmount || 0).toLocaleString()} SAR`} color="from-violet-500 to-violet-600" delay={0.15} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="input pl-10"
            placeholder={language === 'ar' ? 'بحث...' : 'Search claims...'}
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="select w-auto">
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="reimbursed">Reimbursed</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>No expense claims found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Claim #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {claims.map((claim, i) => {
                  const config = STATUS_CONFIG[claim.status] || STATUS_CONFIG.draft
                  return (
                    <motion.tr
                      key={claim._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-dark-800 cursor-pointer transition-colors"
                      onClick={() => setDetailClaim(claim._id)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{claim.claimNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{claim.employeeName}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{claim.title}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">{claim.totalAmount?.toLocaleString()} SAR</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.color} flex items-center gap-1 w-fit`}>
                          <config.icon className="w-3 h-3" /> {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(claim.createdAt).toLocaleDateString()}</td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {data?.pagination && data.pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-dark-700">
            <span className="text-xs text-gray-400">Page {data.pagination.page} of {data.pagination.pages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary btn-sm disabled:opacity-50">Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages} className="btn btn-secondary btn-sm disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ClaimFormModal
          claim={editClaim}
          onClose={() => { setShowForm(false); setEditClaim(null) }}
        />
      )}
      {detailClaim && (
        <ClaimDetailModal
          claimId={detailClaim}
          onClose={() => setDetailClaim(null)}
          onAction={(action, id, comment) => actionMutation.mutate({ action, id, comment })}
        />
      )}
    </div>
  )
}
