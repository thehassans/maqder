import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Building2, Shield, Globe, Palette, Bell, Save, Key, CheckCircle, Image, Database, Download, FileText, CreditCard, Terminal, Car } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import { setLanguage, setTheme } from '../store/slices/uiSlice'
import { updateTenant } from '../store/slices/authSlice'
import { useLiveTranslation } from '../lib/liveTranslation'
import { getInvoiceBrandingProfile, getInvoiceTemplateId, getInvoiceTypography, INVOICE_FONT_OPTIONS } from '../lib/invoiceBranding'
import { invoiceTemplateOptions } from '../lib/invoiceTemplates'
import PosTerminalSettings from '../components/settings/PosTerminalSettings'
import HardwareSettings from '../components/settings/HardwareSettings'
import CarRentalApiSettings from '../components/settings/CarRentalApiSettings'

const invoiceBrandingContexts = [
  { key: 'trading', labelEn: 'Trading Invoice', labelAr: 'فاتورة تجارة' },
  { key: 'construction', labelEn: 'Contracting Invoice', labelAr: 'فاتورة مقاولات' },
  { key: 'travel_agency', labelEn: 'Travel Agency Invoice', labelAr: 'فاتورة وكالة سفر' },
]

const buildInvoiceBrandingProfilesState = (tenant) => invoiceBrandingContexts.reduce((acc, item) => {
  const profile = getInvoiceBrandingProfile(tenant, item.key)
  acc[item.key] = {
    templateId: Number(profile.templateId || getInvoiceTemplateId(tenant, item.key)),
    logo: profile.logo || '',
    headerTextEn: profile.headerTextEn || '',
    headerTextAr: profile.headerTextAr || '',
    footerTextEn: profile.footerTextEn || '',
    footerTextAr: profile.footerTextAr || '',
  }
  return acc
}, {})

const updateInvoiceBrandingProfileState = (profiles, contextKey, patch) => ({
  ...profiles,
  [contextKey]: {
    ...(profiles?.[contextKey] || {}),
    ...patch,
  },
})

