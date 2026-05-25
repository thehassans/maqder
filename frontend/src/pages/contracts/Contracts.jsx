import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  FileSignature, Plus, Search, DollarSign, Shield, CalendarCheck,
  ChevronLeft, ChevronRight, TrendingUp, Clock
} from 'lucide-react'
import api from '../../lib/api'

const STATUS_STYLES = {
  draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  on_hold: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  terminated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const StatCard = ({ icon: Icon, label, value, sub, color, loading }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-gray-100 dark:border-dark-700 shadow-sm">
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
        {loading ? <div className="h-6 w-24 bg-gray-200 dark:bg-dark-600 rounded animate-pulse mt-1" /> : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  </motion.div>
)

export default function Contracts() {
  const navigate = useNavigate()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [contracts, setContracts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  const fetchStats = useCallback(async () => {
    try { setStatsLoading(true); const { data } = await api.get('/contracts/stats'); setStats(data) }
    catch (_) {} finally { setStatsLoading(false) }
  }, [])

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/contracts', { params })
      setContracts(data.contracts || [])
      setPagination(data.pagination || { total: 0, pages: 1 })
    } catch (_) {} finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1) }, [search, statusFilter])
  useEffect(() => { fetchContracts() }, [fetchContracts])

  const formatSAR = (n) => n ? n.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' SAR' : '—'

  const getMilestoneProgress = (c) => {
    const total = c.milestones?.length || 0
    const done = c.milestones?.filter(m => ['completed', 'billed'].includes(m.status)).length || 0
    return total > 0 ? `${done}/${total}` : '—'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Contract Management', 'إدارة العقود')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('Milestones, retention, and change orders', 'المعالم والاستقطاعات وأوامر التغيير')}</p>
        </div>
        <button onClick={() => navigate('/app/dashboard/contracts/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t('New Contract', 'عقد جديد')}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileSignature} label={t('Active Contracts', 'عقود نشطة')} value={stats?.totalActive ?? 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" loading={statsLoading} />
        <StatCard icon={TrendingUp} label={t('Total Contract Value', 'إجمالي قيمة العقود')} value={stats ? formatSAR(stats.totalContractValue) : '—'} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" loading={statsLoading} />
        <StatCard icon={Shield} label={t('Retention Held', 'الاستقطاع المحتجز')} value={stats ? formatSAR(stats.totalRetentionHeld) : '—'} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" loading={statsLoading} />
        <StatCard icon={Clock} label={t('Upcoming Milestones', 'معالم قادمة')} sub={t('next 30 days', '30 يوم القادمة')} value={stats?.upcomingMilestones ?? 0} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" loading={statsLoading} />
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search contracts...', 'بحث...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white">
          <option value="">{t('All Statuses', 'كل الحالات')}</option>
          {Object.keys(STATUS_STYLES).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {[...Array(5)].map((_, i) => <div key={i} className="p-4 h-16 animate-pulse bg-gray-50/50 dark:bg-dark-700/20" />)}
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <FileSignature className="w-12 h-12 opacity-30" />
            <p className="font-medium">{t('No contracts found', 'لا توجد عقود')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                    {[t('Contract #', 'رقم العقد'), t('Title', 'العنوان'), t('Customer', 'العميل'), t('Value (SAR)', 'القيمة'), t('Retention', 'الاستقطاع'), t('Status', 'الحالة'), t('Progress', 'التقدم'), t('Actions', 'إجراءات')].map(h => (
                      <th key={h} className="px-4 py-3 text-start font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                  {contracts.map((c, idx) => (
                    <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">{c.contractNumber}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-white">{isAr && c.titleAr ? c.titleAr : c.title}</p>
                        {c.project && <p className="text-xs text-gray-400">{c.project.nameEn}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.customerName || c.customer?.legalNameEn || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {c.revisedContractValue?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.retentionPercent}%</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[c.status] || STATUS_STYLES.draft}`}>
                          {c.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{getMilestoneProgress(c)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/app/dashboard/contracts/${c._id}`)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 text-xs font-medium hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 transition-colors">
                          {t('Open', 'فتح')}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} {t('contracts', 'عقد')}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 disabled:opacity-40">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{page} / {pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 disabled:opacity-40">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
