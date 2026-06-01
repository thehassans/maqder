import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Building, Calendar, ClipboardList } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ManpowerAssignments() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['manpower-assignments', status],
    queryFn: () =>
      api
        .get('/manpower/assignments', { params: { status } })
        .then((res) => res.data),
  })

  const getStatusBadge = (s) => {
    switch(s) {
      case 'active': return 'badge-success'
      case 'completed': return 'badge-info'
      case 'cancelled': return 'badge-danger'
      default: return 'badge-neutral'
    }
  }

  const getStatusLabel = (s) => {
    if (language === 'en') return s.charAt(0).toUpperCase() + s.slice(1)
    switch(s) {
      case 'active': return 'نشط'
      case 'completed': return 'مكتمل'
      case 'cancelled': return 'ملغي'
      default: return s
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'العقود والتعيينات' : 'Assignments'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة تعيين العمالة للعملاء' : 'Manage manpower assignments to clients'}
          </p>
        </div>
        <Link to="/app/dashboard/manpower/assignments/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة تعيين' : 'New Assignment'}
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث برقم التعيين...' : 'Search by assignment number...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input ps-10"
            />
          </div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="select w-full lg:w-48">
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
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
                  <th>{language === 'ar' ? 'الرقم' : 'Number'}</th>
                  <th>{language === 'ar' ? 'العميل' : 'Client'}</th>
                  <th>{language === 'ar' ? 'الموقع' : 'Site'}</th>
                  <th>{language === 'ar' ? 'العمالة' : 'Workers'}</th>
                  <th>{language === 'ar' ? 'الفترة' : 'Period'}</th>
                  <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody>
                {(assignments || [])
                  .filter(a => search ? a.assignmentNumber?.toLowerCase().includes(search.toLowerCase()) : true)
                  .map((assignment) => (
                  <tr key={assignment._id}>
                    <td className="font-mono text-sm">
                      <Link to={`/app/dashboard/manpower/assignments/${assignment._id}`} className="font-semibold text-primary-600 hover:underline">
                        {assignment.assignmentNumber}
                      </Link>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        {language === 'ar' ? assignment.clientId?.nameAr || assignment.clientId?.name : assignment.clientId?.name}
                      </span>
                    </td>
                    <td>{assignment.site || '-'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 badge badge-neutral">
                        <ClipboardList className="w-3.5 h-3.5" />
                        {assignment.workers?.length || 0}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        {new Date(assignment.startDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        {' - '}
                        {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : 'Ongoing'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(assignment.status)}`}>
                        {getStatusLabel(assignment.status)}
                      </span>
                    </td>
                  </tr>
                ))}
                {assignments?.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      {language === 'ar' ? 'لا يوجد تعيينات' : 'No assignments found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
