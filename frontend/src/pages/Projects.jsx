import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, FolderKanban, Calendar, User, AlertTriangle, Edit, Percent, X, Save, Download, StickyNote, Receipt } from 'lucide-react'
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

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedProjectId, setSelectedProjectId] = useState(null)
  const [activeTab, setActiveTab] = useState('progress')

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      progress: 0,
      note: '',
    },
  })

  const {
    register: registerProjectNote,
    handleSubmit: handleSubmitProjectNote,
    reset: resetProjectNote,
    watch: watchProjectNote,
  } = useForm({
    defaultValues: {
      note: '',
    },
  })

  const openDrawer = (project) => {
    const id = project?._id
    if (!id) return
    setSelectedProjectId(id)
    setActiveTab('progress')
    reset({
      progress: project?.progress ?? 0,
      note: '',
    })
    resetProjectNote({ note: '' })
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedProjectId(null)
    reset({ progress: 0, note: '' })
    resetProjectNote({ note: '' })
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

  const { data: projectDetails, isFetching: isProjectLoading } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => api.get(`/projects/${selectedProjectId}`).then((res) => res.data),
    enabled: Boolean(selectedProjectId),
    retry: false,
  })

  const { data: projectExpenseStats } = useQuery({
    queryKey: ['project-expense-stats', selectedProjectId],
    queryFn: () => api.get('/expenses/stats', { params: { projectId: selectedProjectId } }).then((res) => res.data),
    enabled: Boolean(selectedProjectId),
    retry: false,
  })

  const { data: projectExpensesData, isFetching: isProjectExpensesLoading } = useQuery({
    queryKey: ['project-expenses', selectedProjectId],
    queryFn: () =>
      api
        .get('/expenses', {
          params: {
            projectId: selectedProjectId,
            page: 1,
            limit: 20,
          },
        })
        .then((res) => res.data),
    enabled: Boolean(selectedProjectId),
    retry: false,
  })

  const progressMutation = useMutation({
    mutationFn: ({ id, progress, note }) => api.post(`/projects/${id}/progress`, { progress, note }).then((r) => r.data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث التقدم' : 'Progress updated')
      queryClient.invalidateQueries(['projects'])
      queryClient.invalidateQueries(['projects-stats'])
      queryClient.invalidateQueries(['project', selectedProjectId])
    },
    onError: (err) => toast.error(err.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error')),
  })

  const addNoteMutation = useMutation({
    mutationFn: ({ id, note }) => api.post(`/projects/${id}/notes`, { note }).then((r) => r.data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إضافة الملاحظة' : 'Note added')
      queryClient.invalidateQueries(['projects'])
      queryClient.invalidateQueries(['project', selectedProjectId])
      resetProjectNote({ note: '' })
      setActiveTab('notes')
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
  const liveNote = String(watch('note') || '').trim()
  const liveProjectNote = String(watchProjectNote('note') || '').trim()

  const drawerProjectName = useMemo(() => {
    const p = projectDetails
    if (!p) return ''
    return (language === 'ar' ? p?.nameAr || p?.nameEn : p?.nameEn || p?.nameAr) || ''
  }, [projectDetails, language])

  const progressUpdates = Array.isArray(projectDetails?.progressUpdates) ? projectDetails.progressUpdates : []
  const projectNotes = Array.isArray(projectDetails?.projectNotes) ? projectDetails.projectNotes : []
  const projectExpenses = Array.isArray(projectExpensesData?.expenses) ? projectExpensesData.expenses : []
  const spentTotal = Number(projectExpenseStats?.totals?.grossTotal || 0)

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
                            onClick={() => openDrawer(p)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                            title={language === 'ar' ? 'لوحة المشروع' : 'Project panel'}
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
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
            />

            <motion.aside
              initial={{ x: language === 'ar' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '-100%' : '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className={`fixed inset-y-0 ${language === 'ar' ? 'left-0 border-r' : 'right-0 border-l'} w-full sm:w-[520px] bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 shadow-2xl z-50 overflow-hidden`}
            >
              <div className="h-full flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-dark-700 bg-gradient-to-b from-primary-50/60 to-white dark:from-primary-900/20 dark:to-dark-800">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-lg">
                          <Percent className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {language === 'ar' ? 'لوحة المشروع' : 'Project Panel'}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {projectDetails?.code ? `${projectDetails.code} - ` : ''}{drawerProjectName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button onClick={closeDrawer} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-white/70 dark:bg-dark-700/40 border border-gray-200/60 dark:border-dark-600">
                      <div className="text-[11px] text-gray-500">{language === 'ar' ? 'التقدم' : 'Progress'}</div>
                      <div className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{Math.max(0, Math.min(100, Number(projectDetails?.progress || 0)))}%</div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/70 dark:bg-dark-700/40 border border-gray-200/60 dark:border-dark-600">
                      <div className="text-[11px] text-gray-500">{language === 'ar' ? 'الميزانية' : 'Budget'}</div>
                      <div className="mt-1 text-lg font-bold text-gray-900 dark:text-white"><Money value={projectDetails?.budget || 0} /></div>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/70 dark:bg-dark-700/40 border border-gray-200/60 dark:border-dark-600">
                      <div className="text-[11px] text-gray-500">{language === 'ar' ? 'المصروفات' : 'Expenses'}</div>
                      <div className="mt-1 text-lg font-bold text-gray-900 dark:text-white"><Money value={spentTotal || 0} /></div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('progress')}
                      className={`px-3 py-2 rounded-xl text-sm border transition-colors ${activeTab === 'progress' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white/60 dark:bg-dark-700/40 border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                    >
                      {language === 'ar' ? 'التقدم' : 'Progress'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('notes')}
                      className={`px-3 py-2 rounded-xl text-sm border transition-colors inline-flex items-center gap-2 ${activeTab === 'notes' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white/60 dark:bg-dark-700/40 border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                    >
                      <StickyNote className="w-4 h-4" />
                      {language === 'ar' ? 'الملاحظات' : 'Notes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('expenses')}
                      className={`px-3 py-2 rounded-xl text-sm border transition-colors inline-flex items-center gap-2 ${activeTab === 'expenses' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white/60 dark:bg-dark-700/40 border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700'}`}
                    >
                      <Receipt className="w-4 h-4" />
                      {language === 'ar' ? 'المصروفات' : 'Expenses'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {activeTab === 'progress' && (
                    <>
                      <div className="card p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'تحديث التقدم' : 'Update Progress'}</div>
                            <div className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'أضف تحديثاً مع ملاحظة ليتم حفظه في السجل.' : 'Add a progress update with a note to keep a proper history.'}</div>
                          </div>
                        </div>

                        <form
                          onSubmit={handleSubmit((form) =>
                            progressMutation.mutate({
                              id: selectedProjectId,
                              progress: Number(form.progress),
                              note: String(form.note || ''),
                            })
                          )}
                          className="mt-4 space-y-4"
                        >
                          <div>
                            <label className="label">{language === 'ar' ? 'التقدم (%)' : 'Progress (%)'}</label>
                            <div className="grid grid-cols-[1fr,96px] gap-3 items-center">
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="1"
                                value={liveProgress}
                                onChange={(e) => {
                                  const v = Number(e.target.value)
                                  setValue('progress', v, { shouldDirty: true })
                                }}
                                className="w-full"
                              />
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                {...register('progress', { required: true, valueAsNumber: true })}
                                className="input"
                              />
                            </div>
                            <div className="mt-3">
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
                            <button type="button" onClick={closeDrawer} className="btn btn-secondary">
                              {t('cancel')}
                            </button>
                            <button
                              type="submit"
                              disabled={progressMutation.isPending || !selectedProjectId || !liveNote}
                              className="btn btn-primary"
                            >
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
                      </div>

                      <div className="card p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'سجل التقدم' : 'Progress Timeline'}</div>
                            <div className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'آخر التحديثات تظهر هنا.' : 'Your most recent updates appear here.'}</div>
                          </div>
                        </div>

                        {isProjectLoading ? (
                          <div className="mt-5 text-center"><div className="inline-block w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                        ) : progressUpdates.length === 0 ? (
                          <div className="mt-4 text-sm text-gray-500">{language === 'ar' ? 'لا يوجد تحديثات بعد' : 'No updates yet'}</div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {[...progressUpdates].reverse().slice(0, 12).map((u, idx) => (
                              <div key={u?._id || `${u?.createdAt || idx}`} className="p-4 rounded-2xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{Math.max(0, Math.min(100, Number(u?.progress || 0)))}%</div>
                                  <div className="text-xs text-gray-500">{u?.createdAt ? new Date(u.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : ''}</div>
                                </div>
                                {String(u?.note || '').trim() ? (
                                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{String(u.note).trim()}</div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeTab === 'notes' && (
                    <>
                      <div className="card p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'ملاحظة جديدة' : 'New Note'}</div>
                            <div className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'هذه الملاحظات مستقلة عن تحديثات التقدم.' : 'These notes are separate from progress updates.'}</div>
                          </div>
                        </div>

                        <form
                          onSubmit={handleSubmitProjectNote((form) =>
                            addNoteMutation.mutate({
                              id: selectedProjectId,
                              note: String(form.note || ''),
                            })
                          )}
                          className="mt-4 space-y-4"
                        >
                          <div>
                            <label className="label">{language === 'ar' ? 'الملاحظة' : 'Note'} *</label>
                            <textarea
                              rows={4}
                              {...registerProjectNote('note', { required: true })}
                              className="input"
                              placeholder={language === 'ar' ? 'اكتب ملاحظة للمشروع...' : 'Write a project note...'}
                            />
                          </div>

                          <div className="flex justify-end">
                            <button type="submit" disabled={addNoteMutation.isPending || !selectedProjectId || !liveProjectNote} className="btn btn-primary">
                              {addNoteMutation.isPending ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  {language === 'ar' ? 'إضافة' : 'Add'}
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>

                      <div className="card p-5">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'سجل الملاحظات' : 'Notes History'}</div>

                        {isProjectLoading ? (
                          <div className="mt-5 text-center"><div className="inline-block w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                        ) : projectNotes.length === 0 ? (
                          <div className="mt-4 text-sm text-gray-500">{language === 'ar' ? 'لا يوجد ملاحظات بعد' : 'No notes yet'}</div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {[...projectNotes].reverse().slice(0, 20).map((n, idx) => (
                              <div key={n?._id || `${n?.createdAt || idx}`} className="p-4 rounded-2xl border border-gray-200 dark:border-dark-700">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-500">{n?.createdAt ? new Date(n.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US') : ''}</div>
                                  <div className="text-xs text-gray-500">{n?.createdBy ? `${n.createdBy.firstName || ''} ${n.createdBy.lastName || ''}`.trim() : ''}</div>
                                </div>
                                {String(n?.note || '').trim() ? (
                                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{String(n.note).trim()}</div>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {activeTab === 'expenses' && (
                    <>
                      <div className="card p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'مصروفات المشروع' : 'Project Expenses'}</div>
                            <div className="text-xs text-gray-500 mt-1">{language === 'ar' ? 'مرتبطة بالمشروع عبر projectId.' : 'Linked to this project via projectId.'}</div>
                          </div>
                          <Link to={`/expenses/new?projectId=${selectedProjectId}`} className="btn btn-primary">
                            <Plus className="w-4 h-4" />
                            {language === 'ar' ? 'مصروف جديد' : 'New Expense'}
                          </Link>
                        </div>

                        {isProjectExpensesLoading ? (
                          <div className="mt-5 text-center"><div className="inline-block w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
                        ) : projectExpenses.length === 0 ? (
                          <div className="mt-4 text-sm text-gray-500">{language === 'ar' ? 'لا توجد مصروفات مرتبطة' : 'No linked expenses yet'}</div>
                        ) : (
                          <div className="mt-4 space-y-3">
                            {projectExpenses.map((e) => (
                              <Link key={e._id} to={`/expenses/${e._id}`} className="block p-4 rounded-2xl border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{e.expenseNumber}</div>
                                    <div className="text-xs text-gray-500 mt-1">{e.expenseDate ? new Date(e.expenseDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : ''}</div>
                                  </div>
                                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    <Money value={e.totalAmount ?? (Number(e.amount || 0) + Number(e.taxAmount || 0))} />
                                  </div>
                                </div>
                                {String(e?.description || e?.descriptionAr || '').trim() ? (
                                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{language === 'ar' ? e.descriptionAr || e.description : e.description || e.descriptionAr}</div>
                                ) : null}
                              </Link>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex justify-end">
                          <Link to={`/expenses?projectId=${selectedProjectId}`} className="btn btn-secondary">
                            {language === 'ar' ? 'عرض الكل' : 'View all'}
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-dark-700 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    {isProjectLoading ? (language === 'ar' ? 'جارِ التحميل...' : 'Loading...') : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={closeDrawer} className="btn btn-secondary">
                      {language === 'ar' ? 'إغلاق' : 'Close'}
                    </button>
                    <Link to={selectedProjectId ? `/projects/${selectedProjectId}` : '/projects'} className="btn btn-primary">
                      <Edit className="w-4 h-4" />
                      {language === 'ar' ? 'فتح التفاصيل' : 'Open details'}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
