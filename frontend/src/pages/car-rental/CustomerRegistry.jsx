import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Users, Plus, Search, Ban, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'

const daysUntil = (date) => date ? Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24)) : null

export default function CustomerRegistry() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [customers, setCustomers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  const blacklisted = searchParams.get('blacklisted') || ''

  const fetchStats = useCallback(async () => {
    try { const { data } = await api.get('/rental/customers/stats'); setStats(data) } catch (_) {}
  }, [])

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 25 }
      if (search) params.search = search
      if (blacklisted) params.blacklisted = blacklisted
      const { data } = await api.get('/rental/customers', { params })
      setCustomers(data.customers || [])
      setPagination(data.pagination || { total: 0, pages: 1 })
    } catch (_) {} finally { setLoading(false) }
  }, [page, search, blacklisted])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1) }, [search, blacklisted])
  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const toggleBlacklist = async (customer) => {
    const reason = customer.isBlacklisted ? '' : window.prompt(t('Enter reason for blacklisting:', 'أدخل سبب الإدراج في القائمة السوداء:')) || ''
    try {
      await api.put(`/rental/customers/${customer._id}/toggle-blacklist`, { reason })
      fetchCustomers()
      fetchStats()
    } catch (_) {}
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Customer Registry', 'سجل العملاء')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('KYC records for all rental customers', 'بيانات التحقق من الهوية لعملاء التأجير')}</p>
        </div>
        <button onClick={() => navigate('/app/rental/customers/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-lg shadow-amber-500/30">
          <Plus className="w-4 h-4" /> {t('Add Customer', 'إضافة عميل')}
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('Total', 'الإجمالي'), value: stats.total, color: 'text-gray-900 dark:text-white' },
            { label: t('Blacklisted', 'محظورون'), value: stats.blacklisted, color: 'text-red-600 dark:text-red-400' },
            { label: t('Expiring IDs (30d)', 'هوية تنتهي (30 يوم)'), value: stats.expiringIds, color: 'text-amber-600 dark:text-amber-400' },
            { label: t('Expiring Licenses (30d)', 'رخصة تنتهي (30 يوم)'), value: stats.expiringLicenses, color: 'text-amber-600 dark:text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search name, mobile, ID...', 'بحث...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white" />
        </div>
        <div className="flex gap-2">
          {[['', t('All', 'الكل')], ['false', t('Active', 'نشط')], ['true', t('Blacklisted', 'محظور')]].map(([val, label]) => (
            <button key={val} onClick={() => setSearchParams(val ? { blacklisted: val } : {})}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${blacklisted === val ? 'bg-amber-500 text-white' : 'border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        {loading ? (
          <div className="divide-y">{[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-gray-50/50" />)}</div>
        ) : customers.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400">
            <Users className="w-14 h-14 opacity-20" />
            <p className="font-semibold">{t('No customers found', 'لا يوجد عملاء')}</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                  {[t('Customer', 'العميل'), t('Mobile', 'الجوال'), t('ID Number', 'رقم الهوية'), t('License', 'الرخصة'), t('Nationality', 'الجنسية'), t('Status', 'الحالة'), t('Actions', 'إجراءات')].map(h => (
                    <th key={h} className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                {customers.map((c, idx) => {
                  const idDays = daysUntil(c.idExpiry)
                  const licDays = daysUntil(c.licenseExpiry)
                  return (
                    <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${c.isBlacklisted ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                            {c.fullName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{c.fullName}</p>
                            {c.fullNameAr && <p className="text-xs text-gray-400 dir-rtl">{c.fullNameAr}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-300">{c.mobile}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-gray-700 dark:text-gray-300">{c.idNumber}</p>
                        {c.idExpiry && (idDays != null && idDays <= 30) && <p className={`text-xs font-semibold ${idDays <= 0 ? 'text-red-500' : 'text-amber-500'}`}>{idDays <= 0 ? t('Expired', 'منتهية') : `${idDays}d`}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-gray-700 dark:text-gray-300">{c.licenseNumber || '—'}</p>
                        {c.licenseExpiry && (licDays != null && licDays <= 30) && <p className={`text-xs font-semibold ${licDays <= 0 ? 'text-red-500' : 'text-amber-500'}`}>{licDays <= 0 ? t('Expired', 'منتهية') : `${licDays}d`}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.nationality}</td>
                      <td className="px-4 py-3">
                        {c.isBlacklisted
                          ? <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400"><Ban className="w-3.5 h-3.5" /> {t('Blacklisted', 'محظور')}</span>
                          : <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{t('Active', 'نشط')}</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => navigate(`/app/rental/customers/${c._id}`)}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 text-xs font-medium hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300">
                            {t('Edit', 'تعديل')}
                          </button>
                          <button onClick={() => toggleBlacklist(c)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${c.isBlacklisted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-200' : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 hover:bg-red-200'}`}>
                            {c.isBlacklisted ? t('Unblock', 'إلغاء الحظر') : t('Blacklist', 'حظر')}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <p className="text-sm text-gray-500">{pagination.total} {t('customers', 'عميل')}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm font-medium self-center">{page}/{pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg border disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
