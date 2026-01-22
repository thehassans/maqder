import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Cpu, MapPin, Tag, Trash2, Activity, Plus, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import { useLiveTranslation } from '../lib/liveTranslation'

export default function IoTDeviceForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)

  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [readingsPage, setReadingsPage] = useState(1)
  const [readingsStatus, setReadingsStatus] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      code: '',
      nameEn: '',
      nameAr: '',
      type: 'sensor',
      status: 'active',
      location: {
        name: '',
        zone: '',
        latitude: undefined,
        longitude: undefined,
      },
      tagsText: '',
      metaText: '',
    },
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'nameEn',
    targetField: 'nameAr',
    sourceLang: 'en',
    targetLang: 'ar'
  })

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'nameAr',
    targetField: 'nameEn',
    sourceLang: 'ar',
    targetLang: 'en'
  })

  const {
    register: registerReading,
    handleSubmit: handleSubmitReading,
    reset: resetReading,
  } = useForm({
    defaultValues: {
      recordedAt: '',
      status: 'ok',
      battery: '',
      signal: '',
      metricsText: '',
      notes: '',
    },
  })

  const { data: device, isLoading } = useQuery({
    queryKey: ['iot-device', id],
    queryFn: () => api.get(`/iot/devices/${id}`).then((res) => res.data),
    enabled: isEdit,
    onSuccess: (data) => {
      reset({
        code: data?.code || '',
        nameEn: data?.nameEn || '',
        nameAr: data?.nameAr || '',
        type: data?.type || 'sensor',
        status: data?.status || 'active',
        location: {
          name: data?.location?.name || '',
          zone: data?.location?.zone || '',
          latitude: data?.location?.latitude,
          longitude: data?.location?.longitude,
        },
        tagsText: Array.isArray(data?.tags) ? data.tags.join(', ') : '',
        metaText: data?.meta ? JSON.stringify(data.meta, null, 2) : '',
      })
    },
  })

  const { data: readingsData, isLoading: readingsLoading } = useQuery({
    queryKey: ['iot-readings', id, readingsPage, readingsStatus],
    queryFn: () =>
      api
        .get(`/iot/devices/${id}/readings`, {
          params: { page: readingsPage, limit: 25, status: readingsStatus || undefined },
        })
        .then((res) => res.data),
    enabled: isEdit,
  })

  const readings = readingsData?.readings || []
  const readingsPagination = readingsData?.pagination

  const mutation = useMutation({
    mutationFn: (payload) => (isEdit ? api.put(`/iot/devices/${id}`, payload) : api.post('/iot/devices', payload)),
    onSuccess: (res) => {
      toast.success(
        isEdit
          ? language === 'ar'
            ? 'تم تحديث الجهاز'
            : 'Device updated'
          : language === 'ar'
            ? 'تم إنشاء الجهاز'
            : 'Device created'
      )
      queryClient.invalidateQueries(['iot-devices'])
      queryClient.invalidateQueries(['iot-devices-stats'])

      if (isEdit) {
        queryClient.invalidateQueries(['iot-device', id])
        navigate('/iot')
      } else {
        navigate(`/iot/devices/${res.data?._id}`)
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const deactivateMutation = useMutation({
    mutationFn: () => api.delete(`/iot/devices/${id}`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تعطيل الجهاز' : 'Device deactivated')
      queryClient.invalidateQueries(['iot-devices'])
      queryClient.invalidateQueries(['iot-devices-stats'])
      navigate('/iot')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const addReadingMutation = useMutation({
    mutationFn: (payload) => api.post(`/iot/devices/${id}/readings`, payload),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تمت إضافة القراءة' : 'Reading added')
      resetReading({ recordedAt: '', status: 'ok', battery: '', signal: '', metricsText: '', notes: '' })
      queryClient.invalidateQueries(['iot-readings', id])
      queryClient.invalidateQueries(['iot-device', id])
      queryClient.invalidateQueries(['iot-devices'])
      queryClient.invalidateQueries(['iot-devices-stats'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const onSubmit = (data) => {
    const tags = String(data.tagsText || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean)

    let meta
    if (data.metaText) {
      try {
        meta = JSON.parse(data.metaText)
      } catch {
        toast.error(language === 'ar' ? 'صيغة JSON غير صحيحة في meta' : 'Invalid JSON in meta')
        return
      }
    }

    const payload = {
      code: data.code || undefined,
      nameEn: data.nameEn,
      nameAr: data.nameAr || undefined,
      type: data.type,
      status: data.status,
      location: {
        name: data.location?.name || undefined,
        zone: data.location?.zone || undefined,
        latitude: typeof data.location?.latitude === 'number' ? data.location.latitude : undefined,
        longitude: typeof data.location?.longitude === 'number' ? data.location.longitude : undefined,
      },
      tags,
      ...(meta ? { meta } : {}),
    }

    mutation.mutate(payload)
  }

  const onSubmitReading = (data) => {
    let metrics = {}

    if (data.metricsText) {
      try {
        metrics = JSON.parse(data.metricsText)
      } catch {
        toast.error(language === 'ar' ? 'صيغة JSON غير صحيحة في metrics' : 'Invalid JSON in metrics')
        return
      }
    }

    const battery = data.battery === '' ? undefined : Number(data.battery)
    const signal = data.signal === '' ? undefined : Number(data.signal)

    const payload = {
      recordedAt: data.recordedAt || undefined,
      status: data.status,
      metrics,
      ...(Number.isFinite(battery) ? { battery } : {}),
      ...(Number.isFinite(signal) ? { signal } : {}),
      notes: data.notes || undefined,
    }

    addReadingMutation.mutate(payload)
  }

  const readingStatusBadge = (status) => {
    if (status === 'alert') return 'badge-danger'
    if (status === 'warning') return 'badge-warning'
    return 'badge-success'
  }

  const readingStatusLabel = (status) => {
    if (language === 'ar') {
      if (status === 'ok') return 'طبيعي'
      if (status === 'warning') return 'تحذير'
      if (status === 'alert') return 'تنبيه'
      return status
    }
    return status
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? (language === 'ar' ? 'تعديل جهاز' : 'Edit Device') : language === 'ar' ? 'إضافة جهاز' : 'Add Device'}
            </h1>
            {isEdit && (
              <p className="text-sm text-gray-500 mt-1">
                {language === 'ar' ? 'آخر اتصال:' : 'Last seen:'}{' '}
                {device?.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
              </p>
            )}
          </div>
        </div>

        {isEdit && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm(language === 'ar' ? 'تعطيل الجهاز؟' : 'Deactivate device?')) {
                deactivateMutation.mutate()
              }
            }}
            disabled={deactivateMutation.isPending}
            className="btn btn-danger"
          >
            {deactivateMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {language === 'ar' ? 'تعطيل' : 'Deactivate'}
              </>
            )}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Cpu className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'معلومات الجهاز' : 'Device Information'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'الكود' : 'Code'} *</label>
              <input {...register('code', { required: true })} className="input" placeholder="DEV-001" disabled={isEdit} />
              {errors.code && <p className="text-xs text-red-600 mt-1">{language === 'ar' ? 'الكود مطلوب' : 'Code is required'}</p>}
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'النوع' : 'Type'}</label>
              <select {...register('type')} className="select">
                <option value="sensor">{language === 'ar' ? 'حساس' : 'Sensor'}</option>
                <option value="gateway">{language === 'ar' ? 'بوابة' : 'Gateway'}</option>
                <option value="meter">{language === 'ar' ? 'عداد' : 'Meter'}</option>
                <option value="tracker">{language === 'ar' ? 'متعقب' : 'Tracker'}</option>
                <option value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</option>
              </select>
            </div>

            <div>
              <label className="label">{t('status')}</label>
              <select {...register('status')} className="select">
                <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
                <option value="maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'} *</label>
              <input {...register('nameEn', { required: true })} className="input" />
              {errors.nameEn && <p className="text-xs text-red-600 mt-1">{language === 'ar' ? 'الاسم مطلوب' : 'Name is required'}</p>}
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}</label>
              <input {...register('nameAr')} className="input" dir="rtl" />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">
                <span className="inline-flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400" />
                  {language === 'ar' ? 'وسوم (مفصولة بفواصل)' : 'Tags (comma separated)'}
                </span>
              </label>
              <input {...register('tagsText')} className="input" placeholder={language === 'ar' ? 'مثال: مخزن, طاقة' : 'e.g. warehouse, power'} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'الموقع' : 'Location'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'اسم الموقع' : 'Location name'}</label>
              <input {...register('location.name')} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'المنطقة' : 'Zone'}</label>
              <input {...register('location.zone')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'خط العرض' : 'Latitude'}</label>
              <input
                type="number"
                step="0.000001"
                {...register('location.latitude', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                className="input"
              />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'خط الطول' : 'Longitude'}</label>
              <input
                type="number"
                step="0.000001"
                {...register('location.longitude', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })}
                className="input"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="label">{language === 'ar' ? 'Meta (JSON)' : 'Meta (JSON)'}</label>
              <textarea {...register('metaText')} className="input font-mono" rows={6} placeholder="{}" />
            </div>
          </div>
        </motion.div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            {t('cancel')}
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
            {mutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('save')}
              </>
            )}
          </button>
        </div>
      </form>

      {isEdit && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Activity className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'القراءات' : 'Readings'}</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{language === 'ar' ? 'إضافة قراءة' : 'Add Reading'}</h4>
                </div>

                <form onSubmit={handleSubmitReading(onSubmitReading)} className="space-y-3">
                  <div>
                    <label className="label">{language === 'ar' ? 'الوقت' : 'Recorded at'}</label>
                    <input type="datetime-local" {...registerReading('recordedAt')} className="input" />
                  </div>

                  <div>
                    <label className="label">{t('status')}</label>
                    <select {...registerReading('status')} className="select">
                      <option value="ok">{language === 'ar' ? 'طبيعي' : 'OK'}</option>
                      <option value="warning">{language === 'ar' ? 'تحذير' : 'Warning'}</option>
                      <option value="alert">{language === 'ar' ? 'تنبيه' : 'Alert'}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{language === 'ar' ? 'بطارية' : 'Battery'}</label>
                      <input type="number" step="0.01" {...registerReading('battery')} className="input" placeholder="%" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'إشارة' : 'Signal'}</label>
                      <input type="number" step="0.01" {...registerReading('signal')} className="input" placeholder="dBm" />
                    </div>
                  </div>

                  <div>
                    <label className="label">{language === 'ar' ? 'Metrics (JSON)' : 'Metrics (JSON)'}</label>
                    <textarea
                      {...registerReading('metricsText')}
                      className="input font-mono"
                      rows={5}
                      placeholder={`{\n  "temperature": 24.6\n}`}
                    />
                  </div>

                  <div>
                    <label className="label">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                    <textarea {...registerReading('notes')} className="input" rows={3} />
                  </div>

                  <button type="submit" disabled={addReadingMutation.isPending} className="btn btn-primary w-full">
                    {addReadingMutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        {language === 'ar' ? 'إضافة' : 'Add'}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-300">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                  <select
                    value={readingsStatus}
                    onChange={(e) => {
                      setReadingsStatus(e.target.value)
                      setReadingsPage(1)
                    }}
                    className="select w-44"
                  >
                    <option value="">{language === 'ar' ? 'الكل' : 'All'}</option>
                    <option value="ok">{language === 'ar' ? 'طبيعي' : 'OK'}</option>
                    <option value="warning">{language === 'ar' ? 'تحذير' : 'Warning'}</option>
                    <option value="alert">{language === 'ar' ? 'تنبيه' : 'Alert'}</option>
                  </select>
                </div>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'الوقت' : 'Recorded At'}</th>
                      <th>{t('status')}</th>
                      <th>{language === 'ar' ? 'بطارية' : 'Battery'}</th>
                      <th>{language === 'ar' ? 'إشارة' : 'Signal'}</th>
                      <th>{language === 'ar' ? 'Metrics' : 'Metrics'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {readingsLoading ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center">
                          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        </td>
                      </tr>
                    ) : (
                      readings.map((r) => (
                        <tr key={r._id}>
                          <td>
                            <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              {r.recordedAt ? new Date(r.recordedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : '-'}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${readingStatusBadge(r.status)}`}>{readingStatusLabel(r.status)}</span>
                          </td>
                          <td>{typeof r.battery === 'number' ? r.battery : '-'}</td>
                          <td>{typeof r.signal === 'number' ? r.signal : '-'}</td>
                          <td className="text-xs text-gray-600 dark:text-gray-300">
                            {r.metrics && typeof r.metrics === 'object' ? (
                              <span className="font-mono">
                                {Object.keys(r.metrics)
                                  .slice(0, 4)
                                  .map((k) => `${k}:${String(r.metrics[k])}`)
                                  .join('  ')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {readingsPagination?.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <button
                    className="btn btn-secondary"
                    disabled={readingsPage <= 1}
                    onClick={() => setReadingsPage((p) => Math.max(1, p - 1))}
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <div className="text-sm text-gray-500">
                    {language === 'ar' ? 'صفحة' : 'Page'} {readingsPage} / {readingsPagination.pages}
                  </div>
                  <button
                    className="btn btn-secondary"
                    disabled={readingsPage >= readingsPagination.pages}
                    onClick={() => setReadingsPage((p) => Math.min(readingsPagination.pages, p + 1))}
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
