import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, Building, Activity, Calendar } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ManpowerDashboard() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const { data: stats, isLoading } = useQuery({
    queryKey: ['manpower-dashboard-stats'],
    queryFn: async () => {
      // For dashboard, we can just aggregate from workers and assignments
      const [workersRes, assignmentsRes] = await Promise.all([
        api.get('/manpower/workers'),
        api.get('/manpower/assignments')
      ])
      
      const workers = workersRes.data || []
      const assignments = assignmentsRes.data || []

      const activeWorkers = workers.filter(w => w.status === 'assigned').length
      const availableWorkers = workers.filter(w => w.status === 'available').length
      const activeAssignments = assignments.filter(a => a.status === 'active').length
      
      return {
        totalWorkers: workers.length,
        activeWorkers,
        availableWorkers,
        activeAssignments,
        recentAssignments: assignments.slice(0, 5)
      }
    }
  })

  if (isLoading) {
    return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'لوحة تحكم الموارد البشرية' : 'Manpower Dashboard'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' ? 'نظرة عامة على العمالة والعقود' : 'Overview of workforce and assignments'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي العمالة' : 'Total Workers'}</p>
              <p className="text-2xl font-bold">{stats?.totalWorkers || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'عمالة معينة' : 'Assigned Workers'}</p>
              <p className="text-2xl font-bold text-emerald-600">{stats?.activeWorkers || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'عمالة متاحة' : 'Available Workers'}</p>
              <p className="text-2xl font-bold text-amber-600">{stats?.availableWorkers || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Building className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{language === 'ar' ? 'عقود نشطة' : 'Active Assignments'}</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.activeAssignments || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <div className="p-4 border-b border-gray-200 dark:border-dark-600 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {language === 'ar' ? 'أحدث العقود' : 'Recent Assignments'}
            </h3>
            <Link to="/app/dashboard/manpower/assignments" className="text-sm text-primary-600 hover:underline">
              {language === 'ar' ? 'عرض الكل' : 'View All'}
            </Link>
          </div>
          <div className="p-4">
            <div className="space-y-4">
              {stats?.recentAssignments?.length > 0 ? (
                stats.recentAssignments.map(a => (
                  <div key={a._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                    <div>
                      <Link to={`/app/dashboard/manpower/assignments/${a._id}`} className="font-medium text-primary-600 hover:underline">
                        {a.assignmentNumber}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">{language === 'ar' ? a.clientId?.nameAr || a.clientId?.name : a.clientId?.name}</p>
                    </div>
                    <span className={`badge ${a.status === 'active' ? 'badge-success' : a.status === 'completed' ? 'badge-info' : 'badge-neutral'}`}>
                      {a.status === 'active' ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'مكتمل' : 'Completed')}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  {language === 'ar' ? 'لا توجد عقود حديثة' : 'No recent assignments'}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
