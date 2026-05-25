import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Car, ClipboardCheck, AlertTriangle, Clock } from 'lucide-react'
import api from '../../lib/api'

const msToHuman = (ms) => {
  if (ms < 0) {
    const pos = Math.abs(ms)
    const h = Math.floor(pos / 3600000)
    const d = Math.floor(pos / 86400000)
    if (d > 0) return { text: `${d}d ${h % 24}h overdue`, overdue: true }
    return { text: `${h}h overdue`, overdue: true }
  }
  const d = Math.floor(ms / 86400000)
  const h = Math.floor((ms % 86400000) / 3600000)
  if (d > 0) return { text: `${d}d ${h}h remaining`, overdue: false }
  return { text: `${h}h remaining`, overdue: false }
}

export default function ActiveRentals() {
  const navigate = useNavigate()
  const { language } = useSelector(s => s.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [contracts, setContracts] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(new Date())

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [contractsRes, statsRes] = await Promise.all([
        api.get('/rental/contracts', { params: { status: 'OPEN', limit: 50 } }),
        api.get('/rental/contracts/stats'),
      ])
      setContracts(contractsRes.data.contracts || [])
      setStats(statsRes.data)
    } catch (_) {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(i) }, [])

  const sortedContracts = [...contracts].sort((a, b) => new Date(a.expectedReturnDateTime) - new Date(b.expectedReturnDateTime))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('Active Rentals', 'التأجيرات النشطة')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('Real-time view of all open contracts', 'عرض لحظي لكل العقود المفتوحة')}</p>
        </div>
        <button onClick={() => navigate('/app/rental/checkout')}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-500/30 flex items-center gap-2">
          <Car className="w-4 h-4" /> {t('New Rental', 'تأجير جديد')}
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: t('Open', 'مفتوح'), value: stats.open, color: 'text-blue-600 dark:text-blue-400' },
            { label: t('Overdue', 'متأخر'), value: stats.overdue, color: 'text-red-600 dark:text-red-400' },
            { label: t("Today's Revenue", 'إيرادات اليوم'), value: `${stats.revenueToday?.toLocaleString()} SAR`, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: t("Month Revenue", 'إيرادات الشهر'), value: `${stats.revenueMonth?.toLocaleString()} SAR`, color: 'text-amber-600 dark:text-amber-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-dark-800 rounded-2xl border border-gray-100 dark:border-dark-700 p-4">
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse bg-gray-100 dark:bg-dark-700 rounded-2xl" />)}</div>
      ) : sortedContracts.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-3 text-gray-400">
          <Car className="w-16 h-16 opacity-20" />
          <p className="font-semibold text-lg">{t('No active rentals', 'لا توجد تأجيرات نشطة')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedContracts.map((c, idx) => {
            const timeMs = new Date(c.expectedReturnDateTime) - now
            const { text: timeText, overdue } = msToHuman(timeMs)
            return (
              <motion.div key={c._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className={`bg-white dark:bg-dark-800 rounded-2xl border p-5 hover:shadow-md transition-all cursor-pointer ${overdue ? 'border-red-200 dark:border-red-800' : 'border-gray-100 dark:border-dark-700'}`}
                onClick={() => navigate(`/app/rental/contracts/${c._id}`)}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-red-100 dark:bg-red-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
                    <Car className={`w-7 h-7 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-base">{c.car?.make} {c.car?.model} <span className="text-gray-400 font-normal text-sm">· {c.car?.plateNumber}</span></p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{c.customer?.fullName} · {c.customer?.mobile}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-black text-lg text-gray-900 dark:text-white">{c.dailyRate?.toLocaleString()} <span className="text-xs font-normal text-gray-400">SAR/d</span></p>
                        <p className="text-xs text-gray-400">#{c.contractNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className={`w-3.5 h-3.5 ${overdue ? 'text-red-500' : 'text-gray-400'}`} />
                        <span className={`text-xs font-semibold ${overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>{timeText}</span>
                        {overdue && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <span className="text-xs text-gray-400">Started {new Date(c.startDateTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); navigate(`/app/rental/contracts/${c._id}/checkin`) }}
                    className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-emerald-500/30">
                    <ClipboardCheck className="w-3.5 h-3.5" /> {t('Return', 'إرجاع')}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
