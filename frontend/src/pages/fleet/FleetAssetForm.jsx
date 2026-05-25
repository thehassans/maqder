import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Save, X, Fuel, Wrench, Plus, Trash2, ChevronDown } from 'lucide-react'
import api from '../../lib/api'

const TABS = [
  { id: 'general', en: 'General', ar: 'عام' },
  { id: 'fuel', en: 'Fuel Logs', ar: 'سجلات الوقود' },
  { id: 'maintenance', en: 'Maintenance', ar: 'الصيانة' },
]

const MAINTENANCE_STATUS = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

const Field = ({ label, children }) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
    {children}
  </div>
)

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
  />
)

const Select = ({ children, ...props }) => (
  <select
    {...props}
    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
  >
    {children}
  </select>
)

export default function FleetAssetForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [activeTab, setActiveTab] = useState('general')
  const [form, setForm] = useState({
    assetType: 'vehicle', fuelType: 'diesel', meterUnit: 'km',
    status: 'active', name: '', nameAr: '', make: '', model: '',
    year: '', registrationNumber: '', chassisNumber: '', engineNumber: '',
    color: '', department: '', currentMeterReading: '', purchaseCost: '',
    currentValue: '', insuranceProvider: '', insurancePolicyNumber: '',
    notes: '', assignedProject: ''
  })
  const [projects, setProjects] = useState([])
  const [fuelLogs, setFuelLogs] = useState([])
  const [maintenance, setMaintenance] = useState([])
  const [fuelForm, setFuelForm] = useState({ date: '', liters: '', costPerLiter: '', odometerReading: '', fuelStation: '', notes: '' })
  const [maintenanceForm, setMaintenanceForm] = useState({ maintenanceType: 'scheduled', description: '', date: '', vendor: '', partsCost: '', laborCost: '', nextServiceDate: '', nextServiceMeter: '', alertDaysBefore: 7 })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/projects', { params: { limit: 100 } }).then(r => setProjects(r.data.projects || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!isEdit) return
    setLoading(true)
    api.get(`/fleet/${id}`)
      .then(({ data }) => {
        setForm({ ...data.asset })
        setFuelLogs(data.recentFuelLogs || [])
        setMaintenance(data.recentMaintenance || [])
      })
      .catch(() => setError(t('Failed to load asset', 'فشل في تحميل الأصل')))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError('')
      const payload = { ...form }
      if (isEdit) {
        await api.put(`/fleet/${id}`, payload)
      } else {
        await api.post('/fleet', payload)
      }
      navigate('/app/dashboard/fleet')
    } catch (e) {
      setError(e.userMessage || t('Failed to save', 'فشل في الحفظ'))
    } finally {
      setSaving(false)
    }
  }

  const addFuelLog = async () => {
    try {
      const total = parseFloat(fuelForm.liters) * parseFloat(fuelForm.costPerLiter)
      await api.post(`/fleet/${id}/fuel-logs`, { ...fuelForm, totalCost: total })
      const { data } = await api.get(`/fleet/${id}`)
      setFuelLogs(data.recentFuelLogs || [])
      setFuelForm({ date: '', liters: '', costPerLiter: '', odometerReading: '', fuelStation: '', notes: '' })
    } catch (e) {
      setError(e.userMessage || t('Failed to add fuel log', 'فشل في إضافة سجل الوقود'))
    }
  }

  const addMaintenance = async () => {
    try {
      const cost = (parseFloat(maintenanceForm.partsCost) || 0) + (parseFloat(maintenanceForm.laborCost) || 0)
      await api.post(`/fleet/${id}/maintenance`, { ...maintenanceForm, cost })
      const { data } = await api.get(`/fleet/${id}`)
      setMaintenance(data.recentMaintenance || [])
      setMaintenanceForm({ maintenanceType: 'scheduled', description: '', date: '', vendor: '', partsCost: '', laborCost: '', nextServiceDate: '', nextServiceMeter: '', alertDaysBefore: 7 })
    } catch (e) {
      setError(e.userMessage || t('Failed to add maintenance', 'فشل في إضافة سجل الصيانة'))
    }
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-dark-600 rounded w-64" />
      <div className="h-64 bg-gray-200 dark:bg-dark-600 rounded-2xl" />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isEdit ? t('Edit Asset', 'تعديل الأصل') : t('New Asset', 'أصل جديد')}
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/dashboard/fleet')} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors flex items-center gap-2">
            <X className="w-4 h-4" /> {t('Cancel', 'إلغاء')}
          </button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? t('Saving...', 'جارٍ الحفظ...') : t('Save', 'حفظ')}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">{error}</div>}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            disabled={!isEdit && tab.id !== 'general'}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${activeTab === tab.id ? 'bg-white dark:bg-dark-800 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
          >
            {isAr ? tab.ar : tab.en}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('Name (English)', 'الاسم (إنجليزي)')}>
              <Input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Asset name" />
            </Field>
            <Field label={t('Name (Arabic)', 'الاسم (عربي)')}>
              <Input value={form.nameAr || ''} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} placeholder="اسم الأصل" dir="rtl" />
            </Field>
            <Field label={t('Asset Type', 'نوع الأصل')}>
              <Select value={form.assetType} onChange={e => setForm(f => ({ ...f, assetType: e.target.value }))}>
                <option value="vehicle">{t('Vehicle', 'مركبة')}</option>
                <option value="heavy_equipment">{t('Heavy Equipment', 'معدات ثقيلة')}</option>
                <option value="light_equipment">{t('Light Equipment', 'معدات خفيفة')}</option>
                <option value="generator">{t('Generator', 'مولد')}</option>
                <option value="other">{t('Other', 'أخرى')}</option>
              </Select>
            </Field>
            <Field label={t('Status', 'الحالة')}>
              <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="active">{t('Active', 'نشط')}</option>
                <option value="in_maintenance">{t('In Maintenance', 'في الصيانة')}</option>
                <option value="retired">{t('Retired', 'متقاعد')}</option>
                <option value="sold">{t('Sold', 'مباع')}</option>
              </Select>
            </Field>
            <Field label={t('Make', 'الصانع')}><Input value={form.make || ''} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} /></Field>
            <Field label={t('Model', 'الموديل')}><Input value={form.model || ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></Field>
            <Field label={t('Year', 'السنة')}><Input type="number" value={form.year || ''} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} /></Field>
            <Field label={t('Registration Number', 'رقم التسجيل')}><Input value={form.registrationNumber || ''} onChange={e => setForm(f => ({ ...f, registrationNumber: e.target.value }))} /></Field>
            <Field label={t('Registration Expiry', 'انتهاء التسجيل')}><Input type="date" value={form.registrationExpiry ? form.registrationExpiry.split('T')[0] : ''} onChange={e => setForm(f => ({ ...f, registrationExpiry: e.target.value }))} /></Field>
            <Field label={t('Fuel Type', 'نوع الوقود')}>
              <Select value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}>
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="electric">Electric</option>
                <option value="hybrid">Hybrid</option>
                <option value="gas">Gas</option>
              </Select>
            </Field>
            <Field label={t('Meter Reading', 'قراءة العداد')}><Input type="number" value={form.currentMeterReading || ''} onChange={e => setForm(f => ({ ...f, currentMeterReading: e.target.value }))} /></Field>
            <Field label={t('Meter Unit', 'وحدة العداد')}>
              <Select value={form.meterUnit} onChange={e => setForm(f => ({ ...f, meterUnit: e.target.value }))}>
                <option value="km">km</option>
                <option value="hours">hours</option>
              </Select>
            </Field>
            <Field label={t('Department', 'القسم')}><Input value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} /></Field>
            <Field label={t('Assigned Project', 'المشروع المعيّن')}>
              <Select value={form.assignedProject || ''} onChange={e => setForm(f => ({ ...f, assignedProject: e.target.value }))}>
                <option value="">{t('None', 'لا يوجد')}</option>
                {projects.map(p => <option key={p._id} value={p._id}>{p.nameEn} ({p.code})</option>)}
              </Select>
            </Field>
            <Field label={t('Purchase Cost (SAR)', 'تكلفة الشراء (ر.س)')}><Input type="number" value={form.purchaseCost || ''} onChange={e => setForm(f => ({ ...f, purchaseCost: e.target.value }))} /></Field>
            <Field label={t('Purchase Date', 'تاريخ الشراء')}><Input type="date" value={form.purchaseDate ? form.purchaseDate.split('T')[0] : ''} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} /></Field>
            <Field label={t('Insurance Provider', 'شركة التأمين')}><Input value={form.insuranceProvider || ''} onChange={e => setForm(f => ({ ...f, insuranceProvider: e.target.value }))} /></Field>
            <Field label={t('Insurance Expiry', 'انتهاء التأمين')}><Input type="date" value={form.insuranceExpiry ? form.insuranceExpiry.split('T')[0] : ''} onChange={e => setForm(f => ({ ...f, insuranceExpiry: e.target.value }))} /></Field>
          </div>
          <Field label={t('Notes', 'ملاحظات')}>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </Field>
        </motion.div>
      )}

      {/* Fuel Logs Tab */}
      {activeTab === 'fuel' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Add Fuel Log Form */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Fuel className="w-4 h-4 text-amber-500" /> {t('Add Fuel Log', 'إضافة سجل وقود')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label={t('Date', 'التاريخ')}><Input type="date" value={fuelForm.date} onChange={e => setFuelForm(f => ({ ...f, date: e.target.value }))} /></Field>
              <Field label={t('Liters', 'لتر')}><Input type="number" step="0.01" value={fuelForm.liters} onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))} /></Field>
              <Field label={t('Cost/Liter (SAR)', 'تكلفة/لتر')}>
                <Input type="number" step="0.001" value={fuelForm.costPerLiter} onChange={e => setFuelForm(f => ({ ...f, costPerLiter: e.target.value }))} />
              </Field>
              <Field label={t('Total Cost', 'الإجمالي')}>
                <div className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm font-semibold text-gray-900 dark:text-white">
                  {fuelForm.liters && fuelForm.costPerLiter ? (parseFloat(fuelForm.liters) * parseFloat(fuelForm.costPerLiter)).toFixed(2) : '—'} SAR
                </div>
              </Field>
              <Field label={t('Odometer', 'العداد')}><Input type="number" value={fuelForm.odometerReading} onChange={e => setFuelForm(f => ({ ...f, odometerReading: e.target.value }))} /></Field>
              <Field label={t('Fuel Station', 'محطة الوقود')}><Input value={fuelForm.fuelStation} onChange={e => setFuelForm(f => ({ ...f, fuelStation: e.target.value }))} /></Field>
            </div>
            <button onClick={addFuelLog} className="mt-3 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> {t('Add Log', 'إضافة سجل')}
            </button>
          </div>
          {/* Fuel Log History */}
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-dark-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">{t('Recent Fuel Logs', 'سجلات الوقود الأخيرة')}</h3>
            </div>
            {fuelLogs.length === 0 ? (
              <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">{t('No fuel logs yet', 'لا توجد سجلات وقود بعد')}</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-dark-700/50">
                  <tr>
                    {[t('Date', 'التاريخ'), t('Liters', 'لتر'), t('Cost/L', 'ت/لتر'), t('Total', 'الإجمالي'), t('Odometer', 'العداد'), t('Station', 'المحطة')].map(h => (
                      <th key={h} className="px-4 py-2 text-start text-xs font-semibold text-gray-500 dark:text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                  {fuelLogs.map(log => (
                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/30">
                      <td className="px-4 py-2">{new Date(log.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2">{log.liters}</td>
                      <td className="px-4 py-2">{log.costPerLiter}</td>
                      <td className="px-4 py-2 font-semibold text-amber-600">{log.totalCost?.toLocaleString()}</td>
                      <td className="px-4 py-2">{log.odometerReading || '—'}</td>
                      <td className="px-4 py-2 text-gray-500">{log.fuelStation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Wrench className="w-4 h-4 text-blue-500" /> {t('Add Maintenance Record', 'إضافة سجل صيانة')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label={t('Type', 'النوع')}>
                <Select value={maintenanceForm.maintenanceType} onChange={e => setMaintenanceForm(f => ({ ...f, maintenanceType: e.target.value }))}>
                  {['scheduled', 'breakdown', 'inspection', 'repair', 'tire_change', 'oil_change', 'other'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </Select>
              </Field>
              <Field label={t('Date', 'التاريخ')}><Input type="date" value={maintenanceForm.date} onChange={e => setMaintenanceForm(f => ({ ...f, date: e.target.value }))} /></Field>
              <Field label={t('Vendor', 'المورد')}><Input value={maintenanceForm.vendor} onChange={e => setMaintenanceForm(f => ({ ...f, vendor: e.target.value }))} /></Field>
              <Field label={t('Parts Cost (SAR)', 'تكلفة القطع')}><Input type="number" value={maintenanceForm.partsCost} onChange={e => setMaintenanceForm(f => ({ ...f, partsCost: e.target.value }))} /></Field>
              <Field label={t('Labor Cost (SAR)', 'تكلفة العمالة')}><Input type="number" value={maintenanceForm.laborCost} onChange={e => setMaintenanceForm(f => ({ ...f, laborCost: e.target.value }))} /></Field>
              <Field label={t('Total Cost', 'الإجمالي')}>
                <div className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm font-semibold">
                  {((parseFloat(maintenanceForm.partsCost) || 0) + (parseFloat(maintenanceForm.laborCost) || 0)).toFixed(2)} SAR
                </div>
              </Field>
              <Field label={t('Next Service Date', 'تاريخ الصيانة القادمة')}><Input type="date" value={maintenanceForm.nextServiceDate} onChange={e => setMaintenanceForm(f => ({ ...f, nextServiceDate: e.target.value }))} /></Field>
              <Field label={t('Next Service Meter', 'عداد الصيانة القادمة')}><Input type="number" value={maintenanceForm.nextServiceMeter} onChange={e => setMaintenanceForm(f => ({ ...f, nextServiceMeter: e.target.value }))} /></Field>
              <Field label={t('Alert Days Before', 'تنبيه قبل (أيام)')}><Input type="number" value={maintenanceForm.alertDaysBefore} onChange={e => setMaintenanceForm(f => ({ ...f, alertDaysBefore: e.target.value }))} /></Field>
            </div>
            <Field label={t('Description', 'الوصف')}>
              <textarea value={maintenanceForm.description} onChange={e => setMaintenanceForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full mt-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </Field>
            <button onClick={addMaintenance} className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" /> {t('Add Record', 'إضافة سجل')}
            </button>
          </div>
          <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 divide-y divide-gray-50 dark:divide-dark-700">
            {maintenance.length === 0 ? (
              <div className="py-10 text-center text-gray-400 dark:text-gray-500 text-sm">{t('No maintenance records yet', 'لا توجد سجلات صيانة بعد')}</div>
            ) : maintenance.map(rec => (
              <div key={rec._id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{rec.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rec.maintenanceType?.replace(/_/g, ' ')} · {new Date(rec.date).toLocaleDateString()} · {rec.vendor || '—'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm text-gray-700 dark:text-gray-300">{rec.cost?.toLocaleString()} SAR</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${MAINTENANCE_STATUS[rec.status] || ''}`}>{rec.status}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
