import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Users, AlertTriangle, Eye, Edit } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function Employees() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', nationality: '' })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['employees', page, search, filters],
    queryFn: () => api.get('/employees', { params: { page, search, ...filters } }).then(res => res.data)
  })

  const { data: stats } = useQuery({
    queryKey: ['employees-stats'],
    queryFn: () => api.get('/employees/stats').then(res => res.data)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('employees')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة بيانات الموظفين والوثائق' : 'Manage employee data and documents'}
          </p>
        </div>
        <Link to="/employees/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة موظف' : 'Add Employee'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('activeEmployees')}</p>
            <p className="text-2xl font-bold">{stats?.totalEmployees?.[0]?.count || 0}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'سعودي' : 'Saudi'}</p>
            <p className="text-2xl font-bold">
              {stats?.byNationality?.find(n => n._id?.toLowerCase() === 'saudi')?.count || 0}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'غير سعودي' : 'Non-Saudi'}</p>
            <p className="text-2xl font-bold">
              {stats?.byNationality?.filter(n => n._id?.toLowerCase() !== 'saudi').reduce((sum, n) => sum + n.count, 0) || 0}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'وثائق تنتهي' : 'Expiring Docs'}</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.expiringDocuments?.[0]?.count || 0}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`${t('search')}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input ps-10"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="select w-full sm:w-40"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="on_leave">{language === 'ar' ? 'في إجازة' : 'On Leave'}</option>
            <option value="terminated">{language === 'ar' ? 'منتهي' : 'Terminated'}</option>
          </select>
          <select
            value={filters.nationality}
            onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
            className="select w-full sm:w-40"
          >
            <option value="">{language === 'ar' ? 'كل الجنسيات' : 'All Nationalities'}</option>
            <option value="Saudi">{language === 'ar' ? 'سعودي' : 'Saudi'}</option>
            <option value="Non-Saudi">{language === 'ar' ? 'غير سعودي' : 'Non-Saudi'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{t('employeeId')}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{t('department')}</th>
                  <th>{t('nationality')}</th>
                  <th>{t('joinDate')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data?.employees?.map((emp) => (
                  <tr key={emp._id}>
                    <td className="font-medium">{emp.employeeId}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {emp.firstNameEn?.[0]}{emp.lastNameEn?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? `${emp.firstNameAr || emp.firstNameEn} ${emp.lastNameAr || emp.lastNameEn}` : `${emp.firstNameEn} ${emp.lastNameEn}`}
                          </p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{emp.department || '-'}</td>
                    <td>{emp.nationality}</td>
                    <td>{new Date(emp.joinDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        emp.status === 'active' ? 'badge-success' :
                        emp.status === 'on_leave' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/employees/${emp._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </Link>
                        <Link to={`/employees/${emp._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
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
    </div>
  )
}
