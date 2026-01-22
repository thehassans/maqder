import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Save, Globe, ShieldCheck, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function WebsiteSettings() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)

  const isArabic = language === 'ar'

  const { register, handleSubmit, reset, getValues } = useForm({
    defaultValues: {
      brandName: 'Maqder ERP',
      domain: 'maqder.com',
      contactPhone: '+966595930045',
      contactEmail: 'info@maqder.com',
      contactAddressEn: 'Riyadh, Saudi Arabia',
      contactAddressAr: 'الرياض، المملكة العربية السعودية',

      heroTitleEn: 'Complete ERP System',
      heroTitleAr: 'نظام ERP متكامل',
      heroSubtitleEn: 'Saudi compliant, ZATCA Phase 2 ready. Invoicing, HR, Payroll, Inventory & more.',
      heroSubtitleAr: 'متوافق مع السعودية وجاهز للمرحلة الثانية. فوترة، موارد بشرية، رواتب، مخزون وأكثر.',

      demoEnabled: true,
      demoTenantSlug: 'demo',
      demoEmail: 'demo@maqder.com',
      demoPassword: '',

      pricingCurrency: 'SAR',
      pricingPlansJson: '[]',
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['website-settings'],
    queryFn: () => api.get('/super-admin/settings/website').then((res) => res.data),
    onSuccess: (d) => {
      const website = d?.website || {}
      const demo = website?.demo || {}

      reset({
        brandName: website?.brandName || 'Maqder ERP',
        domain: website?.domain || 'maqder.com',
        contactPhone: website?.contactPhone || '+966595930045',
        contactEmail: website?.contactEmail || 'info@maqder.com',
        contactAddressEn: website?.contactAddressEn || 'Riyadh, Saudi Arabia',
        contactAddressAr: website?.contactAddressAr || 'الرياض، المملكة العربية السعودية',

        heroTitleEn: website?.hero?.titleEn || 'Complete ERP System',
        heroTitleAr: website?.hero?.titleAr || 'نظام ERP متكامل',
        heroSubtitleEn: website?.hero?.subtitleEn || '',
        heroSubtitleAr: website?.hero?.subtitleAr || '',

        demoEnabled: !!demo?.enabled,
        demoTenantSlug: demo?.tenantSlug || 'demo',
        demoEmail: demo?.email || 'demo@maqder.com',
        demoPassword: '',

        pricingCurrency: website?.pricing?.currency || 'SAR',
        pricingPlansJson: JSON.stringify(website?.pricing?.plans || [], null, 2),
      })
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/super-admin/settings/website', payload).then((res) => res.data),
    onSuccess: (d) => {
      toast.success(isArabic ? 'تم حفظ إعدادات الموقع' : 'Website settings saved')
      queryClient.setQueryData(['website-settings'], d)
      queryClient.invalidateQueries(['website-settings'])
      reset({
        ...getValues(),
        demoPassword: '',
      })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving settings'),
  })

  const onSubmit = (formData) => {
    let plans = []
    try {
      plans = JSON.parse(String(formData.pricingPlansJson || '[]'))
      if (!Array.isArray(plans)) throw new Error('Plans must be an array')
    } catch (e) {
      toast.error(isArabic ? 'صيغة خطط الأسعار غير صحيحة (JSON)' : 'Invalid pricing plans JSON')
      return
    }

    const payload = {
      website: {
        brandName: String(formData.brandName || '').trim(),
        domain: String(formData.domain || '').trim(),
        contactPhone: String(formData.contactPhone || '').trim(),
        contactEmail: String(formData.contactEmail || '').trim(),
        contactAddressEn: String(formData.contactAddressEn || '').trim(),
        contactAddressAr: String(formData.contactAddressAr || '').trim(),
        hero: {
          titleEn: String(formData.heroTitleEn || '').trim(),
          titleAr: String(formData.heroTitleAr || '').trim(),
          subtitleEn: String(formData.heroSubtitleEn || '').trim(),
          subtitleAr: String(formData.heroSubtitleAr || '').trim(),
        },
        demo: {
          enabled: !!formData.demoEnabled,
          tenantSlug: String(formData.demoTenantSlug || '').trim().toLowerCase(),
          email: String(formData.demoEmail || '').trim().toLowerCase(),
          password: String(formData.demoPassword || '').trim(),
        },
        pricing: {
          currency: String(formData.pricingCurrency || 'SAR').trim(),
          plans,
        },
      },
    }

    saveMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const demoInfo = data?.website?.demo

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isArabic ? 'إعدادات الموقع' : 'Website Settings'}
        </h1>
        <p className="text-gray-500 mt-1">
          {isArabic ? 'تعديل محتوى موقع التسويق وبيانات التواصل والـ Live Demo' : 'Edit marketing website content, contact details, and Live Demo'}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'الهوية والتواصل' : 'Brand & Contact'}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{isArabic ? 'اسم العلامة' : 'Brand name'}</label>
                <input {...register('brandName')} className="input" />
              </div>
              <div>
                <label className="label">{isArabic ? 'الدومين' : 'Domain'}</label>
                <input {...register('domain')} className="input" placeholder="maqder.com" />
              </div>
              <div>
                <label className="label">{isArabic ? 'رقم التواصل' : 'Contact phone'}</label>
                <input {...register('contactPhone')} className="input" placeholder="+966595930045" />
              </div>
              <div>
                <label className="label">{isArabic ? 'البريد' : 'Contact email'}</label>
                <input {...register('contactEmail')} className="input" placeholder="info@maqder.com" />
              </div>
              <div>
                <label className="label">{isArabic ? 'العنوان (EN)' : 'Address (EN)'}</label>
                <input {...register('contactAddressEn')} className="input" />
              </div>
              <div>
                <label className="label">{isArabic ? 'العنوان (AR)' : 'Address (AR)'}</label>
                <input {...register('contactAddressAr')} className="input" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'نص الواجهة' : 'Hero Content'}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{isArabic ? 'العنوان (EN)' : 'Title (EN)'}</label>
                <input {...register('heroTitleEn')} className="input" />
              </div>
              <div>
                <label className="label">{isArabic ? 'العنوان (AR)' : 'Title (AR)'}</label>
                <input {...register('heroTitleAr')} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">{isArabic ? 'الوصف (EN)' : 'Subtitle (EN)'}</label>
                <textarea {...register('heroSubtitleEn')} className="input min-h-[96px]" />
              </div>
              <div className="md:col-span-2">
                <label className="label">{isArabic ? 'الوصف (AR)' : 'Subtitle (AR)'}</label>
                <textarea {...register('heroSubtitleAr')} className="input min-h-[96px]" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'Live Demo' : 'Live Demo'}</h2>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {isArabic
                  ? 'ترك كلمة المرور فارغة سيحتفظ بكلمة المرور الحالية.'
                  : 'Leaving the password empty will keep the current password.'}
              </p>
              {demoInfo?.hasPassword && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  {isArabic ? `محفوظ: ${demoInfo.passwordMasked}` : `Saved: ${demoInfo.passwordMasked}`}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" {...register('demoEnabled')} className="h-4 w-4" />
                <span className="text-sm text-gray-700 dark:text-gray-200">{isArabic ? 'تفعيل الديمو' : 'Enable demo'}</span>
              </div>
              <div />

              <div>
                <label className="label">{isArabic ? 'Tenant Slug' : 'Tenant slug'}</label>
                <input {...register('demoTenantSlug')} className="input" placeholder="demo" />
              </div>
              <div>
                <label className="label">{isArabic ? 'Email' : 'Email'}</label>
                <input {...register('demoEmail')} className="input" placeholder="demo@maqder.com" />
              </div>
              <div className="md:col-span-2">
                <label className="label">{isArabic ? 'كلمة المرور الجديدة (اختياري)' : 'New password (optional)'}</label>
                <input type="password" {...register('demoPassword')} className="input" placeholder={isArabic ? 'اتركه فارغاً للاحتفاظ بالحالية' : 'Leave empty to keep current'} />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'الأسعار' : 'Pricing'}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{isArabic ? 'العملة' : 'Currency'}</label>
                <input {...register('pricingCurrency')} className="input" placeholder="SAR" />
              </div>
              <div className="md:col-span-2">
                <label className="label">{isArabic ? 'خطط الأسعار (JSON)' : 'Pricing plans (JSON)'}</label>
                <textarea
                  {...register('pricingPlansJson')}
                  className="input min-h-[220px] font-mono text-xs"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {isArabic
                    ? 'يمكنك تعديل الأسماء والأسعار والميزات لكل خطة.'
                    : 'You can edit plan names, prices, and features for each plan.'}
                </p>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
              {saveMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {isArabic ? 'حفظ' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
