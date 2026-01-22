import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Building2, CreditCard, User, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import SarIcon from '../../components/ui/SarIcon'

export default function TenantForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const isEdit = Boolean(id)

  const { register, handleSubmit, reset, setValue, watch } = useForm()

  const logoValue = watch('branding.logo')

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/super-admin/tenants/${id}`).then(res => res.data),
    enabled: isEdit,
    onSuccess: (data) => reset(data.tenant)
  })

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? api.put(`/super-admin/tenants/${id}`, data) : api.post('/super-admin/tenants', data),
    onSuccess: () => {
      toast.success(isEdit ? (language === 'ar' ? 'تم تحديث المستأجر' : 'Tenant updated') : (language === 'ar' ? 'تم إنشاء المستأجر' : 'Tenant created'))
      queryClient.invalidateQueries(['tenants'])
      navigate('/super-admin/tenants')
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error')
  })

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type?.startsWith('image/')) {
      toast.error(language === 'ar' ? 'الملف يجب أن يكون صورة' : 'File must be an image')
      return
    }

    if (file.size > 1024 * 1024) {
      toast.error(language === 'ar' ? 'حجم الصورة كبير جداً (الحد 1MB)' : 'Image is too large (max 1MB)')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setValue('branding.logo', reader.result)
    }
    reader.readAsDataURL(file)
  }

  const toggleStatusMutation = useMutation({
    mutationFn: () => api.put(`/super-admin/tenants/${id}/toggle-status`),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث الحالة' : 'Status updated')
      queryClient.invalidateQueries(['tenant', id])
    }
  })

  if (isEdit && isLoading) {
    return <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-icon"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEdit ? (language === 'ar' ? 'تعديل مستأجر' : 'Edit Tenant') : (language === 'ar' ? 'إضافة مستأجر' : 'Add Tenant')}
            </h1>
            {isEdit && <p className="text-gray-500">{tenant?.tenant?.name}</p>}
          </div>
        </div>
        {isEdit && (
          <button onClick={() => toggleStatusMutation.mutate()} className={`btn ${tenant?.tenant?.isActive ? 'btn-danger' : 'btn-primary'}`}>
            {tenant?.tenant?.isActive ? (language === 'ar' ? 'تعطيل' : 'Deactivate') : (language === 'ar' ? 'تفعيل' : 'Activate')}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg"><Building2 className="w-5 h-5 text-primary-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'معلومات المستأجر' : 'Tenant Information'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'شعار الشركة' : 'Company Logo'}</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center overflow-hidden">
                  {logoValue ? (
                    <img src={logoValue} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input type="hidden" {...register('branding.logo')} />
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="input" />
                  <p className="text-xs text-gray-500 mt-1">
                    {language === 'ar' ? 'PNG/JPG بحد أقصى 1MB' : 'PNG/JPG max 1MB'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'اسم المستأجر' : 'Tenant Name'} *</label>
              <input {...register('name', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الرمز (Slug)' : 'Slug'} *</label>
              <input {...register('slug', { required: true })} className="input" placeholder="company-name" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الاسم القانوني (EN)' : 'Legal Name (EN)'} *</label>
              <input {...register('business.legalNameEn', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الاسم القانوني (AR)' : 'Legal Name (AR)'} *</label>
              <input {...register('business.legalNameAr', { required: true })} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الرقم الضريبي' : 'VAT Number'} *</label>
              <input {...register('business.vatNumber', { required: true })} className="input" placeholder="3XXXXXXXXXX00003" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'السجل التجاري' : 'CR Number'} *</label>
              <input {...register('business.crNumber', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'المدينة' : 'City'}</label>
              <input {...register('business.address.city')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" {...register('business.contactEmail')} className="input" />
            </div>
          </div>
        </motion.div>

        {/* Subscription */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><CreditCard className="w-5 h-5 text-emerald-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'الاشتراك' : 'Subscription'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'الخطة' : 'Plan'}</label>
              <select {...register('subscription.plan')} className="select">
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الحالة' : 'Status'}</label>
              <select {...register('subscription.status')} className="select">
                <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
                <option value="suspended">{language === 'ar' ? 'معلق' : 'Suspended'}</option>
                <option value="expired">{language === 'ar' ? 'منتهي' : 'Expired'}</option>
              </select>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'دورة الفوترة' : 'Billing Cycle'}</label>
              <select {...register('subscription.billingCycle')} className="select">
                <option value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</option>
                <option value="yearly">{language === 'ar' ? 'سنوي' : 'Yearly'}</option>
              </select>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الحد الأقصى للمستخدمين' : 'Max Users'}</label>
              <input type="number" {...register('subscription.maxUsers', { valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الحد الأقصى للفواتير' : 'Max Invoices'}</label>
              <input type="number" {...register('subscription.maxInvoices', { valueAsNumber: true })} className="input" />
            </div>
            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {language === 'ar' ? 'السعر' : 'Price'}
                  <SarIcon className="w-[1em] h-[1em]" />
                </span>
              </label>
              <input type="number" {...register('subscription.price', { valueAsNumber: true })} className="input" />
            </div>
          </div>
        </motion.div>

        {/* Admin User (New tenant only) */}
        {!isEdit && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><User className="w-5 h-5 text-blue-600" /></div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'مستخدم المشرف' : 'Admin User'}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('firstName')} *</label>
                <input {...register('adminUser.firstName', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">{t('lastName')} *</label>
                <input {...register('adminUser.lastName', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">{t('email')} *</label>
                <input type="email" {...register('adminUser.email', { required: true })} className="input" />
              </div>
              <div>
                <label className="label">{t('password')} *</label>
                <input type="password" {...register('adminUser.password', { required: true })} className="input" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats (Edit only) */}
        {isEdit && tenant && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg"><Shield className="w-5 h-5 text-violet-600" /></div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'الإحصائيات' : 'Statistics'}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'المستخدمين' : 'Users'}</p>
                <p className="text-2xl font-bold">{tenant.users?.length || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'الموظفين' : 'Employees'}</p>
                <p className="text-2xl font-bold">{tenant.employeeCount || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'الفواتير' : 'Invoices'}</p>
                <p className="text-2xl font-bold">{tenant.invoiceStats?.reduce((sum, s) => sum + s.count, 0) || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">ZATCA</p>
                <p className="text-lg font-bold">{tenant.tenant?.zatca?.isOnboarded ? '✓ Active' : '○ Pending'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate(-1)} className="btn btn-secondary">{t('cancel')}</button>
          <button type="submit" disabled={mutation.isPending} className="btn btn-primary">
            {mutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{t('save')}</>}
          </button>
        </div>
      </form>
    </div>
  )
}
