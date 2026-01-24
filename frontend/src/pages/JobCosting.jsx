import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Briefcase, FolderKanban, Calendar, Edit, AlertTriangle, Coins, HelpCircle } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'
import ExportMenu from '../components/ui/ExportMenu'

export default function JobCosting() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', projectId: '' })

  const exportColumns = [
    {
      key: 'code',
      label: language === 'ar' ? 'الكود' : 'Code',
      value: (r) => r?.code || ''
    },
    {
      key: 'name',
      label: language === 'ar' ? 'العمل' : 'Job',
      value: (r) => (language === 'ar' ? r?.nameAr || r?.nameEn : r?.nameEn || r?.nameAr) || ''
    },
    {
      key: 'project',
      label: language === 'ar' ? 'المشروع' : 'Project',
      value: (r) => {
        const p = r?.projectId
        return p ? (language === 'ar' ? p.nameAr || p.nameEn || p.code : p.nameEn || p.nameAr || p.code) : ''
      }
    },
    {
      key: 'budget',
      label: language === 'ar' ? 'الميزانية' : 'Budget',
      value: (r) => r?.budget ?? ''
    },
    {
      key: 'totalCost',
      label: language === 'ar' ? 'التكلفة' : 'Cost',
      value: (r) => r?.costSummary?.totalCost ?? ''
    },
    {
      key: 'dueDate',
      label: language === 'ar' ? 'آخر موعد' : 'Due',
      value: (r) => (r?.dueDate ? new Date(r.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '')
    },
    {
      key: 'status',
      label: t('status'),
      value: (r) => r?.status || ''
    },
  ]

  const { data, isLoading } = useQuery({
    queryKey: ['job-costing', page, search, filters],
    queryFn: () =>
      api
        .get('/job-costing/jobs', {
          params: {
            page,
            limit: 25,
            search,
            status: filters.status,
            projectId: filters.projectId,
          },
        })
        .then((res) => res.data),
  })

  const getExportRows = async () => {
    const limit = 200
    let currentPage = 1
    let all = []

    while (true) {
      const res = await api.get('/job-costing/jobs', {
        params: {
          page: currentPage,
          limit,
          search,
          status: filters.status,
          projectId: filters.projectId,
        },
      })
      const batch = res.data?.jobs || []
      all = all.concat(batch)

      const pages = res.data?.pagination?.pages || 1
      if (currentPage >= pages) break
      currentPage += 1

      if (all.length >= 10000) break
    }

    return all
  }

  const { data: stats } = useQuery({
    queryKey: ['job-costing-stats'],
    queryFn: () => api.get('/job-costing/jobs/stats').then((res) => res.data),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects-lookup'],
    queryFn: () => api.get('/projects', { params: { limit: 200 } }).then((res) => res.data.projects),
  })

  const jobs = data?.jobs || []
  const pagination = data?.pagination

  const totals = stats?.totals?.[0]
  const totalJobs = totals?.total || 0
  const activeJobs = totals?.active || 0
  const completedJobs = totals?.completed || 0
  const overdueJobs = stats?.overdue?.[0]?.count || 0

  const totalCost = stats?.costs?.totalCost?.[0]?.totalCost || 0
  const monthCost = stats?.costs?.monthCost?.[0]?.totalCost || 0

  const statusBadge = (value) => {
    if (value === 'completed') return 'badge-success'
    if (value === 'active') return 'badge-info'
    if (value === 'on_hold') return 'badge-warning'
    if (value === 'cancelled') return 'badge-danger'
    return 'badge-neutral'
  }

  const statusLabel = (value) => {
    if (language === 'ar') {
      if (value === 'planned') return 'مخطط'
      if (value === 'active') return 'نشط'
      if (value === 'on_hold') return 'متوقف'
      if (value === 'completed') return 'مكتمل'
      if (value === 'cancelled') return 'ملغي'
      return value
    }
    return value
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'تكلفة الأعمال' : 'Job Costing'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'تتبع تكاليف العمل حسب البنود والتصنيفات' : 'Track job costs by entries and categories'}
          </p>
        </div>

        <div className="flex gap-2">
          <ExportMenu
            language={language}
            t={t}
            rows={jobs}
            getRows={getExportRows}
            columns={exportColumns}
            fileBaseName={language === 'ar' ? 'تكلفة_الأعمال' : 'JobCosting'}
            title={language === 'ar' ? 'تكلفة الأعمال' : 'Job Costing'}
            disabled={isLoading || jobs.length === 0}
          />
          <Link to="/job-costing/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة عمل' : 'Add Job'}
          </Link>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-100 dark:bg-dark-700 rounded-xl">
            <HelpCircle className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'ما فائدة تكلفة الأعمال؟' : 'What is Job Costing for?'}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {language === 'ar'
                ? 'تكلفة الأعمال تساعدك على تجميع وتتبّع التكاليف (مواد/عمالة/مصروفات) لكل عمل أو مشروع، ومقارنة التكلفة الفعلية بالميزانية.'
                : 'Job Costing lets you collect and track costs (materials/labor/overhead) per job/project, and compare actual cost against budget.'}
            </div>
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="font-medium text-gray-900 dark:text-white">{language === 'ar' ? 'المدخلات' : 'Inputs'}</div>
              <div className="mt-1">{language === 'ar' ? 'بنود تكاليف يدوية + إمكانية استيراد مصروفات المشروع المرتبطة.' : 'Manual cost entries + ability to import linked project expenses.'}</div>
              <div className="font-medium text-gray-900 dark:text-white mt-3">{language === 'ar' ? 'المخرجات' : 'Outputs'}</div>
              <div className="mt-1">{language === 'ar' ? 'ملخص تكلفة، توزيع حسب النوع، وتقرير فرق الميزانية.' : 'Cost summary, breakdown by type, and budget variance.'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Briefcase className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي الأعمال' : 'Total Jobs'}</p>
            <p className="text-2xl font-bold">{totalJobs}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Briefcase className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'نشطة' : 'Active'}</p>
            <p className="text-2xl font-bold text-blue-600">{activeJobs}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Coins className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'تكلفة إجمالية' : 'Total Cost'}</p>
            <p className="text-2xl font-bold text-emerald-600">
              <Money value={totalCost} minimumFractionDigits={0} maximumFractionDigits={0} />
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'متأخر' : 'Overdue'}</p>
            <p className="text-2xl font-bold text-amber-600">{overdueJobs}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'تكلفة هذا الشهر' : 'This Month Cost'}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
            <Money value={monthCost} minimumFractionDigits={0} maximumFractionDigits={0} />
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'مكتمل' : 'Completed'}</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{completedJobs}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالكود / الاسم...' : 'Search by code / name...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }))
              setPage(1)
            }}
            className="select w-full lg:w-48"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="planned">{language === 'ar' ? 'مخطط' : 'Planned'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="on_hold">{language === 'ar' ? 'متوقف' : 'On Hold'}</option>
            <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          </select>

          <select
            value={filters.projectId}
            onChange={(e) => {
              setFilters((f) => ({ ...f, projectId: e.target.value }))
              setPage(1)
            }}
            className="select w-full lg:w-72"
          >
            <option value="">{language === 'ar' ? 'كل المشاريع' : 'All Projects'}</option>
            {(projects || []).map((p) => (
              <option key={p._id} value={p._id}>
                {(language === 'ar' ? p.nameAr || p.nameEn : p.nameEn) || p.code}
              </option>
            ))}
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
                  <th>{language === 'ar' ? 'العمل' : 'Job'}</th>
                  <th>{language === 'ar' ? 'المشروع' : 'Project'}</th>
                  <th>{language === 'ar' ? 'الميزانية' : 'Budget'}</th>
                  <th>{language === 'ar' ? 'التكلفة' : 'Cost'}</th>
                  <th>{language === 'ar' ? 'آخر موعد' : 'Due'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((j) => (
                  <tr key={j._id}>
                    <td className="font-mono text-sm">{j.code}</td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{language === 'ar' ? j.nameAr || j.nameEn : j.nameEn}</p>
                        {j.description && <p className="text-xs text-gray-500 line-clamp-1">{j.description}</p>}
                      </div>
                    </td>
                    <td>
                      {j.projectId ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                          {language === 'ar'
                            ? j.projectId?.nameAr || j.projectId?.nameEn || j.projectId?.code
                            : j.projectId?.nameEn || j.projectId?.nameAr || j.projectId?.code}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="font-semibold">
                      <Money value={j.budget || 0} minimumFractionDigits={0} maximumFractionDigits={0} />
                    </td>
                    <td className="font-semibold">
                      <Money value={j.costSummary?.totalCost || 0} minimumFractionDigits={0} maximumFractionDigits={0} />
                      <div className="text-xs text-gray-500">{(j.costSummary?.entries || 0).toLocaleString()} {language === 'ar' ? 'بنود' : 'entries'}</div>
                    </td>
                    <td>
                      {j.dueDate ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(j.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(j.status)}`}>{statusLabel(j.status)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/job-costing/${j._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
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
    </div>
  )
}
