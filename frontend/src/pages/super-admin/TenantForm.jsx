import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Building2, CreditCard, User, Shield, FileText, Image } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import SarIcon from '../../components/ui/SarIcon'
import EmailAdminSettingsSection from '../../components/email/EmailAdminSettingsSection'
import { getBusinessTypeOptions, getPrimaryBusinessType, getTenantBusinessTypes, normalizeBusinessTypes } from '../../lib/businessTypes'
import { getInvoiceBrandingProfile, getInvoiceTemplateId } from '../../lib/invoiceBranding'
import { invoiceTemplateOptions } from '../../lib/invoiceTemplates'

const invoiceBrandingContexts = [
  { key: 'trading', labelEn: 'Trading Invoice', labelAr: 'فاتورة تجارة' },
  { key: 'construction', labelEn: 'Contracting Invoice', labelAr: 'فاتورة مقاولات' },
  { key: 'travel_agency', labelEn: 'Travel Agency Invoice', labelAr: 'فاتورة وكالة سفر' },
]

export default function TenantForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const isEdit = Boolean(id)

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      businessType: 'trading',
      businessTypes: ['trading'],
    },
  })

  const logoValue = watch('branding.logo')
  const invoiceLogoValue = watch('settings.invoiceBranding.logo')
  const vision2030LogoValue = watch('settings.invoiceBranding.vision2030Logo')
  const showVision2030 = watch('settings.invoiceBranding.showVision2030')
  const businessTypeOptions = getBusinessTypeOptions(language)
  const watchedBusinessTypes = normalizeBusinessTypes(watch('businessTypes'), watch('businessType') || 'trading')
  const watchedPrimaryBusinessType = watch('businessType') || 'trading'

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/super-admin/tenants/${id}`).then(res => res.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!tenant?.tenant) return
    reset({
      ...tenant.tenant,
      businessTypes: getTenantBusinessTypes(tenant.tenant),
      businessType: getPrimaryBusinessType(tenant.tenant),
    })
  }, [reset, tenant])

  useEffect(() => {
    if (!watchedBusinessTypes.includes(watchedPrimaryBusinessType)) {
      setValue('businessType', watchedBusinessTypes[0] || 'trading')
    }
  }, [setValue, watchedBusinessTypes, watchedPrimaryBusinessType])

  const toggleBusinessType = (businessTypeId) => {
    const next = watchedBusinessTypes.includes(businessTypeId)
      ? watchedBusinessTypes.filter((item) => item !== businessTypeId)
      : [...watchedBusinessTypes, businessTypeId]
    const normalized = normalizeBusinessTypes(next)
    setValue('businessTypes', normalized)
    if (!normalized.includes(watchedPrimaryBusinessType)) {
      setValue('businessType', normalized[0])
    }
  }

  const onSubmit = (data) => {
    const nextSettings = data?.settings || {}
    const nextInvoiceBranding = nextSettings?.invoiceBranding || {}
    const nextContextProfiles = invoiceBrandingContexts.reduce((acc, item) => {
      const profile = nextInvoiceBranding?.contextProfiles?.[item.key] || {}
      acc[item.key] = {
        templateId: Number(profile?.templateId || getInvoiceTemplateId({ settings: nextSettings }, item.key)),
        logo: profile?.logo || '',
        headerTextEn: profile?.headerTextEn || '',
        headerTextAr: profile?.headerTextAr || '',
        footerTextEn: profile?.footerTextEn || '',
        footerTextAr: profile?.footerTextAr || '',
      }
      return acc
    }, {})

    const nextPayload = {
      ...data,
      business: {
        ...(data?.business || {}),
        address: {
          ...(data?.business?.address || {}),
          country: data?.business?.address?.country || 'SA',
        },
      },
      settings: isEdit
        ? {
            ...nextSettings,
            invoicePdfTemplate: Number(nextSettings?.invoicePdfTemplate || 1),
            invoicePdfPageSize: nextSettings?.invoicePdfPageSize || 'a4',
            invoicePdfOrientation: nextSettings?.invoicePdfOrientation || 'portrait',
            invoiceBranding: {
              ...nextInvoiceBranding,
              showVision2030: nextInvoiceBranding?.showVision2030 !== false,
              vision2030Logo: nextInvoiceBranding?.vision2030Logo || '/saudi-vision-2030-logo.png',
              contextProfiles: nextContextProfiles,
            },
          }
        : {
            ...nextSettings,
          },
      businessTypes: watchedBusinessTypes,
      businessType: watchedBusinessTypes.includes(watchedPrimaryBusinessType) ? watchedPrimaryBusinessType : watchedBusinessTypes[0],
    }

    mutation.mutate(nextPayload)
  }

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? api.put(`/super-admin/tenants/${id}`, data) : api.post('/super-admin/tenants', data)).then((res) => res.data),
    onSuccess: (response) => {
      toast.success(isEdit ? (language === 'ar' ? 'تم تحديث المستأجر' : 'Tenant updated') : (language === 'ar' ? 'تم إنشاء المستأجر' : 'Tenant created'))
      if (!isEdit) {
        if (response?.welcomeEmail?.sent) {
          toast.success(language === 'ar' ? 'تم إرسال بريد إنشاء اللوحة إلى بريد النشاط التجاري' : 'Panel creation email sent to the business email')
        } else {
          toast.error((language === 'ar' ? 'تم إنشاء المستأجر لكن تعذر إرسال البريد:' : 'Tenant created, but welcome email was not sent: ') + (response?.welcomeEmail?.error || response?.welcomeEmail?.reason || 'unknown_error'))
        }
      }
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

  const handleImageFieldChange = (fieldPath) => async (e) => {
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
      setValue(fieldPath, reader.result, { shouldDirty: true })
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <label className="label">{language === 'ar' ? 'نوع النشاط' : 'Business Type'}</label>
              <div className="grid grid-cols-1 gap-3 mt-2">
                {businessTypeOptions.map((option) => {
                  const active = watchedBusinessTypes.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleBusinessType(option.id)}
                      className={`rounded-2xl border p-4 text-start transition-all ${active ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                    >
                      <p className="font-semibold text-gray-900 dark:text-white">{option.label}</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{option.description}</p>
                    </button>
                  )
                })}
              </div>
              <input type="hidden" {...register('businessTypes')} />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'النشاط الافتراضي' : 'Primary Business Type'}</label>
              <select {...register('businessType')} className="select">
                {watchedBusinessTypes.map((businessTypeId) => {
                  const option = businessTypeOptions.find((item) => item.id === businessTypeId)
                  return <option key={businessTypeId} value={businessTypeId}>{option?.label || businessTypeId}</option>
                })}
              </select>
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
              <label className="label">{language === 'ar' ? 'الحي' : 'District'}</label>
              <input {...register('business.address.district')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الشارع' : 'Street'}</label>
              <input {...register('business.address.street')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الرمز البريدي' : 'Postal Code'}</label>
              <input {...register('business.address.postalCode')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'رقم المبنى' : 'Building Number'}</label>
              <input {...register('business.address.buildingNumber')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الرقم الإضافي' : 'Additional Number'}</label>
              <input {...register('business.address.additionalNumber')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'الدولة' : 'Country'}</label>
              <input {...register('business.address.country')} className="input" placeholder="SA" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
              <input type="email" {...register('business.contactEmail')} className="input" />
            </div>
          </div>
        </motion.div>

        {isEdit ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg"><FileText className="w-5 h-5 text-slate-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'إعدادات الفواتير' : 'Invoice Settings'}</h3>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">{language === 'ar' ? 'القالب العام' : 'Global Template'}</label>
                <select {...register('settings.invoicePdfTemplate', { valueAsNumber: true })} className="select">
                  {invoiceTemplateOptions.map((option) => <option key={option.id} value={option.id}>{language === 'ar' ? option.nameAr : option.nameEn}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'حجم الصفحة' : 'Page Size'}</label>
                <select {...register('settings.invoicePdfPageSize')} className="select">
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="a5">A5</option>
                </select>
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'الاتجاه' : 'Orientation'}</label>
                <select {...register('settings.invoicePdfOrientation')} className="select">
                  <option value="portrait">{language === 'ar' ? 'طولي' : 'Portrait'}</option>
                  <option value="landscape">{language === 'ar' ? 'عرضي' : 'Landscape'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <div className="rounded-2xl border border-gray-200 dark:border-dark-600 p-4 space-y-4">
                <div>
                  <label className="label flex items-center gap-2"><Image className="w-4 h-4" />{language === 'ar' ? 'شعار الفاتورة' : 'Invoice Logo'}</label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-28 items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 dark:border-dark-600 dark:bg-dark-800">
                      {invoiceLogoValue ? <img src={invoiceLogoValue} alt="" className="h-full w-full object-contain scale-110" /> : <Building2 className="w-8 h-8 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <input type="hidden" {...register('settings.invoiceBranding.logo')} />
                      <input type="file" accept="image/*" onChange={handleImageFieldChange('settings.invoiceBranding.logo')} className="input" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">{language === 'ar' ? 'رؤية 2030' : 'Vision 2030'}</label>
                  <div className="flex items-center justify-between rounded-2xl border border-gray-200 dark:border-dark-600 p-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{language === 'ar' ? 'إظهار الشعار على الفاتورة' : 'Show mark on invoices'}</span>
                    <input type="checkbox" {...register('settings.invoiceBranding.showVision2030')} defaultChecked={showVision2030 !== false} className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <label className="label">{language === 'ar' ? 'شعار رؤية 2030' : 'Vision 2030 Logo'}</label>
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-20 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 dark:border-dark-600 dark:bg-dark-800">
                      {vision2030LogoValue ? <img src={vision2030LogoValue} alt="" className="h-full w-full object-contain" /> : null}
                    </div>
                    <div className="flex-1">
                      <input type="hidden" {...register('settings.invoiceBranding.vision2030Logo')} />
                      <input type="file" accept="image/*" onChange={handleImageFieldChange('settings.invoiceBranding.vision2030Logo')} className="input" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'ar' ? 'نص أعلى الفاتورة (EN)' : 'Invoice Header Text (EN)'}</label>
                  <textarea {...register('settings.invoiceBranding.headerTextEn')} rows={4} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'نص أعلى الفاتورة (AR)' : 'Invoice Header Text (AR)'}</label>
                  <textarea {...register('settings.invoiceBranding.headerTextAr')} rows={4} dir="rtl" className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'نص التذييل (EN)' : 'Invoice Footer Text (EN)'}</label>
                  <textarea {...register('settings.invoiceBranding.footerTextEn')} rows={4} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'نص التذييل (AR)' : 'Invoice Footer Text (AR)'}</label>
                  <textarea {...register('settings.invoiceBranding.footerTextAr')} rows={4} dir="rtl" className="input" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {invoiceBrandingContexts.map((item) => {
                const profile = getInvoiceBrandingProfile({ settings: watch('settings') }, item.key)
                const profileLogo = watch(`settings.invoiceBranding.contextProfiles.${item.key}.logo`)
                return (
                  <div key={item.key} className="rounded-2xl border border-gray-200 dark:border-dark-600 p-4 space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? item.labelAr : item.labelEn}</p>
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'القالب' : 'Template'}</label>
                      <select {...register(`settings.invoiceBranding.contextProfiles.${item.key}.templateId`, { valueAsNumber: true })} defaultValue={profile.templateId || getInvoiceTemplateId({ settings: watch('settings') }, item.key)} className="select">
                        {invoiceTemplateOptions.map((option) => <option key={option.id} value={option.id}>{language === 'ar' ? option.nameAr : option.nameEn}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 items-center">
                      <div className="flex h-24 w-28 items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 dark:border-dark-600 dark:bg-dark-800">
                        {profileLogo ? <img src={profileLogo} alt="" className="h-full w-full object-contain scale-110" /> : <Building2 className="w-8 h-8 text-gray-400" />}
                      </div>
                      <div>
                        <input type="hidden" {...register(`settings.invoiceBranding.contextProfiles.${item.key}.logo`)} />
                        <input type="file" accept="image/*" onChange={handleImageFieldChange(`settings.invoiceBranding.contextProfiles.${item.key}.logo`)} className="input" />
                      </div>
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'النص العلوي (EN)' : 'Header Text (EN)'}</label>
                      <textarea {...register(`settings.invoiceBranding.contextProfiles.${item.key}.headerTextEn`)} rows={3} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'النص العلوي (AR)' : 'Header Text (AR)'}</label>
                      <textarea {...register(`settings.invoiceBranding.contextProfiles.${item.key}.headerTextAr`)} rows={3} dir="rtl" className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'التذييل (EN)' : 'Footer Text (EN)'}</label>
                      <textarea {...register(`settings.invoiceBranding.contextProfiles.${item.key}.footerTextEn`)} rows={3} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'التذييل (AR)' : 'Footer Text (AR)'}</label>
                      <textarea {...register(`settings.invoiceBranding.contextProfiles.${item.key}.footerTextAr`)} rows={3} dir="rtl" className="input" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
        ) : null}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <EmailAdminSettingsSection
            register={register}
            watch={watch}
            language={language}
            tenantName={watch('business.legalNameEn') || watch('business.legalNameAr') || watch('name') || ''}
            tenantSlug={watch('slug') || ''}
            contactEmail={watch('business.contactEmail') || ''}
            initialEmailSettings={tenant?.tenant?.settings?.communication?.email || {}}
          />
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
            <label className="md:col-span-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'إضافة البريد الإلكتروني' : 'Email Add-on'}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'يمنح المستأجر صندوق البريد، الإرسال التلقائي للفواتير، وربط هوية SMTP خاصة.' : 'Grants the tenant inbox access, automated invoice delivery, and custom SMTP identity support.'}</p>
              </div>
              <input type="checkbox" {...register('subscription.hasEmailAddon')} className="h-4 w-4" />
            </label>
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
