import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Shirt,
  Package,
  TrendingUp,
  Clock,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Receipt,
  User,
  Phone,
  Wallet,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

const DASHBOARD_REFRESH_MS = 30 * 1000

export default function BoutiqueDashboard() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const tenant = useSelector((state) => state.auth.tenant)
  const currency = tenant?.settings?.currency || 'SAR'

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((res) => res.data),
    refetchInterval: DASHBOARD_REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: DASHBOARD_REFRESH_MS,
  })

  const boutique = dashboard?.boutique?.rentals || {}
  const products = dashboard?.boutique?.products || {}
  const rentalTotals = boutique.totals?.[0] || { total: 0, revenue: 0, pending: 0, pendingReturns: 0, overdueReturns: 0 }
  const today = boutique.today?.[0] || { count: 0, revenue: 0 }
  const thisMonth = boutique.thisMonth?.[0] || { count: 0, revenue: 0 }
  const recentRentals = boutique.recent || []
  const productTotals = {
    total: products.total?.[0]?.count || 0,
    available: products.available?.[0]?.count || 0,
    outOfStock: products.outOfStock?.[0]?.count || 0,
  }

  const stats = [
    {
      label: language === 'ar' ? 'إجمالي الإيجارات' : 'Total Rentals',
      value: rentalTotals.total,
      icon: Receipt,
      color: 'from-primary-500 to-primary-600',
      change: language === 'ar' ? 'كل العمليات' : 'All transactions',
    },
    {
      label: language === 'ar' ? 'إيرادات اليوم' : "Today's Revenue",
      value: today.revenue,
      format: 'currency',
      icon: TrendingUp,
      color: 'from-emerald-500 to-emerald-600',
      change: `${today.count} ${language === 'ar' ? 'عملية' : 'orders'}`,
    },
    {
      label: language === 'ar' ? 'إيرادات الشهر' : 'This Month Revenue',
      value: thisMonth.revenue,
      format: 'currency',
      icon: Calendar,
      color: 'from-sky-500 to-sky-600',
      change: `${thisMonth.count} ${language === 'ar' ? 'عملية' : 'orders'}`,
    },
    {
      label: language === 'ar' ? 'مبالغ معلقة' : 'Pending Payments',
      value: rentalTotals.pending,
      icon: Clock,
      color: 'from-amber-500 to-amber-600',
      change: language === 'ar' ? 'تتطلب الدفع' : 'Require payment',
    },
    {
      label: language === 'ar' ? 'إرجاعات معلقة' : 'Pending Returns',
      value: rentalTotals.pendingReturns,
      icon: Package,
      color: 'from-indigo-500 to-indigo-600',
      change: language === 'ar' ? 'لم تسترجع' : 'Not returned',
    },
    {
      label: language === 'ar' ? 'إرجاعات متأخرة' : 'Overdue Returns',
      value: rentalTotals.overdueReturns,
      icon: AlertTriangle,
      color: 'from-rose-500 to-rose-600',
      change: language === 'ar' ? 'تحتاج متابعة' : 'Needs attention',
    },
    {
      label: language === 'ar' ? 'الفساتين المتاحة' : 'Dresses Available',
      value: productTotals.available,
      icon: Shirt,
      color: 'from-teal-500 to-teal-600',
      change: `${productTotals.outOfStock} ${language === 'ar' ? 'غير متاح' : 'out of stock'}`,
    },
  ]

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'ar' ? 'لوحة تحكم البوتيك' : 'Boutique Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'ar' ? 'نظرة عامة على الإيجارات والمخزون والمبيعات' : 'Overview of rentals, inventory and sales'}
          </p>
        </div>
        <Link
          to="/app/dashboard/boutique/pos"
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          {language === 'ar' ? 'فتح نقطة البيع' : 'Open POS'}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
          >
            <div className={`absolute top-0 right-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br ${stat.color} opacity-10`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {stat.format === 'currency' ? (
                    <Money value={stat.value} currency={currency} />
                  ) : (
                    stat.value || 0
                  )}
                </p>
                <p className={`mt-1 text-xs font-medium ${stat.positive === false ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {stat.change}
                </p>
              </div>
              <div className={`rounded-xl bg-gradient-to-br ${stat.color} p-2.5 text-white shadow-sm`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              {language === 'ar' ? 'آخر عمليات الإيجار' : 'Recent Rentals'}
            </h3>
            <Link
              to="/app/dashboard/boutique/pending-returns"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              {language === 'ar' ? 'عرض الكل' : 'View all'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start font-semibold text-gray-900">{language === 'ar' ? 'رقم' : 'No'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-900">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th className="px-4 py-3 text-start font-semibold text-gray-900">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-end font-semibold text-gray-900">{language === 'ar' ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-4 py-3 text-end font-semibold text-gray-900">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {recentRentals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد عمليات إيجار حديثة' : 'No recent rentals'}
                    </td>
                  </tr>
                )}
                {recentRentals.map((rental) => (
                  <tr key={rental._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-700">{rental.rentalNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{rental.customerName || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        rental.status === 'returned'
                          ? 'bg-emerald-100 text-emerald-700'
                          : rental.status === 'late_return'
                          ? 'bg-rose-100 text-rose-700'
                          : rental.status === 'picked_up'
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {rental.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end font-medium text-gray-900">
                      <Money value={rental.grandTotal} currency={currency} />
                    </td>
                    <td className="px-4 py-3 text-end text-gray-500">{formatDate(rental.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">
            {language === 'ar' ? 'روابط سريعة' : 'Quick Links'}
          </h3>
          <div className="space-y-2">
            <QuickLink
              to="/app/dashboard/boutique/pos"
              icon={Sparkles}
              label={language === 'ar' ? 'نقطة البيع' : 'POS'}
              description={language === 'ar' ? 'إنشاء إيجار أو بيع جديد' : 'Create a new rental or sale'}
            />
            <QuickLink
              to="/app/dashboard/boutique/dresses"
              icon={Shirt}
              label={language === 'ar' ? 'الفساتين' : 'Dresses'}
              description={language === 'ar' ? 'إدارة المخزون والأسعار' : 'Manage inventory and pricing'}
            />
            <QuickLink
              to="/app/dashboard/boutique/pending-returns"
              icon={Package}
              label={language === 'ar' ? 'الإرجاعات المعلقة' : 'Pending Returns'}
              description={language === 'ar' ? 'عرض الإرجاعات المستحقة' : 'View returns that are due'}
            />
            <QuickLink
              to="/app/dashboard/invoices"
              icon={Receipt}
              label={language === 'ar' ? 'الفواتير' : 'Invoices'}
              description={language === 'ar' ? 'عرض فواتير البوتيك' : 'View boutique invoices'}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function QuickLink({ to, icon: Icon, label, description }) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 rounded-xl p-3 hover:bg-gray-50 transition-colors"
    >
      <div className="rounded-lg bg-primary-50 p-2 text-primary-600 group-hover:bg-primary-100 transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400 mt-1 group-hover:text-primary-600 transition-colors" />
    </Link>
  )
}
