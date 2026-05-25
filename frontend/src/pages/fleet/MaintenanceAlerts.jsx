import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ArrowLeft, CheckCircle, Clock, Wrench, Truck, Calendar } from 'lucide-react'
import api from '../../lib/api'

const URGENCY = {
  overdue: { label: 'OVERDUE', color: 'bg-red-500', textColor: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800', dot: 'bg-red-500' },
  week: { label: 'THIS WEEK', color: 'bg-amber-500', textColor: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800', dot: 'bg-amber-500' },
  month: { label: 'THIS MONTH', color: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-400' },
  later: { label: 'UPCOMING', color: 'bg-emerald-500', textColor: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' },
}

function getUrgency(alert) {
  const now = new Date()
  const due = alert.nextServiceDate ? new Date(alert.nextServiceDate) : null
  if (!due) return 'later'
  if (alert.status === 'in_progress') return 'week'
  const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'overdue'
  if (days <= 7) return 'week'
  if (days <= 30) return 'month'
  return 'later'
}

function getDaysLabel(alert, isAr) {
  const now = new Date()
  const due = alert.nextServiceDate ? new Date(alert.nextServiceDate) : null
  if (!due) return ''
  const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  if (days < 0) return isAr ? `متأخر ${Math.abs(days)} يوم` : `${Math.abs(days)} days overdue`
  if (days === 0) return isAr ? 'اليوم' : 'Due today'
  return isAr ? `خلال ${days} يوم` : `Due in ${days} days`
}

export default function MaintenanceAlerts() {
  const navigate = useNavigate()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [completing, setCompleting] = useState(null)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/fleet/alerts')
      setAlerts(data.alerts || [])
    } catch (_) {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchAlerts() }, [fetchAlerts])

  const markComplete = async (alertId) => {
    try {
      setCompleting(alertId)
      await api.put(`/fleet/maintenance/${alertId}`, { status: 'completed', completedDate: new Date().toISOString() })
      await fetchAlerts()
    } catch (_) {}
    finally { setCompleting(null) }
  }

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true
    const u = getUrgency(a)
    if (filter === 'overdue') return u === 'overdue'
    if (filter === 'week') return u === 'week'
    if (filter === 'month') return u === 'month'
    return true
  })

  const FILTERS = [
    { id: 'all', en: 'All', ar: 'الكل' },
    { id: 'overdue', en: 'Overdue', ar: 'متأخر' },
    { id: 'week', en: 'Due This Week', ar: 'هذا الأسبوع' },
    { id: 'month', en: 'Due This Month', ar: 'هذا الشهر' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/dashboard/fleet')} className="p-2 rounded-xl border border-gray-200 dark:border-dark-600 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Maintenance Alerts', 'تنبيهات الصيانة')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Upcoming and overdue maintenance schedules', 'جداول الصيانة القادمة والمتأخرة')}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-700 rounded-xl w-fit">
        {FILTERS.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.id ? 'bg-white dark:bg-dark-800 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800'}`}>
            {isAr ? f.ar : f.en}
            {f.id !== 'all' && (
              <span className="ml-1.5 text-xs bg-gray-200 dark:bg-dark-600 rounded-full px-1.5 py-0.5">
                {alerts.filter(a => {
                  const u = getUrgency(a)
                  return (f.id === 'overdue' && u === 'overdue') || (f.id === 'week' && u === 'week') || (f.id === 'month' && u === 'month')
                }).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alert Cards */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl border bg-gray-50 dark:bg-dark-800 dark:border-dark-700 animate-pulse" />
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3 text-gray-400 dark:text-gray-500">
          <CheckCircle className="w-12 h-12 opacity-30" />
          <p className="font-medium">{t('No alerts in this category', 'لا توجد تنبيهات في هذه الفئة')}</p>
          <p className="text-sm">{t('Great job keeping up with maintenance!', 'عمل رائع في متابعة الصيانة!')}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {filteredAlerts.map((alert, idx) => {
              const urgency = getUrgency(alert)
              const u = URGENCY[urgency]
              return (
                <motion.div
                  key={alert._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`rounded-2xl border p-5 ${u.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${u.dot} ring-4 ring-white dark:ring-dark-800`} />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold tracking-widest uppercase ${u.textColor}`}>{u.label}</span>
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{alert.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {alert.maintenanceType?.replace(/_/g, ' ')} · {alert.vendor || t('No vendor', 'لا يوجد مورد')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold whitespace-nowrap ${u.textColor}`}>{getDaysLabel(alert, isAr)}</span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5" />
                        {alert.asset?.name || '—'} ({alert.asset?.assetNumber})
                      </span>
                      {alert.nextServiceDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(alert.nextServiceDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {alert.status !== 'completed' && (
                      <button
                        onClick={() => markComplete(alert._id)}
                        disabled={completing === alert._id}
                        className="px-3 py-1.5 rounded-lg bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {completing === alert._id ? t('...', '...') : t('Mark Complete', 'إتمام')}
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
