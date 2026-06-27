import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  TrendingUp, ShoppingBag, Clock, Users,
  Loader2, Calendar, DollarSign, UtensilsCrossed,
  ArrowUp, ArrowDown, Timer,
} from 'lucide-react'
import api from '../../lib/api'
import Money from '../../components/ui/Money'

function MiniBarChart({ data, color = 'bg-primary-500', height = 120, valueKey = 'revenue', labelKey = 'hour' }) {
  if (!data || data.length === 0) return null
  const max = Math.max(...data.map(d => d[valueKey] || 0), 1)
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d, i) => {
        const h = Math.max(2, ((d[valueKey] || 0) / max) * (height - 20))
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-gray-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap z-10">
              {typeof d[valueKey] === 'number' ? d[valueKey].toFixed(0) : d[valueKey]}
            </div>
            <div className={`w-full rounded-t ${color} transition-all hover:opacity-80`} style={{ height: `${h}px` }} />
            {data.length <= 24 && <span className="text-[10px] text-gray-400 mt-1">{d[labelKey]}</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function RestaurantAnalytics() {
  const { language } = useSelector((state) => state.ui)
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(monthAgo.getDate() - 30)

  const [startDate, setStartDate] = useState(monthAgo.toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-analytics', startDate, endDate],
    queryFn: () => api.get('/restaurant/combos/analytics/overview', { params: { startDate, endDate } }).then(res => res.data),
  })

  const summary = data?.summary || {}
  const bestSellers = data?.bestSellers || []
  const peakHours = data?.peakHours || []
  const dailyTrend = data?.dailyTrend || []
  const topByRevenue = data?.topByRevenue || []
  const tableTurnover = data?.tableTurnoverRates || []

  const totalOrders = summary.totalOrders || 0
  const totalRevenue = summary.totalRevenue || 0
  const avgTicket = summary.avgTicket || 0

  // Peak hours top 3
  const topHours = [...peakHours].sort((a, b) => b.orders - a.orders).slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'تحليلات المبيعات' : 'Sales Analytics'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' ? 'رؤى المبيعات والأداء' : 'Revenue insights and performance metrics'}
        </p>
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-3">
        <Calendar className="w-4 h-4 text-gray-400" />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-auto" />
        <span className="text-gray-400">→</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-auto" />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: <Money value={totalRevenue} />, icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
              { label: 'Total Orders', value: totalOrders, icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
              { label: 'Avg Ticket', value: <Money value={avgTicket} />, icon: TrendingUp, color: 'from-violet-500 to-violet-600' },
              { label: 'Total Tax', value: <Money value={summary.totalTax || 0} />, icon: DollarSign, color: 'from-amber-500 to-amber-600' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} shadow-sm w-fit mb-2`}>
                  <s.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Order Type Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Dine In', value: summary.dineInCount || 0, icon: UtensilsCrossed, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Takeaway', value: summary.takeawayCount || 0, icon: ShoppingBag, color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Delivery', value: summary.deliveryCount || 0, icon: Users, color: 'text-violet-600 dark:text-violet-400' },
            ].map((s, i) => (
              <div key={i} className="card p-4 flex items-center gap-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Revenue Trend */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary-500" /> Daily Revenue Trend
              </h3>
              {dailyTrend.length > 0 ? (
                <MiniBarChart data={dailyTrend} color="bg-emerald-500" height={150} valueKey="revenue" labelKey="date" />
              ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
            </div>

            {/* Peak Hours */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" /> Peak Hours (Orders by Hour)
              </h3>
              {peakHours.length > 0 ? (
                <>
                  <MiniBarChart data={peakHours} color="bg-amber-500" height={150} valueKey="orders" labelKey="hour" />
                  <div className="mt-4 space-y-1">
                    {topHours.map((h, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <Timer className="w-3 h-3 text-amber-500" /> {String(h.hour).padStart(2, '0')}:00
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{h.orders} orders · <Money value={h.revenue} /></span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Sellers by Quantity */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-violet-500" /> Best Sellers (by Quantity)
              </h3>
              {bestSellers.length > 0 ? (
                <div className="space-y-2">
                  {bestSellers.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-violet-500 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-500'}`}>{i + 1}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.quantity}x</span>
                        <span className="text-xs text-gray-400 ml-2"><Money value={item.revenue} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
            </div>

            {/* Top Items by Revenue */}
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Top Items (by Revenue)
              </h3>
              {topByRevenue.length > 0 ? (
                <div className="space-y-2">
                  {topByRevenue.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-dark-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-emerald-500 text-white' : 'bg-gray-200 dark:bg-dark-600 text-gray-500'}`}>{i + 1}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white"><Money value={item.revenue} /></span>
                        <span className="text-xs text-gray-400 ml-2">{item.quantity}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-400 text-center py-8">No data</p>}
            </div>
          </div>

          {/* Table Turnover */}
          {tableTurnover.length > 0 && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" /> Table Turnover Rate
              </h3>
              <MiniBarChart data={tableTurnover} color="bg-blue-500" height={120} valueKey="avgTurns" labelKey="date" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
