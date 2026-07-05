import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, Building2, CreditCard, User, Shield, MapPin, Briefcase, Receipt, KeyRound, Eye, EyeOff, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import SarIcon from '../../components/ui/SarIcon'
import { getBusinessTypeOptions, getPrimaryBusinessType, getTenantBusinessTypes, normalizeBusinessTypes } from '../../lib/businessTypes'

export default function TenantForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const isEdit = Boolean(id)

  const [passwordModal, setPasswordModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: {
      businessType: 'trading',
      businessTypes: ['trading'],
    },
  })

  const logoValue = watch('branding.logo')
  const businessTypeOptions = getBusinessTypeOptions(language)
  const watchedBusinessTypes = normalizeBusinessTypes(watch('businessTypes'), watch('businessType') || 'trading')
  const watchedPrimaryBusinessType = watch('businessType') || 'trading'

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/super-admin/tenants/${id}`).then(res => res.data),
    enabled: isEdit,
  })

  const { data: resellersData } = useQuery({
    queryKey: ['resellers'],
    queryFn: () => api.get('/super-admin/resellers').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  })
  const resellers = resellersData?.resellers || []

  useEffect(() => {
    if (!tenant?.tenant) return
    reset({
      ...tenant.tenant,
      businessTypes: getTenantBusinessTypes(tenant.tenant),
      businessType: getPrimaryBusinessType(tenant.tenant),
      subscription: {
        ...tenant.tenant?.subscription,
        endDate: tenant.tenant?.subscription?.endDate ? new Date(tenant.tenant.subscription.endDate).toISOString().split('T')[0] : ''
      }
    })
  }, [reset, tenant])

  useEffect(() => {
    if (!watchedBusinessTypes.includes(watchedPrimaryBusinessType)) {
      setValue('businessTypes', Array.from(new Set([...watchedBusinessTypes, watchedPrimaryBusinessType])))
    }
  }, [setValue, watchedBusinessTypes, watchedPrimaryBusinessType])

  const watchedBillingCycle = watch('subscription.billingCycle')
  const watchedStartDate = watch('subscription.startDate')
  const watchedEndDate = watch('subscription.endDate')
  const billingCycleRef = useRef(null)

  // Initialize default subscription dates for new tenants
  useEffect(() => {
    if (isEdit) return
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 30)
    setValue('subscription.billingCycle', 'monthly')
    setValue('subscription.startDate', start.toISOString().split('T')[0], { shouldDirty: false })
    setValue('subscription.endDate', end.toISOString().split('T')[0], { shouldDirty: false })
  }, [isEdit, setValue])

  // Recalculate end date when billing cycle changes
  useEffect(() => {
    if (!watchedBillingCycle) return
    if (billingCycleRef.current === null) {
      billingCycleRef.current = watchedBillingCycle
      return
    }
    if (billingCycleRef.current === watchedBillingCycle) return
    billingCycleRef.current = watchedBillingCycle
    const start = watchedStartDate ? new Date(watchedStartDate) : new Date()
    const days = watchedBillingCycle === 'yearly' ? 365 : 30
    const end = new Date(start)
    end.setDate(end.getDate() + days)
    const formatted = end.toISOString().split('T')[0]
    if (formatted !== watchedEndDate) {
      setValue('subscription.endDate', formatted, { shouldDirty: true })
    }
  }, [watchedBillingCycle, watchedStartDate, watchedEndDate, setValue])

  // Auto-mirror bilingual legal names when one side is empty
  const legalNameEn = watch('business.legalNameEn')
  const legalNameAr = watch('business.legalNameAr')
  useEffect(() => {
    if (legalNameEn && !legalNameAr) {
      setValue('business.legalNameAr', legalNameEn, { shouldValidate: false })
    } else if (legalNameAr && !legalNameEn) {
      setValue('business.legalNameEn', legalNameAr, { shouldValidate: false })
    }
  }, [legalNameEn, legalNameAr, setValue])

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

    const nextPayload = {
      ...data,
      resellerId: data?.resellerId || null,
      business: {
        ...(data?.business || {}),
        address: {
          ...(data?.business?.address || {}),
          country: data?.business?.address?.country || 'SA',
        },
      },
      settings: nextSettings,
      businessTypes: watchedBusinessTypes,
      businessType: watchedBusinessTypes.includes(watchedPrimaryBusinessType) ? watchedPrimaryBusinessType : watchedBusinessTypes[0],
    }

    mutation.mutate(nextPayload)
  }

  const mutation = useMutation({
    mutationFn: (data) => (isEdit ? api.put(`/super-admin/tenants/${id}`, data) : api.post('/super-admin/tenants', data)).then((res) => res.data),
    onSuccess: (response) => {
      toast.success(isEdit ? (language === 'ar' ? 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø±' : 'Tenant updated') : (language === 'ar' ? 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø±' : 'Tenant created'))
      if (!isEdit) {
        if (response?.welcomeEmail?.sent) {
          toast.success(language === 'ar' ? 'ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø¨Ø±ÙŠØ¯ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù„ÙˆØ­Ø© Ø¥Ù„Ù‰ Ø¨Ø±ÙŠØ¯ Ø§Ù„Ù†Ø´Ø§Ø· Ø§Ù„ØªØ¬Ø§Ø±ÙŠ' : 'Panel creation email sent to the business email')
        } else {
          toast.error((language === 'ar' ? 'ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø± Ù„ÙƒÙ† ØªØ¹Ø°Ø± Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¨Ø±ÙŠØ¯:' : 'Tenant created, but welcome email was not sent: ') + (response?.welcomeEmail?.error || response?.welcomeEmail?.reason || 'unknown_error'))
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
      toast.error(language === 'ar' ? 'Ø§Ù„Ù…Ù„Ù ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† ØµÙˆØ±Ø©' : 'File must be an image')
      return
    }

    if (file.size > 1024 * 1024) {
      toast.error(language === 'ar' ? 'Ø­Ø¬Ù… Ø§Ù„ØµÙˆØ±Ø© ÙƒØ¨ÙŠØ± Ø¬Ø¯Ø§Ù‹ (Ø§Ù„Ø­Ø¯ 1MB)' : 'Image is too large (max 1MB)')
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
      toast.success(language === 'ar' ? 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø­Ø§Ù„Ø©' : 'Status updated')
      queryClient.invalidateQueries(['tenant', id])
    }
  })

  const changePasswordMutation = useMutation({
    mutationFn: ({ userId, password }) => api.put(`/super-admin/users/${userId}`, { password }),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'ØªÙ… ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Password changed')
      setPasswordModal(null)
      setNewPassword('')
      setShowPassword(false)
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
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
              {isEdit ? (language === 'ar' ? 'ØªØ¹Ø¯ÙŠÙ„ Ù…Ø³ØªØ£Ø¬Ø±' : 'Edit Tenant') : (language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ù…Ø³ØªØ£Ø¬Ø±' : 'Add Tenant')}
            </h1>
            {isEdit && <p className="text-gray-500">{tenant?.tenant?.name}</p>}
          </div>
        </div>
        {isEdit && (
          <button onClick={() => toggleStatusMutation.mutate()} className={`btn ${tenant?.tenant?.isActive ? 'btn-danger' : 'btn-primary'}`}>
            {tenant?.tenant?.isActive ? (language === 'ar' ? 'ØªØ¹Ø·ÙŠÙ„' : 'Deactivate') : (language === 'ar' ? 'ØªÙØ¹ÙŠÙ„' : 'Activate')}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg"><Building2 className="w-5 h-5 text-primary-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø±' : 'Tenant Information'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'Ø´Ø¹Ø§Ø± Ø§Ù„Ø´Ø±ÙƒØ©' : 'Company Logo'}</label>
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
                    {language === 'ar' ? 'PNG/JPG Ø¨Ø­Ø¯ Ø£Ù‚ØµÙ‰ 1MB' : 'PNG/JPG max 1MB'}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø±' : 'Tenant Name'} *</label>
              <input {...register('name', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù…Ø² (Slug)' : 'Slug'} *</label>
              <input {...register('slug', { required: true })} className="input" placeholder="company-name" />
            </div>
            
            <div>
              <label className="label">{language === 'ar' ? 'Ù…Ø±Ø­Ù„Ø© Ø²Ø§ØªÙƒØ§ (ZATCA)' : 'ZATCA Phase'} *</label>
              <select {...register('zatca.phase', { valueAsNumber: true })} className="select">
                <option value={1}>{language === 'ar' ? 'Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø£ÙˆÙ„Ù‰' : 'Phase 1'}</option>
                <option value={2}>{language === 'ar' ? 'Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ©' : 'Phase 2'}</option>
              </select>
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'Ù†ÙˆØ¹ Ø§Ù„Ù†Ø´Ø§Ø·' : 'Business Type'}</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {businessTypeOptions.map((option) => {
                  const active = watchedBusinessTypes.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleBusinessType(option.id)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium border transition-all ${active ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500/50 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-dark-600 dark:bg-dark-800 dark:text-gray-400 dark:hover:border-dark-500'}`}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
              <input type="hidden" {...register('businessTypes')} />
            </div>

            {watchedBusinessTypes.length > 1 && (
              <div>
                <label className="label">{language === 'ar' ? 'Ø§Ù„Ù†Ø´Ø§Ø· Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ (Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ©)' : 'Primary Context (Default Dashboard)'}</label>
                <select {...register('businessType')} className="select">
                  {watchedBusinessTypes.map((typeId) => {
                    const opt = businessTypeOptions.find((o) => o.id === typeId)
                    return (
                      <option key={typeId} value={typeId}>
                        {opt?.label}
                      </option>
                    )
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-2">{language === 'ar' ? 'Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø£Ù†Ø´Ø·Ø© Ø§Ù„Ù…Ø­Ø¯Ø¯Ø© Ø£Ø¹Ù„Ø§Ù‡ Ø³ØªÙƒÙˆÙ† ÙØ¹Ø§Ù„Ø©. Ù‡Ø°Ø§ Ø§Ù„Ø®ÙŠØ§Ø± ÙŠØ­Ø¯Ø¯ Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø§ÙØªØ±Ø§Ø¶ÙŠØ© ÙÙ‚Ø·.' : 'All selected types above will be active. This only sets the default dashboard.'}</p>
              </div>
            )}
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠ (EN)' : 'Legal Name (EN)'} *</label>
              <input {...register('business.legalNameEn', { required: true })} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠ (AR)' : 'Legal Name (AR)'} *</label>
              <input {...register('business.legalNameAr', { required: true })} className="input" dir="rtl" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠ' : 'VAT Number'}</label>
              <input {...register('business.vatNumber')} className="input" placeholder="3XXXXXXXXXX00003" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ' : 'CR Number'}</label>
              <input {...register('business.crNumber')} className="input" />
            </div>
            {isEdit && (
              <>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©' : 'City'}</label>
                  <input {...register('business.address.city')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© (AR)' : 'City (AR)'}</label>
                  <input {...register('business.address.cityAr')} className="input" dir="rtl" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­ÙŠ' : 'District'}</label>
                  <input {...register('business.address.district')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­ÙŠ (AR)' : 'District (AR)'}</label>
                  <input {...register('business.address.districtAr')} className="input" dir="rtl" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø´Ø§Ø±Ø¹' : 'Street'}</label>
                  <input {...register('business.address.street')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø´Ø§Ø±Ø¹ (AR)' : 'Street (AR)'}</label>
                  <input {...register('business.address.streetAr')} className="input" dir="rtl" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠ' : 'Postal Code'}</label>
                  <input {...register('business.address.postalCode')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ù…Ø¨Ù†Ù‰' : 'Building Number'}</label>
                  <input {...register('business.address.buildingNumber')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¥Ø¶Ø§ÙÙŠ' : 'Additional Number'}</label>
                  <input {...register('business.address.additionalNumber')} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø¯ÙˆÙ„Ø©' : 'Country'}</label>
                  <input {...register('business.address.country')} className="input" placeholder="SA" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email'}</label>
                  <input type="email" {...register('business.contactEmail')} className="input" />
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* National Address */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><MapPin className="w-5 h-5 text-blue-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙˆØ·Ù†ÙŠ' : 'National Address'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ø¥Ø«Ø¨Ø§Øª' : 'Proof Number'}</label>
              <input {...register('business.nationalAddress.proofNumber')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¥Ø¶Ø§ÙÙŠ / Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¹Ù…ÙŠÙ„' : 'Customer Account'}</label>
              <input {...register('business.nationalAddress.customerAccount')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø£ØµÙ„ÙŠ' : 'Original Date'}</label>
              <input type="date" {...register('business.nationalAddress.originalDate')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡' : 'Expiration Date'}</label>
              <input type="date" {...register('business.nationalAddress.expirationDate')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³Ø¬ÙŠÙ„' : 'Registration Date'}</label>
              <input type="date" {...register('business.nationalAddress.regDate')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ø®ØªØµØ±' : 'Short Address'}</label>
              <input {...register('business.nationalAddress.shortAddress')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ù…Ø¨Ù†Ù‰' : 'Building No'}</label>
              <input {...register('business.nationalAddress.buildingNo')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­ÙŠ' : 'Neighborhood'}</label>
              <input {...register('business.nationalAddress.neighborhood')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ù…Ù†Ø·Ù‚Ø©' : 'Region'}</label>
              <input {...register('business.nationalAddress.region')} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'Ø±Ø§Ø¨Ø· QR Ù„Ù„ØªØ­Ù‚Ù‚' : 'QR Verification URL'}</label>
              <input {...register('business.nationalAddress.qrCodeUrl')} className="input" placeholder="https://proof.address.gov.sa/VerifyProofNA.aspx" />
            </div>
          </div>
        </motion.div>

        {/* Commercial Registration */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg"><Briefcase className="w-5 h-5 text-amber-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ' : 'Commercial Registration'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ·Ù†ÙŠ Ø§Ù„Ù…ÙˆØ­Ø¯' : 'CR Number'}</label>
              <input {...register('business.commercialRegistration.crNumber')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø±' : 'Issue Date'}</label>
              <input type="date" {...register('business.commercialRegistration.issueDate')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ù†ÙˆØ¹ Ø§Ù„ÙƒÙŠØ§Ù† (EN)' : 'Company Type (EN)'}</label>
              <input {...register('business.commercialRegistration.companyType')} className="input" placeholder="Limited Liability Company" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ù†ÙˆØ¹ Ø§Ù„ÙƒÙŠØ§Ù† (AR)' : 'Company Type (AR)'}</label>
              <input {...register('business.commercialRegistration.companyTypeAr')} className="input" dir="rtl" placeholder="Ø´Ø±ÙƒØ© Ø°Ø§Øª Ù…Ø³Ø¤ÙˆÙ„ÙŠØ© Ù…Ø­Ø¯ÙˆØ¯Ø©" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø­Ø§Ù„Ø© Ø§Ù„Ø³Ø¬Ù„ (EN)' : 'Company Status (EN)'}</label>
              <input {...register('business.commercialRegistration.companyStatus')} className="input" placeholder="Active" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø­Ø§Ù„Ø© Ø§Ù„Ø³Ø¬Ù„ (AR)' : 'Company Status (AR)'}</label>
              <input {...register('business.commercialRegistration.companyStatusAr')} className="input" dir="rtl" placeholder="Ù†Ø´Ø·" />
            </div>
            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'Ø±Ø§Ø¨Ø· QR Ù„Ù„ØªØ­Ù‚Ù‚' : 'QR Verification URL'}</label>
              <input {...register('business.commercialRegistration.qrCodeUrl')} className="input" />
            </div>
          </div>
        </motion.div>

        {/* VAT Registration Certificate */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-teal-100 dark:bg-teal-900/30 rounded-lg"><Receipt className="w-5 h-5 text-teal-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ø´Ù‡Ø§Ø¯Ø© ØªØ³Ø¬ÙŠÙ„ Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ©' : 'VAT Registration Certificate'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©' : 'Certificate No'}</label>
              <input {...register('business.vatCertificate.certificateNo')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©' : 'Certificate Date'}</label>
              <input type="date" {...register('business.vatCertificate.certificateDate')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ÙØ¹Ù‘Ø§Ù„' : 'Effective Registration Date'}</label>
              <input type="date" {...register('business.vatCertificate.effectiveDate')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø£ÙˆÙ„ Ø¥Ù‚Ø±Ø§Ø± Ø¶Ø±ÙŠØ¨ÙŠ' : 'First Filing Due Date'}</label>
              <input type="date" {...register('business.vatCertificate.firstFilingDueDate')} className="input" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„ÙØªØ±Ø© Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠØ© (EN)' : 'Tax Period (EN)'}</label>
              <input {...register('business.vatCertificate.taxPeriod')} className="input" placeholder="Quarterly" />
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„ÙØªØ±Ø© Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠØ© (AR)' : 'Tax Period (AR)'}</label>
              <input {...register('business.vatCertificate.taxPeriodAr')} className="input" dir="rtl" placeholder="Ø±Ø¨Ø¹ Ø³Ù†ÙˆÙŠ" />
            </div>
            <div className="md:col-span-2">
              <label className="label">{language === 'ar' ? 'Ø±Ø§Ø¨Ø· QR Ù„Ù„ØªØ­Ù‚Ù‚' : 'QR Verification URL'}</label>
              <input {...register('business.vatCertificate.qrCodeUrl')} className="input" />
            </div>
          </div>
        </motion.div>


        {/* Reseller Assignment */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg"><Users className="w-5 h-5 text-indigo-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'تعيين الموزع' : 'Reseller Assignment'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'الموزع' : 'Reseller'}</label>
              <select {...register('resellerId')} className="select">
                <option value="">{language === 'ar' ? '— بدون موزع —' : '— No reseller —'}</option>
                {resellers.filter(r => r.isActive).map(r => (
                  <option key={r._id} value={r._id}>{r.name}{r.company ? ` (${r.company})` : ''}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'تعيين موزع لهذا المستأجر. سيتمكن الموزع من عرض بيانات الاشتراك فقط.' : 'Assign a reseller to this tenant. The reseller can view subscription details only.'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Subscription */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"><CreditCard className="w-5 h-5 text-emerald-600" /></div>
            <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ' : 'Subscription'}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø®Ø·Ø©' : 'Plan'}</label>
              <select {...register('subscription.plan')} className="select">
                <option value="trial">Trial</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­Ø§Ù„Ø©' : 'Status'}</label>
              <select {...register('subscription.status')} className="select">
                <option value="active">{language === 'ar' ? 'Ù†Ø´Ø·' : 'Active'}</option>
                <option value="suspended">{language === 'ar' ? 'Ù…Ø¹Ù„Ù‚' : 'Suspended'}</option>
                <option value="expired">{language === 'ar' ? 'Ù…Ù†ØªÙ‡ÙŠ' : 'Expired'}</option>
              </select>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'Ø¯ÙˆØ±Ø© Ø§Ù„ÙÙˆØªØ±Ø©' : 'Billing Cycle'}</label>
              <select {...register('subscription.billingCycle')} className="select">
                <option value="monthly">{language === 'ar' ? 'Ø´Ù‡Ø±ÙŠ' : 'Monthly'}</option>
                <option value="yearly">{language === 'ar' ? 'Ø³Ù†ÙˆÙŠ' : 'Yearly'}</option>
              </select>
            </div>
            <div>
              <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¨Ø¯Ø¡' : 'Start Date'}</label>
              <input type="date" {...register('subscription.startDate')} className="input" />
            </div>
            <div>
              <label className="label">
                <span className="inline-flex items-center gap-1">
                  {language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡' : 'End Date'}
                </span>
              </label>
              <input type="date" {...register('subscription.endDate')} className="input" />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'ÙŠØªÙ… ØªØ­Ø¯ÙŠØ« Ø§Ù„ØªØ§Ø±ÙŠØ® ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ Ø¹Ù†Ø¯ ØªØºÙŠÙŠØ± Ø¯ÙˆØ±Ø© Ø§Ù„ÙÙˆØªØ±Ø©.' : 'End date is auto-recalculated when billing cycle changes.'}
              </p>
            </div>
            {isEdit && (
              <>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†' : 'Max Users'}</label>
                  <input type="number" {...register('subscription.maxUsers', { valueAsNumber: true })} className="input" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„ÙÙˆØ§ØªÙŠØ±' : 'Max Invoices'}</label>
                  <input type="number" {...register('subscription.maxInvoices', { valueAsNumber: true })} className="input" />
                </div>
                <div>
                  <label className="label">
                    <span className="inline-flex items-center gap-1">
                      {language === 'ar' ? 'Ø§Ù„Ø³Ø¹Ø±' : 'Price'}
                      <SarIcon className="w-[1em] h-[1em]" />
                    </span>
                  </label>
                  <input type="number" {...register('subscription.price', { valueAsNumber: true })} className="input" />
                </div>
                <label className="md:col-span-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email Add-on'}</p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'ÙŠÙ…Ù†Ø­ Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø± ØµÙ†Ø¯ÙˆÙ‚ Ø§Ù„Ø¨Ø±ÙŠØ¯ØŒ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù„Ù„ÙÙˆØ§ØªÙŠØ±ØŒ ÙˆØ±Ø¨Ø· Ù‡ÙˆÙŠØ© SMTP Ø®Ø§ØµØ©.' : 'Grants the tenant inbox access, automated invoice delivery, and custom SMTP identity support.'}</p>
                  </div>
                  <input type="checkbox" {...register('subscription.hasEmailAddon')} className="h-4 w-4" />
                </label>
                <label className="md:col-span-3 rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 dark:border-cyan-900/40 dark:bg-cyan-950/20 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ø¥Ù†ØªØ±Ù†Øª Ø§Ù„Ø£Ø´ÙŠØ§Ø¡ (IoT)' : 'IoT Add-on'}</p>
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-[10px] font-bold uppercase">Smart Corp</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'ÙŠÙ…ÙƒÙ‘Ù† Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø± Ù…Ù† Ø¯Ù…Ø¬ ÙˆØ¥Ø¯Ø§Ø±Ø© Ø¨Ù†ÙŠØªÙ‡ Ø§Ù„ØªØ­ØªÙŠØ© Ø§Ù„ÙƒØ§Ù…Ù„Ø© Ø¹Ø¨Ø± Ø´Ø¨ÙƒØ© Ø¥Ù†ØªØ±Ù†Øª Ø§Ù„Ø£Ø´ÙŠØ§Ø¡ â€” Ù…Ø³ØªØ´Ø¹Ø±Ø§ØªØŒ Ø¨ÙˆØ§Ø¨Ø§ØªØŒ Ø¹Ø¯Ø§Ø¯Ø§ØªØŒ ÙˆØ£Ù†Ø¸Ù…Ø© Ù…Ø¤Ø³Ø³ÙŠØ© Ø°ÙƒÙŠØ©.' : 'Enables the tenant to integrate and manage their complete corporate infrastructure through a unified IoT network â€” sensors, gateways, meters, and smart enterprise systems.'}</p>
                  </div>
                  <input type="checkbox" {...register('subscription.hasIotAddon')} className="h-4 w-4 accent-cyan-500" />
                </label>
                <label className="md:col-span-3 rounded-2xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900/40 dark:bg-teal-950/20 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ø§Ù„Ù…ÙŠØ²Ø§Ù† Ø§Ù„Ø°ÙƒÙŠ (Bakala)' : 'Weight Scale Add-on (Bakala)'}</p>
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold uppercase">Premium</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'ÙŠÙ…ÙƒÙ‘Ù† Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø± Ù…Ù† Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…ÙŠØ²Ø§Ù† Ù„Ø·Ø¨Ø§Ø¹Ø© Ù…Ù„ØµÙ‚Ø§Øª Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ù„Ù„Ù…Ù†ØªØ¬Ø§Øª Ø§Ù„Ù…ÙˆØ²ÙˆÙ†Ø© (Ø®Ø§Øµ Ø¨Ø§Ù„Ø³ÙˆØ¨Ø±Ù…Ø§Ø±ÙƒØª).' : 'Enables the smart weight scale feature to print and read weight barcodes for supermarket items.'}</p>
                  </div>
                  <input type="checkbox" {...register('subscription.hasWeightScaleAddon')} className="h-4 w-4 accent-teal-500" />
                </label>
                <label className="md:col-span-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ø§Ù„ÙØ±ÙˆØ¹ Ø§Ù„Ù…ØªØ¹Ø¯Ø¯Ø©' : 'Multi-Branch Add-on'}</p>
                      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase">Restaurant</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'ÙŠÙ…ÙƒÙ‘Ù† Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø± Ù…Ù† Ø¥Ù†Ø´Ø§Ø¡ ÙˆØ¥Ø¯Ø§Ø±Ø© ÙØ±ÙˆØ¹ Ù…ØªØ¹Ø¯Ø¯Ø© Ù…Ø¹ Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† Ù…Ø³ØªÙ‚Ù„ÙŠÙ† Ù„ÙƒÙ„ ÙØ±Ø¹.' : 'Enables the tenant to create and manage multiple branches with independent users per branch.'}</p>
                  </div>
                  <input type="checkbox" {...register('subscription.hasBranchAddon')} className="h-4 w-4 accent-amber-500" />
                </label>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ù‚ØµÙ‰ Ù„Ù„ÙØ±ÙˆØ¹' : 'Max Branches'}</label>
                  <input type="number" {...register('subscription.maxBranches', { valueAsNumber: true })} className="input" />
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Admin User (New tenant only) */}
        {!isEdit && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg"><User className="w-5 h-5 text-blue-600" /></div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…Ø´Ø±Ù ÙˆØ§Ù„ØªÙˆØ§ØµÙ„' : 'Admin User & Contact'}</h3>
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
              <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-200 dark:border-dark-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{language === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø´Ø®ØµÙŠ Ù„Ù„Ù…Ø§Ù„Ùƒ' : 'Owner Personal Email'}</label>
                  <input type="email" {...register('personalEmail')} className="input" placeholder="Used for welcome email" />
                </div>
                <div>
                  <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨' : 'WhatsApp Number'}</label>
                  <input type="text" {...register('phoneNumber')} className="input" placeholder="e.g. 966500000000" />
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20 flex items-center justify-between">
               <div>
                 <h4 className="font-medium text-emerald-900 dark:text-emerald-100">{language === 'ar' ? 'ØªÙ… ØªØµÙÙŠØ© Ø§Ù„Ù…Ø¨Ø§Ù„Øº' : 'Billing Cleared'}</h4>
                 <p className="text-sm text-emerald-700 dark:text-emerald-300">{language === 'ar' ? 'Ø³ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø© Ø§Ù„ØªØ®Ù„ÙŠØµ ÙˆØ¥Ø±ÙØ§Ù‚ Ø§Ù„Ø´Ø±ÙˆØ· ÙˆØ§Ù„Ø£Ø­ÙƒØ§Ù….' : 'Send billing cleared message and attach Terms & Conditions PDF.'}</p>
               </div>
               <input type="checkbox" {...register('billingCleared')} className="h-5 w-5 accent-emerald-500" />
            </div>
          </motion.div>
        )}

        {/* Stats (Edit only) */}
        {isEdit && tenant && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg"><Shield className="w-5 h-5 text-violet-600" /></div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª' : 'Statistics'}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†' : 'Users'}</p>
                <p className="text-2xl font-bold">{tenant.users?.length || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†' : 'Employees'}</p>
                <p className="text-2xl font-bold">{tenant.employeeCount || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">{language === 'ar' ? 'Ø§Ù„ÙÙˆØ§ØªÙŠØ±' : 'Invoices'}</p>
                <p className="text-2xl font-bold">{tenant.invoiceStats?.reduce((sum, s) => sum + s.count, 0) || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                <p className="text-sm text-gray-500">ZATCA</p>
                <p className="text-lg font-bold">{tenant.tenant?.zatca?.isOnboarded ? 'âœ“ Active' : 'â—‹ Pending'}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* User Password Management (Edit only) */}
        {isEdit && tenant?.users && tenant.users.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg"><KeyRound className="w-5 h-5 text-amber-600" /></div>
              <h3 className="text-lg font-semibold">{language === 'ar' ? 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† ÙˆÙƒÙ„Ù…Ø§Øª Ø§Ù„Ù…Ø±ÙˆØ±' : 'User Password Management'}</h3>
            </div>
            <div className="space-y-3">
              {(tenant.users || []).map((user) => (
                <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {language === 'ar' ? 'Ø§Ù„Ø¯ÙˆØ±' : 'Role'}: {user.role}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setPasswordModal(user); setNewPassword(''); setShowPassword(false) }}
                    className="btn btn-secondary"
                  >
                    <KeyRound className="w-4 h-4" />
                    {language === 'ar' ? 'ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Change Password'}
                  </button>
                </div>
              ))}
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

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-md"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <KeyRound className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{language === 'ar' ? 'ØªØºÙŠÙŠØ± ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Change Password'}</h3>
                  <p className="text-sm text-gray-500">{passwordModal.firstName} {passwordModal.lastName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setPasswordModal(null); setNewPassword(''); setShowPassword(false) }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">{language === 'ar' ? 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©' : 'New Password'} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pe-10"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={language === 'ar' ? 'Ø£Ø¯Ø®Ù„ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø§Ù„Ø¬Ø¯ÙŠØ¯Ø©' : 'Enter new password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && newPassword.length < 6 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {language === 'ar' ? 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† 6 Ø£Ø­Ø±Ù Ø¹Ù„Ù‰ Ø§Ù„Ø£Ù‚Ù„' : 'Password must be at least 6 characters'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setPasswordModal(null); setNewPassword(''); setShowPassword(false) }}
                className="btn btn-secondary"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!newPassword || newPassword.length < 6 || changePasswordMutation.isPending}
                onClick={() => changePasswordMutation.mutate({ userId: passwordModal._id, password: newPassword })}
                className="btn btn-primary"
              >
                {changePasswordMutation.isPending ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    {language === 'ar' ? 'ØªØ­Ø¯ÙŠØ« ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±' : 'Update Password'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
