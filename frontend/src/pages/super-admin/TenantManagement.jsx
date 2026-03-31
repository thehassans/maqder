import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Building2, Eye, Edit, Users, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function TenantManagement() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', plan: '' })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page, search, filters],
    queryFn: () => api.get('/super-admin/tenants', { params: { page, search, ...filters } }).then(res => res.data)
  })

  const loginAsMutation = useMutation({
    mutationFn: (tenantId) => api.post(`/super-admin/tenants/${tenantId}/login-as`),
    onSuccess: (res) => {
      localStorage.setItem('token', res.data.token)
      toast.success(language === 'ar' ? 'تم تسجيل الدخول كمستأجر' : 'Logged in as tenant')
      window.location.href = '/'
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Login failed')
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('tenants')}</h1>
          <p className="text-gray-500 mt-1">{language === 'ar' ? 'إدارة جميع المستأجرين والاشتراكات' : 'Manage all tenants and subscriptions'}</p>
        </div>
        <Link to="/super-admin/tenants/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة مستأجر' : 'Add Tenant'}
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder={`${t('search')}...`} value={search} onChange={(e) => setSearch(e.target.value)} className="input ps-10" />
          </div>
          <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="select w-full sm:w-40">
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
          </select>
          <select value={filters.plan} onChange={(e) => setFilters({ ...filters, plan: e.target.value })} className="select w-full sm:w-40">
            <option value="">{language === 'ar' ? 'كل الخطط' : 'All Plans'}</option>
            <option value="trial">Trial</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{language === 'ar' ? 'المستأجر' : 'Tenant'}</th>
                    <th>{language === 'ar' ? 'الرقم الضريبي' : 'VAT Number'}</th>
                    <th>{language === 'ar' ? 'الخطة' : 'Plan'}</th>
                    <th>{language === 'ar' ? 'المستخدمين' : 'Users'}</th>
                    <th>{t('status')}</th>
                    <th>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created'}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.tenants?.map((tenant) => (
                    <tr key={tenant._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {tenant.name?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{tenant.name}</p>
                            <p className="text-xs text-gray-500">{tenant.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm">{tenant.business?.vatNumber || '-'}</td>
                      <td>
                        <span className={`badge ${
                          tenant.subscription?.plan === 'enterprise' ? 'badge-info' :
                          tenant.subscription?.plan === 'professional' ? 'badge-success' :
                          tenant.subscription?.plan === 'starter' ? 'badge-warning' :
                          'badge-neutral'
                        }`}>
                          {tenant.subscription?.plan}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{tenant.userCount || 0}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${tenant.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {tenant.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                        </span>
                      </td>
                      <td className="text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => loginAsMutation.mutate(tenant._id)}
                            disabled={!tenant.isActive || loginAsMutation.isPending}
                            className="p-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg text-primary-600 disabled:opacity-50"
                            title={language === 'ar' ? 'تسجيل الدخول كمستأجر' : 'Login as Tenant'}
                          >
                            <LogIn className="w-4 h-4" />
                          </button>
                          <Link to={`/super-admin/tenants/${tenant._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data?.pagination && (
              <div className="p-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {language === 'ar' ? `عرض ${data.tenants.length} من ${data.pagination.total}` : `Showing ${data.tenants.length} of ${data.pagination.total}`}
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-secondary">
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pagination.pages} className="btn btn-secondary">
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
