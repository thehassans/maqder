import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Save, User, FileText, Briefcase, Activity } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ManpowerWorkerForm() {
  const { id } = useParams()
  const isEdit = Boolean(id && id !== 'new')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      nameAr: '',
      nationality: '',
      iqamaNumber: '',
      iqamaExpiry: '',
      passportNumber: '',
      passportExpiry: '',
      trade: 'helper',
      dailyRate: 0,
      monthlyRate: 0,
      status: 'available',
      notes: ''
    }
  })

  const { data: worker, isLoading } = useQuery({
    queryKey: ['manpower-worker', id],
    queryFn: () => api.get(`/manpower/workers/${id}`).then((res) => res.data),
    enabled: isEdit
  })

  useEffect(() => {
    if (worker) {
      reset({
        ...worker,
        iqamaExpiry: worker.iqamaExpiry ? new Date(worker.iqamaExpiry).toISOString().slice(0, 10) : '',
        passportExpiry: worker.passportExpiry ? new Date(worker.passportExpiry).toISOString().slice(0, 10) : '',
      })
    }
  }, [worker, reset])

  const saveMutation = useMutation({
    mutationFn: (data) => (isEdit ? api.put(`/manpower/workers/${id}`, data) : api.post('/manpower/workers', data)),
    onSuccess: (res) => {
      toast.success(isEdit ? (language === 'ar' ? 'تم تحديث العامل' : 'Worker updated') : (language === 'ar' ? 'تمت إضافة العامل' : 'Worker added'))
      queryClient.invalidateQueries(['manpower-workers'])
      navigate(-1)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving worker')
  })

  const onSubmit = (data) => {
    saveMutation.mutate(data)
  }

  const trades = ['carpenter', 'plumber', 'mason', 'electrician', 'welder', 'helper', 'driver', 'operator', 'other']

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? (language === 'ar' ? 'تعديل بيانات العامل' : 'Edit Worker') : (language === 'ar' ? 'إضافة عامل جديد' : 'Add New Worker')}
          </h1>
          {worker?.workerNumber && <p className="text-sm text-gray-500 mt-1">{worker.workerNumber}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'المعلومات الشخصية' : 'Personal Information'}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">{language === 'ar' ? 'الاسم' : 'Name'} *</label>
                <input {...register('name', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'الاسم بالعربي' : 'Name (Arabic)'}</label>
                <input {...register('nameAr')} className="input" dir="rtl" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'الجنسية' : 'Nationality'}</label>
                <input {...register('nationality')} className="input" />
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'الوثائق' : 'Documents'}</h3>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'ar' ? 'رقم الإقامة' : 'Iqama Number'}</label>
                  <input {...register('iqamaNumber')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'تاريخ انتهاء الإقامة' : 'Iqama Expiry'}</label>
                  <input type="date" {...register('iqamaExpiry')} className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</label>
                  <input {...register('passportNumber')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'انتهاء الجواز' : 'Passport Expiry'}</label>
                  <input type="date" {...register('passportExpiry')} className="input" />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Briefcase className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'المهنة والراتب' : 'Trade & Rates'}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">{language === 'ar' ? 'المهنة' : 'Trade'} *</label>
                <select {...register('trade', { required: true })} className="select">
                  {trades.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'ar' ? 'التكلفة اليومية' : 'Daily Rate'}</label>
                  <input type="number" step="0.01" {...register('dailyRate', { valueAsNumber: true })} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'الراتب الشهري' : 'Monthly Rate'}</label>
                  <input type="number" step="0.01" {...register('monthlyRate', { valueAsNumber: true })} className="input" />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Activity className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'الحالة والملاحظات' : 'Status & Notes'}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">{language === 'ar' ? 'الحالة' : 'Status'}</label>
                <select {...register('status')} className="select">
                  <option value="available">{language === 'ar' ? 'متاح' : 'Available'}</option>
                  <option value="assigned" disabled>{language === 'ar' ? 'معين' : 'Assigned (managed by assignments)'}</option>
                  <option value="on_leave">{language === 'ar' ? 'في إجازة' : 'On Leave'}</option>
                  <option value="terminated">{language === 'ar' ? 'منهي' : 'Terminated'}</option>
                </select>
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'ملاحظات' : 'Notes'}</label>
                <textarea {...register('notes')} className="input" rows={4} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">
            {t('cancel')}
          </button>
          <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
            {saveMutation.isPending ? (
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
    </div>
  )
}
