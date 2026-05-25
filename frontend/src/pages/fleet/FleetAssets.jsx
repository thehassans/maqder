import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  Truck, Plus, Search, AlertTriangle, Wrench, Fuel,
  Car, Zap, Package, BarChart3, ChevronLeft, ChevronRight,
  Construction, Activity
} from 'lucide-react'
import api from '../../lib/api'

const STATUS_STYLES = {
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  in_maintenance: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  retired: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  sold: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
}

const TYPE_ICONS = {
  vehicle: Car,
  heavy_equipment: Construction,
  light_equipment: Wrench,
  generator: Zap,
  other: Package,
}

const StatCard = ({ icon: Icon, label, value, color, loading }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-dark-800 rounded-2xl p-5 border border-gray-100 dark:border-dark-700 shadow-sm"
  >
    <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {loading ? (
          <div className="h-6 w-20 bg-gray-200 dark:bg-dark-600 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        )}
      </div>
    </div>
  </motion.div>
)

export default function FleetAssets() {
  const navigate = useNavigate()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'

  const [assets, setAssets] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, pages: 1 })

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const { data } = await api.get('/fleet/stats')
      setStats(data)
    } catch (_) {}
    finally { setStatsLoading(false) }
  }, [])

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      if (typeFilter) params.assetType = typeFilter
      const { data } = await api.get('/fleet', { params })
      setAssets(data.assets || [])
      setPagination(data.pagination || { total: 0, pages: 1 })
    } catch (_) {}
    finally { setLoading(false) }
  }, [page, search, statusFilter, typeFilter])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { setPage(1) }, [search, statusFilter, typeFilter])
  useEffect(() => { fetchAssets() }, [fetchAssets])

  const t = (en, ar) => isAr ? ar : en

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('Fleet & Machinery', 'الأسطول والمعدات')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('Manage vehicles, equipment, fuel logs and maintenance', 'إدارة المركبات والمعدات وسجلات الوقود والصيانة')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/dashboard/fleet/maintenance-alerts')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors text-sm font-medium"
          >
            <AlertTriangle className="w-4 h-4" />
            {t('Maintenance Alerts', 'تنبيهات الصيانة')}
            {stats?.overdueAlerts > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{stats.overdueAlerts}</span>
            )}
          </button>
          <button
            onClick={() => navigate('/app/dashboard/fleet/new')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('Add Asset', 'إضافة أصل')}
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Truck} label={t('Total Assets', 'إجمالي الأصول')} value={stats?.totalAssets ?? 0} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" loading={statsLoading} />
        <StatCard icon={Activity} label={t('Active', 'نشط')} value={stats?.activeAssets ?? 0} color="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" loading={statsLoading} />
        <StatCard icon={Wrench} label={t('In Maintenance', 'في الصيانة')} value={stats?.inMaintenance ?? 0} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" loading={statsLoading} />
        <StatCard icon={Fuel} label={t('Monthly Fuel (SAR)', 'الوقود الشهري (ر.س)')} value={stats ? stats.monthlyFuelCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" loading={statsLoading} />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Search assets...', 'بحث عن أصل...')}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        >
          <option value="">{t('All Statuses', 'كل الحالات')}</option>
          <option value="active">{t('Active', 'نشط')}</option>
          <option value="in_maintenance">{t('In Maintenance', 'في الصيانة')}</option>
          <option value="retired">{t('Retired', 'متقاعد')}</option>
          <option value="sold">{t('Sold', 'مباع')}</option>
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
        >
          <option value="">{t('All Types', 'كل الأنواع')}</option>
          <option value="vehicle">{t('Vehicle', 'مركبة')}</option>
          <option value="heavy_equipment">{t('Heavy Equipment', 'معدات ثقيلة')}</option>
          <option value="light_equipment">{t('Light Equipment', 'معدات خفيفة')}</option>
          <option value="generator">{t('Generator', 'مولد')}</option>
          <option value="other">{t('Other', 'أخرى')}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100 dark:divide-dark-700">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 dark:bg-dark-600 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-dark-600 rounded w-48" />
                  <div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
            <Truck className="w-12 h-12 opacity-30" />
            <p className="font-medium">{t('No assets found', 'لا توجد أصول')}</p>
            <p className="text-sm">{t('Add your first fleet asset to get started', 'أضف أول أصل لبدء العمل')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50">
                    {[t('Asset #', 'رقم الأصل'), t('Name', 'الاسم'), t('Type', 'النوع'), t('Registration', 'التسجيل'), t('Project', 'المشروع'), t('Status', 'الحالة'), t('Meter', 'العداد'), t('Actions', 'إجراءات')].map(h => (
                      <th key={h} className="px-4 py-3 text-start font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
                  {assets.map((asset, idx) => {
                    const TypeIcon = TYPE_ICONS[asset.assetType] || Package
                    return (
                      <motion.tr
                        key={asset._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="hover:bg-gray-50 dark:hover:bg-dark-700/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold text-primary-600 dark:text-primary-400">{asset.assetNumber}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                              <TypeIcon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{isAr && asset.nameAr ? asset.nameAr : asset.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 capitalize">
                            {asset.assetType?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{asset.registrationNumber || '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{asset.assignedProject?.nameEn || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[asset.status] || STATUS_STYLES.active}`}>
                            {asset.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                          {asset.currentMeterReading?.toLocaleString()} {asset.meterUnit}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate(`/app/dashboard/fleet/${asset._id}`)}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-dark-600 text-xs font-medium hover:bg-gray-50 dark:hover:bg-dark-700 text-gray-700 dark:text-gray-300 transition-colors"
                            >
                              {t('Edit', 'تعديل')}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(`${pagination.total} assets`, `${pagination.total} أصل`)}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{page} / {pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="p-2 rounded-lg border border-gray-200 dark:border-dark-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
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
