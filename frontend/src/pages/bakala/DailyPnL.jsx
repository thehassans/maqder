import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, DollarSign, Wallet, CreditCard, Users,
  Plus, Trash2, X, Loader2, Calendar, ArrowUp, ArrowDown, Receipt,
  Percent, BarChart3,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'supplier_payment', label: 'Supplier Payment' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'transport', label: 'Transport' },
  { value: 'misc_expense', label: 'Misc Expense' },
  { value: 'owner_draw', label: 'Owner Draw' },
  { value: 'capital_injection', label: 'Capital Injection' },
  { value: 'loan_repayment', label: 'Loan Repayment' },
  { value: 'other', label: 'Other' },
]

const MOVEMENT_TYPE_CONFIG = {
  in: { label: 'Cash In', icon: ArrowUp, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  out: { label: 'Cash Out', icon: ArrowDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
}

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

function CashMovementModal({ date, onClose }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    type: 'out',
    amount: '',
    category: 'misc_expense',
    description: '',
    reference: '',
    paymentMethod: 'cash',
    date: date || new Date().toISOString().split('T')[0],
  })

  const mutation = useMutation({
    mutationFn: (data) => api.post('/bakala/pnl/cash-movement', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pnl-daily'] })
      queryClient.invalidateQueries({ queryKey: ['pnl-monthly'] })
      queryClient.invalidateQueries({ queryKey: ['pnl-cash-flow'] })
      toast.success('Cash movement recorded')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter valid amount')
    mutation.mutate(form)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Record Cash Movement</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setForm({ ...form, type: 'in' })}
                className={`p-3 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                  form.type === 'in' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-dark-600'
                }`}
              >
                <ArrowUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium">Cash In</span>
              </button>
              <button
                onClick={() => setForm({ ...form, type: 'out' })}
                className={`p-3 rounded-xl border-2 transition-colors flex items-center gap-2 ${
                  form.type === 'out' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-dark-600'
                }`}
              >
                <ArrowDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Cash Out</span>
              </button>
            </div>

            <div>
              <label className="label">Amount (SAR) *</label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input text-lg font-bold"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="select">
                  {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} className="select">
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="e.g. Electricity bill" />
            </div>

            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Record
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function DailyPnL() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState('daily')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [showModal, setShowModal] = useState(false)

  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['pnl-daily', selectedDate],
    queryFn: () => api.get('/bakala/pnl/daily', { params: { date: selectedDate } }).then(res => res.data),
    enabled: activeView === 'daily',
  })

  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['pnl-monthly', selectedMonth],
    queryFn: () => api.get('/bakala/pnl/monthly', { params: { month: selectedMonth } }).then(res => res.data),
    enabled: activeView === 'monthly',
  })

  const { data: cashFlowData } = useQuery({
    queryKey: ['pnl-cash-flow'],
    queryFn: () => api.get('/bakala/pnl/cash-flow', { params: { days: 30 } }).then(res => res.data),
    enabled: activeView === 'cashflow',
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, date }) => api.delete(`/bakala/pnl/cash-movement/${id}?date=${date}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pnl-daily'] })
      queryClient.invalidateQueries({ queryKey: ['pnl-monthly'] })
      queryClient.invalidateQueries({ queryKey: ['pnl-cash-flow'] })
      toast.success('Cash movement deleted')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const sales = dailyData?.sales || {}
  const expenses = dailyData?.expenses || {}
  const cash = dailyData?.cash || {}

  const monthlySummary = monthlyData?.summary || {}
  const dailySales = monthlyData?.dailySales || []
  const expensesByCategory = monthlyData?.expensesByCategory || []
  const topProducts = monthlyData?.topProducts || []

  const cfSummary = cashFlowData?.summary || {}
  const cfChartData = cashFlowData?.chartData || []

  const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'الأرباح والخسائر اليومية' : 'Daily P&L & Cash Flow'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'تتبع الأرباح الفعلية والتدفق النقدي' : 'Track actual profit and cash flow'}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'حركة نقدية' : 'Cash Movement'}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'daily', label: language === 'ar' ? 'يومي' : 'Daily' },
          { id: 'monthly', label: language === 'ar' ? 'شهري' : 'Monthly' },
          { id: 'cashflow', label: language === 'ar' ? 'التدفق النقدي' : 'Cash Flow' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* DAILY VIEW */}
      {activeView === 'daily' && (
        <>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input w-auto"
            />
          </div>

          {dailyLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {/* Sales & Profit Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label={language === 'ar' ? 'إجمالي المبيعات' : 'Net Sales'} value={`${(sales.netSales || 0).toLocaleString()} SAR`} sublabel={`${sales.salesCount || 0} transactions`} color="from-blue-500 to-blue-600" delay={0} />
                <StatCard icon={TrendingDown} label={language === 'ar' ? 'تكلفة البضاعة' : 'COGS'} value={`${(dailyData?.cogs || 0).toLocaleString()} SAR`} color="from-orange-500 to-orange-600" delay={0.05} />
                <StatCard icon={TrendingUp} label={language === 'ar' ? 'إجمالي الربح' : 'Gross Profit'} value={`${(dailyData?.grossProfit || 0).toLocaleString()} SAR`} sublabel={`${dailyData?.grossMargin || 0}% margin`} color="from-emerald-500 to-emerald-600" delay={0.1} />
                <StatCard icon={Wallet} label={language === 'ar' ? 'صافي الربح' : 'Net Profit'} value={`${(dailyData?.netProfit || 0).toLocaleString()} SAR`} sublabel={`after ${(expenses.total || 0).toFixed(0)} expenses`} color="from-violet-500 to-violet-600" delay={0.15} />
              </div>

              {/* Payment Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Wallet} label="Cash Sales" value={`${(sales.cashSales || 0).toLocaleString()} SAR`} color="from-emerald-500 to-emerald-600" delay={0} />
                <StatCard icon={CreditCard} label="Card Sales" value={`${(sales.cardSales || 0).toLocaleString()} SAR`} color="from-blue-500 to-blue-600" delay={0.05} />
                <StatCard icon={Users} label="Khata Sales" value={`${(sales.khataSales || 0).toLocaleString()} SAR`} color="from-amber-500 to-amber-600" delay={0.1} />
                <StatCard icon={Receipt} label="Returns" value={`${(sales.salesReturns || 0).toLocaleString()} SAR`} color="from-red-500 to-red-600" delay={0.15} />
              </div>

              {/* Cash Position */}
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  {language === 'ar' ? 'المركز النقدي' : 'Cash Position'}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                    <ArrowUp className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Cash In</p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{(cash.cashIn || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                    <ArrowDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Cash Out</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{(cash.cashOut || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                    <Wallet className="w-4 h-4 text-primary-500 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">Net Cash Flow</p>
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{(cash.netCashFlow || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Cash Movements List */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {language === 'ar' ? 'الحركات النقدية' : 'Cash Movements'}
                  </h3>
                </div>
                {(dailyData?.cashMovements || []).length === 0 ? (
                  <div className="p-8 text-center text-gray-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No cash movements recorded for this day</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-dark-700">
                    {(dailyData?.cashMovements || []).map(m => {
                      const cfg = MOVEMENT_TYPE_CONFIG[m.type]
                      const Icon = cfg.icon
                      return (
                        <div key={m._id} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${cfg.bg}`}>
                              <Icon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {m.description || m.category.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs text-gray-400 capitalize">
                                {m.category.replace(/_/g, ' ')} · {m.paymentMethod} · {new Date(m.recordedAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-bold ${cfg.color}`}>
                              {m.type === 'in' ? '+' : '-'}{m.amount.toLocaleString()} SAR
                            </span>
                            <button
                              onClick={() => {
                                if (confirm('Delete this cash movement?')) {
                                  deleteMutation.mutate({ id: m._id, date: selectedDate })
                                }
                              }}
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* MONTHLY VIEW */}
      {activeView === 'monthly' && (
        <>
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input w-auto"
            />
          </div>

          {monthlyLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {/* Monthly Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={DollarSign} label="Total Sales" value={`${(monthlySummary.totalSales || 0).toLocaleString()} SAR`} sublabel={`${monthlySummary.salesCount || 0} transactions`} color="from-blue-500 to-blue-600" delay={0} />
                <StatCard icon={TrendingUp} label="Gross Profit" value={`${(monthlySummary.grossProfit || 0).toLocaleString()} SAR`} sublabel={`${monthlySummary.grossMargin || 0}% margin`} color="from-emerald-500 to-emerald-600" delay={0.05} />
                <StatCard icon={TrendingDown} label="Total Expenses" value={`${(monthlySummary.totalExpenses || 0).toLocaleString()} SAR`} color="from-orange-500 to-orange-600" delay={0.1} />
                <StatCard icon={Wallet} label="Net Profit" value={`${(monthlySummary.netProfit || 0).toLocaleString()} SAR`} sublabel={`${monthlySummary.netMargin || 0}% net margin`} color="from-violet-500 to-violet-600" delay={0.15} />
              </div>

              {/* Daily Sales Chart */}
              {dailySales.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daily Sales This Month</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dailySales.map(d => ({ date: d.date.slice(8), sales: d.totalSales, count: d.salesCount }))}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="sales" stroke="#6366f1" fill="url(#colorSales)" strokeWidth={2} name="Sales (SAR)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Expenses by Category */}
                {expensesByCategory.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Expenses by Category</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={expensesByCategory.map(e => ({ name: e.category.replace(/_/g, ' '), value: e.total }))}
                          cx="50%" cy="50%" outerRadius={80}
                          dataKey="value" nameKey="name"
                        >
                          {expensesByCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {expensesByCategory.map((e, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-600 dark:text-gray-300 capitalize">{e.category.replace(/_/g, ' ')}</span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{e.total.toLocaleString()} SAR</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Products */}
                {topProducts.length > 0 && (
                  <div className="card p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Top Products by Revenue</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={topProducts} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                        <Tooltip />
                        <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue (SAR)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* CASH FLOW VIEW */}
      {activeView === 'cashflow' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={ArrowUp} label="Total Cash In (30d)" value={`${(cfSummary.totalCashIn || 0).toLocaleString()} SAR`} color="from-emerald-500 to-emerald-600" delay={0} />
            <StatCard icon={ArrowDown} label="Total Cash Out (30d)" value={`${(cfSummary.totalCashOut || 0).toLocaleString()} SAR`} color="from-red-500 to-red-600" delay={0.05} />
            <StatCard icon={Wallet} label="Net Cash Flow" value={`${(cfSummary.netCashFlow || 0).toLocaleString()} SAR`} color="from-violet-500 to-violet-600" delay={0.1} />
            <StatCard icon={CreditCard} label="Card + Khata" value={`${((cfSummary.totalCard || 0) + (cfSummary.totalKhata || 0)).toLocaleString()} SAR`} sublabel={`Card: ${(cfSummary.totalCard || 0).toFixed(0)} · Khata: ${(cfSummary.totalKhata || 0).toFixed(0)}`} color="from-blue-500 to-blue-600" delay={0.15} />
          </div>

          {cfChartData.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">30-Day Cash Flow</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={cfChartData.map(d => ({ date: d.date.slice(5), cashIn: d.cashIn, cashOut: d.cashOut, net: d.net }))}>
                  <defs>
                    <linearGradient id="colorCashIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCashOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="cashIn" stroke="#10b981" fill="url(#colorCashIn)" strokeWidth={2} name="Cash In" />
                  <Area type="monotone" dataKey="cashOut" stroke="#ef4444" fill="url(#colorCashOut)" strokeWidth={2} name="Cash Out" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {showModal && <CashMovementModal date={selectedDate} onClose={() => setShowModal(false)} />}
    </div>
  )
}
