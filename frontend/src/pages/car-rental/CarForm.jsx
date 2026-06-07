import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Save, X, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'

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

const INITIAL_FORM = {
  make: '', model: '', year: new Date().getFullYear(), color: '', colorAr: '', vin: '',
  plateNumber: '', plateArabicLetters: '', plateEnglishLetters: '',
  status: 'AVAILABLE',
  currentOdometer: 0, nextOilChangeKm: '',
  insuranceExpiry: '', fahasExpiry: '', licenseExpiry: '',
  dailyRateDefault: '', hourlyLateRateDefault: '', perKmOverageRateDefault: '',
  allowedKmPerDayDefault: 200, securityDepositDefault: '',
  category: 'economy', notes: '',
}

export default function CarForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [form, setForm] = useState(INITIAL_FORM)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCar = useCallback(async () => {
    if (!isEdit) return
    setLoading(true)
    try {
      const { data } = await api.get(`/rental/cars/${id}`)
      setForm({
        make: data.make || '', model: data.model || '', year: data.year || new Date().getFullYear(),
        color: data.color || '', colorAr: data.colorAr || '', vin: data.vin || '',
        plateNumber: data.plateNumber || '', plateArabicLetters: data.plateArabicLetters || '', plateEnglishLetters: data.plateEnglishLetters || '',
        status: data.status || 'AVAILABLE',
        currentOdometer: data.currentOdometer || 0, nextOilChangeKm: data.nextOilChangeKm || '',
        insuranceExpiry: data.insuranceExpiry?.split('T')[0] || '',
        fahasExpiry: data.fahasExpiry?.split('T')[0] || '',
        licenseExpiry: data.licenseExpiry?.split('T')[0] || '',
        dailyRateDefault: data.dailyRateDefault || '',
        hourlyLateRateDefault: data.hourlyLateRateDefault || '',
        perKmOverageRateDefault: data.perKmOverageRateDefault || '',
        allowedKmPerDayDefault: data.allowedKmPerDayDefault ?? 200,
        securityDepositDefault: data.securityDepositDefault || '',
        category: data.category || 'economy', notes: data.notes || '',
      })
    } catch (_) { setError(t('Failed to load car data', 'فشل تحميل بيانات السيارة')) }
    finally { setLoading(false) }
  }, [id, isEdit])

  useEffect(() => { fetchCar() }, [fetchCar])

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSave = async () => {
    if (!form.make || !form.model || !form.plateNumber) {
      return setError(t('Make, Model, and Plate Number are required', 'المصنّع والموديل ورقم اللوحة مطلوبة'))
    }
    try {
      setSaving(true); setError('')
      if (isEdit) await api.put(`/rental/cars/${id}`, form)
      else await api.post('/rental/cars', form)
      navigate('/app/rental/fleet')
    } catch (e) { setError(e.response?.data?.error || t('Save failed', 'فشل الحفظ')) }
    finally { setSaving(false) }
  }

  // Days until date
  const daysUntil = (dateStr) => {
    if (!dateStr) return null
    return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  }

  const ExpiryBadge = ({ date }) => {
    const days = daysUntil(date)
    if (days == null) return null
    if (days <= 0) return <span className="text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t('Expired', 'منتهية')}</span>
    if (days <= 30) return <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{t(`Expires in ${days} days`, `تنتهي خلال ${days} يوم`)}</span>
    return null
  }

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-56" /><div className="h-96 bg-gray-200 dark:bg-dark-600 rounded-2xl" /></div>

  const section = (title) => (
    <div className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 mt-2 pb-1 border-b border-emerald-100 dark:border-emerald-900/30">{title}</div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isEdit ? t('Edit Car', 'تعديل السيارة') : t('Add Car', 'إضافة سيارة')}</h1>
        <div className="flex gap-2">
          <button onClick={() => navigate('/app/rental/fleet')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 flex items-center gap-2">
            <X className="w-4 h-4" /> {t('Cancel', 'إلغاء')}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-emerald-600/30">
            <Save className="w-4 h-4" /> {saving ? '...' : t('Save', 'حفظ')}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">{error}</div>}

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-5">
        {section(t('Vehicle Information', 'معلومات المركبة'))}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label={t('Make', 'المصنّع')} required><Input value={form.make} onChange={set('make')} placeholder="Toyota" /></Field>
          <Field label={t('Model', 'الموديل')} required><Input value={form.model} onChange={set('model')} placeholder="Camry" /></Field>
          <Field label={t('Year', 'السنة')}><Input type="number" value={form.year} onChange={set('year')} min="1990" max="2030" /></Field>
          <Field label={t('Color (EN)', 'اللون (إنج)')}><Input value={form.color} onChange={set('color')} placeholder="White" /></Field>
          <Field label={t('Color (AR)', 'اللون (ع)')}><Input value={form.colorAr} onChange={set('colorAr')} placeholder="أبيض" dir="rtl" /></Field>
          <Field label={t('Category', 'الفئة')}>
            <Select value={form.category} onChange={set('category')}>
              {['economy','compact','midsize','fullsize','suv','luxury','van','truck'].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <div className="col-span-2 md:col-span-3">
            <Field label="VIN"><Input value={form.vin} onChange={set('vin')} placeholder="Vehicle Identification Number" className="uppercase" /></Field>
          </div>
        </div>

        {section(t('Saudi Plate', 'اللوحة السعودية'))}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label={t('Plate Number', 'رقم اللوحة')} required><Input value={form.plateNumber} onChange={set('plateNumber')} placeholder="1234" /></Field>
          <Field label={t('Arabic Letters', 'الحروف العربية')}><Input value={form.plateArabicLetters} onChange={set('plateArabicLetters')} placeholder="أ ب ج" dir="rtl" /></Field>
          <Field label={t('English Letters', 'الحروف الإنجليزية')}><Input value={form.plateEnglishLetters} onChange={set('plateEnglishLetters')} placeholder="A B C" className="uppercase" /></Field>
        </div>

        {section(t('Status & Odometer', 'الحالة والعداد'))}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label={t('Status', 'الحالة')}>
            <Select value={form.status} onChange={set('status')}>
              {['AVAILABLE','RENTED','RESERVED','MAINTENANCE'].map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
          <Field label={t('Current Odometer (km)', 'العداد الحالي (كم)')}><Input type="number" value={form.currentOdometer} onChange={set('currentOdometer')} /></Field>
          <Field label={t('Next Oil Change (km)', 'تغيير الزيت التالي (كم)')}><Input type="number" value={form.nextOilChangeKm} onChange={set('nextOilChangeKm')} /></Field>
        </div>

        {section(t('Saudi Compliance Dates', 'تواريخ الامتثال'))}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t('Insurance Expiry', 'انتهاء التأمين')}>
            <Input type="date" value={form.insuranceExpiry} onChange={set('insuranceExpiry')} />
            <ExpiryBadge date={form.insuranceExpiry} />
          </Field>
          <Field label={t('Fahas (Inspection) Expiry', 'انتهاء الفحص')}>
            <Input type="date" value={form.fahasExpiry} onChange={set('fahasExpiry')} />
            <ExpiryBadge date={form.fahasExpiry} />
          </Field>
          <Field label={t('Registration (Istimara) Expiry', 'انتهاء الاستمارة')}>
            <Input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} />
            <ExpiryBadge date={form.licenseExpiry} />
          </Field>
        </div>

        {section(t('Default Pricing', 'التسعير الافتراضي'))}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Field label={t('Daily Rate (SAR)', 'السعر اليومي (ر.س)')}><Input type="number" value={form.dailyRateDefault} onChange={set('dailyRateDefault')} placeholder="250" /></Field>
          <Field label={t('Allowed KM/Day', 'KM المسموح/يوم')}><Input type="number" value={form.allowedKmPerDayDefault} onChange={set('allowedKmPerDayDefault')} placeholder="200" /></Field>
          <Field label={t('Per Extra KM (SAR)', 'السعر/كم إضافي')}><Input type="number" value={form.perKmOverageRateDefault} onChange={set('perKmOverageRateDefault')} placeholder="1.5" step="0.5" /></Field>
          <Field label={t('Hourly Late Rate (SAR)', 'سعر التأخير/ساعة')}><Input type="number" value={form.hourlyLateRateDefault} onChange={set('hourlyLateRateDefault')} placeholder="50" /></Field>
          <Field label={t('Security Deposit (SAR)', 'مبلغ الضمان')}><Input type="number" value={form.securityDepositDefault} onChange={set('securityDepositDefault')} placeholder="1000" /></Field>
        </div>

        {section(t('Notes', 'ملاحظات'))}
        <textarea value={form.notes} onChange={set('notes')} rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
      </div>
    </div>
  )
}
