import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Save, X, Plus, CheckCircle, DollarSign, FileText, AlertTriangle, Unlock } from 'lucide-react'
import api from '../../lib/api'

const MILESTONE_STATUS = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  billed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const CO_STATUS = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

const TABS = [
  { id: 'details', en: 'Details', ar: 'التفاصيل' },
  { id: 'milestones', en: 'Milestones', ar: 'المعالم' },
  { id: 'change_orders', en: 'Change Orders', ar: 'أوامر التغيير' },
  { id: 'notes', en: 'Notes', ar: 'ملاحظات' },
]

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
  </div>
)

const Input = (props) => (
  <input {...props} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
)

const Select = ({ children, ...props }) => (
  <select {...props} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">{children}</select>
)

export default function ContractForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { language } = useSelector(s => s.ui)
  const { user } = useSelector(s => s.auth)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [activeTab, setActiveTab] = useState('details')
  const [contract, setContract] = useState(null)
  const [form, setForm] = useState({
    title: '', titleAr: '', description: '', customerName: '', contractValue: '',
    currency: 'SAR', retentionPercent: 10, status: 'draft', notes: '',
    startDate: '', endDate: '', signedDate: '', project: ''
  })
  const [projects, setProjects] = useState([])
  const [milestoneForm, setMilestoneForm] = useState({ title: '', titleAr: '', description: '', dueDate: '', amount: '', notes: '' })
  const [coForm, setCoForm] = useState({ description: '', amount: '', notes: '' })
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    api.get('/projects', { params: { limit: 100 } }).then(r => setProjects(r.data.projects || [])).catch(() => {})
  }, [])

  const fetchContract = useCallback(async () => {
    if (!isEdit) return
    setLoading(true)
    try {
      const { data } = await api.get(`/contracts/${id}`)
      setContract(data)
      setForm({
        title: data.title || '', titleAr: data.titleAr || '', description: data.description || '',
        customerName: data.customerName || data.customer?.legalNameEn || '',
        contractValue: data.contractValue || '', currency: data.currency || 'SAR',
        retentionPercent: data.retentionPercent ?? 10, status: data.status || 'draft',
        notes: data.notes || '', startDate: data.startDate?.split('T')[0] || '',
        endDate: data.endDate?.split('T')[0] || '', signedDate: data.signedDate?.split('T')[0] || '',
        project: data.project?._id || data.project || ''
      })
    } catch (_) { setError(t('Failed to load contract', 'فشل في تحميل العقد')) }
    finally { setLoading(false) }
  }, [id, isEdit])

  useEffect(() => { fetchContract() }, [fetchContract])

  const handleSave = async () => {
    try {
      setSaving(true); setError('')
      const payload = { ...form }
      if (isEdit) { await api.put(`/contracts/${id}`, payload); await fetchContract() }
      else { const { data } = await api.post('/contracts', payload); navigate(`/app/dashboard/contracts/${data._id}`) }
    } catch (e) { setError(e.userMessage || t('Failed to save', 'فشل في الحفظ')) }
    finally { setSaving(false) }
  }

  const addMilestone = async () => {
    try {
      setActionLoading('add-milestone')
      await api.post(`/contracts/${id}/milestones`, milestoneForm)
      setMilestoneForm({ title: '', titleAr: '', description: '', dueDate: '', amount: '', notes: '' })
      await fetchContract()
    } catch (e) { setError(e.userMessage || '') }
    finally { setActionLoading(null) }
  }

  const completeMilestone = async (mid) => {
    try { setActionLoading(mid); await api.post(`/contracts/${id}/milestones/${mid}/complete`); await fetchContract() }
    catch (_) {} finally { setActionLoading(null) }
  }

  const billMilestone = async (mid) => {
    try { setActionLoading('bill-' + mid); await api.post(`/contracts/${id}/milestones/${mid}/bill`); await fetchContract() }
    catch (_) {} finally { setActionLoading(null) }
  }

  const addChangeOrder = async () => {
    try {
      setActionLoading('add-co')
      await api.post(`/contracts/${id}/change-orders`, coForm)
      setCoForm({ description: '', amount: '', notes: '' })
      await fetchContract()
    } catch (e) { setError(e.userMessage || '') }
    finally { setActionLoading(null) }
  }

  const updateCO = async (coId, data) => {
    try { setActionLoading('co-' + coId); await api.put(`/contracts/${id}/change-orders/${coId}`, data); await fetchContract() }
    catch (_) {} finally { setActionLoading(null) }
  }

  const releaseRetention = async () => {
    if (!window.confirm(t('Release retention money?', 'تأكيد إفراج الاستقطاع؟'))) return
    try { setActionLoading('retention'); await api.post(`/contracts/${id}/release-retention`); await fetchContract() }
    catch (_) {} finally { setActionLoading(null) }
  }

  const retentionAmount = ((parseFloat(form.contractValue) || 0) * (parseFloat(form.retentionPercent) || 0)) / 100

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-64" /><div className="h-96 bg-gray-200 dark:bg-dark-600 rounded-2xl" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? (contract?.contractNumber || t('Edit Contract', 'تعديل العقد')) : t('New Contract', 'عقد جديد')}
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/dashboard/contracts')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors flex items-center gap-2">
            <X className="w-4 h-4" /> {t('Cancel', 'إلغاء')}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? t('Saving...', '...') : t('Save', 'حفظ')}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">{error}</div>}

      {/* Retention release alert */}
      {isEdit && contract?.status === 'completed' && !contract?.retentionReleased && (
        <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">{t('Retention Money Pending Release', 'استقطاع معلق الإفراج')}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">{t(`SAR ${contract.retentionAmount?.toLocaleString()} held`, `${contract.retentionAmount?.toLocaleString()} ر.س محتجز`)}</p>
            </div>
          </div>
          <button onClick={releaseRetention} disabled={actionLoading === 'retention'}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Unlock className="w-4 h-4" /> {t('Release Retention', 'إفراج الاستقطاع')}
          </button>
        </div>
      )}

      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl w-fit">
        {TABS.map(tab => (
          <button key={tab.id} disabled={!isEdit && tab.id !== 'details'} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activeTab === tab.id ? 'bg-white dark:bg-dark-800 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'}`}>
            {isAr ? tab.ar : tab.en}
            {tab.id === 'milestones' && contract?.milestones?.length > 0 && <span className="ml-1.5 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 rounded-full px-1.5 py-0.5">{contract.milestones.length}</span>}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('Title (English)', 'العنوان (إنجليزي)')}><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></Field>
            <Field label={t('Title (Arabic)', 'العنوان (عربي)')}><Input value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))} dir="rtl" /></Field>
            <Field label={t('Customer Name', 'اسم العميل')}><Input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} /></Field>
            <Field label={t('Project', 'المشروع')}>
              <Select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}>
                <option value="">{t('None', 'لا يوجد')}</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.nameEn} ({p.code})</option>)}
              </Select>
            </Field>
            <Field label={t('Contract Value', 'قيمة العقد')}><Input type="number" value={form.contractValue} onChange={e => setForm(f => ({ ...f, contractValue: e.target.value }))} /></Field>
            <Field label={t('Retention %', 'الاستقطاع %')}><Input type="number" min="0" max="100" value={form.retentionPercent} onChange={e => setForm(f => ({ ...f, retentionPercent: e.target.value }))} /></Field>
            <div className="col-span-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                {t('Retention Amount', 'مبلغ الاستقطاع')}: <strong className="font-bold">{retentionAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {form.currency}</strong>
              </p>
            </div>
            <Field label={t('Status', 'الحالة')}>
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                {['draft', 'active', 'on_hold', 'completed', 'terminated'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </Select>
            </Field>
            <Field label={t('Currency', 'العملة')}>
              <Select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {['SAR', 'USD', 'EUR', 'AED'].map(c => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label={t('Start Date', 'تاريخ البدء')}><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></Field>
            <Field label={t('End Date', 'تاريخ الانتهاء')}><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></Field>
            <Field label={t('Signed Date', 'تاريخ التوقيع')}><Input type="date" value={form.signedDate} onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))} /></Field>
          </div>
          <Field label={t('Description', 'الوصف')}>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </Field>
        </motion.div>
      )}

      {/* Milestones Tab */}
      {activeTab === 'milestones' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('Add Milestone', 'إضافة معلم')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('Title', 'العنوان')}><Input value={milestoneForm.title} onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))} /></Field>
              <Field label={t('Amount (SAR)', 'المبلغ')}><Input type="number" value={milestoneForm.amount} onChange={e => setMilestoneForm(f => ({ ...f, amount: e.target.value }))} /></Field>
              <Field label={t('Due Date', 'تاريخ الاستحقاق')}><Input type="date" value={milestoneForm.dueDate} onChange={e => setMilestoneForm(f => ({ ...f, dueDate: e.target.value }))} /></Field>
              <Field label={t('Notes', 'ملاحظات')}><Input value={milestoneForm.notes} onChange={e => setMilestoneForm(f => ({ ...f, notes: e.target.value }))} /></Field>
            </div>
            <button onClick={addMilestone} disabled={actionLoading === 'add-milestone'}
              className="mt-3 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {t('Add Milestone', 'إضافة معلم')}
            </button>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 divide-y divide-gray-50 dark:divide-dark-700">
            {!contract?.milestones?.length ? (
              <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">{t('No milestones yet', 'لا توجد معالم بعد')}</div>
            ) : contract.milestones.map(m => (
              <div key={m._id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{m.title}</p>
                  {m.dueDate && <p className="text-xs text-gray-400 mt-0.5">{t('Due:', 'الاستحقاق:')} {new Date(m.dueDate).toLocaleDateString()}</p>}
                </div>
                <span className="font-semibold text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{m.amount?.toLocaleString()} {contract.currency}</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${MILESTONE_STATUS[m.status] || ''}`}>{m.status}</span>
                <div className="flex items-center gap-2">
                  {m.status === 'pending' || m.status === 'in_progress' ? (
                    <button onClick={() => completeMilestone(m._id)} disabled={actionLoading === m._id}
                      className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/40 flex items-center gap-1.5 disabled:opacity-50">
                      <CheckCircle className="w-3.5 h-3.5" /> {t('Complete', 'إتمام')}
                    </button>
                  ) : null}
                  {m.status === 'completed' ? (
                    <button onClick={() => billMilestone(m._id)} disabled={actionLoading === 'bill-' + m._id}
                      className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 text-xs font-medium hover:bg-purple-200 dark:hover:bg-purple-900/40 flex items-center gap-1.5 disabled:opacity-50">
                      <DollarSign className="w-3.5 h-3.5" /> {t('Bill', 'فوترة')}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Change Orders Tab */}
      {activeTab === 'change_orders' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {contract && (
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {t('Revised Contract Value:', 'القيمة المعدلة للعقد:')} <strong>{contract.revisedContractValue?.toLocaleString()} {contract.currency}</strong>
                {contract.totalChangeOrderValue !== 0 && (
                  <span className={`ml-3 font-medium ${contract.totalChangeOrderValue > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ({contract.totalChangeOrderValue > 0 ? '+' : ''}{contract.totalChangeOrderValue?.toLocaleString()})
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('Add Change Order', 'إضافة أمر تغيير')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label={t('Description', 'الوصف')}><Input value={coForm.description} onChange={e => setCoForm(f => ({ ...f, description: e.target.value }))} /></Field>
              </div>
              <Field label={t('Amount (SAR, +/-)', 'المبلغ (+/-)')}><Input type="number" value={coForm.amount} onChange={e => setCoForm(f => ({ ...f, amount: e.target.value }))} /></Field>
              <Field label={t('Notes', 'ملاحظات')}><Input value={coForm.notes} onChange={e => setCoForm(f => ({ ...f, notes: e.target.value }))} /></Field>
            </div>
            <button onClick={addChangeOrder} disabled={actionLoading === 'add-co'}
              className="mt-3 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              <Plus className="w-4 h-4" /> {t('Add Change Order', 'إضافة أمر تغيير')}
            </button>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 divide-y divide-gray-50 dark:divide-dark-700">
            {!contract?.changeOrders?.length ? (
              <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">{t('No change orders', 'لا توجد أوامر تغيير')}</div>
            ) : contract.changeOrders.map(co => (
              <div key={co._id} className="px-5 py-4 flex items-center gap-4">
                <span className="font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">{co.coNumber}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{co.description}</p>
                </div>
                <span className={`font-bold text-sm ${co.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {co.amount >= 0 ? '+' : ''}{co.amount?.toLocaleString()}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CO_STATUS[co.status] || ''}`}>{co.status}</span>
                {isAdmin && co.status === 'pending' && (
                  <div className="flex gap-2">
                    <button onClick={() => updateCO(co._id, { status: 'approved' })} disabled={actionLoading === 'co-' + co._id}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/40">
                      {t('Approve', 'قبول')}
                    </button>
                    <button onClick={() => updateCO(co._id, { status: 'rejected' })} disabled={actionLoading === 'co-' + co._id}
                      className="px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/40">
                      {t('Reject', 'رفض')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6">
          <Field label={t('Notes', 'ملاحظات')}>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={10}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </Field>
          <button onClick={handleSave} disabled={saving}
            className="mt-4 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? t('Saving...', '...') : t('Save Notes', 'حفظ')}
          </button>
        </motion.div>
      )}
    </div>
  )
}
