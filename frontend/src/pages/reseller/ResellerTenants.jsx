import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Search, Building2, Users, Calendar, Clock, X } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function ResellerTenants() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', plan: '' })
  const [page, setPage] = useState(1)
  const [selectedTenant, setSelectedTenant] = useState(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reseller-tenants', page, search, filters],
    queryFn: () => api.get('/reseller/tenants', { params: { page, search, ...filters } }).then(res => res.data),
    staleTime: 60 * 1000,
  })

  const tenants = data?.tenants || []
  const pagination = data?.pagination

  const tenantDetail = useQuery({
    queryKey: ['reseller-tenant', selectedTenant?._id],
    queryFn: () => api.get(`/reseller/tenants/${selectedTenant._id}`).then(res => res.data),
    enabled: !!selectedTenant,
  })

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

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null
    const diff = new Date(endDate).getTime() - Date.now()
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'المستأجرون' : 'Tenants'}
        </h1>
        <p className="text-gray-500 mt-1">
          {language === 'ar' ? 'عرض جميع المستأجرين التابعين لك مع تفاصيل الاشتراك' : 'View all your tenants with subscription details'}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select
          value={filters.status}
          onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1) }}
          className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">{language === 'ar' ? 'كل الحالات' : 'All statuses'}</option>
          <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
          <option value="inactive">{language === 'ar' ? 'متوقف' : 'Inactive'}</option>
        </select>
        <select
          value={filters.plan}
          onChange={(e) => { setFilters({ ...filters, plan: e.target.value }); setPage(1) }}
          className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">{language === 'ar' ? 'كل الخطط' : 'All plans'}</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{language === 'ar' ? 'لا يوجد مستأجرون' : 'No tenants found'}</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">{language === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                    <th className="text-left px-4 py-3 font-medium">{language === 'ar' ? 'الخطة' : 'Plan'}</th>
                    <th className="text-left px-4 py-3 font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="text-left px-4 py-3 font-medium">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</th>
                    <th className="text-left px-4 py-3 font-medium">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</th>
                    <th className="text-left px-4 py-3 font-medium">{language === 'ar' ? 'المتبقي' : 'Remaining'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {tenants.map((tenant) => {
                    const daysLeft = getDaysRemaining(tenant.subscription?.endDate)
                    return (
                      <tr
                        key={tenant._id}
                        onClick={() => setSelectedTenant(tenant)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{tenant.name}</p>
                              <p className="text-xs text-gray-500">{tenant.businessType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${planColors[tenant.subscription?.plan] || 'bg-gray-100 text-gray-600'}`}>
                            {tenant.subscription?.plan || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[tenant.subscription?.status] || 'bg-gray-100 text-gray-600'}`}>
                            {tenant.subscription?.status || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatDate(tenant.subscription?.startDate)}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {formatDate(tenant.subscription?.endDate)}
                        </td>
                        <td className="px-4 py-3">
                          {daysLeft !== null ? (
                            <span className={`text-xs font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 7 ? 'text-orange-600' : 'text-emerald-600'}`}>
                              {daysLeft < 0
                                ? (language === 'ar' ? `منتهي منذ ${Math.abs(daysLeft)} يوم` : `Expired ${Math.abs(daysLeft)}d ago`)
                                : (language === 'ar' ? `${daysLeft} يوم` : `${daysLeft}d left`)}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
              >
                {language === 'ar' ? 'السابق' : 'Prev'}
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-50"
              >
                {language === 'ar' ? 'التالي' : 'Next'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedTenant(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{selectedTenant.name}</h2>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {tenantDetail.isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subscription Timeline */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {language === 'ar' ? 'تفاصيل الاشتراك' : 'Subscription Details'}
                  </h3>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'تاريخ البدء' : 'Start Date'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(tenantDetail.data?.tenant?.subscription?.startDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-orange-600" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatDate(tenantDetail.data?.tenant?.subscription?.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'الخطة' : 'Plan'}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${planColors[tenantDetail.data?.tenant?.subscription?.plan] || 'bg-gray-100 text-gray-600'}`}>
                        {tenantDetail.data?.tenant?.subscription?.plan || '—'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[tenantDetail.data?.tenant?.subscription?.status] || 'bg-gray-100 text-gray-600'}`}>
                        {tenantDetail.data?.tenant?.subscription?.status || '—'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'دورة الفوترة' : 'Billing Cycle'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenantDetail.data?.tenant?.subscription?.billingCycle || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'السعر' : 'Price'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenantDetail.data?.tenant?.subscription?.price || 0} SAR
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'حد المستخدمين' : 'Max Users'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenantDetail.data?.tenant?.subscription?.maxUsers || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'حد الفواتير' : 'Max Invoices'}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {tenantDetail.data?.tenant?.subscription?.maxInvoices || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Users */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> {language === 'ar' ? 'المستخدمون' : 'Users'}
                  </h3>
                  {tenantDetail.data?.users?.length === 0 ? (
                    <p className="text-sm text-gray-400">{language === 'ar' ? 'لا يوجد مستخدمون' : 'No users'}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {tenantDetail.data?.users?.map((user) => (
                        <div key={user._id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{user.email}</span>
                          <span className="text-xs text-gray-500">{user.role}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
