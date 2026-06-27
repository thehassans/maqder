import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, AlertCircle, DollarSign, Percent,
  Package, Loader2, ArrowUp, ArrowDown,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell,
} from 'recharts'
import api from '../../lib/api'

function StatCard({ icon: Icon, label, value, sublabel, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="card p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </motion.div>
  )
}

const MARGIN_COLORS = {
  good: '#10b981',
  medium: '#f59e0b',
  low: '#ef4444',
  negative: '#dc2626',
}

function getMarginColor(margin) {
  if (margin < 0) return MARGIN_COLORS.negative
  if (margin < 15) return MARGIN_COLORS.low
  if (margin < 30) return MARGIN_COLORS.medium
  return MARGIN_COLORS.good
}

export default function ProfitMargins() {
  const { language } = useSelector((state) => state.ui)
  const [view, setView] = useState('overview')

  const { data, isLoading } = useQuery({
    queryKey: ['profit-margins'],
    queryFn: () => api.get('/bakala/margins/overview').then(res => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    )
  }

  const summary = data?.summary || {}
  const byCategory = data?.byCategory || []
  const bestMargins = data?.bestMargins || []
  const worstMargins = data?.worstMargins || []
  const salesProfit = data?.salesProfit || []
  const products = data?.productMargins || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'تحليل هوامش الربح' : 'Profit Margin Analytics'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' ? 'تحليل الربحية حسب المنتج والفئة' : 'Profitability analysis by product and category'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label={language === 'ar' ? 'قيمة المخزون (تكلفة)' : 'Stock Value (Cost)'} value={`${(summary.totalCostValue || 0).toLocaleString()} SAR`} color="from-blue-500 to-blue-600" delay={0} />
        <StatCard icon={DollarSign} label={language === 'ar' ? 'قيمة المخزون (بيع)' : 'Stock Value (Retail)'} value={`${(summary.totalRetailValue || 0).toLocaleString()} SAR`} color="from-emerald-500 to-emerald-600" delay={0.05} />
        <StatCard icon={TrendingUp} label={language === 'ar' ? 'الربح المحتمل' : 'Potential Profit'} value={`${(summary.totalPotentialProfit || 0).toLocaleString()} SAR`} sublabel={`Avg margin: ${summary.avgMargin || 0}%`} color="from-violet-500 to-violet-600" delay={0.1} />
        <StatCard icon={AlertCircle} label={language === 'ar' ? 'منتجات منخفضة الهامش' : 'Low/Negative Margin'} value={`${summary.lowMarginCount || 0}/${summary.negativeMarginCount || 0}`} sublabel="Low / Negative" color="from-red-500 to-red-600" delay={0.15} />
      </div>

      {/* Sales Profit Chart */}
      {salesProfit.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {language === 'ar' ? 'الإيرادات الشهرية' : 'Monthly Revenue (6 months)'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesProfit.map(s => ({ month: s._id, revenue: Math.round(s.revenue), items: s.lineItems }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} name="Revenue (SAR)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Margins */}
      {byCategory.length > 0 && (
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
            {language === 'ar' ? 'الهامش حسب الفئة' : 'Margin by Category'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis type="number" tick={{ fontSize: 12 }} unit="%" />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12 }} width={100} />
              <Tooltip />
              <Bar dataKey="avgMargin" name="Avg Margin %" radius={[0, 4, 4, 0]}>
                {byCategory.map((entry, idx) => (
                  <Cell key={idx} fill={getMarginColor(entry.avgMargin)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best & Worst Margins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-dark-700">
            <ArrowUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'أفضل الهوامش' : 'Best Margins'}
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {bestMargins.slice(0, 8).map((p, i) => (
              <div key={p._id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">{(p.profitPerUnit || 0).toFixed(2)} SAR/unit</span>
                  <span className="text-sm font-bold" style={{ color: getMarginColor(p.margin) }}>{p.margin}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-gray-200 dark:border-dark-700">
            <ArrowDown className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {language === 'ar' ? 'أسوأ الهوامش' : 'Worst Margins'}
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-dark-700">
            {worstMargins.slice(0, 8).map((p, i) => (
              <div key={p._id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs text-gray-400 w-5">{i + 1}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400">{(p.profitPerUnit || 0).toFixed(2)} SAR/unit</span>
                  <span className="text-sm font-bold" style={{ color: getMarginColor(p.margin) }}>{p.margin}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Product Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-dark-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {language === 'ar' ? 'كل المنتجات' : 'All Products'}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retail</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit/Unit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Margin %</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Potential Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
              {products.slice(0, 50).map(p => (
                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{p.costPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{p.retailPrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{p.profitPerUnit.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold" style={{ color: getMarginColor(p.margin) }}>{p.margin}%</span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">{p.stockQuantity}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">{p.potentialProfit.toFixed(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
