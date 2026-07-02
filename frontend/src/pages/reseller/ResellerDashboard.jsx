import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { Building2, Users, CheckCircle, Clock, XCircle, TrendingUp } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ResellerDashboard() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const { data, isLoading } = useQuery({
    queryKey: ['reseller-dashboard'],
    queryFn: () => api.get('/reseller/dashboard').then(res => res.data),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  const { reseller, stats, recentTenants } = data || {}

  const cards = [
    { label: language === 'ar' ? 'إجمالي المستأجرين' : 'Total Tenants', value: stats?.totalTenants || 0, icon: Building2, color: 'bg-blue-500' },
    { label: language === 'ar' ? 'اشتراكات نشطة' : 'Active Subscriptions', value: stats?.activeTenants || 0, icon: CheckCircle, color: 'bg-emerald-500' },
    { label: language === 'ar' ? 'فترة تجريبية' : 'Trial', value: stats?.trialTenants || 0, icon: Clock, color: 'bg-amber-500' },
    { label: language === 'ar' ? 'منتهية/ملغاة' : 'Expired/Terminated', value: stats?.expiredTenants || 0, icon: XCircle, color: 'bg-red-500' },
  ]

  const planColors = {
    trial: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    starter: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    professional: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  }

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    suspended: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    expired: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    terminated: 'bg-red-200 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'مرحباً' : 'Welcome'}, {reseller?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {language === 'ar' ? 'نظرة عامة على المستأجرين والاشتراكات' : 'Overview of your tenants and subscriptions'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Commission Info */}
      {reseller?.commissionRate > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-80">{language === 'ar' ? 'نسبة العمولة' : 'Commission Rate'}</p>
              <p className="text-3xl font-bold">{reseller.commissionRate}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tenants */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {language === 'ar' ? 'أحدث المستأجرين' : 'Recent Tenants'}
          </h2>
          <Link to="/reseller/tenants" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
            {language === 'ar' ? 'عرض الكل' : 'View all'}
          </Link>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {recentTenants?.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>{language === 'ar' ? 'لا يوجد مستأجرون بعد' : 'No tenants yet'}</p>
            </div>
          ) : (
            recentTenants?.map((tenant) => (
              <div key={tenant._id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planColors[tenant.subscription?.plan] || 'bg-gray-100 text-gray-600'}`}>
                    {tenant.subscription?.plan || '—'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[tenant.subscription?.status] || 'bg-gray-100 text-gray-600'}`}>
                    {tenant.subscription?.status || '—'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
