import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Building2, Shield, Globe, Palette, Bell, Save, Key, CheckCircle, Image, Database, Download, FileText, CreditCard, Terminal, Car, UtensilsCrossed, Clock, Printer, MapPin, Briefcase, Receipt, MessageCircle, BookOpen } from 'lucide-react'
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
import GovernmentIntegrations from './tenant-settings/GovernmentIntegrations'

const invoiceBrandingContexts = [
  { key: 'trading', labelEn: 'Trading Invoice', labelAr: 'ÙØ§ØªÙˆØ±Ø© ØªØ¬Ø§Ø±Ø©' },
  { key: 'construction', labelEn: 'Contracting Invoice', labelAr: 'ÙØ§ØªÙˆØ±Ø© Ù…Ù‚Ø§ÙˆÙ„Ø§Øª' },
  { key: 'travel_agency', labelEn: 'Travel Agency Invoice', labelAr: 'ÙØ§ØªÙˆØ±Ø© ÙˆÙƒØ§Ù„Ø© Ø³ÙØ±' },
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
  const [invoiceSequencePattern, setInvoiceSequencePattern] = useState('RCPT-{N}')
  const [khayyatWhatsappLanguage, setKhayyatWhatsappLanguage] = useState('both')
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
  const [vision2030LogoDataUrl, setVision2030LogoDataUrl] = useState('/saudi-vision-2030-logo.webp')
  const [invoiceBrandingProfiles, setInvoiceBrandingProfiles] = useState(() => buildInvoiceBrandingProfilesState(null))
  // Restaurant settings
  const [restAutoStatus, setRestAutoStatus] = useState(false)
  const [restOpenTime, setRestOpenTime] = useState('08:00')
  const [restCloseTime, setRestCloseTime] = useState('23:00')
  const [restNotify, setRestNotify] = useState(false)
  const [restNotifyPhone, setRestNotifyPhone] = useState('')
  const [restPrinters, setRestPrinters] = useState([])
  // WhatsApp auto-send settings
  const [waAutoSend, setWaAutoSend] = useState(false)
  const [waOnOpen, setWaOnOpen] = useState(false)
  const [waOnOrderPlaced, setWaOnOrderPlaced] = useState(false)
  const [waOnOrderReady, setWaOnOrderReady] = useState(false)
  const [waOnOrderServed, setWaOnOrderServed] = useState(false)
  const [waOpenMsgEn, setWaOpenMsgEn] = useState('We are now open! Visit us today.')
  const [waOpenMsgAr, setWaOpenMsgAr] = useState('Ù†Ø­Ù† Ø§Ù„Ø¢Ù† Ù…ÙØªÙˆØ­ÙˆÙ†! Ø²ÙˆØ±Ù†Ø§ Ø§Ù„ÙŠÙˆÙ….')
  const [waOrderPlacedMsgEn, setWaOrderPlacedMsgEn] = useState('Your order has been placed. Order #: {{orderNumber}}')
  const [waOrderPlacedMsgAr, setWaOrderPlacedMsgAr] = useState('ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨Ùƒ. Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: {{orderNumber}}')
  const [waOrderReadyMsgEn, setWaOrderReadyMsgEn] = useState('Your order is ready for pickup/delivery. Order #: {{orderNumber}}')
  const [waOrderReadyMsgAr, setWaOrderReadyMsgAr] = useState('Ø·Ù„Ø¨Ùƒ Ø¬Ø§Ù‡Ø² Ù„Ù„Ø§Ø³ØªÙ„Ø§Ù…/Ø§Ù„ØªÙˆØµÙŠÙ„. Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: {{orderNumber}}')
  const [waOrderServedMsgEn, setWaOrderServedMsgEn] = useState('Your order has been served. Thank you! Order #: {{orderNumber}}')
  const [waOrderServedMsgAr, setWaOrderServedMsgAr] = useState('ØªÙ… ØªÙ‚Ø¯ÙŠÙ… Ø·Ù„Ø¨Ùƒ. Ø´ÙƒØ±Ø§Ù‹ Ù„Ùƒ! Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: {{orderNumber}}')
  const [waNotifyPhones, setWaNotifyPhones] = useState('')
  // Bakala settings
  const [bakalaRequireShift, setBakalaRequireShift] = useState(true)
  // Bookstore settings
  const [bookstoreRequireShift, setBookstoreRequireShift] = useState(true)

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
    setInvoiceSequencePattern(tenant.settings?.invoiceSequencePattern || 'RCPT-{N}')
    setKhayyatWhatsappLanguage(tenant.settings?.khayyat?.whatsappLanguage || 'both')
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
    setVision2030LogoDataUrl(tenant.settings?.invoiceBranding?.vision2030Logo || '/saudi-vision-2030-logo.webp')
    setInvoiceBrandingProfiles(buildInvoiceBrandingProfilesState(tenant))
    // Restaurant settings init
    const rs = tenant.settings?.restaurant || {}
    setRestAutoStatus(rs.autoStatusUpdate || false)
    setRestOpenTime(rs.openingTime || '08:00')
    setRestCloseTime(rs.closingTime || '23:00')
    setRestNotify(rs.notifyOnStatusChange || false)
    setRestNotifyPhone(rs.statusNotificationPhone || '')
    setRestPrinters(rs.printers || [])
    // WhatsApp auto-send init
    const wa = rs.whatsapp || {}
    setWaAutoSend(wa.autoSendEnabled || false)
    setWaOnOpen(wa.autoSendOnOpen || false)
    setWaOnOrderPlaced(wa.autoSendOnOrderPlaced || false)
    setWaOnOrderReady(wa.autoSendOnOrderReady || false)
    setWaOnOrderServed(wa.autoSendOnOrderServed || false)
    setWaOpenMsgEn(wa.openMessageEn || 'We are now open! Visit us today.')
    setWaOpenMsgAr(wa.openMessageAr || 'Ù†Ø­Ù† Ø§Ù„Ø¢Ù† Ù…ÙØªÙˆØ­ÙˆÙ†! Ø²ÙˆØ±Ù†Ø§ Ø§Ù„ÙŠÙˆÙ….')
    setWaOrderPlacedMsgEn(wa.orderPlacedMessageEn || 'Your order has been placed. Order #: {{orderNumber}}')
    setWaOrderPlacedMsgAr(wa.orderPlacedMessageAr || 'ØªÙ… Ø§Ø³ØªÙ„Ø§Ù… Ø·Ù„Ø¨Ùƒ. Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: {{orderNumber}}')
    setWaOrderReadyMsgEn(wa.orderReadyMessageEn || 'Your order is ready for pickup/delivery. Order #: {{orderNumber}}')
    setWaOrderReadyMsgAr(wa.orderReadyMessageAr || 'Ø·Ù„Ø¨Ùƒ Ø¬Ø§Ù‡Ø² Ù„Ù„Ø§Ø³ØªÙ„Ø§Ù…/Ø§Ù„ØªÙˆØµÙŠÙ„. Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: {{orderNumber}}')
    setWaOrderServedMsgEn(wa.orderServedMessageEn || 'Your order has been served. Thank you! Order #: {{orderNumber}}')
    setWaOrderServedMsgAr(wa.orderServedMessageAr || 'ØªÙ… ØªÙ‚Ø¯ÙŠÙ… Ø·Ù„Ø¨Ùƒ. Ø´ÙƒØ±Ø§Ù‹ Ù„Ùƒ! Ø±Ù‚Ù… Ø§Ù„Ø·Ù„Ø¨: {{orderNumber}}')
    setWaNotifyPhones(Array.isArray(wa.notifyPhoneList) ? wa.notifyPhoneList.join(', ') : '')
    // Bakala settings init
    setBakalaRequireShift(tenant.settings?.bakala?.requireShift !== false)
    // Bookstore settings init
    setBookstoreRequireShift(tenant.settings?.bookstore?.requireShift !== false)
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
      contactPhone: tenant.business?.contactPhone || '',
      nationalAddress: {
        proofNumber: tenant.business?.nationalAddress?.proofNumber || '',
        originalDate: tenant.business?.nationalAddress?.originalDate ? new Date(tenant.business.nationalAddress.originalDate).toISOString().split('T')[0] : '',
        expirationDate: tenant.business?.nationalAddress?.expirationDate ? new Date(tenant.business.nationalAddress.expirationDate).toISOString().split('T')[0] : '',
        customerAccount: tenant.business?.nationalAddress?.customerAccount || '',
        regDate: tenant.business?.nationalAddress?.regDate ? new Date(tenant.business.nationalAddress.regDate).toISOString().split('T')[0] : '',
        shortAddress: tenant.business?.nationalAddress?.shortAddress || '',
        buildingNo: tenant.business?.nationalAddress?.buildingNo || '',
        neighborhood: tenant.business?.nationalAddress?.neighborhood || '',
        region: tenant.business?.nationalAddress?.region || '',
        qrCodeUrl: tenant.business?.nationalAddress?.qrCodeUrl || '',
      },
      commercialRegistration: {
        crNumber: tenant.business?.commercialRegistration?.crNumber || '',
        issueDate: tenant.business?.commercialRegistration?.issueDate ? new Date(tenant.business.commercialRegistration.issueDate).toISOString().split('T')[0] : '',
        companyType: tenant.business?.commercialRegistration?.companyType || '',
        companyTypeAr: tenant.business?.commercialRegistration?.companyTypeAr || '',
        companyStatus: tenant.business?.commercialRegistration?.companyStatus || '',
        companyStatusAr: tenant.business?.commercialRegistration?.companyStatusAr || '',
        qrCodeUrl: tenant.business?.commercialRegistration?.qrCodeUrl || '',
      },
      vatCertificate: {
        certificateNo: tenant.business?.vatCertificate?.certificateNo || '',
        certificateDate: tenant.business?.vatCertificate?.certificateDate ? new Date(tenant.business.vatCertificate.certificateDate).toISOString().split('T')[0] : '',
        effectiveDate: tenant.business?.vatCertificate?.effectiveDate ? new Date(tenant.business.vatCertificate.effectiveDate).toISOString().split('T')[0] : '',
        taxPeriod: tenant.business?.vatCertificate?.taxPeriod || '',
        taxPeriodAr: tenant.business?.vatCertificate?.taxPeriodAr || '',
        firstFilingDueDate: tenant.business?.vatCertificate?.firstFilingDueDate ? new Date(tenant.business.vatCertificate.firstFilingDueDate).toISOString().split('T')[0] : '',
        qrCodeUrl: tenant.business?.vatCertificate?.qrCodeUrl || '',
      },
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
      toast.success(language === 'ar' ? 'ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª' : 'Settings saved')
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


  const tenantBusinessTypes = tenant?.businessTypes || []
  const hasRestaurant = tenantBusinessTypes.includes('restaurant')
  const hasBakala = tenantBusinessTypes.includes('bakala')
  const hasBookstore = tenantBusinessTypes.includes('bookstore')

  const tabs = [
    { id: 'company', label: t('companySettings'), icon: Building2 },
    { id: 'govIntegrations', label: language === 'ar' ? 'Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ©' : 'Government Integrations', icon: Shield },
    { id: 'preferences', label: language === 'ar' ? 'Ø§Ù„ØªÙØ¶ÙŠÙ„Ø§Øª' : 'Preferences', icon: Palette },
    { id: 'setupMachine', label: language === 'ar' ? 'Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø¯ÙØ¹ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Payment Terminal', icon: CreditCard },
    { id: 'hardware', label: language === 'ar' ? 'Ø§Ù„Ø£Ø¬Ù‡Ø²Ø© ÙˆØ§Ù„Ø·Ø¨Ø§Ø¹Ø©' : 'Hardware & Printers', icon: Terminal },
    ...(hasRestaurant ? [{ id: 'restaurant', label: language === 'ar' ? 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø·Ø¹Ù…' : 'Restaurant', icon: UtensilsCrossed }] : []),
    ...(hasBakala ? [{ id: 'bakala', label: language === 'ar' ? 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¨Ù‚Ø§Ù„Ø©' : 'Bakala', icon: Building2 }] : []),
    ...(hasBookstore ? [{ id: 'bookstore', label: language === 'ar' ? 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ÙƒØªØ¨Ø©' : 'Bookstore', icon: BookOpen }] : []),
    { id: 'backup', label: language === 'ar' ? 'Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ' : 'Backup', icon: Database },
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
      toast.error(err.response?.data?.error || (language === 'ar' ? 'ÙØ´Ù„ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©' : 'Failed to download backup'))
    } finally {
      setDownloadingBackup(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' ? 'Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø´Ø±ÙƒØ© ÙˆØ§Ù„Ù†Ø¸Ø§Ù…' : 'Manage company and system settings'}
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
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠ (EN)' : 'Legal Name (EN)'}</label>
                    <input {...register('legalNameEn')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø§Ø³Ù… Ø§Ù„Ù‚Ø§Ù†ÙˆÙ†ÙŠ (AR)' : 'Legal Name (AR)'}</label>
                    <input {...register('legalNameAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠ' : 'VAT Number'}</label>
                    <input {...register('vatNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ' : 'CR Number'}</label>
                    <input {...register('crNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø©' : 'City'}</label>
                    <input {...register('address.city')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© (AR)' : 'City (AR)'}</label>
                    <input {...register('address.cityAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­ÙŠ' : 'District'}</label>
                    <input {...register('address.district')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­ÙŠ (AR)' : 'District (AR)'}</label>
                    <input {...register('address.districtAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø´Ø§Ø±Ø¹' : 'Street'}</label>
                    <input {...register('address.street')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø´Ø§Ø±Ø¹ (AR)' : 'Street (AR)'}</label>
                    <input {...register('address.streetAr')} className="input" dir="rtl" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠ' : 'Postal Code'}</label>
                    <input {...register('address.postalCode')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ù…Ø¨Ù†Ù‰' : 'Building Number'}</label>
                    <input {...register('address.buildingNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù‚Ù… Ø§Ù„Ø¥Ø¶Ø§ÙÙŠ' : 'Additional Number'}</label>
                    <input {...register('address.additionalNumber')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø¯ÙˆÙ„Ø©' : 'Country'}</label>
                    <input {...register('address.country')} className="input" placeholder="SA" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email'}</label>
                    <input type="email" {...register('contactEmail')} className="input" />
                  </div>
                  <div>
                    <label className="label">{language === 'ar' ? 'Ø§Ù„Ù‡Ø§ØªÙ' : 'Phone'}</label>
                    <input {...register('contactPhone')} className="input" />
                  </div>
                </div>

                {/* National Address */}
                <div className="pt-6 border-t border-gray-200 dark:border-dark-600">
                  <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    {language === 'ar' ? 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ÙˆØ·Ù†ÙŠ' : 'National Address'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ø¥Ø«Ø¨Ø§Øª' : 'Proof Number'}</label>
                      <input {...register('nationalAddress.proofNumber')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¹Ù…ÙŠÙ„' : 'Customer Account'}</label>
                      <input {...register('nationalAddress.customerAccount')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø£ØµÙ„ÙŠ' : 'Original Date'}</label>
                      <input type="date" {...register('nationalAddress.originalDate')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡' : 'Expiration Date'}</label>
                      <input type="date" {...register('nationalAddress.expirationDate')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³Ø¬ÙŠÙ„' : 'Registration Date'}</label>
                      <input type="date" {...register('nationalAddress.regDate')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ù…Ø®ØªØµØ±' : 'Short Address'}</label>
                      <input {...register('nationalAddress.shortAddress')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ù…Ø¨Ù†Ù‰' : 'Building No'}</label>
                      <input {...register('nationalAddress.buildingNo')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø§Ù„Ø­ÙŠ' : 'Neighborhood'}</label>
                      <input {...register('nationalAddress.neighborhood')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø§Ù„Ù…Ù†Ø·Ù‚Ø©' : 'Region'}</label>
                      <input {...register('nationalAddress.region')} className="input" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{language === 'ar' ? 'Ø±Ø§Ø¨Ø· QR Ù„Ù„ØªØ­Ù‚Ù‚' : 'QR Verification URL'}</label>
                      <input {...register('nationalAddress.qrCodeUrl')} className="input" />
                    </div>
                  </div>
                </div>

                {/* Commercial Registration */}
                <div className="pt-6 border-t border-gray-200 dark:border-dark-600">
                  <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-amber-500" />
                    {language === 'ar' ? 'Ø§Ù„Ø³Ø¬Ù„ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ' : 'Commercial Registration'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø§Ù„Ø±Ù‚Ù… Ø§Ù„ÙˆØ·Ù†ÙŠ Ø§Ù„Ù…ÙˆØ­Ø¯' : 'CR Number'}</label>
                      <input {...register('commercialRegistration.crNumber')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø¥ØµØ¯Ø§Ø±' : 'Issue Date'}</label>
                      <input type="date" {...register('commercialRegistration.issueDate')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ù†ÙˆØ¹ Ø§Ù„ÙƒÙŠØ§Ù† (EN)' : 'Company Type (EN)'}</label>
                      <input {...register('commercialRegistration.companyType')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ù†ÙˆØ¹ Ø§Ù„ÙƒÙŠØ§Ù† (AR)' : 'Company Type (AR)'}</label>
                      <input {...register('commercialRegistration.companyTypeAr')} className="input" dir="rtl" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø­Ø§Ù„Ø© Ø§Ù„Ø³Ø¬Ù„ (EN)' : 'Company Status (EN)'}</label>
                      <input {...register('commercialRegistration.companyStatus')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø­Ø§Ù„Ø© Ø§Ù„Ø³Ø¬Ù„ (AR)' : 'Company Status (AR)'}</label>
                      <input {...register('commercialRegistration.companyStatusAr')} className="input" dir="rtl" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{language === 'ar' ? 'Ø±Ø§Ø¨Ø· QR Ù„Ù„ØªØ­Ù‚Ù‚' : 'QR Verification URL'}</label>
                      <input {...register('commercialRegistration.qrCodeUrl')} className="input" />
                    </div>
                  </div>
                </div>

                {/* VAT Registration Certificate */}
                <div className="pt-6 border-t border-gray-200 dark:border-dark-600">
                  <h4 className="text-md font-semibold mb-4 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-teal-500" />
                    {language === 'ar' ? 'Ø´Ù‡Ø§Ø¯Ø© ØªØ³Ø¬ÙŠÙ„ Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ©' : 'VAT Registration Certificate'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©' : 'Certificate No'}</label>
                      <input {...register('vatCertificate.certificateNo')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„Ø´Ù‡Ø§Ø¯Ø©' : 'Certificate Date'}</label>
                      <input type="date" {...register('vatCertificate.certificateDate')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø§Ù„ÙØ¹Ù‘Ø§Ù„' : 'Effective Registration Date'}</label>
                      <input type="date" {...register('vatCertificate.effectiveDate')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'ØªØ§Ø±ÙŠØ® Ø£ÙˆÙ„ Ø¥Ù‚Ø±Ø§Ø± Ø¶Ø±ÙŠØ¨ÙŠ' : 'First Filing Due Date'}</label>
                      <input type="date" {...register('vatCertificate.firstFilingDueDate')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø§Ù„ÙØªØ±Ø© Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠØ© (EN)' : 'Tax Period (EN)'}</label>
                      <input {...register('vatCertificate.taxPeriod')} className="input" />
                    </div>
                    <div>
                      <label className="label">{language === 'ar' ? 'Ø§Ù„ÙØªØ±Ø© Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠØ© (AR)' : 'Tax Period (AR)'}</label>
                      <input {...register('vatCertificate.taxPeriodAr')} className="input" dir="rtl" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="label">{language === 'ar' ? 'Ø±Ø§Ø¨Ø· QR Ù„Ù„ØªØ­Ù‚Ù‚' : 'QR Verification URL'}</label>
                      <input {...register('vatCertificate.qrCodeUrl')} className="input" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-2"><Image className="w-4 h-4" />{language === 'ar' ? 'Ø´Ø¹Ø§Ø± Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©' : 'Admin Panel Logo'}</label>
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
                          {language === 'ar' ? 'ÙŠØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ø§Ù„Ø´Ø¹Ø§Ø± Ø¹Ù„Ù‰ Ø§Ù„Ø´Ø±ÙŠØ· Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠ ÙˆØªØ±ÙˆÙŠØ³Ø© Ø§Ù„ÙÙˆØ§ØªÙŠØ±' : 'This logo is used in the sidebar and invoice header'}
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
              <h3 className="text-lg font-semibold mb-6">{language === 'ar' ? 'Ø§Ù„ØªÙØ¶ÙŠÙ„Ø§Øª' : 'Preferences'}</h3>
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
                  <label className="label flex items-center gap-2"><FileText className="w-4 h-4" />{language === 'ar' ? 'ØªØµÙ…ÙŠÙ… PDF Ù„Ù„ÙÙˆØ§ØªÙŠØ±' : 'Invoice PDF Design'}</label>
                  <div className="card-glass p-4 mt-2">
                    <div className="mt-3">
                      <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'Ø¹Ø±Ø¶ Ø§Ù„Ø¹Ù…Ù„Ø©' : 'Currency Display'}</label>
                      <select value={invoiceCurrencyDisplay} onChange={(e) => setInvoiceCurrencyDisplay(e.target.value === 'icon' ? 'icon' : 'text')} className="select mt-1 w-full md:w-1/2">
                        <option value="text">{language === 'ar' ? 'Ù†Øµ (SAR)' : 'Text (SAR)'}</option>
                        <option value="icon">{language === 'ar' ? 'Ø±Ù…Ø² Ø§Ù„Ø±ÙŠØ§Ù„ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠ (ï·¼)' : 'Saudi Riyal Icon (ï·¼)'}</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'Ù†Ù…Ø· ØªØ³Ù„Ø³Ù„ Ø§Ù„Ø¥ÙŠØµØ§Ù„Ø§Øª' : 'Receipt Sequence Pattern'}</label>
                        <input value={invoiceSequencePattern} onChange={(e) => setInvoiceSequencePattern(e.target.value)} placeholder="RCPT-{N}" className="input mt-1" />
                        <p className="text-[10px] text-gray-500 mt-1">{language === 'ar' ? 'Ø§Ø³ØªØ®Ø¯Ù… {N} Ù„Ù„Ø±Ù‚Ù… Ø§Ù„Ù…ØªØ³Ù„Ø³Ù„.' : 'Use {N} for sequential number.'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">{language === 'ar' ? 'Ù„ØºØ© ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ù„Ø·Ù„Ø¨Ø§Øª' : 'Orders WhatsApp Language'}</label>
                        <select value={khayyatWhatsappLanguage} onChange={(e) => setKhayyatWhatsappLanguage(e.target.value)} className="select mt-1">
                          <option value="both">{language === 'ar' ? 'Ø¹Ø±Ø¨ÙŠ ÙˆØ¥Ù†Ø¬Ù„ÙŠØ²ÙŠ' : 'Arabic & English'}</option>
                          <option value="ar">{language === 'ar' ? 'Ø¹Ø±Ø¨ÙŠ ÙÙ‚Ø·' : 'Arabic Only'}</option>
                          <option value="en">{language === 'ar' ? 'Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ ÙÙ‚Ø·' : 'English Only'}</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {language === 'ar' ? 'ÙŠØªÙ… ØªØ·Ø¨ÙŠÙ‚ Ù‡Ø°Ø§ Ø§Ù„Ù‚Ø§Ù„Ø¨ Ø¹Ù†Ø¯ ØªØ­Ù…ÙŠÙ„ PDF Ù…Ù† Ø´Ø§Ø´Ø© Ø§Ù„ÙÙˆØ§ØªÙŠØ±.' : 'This template is used when downloading invoice PDFs.'}
                    </p>
                  </div>
                </div>



                <div className="pt-2">
                  <label className="label flex items-center gap-2"><Palette className="w-4 h-4" />{language === 'ar' ? 'Ø£Ù„ÙˆØ§Ù† Ø§Ù„Ø¹Ù„Ø§Ù…Ø©' : 'Brand Colors'}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="card-glass p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'Ø§Ù„Ù„ÙˆÙ† Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ' : 'Primary'}</span>
                        <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-gray-200 dark:border-dark-600 bg-transparent" />
                      </div>
                      <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="input mt-3" />
                    </div>
                    <div className="card-glass p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'Ø§Ù„Ù„ÙˆÙ† Ø§Ù„Ø«Ø§Ù†ÙˆÙŠ' : 'Secondary'}</span>
                        <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-9 w-12 rounded-lg border border-gray-200 dark:border-dark-600 bg-transparent" />
                      </div>
                      <input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="input mt-3" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label flex items-center gap-2"><Palette className="w-4 h-4" />{language === 'ar' ? 'Ù†Ù…Ø· Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©' : 'UI Style'}</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="card-glass p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{language === 'ar' ? 'Ø§Ù„Ù‡ÙŠØ¯Ø±' : 'Header'}</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setHeaderStyle('glass')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${headerStyle === 'glass' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'Ø²Ø¬Ø§Ø¬ÙŠ' : 'Glass'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHeaderStyle('solid')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${headerStyle === 'solid' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'ØµÙ„Ø¨' : 'Solid'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="card-glass p-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{language === 'ar' ? 'Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø¬Ø§Ù†Ø¨ÙŠØ©' : 'Sidebar'}</p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setSidebarStyle('solid')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${sidebarStyle === 'solid' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'ØµÙ„Ø¨' : 'Solid'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSidebarStyle('glass')}
                          className={`flex-1 p-3 rounded-xl border-2 transition-all ${sidebarStyle === 'glass' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-dark-600'}`}
                        >
                          <span className="font-medium">{language === 'ar' ? 'Ø²Ø¬Ø§Ø¬ÙŠ' : 'Glass'}</span>
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
                        invoiceSequencePattern,
                        khayyat: {
                          ...(tenant?.settings?.khayyat || {}),
                          whatsappLanguage: khayyatWhatsappLanguage,
                        },
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
                          vision2030Logo: vision2030LogoDataUrl || tenant?.settings?.invoiceBranding?.vision2030Logo || '/saudi-vision-2030-logo.webp',
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
              onSave={(hardwareSettings, thermalPrinter) =>
                updateMutation.mutate({ settings: { hardwareSettings, thermalPrinter } })
              }
              isSaving={updateMutation.isPending}
            />
          )}

          {activeTab === 'carRentalApis' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <CarRentalApiSettings tenant={tenant} isAr={language === 'ar'} />
            </motion.div>
          )}

          {activeTab === 'restaurant' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 space-y-8">
              {/* Auto Open/Close */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  {language === 'ar' ? 'Ø§Ù„ÙØªØ­ ÙˆØ§Ù„Ø¥ØºÙ„Ø§Ù‚ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ' : 'Auto Open / Close'}
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={restAutoStatus}
                      onChange={(e) => setRestAutoStatus(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {language === 'ar' ? 'ØªÙØ¹ÙŠÙ„ Ø§Ù„ØªØ­Ø¯ÙŠØ« Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ù„Ù„Ø­Ø§Ù„Ø© (Ù…ÙØªÙˆØ­/Ù…ØºÙ„Ù‚)' : 'Enable automatic status update (Open/Closed)'}
                    </span>
                  </label>
                  {restAutoStatus && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-8">
                      <div>
                        <label className="label text-sm">{language === 'ar' ? 'ÙˆÙ‚Øª Ø§Ù„ÙØªØ­' : 'Opening Time'}</label>
                        <input type="time" value={restOpenTime} onChange={(e) => setRestOpenTime(e.target.value)} className="input" />
                      </div>
                      <div>
                        <label className="label text-sm">{language === 'ar' ? 'ÙˆÙ‚Øª Ø§Ù„Ø¥ØºÙ„Ø§Ù‚' : 'Closing Time'}</label>
                        <input type="time" value={restCloseTime} onChange={(e) => setRestCloseTime(e.target.value)} className="input" />
                      </div>
                      <label className="flex items-center gap-3 sm:col-span-2">
                        <input
                          type="checkbox"
                          checked={restNotify}
                          onChange={(e) => setRestNotify(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {language === 'ar' ? 'Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø± Ø¹Ù†Ø¯ ØªØºÙŠÙŠØ± Ø§Ù„Ø­Ø§Ù„Ø©' : 'Send notification on status change'}
                        </span>
                      </label>
                      {restNotify && (
                        <div className="sm:col-span-2">
                          <label className="label text-sm">{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù„Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª' : 'Notification Phone'}</label>
                          <input
                            type="tel"
                            value={restNotifyPhone}
                            onChange={(e) => setRestNotifyPhone(e.target.value)}
                            placeholder={language === 'ar' ? 'Ù…Ø«Ø§Ù„: 9665XXXXXXXX' : 'e.g. 9665XXXXXXXX'}
                            className="input"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp Auto-Send */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                  {language === 'ar' ? 'Ø¥Ø±Ø³Ø§Ù„ ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ' : 'WhatsApp Auto-Send'}
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-dark-700">
                    <span className="font-medium text-sm">{language === 'ar' ? 'ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ' : 'Enable Auto-Send'}</span>
                    <input type="checkbox" checked={waAutoSend} onChange={(e) => setWaAutoSend(e.target.checked)} className="h-4 w-4 rounded" />
                  </label>

                  {waAutoSend && (
                    <div className="space-y-3 pl-4 border-s-2 border-green-200 dark:border-green-900">
                      <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-dark-800">
                        <span className="text-sm">{language === 'ar' ? 'Ø¥Ø±Ø³Ø§Ù„ Ø¹Ù†Ø¯ ÙØªØ­ Ø§Ù„Ù…Ø·Ø¹Ù…' : 'Send on Restaurant Open'}</span>
                        <input type="checkbox" checked={waOnOpen} onChange={(e) => setWaOnOpen(e.target.checked)} className="h-4 w-4 rounded" />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-dark-800">
                        <span className="text-sm">{language === 'ar' ? 'Ø¥Ø±Ø³Ø§Ù„ Ø¹Ù†Ø¯ Ø¥Ù†Ø´Ø§Ø¡ Ø·Ù„Ø¨' : 'Send on Order Placed'}</span>
                        <input type="checkbox" checked={waOnOrderPlaced} onChange={(e) => setWaOnOrderPlaced(e.target.checked)} className="h-4 w-4 rounded" />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-dark-800">
                        <span className="text-sm">{language === 'ar' ? 'Ø¥Ø±Ø³Ø§Ù„ Ø¹Ù†Ø¯ Ø¬Ø§Ù‡Ø²ÙŠØ© Ø§Ù„Ø·Ù„Ø¨' : 'Send on Order Ready'}</span>
                        <input type="checkbox" checked={waOnOrderReady} onChange={(e) => setWaOnOrderReady(e.target.checked)} className="h-4 w-4 rounded" />
                      </label>
                      <label className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-dark-800">
                        <span className="text-sm">{language === 'ar' ? 'Ø¥Ø±Ø³Ø§Ù„ Ø¹Ù†Ø¯ ØªÙ‚Ø¯ÙŠÙ… Ø§Ù„Ø·Ù„Ø¨' : 'Send on Order Served'}</span>
                        <input type="checkbox" checked={waOnOrderServed} onChange={(e) => setWaOnOrderServed(e.target.checked)} className="h-4 w-4 rounded" />
                      </label>

                      {waOnOpen && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„ÙØªØ­ (EN)' : 'Open Message (EN)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOpenMsgEn} onChange={(e) => setWaOpenMsgEn(e.target.value)} />
                          </div>
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„ÙØªØ­ (AR)' : 'Open Message (AR)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOpenMsgAr} onChange={(e) => setWaOpenMsgAr(e.target.value)} dir="rtl" />
                          </div>
                        </div>
                      )}

                      {waOnOrderPlaced && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨ (EN)' : 'Order Placed (EN)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOrderPlacedMsgEn} onChange={(e) => setWaOrderPlacedMsgEn(e.target.value)} />
                          </div>
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø·Ù„Ø¨ (AR)' : 'Order Placed (AR)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOrderPlacedMsgAr} onChange={(e) => setWaOrderPlacedMsgAr(e.target.value)} dir="rtl" />
                          </div>
                        </div>
                      )}

                      {waOnOrderReady && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø¬Ø§Ù‡Ø²ÙŠØ© (EN)' : 'Order Ready (EN)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOrderReadyMsgEn} onChange={(e) => setWaOrderReadyMsgEn(e.target.value)} />
                          </div>
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„Ø¬Ø§Ù‡Ø²ÙŠØ© (AR)' : 'Order Ready (AR)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOrderReadyMsgAr} onChange={(e) => setWaOrderReadyMsgAr(e.target.value)} dir="rtl" />
                          </div>
                        </div>
                      )}

                      {waOnOrderServed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… (EN)' : 'Order Served (EN)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOrderServedMsgEn} onChange={(e) => setWaOrderServedMsgEn(e.target.value)} />
                          </div>
                          <div>
                            <label className="label text-xs">{language === 'ar' ? 'Ø±Ø³Ø§Ù„Ø© Ø§Ù„ØªÙ‚Ø¯ÙŠÙ… (AR)' : 'Order Served (AR)'}</label>
                            <textarea className="input text-sm" rows={2} value={waOrderServedMsgAr} onChange={(e) => setWaOrderServedMsgAr(e.target.value)} dir="rtl" />
                          </div>
                        </div>
                      )}

                      {waOnOpen && (
                        <div>
                          <label className="label text-xs">{language === 'ar' ? 'Ø£Ø±Ù‚Ø§Ù… Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± (Ù…ÙØµÙˆÙ„Ø© Ø¨ÙÙˆØ§ØµÙ„)' : 'Notification Phones (comma-separated)'}</label>
                          <input className="input text-sm" value={waNotifyPhones} onChange={(e) => setWaNotifyPhones(e.target.value)} placeholder="+9665xxxxxxxx, +9665yyyyyyyy" />
                          <p className="text-xs text-gray-400 mt-1">{language === 'ar' ? 'Ø³ÙŠØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø© Ø§Ù„ÙØªØ­ Ù„Ù‡Ø°Ù‡ Ø§Ù„Ø£Ø±Ù‚Ø§Ù… ÙŠÙˆÙ…ÙŠØ§Ù‹' : 'Open notification will be sent to these numbers daily'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Printers */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Printer className="w-5 h-5 text-primary-500" />
                  {language === 'ar' ? 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø·Ø§Ø¨Ø¹Ø§Øª' : 'Printer Settings'}
                </h3>
                <div className="space-y-4">
                  {(restPrinters || []).map((printer, idx) => (
                    <div key={idx} className="border rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-dark-800">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">{language === 'ar' ? `Ø§Ù„Ø·Ø§Ø¨Ø¹Ø© ${idx + 1}` : `Printer ${idx + 1}`}</span>
                        <button
                          onClick={() => setRestPrinters(prev => prev.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          {language === 'ar' ? 'Ø­Ø°Ù' : 'Remove'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          value={printer.name || ''}
                          onChange={(e) => {
                            const next = [...restPrinters]
                            next[idx] = { ...next[idx], name: e.target.value }
                            setRestPrinters(next)
                          }}
                          placeholder={language === 'ar' ? 'Ø§Ø³Ù… Ø§Ù„Ø·Ø§Ø¨Ø¹Ø©' : 'Printer Name'}
                          className="input text-sm"
                        />
                        <select
                          value={printer.role || 'kitchen'}
                          onChange={(e) => {
                            const next = [...restPrinters]
                            next[idx] = { ...next[idx], role: e.target.value }
                            setRestPrinters(next)
                          }}
                          className="input text-sm"
                        >
                          <option value="kitchen">{language === 'ar' ? 'Ù…Ø·Ø¨Ø®' : 'Kitchen'}</option>
                          <option value="receipt">{language === 'ar' ? 'ÙØ§ØªÙˆØ±Ø©' : 'Receipt'}</option>
                        </select>
                        <select
                          value={printer.type || 'network'}
                          onChange={(e) => {
                            const next = [...restPrinters]
                            next[idx] = { ...next[idx], type: e.target.value }
                            setRestPrinters(next)
                          }}
                          className="input text-sm"
                        >
                          <option value="network">{language === 'ar' ? 'Ø´Ø¨ÙƒØ© (IP)' : 'Network (IP)'}</option>
                          <option value="usb">USB</option>
                          <option value="bluetooth">Bluetooth</option>
                        </select>
                        <input
                          value={printer.ipAddress || ''}
                          onChange={(e) => {
                            const next = [...restPrinters]
                            next[idx] = { ...next[idx], ipAddress: e.target.value }
                            setRestPrinters(next)
                          }}
                          placeholder={language === 'ar' ? 'Ø¹Ù†ÙˆØ§Ù† IP' : 'IP Address'}
                          className="input text-sm"
                        />
                        <input
                          type="number"
                          value={printer.port || 9100}
                          onChange={(e) => {
                            const next = [...restPrinters]
                            next[idx] = { ...next[idx], port: Number(e.target.value) }
                            setRestPrinters(next)
                          }}
                          placeholder="Port"
                          className="input text-sm"
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={printer.enabled || false}
                            onChange={(e) => {
                              const next = [...restPrinters]
                              next[idx] = { ...next[idx], enabled: e.target.checked }
                              setRestPrinters(next)
                            }}
                            className="rounded"
                          />
                          {language === 'ar' ? 'Ù…ÙØ¹Ù‘Ù„Ø©' : 'Enabled'}
                        </label>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setRestPrinters([...restPrinters, { name: '', role: 'kitchen', type: 'network', ipAddress: '', port: 9100, enabled: false, paperWidth: 80 }])}
                    className="btn btn-outline text-sm w-full"
                  >
                    + {language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ø·Ø§Ø¨Ø¹Ø©' : 'Add Printer'}
                  </button>
                </div>
              </div>

              {/* Save */}
              <div className="pt-4 border-t">
                <button
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate({
                    settings: {
                      ...(tenant?.settings || {}),
                      restaurant: {
                        ...(tenant?.settings?.restaurant || {}),
                        autoStatusUpdate: restAutoStatus,
                        openingTime: restOpenTime,
                        closingTime: restCloseTime,
                        notifyOnStatusChange: restNotify,
                        statusNotificationPhone: restNotifyPhone,
                        printers: restPrinters,
                        whatsapp: {
                          autoSendEnabled: waAutoSend,
                          autoSendOnOpen: waOnOpen,
                          autoSendOnOrderPlaced: waOnOrderPlaced,
                          autoSendOnOrderReady: waOnOrderReady,
                          autoSendOnOrderServed: waOnOrderServed,
                          openMessageEn: waOpenMsgEn,
                          openMessageAr: waOpenMsgAr,
                          orderPlacedMessageEn: waOrderPlacedMsgEn,
                          orderPlacedMessageAr: waOrderPlacedMsgAr,
                          orderReadyMessageEn: waOrderReadyMsgEn,
                          orderReadyMessageAr: waOrderReadyMsgAr,
                          orderServedMessageEn: waOrderServedMsgEn,
                          orderServedMessageAr: waOrderServedMsgAr,
                          notifyPhoneList: waNotifyPhones.split(',').map(p => p.trim()).filter(Boolean),
                        },
                      },
                    },
                  })}
                  className="btn btn-primary"
                >
                  {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> {t('save')}</>}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'bakala' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">{language === 'ar' ? 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¨Ù‚Ø§Ù„Ø©' : 'Bakala Settings'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {language === 'ar' ? 'Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ù†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹ ÙˆØ§Ù„ÙˆØ±Ø¯ÙŠØ§Øª' : 'Manage POS and shift settings'}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'Ø§Ø´ØªØ±Ø§Ø· ÙØªØ­ Ø§Ù„ÙˆØ±Ø¯ÙŠØ©' : 'Require Shift Open'}</p>
                    <p className="text-sm text-gray-500">
                      {language === 'ar'
                        ? 'Ø¹Ù†Ø¯ Ø§Ù„ØªÙØ¹ÙŠÙ„ØŒ ÙŠØ¬Ø¨ ÙØªØ­ Ø§Ù„ÙˆØ±Ø¯ÙŠØ© Ù‚Ø¨Ù„ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹'
                        : 'When enabled, a shift must be opened before using the POS'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bakalaRequireShift}
                      onChange={(e) => setBakalaRequireShift(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      settings: {
                        bakala: {
                          requireShift: bakalaRequireShift,
                        },
                      },
                    })
                  }
                  className="btn btn-primary"
                >
                  {updateMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> {t('save')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'bookstore' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">{language === 'ar' ? 'Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…ÙƒØªØ¨Ø©' : 'Bookstore Settings'}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {language === 'ar' ? 'Ø¥Ø¯Ø§Ø±Ø© Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ù†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹ ÙˆØ§Ù„ÙˆØ±Ø¯ÙŠØ§Øª ÙÙŠ Ø§Ù„Ù…ÙƒØªØ¨Ø©' : 'Manage bookstore POS and shift settings'}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700/50 rounded-xl">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'Ø§Ø´ØªØ±Ø§Ø· ÙØªØ­ Ø§Ù„ÙˆØ±Ø¯ÙŠØ©' : 'Require Shift Open'}</p>
                    <p className="text-sm text-gray-500">
                      {language === 'ar'
                        ? 'Ø¹Ù†Ø¯ Ø§Ù„ØªÙØ¹ÙŠÙ„ØŒ ÙŠØ¬Ø¨ ÙØªØ­ Ø§Ù„ÙˆØ±Ø¯ÙŠØ© Ù‚Ø¨Ù„ Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹ ÙÙŠ Ø§Ù„Ù…ÙƒØªØ¨Ø©'
                        : 'When enabled, a shift must be opened before using the bookstore POS'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bookstoreRequireShift}
                      onChange={(e) => setBookstoreRequireShift(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600" />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      settings: {
                        bookstore: {
                          requireShift: bookstoreRequireShift,
                        },
                      },
                    })
                  }
                  className="btn btn-primary"
                >
                  {updateMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" /> {t('save')}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'backup' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <h3 className="text-lg font-semibold mb-2">{language === 'ar' ? 'Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ' : 'Backup'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? 'Ù‚Ù… Ø¨ØªÙ†Ø²ÙŠÙ„ Ù†Ø³Ø®Ø© Ø§Ø­ØªÙŠØ§Ø·ÙŠØ© ÙƒØ§Ù…Ù„Ø© Ù…Ù† Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ£Ø¬Ø±. Ù‚Ø¯ ÙŠØ³ØªØºØ±Ù‚ Ø§Ù„ØªØ­Ù…ÙŠÙ„ ÙˆÙ‚ØªØ§Ù‹ Ø­Ø³Ø¨ Ø­Ø¬Ù… Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.'
                  : 'Download a full tenant backup. Download time depends on dataset size.'}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <button onClick={downloadBackup} disabled={downloadingBackup} className="btn btn-primary">
                  {downloadingBackup ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {language === 'ar' ? 'ØªÙ†Ø²ÙŠÙ„ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠØ©' : 'Download Backup'}
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
