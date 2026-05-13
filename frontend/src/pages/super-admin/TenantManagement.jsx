import { useState } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Building2, Edit, Users, LogIn, AlertCircle, RefreshCw, Trash2, RotateCcw, Send, X, FileSpreadsheet, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function TenantManagement() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', plan: '' })
  const [page, setPage] = useState(1)
  const [backupTenant, setBackupTenant] = useState(null)
  const [backupForm, setBackupForm] = useState({ period: 'monthly', startDate: '', endDate: '', email: '', formats: ['excel', 'pdf'] })
  const [backupErrorCode, setBackupErrorCode] = useState(null)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['tenants', page, search, filters],
    queryFn: () => api.get('/super-admin/tenants', { params: { page, search, ...filters } }).then(res => res.data),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })

  const tenants = Array.isArray(data?.tenants) ? data.tenants : []
  const hasTenants = tenants.length > 0

  const loginAsMutation = useMutation({
    mutationFn: (tenantId) => api.post(`/super-admin/tenants/${tenantId}/login-as`),
    onSuccess: (res) => {
      localStorage.setItem('token', res.data.token)
      toast.success(language === 'ar' ? 'تم تسجيل الدخول كمستأجر' : 'Logged in as tenant')
      window.location.href = '/'
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Login failed')
  })

  const clearInvoicesMutation = useMutation({
    mutationFn: (tenantId) => api.delete(`/super-admin/tenants/${tenantId}/invoices`).then(res => res.data),
    onSuccess: (result) => {
      toast.success(
        language === 'ar'
          ? `تم حذف ${result?.deletedInvoices || 0} فاتورة`
          : `Cleared ${result?.deletedInvoices || 0} invoices`
      )
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-revenue'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-expenses'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['travel-bookings'] })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to clear invoices')
  })

  const handleClearInvoices = (tenant) => {
    const label = tenant?.name || tenant?.business?.legalNameEn || ''
    const confirmMsg = language === 'ar'
      ? `سيتم حذف جميع الفواتير للمستأجر "${label}" نهائياً وإعادة تعيين التقارير ولوحة التحكم. هل أنت متأكد؟`
      : `This will permanently delete ALL invoices for "${label}" and reset dashboards and reports. Continue?`
    if (!window.confirm(confirmMsg)) return
    clearInvoicesMutation.mutate(tenant._id)
  }

  const resetPanelMutation = useMutation({
    mutationFn: (tenantId) => api.post(`/super-admin/tenants/${tenantId}/reset`).then(res => res.data),
    onSuccess: (result) => {
      const totals = Object.values(result?.deleted || {}).reduce((sum, v) => sum + (typeof v === 'number' ? v : 0), 0)
      toast.success(
        language === 'ar'
          ? `تم تصفير اللوحة (${totals} سجلاً)`
          : `Panel reset — ${totals} records removed`
      )
      queryClient.invalidateQueries()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to reset panel')
  })

  const sendBackupMutation = useMutation({
    mutationFn: ({ tenantId, payload }) => api.post(`/super-admin/tenants/${tenantId}/send-backup`, payload).then(res => res.data),
    onSuccess: (data) => {
      toast.success(language === 'ar' ? `تم إرسال النسخة الاحتياطية إلى ${data.message?.split('to ')[1] || 'البريد'}` : data.message || 'Backup sent successfully')
      setBackupTenant(null)
    },
    onError: (err) => {
      const code = err.response?.data?.code
      const msg = err.response?.data?.error || (language === 'ar' ? 'فشل الإرسال' : 'Failed to send backup')
      if (code === 'EMAIL_DISABLED' || code === 'EMAIL_NOT_CONFIGURED') {
        setBackupErrorCode(code)
      } else {
        toast.error(msg)
      }
    }
  })

  const openBackupModal = (tenant) => {
    setBackupForm({ period: 'monthly', startDate: '', endDate: '', email: tenant.business?.email || '', formats: ['excel', 'pdf'] })
    setBackupErrorCode(null)
    setBackupTenant(tenant)
  }

  const toggleFormat = (fmt) => {
    setBackupForm(prev => ({
      ...prev,
      formats: prev.formats.includes(fmt) ? prev.formats.filter(f => f !== fmt) : [...prev.formats, fmt]
    }))
  }

  const handleSendBackup = () => {
    if (!backupForm.email.trim()) {
      toast.error(language === 'ar' ? 'البريد الإلكتروني مطلوب' : 'Recipient email is required')
      return
    }
    if (backupForm.formats.length === 0) {
      toast.error(language === 'ar' ? 'اختر تنسيقاً واحداً على الأقل' : 'Select at least one format')
      return
    }
    sendBackupMutation.mutate({
      tenantId: backupTenant._id,
      payload: {
        period: backupForm.period,
        startDate: backupForm.period === 'custom' ? backupForm.startDate : undefined,
        endDate: backupForm.period === 'custom' ? backupForm.endDate : undefined,
        email: backupForm.email,
        formats: backupForm.formats,
      }
    })
  }

  const handleResetPanel = (tenant) => {
    const label = tenant?.name || tenant?.business?.legalNameEn || ''
    const firstConfirm = language === 'ar'
      ? `تحذير: سيتم حذف جميع البيانات (الفواتير، العملاء، المنتجات، الحجوزات، الطلبات، المصروفات، المستودعات، المهام، المشاريع، ...) للمستأجر "${label}". سيبدأ المستأجر من الصفر. هل أنت متأكد؟`
      : `WARNING: This will erase ALL business data (invoices, customers, products, bookings, orders, expenses, warehouses, tasks, projects, ...) for "${label}". The tenant will start from scratch. Continue?`
    if (!window.confirm(firstConfirm)) return
    const confirmText = label ? label.trim() : 'RESET'
    const typed = window.prompt(
      language === 'ar'
        ? `للتأكيد، اكتب اسم المستأجر بالضبط: ${confirmText}`
        : `To confirm, type the tenant name exactly: ${confirmText}`
    )
    if (typed !== confirmText) {
      toast.error(language === 'ar' ? 'التأكيد غير صحيح' : 'Confirmation did not match')
      return
    }
    resetPanelMutation.mutate(tenant._id)
  }

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
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'تعذر تحميل المستأجرين' : 'Unable to load tenants'}</h3>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{error?.userMessage || error?.response?.data?.error || error?.message || (language === 'ar' ? 'حدث خطأ أثناء تحميل بيانات المستأجرين.' : 'An error occurred while loading tenants.')}</p>
            </div>
            <button onClick={() => refetch()} className="btn btn-secondary">
              <RefreshCw className="w-4 h-4" />
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : !hasTenants ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-300">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'لا يوجد مستأجرون حتى الآن' : 'No tenants yet'}</h3>
              <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'ابدأ بإضافة أول مستأجر ليظهر هنا في قائمة الإدارة.' : 'Create your first tenant and it will appear here in the management list.'}</p>
            </div>
            <Link to="/super-admin/tenants/new" className="btn btn-primary">
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إضافة مستأجر' : 'Add Tenant'}
            </Link>
          </div>
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
                  {tenants.map((tenant) => (
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
                          <button
                            type="button"
                            onClick={() => handleClearInvoices(tenant)}
                            disabled={clearInvoicesMutation.isPending}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 disabled:opacity-50"
                            title={language === 'ar' ? 'حذف جميع الفواتير' : 'Clear all invoices'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetPanel(tenant)}
                            disabled={resetPanelMutation.isPending}
                            className="p-2 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg text-amber-600 disabled:opacity-50"
                            title={language === 'ar' ? 'تصفير لوحة المستأجر بالكامل' : 'Reset entire tenant panel'}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openBackupModal(tenant)}
                            className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-emerald-700 disabled:opacity-50"
                            title={language === 'ar' ? 'إرسال نسخة احتياطية' : 'Send data backup'}
                          >
                            <Send className="w-4 h-4" />
                          </button>
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
                  {language === 'ar' ? `عرض ${tenants.length} من ${data.pagination.total}` : `Showing ${tenants.length} of ${data.pagination.total}`}
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

      {/* ── Send Backup Modal ── */}
      <AnimatePresence>
        {backupTenant && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBackupTenant(null)} className="fixed inset-0 bg-black/50 z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white dark:bg-dark-800 rounded-2xl shadow-xl z-50 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {language === 'ar' ? 'إرسال نسخة احتياطية' : 'Send Data Backup'}
                    </h3>
                    <p className="text-sm text-gray-500">{backupTenant.name}</p>
                  </div>
                </div>
                <button onClick={() => setBackupTenant(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pt-5 pb-2 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>

                {/* Email config warning */}
                {backupErrorCode && (
                  <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10 px-4 py-3">
                    <span className="text-amber-500 mt-0.5 shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                        {backupErrorCode === 'EMAIL_DISABLED'
                          ? (language === 'ar' ? 'إرسال البريد معطل' : 'Email delivery is disabled')
                          : (language === 'ar' ? 'البريد غير مهيأ' : 'Email is not configured')}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                        {language === 'ar' ? 'يرجى تفعيل البريد من ' : 'Please enable it in '}
                        <a href="/super-admin/email" target="_blank" rel="noreferrer" className="underline font-semibold hover:text-amber-900">
                          {language === 'ar' ? 'إعدادات البريد' : 'Email Settings'}
                        </a>
                      </p>
                    </div>
                  </div>
                )}


                {/* Period */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    {language === 'ar' ? 'الفترة الزمنية' : 'Period'}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[['weekly', language === 'ar' ? 'أسبوعي' : 'Weekly'], ['monthly', language === 'ar' ? 'شهري' : 'Monthly'], ['custom', language === 'ar' ? 'مخصص' : 'Custom']].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBackupForm(p => ({ ...p, period: val }))}
                        className={`py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          backupForm.period === val
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom date range */}
                {backupForm.period === 'custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">{language === 'ar' ? 'من' : 'From'}</label>
                      <input type="date" value={backupForm.startDate} onChange={e => setBackupForm(p => ({ ...p, startDate: e.target.value }))} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'إلى' : 'To'}</label>
                      <input type="date" value={backupForm.endDate} onChange={e => setBackupForm(p => ({ ...p, endDate: e.target.value }))} className="input" />
                    </div>
                  </div>
                )}

                {/* Format */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">{language === 'ar' ? 'التنسيق' : 'Format'}</p>
                  <div className="flex gap-3">
                    {[['excel', <FileSpreadsheet key="excel" className="w-4 h-4" />, 'Excel (.xlsx)'], ['pdf', <FileText key="pdf" className="w-4 h-4" />, 'PDF']].map(([fmt, icon, label]) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => toggleFormat(fmt)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                          backupForm.formats.includes(fmt)
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white dark:bg-dark-700 border-gray-200 dark:border-dark-600 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
                        }`}
                      >
                        {icon}{label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient email */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                    {language === 'ar' ? 'البريد الإلكتروني للمستلم' : 'Recipient Email'}
                  </p>
                  <input
                    type="email"
                    value={backupForm.email}
                    onChange={e => setBackupForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="customer@gmail.com"
                    className="input"
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    {language === 'ar' ? 'سيتم إرسال الملفات المرفقة إلى هذا البريد' : 'The backup files will be sent as email attachments to this address'}
                  </p>
                </div>

                {/* What will be included */}
                <div className="flex flex-wrap gap-2 pb-1">
                  {[
                    language === 'ar' ? 'الفواتير' : 'Invoices',
                    language === 'ar' ? 'المصروفات' : 'Expenses',
                    language === 'ar' ? 'الموظفون' : 'Employees',
                    language === 'ar' ? 'الرواتب' : 'Payroll',
                  ].map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-dark-700">
                <button type="button" onClick={() => setBackupTenant(null)} className="btn btn-secondary">
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSendBackup}
                  disabled={sendBackupMutation.isPending}
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:border-emerald-700"
                >
                  {sendBackupMutation.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{language === 'ar' ? 'جارٍ الإرسال...' : 'Sending...'}</>
                  ) : (
                    <><Send className="w-4 h-4" />{language === 'ar' ? 'إرسال النسخة الاحتياطية' : 'Send Backup'}</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
