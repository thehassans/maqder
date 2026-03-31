import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, FolderKanban, Calendar, User, Percent, Wallet, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import SarIcon from '../components/ui/SarIcon'
import { useLiveTranslation } from '../lib/liveTranslation'
import { downloadProjectProgressPdf } from '../lib/projectProgressPdf'

export default function ProjectForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const isEdit = Boolean(id)

  const formatDateTime = (value) => {
    if (!value) return ''
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
  }

  const formatDateForInput = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return local.toISOString().slice(0, 10)
  }

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      code: '',
      status: 'planned',
      nameEn: '',
      nameAr: '',
      ownerName: '',
      startDate: '',
      dueDate: '',
      progress: 0,
      budget: 0,
      currency: tenant?.settings?.currency || 'SAR',
      description: '',
      notes: '',
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

  const progress = watch('progress')

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.get(`/projects/${id}`).then((res) => res.data),
    enabled: isEdit,
    onSuccess: (data) => {
      reset({
        code: data?.code || '',
        status: data?.status || 'planned',
        nameEn: data?.nameEn || '',
        nameAr: data?.nameAr || '',
        ownerName: data?.ownerName || '',
        startDate: formatDateForInput(data?.startDate),
        dueDate: formatDateForInput(data?.dueDate),
        progress: data?.progress ?? 0,
        budget: data?.budget ?? 0,
        currency: data?.currency || tenant?.settings?.currency || 'SAR',
        description: data?.description || '',
        notes: data?.notes || '',
      })
    },
  })

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? api.put(`/projects/${id}`, data) : api.post('/projects', data)),
    onSuccess: () => {
      toast.success(
        isEdit
          ? language === 'ar'
            ? 'تم تحديث المشروع'
            : 'Project updated'
          : language === 'ar'
            ? 'تم إضافة المشروع'
            : 'Project added'
      )
      queryClient.invalidateQueries(['projects'])
      queryClient.invalidateQueries(['projects-stats'])
      navigate('/projects')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const onSubmit = (data) => {
    const p = Number(data.progress)
    const budget = Number(data.budget)

    const payload = {
      ...data,
      progress: Number.isFinite(p) ? Math.max(0, Math.min(100, p)) : 0,
      budget: Number.isFinite(budget) ? Math.max(0, budget) : 0,
      startDate: data.startDate || undefined,
      dueDate: data.dueDate || undefined,
    }

    mutation.mutate(payload)
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)))
  const progressUpdates = Array.isArray(projectData?.progressUpdates) ? projectData.progressUpdates : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? (language === 'ar' ? 'تعديل مشروع' : 'Edit Project') : language === 'ar' ? 'إضافة مشروع' : 'Add Project'}
            </h1>
          </div>
        </div>

        {isEdit && projectData && (
          <button
            type="button"
            onClick={async () => {
              try {
                setDownloadingPdf(true)
                const full = await api.get(`/projects/${id}`).then((r) => r.data)
                await downloadProjectProgressPdf({ project: full, language, tenant })
              } catch (e) {
                toast.error(language === 'ar' ? 'فشل تحميل PDF' : 'Failed to download PDF')
              } finally {
                setDownloadingPdf(false)
              }
            }}
            disabled={downloadingPdf}
            className="btn btn-secondary"
          >
            {downloadingPdf ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {language === 'ar' ? 'PDF التقدم' : 'Progress PDF'}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FolderKanban className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'معلومات المشروع' : 'Project Information'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'الكود' : 'Code'}</label>
              <input
                {...register('code')}
                className="input"
                placeholder={language === 'ar' ? 'تلقائي إذا تركته فارغاً' : 'Auto if left empty'}
                disabled={isEdit}
              />
            </div>

            <div>
              <label className="label">{t('status')}</label>
              <select {...register('status')} className="select">
                <option value="planned">{language === 'ar' ? 'مخطط' : 'Planned'}</option>
                <option value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
                <option value="on_hold">{language === 'ar' ? 'متوقف' : 'On Hold'}</option>
                <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
                <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
              </select>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'المالك' : 'Owner'}</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('ownerName')} className="input ps-10" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'الاسم (EN)' : 'Name (EN)'} *</label>
              <input {...register('nameEn', { required: true })} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'الاسم (AR)' : 'Name (AR)'}</label>
              <input {...register('nameAr')} className="input" dir="rtl" />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="label">{language === 'ar' ? 'الوصف' : 'Description'}</label>
              <textarea {...register('description')} className="input" rows={3} />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'الجدول والميزانية' : 'Schedule & Budget'}</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'تاريخ البداية' : 'Start Date'}</label>
              <input type="date" {...register('startDate')} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'تاريخ الانتهاء' : 'Due Date'}</label>
              <input type="date" {...register('dueDate')} className="input" />
            </div>

            <div>
              <label className="label">
                <span className="inline-flex items-center gap-2">
                  <Percent className="w-4 h-4 text-gray-400" />
                  {language === 'ar' ? 'التقدم (%)' : 'Progress (%)'}
                </span>
              </label>
              <input type="number" min="0" max="100" step="1" {...register('progress', { valueAsNumber: true })} className="input" />
              <div className="mt-2">
                <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: `${safeProgress}%` }} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">
                <span className="inline-flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-400" />
                  {language === 'ar' ? 'الميزانية' : 'Budget'}
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" min="0" step="0.01" {...register('budget', { valueAsNumber: true })} className="input" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'العملة' : 'Currency'}</label>
              <input {...register('currency')} className="input" disabled />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FolderKanban className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'ملاحظات' : 'Notes'}</h3>
          </div>

          <textarea {...register('notes')} className="input" rows={4} />
        </motion.div>

        {isEdit && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Percent className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'سجل التقدم' : 'Progress Updates'}</h3>
            </div>

            {progressUpdates.length === 0 ? (
              <div className="text-sm text-gray-500">{language === 'ar' ? 'لا يوجد تحديثات بعد' : 'No updates yet'}</div>
            ) : (
              <div className="space-y-3">
                {[...progressUpdates].reverse().map((u, idx) => (
                  <div key={u?._id || `${u?.createdAt || idx}`} className="p-3 rounded-xl border border-gray-200 dark:border-dark-700">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{Math.max(0, Math.min(100, Number(u?.progress || 0)))}%</div>
                      <div className="text-xs text-gray-500">{formatDateTime(u?.createdAt)}</div>
                    </div>
                    {String(u?.note || '').trim() ? (
                      <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{String(u.note).trim()}</div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

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
    </div>
  )
}
