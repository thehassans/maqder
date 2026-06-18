import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  Plus, Search, X, Save, Trash2, Car, History
} from 'lucide-react'
import api from '../../lib/api'

const FUEL_OPTS = ['petrol', 'diesel', 'hybrid', 'electric']
const BODY_OPTS = ['sedan', 'suv', 'truck', 'van', 'bus', 'coupe', 'hatchback', 'other']

function initForm() {
  return {
    customerId: '', plateNumber: '', plateArabicLetters: '', plateNumeric: '',
    istimaraNumber: '', istimaraExpiry: '',
    vin: '', make: '', model: '', year: '', color: '', bodyType: '', fuelType: '',
    currentOdometer: '', notes: '',
  }
}

export default function Vehicles() {
  const { language } = useSelector((state) => state.ui)
  const t = (en, ar) => language === 'ar' ? ar : en
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(initForm())
  const [historyVehicle, setHistoryVehicle] = useState(null)

  const { data: serviceHistory = [] } = useQuery({
    queryKey: ['workshop-vehicle-history', historyVehicle?._id],
    queryFn: async () => {
      const res = await api.get(`/workshop/vehicles/${historyVehicle._id}/history`)
      return res.data
    },
    enabled: !!historyVehicle,
  })

  const { data: vehicles = [] } = useQuery({
    queryKey: ['workshop-vehicles', search],
    queryFn: async () => {
      const params = search ? `?search=${encodeURIComponent(search)}` : ''
      const res = await api.get(`/workshop/vehicles${params}`)
      return res.data
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/workshop/vehicles/${id}`),
    onSuccess: () => { toast.success(t('Deleted', 'تم الحذف')); qc.invalidateQueries({ queryKey: ['workshop-vehicles'] }) },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل')),
  })

  const openModal = (v) => {
    if (v) { setEditing(v); setForm({ ...initForm(), ...v }) }
    else { setEditing(null); setForm(initForm()) }
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(initForm()) }

  const saveMut = useMutation({
    mutationFn: () => editing
      ? api.put(`/workshop/vehicles/${editing._id}`, form)
      : api.post('/workshop/vehicles', form),
    onSuccess: () => { toast.success(editing ? t('Updated', 'تم التحديث') : t('Created', 'تم الإنشاء')); qc.invalidateQueries({ queryKey: ['workshop-vehicles'] }); closeModal() },
    onError: (e) => toast.error(e.response?.data?.error || t('Failed', 'فشل')),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Vehicle Registry', 'سجل المركبات')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('Track all customer vehicles, Istimara, and service history', 'تتبع جميع مركبات العملاء والاستمارة وسجل الصيانة')}</p>
        </div>
        <button onClick={() => openModal(null)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('Register Vehicle', 'تسجيل مركبة')}
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search by plate, VIN, make or model...', 'البحث باللوحة أو الهيكل أو الشركة أو الموديل...')}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" />
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-xl shadow-sm border border-gray-100 dark:border-dark-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-dark-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Plate', 'اللوحة')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Vehicle', 'المركبة')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('VIN', 'الهيكل')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Odometer', 'العداد')}</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Istimara', 'الاستمارة')}</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('Actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-700">
              {vehicles.map(v => (
                <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.plateNumber}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{v.make} {v.model} {v.year && `(${v.year})`}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{v.vin || '-'}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{v.currentOdometer?.toLocaleString?.() ?? '0'} km</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{v.istimaraNumber || '-'} {v.istimaraExpiry && `(Exp: ${v.istimaraExpiry.slice(0,10)})`}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setHistoryVehicle(v)} className="text-gray-600 hover:text-primary-600 hover:underline text-xs font-medium mr-3">{t('History', 'السجل')}</button>
                    <button onClick={() => openModal(v)} className="text-primary-600 hover:underline text-xs font-medium mr-3">{t('Edit', 'تعديل')}</button>
                    <button onClick={() => { if (window.confirm(t('Delete vehicle?', 'حذف المركبة؟'))) deleteMut.mutate(v._id) }} className="text-red-600 hover:underline text-xs font-medium">{t('Delete', 'حذف')}</button>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">{t('No vehicles registered yet', 'لم يتم تسجيل مركبات بعد')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={closeModal}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editing ? t('Edit Vehicle', 'تعديل مركبة') : t('Register Vehicle', 'تسجيل مركبة')}</h3>
                <button onClick={closeModal} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-medium text-gray-500">{t('Plate Number', 'رقم اللوحة')}</label><input value={form.plateNumber} onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('VIN', 'رقم الهيكل')}</label><input value={form.vin} onChange={e => setForm(f => ({ ...f, vin: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Make', 'الشركة')}</label><input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Model', 'الموديل')}</label><input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Year', 'السنة')}</label><input type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Color', 'اللون')}</label><input value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">{t('Body Type', 'نوع الهيكل')}</label>
                    <select value={form.bodyType} onChange={e => setForm(f => ({ ...f, bodyType: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
                      <option value="">{t('Select', 'اختر')}</option>
                      {BODY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">{t('Fuel Type', 'نوع الوقود')}</label>
                    <select value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm">
                      <option value="">{t('Select', 'اختر')}</option>
                      {FUEL_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Istimara Number', 'رقم الاستمارة')}</label><input value={form.istimaraNumber} onChange={e => setForm(f => ({ ...f, istimaraNumber: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Istimara Expiry', 'انتهاء الاستمارة')}</label><input type="date" value={form.istimaraExpiry} onChange={e => setForm(f => ({ ...f, istimaraExpiry: e.target.value }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Current Odometer (km)', 'العداد الحالي (كم)')}</label><input type="number" value={form.currentOdometer} onChange={e => setForm(f => ({ ...f, currentOdometer: Number(e.target.value) }))} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                  <div><label className="text-xs font-medium text-gray-500">{t('Customer ID', 'معرف العميل')}</label><input value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} placeholder={t('Link to existing customer', 'ربط بعميل موجود')} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
                </div>
                <div><label className="text-xs font-medium text-gray-500">{t('Notes', 'ملاحظات')}</label><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full mt-1 px-3 py-2 bg-gray-50 dark:bg-dark-900 border border-gray-200 dark:border-dark-700 rounded-lg text-sm" /></div>
              </div>
              <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 dark:border-dark-700">
                <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">{t('Cancel', 'إلغاء')}</button>
                <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saveMut.isPending ? t('Saving...', 'جاري الحفظ...') : t('Save', 'حفظ')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service History Modal */}
      <AnimatePresence>
        {historyVehicle && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setHistoryVehicle(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-dark-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('Service History', 'سجل الصيانة')} — {historyVehicle.plateNumber}</h3>
                <button onClick={() => setHistoryVehicle(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-5">
                {serviceHistory.length === 0 ? (
                  <div className="text-center text-gray-400 text-sm py-8">{t('No service history yet', 'لا يوجد سجل صيانة بعد')}</div>
                ) : (
                  <div className="space-y-3">
                    {serviceHistory.map(job => (
                      <div key={job._id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                        <div className={`w-2 h-2 mt-1.5 rounded-full ${
                          job.status === 'delivered' ? 'bg-green-500' :
                          job.status === 'in_progress' ? 'bg-blue-500' :
                          job.status === 'ready_pickup' ? 'bg-emerald-500' :
                          'bg-amber-500'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{job.jobCardNumber}</span>
                            <span className="text-xs text-gray-500">{job.checkInDate ? new Date(job.checkInDate).toLocaleDateString() : ''}</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{job.customerComplaints || job.notes || t('No description', 'لا يوجد وصف')}</p>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-dark-600 text-gray-700 dark:text-gray-300 uppercase">{job.status?.replace(/_/g, ' ')}</span>
                            <span className="text-xs font-medium text-primary-600">{job.grandTotal?.toFixed?.(2) ?? '0.00'} SAR</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
