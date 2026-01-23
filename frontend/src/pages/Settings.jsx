import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Building2, Shield, Globe, Palette, Bell, Save, Key, CheckCircle, Image, Database, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import { setLanguage, setTheme } from '../store/slices/uiSlice'
import { updateTenant } from '../store/slices/authSlice'
import { useLiveTranslation } from '../lib/liveTranslation'

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
  }, [tenant])

  const { data: zatcaStatus } = useQuery({
    queryKey: ['zatca-status'],
    queryFn: () => api.get('/tenants/zatca/status').then(res => res.data)
  })

  const { register, handleSubmit, reset, watch, setValue } = useForm()

  useEffect(() => {
    if (!tenant) return
    reset({
      legalNameEn: tenant.business?.legalNameEn || '',
      legalNameAr: tenant.business?.legalNameAr || '',
      vatNumber: tenant.business?.vatNumber || '',
      crNumber: tenant.business?.crNumber || '',
      address: {
        city: tenant.business?.address?.city || '',
        district: tenant.business?.address?.district || ''
      },
      contactEmail: tenant.business?.contactEmail || '',
      contactPhone: tenant.business?.contactPhone || ''
    })
  }, [tenant, reset])

  useLiveTranslation({
    watch,
    setValue,
    sourceField: 'legalNameEn',
    targetField: 'legalNameAr',
    sourceLang: 'en',
    targetLang: 'ar'
  })

  useLiveTranslation({
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

  const handleLogoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setLogoDataUrl(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const generateKeysMutation = useMutation({
    mutationFn: () => api.post('/tenants/zatca/generate-keys'),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إنشاء المفاتيح' : 'Keys generated')
      queryClient.invalidateQueries(['zatca-status'])
    }
  })

  const tabs = [
    { id: 'company', label: t('companySettings'), icon: Building2 },
    { id: 'zatca', label: t('zatcaSettings'), icon: Shield },
    { id: 'preferences', label: language === 'ar' ? 'التفضيلات' : 'Preferences', icon: Palette },
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
              <form onSubmit={handleSubmit((data) => updateMutation.mutate({ business: data }))} className="space-y-4">
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
                    <label className="label">{language === 'ar' ? 'الحي' : 'District'}</label>
                    <input {...register('address.district')} className="input" />
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
                <div className="flex justify-end pt-4">
                  <button type="submit" disabled={updateMutation.isPending} className="btn btn-primary">
                    {updateMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{t('save')}</>}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeTab === 'zatca' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Phase Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phase 1 Card */}
                <div className="card p-6 border-2 border-green-500 bg-green-50/50 dark:bg-green-900/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="text-xl font-bold text-green-600">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{language === 'ar' ? 'المرحلة الأولى' : 'Phase 1'}</h4>
                        <p className="text-xs text-gray-500">{language === 'ar' ? 'مرحلة الإنشاء' : 'Generation Phase'}</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle className="w-3 h-3 inline me-1" />{language === 'ar' ? 'مُفعّل' : 'Active'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ar' 
                      ? 'إنشاء الفواتير بصيغة XML مع QR Code والتخزين المحلي'
                      : 'Generate invoices in XML format with QR Code and local storage'}
                  </p>
                </div>

                {/* Phase 2 Card */}
                <div className={`card p-6 border-2 ${zatcaStatus?.isOnboarded ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10' : 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${zatcaStatus?.isOnboarded ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                        <span className={`text-xl font-bold ${zatcaStatus?.isOnboarded ? 'text-green-600' : 'text-amber-600'}`}>2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{language === 'ar' ? 'المرحلة الثانية' : 'Phase 2'}</h4>
                        <p className="text-xs text-gray-500">{language === 'ar' ? 'مرحلة الربط والتكامل' : 'Integration Phase'}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${zatcaStatus?.isOnboarded ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                      {zatcaStatus?.isOnboarded ? <><CheckCircle className="w-3 h-3 inline me-1" />{language === 'ar' ? 'مُفعّل' : 'Active'}</> : (language === 'ar' ? 'يتطلب التفعيل' : 'Requires Setup')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ar' 
                      ? 'إرسال الفواتير لهيئة الزكاة للاعتماد والمصادقة'
                      : 'Submit invoices to ZATCA for clearance and reporting'}
                  </p>
                </div>
              </div>

              {/* Phase Documentation */}
              <div className="card p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-500" />
                  {language === 'ar' ? 'دليل مراحل الفوترة الإلكترونية' : 'E-Invoicing Phases Guide'}
                </h4>
                
                <div className="space-y-6">
                  {/* Phase 1 Documentation */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                      {language === 'ar' ? 'المرحلة الأولى - مرحلة الإنشاء (Generation Phase)' : 'Phase 1 - Generation Phase'}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'متى تُطبق:' : 'When Required:'}</p>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li>• {language === 'ar' ? 'جميع المنشآت المسجلة في ضريبة القيمة المضافة' : 'All VAT-registered businesses'}</li>
                          <li>• {language === 'ar' ? 'بدأت في 4 ديسمبر 2021' : 'Started December 4, 2021'}</li>
                          <li>• {language === 'ar' ? 'إلزامية لجميع الفواتير الضريبية' : 'Mandatory for all tax invoices'}</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'المتطلبات:' : 'Requirements:'}</p>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li>• {language === 'ar' ? 'إنشاء الفواتير بصيغة XML' : 'Generate invoices in XML format'}</li>
                          <li>• {language === 'ar' ? 'رمز QR يحتوي على البيانات الأساسية' : 'QR code with essential data'}</li>
                          <li>• {language === 'ar' ? 'UUID فريد لكل فاتورة' : 'Unique UUID for each invoice'}</li>
                          <li>• {language === 'ar' ? 'التخزين الإلكتروني المحلي' : 'Local electronic storage'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Phase 2 Documentation */}
                  <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-xl">
                    <h5 className="font-semibold text-violet-800 dark:text-violet-300 mb-3">
                      {language === 'ar' ? 'المرحلة الثانية - مرحلة الربط والتكامل (Integration Phase)' : 'Phase 2 - Integration Phase'}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'متى تُطبق:' : 'When Required:'}</p>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li>• {language === 'ar' ? 'بدأت في 1 يناير 2023 على مراحل' : 'Started January 1, 2023 in waves'}</li>
                          <li>• {language === 'ar' ? 'المنشآت بإيرادات > 3 مليار ريال (الموجة 1)' : 'Businesses with revenue > 3B SAR (Wave 1)'}</li>
                          <li>• {language === 'ar' ? 'المنشآت بإيرادات > 500 مليون ريال (الموجة 2)' : 'Businesses with revenue > 500M SAR (Wave 2)'}</li>
                          <li>• {language === 'ar' ? 'المنشآت بإيرادات > 250 مليون ريال (الموجة 3)' : 'Businesses with revenue > 250M SAR (Wave 3)'}</li>
                          <li>• {language === 'ar' ? 'يتم إضافة موجات جديدة تدريجياً' : 'New waves added progressively'}</li>
                        </ul>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">{language === 'ar' ? 'المتطلبات الإضافية:' : 'Additional Requirements:'}</p>
                        <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                          <li>• {language === 'ar' ? 'التوقيع الرقمي للفواتير' : 'Digital signature for invoices'}</li>
                          <li>• {language === 'ar' ? 'الربط المباشر مع منصة فاتورة' : 'Direct integration with Fatoora platform'}</li>
                          <li>• {language === 'ar' ? 'اعتماد الفواتير قبل الإصدار (B2B)' : 'Clearance before issuance (B2B)'}</li>
                          <li>• {language === 'ar' ? 'الإبلاغ خلال 24 ساعة (B2C)' : 'Reporting within 24 hours (B2C)'}</li>
                          <li>• {language === 'ar' ? 'ختم التشفير (CSID)' : 'Cryptographic Stamp (CSID)'}</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Types */}
                  <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      {language === 'ar' ? 'أنواع الفواتير' : 'Invoice Types'}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-white dark:bg-dark-600 rounded-lg">
                        <p className="font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'فاتورة ضريبية (B2B)' : 'Standard Tax Invoice (B2B)'}</p>
                        <p className="text-gray-500 mt-1">{language === 'ar' ? 'تتطلب الاعتماد (Clearance) من هيئة الزكاة قبل إرسالها للعميل' : 'Requires Clearance from ZATCA before sending to customer'}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-dark-600 rounded-lg">
                        <p className="font-medium text-gray-700 dark:text-gray-300">{language === 'ar' ? 'فاتورة ضريبية مبسطة (B2C)' : 'Simplified Tax Invoice (B2C)'}</p>
                        <p className="text-gray-500 mt-1">{language === 'ar' ? 'تتطلب الإبلاغ (Reporting) لهيئة الزكاة خلال 24 ساعة' : 'Requires Reporting to ZATCA within 24 hours'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase 2 Integration Status */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${zatcaStatus?.isOnboarded ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                      <Shield className={`w-6 h-6 ${zatcaStatus?.isOnboarded ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{language === 'ar' ? 'حالة ربط المرحلة الثانية' : 'Phase 2 Integration Status'}</h4>
                      <p className="text-sm text-gray-500">{language === 'ar' ? 'الربط مع منصة فاتورة' : 'Fatoora Platform Connection'}</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${zatcaStatus?.isOnboarded ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {zatcaStatus?.isOnboarded ? <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4" />{language === 'ar' ? 'مُتصل' : 'Connected'}</span> : (language === 'ar' ? 'غير مُتصل' : 'Not Connected')}
                  </span>
                </div>

                {zatcaStatus?.isOnboarded ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">{language === 'ar' ? 'تاريخ التفعيل' : 'Onboarded At'}</p>
                        <p className="text-lg font-semibold">{new Date(zatcaStatus.onboardedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">{language === 'ar' ? 'عداد الفواتير' : 'Invoice Counter'}</p>
                        <p className="text-lg font-semibold">{zatcaStatus.invoiceCounter || 0}</p>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-dark-700 rounded-xl">
                        <p className="text-sm text-gray-500 mb-1">{language === 'ar' ? 'رقم الجهاز' : 'Device Serial'}</p>
                        <p className="text-sm font-mono font-semibold truncate">{zatcaStatus.deviceSerialNumber}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs">{language === 'ar' ? 'التوقيع الرقمي' : 'Digital Signing'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs">{language === 'ar' ? 'رمز QR' : 'QR Code'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs">{language === 'ar' ? 'الاعتماد' : 'Clearance'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-xs">{language === 'ar' ? 'الإبلاغ' : 'Reporting'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Onboarding Steps */}
                    <div className="flex gap-4 items-start">
                      <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">1</div>
                      <div className="flex-1">
                        <h5 className="font-medium">{language === 'ar' ? 'إنشاء مفاتيح التشفير' : 'Generate Cryptographic Keys'}</h5>
                        <p className="text-sm text-gray-500 mt-1 mb-2">{language === 'ar' ? 'إنشاء زوج المفاتيح للتوقيع الرقمي' : 'Create key pair for digital signing'}</p>
                        <button onClick={() => generateKeysMutation.mutate()} disabled={generateKeysMutation.isPending} className="btn btn-primary btn-sm">
                          {generateKeysMutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Key className="w-4 h-4" />{language === 'ar' ? 'إنشاء المفاتيح' : 'Generate Keys'}</>}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start opacity-50">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-600 text-gray-500 flex items-center justify-center font-semibold text-sm flex-shrink-0">2</div>
                      <div>
                        <h5 className="font-medium">{language === 'ar' ? 'طلب OTP من بوابة فاتورة' : 'Request OTP from Fatoora Portal'}</h5>
                        <p className="text-sm text-gray-400 mt-1">{language === 'ar' ? 'سجّل دخولك على zatca.gov.sa واحصل على رمز OTP' : 'Login to zatca.gov.sa and get your OTP code'}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start opacity-50">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-dark-600 text-gray-500 flex items-center justify-center font-semibold text-sm flex-shrink-0">3</div>
                      <div>
                        <h5 className="font-medium">{language === 'ar' ? 'إكمال التسجيل وتفعيل CSID' : 'Complete Registration & Activate CSID'}</h5>
                        <p className="text-sm text-gray-400 mt-1">{language === 'ar' ? 'أدخل رمز OTP للحصول على ختم التشفير' : 'Enter OTP to obtain Cryptographic Stamp ID'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements */}
              <div className="card p-6 border-l-4 border-l-primary-500">
                <h4 className="font-semibold mb-4">{language === 'ar' ? 'متطلبات التسجيل في المرحلة الثانية' : 'Phase 2 Registration Requirements'}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{language === 'ar' ? 'رقم ضريبي صالح مسجل في هيئة الزكاة' : 'Valid VAT number registered with ZATCA'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{language === 'ar' ? 'سجل تجاري ساري المفعول' : 'Active Commercial Registration (CR)'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{language === 'ar' ? 'حساب مُفعّل على بوابة فاتورة' : 'Active Fatoora portal account'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>{language === 'ar' ? 'نظام فوترة متوافق مع المتطلبات' : 'Compliant invoicing system'}</span>
                  </div>
                </div>
              </div>
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

                <div>
                  <label className="label flex items-center gap-2"><Image className="w-4 h-4" />{language === 'ar' ? 'الشعار' : 'Logo'}</label>
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
                          {language === 'ar' ? 'يتم حفظ الشعار داخل بيانات الشركة' : 'Logo is stored in the tenant branding settings'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={updateMutation.isPending}
                    onClick={() => updateMutation.mutate({
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