export default function Settings() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { language, theme } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [activeTab, setActiveTab] = useState('company')
  const [downloadingBackup, setDownloadingBackup] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#14B8A6')
  const [secondaryColor, setSecondaryColor] = useState('#D946EF')
  const [headerStyle, setHeaderStyle] = useState('glass')
  const [sidebarStyle, setSidebarStyle] = useState('solid')
  const [logoDataUrl, setLogoDataUrl] = useState(null)
  const [invoicePdfTemplate, setInvoicePdfTemplate] = useState(1)
  const [invoicePdfPageSize, setInvoicePdfPageSize] = useState('a4')
  const [invoicePdfOrientation, setInvoicePdfOrientation] = useState('portrait')
  const [invoiceCurrencyDisplay, setInvoiceCurrencyDisplay] = useState('text')
  const [invoiceCurrencyPosition, setInvoiceCurrencyPosition] = useState('after')
  const [invoiceLogoDataUrl, setInvoiceLogoDataUrl] = useState(null)
  const [invoiceHeaderTextEn, setInvoiceHeaderTextEn] = useState('')
  const [invoiceHeaderTextAr, setInvoiceHeaderTextAr] = useState('')
  const [invoiceFooterTextEn, setInvoiceFooterTextEn] = useState('')
  const [invoiceFooterTextAr, setInvoiceFooterTextAr] = useState('')
  const [invoiceBodyFontFamily, setInvoiceBodyFontFamily] = useState('helvetica')
  const [invoiceHeadingFontFamily, setInvoiceHeadingFontFamily] = useState('helvetica')
  const [invoiceBodyFontSize, setInvoiceBodyFontSize] = useState(12)
  const [invoiceHeadingFontSize, setInvoiceHeadingFontSize] = useState(18)
  const [showVision2030, setShowVision2030] = useState(true)
  const [vision2030LogoDataUrl, setVision2030LogoDataUrl] = useState('/saudi-vision-2030-logo.png')
  const [invoiceBrandingProfiles, setInvoiceBrandingProfiles] = useState(() => buildInvoiceBrandingProfilesState(null))

  const { data: tenant } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => api.get('/tenants/current').then(res => res.data)
  })

  useEffect(() => {
    if (!tenant) return

    setPrimaryColor(tenant.branding?.primaryColor || '#14B8A6')
    setSecondaryColor(tenant.branding?.secondaryColor || '#D946EF')
    setHeaderStyle(tenant.branding?.headerStyle || 'glass')
    setSidebarStyle(tenant.branding?.sidebarStyle || 'solid')
    setLogoDataUrl(tenant.branding?.logo || null)
    setInvoicePdfTemplate(Number(tenant.settings?.invoicePdfTemplate || 1))
    setInvoicePdfPageSize(tenant.settings?.invoicePdfPageSize || 'a4')
    setInvoicePdfOrientation(tenant.settings?.invoicePdfOrientation || 'portrait')
    setInvoiceCurrencyDisplay(tenant.settings?.invoiceCurrencyDisplay === 'icon' ? 'icon' : 'text')
    setInvoiceCurrencyPosition(tenant.settings?.invoiceCurrencyPosition === 'before' ? 'before' : 'after')
    setInvoiceLogoDataUrl(tenant.settings?.invoiceBranding?.logo || tenant.branding?.logo || null)
    setInvoiceHeaderTextEn(tenant.settings?.invoiceBranding?.headerTextEn || '')
    setInvoiceHeaderTextAr(tenant.settings?.invoiceBranding?.headerTextAr || '')
    setInvoiceFooterTextEn(tenant.settings?.invoiceBranding?.footerTextEn || '')
    setInvoiceFooterTextAr(tenant.settings?.invoiceBranding?.footerTextAr || '')
    const typography = getInvoiceTypography(tenant)
    setInvoiceBodyFontFamily(typography.bodyFontFamily)
    setInvoiceHeadingFontFamily(typography.headingFontFamily)
    setInvoiceBodyFontSize(typography.bodyFontSize)
    setInvoiceHeadingFontSize(typography.headingFontSize)
    setShowVision2030(tenant.settings?.invoiceBranding?.showVision2030 !== false)
    setVision2030LogoDataUrl(tenant.settings?.invoiceBranding?.vision2030Logo || '/saudi-vision-2030-logo.png')
    setInvoiceBrandingProfiles(buildInvoiceBrandingProfilesState(tenant))
  }, [tenant])

  const { register, handleSubmit, reset, watch, setValue, control } = useForm()

  useEffect(() => {
    if (!tenant) return
    reset({
      legalNameEn: tenant.business?.legalNameEn || '',
      legalNameAr: tenant.business?.legalNameAr || '',
      vatNumber: tenant.business?.vatNumber || '',
      crNumber: tenant.business?.crNumber || '',
      address: {
        city: tenant.business?.address?.city || '',
        cityAr: tenant.business?.address?.cityAr || '',
        district: tenant.business?.address?.district || '',
        districtAr: tenant.business?.address?.districtAr || '',
        street: tenant.business?.address?.street || '',
        streetAr: tenant.business?.address?.streetAr || '',
        postalCode: tenant.business?.address?.postalCode || '',
        buildingNumber: tenant.business?.address?.buildingNumber || '',
        additionalNumber: tenant.business?.address?.additionalNumber || '',
        country: tenant.business?.address?.country || 'SA'
      },
      contactEmail: tenant.business?.contactEmail || '',
      contactPhone: tenant.business?.contactPhone || ''
    })
  }, [tenant, reset])

  useLiveTranslation({
    control,
    watch,
    setValue,
    sourceField: 'legalNameEn',
    targetField: 'legalNameAr',
    sourceLang: 'en',
    targetLang: 'ar'
  })

  useLiveTranslation({
    control,
    watch,
    setValue,
    sourceField: 'legalNameAr',
    targetField: 'legalNameEn',
    sourceLang: 'ar',
    targetLang: 'en'
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/tenants/current', data),
    onSuccess: (res) => {
      const updated = res?.data
      toast.success(language === 'ar' ? 'تم حفظ الإعدادات' : 'Settings saved')
      if (updated) {
        queryClient.setQueryData(['tenant-settings'], updated)
        dispatch(updateTenant(updated))
      }
      queryClient.invalidateQueries(['tenant-settings'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving')
  })

  const applyImageFile = (file, setter) => {
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setter(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleLogoFile = (e) => {
    applyImageFile(e.target.files?.[0], setLogoDataUrl)
  }

  const handleInvoiceLogoFile = (e) => {
    applyImageFile(e.target.files?.[0], setInvoiceLogoDataUrl)
  }

  const handleVision2030LogoFile = (e) => {
    applyImageFile(e.target.files?.[0], setVision2030LogoDataUrl)
  }

  const handleInvoiceContextLogoFile = (contextKey) => (e) => {
    applyImageFile(e.target.files?.[0], (result) => {
      setInvoiceBrandingProfiles((current) => updateInvoiceBrandingProfileState(current, contextKey, { logo: result }))
    })
  }


  const tabs = [
    { id: 'company', label: t('companySettings'), icon: Building2 },
    { id: 'govIntegrations', label: language === 'ar' ? 'التكاملات الحكومية' : 'Government Integrations', icon: Shield },
    { id: 'preferences', label: language === 'ar' ? 'التفضيلات' : 'Preferences', icon: Palette },
    { id: 'setupMachine', label: language === 'ar' ? 'إعداد الدفع الإلكتروني' : 'Payment Terminal', icon: CreditCard },
    { id: 'hardware', label: language === 'ar' ? 'الأجهزة والطباعة' : 'Hardware & Printers', icon: Terminal },
    { id: 'backup', label: language === 'ar' ? 'النسخ الاحتياطي' : 'Backup', icon: Database },
  ]

  const downloadBackup = async () => {
    try {
      setDownloadingBackup(true)
      const res = await api.get('/tenants/backup', { responseType: 'blob' })

      const blob = new Blob([res.data], { type: 'application/gzip' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')

      const d = new Date()
      const dateStr = d.toISOString().slice(0, 10)
      const safeSlug = tenant?.slug || 'tenant'
      a.href = url
      a.download = `backup_${safeSlug}_${dateStr}.jsonl.gz`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error(err.response?.data?.error || (language === 'ar' ? 'فشل تحميل النسخة الاحتياطية' : 'Failed to download backup'))
    } finally {
      setDownloadingBackup(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' ? 'إدارة إعدادات الشركة والنظام' : 'Manage company and system settings'}
        </p>
      </div>

      <div className="space-y-6">
        {/* Horizontal Tabs */}
        <div className="card p-1 flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {activeTab === 'company' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <h3 className="text-lg font-semibold mb-6">{t('companySettings')}</h3>
              <form onSubmit={handleSubmit((data) => updateMutation.mutate({
                business: data,
                branding: {
                  ...(tenant?.branding || {}),
                  logo: logoDataUrl || tenant?.branding?.logo || null,
                },
              }))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{language === 'ar' ? 'الاسم القانوني (EN)' : 'Legal Name (EN)'}</label>
                    <input {...register('legalNameEn')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الاسم القانوني (AR)' : 'Legal Name (AR)'}</label>
                    <input {...register('legalNameAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الرقم الضريبي' : 'VAT Number'}</label>
                    <input {...register('vatNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'السجل التجاري' : 'CR Number'}</label>
                    <input {...register('crNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'المدينة' : 'City'}</label>
                    <input {...register('address.city')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'المدينة (AR)' : 'City (AR)'}</label>
                    <input {...register('address.cityAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الحي' : 'District'}</label>
                    <input {...register('address.district')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الحي (AR)' : 'District (AR)'}</label>
                    <input {...register('address.districtAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الشارع' : 'Street'}</label>
                    <input {...register('address.street')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الشارع (AR)' : 'Street (AR)'}</label>
                    <input {...register('address.streetAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الرمز البريدي' : 'Postal Code'}</label>
                    <input {...register('address.postalCode')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'رقم المبنى' : 'Building Number'}</label>
                    <input {...register('address.buildingNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الرقم الإضافي' : 'Additional Number'}</label>
                    <input {...register('address.additionalNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الدولة' : 'Country'}</label>
                    <input {...register('address.country')} className="input" placeholder="SA" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                    <input type="email" {...register('contactEmail')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'الهاتف' : 'Phone'}</label>
                    <input {...register('contactPhone')} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label flex items-center gap-2"><Image className="w-4 h-4" />{language === 'ar' ? 'شعار لوحة الإدارة' : 'Admin Panel Logo'}</label>
                  <div className="card-glass p-4 mt-2">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-dark-700 border border-gray-200 dark:border-dark-600 flex items-center justify-center overflow-hidden">
                        {logoDataUrl ? (
                          <img src={logoDataUrl} alt="" className="w-full h-full object-contain" />
                        ) : (
                          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleLogoFile} className="input" />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {language === 'ar' ? 'يتم تطبيق الشعار على الشريط الجانبي وترويسة الفواتير' : 'This logo is used in the sidebar and invoice header'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary">
                    {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{t('save')}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'govIntegrations' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <GovernmentIntegrations />
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <h3 className="text-lg font-semibold mb-6">{language === 'ar' ? 'التفضيلات' : 'Preferences'}</h3>
              <div className="space-y-6">
                <div>
                  <label className="label flex items-center gap-2"><Globe className="w-4 h-4" />{t('language')}</label>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => dispatch(setLanguage('en'))}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${language === 'en' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                    >
                      <span className="font-medium">{t('english')}</span>
                    </button>
                    <button
                      onClick={() => dispatch(setLanguage('ar'))}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${language === 'ar' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                    >
                      <span className="font-medium">{t('arabic')}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-2"><Palette className="w-4 h-4" />{t('theme')}</label>
                  <div className="flex gap-3 mt-2">
                    <button
                      onClick={() => dispatch(setTheme('light'))}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                    >
                      <span className="font-medium">{t('light')}</span>
                    </button>
                    <button
                      onClick={() => dispatch(setTheme('dark'))}
                      className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                    >
                      <span className="font-medium">{t('dark')}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="label flex items-center gap-2"><FileText className="w-4 h-4" />{language === 'ar' ? 'تصميم PDF للفواتير' : 'Invoice PDF Design'}</label>
                  <div className="card-glass p-4 mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'القالب' : 'Template'}</label>
                        <select value={invoicePdfTemplate} onChange={(e) => setInvoicePdfTemplate(Number(e.target.value))} className="select mt-1">
                          <option value={1}>{language === 'ar' ? 'قالب 1 (كلاسيكي)' : 'Template 1 (Classic)'}</option>
                          <option value={2}>{language === 'ar' ? 'قالب 2 (مُتدرّج)' : 'Template 2 (Gradient)'}</option>
                          <option value={3}>{language === 'ar' ? 'قالب 3 (شريط جانبي)' : 'Template 3 (Sidebar)'}</option>
                          <option value={4}>{language === 'ar' ? 'قالب 4 (مُبسّط)' : 'Template 4 (Minimal)'}</option>
                          <option value={5}>{language === 'ar' ? 'قالب 5 (داكن أنيق)' : 'Template 5 (Elegant Dark)'}</option>
                          <option value={6}>{language === 'ar' ? 'قالب 6 (شبكة ضريبية)' : 'Template 6 (Tax Grid)'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'حجم الصفحة' : 'Page Size'}</label>
                        <select value={invoicePdfPageSize} onChange={(e) => setInvoicePdfPageSize(e.target.value)} className="select mt-1">
                          <option value="a4">A4</option>
                          <option value="letter">Letter</option>
                          <option value="a5">A5</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'الاتجاه' : 'Orientation'}</label>
                        <select value={invoicePdfOrientation} onChange={(e) => setInvoicePdfOrientation(e.target.value)} className="select mt-1">
                          <option value="portrait">{language === 'ar' ? 'طولي' : 'Portrait'}</option>
                          <option value="landscape">{language === 'ar' ? 'عرضي' : 'Landscape'}</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'عرض العملة' : 'Currency Display'}</label>
                        <select value={invoiceCurrencyDisplay} onChange={(e) => setInvoiceCurrencyDisplay(e.target.value === 'icon' ? 'icon' : 'text')} className="select mt-1">
                          <option value="text">{language === 'ar' ? 'نص (SAR)' : 'Text (SAR)'}</option>
                          <option value="icon">{language === 'ar' ? 'رمز الريال السعودي (﷼)' : 'Saudi Riyal Icon (﷼)'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'موضع رمز/نص العملة' : 'Currency Position'}</label>
                        <select value={invoiceCurrencyPosition} onChange={(e) => setInvoiceCurrencyPosition(e.target.value === 'before' ? 'before' : 'after')} className="select mt-1">
                          <option value="after">{language === 'ar' ? 'بعد المبلغ (200.00 SAR)' : 'After amount (200.00 SAR)'}</option>
                          <option value="before">{language === 'ar' ? 'قبل المبلغ (SAR 200.00)' : 'Before amount (SAR 200.00)'}</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {language === 'ar' ? 'يتم تطبيق هذا القالب عند تحميل PDF من شاشة الفواتير.' : 'This template is used when downloading invoice PDFs.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="label flex items-center gap-2"><Image className="w-4 h-4" />{language === 'ar' ? 'هوية الفاتورة' : 'Invoice Branding'}</label>
                  <div className="grid grid-cols-1 gap-4 mt-2 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="card-glass p-4 space-y-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'شعار الفاتورة' : 'Invoice Logo'}</label>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="h-28 w-32 rounded-3xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 overflow-hidden flex items-center justify-center p-2">
                            {invoiceLogoDataUrl ? (
                              <img src={invoiceLogoDataUrl} alt="" className="h-full w-full object-contain scale-110" />
                            ) : (
                              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-dark-600 dark:to-dark-700" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input type="file" accept="image/*" onChange={handleInvoiceLogoFile} className="input" />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {language === 'ar' ? 'يظهر هذا الشعار في أعلى الفاتورة وداخل المعاينة وPDF.' : 'This logo appears in the invoice header, preview, and PDF.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-gray-200 dark:border-dark-600 bg-white/70 dark:bg-dark-800/40 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{language === 'ar' ? 'رؤية 2030' : 'Vision 2030'}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إظهار شعار رؤية 2030 في أعلى الفاتورة.' : 'Show the Vision 2030 mark in the invoice header.'}</p>
                          </div>
                          <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={showVision2030} onChange={(e) => setShowVision2030(e.target.checked)} className="sr-only peer" />
                            <span className="relative h-6 w-11 rounded-full bg-gray-300 transition peer-checked:bg-primary-500 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
                          </label>
                        </div>
                        <div className="mt-4 flex items-center gap-4">
                          <div className="h-16 w-16 rounded-2xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 overflow-hidden flex items-center justify-center">
                            {vision2030LogoDataUrl ? <img src={vision2030LogoDataUrl} alt="" className="h-full w-full object-contain" /> : null}
                          </div>
                          <div className="flex-1">
                            <input type="file" accept="image/*" onChange={handleVision2030LogoFile} className="input" />
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'اختياري: ارفع شعاراً مختلفاً أو اترك الشعار الافتراضي.' : 'Optional: upload a different mark or keep the default asset.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="card-glass p-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص أعلى الفاتورة (EN)' : 'Invoice Header Text (EN)'}</label>
                        <textarea value={invoiceHeaderTextEn} onChange={(e) => setInvoiceHeaderTextEn(e.target.value)} rows={5} className="input mt-2 min-h-[120px]" placeholder={language === 'ar' ? 'مثال: Your Trusted Partner for Travel & Tours Worldwide.' : 'Example: Your Trusted Partner for Travel & Tours Worldwide.'} />
                      </div>
                      <div className="card-glass p-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص أعلى الفاتورة (AR)' : 'Invoice Header Text (AR)'}</label>
                        <textarea value={invoiceHeaderTextAr} onChange={(e) => setInvoiceHeaderTextAr(e.target.value)} rows={5} dir="rtl" className="input mt-2 min-h-[120px]" placeholder={language === 'ar' ? 'مثال: شريككم الموثوق للسفر والسياحة حول العالم.' : 'Example: شريككم الموثوق للسفر والسياحة حول العالم.'} />
                      </div>
                      <div className="card-glass p-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص التذييل (EN)' : 'Invoice Footer Text (EN)'}</label>
                        <textarea value={invoiceFooterTextEn} onChange={(e) => setInvoiceFooterTextEn(e.target.value)} rows={5} className="input mt-2 min-h-[120px]" placeholder={language === 'ar' ? 'العنوان، الهاتف، الموقع، البريد...' : 'Address, phone, website, email...'} />
                      </div>
                      <div className="card-glass p-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص التذييل (AR)' : 'Invoice Footer Text (AR)'}</label>
                        <textarea value={invoiceFooterTextAr} onChange={(e) => setInvoiceFooterTextAr(e.target.value)} rows={5} dir="rtl" className="input mt-2 min-h-[120px]" placeholder={language === 'ar' ? 'العنوان، الهاتف، الموقع، البريد...' : 'Example: العنوان، الهاتف، الموقع، البريد...'} />
                      </div>
                      <div className="card-glass p-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'خط النص العام' : 'Body Font'}</label>
                        <select value={invoiceBodyFontFamily} onChange={(e) => setInvoiceBodyFontFamily(e.target.value)} className="select mt-2">
                          {INVOICE_FONT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{language === 'ar' ? option.labelAr : option.labelEn}</option>
                          ))}
                        </select>
                        <label className="mt-4 block text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'حجم النص العام' : 'Body Font Size'}</label>
                        <input type="number" min="9" max="40" value={invoiceBodyFontSize} onChange={(e) => setInvoiceBodyFontSize(Number(e.target.value || 12))} className="input mt-2" />
                      </div>
                      <div className="card-glass p-4">
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'خط العناوين' : 'Heading Font'}</label>
                        <select value={invoiceHeadingFontFamily} onChange={(e) => setInvoiceHeadingFontFamily(e.target.value)} className="select mt-2">
                          {INVOICE_FONT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{language === 'ar' ? option.labelAr : option.labelEn}</option>
                          ))}
                        </select>
                        <label className="mt-4 block text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'حجم العناوين' : 'Heading Font Size'}</label>
                        <input type="number" min="9" max="40" value={invoiceHeadingFontSize} onChange={(e) => setInvoiceHeadingFontSize(Number(e.target.value || 18))} className="input mt-2" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <label className="label flex items-center gap-2"><FileText className="w-4 h-4" />{language === 'ar' ? 'أنماط الفواتير حسب النشاط' : 'Invoice Patterns by Business Type'}</label>
                  <div className="mt-2 grid grid-cols-1 gap-4 xl:grid-cols-3">
                    {invoiceBrandingContexts.map((item) => {
                      const profile = invoiceBrandingProfiles?.[item.key] || {}
                      return (
                        <div key={item.key} className="card-glass p-4 space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? item.labelAr : item.labelEn}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'يمكنك تخصيص القالب والشعار والنصوص لهذا النوع من الفواتير.' : 'Set a dedicated template, logo, and texts for this invoice type.'}</p>
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'القالب الافتراضي' : 'Default Template'}</label>
                            <select value={Number(profile.templateId || getInvoiceTemplateId(tenant, item.key))} onChange={(e) => setInvoiceBrandingProfiles((current) => updateInvoiceBrandingProfileState(current, item.key, { templateId: Number(e.target.value) }))} className="select mt-1">
                              {invoiceTemplateOptions.map((option) => (
                                <option key={option.id} value={option.id}>{language === 'ar' ? option.nameAr : option.nameEn}</option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-4 items-center">
                            <div className="flex h-24 w-28 items-center justify-center overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 dark:border-dark-600 dark:bg-dark-800">
                              {profile.logo ? <img src={profile.logo} alt="" className="h-full w-full object-contain scale-110" /> : <div className="h-14 w-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-dark-600 dark:to-dark-700" />}
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'شعار هذا النوع' : 'Context Logo'}</label>
                              <input type="file" accept="image/*" onChange={handleInvoiceContextLogoFile(item.key)} className="input mt-1" />
                              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'اختياري: يطبّق فقط على هذا النوع من الفواتير.' : 'Optional: applies only to this invoice type.'}</p>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص أعلى الفاتورة (EN)' : 'Header Text (EN)'}</label>
                            <textarea value={profile.headerTextEn || ''} onChange={(e) => setInvoiceBrandingProfiles((current) => updateInvoiceBrandingProfileState(current, item.key, { headerTextEn: e.target.value }))} rows={3} className="input mt-2 min-h-[88px]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص أعلى الفاتورة (AR)' : 'Header Text (AR)'}</label>
                            <textarea value={profile.headerTextAr || ''} onChange={(e) => setInvoiceBrandingProfiles((current) => updateInvoiceBrandingProfileState(current, item.key, { headerTextAr: e.target.value }))} rows={3} dir="rtl" className="input mt-2 min-h-[88px]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص التذييل (EN)' : 'Footer Text (EN)'}</label>
                            <textarea value={profile.footerTextEn || ''} onChange={(e) => setInvoiceBrandingProfiles((current) => updateInvoiceBrandingProfileState(current, item.key, { footerTextEn: e.target.value }))} rows={3} className="input mt-2 min-h-[88px]" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'نص التذييل (AR)' : 'Footer Text (AR)'}</label>
                            <textarea value={profile.footerTextAr || ''} onChange={(e) => setInvoiceBrandingProfiles((current) => updateInvoiceBrandingProfileState(current, item.key, { footerTextAr: e.target.value }))} rows={3} dir="rtl" className="input mt-2 min-h-[88px]" />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="label flex items-center gap-2"><Palette className="w-4 h-4" />{language === 'ar' ? 'ألوان العلامة' : 'Brand Colors'}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="card-glass p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'اللون الأساسي' : 'Primary'}</span>
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-gray-200 dark:border-dark-600 bg-transparent" />
                      </div>
                      <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="input mt-3" />
                    </div>
                    <div className="card-glass p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'اللون الثانوي' : 'Secondary'}</span>
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-gray-200 dark:border-dark-600 bg-transparent" />
                      </div>
                      <input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="input mt-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-2"><Palette className="w-4 h-4" />{language === 'ar' ? 'نمط الواجهة' : 'UI Style'}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="card-glass p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{language === 'ar' ? 'الهيدر' : 'Header'}</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setHeaderStyle('glass')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${headerStyle === 'glass' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'زجاجي' : 'Glass'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderStyle('solid')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${headerStyle === 'solid' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'صلب' : 'Solid'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="card-glass p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{language === 'ar' ? 'القائمة الجانبية' : 'Sidebar'}</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSidebarStyle('solid')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${sidebarStyle === 'solid' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'صلب' : 'Solid'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSidebarStyle('glass')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${sidebarStyle === 'glass' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'زجاجي' : 'Glass'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({
                      settings: {
                        ...(tenant?.settings || {}),
                        invoicePdfTemplate,
                        invoicePdfPageSize,
                        invoicePdfOrientation,
                        invoiceCurrencyDisplay,
                        invoiceCurrencyPosition,
                        invoiceBranding: {
                          ...(tenant?.settings?.invoiceBranding || {}),
                          logo: invoiceLogoDataUrl || tenant?.settings?.invoiceBranding?.logo || tenant?.branding?.logo || null,
                          headerTextEn: invoiceHeaderTextEn,
                          headerTextAr: invoiceHeaderTextAr,
                          footerTextEn: invoiceFooterTextEn,
                          footerTextAr: invoiceFooterTextAr,
                          typography: {
                            bodyFontFamily: invoiceBodyFontFamily,
                            headingFontFamily: invoiceHeadingFontFamily,
                            bodyFontSize: Number(invoiceBodyFontSize || 12),
                            headingFontSize: Number(invoiceHeadingFontSize || 18),
                          },
                          showVision2030,
                          vision2030Logo: vision2030LogoDataUrl || tenant?.settings?.invoiceBranding?.vision2030Logo || '/saudi-vision-2030-logo.png',
                          contextProfiles: invoiceBrandingContexts.reduce((acc, item) => {
                            const profile = invoiceBrandingProfiles?.[item.key] || {}
                            acc[item.key] = {
                              templateId: Number(profile.templateId || getInvoiceTemplateId(tenant, item.key)),
                              logo: profile.logo || '',
                              headerTextEn: profile.headerTextEn || '',
                              headerTextAr: profile.headerTextAr || '',
                              footerTextEn: profile.footerTextEn || '',
                              footerTextAr: profile.footerTextAr || '',
                            }
                            return acc
                          }, {})
                        }
                      },
                      branding: {
                        ...(tenant?.branding || {}),
                        primaryColor,
                        secondaryColor,
                        headerStyle,
                        sidebarStyle,
                        logo: logoDataUrl || tenant?.branding?.logo
                      }
                    })}
                    className="btn btn-primary"
                  >
                    {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{t('save')}</>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'setupMachine' && (
            <PosTerminalSettings
              tenant={tenant}
              language={language}
              onSave={(posSettings) =>
                updateMutation.mutate({ settings: { posTerminal: posSettings } })
              }
            />
          )}

          {activeTab === 'hardware' && (
            <HardwareSettings
              tenant={tenant}
              language={language}
              onSave={(hardwareSettings) =>
                updateMutation.mutate({ settings: { hardwareSettings } })
              }
              isSaving={updateMutation.isPending}
            />
          )}

          {activeTab === 'carRentalApis' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <CarRentalApiSettings tenant={tenant} isAr={language === 'ar'} />
            </motion.div>
          )}

          {activeTab === 'backup' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <h3 className="text-lg font-semibold mb-2">{language === 'ar' ? 'النسخ الاحتياطي' : 'Backup'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? 'قم بتنزيل نسخة احتياطية كاملة من بيانات المستأجر. قد يستغرق التحميل وقتاً حسب حجم البيانات.'
                  : 'Download a full tenant backup. Download time depends on dataset size.'}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button onClick={downloadBackup} disabled={downloadingBackup} className="btn btn-primary">
                  {downloadingBackup ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {language === 'ar' ? 'تنزيل النسخة الاحتياطية' : 'Download Backup'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
