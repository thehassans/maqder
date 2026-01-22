import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, ClipboardList, FolderKanban, User, Calendar, AlertTriangle, Edit } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'

export default function Tasks() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', priority: '', projectId: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, search, filters],
    queryFn: () =>
      api
        .get('/tasks', { params: { page, limit: 25, search, status: filters.status, priority: filters.priority, projectId: filters.projectId } })
        .then((res) => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['tasks-stats'],
    queryFn: () => api.get('/tasks/stats').then((res) => res.data),
  })

  const { data: projects } = useQuery({
    queryKey: ['projects-lookup'],
    queryFn: () => api.get('/projects', { params: { limit: 200 } }).then((res) => res.data.projects),
  })

  const totals = stats?.totals?.[0]
  const totalTasks = totals?.total || 0
  const openTasks = totals?.open || 0
  const doneTasks = totals?.done || 0
  const overdueTasks = stats?.overdue?.[0]?.count || 0

  const tasks = data?.tasks || []
  const pagination = data?.pagination

  const statusBadge = (value) => {
    if (value === 'done') return 'badge-success'
    if (value === 'in_progress') return 'badge-info'
    if (value === 'blocked') return 'badge-warning'
    if (value === 'cancelled') return 'badge-danger'
    return 'badge-neutral'
  }

  const statusLabel = (value) => {
    if (language === 'ar') {
      if (value === 'todo') return 'للعمل'
      if (value === 'in_progress') return 'قيد التنفيذ'
      if (value === 'blocked') return 'معطل'
      if (value === 'done') return 'مكتمل'
      if (value === 'cancelled') return 'ملغي'
      return value
    }
    return value
  }

  const priorityBadge = (value) => {
    if (value === 'urgent') return 'badge-danger'
    if (value === 'high') return 'badge-warning'
    if (value === 'medium') return 'badge-info'
    return 'badge-neutral'
  }

  const priorityLabel = (value) => {
    if (language === 'ar') {
      if (value === 'urgent') return 'عاجل'
      if (value === 'high') return 'عالي'
      if (value === 'medium') return 'متوسط'
      if (value === 'low') return 'منخفض'
      return value
    }
    return value
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'المهام' : 'Tasks'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{language === 'ar' ? 'إدارة المهام' : 'Manage tasks'}</p>
        </div>
        <Link to="/tasks/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة مهمة' : 'Add Task'}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <ClipboardList className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}</p>
            <p className="text-2xl font-bold">{totalTasks}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <ClipboardList className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'مفتوحة' : 'Open'}</p>
            <p className="text-2xl font-bold text-blue-600">{openTasks}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'مكتملة' : 'Done'}</p>
            <p className="text-2xl font-bold text-emerald-600">{doneTasks}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'متأخرة' : 'Overdue'}</p>
            <p className="text-2xl font-bold text-amber-600">{overdueTasks}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالعنوان / الرقم / المكلّف...' : 'Search by title / number / assignee...'}
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
            <option value="todo">{language === 'ar' ? 'للعمل' : 'To do'}</option>
            <option value="in_progress">{language === 'ar' ? 'قيد التنفيذ' : 'In Progress'}</option>
            <option value="blocked">{language === 'ar' ? 'معطل' : 'Blocked'}</option>
            <option value="done">{language === 'ar' ? 'مكتمل' : 'Done'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => {
              setFilters((f) => ({ ...f, priority: e.target.value }))
              setPage(1)
            }}
            className="select w-full lg:w-44"
          >
            <option value="">{language === 'ar' ? 'كل الأولويات' : 'All Priority'}</option>
            <option value="urgent">{language === 'ar' ? 'عاجل' : 'Urgent'}</option>
            <option value="high">{language === 'ar' ? 'عالي' : 'High'}</option>
            <option value="medium">{language === 'ar' ? 'متوسط' : 'Medium'}</option>
            <option value="low">{language === 'ar' ? 'منخفض' : 'Low'}</option>
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
                  <th>{language === 'ar' ? 'رقم المهمة' : 'Task #'}</th>
                  <th>{language === 'ar' ? 'العنوان' : 'Title'}</th>
                  <th>{language === 'ar' ? 'المشروع' : 'Project'}</th>
                  <th>{language === 'ar' ? 'المكلّف' : 'Assignee'}</th>
                  <th>{language === 'ar' ? 'تاريخ الانتهاء' : 'Due Date'}</th>
                  <th>{language === 'ar' ? 'الأولوية' : 'Priority'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td className="font-mono text-sm">{task.taskNumber}</td>
                    <td>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? task.titleAr || task.titleEn : task.titleEn}
                      </p>
                      {task.description && <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>}
                    </td>
                    <td>
                      {task.projectId ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <FolderKanban className="w-4 h-4 text-gray-400" />
                          {language === 'ar'
                            ? task.projectId?.nameAr || task.projectId?.nameEn || task.projectId?.code
                            : task.projectId?.nameEn || task.projectId?.nameAr || task.projectId?.code}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {task.assigneeName ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <User className="w-4 h-4 text-gray-400" />
                          {task.assigneeName}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {task.dueDate ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(task.dueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${priorityBadge(task.priority)}`}>{priorityLabel(task.priority)}</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(task.status)}`}>{statusLabel(task.status)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/tasks/${task._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
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
