import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Save, X, RefreshCw } from 'lucide-react'
import api from '../../lib/api'
import { useAutoTranslate } from '../../hooks/useAutoTranslate'

const Field = ({ label, children, required }) => (
  <div className="space-y-1">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
    {children}
  </div>
)
const Input = (props) => (
  <input {...props} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
)
const Select = ({ children, ...props }) => (
  <select {...props} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">{children}</select>
)

const INIT = {
  fullName: '', fullNameAr: '', phoneNumber: '', alternativeMobile: '', email: '',
  nationality: 'SA', dateOfBirth: '',
  idType: 'national_id', iqamaId: '', idExpiry: '', idPhotoUrl: '', idPhotoBackUrl: '',
  licenseNumber: '', licenseExpiry: '', licensePhotoUrl: '', licenseIssuingCountry: 'SA',
  notes: '',
}

export default function CustomerForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [form, setForm] = useState(INIT)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const { translate, isTranslating } = useAutoTranslate()

  const fetchCustomer = useCallback(async () => {
    if (!isEdit) return
    setLoading(true)
    try {
      const { data } = await api.get(`/rental/customers/${id}`)
      setForm({
        fullName: data.fullName || '', fullNameAr: data.fullNameAr || '',
        phoneNumber: data.phoneNumber || '', alternativeMobile: data.alternativeMobile || '',
        email: data.email || '', nationality: data.nationality || 'SA',
        dateOfBirth: data.dateOfBirth?.split('T')[0] || '',
        idType: data.idType || 'national_id', iqamaId: data.iqamaId || '',
        idExpiry: data.idExpiry?.split('T')[0] || '', idPhotoUrl: data.idPhotoUrl || '', idPhotoBackUrl: data.idPhotoBackUrl || '',
        licenseNumber: data.licenseNumber || '', licenseExpiry: data.licenseExpiry?.split('T')[0] || '',
        licensePhotoUrl: data.licensePhotoUrl || '', licenseIssuingCountry: data.licenseIssuingCountry || 'SA',
        notes: data.notes || '',
      })
    } catch (_) { setError(t('Failed to load', 'فشل التحميل')) }
    finally { setLoading(false) }
  }, [id, isEdit])

  useEffect(() => { fetchCustomer() }, [fetchCustomer])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.fullName || !form.phoneNumber || !form.iqamaId) {
      return setError(t('Full Name, Mobile, and ID Number are required', 'الاسم والجوال ورقم الهوية مطلوبة'))
    }
    try {
      setSaving(true); setError('')
      if (isEdit) await api.put(`/rental/customers/${id}`, form)
      else await api.post('/rental/customers', form)
      navigate('/app/rental/customers')
    } catch (e) { setError(e.response?.data?.error || t('Save failed', 'فشل الحفظ')) }
    finally { setSaving(false) }
  }

  const section = (title) => (
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-3 mt-2 pb-1 border-b border-emerald-100 dark:border-emerald-900/30">{title}</p>
  )

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 w-56 bg-gray-200 dark:bg-dark-600 rounded" /><div className="h-96 bg-gray-200 dark:bg-dark-600 rounded-2xl" /></div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? t('Edit Customer', 'تعديل العميل') : t('New Customer', 'عميل جديد')}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/app/rental/customers')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2">
            <X className="w-4 h-4" /> {t('Cancel', 'إلغاء')}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-600/30">
            <Save className="w-4 h-4" /> {saving ? '...' : t('Save', 'حفظ')}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">{error}</div>}

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-5">
        {section(t('Personal Information', 'المعلومات الشخصية'))}
        <div className="grid grid-cols-2 gap-4 relative">
          {isTranslating && <div className="absolute top-0 right-0 -mt-6 text-emerald-600 flex items-center gap-1 text-xs"><RefreshCw className="w-3 h-3 animate-spin" /> {t('Translating...', 'جاري الترجمة...')}</div>}
          <Field label={t('Full Name (EN)', 'الاسم الكامل (إنج)')} required>
            <Input 
              value={form.fullName} 
              onChange={set('fullName')} 
              onBlur={async () => {
                if (form.fullName && !form.fullNameAr) {
                  const translated = await translate(form.fullName, 'en', 'ar');
                  if (translated) setForm(f => ({ ...f, fullNameAr: translated }));
                }
              }}
            />
          </Field>
          <Field label={t('Full Name (AR)', 'الاسم الكامل (ع)')}>
            <Input 
              value={form.fullNameAr} 
              onChange={set('fullNameAr')} 
              dir="rtl"
              onBlur={async () => {
                if (form.fullNameAr && !form.fullName) {
                  const translated = await translate(form.fullNameAr, 'ar', 'en');
                  if (translated) setForm(f => ({ ...f, fullName: translated }));
                }
              }}
            />
          </Field>
          <Field label={t('Mobile', 'الجوال')} required><Input type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+966 5X XXX XXXX" /></Field>
          <Field label={t('Alt. Mobile', 'جوال بديل')}><Input type="tel" value={form.alternativeMobile} onChange={set('alternativeMobile')} /></Field>
          <Field label={t('Email', 'البريد الإلكتروني')}><Input type="email" value={form.email} onChange={set('email')} /></Field>
          <Field label={t('Nationality', 'الجنسية')}><Input value={form.nationality} onChange={set('nationality')} placeholder="SA" /></Field>
          <Field label={t('Date of Birth', 'تاريخ الميلاد')}><Input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></Field>
        </div>

        {section(t('ID / Iqama', 'الهوية / الإقامة'))}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('ID Type', 'نوع الهوية')}>
            <Select value={form.idType} onChange={set('idType')}>
              <option value="national_id">{t('National ID', 'الهوية الوطنية')}</option>
              <option value="iqama">{t('Iqama', 'إقامة')}</option>
              <option value="passport">{t('Passport', 'جواز سفر')}</option>
              <option value="gcc_id">{t('GCC ID', 'هوية خليجية')}</option>
            </Select>
          </Field>
          <Field label={t('ID Number', 'رقم الهوية')} required><Input value={form.iqamaId} onChange={set('iqamaId')} /></Field>
          <Field label={t('ID Expiry', 'انتهاء الهوية')}><Input type="date" value={form.idExpiry} onChange={set('idExpiry')} /></Field>
          <Field label={t('ID Photo URL', 'رابط صورة الهوية')}><Input value={form.idPhotoUrl} onChange={set('idPhotoUrl')} placeholder="https://..." /></Field>
          <Field label={t('ID Back Photo URL', 'صورة الهوية (الخلفية)')}><Input value={form.idPhotoBackUrl} onChange={set('idPhotoBackUrl')} placeholder="https://..." /></Field>
        </div>

        {section(t('Driving License', 'رخصة القيادة'))}
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('License Number', 'رقم الرخصة')}><Input value={form.licenseNumber} onChange={set('licenseNumber')} /></Field>
          <Field label={t('Issuing Country', 'دولة الإصدار')}><Input value={form.licenseIssuingCountry} onChange={set('licenseIssuingCountry')} /></Field>
          <Field label={t('License Expiry', 'انتهاء الرخصة')}><Input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} /></Field>
          <Field label={t('License Photo URL', 'رابط صورة الرخصة')}><Input value={form.licensePhotoUrl} onChange={set('licensePhotoUrl')} placeholder="https://..." /></Field>
        </div>

        {section(t('Notes', 'ملاحظات'))}
        <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder={t('Internal notes...', 'ملاحظات داخلية...')}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
      </div>
    </div>
  )
}
