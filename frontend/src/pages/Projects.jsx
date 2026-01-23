import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FolderKanban, Calendar, User, AlertTriangle, Edit, Percent, X, Save, Download } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'
import ExportMenu from '../components/ui/ExportMenu'
import { downloadProjectProgressPdf } from '../lib/projectProgressPdf'

export default function Projects() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()
  const { tenant } = useSelector((state) => state.auth)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const [downloadingProjectPdfId, setDownloadingProjectPdfId] = useState(null)

  const [showProgressModal, setShowProgressModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      progress: 0,
      note: '',
    },
  })

  const openProgressModal = (project) => {
    setEditingProject(project)
    reset({
      progress: project?.progress ?? 0,
      note: '',
    })
    setShowProgressModal(true)
  }

  const closeProgressModal = () => {
    setShowProgressModal(false)
    setEditingProject(null)
    reset({ progress: 0, note: '' })
  }

  const exportColumns = [
    {
      key: 'code',
      label: language === 'ar' ? 'الكود' : 'Code',
      value: (r) => r?.code || ''
    },
    {
      key: 'name',
      label: language === 'ar' ? 'المشروع' : 'Project',
      value: (r) => (language === 'ar' ? r?.nameAr || r?.nameEn : r?.nameEn || r?.nameAr) || ''
    },
    {
      key: 'owner',
      label: language === 'ar' ? 'المالك' : 'Owner',
      value: (r) => r?.ownerName || ''
    },
    {
      key: 'dueDate',
      label: language === 'ar' ? 'تاريخ الانتهاء' : 'Due Date',
      value: (r) => (r?.dueDate ? new Date(r.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '')
    },
    {
      key: 'progress',
      label: language === 'ar' ? 'التقدم' : 'Progress',
      value: (r) => r?.progress ?? ''
    },
    {
      key: 'budget',
      label: language === 'ar' ? 'الميزانية' : 'Budget',
      value: (r) => r?.budget ?? ''
    },
    {
      key: 'status',
      label: t('status'),
      value: (r) => r?.status || ''
    },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search, status],
    queryFn: () => api.get('/projects', { params: { page, limit: 25, search, status } }).then((res) => res.data),
  })

  const progressMutation = useMutation({
    mutationFn: ({ id, progress, note }) => api.post(`/projects/${id}/progress`, { progress, note }).then((r) => r.data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث التقدم' : 'Progress updated')
      queryClient.invalidateQueries(['projects'])
      queryClient.invalidateQueries(['projects-stats'])
      closeProgressModal()
    },
    onError: (err) => toast.error(err.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error')),
  })

  const getExportRows = async () => {
    const limit = 200
    let currentPage = 1
    let all = []

    while (true) {
      const res = await api.get('/projects', { params: { page: currentPage, limit, search, status } })
      const batch = res.data?.projects || []
      all = all.concat(batch)

      const pages = res.data?.pagination?.pages || 1
      if (currentPage >= pages) break
      currentPage += 1

      if (all.length >= 10000) break
    }

    return all
  }

  const { data: stats } = useQuery({
    queryKey: ['projects-stats'],
    queryFn: () => api.get('/projects/stats').then((res) => res.data),
  })

  const totals = stats?.totals?.[0]
  const totalProjects = totals?.total || 0
  const activeProjects = totals?.active || 0
  const completedProjects = totals?.completed || 0
  const overdueProjects = stats?.overdue?.[0]?.count || 0

  const projects = data?.projects || []
  const pagination = data?.pagination

  const statusBadge = (value) => {
    if (value === 'completed') return 'badge-success'
    if (value === 'in_progress') return 'badge-info'
    if (value === 'on_hold') return 'badge-warning'
    if (value === 'cancelled') return 'badge-danger'
    return 'badge-neutral'
  }

  const statusLabel = (value) => {
    if (language === 'ar') {
      if (value === 'planned') return 'مخطط'
      if (value === 'in_progress') return 'قيد التنفيذ'
      if (value === 'on_hold') return 'متوقف'
      if (value === 'completed') return 'مكتمل'
      if (value === 'cancelled') return 'ملغي'
      return value
    }
    return value
  }

  const liveProgress = Math.max(0, Math.min(100, Number(watch('progress') || 0)))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'المشاريع' : 'Projects'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{language === 'ar' ? 'إدارة المشاريع' : 'Manage projects'}</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            language={language}
            t={t}
            rows={projects}
            getRows={getExportRows}
            columns={exportColumns}
            fileBaseName={language === 'ar' ? 'المشاريع' : 'Projects'}
            title={language === 'ar' ? 'المشاريع' : 'Projects'}
            disabled={isLoading || projects.length === 0}
          />
          <Link to="/projects/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة مشروع' : 'Add Project'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <FolderKanban className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}</p>
            <p className="text-2xl font-bold">{totalProjects}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <FolderKanban className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'مشاريع نشطة' : 'Active Projects'}</p>
            <p className="text-2xl font-bold text-blue-600">{activeProjects}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <FolderKanban className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'مكتمل' : 'Completed'}</p>
            <p className="text-2xl font-bold text-emerald-600">{completedProjects}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'متأخر' : 'Overdue'}</p>
            <p className="text-2xl font-bold text-amber-600">{overdueProjects}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالاسم / الكود / المالك...' : 'Search by name / code / owner...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
            className="select w-full lg:w-52"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="planned">{language === 'ar' ? 'مخطط' : 'Planned'}</option>
            <option value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
            <option value="on_hold">{language === 'ar' ? 'متوقف' : 'On Hold'}</option>
            <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الكود' : 'Code'}</th>
                  <th>{language === 'ar' ? 'المشروع' : 'Project'}</th>
                  <th>{language === 'ar' ? 'المالك' : 'Owner'}</th>
                  <th>{language === 'ar' ? 'تاريخ الانتهاء' : 'Due Date'}</th>
                  <th>{language === 'ar' ? 'التقدم' : 'Progress'}</th>
                  <th>{language === 'ar' ? 'الميزانية' : 'Budget'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => {
                  const progress = Math.max(0, Math.min(100, Number(p.progress || 0)))
                  const lastProgressUpdate = Array.isArray(p.progressUpdates) && p.progressUpdates.length > 0
                    ? p.progressUpdates[p.progressUpdates.length - 1]
                    : null
                  const lastNote = String(lastProgressUpdate?.note || '').trim()
                  return (
                    <tr key={p._id}>
                      <td className="font-mono text-sm">{p.code}</td>
                      <td>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{language === 'ar' ? p.nameAr || p.nameEn : p.nameEn}</p>
                          {p.description && <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>}
                        </div>
                      </td>
                      <td>
                        {p.ownerName ? (
                          <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <User className="w-4 h-4 text-gray-400" />
                            {p.ownerName}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {p.dueDate ? (
                          <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {new Date(p.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="min-w-[140px]">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-500 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          {lastNote ? <p className="text-[11px] text-gray-500 mt-2 line-clamp-1">{lastNote}</p> : null}
                        </div>
                      </td>
                      <td className="font-semibold"><Money value={p.budget} /></td>
                      <td>
                        <span className={`badge ${statusBadge(p.status)}`}>{statusLabel(p.status)}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setDownloadingProjectPdfId(p._id)
                                const full = await api.get(`/projects/${p._id}`).then((r) => r.data)
                                await downloadProjectProgressPdf({ project: full, language, tenant })
                              } catch (e) {
                                toast.error(language === 'ar' ? 'فشل تحميل PDF' : 'Failed to download PDF')
                              } finally {
                                setDownloadingProjectPdfId(null)
                              }
                            }}
                            disabled={downloadingProjectPdfId === p._id}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg disabled:opacity-50"
                            title={language === 'ar' ? 'PDF التقدم' : 'Progress PDF'}
                          >
                            {downloadingProjectPdfId === p._id ? (
                              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openProgressModal(p)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                            title={language === 'ar' ? 'تحديث التقدم' : 'Update progress'}
                          >
                            <Percent className="w-4 h-4 text-gray-600" />
                          </button>
                          <Link to={`/projects/${p._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {pagination?.pages > 1 && (
        <div className="flex items-center justify-between">
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {language === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <div className="text-sm text-gray-500">
            {language === 'ar' ? 'صفحة' : 'Page'} {page} / {pagination.pages}
          </div>
          <button
            className="btn btn-secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          >
            {language === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}

      <AnimatePresence>
        {showProgressModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeProgressModal}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-dark-800 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-dark-700">
                <div>
                  <h3 className="text-lg font-semibold">{language === 'ar' ? 'تحديث التقدم' : 'Update Progress'}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {editingProject?.code ? `${editingProject.code} - ` : ''}
                    {(language === 'ar' ? editingProject?.nameAr || editingProject?.nameEn : editingProject?.nameEn || editingProject?.nameAr) || ''}
                  </p>
                </div>
                <button onClick={closeProgressModal} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit((form) =>
                  progressMutation.mutate({
                    id: editingProject?._id,
                    progress: Number(form.progress),
                    note: String(form.note || ''),
                  })
                )}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="label">{language === 'ar' ? 'التقدم (%)' : 'Progress (%)'}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    {...register('progress', { required: true, valueAsNumber: true })}
                    className="input"
                  />
                  <div className="mt-2">
                    <div className="h-2 bg-gray-200 dark:bg-dark-600 rounded-full overflow-hidden">
                      <div className="h-full bg-primary-500 rounded-full" style={{ width: `${liveProgress}%` }} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">{language === 'ar' ? 'ملاحظة' : 'Note'} *</label>
                  <textarea
                    rows={3}
                    {...register('note', { required: true })}
                    className="input"
                    placeholder={language === 'ar' ? 'اكتب ملاحظة التقدم...' : 'Write a progress note...'}
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closeProgressModal} className="btn btn-secondary">
                    {t('cancel')}
                  </button>
                  <button type="submit" disabled={progressMutation.isPending || !editingProject?._id} className="btn btn-primary">
                    {progressMutation.isPending ? (
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
