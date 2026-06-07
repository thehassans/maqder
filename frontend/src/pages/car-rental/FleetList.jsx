import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Car, Plus, Search, AlertTriangle, Wrench, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import api from '../../lib/api'

const STATUS_CONFIG = {
  AVAILABLE:   { label: 'Available', ar: 'متاح', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
  RENTED:      { label: 'Rented',    ar: 'مؤجر',  cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  RESERVED:    { label: 'Reserved',  ar: 'محجوز', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  MAINTENANCE: { label: 'Maintenance', ar: 'صيانة', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
}

const StatCard = ({ value, label, icon: Icon, color, loading }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      {loading ? <div className="h-7 w-14 bg-gray-200 dark:bg-dark-600 rounded animate-pulse" />
        : <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>}
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  </motion.div>
)

export default function FleetList() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [cars, setCars] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  const statusFilter = searchParams.get('status') || ''

  const fetchStats = useCallback(async () => {
    try { setStatsLoading(true); const { data } = await api.get('/rental/cars/stats'); setStats(data) }
    catch (_) {} finally { setStatsLoading(false) }
  }, [])

  const fetchCars = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const { data } = await api.get('/rental/cars', { params })
      setCars(data.cars || [])
      setPagination(data.pagination || { total: 0, pages: 1 })
    } catch (_) {} finally { setLoading(false) }
  }, [page, search, statusFilter])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1) }, [search, statusFilter])
  useEffect(() => { fetchCars() }, [fetchCars])

  const isExpiryAlert = (car) => {
    const now = new Date()
    const day30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return (car.insuranceExpiry && new Date(car.insuranceExpiry) <= day30) ||
      (car.fahasExpiry && new Date(car.fahasExpiry) <= day30) ||
      (car.licenseExpiry && new Date(car.licenseExpiry) <= day30)
  }

  const plateDisplay = (car) => {
    const letters = car.plateEnglishLetters || car.plateArabicLetters || ''
    return `${car.plateNumber}${letters ? ' ' + letters : ''}`
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Fleet', 'الأسطول')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Manage all rental vehicles', 'إدارة جميع مركبات التأجير')}</p>
        </div>
        <button onClick={() => navigate('/app/rental/fleet/new')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-600/30">
          <Plus className="w-4 h-4" /> {t('Add Car', 'إضافة سيارة')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label={t('Available', 'متاح')} value={stats?.available ?? 0} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" loading={statsLoading} />
        <StatCard icon={Car} label={t('Rented', 'مؤجر')} value={stats?.rented ?? 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" loading={statsLoading} />
        <StatCard icon={Wrench} label={t('Maintenance', 'صيانة')} value={stats?.maintenance ?? 0} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" loading={statsLoading} />
        <StatCard icon={AlertTriangle} label={t('Expiry Alerts', 'تنبيهات انتهاء')} value={stats?.expiryAlerts ?? 0} color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" loading={statsLoading} />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('Search plate, make, model...', 'بحث...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-white" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['', 'AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED'].map(s => (
            <button key={s} onClick={() => setSearchParams(s ? { status: s } : {})}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${statusFilter === s ? 'bg-emerald-600 text-white' : 'border border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700'}`}>
              {s ? (STATUS_CONFIG[s]?.[isAr ? 'ar' : 'label'] || s) : t('All', 'الكل')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-50 dark:divide-dark-700">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-gray-50/50 dark:bg-dark-700/20" />)}
          </div>
        ) : cars.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <Car className="w-14 h-14 opacity-20" />
            <p className="font-semibold">{t('No cars found', 'لا توجد سيارات')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                    {[t('Car', 'السيارة'), t('Plate', 'اللوحة'), t('Status', 'الحالة'), t('Odometer', 'العداد'), t('Daily Rate', 'السعر اليومي'), t('Alerts', 'تنبيهات'), t('Actions', 'إجراءات')].map(h => (
                      <th key={h} className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                  {cars.map((car, idx) => (
                    <motion.tr key={car._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.03 }}
                      className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                            <Car className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{car.make} {car.model}</p>
                            <p className="text-xs text-gray-400">{car.year} · {car.color}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-gray-900 dark:text-white">{plateDisplay(car)}</span>
                        {car.plateArabicLetters && <p className="text-xs text-gray-400 dir-rtl">{car.plateArabicLetters}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_CONFIG[car.status]?.cls}`}>
                          {isAr ? STATUS_CONFIG[car.status]?.ar : STATUS_CONFIG[car.status]?.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono">{car.currentOdometer?.toLocaleString()} km</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{car.dailyRateDefault?.toLocaleString()} SAR</td>
                      <td className="px-4 py-3">
                        {isExpiryAlert(car) && (
                          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" /> {t('Expiry', 'انتهاء')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 flex items-center gap-2">
                        <button onClick={() => navigate(`/app/rental/fleet/${car._id}`)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 text-xs font-medium hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 transition-colors">
                          {t('Edit', 'تعديل')}
                        </button>
                        {car.status === 'AVAILABLE' && (
                          <button onClick={() => navigate(`/app/rental/checkout?carId=${car._id}`)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white transition-colors">
                            {t('Rent', 'أجّر')}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{pagination.total} {t('cars', 'سيارة')}</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{page}/{pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
