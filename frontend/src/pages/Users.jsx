import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Plus, Search, User, X, Save, Shield, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'

const MODULES = [
  { key: 'invoicing', labelEn: 'Invoicing', labelAr: 'الفوترة' },
  { key: 'inventory', labelEn: 'Inventory', labelAr: 'المخزون' },
  { key: 'supply_chain', labelEn: 'Supply Chain', labelAr: 'سلسلة التوريد' },
  { key: 'project_management', labelEn: 'Project Management', labelAr: 'إدارة المشاريع' },
  { key: 'hr', labelEn: 'HR', labelAr: 'الموارد البشرية' },
  { key: 'payroll', labelEn: 'Payroll', labelAr: 'الرواتب' },
  { key: 'finance', labelEn: 'Finance', labelAr: 'المالية' },
  { key: 'job_costing', labelEn: 'Job Costing', labelAr: 'تكلفة الأعمال' },
  { key: 'mrp', labelEn: 'MRP', labelAr: 'MRP' },
  { key: 'iot', labelEn: 'IoT', labelAr: 'إنترنت الأشياء' },
  { key: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات' },
]

const ACTIONS = ['create', 'read', 'update', 'delete', 'approve', 'export']

function ActionPill({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
        active
          ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
          : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700'
      }`}
    >
      {label}
    </button>
  )
}

export default function Users() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      firstNameAr: '',
      lastNameAr: '',
      email: '',
      phone: '',
      password: '',
      role: 'viewer',
      isActive: true,
      permissions: [],
    },
  })

  const permissions = watch('permissions')

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-users', page, search],
    queryFn: () => api.get('/users', { params: { page, limit: 25, search } }).then((res) => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['tenant-users-stats'],
    queryFn: () => api.get('/users/stats').then((res) => res.data),
  })

  const users = data?.users || []
  const pagination = data?.pagination
  const maxUsers = Number(stats?.maxUsers ?? 0)
  const activeUsers = Number(stats?.activeUsers ?? 0)
  const isLimitEnabled = Number.isFinite(maxUsers) && maxUsers > 0
  const isAtLimit = isLimitEnabled && activeUsers >= maxUsers

  const roles = useMemo(
    () => [
      { key: 'admin', label: language === 'ar' ? 'مشرف' : 'Admin' },
      { key: 'manager', label: language === 'ar' ? 'مدير' : 'Manager' },
      { key: 'accountant', label: language === 'ar' ? 'محاسب' : 'Accountant' },
      { key: 'hr_manager', label: language === 'ar' ? 'مدير موارد بشرية' : 'HR Manager' },
      { key: 'inventory_manager', label: language === 'ar' ? 'مدير مخزون' : 'Inventory Manager' },
      { key: 'sales', label: language === 'ar' ? 'مبيعات' : 'Sales' },
      { key: 'viewer', label: language === 'ar' ? 'مشاهدة فقط' : 'Viewer' },
    ],
    [language]
  )

  const openPanel = (u = null) => {
    setEditingUser(u)
    reset({
      firstName: u?.firstName || '',
      lastName: u?.lastName || '',
      firstNameAr: u?.firstNameAr || '',
      lastNameAr: u?.lastNameAr || '',
      email: u?.email || '',
      phone: u?.phone || '',
      password: '',
      role: u?.role || 'viewer',
      isActive: typeof u?.isActive === 'boolean' ? u.isActive : true,
      permissions: Array.isArray(u?.permissions) ? u.permissions : [],
    })
    setPanelOpen(true)
  }

  const closePanel = () => {
    setPanelOpen(false)
    setEditingUser(null)
    reset({
      firstName: '',
      lastName: '',
      firstNameAr: '',
      lastNameAr: '',
      email: '',
      phone: '',
      password: '',
      role: 'viewer',
      isActive: true,
      permissions: [],
    })
  }

  const mutation = useMutation({
    mutationFn: (payload) => (editingUser ? api.put(`/users/${editingUser._id}`, payload) : api.post('/users', payload)),
    onSuccess: () => {
      toast.success(editingUser ? (language === 'ar' ? 'تم تحديث المستخدم' : 'User updated') : (language === 'ar' ? 'تم إنشاء المستخدم' : 'User created'))
      queryClient.invalidateQueries(['tenant-users'])
      queryClient.invalidateQueries(['tenant-users-stats'])
      closePanel()
    },
    onError: (err) => toast.error(err.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إلغاء تفعيل المستخدم' : 'User deactivated')
      queryClient.invalidateQueries(['tenant-users'])
      queryClient.invalidateQueries(['tenant-users-stats'])
    },
    onError: (err) => toast.error(err.response?.data?.error || (language === 'ar' ? 'حدث خطأ' : 'Error')),
  })

  const permMap = useMemo(() => {
    const list = Array.isArray(permissions) ? permissions : []
    const map = new Map()
    for (const p of list) {
      if (!p?.module) continue
      map.set(String(p.module), new Set(Array.isArray(p.actions) ? p.actions : []))
    }
    return map
  }, [permissions])

  const setPermMap = (nextMap) => {
    const next = []
    for (const [module, actionsSet] of nextMap.entries()) {
      const actions = [...actionsSet]
      if (actions.length === 0) continue
      next.push({ module, actions })
    }
    setValue('permissions', next, { shouldDirty: true })
  }

  const toggleAction = (module, action) => {
    const next = new Map(permMap)
    const set = next.get(module) ? new Set(next.get(module)) : new Set()
    if (set.has(action)) set.delete(action)
    else set.add(action)
    if (set.size === 0) next.delete(module)
    else next.set(module, set)
    setPermMap(next)
  }

  const toggleAllForModule = (module, enabled) => {
    const next = new Map(permMap)
    if (!enabled) {
      next.delete(module)
    } else {
      next.set(module, new Set(ACTIONS))
    }
    setPermMap(next)
  }

  const onSubmit = (form) => {
    const payload = {
      ...form,
      email: String(form.email || '').trim().toLowerCase(),
      permissions: Array.isArray(form.permissions) ? form.permissions : [],
    }

    if (!payload.password) delete payload.password
    mutation.mutate(payload)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة المستخدمين والصلاحيات' : 'Manage users and permissions'}
          </p>
        </div>
        <button onClick={() => openPanel()} disabled={isAtLimit} className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'المستخدمون النشطون' : 'Active Users'}</p>
          <p className="text-2xl font-bold">{activeUsers}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">{language === 'ar' ? 'الحد الأقصى للمستخدمين' : 'Max Users'}</p>
          <p className="text-2xl font-bold">{isLimitEnabled ? maxUsers : '-'}</p>
        </div>
        <div className={`card p-4 ${isAtLimit ? 'border border-amber-300' : ''}`}>
          <p className="text-sm text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</p>
          <p className={`text-sm font-semibold mt-1 ${isAtLimit ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {isAtLimit ? (language === 'ar' ? 'تم الوصول للحد' : 'Limit reached') : (language === 'ar' ? 'متاح' : 'Available')}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`${t('search')}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>{language === 'ar' ? 'المستخدم' : 'User'}</th>
                      <th>{language === 'ar' ? 'الدور' : 'Role'}</th>
                      <th>{t('status')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                              {u.firstName?.[0]}{u.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{u.firstName} {u.lastName}</p>
                              <p className="text-xs text-gray-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-neutral">
                            <Shield className="w-3 h-3 me-1" />
                            {u.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {u.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openPanel(u)}
                              className={`px-3 py-2 rounded-xl border transition-all ${
                                panelOpen && editingUser?._id === u._id
                                  ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
                                  : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                                <span className="text-sm font-semibold">{language === 'ar' ? 'تحرير' : 'Edit'}</span>
                              </div>
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(u._id)}
                              disabled={deleteMutation.isPending || !u.isActive}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl disabled:opacity-50"
                              title={language === 'ar' ? 'إلغاء تفعيل' : 'Deactivate'}
                            >
                              <X className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination?.pages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    {language === 'ar' ? `صفحة ${pagination.page} / ${pagination.pages}` : `Page ${pagination.page} / ${pagination.pages}`}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-secondary">
                      {language === 'ar' ? 'السابق' : 'Previous'}
                    </button>
                    <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn btn-secondary">
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-1">
          <div className="card sticky top-6 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-dark-700 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/10 dark:to-dark-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {panelOpen
                      ? (editingUser ? (language === 'ar' ? 'تعديل مستخدم' : 'Edit User') : (language === 'ar' ? 'إضافة مستخدم' : 'Create User'))
                      : (language === 'ar' ? 'لوحة المستخدم' : 'User Panel')}
                  </p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {panelOpen
                      ? (editingUser ? `${editingUser.firstName || ''} ${editingUser.lastName || ''}`.trim() : (language === 'ar' ? 'مستخدم جديد' : 'New User'))
                      : (language === 'ar' ? 'اختر مستخدم أو أضف جديد' : 'Select a user or create one')}
                  </h3>
                </div>
                {panelOpen && (
                  <button onClick={closePanel} className="p-2 rounded-xl hover:bg-white/70 dark:hover:bg-dark-700">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isAtLimit && !editingUser && (
                <div className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {language === 'ar' ? 'تم الوصول لحد المستخدمين. قم بإلغاء تفعيل مستخدم لإضافة جديد.' : 'User limit reached. Deactivate a user to add a new one.'}
                </div>
              )}
            </div>

            {!panelOpen ? (
              <div className="p-5">
                <button onClick={() => openPanel()} disabled={isAtLimit} className="btn btn-primary w-full">
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة مستخدم' : 'Add User'}
                </button>
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar'
                    ? 'اختر مستخدم من الجدول لتحرير بياناته وصلاحياته، أو اضغط إضافة مستخدم لإنشاء مستخدم جديد.'
                    : 'Select a user from the table to edit details and permissions, or click Add User to create a new one.'}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="label">{t('firstName')} *</label>
                      <input {...register('firstName', { required: true })} className="input" />
                    </div>
                    <div>
                      <label className="label">{t('lastName')} *</label>
                      <input {...register('lastName', { required: true })} className="input" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="label">{language === 'ar' ? 'الاسم الأول (AR)' : 'First Name (AR)'}</label>
                        <input {...register('firstNameAr')} className="input" dir="rtl" />
                      </div>
                      <div>
                        <label className="label">{language === 'ar' ? 'اسم العائلة (AR)' : 'Last Name (AR)'}</label>
                        <input {...register('lastNameAr')} className="input" dir="rtl" />
                      </div>
                    </div>
                    <div>
                      <label className="label">{t('email')} *</label>
                      <input type="email" {...register('email', { required: true })} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'الهاتف' : 'Phone'}</label>
                      <input {...register('phone')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'كلمة المرور' : 'Password'}{editingUser ? '' : ' *'}</label>
                      <input type="password" {...register('password', { required: !editingUser })} className="input" />
                      {editingUser && (
                        <p className="text-xs text-gray-500 mt-1">
                          {language === 'ar' ? 'اتركها فارغة للحفاظ على كلمة المرور الحالية.' : 'Leave empty to keep current password.'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'الدور' : 'Role'}</label>
                      <select {...register('role')} className="select">
                        {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="card-glass p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'ar' ? 'حدد صلاحيات كل قسم بطريقة تفصيلية.' : 'Toggle detailed permissions per module.'}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {language === 'ar' ? 'تُحفظ عند الضغط على حفظ' : 'Saved on Save'}
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {MODULES.map((m) => {
                      const set = permMap.get(m.key) || new Set()
                      const allOn = ACTIONS.every((a) => set.has(a))
                      const label = language === 'ar' ? m.labelAr : m.labelEn
                      return (
                        <div key={m.key} className="p-3 rounded-2xl border border-gray-200 dark:border-dark-700 bg-white/70 dark:bg-dark-800/40">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{label}</p>
                            <ActionPill
                              active={allOn}
                              label={language === 'ar' ? 'الكل' : 'All'}
                              onClick={() => toggleAllForModule(m.key, !allOn)}
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {ACTIONS.map((a) => (
                              <ActionPill
                                key={a}
                                active={set.has(a)}
                                label={a}
                                onClick={() => toggleAction(m.key, a)}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={closePanel} className="btn btn-secondary flex-1">{t('cancel')}</button>
                  <button type="submit" disabled={mutation.isPending} className="btn btn-primary flex-1">
                    {mutation.isPending ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        {t('save')}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
