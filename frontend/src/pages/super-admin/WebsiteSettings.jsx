import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Save, Globe, ShieldCheck, DollarSign, Plus, Trash2, Star, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const defaultPlan = {
  id: '',
  nameEn: '',
  nameAr: '',
  priceMonthly: 0,
  priceYearly: 0,
  popular: false,
  featuresEn: [],
  featuresAr: []
}

export default function WebsiteSettings() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  const [plans, setPlans] = useState([])
  const [currency, setCurrency] = useState('SAR')

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
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['website-settings'],
    queryFn: () => api.get('/super-admin/settings/website').then((res) => res.data),
  })

  useEffect(() => {
    if (data?.website) {
      const website = data.website
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
      })
      setCurrency(website?.pricing?.currency || 'SAR')
      setPlans(website?.pricing?.plans || [])
    }
  }, [data, reset])

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/super-admin/settings/website', payload).then((res) => res.data),
    onSuccess: (d) => {
      toast.success(isArabic ? 'تم حفظ إعدادات الموقع' : 'Website settings saved')
      queryClient.invalidateQueries(['website-settings'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving settings'),
  })

  const updatePlan = (index, field, value) => {
    setPlans(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p))
  }

  const addPlan = () => {
    setPlans(prev => [...prev, { ...defaultPlan, id: `plan_${Date.now()}` }])
  }

  const removePlan = (index) => {
    setPlans(prev => prev.filter((_, i) => i !== index))
  }

  const togglePopular = (index) => {
    setPlans(prev => prev.map((p, i) => ({ ...p, popular: i === index })))
  }

  const onSubmit = (formData) => {
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
          currency: currency.trim() || 'SAR',
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-violet-600" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'الأسعار' : 'Pricing'}</h2>
              </div>
              <button type="button" onClick={addPlan} className="btn btn-secondary text-sm">
                <Plus className="w-4 h-4" />
                {isArabic ? 'إضافة خطة' : 'Add Plan'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="label">{isArabic ? 'العملة' : 'Currency'}</label>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} className="input" placeholder="SAR" />
              </div>
            </div>

            <div className="space-y-4">
              {plans.map((plan, index) => (
                <div key={plan.id || index} className={`p-4 rounded-xl border-2 ${plan.popular ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700/50'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {isArabic ? `خطة ${index + 1}` : `Plan ${index + 1}`}
                      </span>
                      {plan.popular && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-violet-500 text-white rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" /> {isArabic ? 'مميزة' : 'Popular'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => togglePopular(index)} className={`text-xs px-2 py-1 rounded ${plan.popular ? 'bg-violet-200 text-violet-700' : 'bg-gray-200 text-gray-600 hover:bg-violet-100'}`}>
                        <Star className="w-3 h-3 inline mr-1" />
                        {isArabic ? 'مميزة' : 'Popular'}
                      </button>
                      <button type="button" onClick={() => removePlan(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">{isArabic ? 'الاسم (EN)' : 'Name (EN)'}</label>
                      <input value={plan.nameEn || ''} onChange={(e) => updatePlan(index, 'nameEn', e.target.value)} className="input text-sm" placeholder="Starter" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{isArabic ? 'الاسم (AR)' : 'Name (AR)'}</label>
                      <input value={plan.nameAr || ''} onChange={(e) => updatePlan(index, 'nameAr', e.target.value)} className="input text-sm" placeholder="البداية" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{isArabic ? 'السعر الشهري' : 'Monthly Price'}</label>
                      <input type="number" value={plan.priceMonthly || 0} onChange={(e) => updatePlan(index, 'priceMonthly', Number(e.target.value))} className="input text-sm" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{isArabic ? 'السعر السنوي' : 'Yearly Price'}</label>
                      <input type="number" value={plan.priceYearly || 0} onChange={(e) => updatePlan(index, 'priceYearly', Number(e.target.value))} className="input text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="text-xs text-gray-500">{isArabic ? 'الميزات (EN) - سطر لكل ميزة' : 'Features (EN) - one per line'}</label>
                      <textarea
                        value={(plan.featuresEn || []).join('\n')}
                        onChange={(e) => updatePlan(index, 'featuresEn', e.target.value.split('\n').filter(Boolean))}
                        className="input text-sm min-h-[100px]"
                        placeholder="ZATCA E-Invoicing&#10;Up to 500 invoices/month&#10;5 users"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">{isArabic ? 'الميزات (AR) - سطر لكل ميزة' : 'Features (AR) - one per line'}</label>
                      <textarea
                        value={(plan.featuresAr || []).join('\n')}
                        onChange={(e) => updatePlan(index, 'featuresAr', e.target.value.split('\n').filter(Boolean))}
                        className="input text-sm min-h-[100px]"
                        placeholder="الفوترة الإلكترونية&#10;حتى 500 فاتورة/شهر&#10;5 مستخدمين"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {plans.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 dark:border-dark-600 rounded-xl">
                  {isArabic ? 'لا توجد خطط. اضغط "إضافة خطة" لإنشاء خطة جديدة.' : 'No plans yet. Click "Add Plan" to create one.'}
                </div>
              )}
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
