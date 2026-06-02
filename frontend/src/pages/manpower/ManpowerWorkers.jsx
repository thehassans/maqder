import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Users, HardHat, CheckCircle2, XCircle } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ManpowerWorkers() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [trade, setTrade] = useState('')

  const { data: workers, isLoading } = useQuery({
    queryKey: ['manpower-workers', search, status, trade],
    queryFn: () =>
      api
        .get('/manpower/workers', { params: { search, status, trade } })
        .then((res) => res.data),
  })

  const trades = ['carpenter', 'plumber', 'mason', 'electrician', 'welder', 'helper', 'driver', 'operator', 'other']

  const getStatusBadge = (s) => {
    switch(s) {
      case 'available': return 'badge-success'
      case 'assigned': return 'badge-info'
      case 'on_leave': return 'badge-warning'
      case 'terminated': return 'badge-danger'
      default: return 'badge-neutral'
    }
  }

  const getStatusLabel = (s) => {
    if (language === 'en') return s.replace('_', ' ').toUpperCase()
    switch(s) {
      case 'available': return 'متاح'
      case 'assigned': return 'معين'
      case 'on_leave': return 'في إجازة'
      case 'terminated': return 'منهي'
      default: return s
    }
  }

  const getTradeLabel = (tr) => {
    if (language === 'en') return tr.charAt(0).toUpperCase() + tr.slice(1)
    const arTrades = {
      carpenter: 'نجار',
      plumber: 'سباك',
      mason: 'بناء',
      electrician: 'كهربائي',
      welder: 'لحام',
      helper: 'مساعد',
      driver: 'سائق',
      operator: 'مشغل',
      other: 'أخرى'
    }
    return arTrades[tr] || tr
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'العمالة' : 'Manpower Workers'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة العمال والموظفين' : 'Manage workers and personnel'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/app/dashboard/manpower/workers/bulk" className="btn btn-secondary">
            <Users className="w-4 h-4" />
            {language === 'ar' ? 'إضافة متعددة' : 'Bulk Add'}
          </Link>
          <Link to="/app/dashboard/manpower/workers/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة عامل' : 'Add Worker'}
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالاسم أو الرقم...' : 'Search by name or number...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input ps-10"
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)} className="select w-full lg:w-48">
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Statuses'}</option>
            <option value="available">{language === 'ar' ? 'متاح' : 'Available'}</option>
            <option value="assigned">{language === 'ar' ? 'معين' : 'Assigned'}</option>
            <option value="on_leave">{language === 'ar' ? 'في إجازة' : 'On Leave'}</option>
            <option value="terminated">{language === 'ar' ? 'منهي' : 'Terminated'}</option>
          </select>

          <select value={trade} onChange={(e) => setTrade(e.target.value)} className="select w-full lg:w-48">
            <option value="">{language === 'ar' ? 'كل المهن' : 'All Trades'}</option>
            {trades.map(tr => (
              <option key={tr} value={tr}>{getTradeLabel(tr)}</option>
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
                  <th>{language === 'ar' ? 'الرقم' : 'Number'}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'المهنة' : 'Trade'}</th>
                  <th>{language === 'ar' ? 'الجنسية' : 'Nationality'}</th>
                  <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{language === 'ar' ? 'التعيين الحالي' : 'Current Assignment'}</th>
                </tr>
              </thead>
              <tbody>
                {(workers || []).map((worker) => (
                  <tr key={worker._id}>
                    <td className="font-mono text-sm">{worker.workerNumber}</td>
                    <td>
                      <Link to={`/app/dashboard/manpower/workers/${worker._id}`} className="font-semibold text-primary-600 hover:underline">
                        {language === 'ar' ? worker.nameAr || worker.name : worker.name}
                      </Link>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5">
                        <HardHat className="w-4 h-4 text-amber-500" />
                        {getTradeLabel(worker.trade)}
                      </span>
                    </td>
                    <td>{worker.nationality || '-'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(worker.status)}`}>
                        {getStatusLabel(worker.status)}
                      </span>
                    </td>
                    <td>
                      {worker.currentAssignment ? (
                        <Link to={`/app/dashboard/manpower/assignments/${worker.currentAssignment._id}`} className="text-sm text-blue-600 hover:underline">
                          {worker.currentAssignment.assignmentNumber}
                        </Link>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
                {workers?.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-gray-500">
                      {language === 'ar' ? 'لا يوجد عمالة' : 'No workers found'}
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
