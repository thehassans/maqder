import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { Plus, X, Save, Trash2, Users, PhoneCall, Mail, FileText, CheckCircle } from 'lucide-react'
import api from '../../lib/api'

const AT = [
  { id: 'call', label: 'Call', icon: PhoneCall, ar: 'مكالمة' }, { id: 'meeting', label: 'Meeting', icon: Users, ar: 'اجتماع' },
  { id: 'email', label: 'Email', icon: Mail, ar: 'بريد' }, { id: 'note', label: 'Note', icon: FileText, ar: 'ملاحظة' },
  { id: 'task', label: 'Task', icon: CheckCircle, ar: 'مهمة' }, { id: 'whatsapp', label: 'WhatsApp', icon: PhoneCall, ar: 'واتساب' },
]
const iA = () => ({ type: 'call', subject: '', description: '', leadId: '', dealId: '', customerId: '', dueDate: '' })

export default function CRMActivitiesTab({ preview }) {
  const { language } = useSelector((state) => state.ui)
  const t = (en, ar) => language === 'ar' ? ar : en
  const qc = useQueryClient()
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(iA())

  const { data: ad = {} } = useQuery({ queryKey: ['crm-activities'], queryFn: async () => (await api.get('/crm/activities')).data })
  const activities = ad.activities || []

  const save = useMutation({
    mutationFn: () => editing ? api.put(`/crm/activities/${editing._id}`, form) : api.post('/crm/activities', form),
    onSuccess: () => { toast.success(editing ? t('Updated', 'تم التحديث') : t('Created', 'تم الإنشاء')); qc.invalidateQueries({ queryKey: ['crm-activities', 'crm-stats'] }); close() },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل'))
  })
  const del = useMutation({
    mutationFn: (id) => api.delete(`/crm/activities/${id}`),
    onSuccess: () => { toast.success(t('Deleted', 'تم الحذف')); qc.invalidateQueries({ queryKey: ['crm-activities'] }) },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل'))
  })

  const close = () => { setShow(false); setEditing(null); setForm(iA()) }
  const open = (a) => { if (a) { setEditing(a); setForm({ ...iA(), ...a }) } else { setEditing(null); setForm(iA()) } setShow(true) }

  const F = ({ l: label, t: type = 'text', v, onChange, p = '', r = 0, o = null }) => (
    <div>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {r ? <textarea value={v} onChange={onChange} rows={r} placeholder={p} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
        : o ? <select value={v} onChange={onChange} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">{o}</select>
          : <input type={type} value={v} onChange={onChange} placeholder={p} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />}
    </div>
  )

  const list = preview ? activities.slice(0, 5) : activities

  return (
    <div className="space-y-3">
      {!preview && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('Activities', 'الأنشطة')}</h3>
          <button onClick={() => open(null)} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-xs font-medium hover:bg-primary-700 flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> {t('New Activity', 'نشاط جديد')}</button>
        </div>
      )}
      {preview && <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('Recent Activities', 'أحدث الأنشطة')}</h3>}
      <div className="space-y-2">
        {list.map(a => { const atype = AT.find(t => t.id === a.type) || AT[3]; const AIcon = atype.icon; return (
          <motion.div key={a._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-dark-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-dark-700 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0"><AIcon className="w-4 h-4 text-primary-600" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-900 dark:text-white">{a.subject}</p><span className="text-[10px] text-gray-500">{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : ''}</span></div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.description || '-'}</p>
            </div>
            {!preview && (
              <div className="flex items-center gap-2">
                <button onClick={() => open(a)} className="text-gray-400 hover:text-primary-600"><FileText className="w-3.5 h-3.5" /></button>
                <button onClick={() => { if (window.confirm(t('Delete activity?', 'حذف النشاط؟'))) del.mutate(a._id) }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            )}
          </motion.div>
        )})}
        {list.length === 0 && <div className="text-center text-gray-400 text-sm py-8">{t('No activities yet', 'لا توجد أنشطة بعد')}</div>}
      </div>

      <AnimatePresence>
        {show && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={close}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? t('Edit Activity', 'تعديل نشاط') : t('New Activity', 'نشاط جديد')}</h3>
                <button onClick={close} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <F l={t('Type', 'النوع')} o={AT.map(s => <option key={s.id} value={s.id}>{t(s.label, s.ar)}</option>)} v={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} />
                  <F l={t('Subject', 'الموضوع')} v={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                  <F l={t('Due Date', 'تاريخ الاستحقاق')} type="date" v={form.dueDate?.slice?.(0, 10) || ''} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                  <div className="sm:col-span-2"><F l={t('Description', 'الوصف')} r={2} v={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-dark-700">
                <button onClick={close} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">{t('Cancel', 'إلغاء')}</button>
                <button onClick={() => save.mutate()} disabled={save.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"><Save className="w-4 h-4" /> {save.isPending ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
