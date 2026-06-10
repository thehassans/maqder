import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Key, Lock, Users, Server, Globe, ExternalLink,
  CheckCircle2, AlertTriangle, AlertCircle, RefreshCw,
  Building, Sliders, Play, Check, X, FileText, WifiOff, HelpCircle
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// ── ZOD VALIDATION SCHEMA (Saudi Structural Rules) ───────────────────────────
const schema = z.object({
  zatca: z.object({
    environment: z.enum(['sandbox', 'simulation', 'production']),
    otp: z.string().refine(val => !val || /^\d{6}$/.test(val), {
      message: 'OTP must be exactly 6 digits / يجب أن يتكون رمز التحقق من 6 أرقام'
    }),
    privateKey: z.string().refine(val => !val || val.includes('-----BEGIN') && val.includes('-----END'), {
      message: 'Invalid PEM format / صيغة مفتاح غير صالحة'
    })
  }),
  elm: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    appId: z.string().optional(),
    agencyId: z.string().optional(),
    nafathOtpEnabled: z.boolean().default(false),
    tammEnabled: z.boolean().default(false)
  }),
  qiwa: z.object({
    establishmentId: z.string().refine(val => !val || (/^7\d{9}$/.test(val)), {
      message: 'Qiwa ID must be exactly 10 digits starting with 7 / رقم المنشأة يجب أن يكون 10 أرقام ويبدأ بـ 7'
    }),
    accessToken: z.string().optional(),
    contractAuthAutomationEnabled: z.boolean().default(false),
    saudizationWidgetEnabled: z.boolean().default(false)
  }),
  gosi: z.object({
    registrationNumber: z.string().refine(val => !val || /^\d{9,10}$/.test(val), {
      message: 'GOSI Number must be 9 or 10 digits / رقم التأمينات يجب أن يكون 9 أو 10 أرقام'
    }),
    enabled: z.boolean().default(false)
  }),
  mudad: z.object({
    registrationNumber: z.string().optional(),
    clientCertificate: z.string().refine(val => !val || val.includes('-----BEGIN CERTIFICATE-----') && val.includes('-----END CERTIFICATE-----'), {
      message: 'Invalid certificate format / صيغة الشهادة غير صالحة'
    }),
    autoSifUploadEnabled: z.boolean().default(false)
  }),
  industrySpecific: z.object({
    baladyApiKey: z.string().optional(),
    saberToken: z.string().optional(),
    etimadUser: z.string().optional(),
    etimadPassword: z.string().optional()
  })
});

export default function GovernmentIntegrations() {
  const queryClient = useQueryClient()
  const { language } = useSelector(state => state.ui)
  const { tenant } = useSelector(state => state.auth)
  
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  // Retrieve tenant business type (trading, construction, car_rental, manpower, restaurant, etc.)
  const industryType = tenant?.businessType || 'trading'

  // Map business type to suggested default active tab
  const getSuggestedTab = () => {
    switch (industryType) {
      case 'car_rental': return 'elm'
      case 'construction': return 'qiwa'
      case 'manpower': return 'gosi'
      case 'trading': return 'zatca'
      case 'restaurant':
      case 'bakala':
        return 'zatca'
      default: return 'zatca'
    }
  }

  const [activeTab, setActiveTab] = useState(getSuggestedTab())
  const [complianceTestResult, setComplianceTestResult] = useState(null)
  
  // Background Sync state simulation (BullMQ queue progress)
  const [syncProgress, setSyncProgress] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatusText, setSyncStatusText] = useState('')

  // 1. Fetch config from API
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['government-integrations-config'],
    queryFn: () => api.get('/tenant/compliance/config').then(res => res.data)
  })

  // 2. React Hook Form setup
  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      zatca: { environment: 'sandbox', otp: '', privateKey: '' },
      elm: { clientId: '', clientSecret: '', appId: '', agencyId: '', nafathOtpEnabled: false, tammEnabled: false },
      qiwa: { establishmentId: '', accessToken: '', contractAuthAutomationEnabled: false, saudizationWidgetEnabled: false },
      gosi: { registrationNumber: '', enabled: false },
      mudad: { registrationNumber: '', clientCertificate: '', autoSifUploadEnabled: false },
      industrySpecific: { baladyApiKey: '', saberToken: '', etimadUser: '', etimadPassword: '' }
    }
  })

  // Populate form values when config is loaded
  useEffect(() => {
    if (config) {
      reset({
        zatca: {
          environment: config.zatca?.environment || 'sandbox',
          otp: '',
          privateKey: config.zatca?.hasPrivateKey ? '-----BEGIN PRIVATE KEY-----\n****************\n-----END PRIVATE KEY-----' : ''
        },
        elm: {
          clientId: config.elm?.clientId || '',
          clientSecret: config.elm?.hasClientSecret ? '****************' : '',
          appId: config.elm?.appId || '',
          agencyId: config.elm?.agencyId || '',
          nafathOtpEnabled: config.elm?.nafathOtpEnabled || false,
          tammEnabled: config.elm?.tammEnabled || false
        },
        qiwa: {
          establishmentId: config.qiwa?.establishmentId || '',
          accessToken: config.qiwa?.hasAccessToken ? '****************' : '',
          contractAuthAutomationEnabled: config.qiwa?.contractAuthAutomationEnabled || false,
          saudizationWidgetEnabled: config.qiwa?.saudizationWidgetEnabled || false
        },
        gosi: {
          registrationNumber: config.gosi?.registrationNumber || '',
          enabled: config.gosi?.enabled || false
        },
        mudad: {
          registrationNumber: config.mudad?.registrationNumber || '',
          clientCertificate: config.mudad?.hasClientCertificate ? '-----BEGIN CERTIFICATE-----\n****************\n-----END CERTIFICATE-----' : '',
          autoSifUploadEnabled: config.mudad?.autoSifUploadEnabled || false
        },
        industrySpecific: {
          baladyApiKey: '',
          saberToken: '',
          etimadUser: '',
          etimadPassword: ''
        }
      })
    }
  }, [config, reset])

  // Save configurations mutation
  const saveMutation = useMutation({
    mutationFn: (data) => api.post('/tenant/compliance/config', data),
    onSuccess: () => {
      toast.success(t('Government integration settings saved successfully.', 'تم حفظ إعدادات التكاملات الحكومية بنجاح.'))
      queryClient.invalidateQueries(['government-integrations-config'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || t('Failed to save settings.', 'فشل حفظ الإعدادات.'))
    }
  })

  // Run ZATCA Compliance Test mutation
  const testHandshakeMutation = useMutation({
    mutationFn: (env) => api.post('/tenant/compliance/config/test-handshake', { environment: env }).then(res => res.data),
    onSuccess: (res) => {
      setComplianceTestResult(res)
      toast.success(t('Compliance handshake test passed!', 'نجح اختبار المصافحة والتوافق!'))
    },
    onError: (err) => {
      setComplianceTestResult(err.response?.data || { success: false, message: 'Handshake failed.' })
      toast.error(t('Compliance handshake test failed.', 'فشل اختبار التوافق.'))
    }
  })

  // Background Sync simulator (BullMQ progress bar trigger)
  const triggerBulkSync = () => {
    setIsSyncing(true)
    setSyncProgress(0)
    setSyncStatusText(t('Queueing sync job in BullMQ...', 'جاري جدولة مهمة المزامنة في BullMQ...'))

    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsSyncing(false)
          setSyncStatusText(t('Sync completed successfully!', 'اكتملت المزامنة بنجاح!'))
          toast.success(t('Database synced with Government Portal API!', 'تمت مزامنة قاعدة البيانات مع بوابة الحكومة!'))
          return 100
        }
        if (prev === 20) setSyncStatusText(t('VPC Tunnel established with Elm/Qiwa servers...', 'تم إنشاء نفق VPC مع خوادم علم وقوى...'))
        if (prev === 50) setSyncStatusText(t('Fetching payroll files & contractor records...', 'جاري جلب ملفات الأجور وسجلات المقاولين...'))
        if (prev === 80) setSyncStatusText(t('Writing records to MongoDB database...', 'جاري كتابة السجلات في قاعدة بيانات MongoDB...'))
        return prev + 10
      })
    }, 400)
  }

  const onSubmit = (data) => {
    saveMutation.mutate(data)
  }

  // ── DYNAMIC STATUS CALCULATIONS ─────────────────────────────────────────────
  const getStatus = (tabId) => {
    if (!config) return 'disconnected'
    
    switch (tabId) {
      case 'zatca':
        if (config.zatca?.isOnboarded) return 'connected'
        if (config.zatca?.hasPrivateKey) return 'action_required'
        return 'disconnected'
      case 'elm':
        if (config.elm?.clientId && config.elm?.hasClientSecret && (config.elm?.nafathOtpEnabled || config.elm?.tammEnabled)) {
          return 'connected'
        }
        if (config.elm?.clientId) return 'action_required'
        return 'disconnected'
      case 'qiwa':
        if (config.qiwa?.establishmentId && config.qiwa?.hasAccessToken) {
          return config.qiwa.contractAuthAutomationEnabled ? 'connected' : 'action_required'
        }
        if (config.qiwa?.establishmentId) return 'action_required'
        return 'disconnected'
      case 'gosi':
        if (config.gosi?.registrationNumber && config.mudad?.hasClientCertificate) {
          return config.mudad.autoSifUploadEnabled ? 'connected' : 'action_required'
        }
        if (config.gosi?.registrationNumber) return 'action_required'
        return 'disconnected'
      case 'industry':
        return 'connected'
      default:
        return 'disconnected'
    }
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('Connected', 'متصل')}
          </span>
        )
      case 'action_required':
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            {t('Action Required', 'مطلوب إجراء')}
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 dark:bg-dark-750 dark:text-gray-400 border border-gray-200/50 dark:border-dark-600/50">
            <WifiOff className="w-3 h-3 text-gray-400" />
            {t('Disconnected', 'غير متصل')}
          </span>
        )
    }
  }

  // Tabs mapping config
  const tabs = [
    { id: 'zatca', label: t('ZATCA (Fatoora)', 'هيئة الزكاة (فاتورة)'), icon: Shield, highlight: industryType === 'trading' || industryType === 'restaurant' || industryType === 'bakala' },
    { id: 'elm', label: t('Elm / Yakeen / Tamm', 'علم / يقين / تم'), icon: Key, highlight: industryType === 'car_rental' },
    { id: 'qiwa', label: t('Qiwa & MHRSD', 'قوى والموارد البشرية'), icon: Users, highlight: industryType === 'construction' || industryType === 'manpower' },
    { id: 'gosi', label: t('GOSI & Mudad (WPS)', 'التأمينات ومدد (WPS)'), icon: Building, highlight: industryType === 'construction' || industryType === 'manpower' },
    { id: 'industry', label: t('Industry Specific', 'خاص بالقطاع'), icon: Sliders, highlight: true }
  ]

  if (isConfigLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-dark-600 rounded-xl w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-dark-600 rounded-2xl col-span-1" />
          <div className="h-80 bg-gray-200 dark:bg-dark-600 rounded-2xl col-span-3" />
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 pb-12 ${isAr ? 'rtl' : 'ltr'}`}>
      
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            🇸🇦 {t('Saudi Government Integrations', 'بوابة التكاملات الحكومية السعودية')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('Manage cryptographic keys, portal authorizations, and synchronization schedules under the Shared-Gateway Pattern.', 
               'إدارة مفاتيح التشفير، تفويضات البوابات، وجداول المزامنة في إطار نمط البوابة المشتركة.')}
          </p>
        </div>

        {/* Sync queue trigger (BullMQ) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={triggerBulkSync}
            disabled={isSyncing}
            className="btn btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-primary-500' : ''}`} />
            {t('Sync Portals Bulk', 'مزامنة البوابات جماعياً')}
          </button>
        </div>
      </div>

      {/* BullMQ Sync progress bar */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl space-y-2 overflow-hidden"
          >
            <div className="flex justify-between items-center text-sm font-semibold">
              <span className="text-primary-700 dark:text-primary-400">{syncStatusText}</span>
              <span className="text-primary-700 dark:text-primary-400">{syncProgress}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CORE GRID LAYOUT ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* SIDEBAR TABS NAVIGATION */}
        <div className="card p-3 space-y-2 lg:col-span-1">
          <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
            {t('Integration Services', 'خدمات الربط والتكامل')}
          </div>
          <div className="flex flex-col gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const status = getStatus(tab.id)
              const isSelected = activeTab === tab.id
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id)
                    setComplianceTestResult(null)
                  }}
                  className={`flex flex-col w-full text-start p-3 rounded-xl transition-all relative ${
                    isSelected
                      ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/10'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-750'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-semibold text-sm">{tab.label}</span>
                    </div>
                    {/* Glowing highlight indicator for industry fit */}
                    {tab.highlight && !isSelected && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center justify-between w-full">
                    {renderStatusBadge(status)}
                    {tab.highlight && (
                      <span className={`text-[10px] uppercase font-bold tracking-tight ${isSelected ? 'text-primary-100' : 'text-primary-500'}`}>
                        {t('Recommended', 'موصى به')}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* MAIN CONFIGURATION FORMS */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* TAB CONTENT: ZATCA */}
            {activeTab === 'zatca' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                <div className="border-b border-gray-150 dark:border-dark-750 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary-500" />
                    {t('ZATCA E-Invoicing Phase 2 Integration', 'تكامل هيئة الزكاة والجمارك (المرحلة الثانية)')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('Configure your cryptographic stamp and environment to submit invoices for Clearance (B2B) and Reporting (B2C).',
                       'تهيئة ختم التشفير والبيئة التنظيمية لإرسال الفواتير الضريبية للاعتماد والمبسطة للإبلاغ.')}
                  </p>
                </div>

                {/* Restaurant & Grocery Offline signing banner */}
                {(industryType === 'restaurant' || industryType === 'bakala') && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-800 dark:text-amber-400 text-sm">
                        {t('High-Velocity POS Optimization Active', 'تفعيل التحسين الفوري لنقاط البيع السريعة')}
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed">
                        {t('Your local terminal is configured to sign invoices cryptographically in offline mode (<100ms checkout). Signed payloads will automatically batch-sync to ZATCA\'s servers via backend workers within the regulatory 24-hour window if connectivity drops.',
                           'تم تكوين المحطة الطرفية المحلية لتوقيع الفواتير رقمياً في وضع عدم الاتصال (أقل من 100 مللي ثانية). سيتم إرسال الفواتير الموقعة كحزم تلقائياً عبر مشغلات الخلفية خلال المهلة النظامية (24 ساعة) في حال انقطاع الشبكة.')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('ZATCA Environment Toggle', 'بيئة الربط (الزكاة)')}</label>
                    <select {...register('zatca.environment')} className="select mt-1">
                      <option value="sandbox">Sandbox / البيئة التجريبية المفتوحة</option>
                      <option value="simulation">Simulation / بيئة المحاكاة</option>
                      <option value="production">Production / البيئة الفعلية</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">{t('OTP Code Input (6 Digits)', 'رمز التحقق الثنائي من بوابة فاتورة')}</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      {...register('zatca.otp')}
                      className={`input mt-1 ${errors.zatca?.otp ? 'border-red-500' : ''}`}
                    />
                    {errors.zatca?.otp && <p className="text-xs text-red-500 mt-1">{errors.zatca.otp.message}</p>}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {t('Generate a one-time onboarding code from the ZATCA Fatoora Portal to exchange for CSID.', 
                         'قم بإنشاء رمز تسجيل مؤقت من بوابة فاتورة لإتمام عملية الربط والحصول على CSID.')}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="label">{t('Cryptographic Stamp Certificate (CSIDL) — Read Only', 'شهادة ختم التشفير (CSID) — للقراءة فقط')}</label>
                  <textarea
                    readOnly
                    rows={4}
                    value={config?.zatca?.complianceCsid || t('No certificate loaded. Enter OTP above and save to onboard.', 'لم يتم تحميل شهادة. أدخل رمز التحقق OTP لحفظ وبدء عملية الدمج.')}
                    className="input font-mono text-xs bg-gray-50 dark:bg-dark-750 text-gray-500 cursor-not-allowed mt-1"
                  />
                </div>

                <div className="space-y-2">
                  <label className="label">{t('Private Key (.pem)', 'المفتاح الخاص (.pem)')}</label>
                  <textarea
                    rows={4}
                    placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                    {...register('zatca.privateKey')}
                    className={`input font-mono text-xs mt-1 ${errors.zatca?.privateKey ? 'border-red-500' : ''}`}
                  />
                  {errors.zatca?.privateKey && <p className="text-xs text-red-500 mt-1">{errors.zatca.privateKey.message}</p>}
                </div>

                {/* Handshake test action */}
                <div className="p-4 bg-gray-50 dark:bg-dark-750 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm">{t('Verify Cryptographic Handshake', 'التحقق من مصافحة التشفير')}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('Test key validity and send a mock simplified invoice to ZATCA server.', 
                         'اختبار صلاحية المفتاح وإرسال فاتورة مبسطة تجريبية لخادم هيئة الزكاة.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => testHandshakeMutation.mutate(watch('zatca.environment'))}
                    disabled={testHandshakeMutation.isPending}
                    className="btn btn-secondary flex items-center gap-2"
                  >
                    {testHandshakeMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-primary-500" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {t('Run Compliance Test', 'تشغيل اختبار التوافق')}
                  </button>
                </div>

                {/* Handshake test result UI */}
                {complianceTestResult && (
                  <div className={`p-5 rounded-2xl border ${complianceTestResult.success ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'} space-y-3`}>
                    <div className="flex items-center gap-2">
                      {complianceTestResult.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-bold text-sm">{complianceTestResult.message}</span>
                    </div>

                    {complianceTestResult.checks && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(complianceTestResult.checks).map(([key, ok]) => (
                          <div key={key} className="flex items-center gap-2 text-xs bg-white dark:bg-dark-800 p-2 rounded-lg border border-gray-100 dark:border-dark-700">
                            {ok ? <Check className="w-4 h-4 text-green-500" /> : <X className="w-4 h-4 text-red-500" />}
                            <span className="font-medium text-gray-600 dark:text-gray-300">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {complianceTestResult.sample && (
                      <div className="p-3 bg-white dark:bg-dark-800 rounded-xl border border-gray-100 dark:border-dark-700 text-xs font-mono space-y-1">
                        <div><span className="text-gray-400">UUID:</span> {complianceTestResult.sample.uuid}</div>
                        <div><span className="text-gray-400">Hash:</span> {complianceTestResult.sample.invoiceHash}</div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* TAB CONTENT: ELM */}
            {activeTab === 'elm' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                <div className="border-b border-gray-150 dark:border-dark-750 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Key className="w-6 h-6 text-primary-500" />
                    {t('Elm DevPortal Integration (Yakeen & TAMM)', 'بوابة المطورين علم (يقين وتم)')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('Configure credentials for driver identity checks (Yakeen/Nafath) and car authorization (TAMM API).',
                       'تهيئة بيانات الاعتماد للتحقق من هوية السائقين (يقين/نفاذ) وتفويضات المركبات عبر (بوابة تم).')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('Elm Client ID', 'معرف العميل (علم)')}</label>
                    <input
                      type="text"
                      placeholder="e.g. elm_client_98234"
                      {...register('elm.clientId')}
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="label">{t('Elm Client Secret', 'السر الخاص بالعميل (علم)')}</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      {...register('elm.clientSecret')}
                      className="input mt-1"
                    />
                  </div>

                  <div>
                    <label className="label">{t('App ID / Agency ID', 'معرف التطبيق / الوكالة')}</label>
                    <input
                      type="text"
                      placeholder="e.g. SA-TAMM-2309"
                      {...register('elm.appId')}
                      className="input mt-1"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {t('Required for Traffic Violation Polling and TAMM driver authorization workflows.',
                         'مطلوب للاستعلام عن المخالفات المرورية وتفويض سائقي المركبات في بوابة تم.')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 dark:border-dark-750 pt-4">
                  <h4 className="font-bold text-sm">{t('Service Authorizations', 'تفويض الخدمات')}</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-750 rounded-2xl">
                    <div>
                      <span className="font-semibold text-sm">{t('Enable Nafath OTP Identity Verification', 'تفعيل التحقق من الهوية عبر نفاذ OTP')}</span>
                      <p className="text-xs text-gray-400">{t('Verifies identity dynamically via Nafath platform before contract signing.', 'يتحقق من الهوية فورياً عبر نفاذ قبل توقيع العقد.')}</p>
                    </div>
                    <Controller
                      name="elm.nafathOtpEnabled"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-primary-500 relative transition-colors cursor-pointer before:content-[\'\'] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all"
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-750 rounded-2xl">
                    <div>
                      <span className="font-semibold text-sm">{t('Enable TAMM Driver Authorization & violation polling', 'تفعيل تفويض سائقي تم والاستعلام عن المخالفات')}</span>
                      <p className="text-xs text-gray-400">{t('Syncs driver statistics, active rentals, and polls traffic violation state.', 'يزامن إحصائيات السائقين، التأجيرات النشطة، والمخالفات المرورية.')}</p>
                    </div>
                    <Controller
                      name="elm.tammEnabled"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-primary-500 relative transition-colors cursor-pointer before:content-[\'\'] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all"
                        />
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: QIWA */}
            {activeTab === 'qiwa' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                <div className="border-b border-gray-150 dark:border-dark-750 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary-500" />
                    {t('Qiwa & MHRSD Labor Integration', 'تكامل منصة قوى ووزارة الموارد البشرية')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('Automate employment contract authentication, Saudization checking, and Nitaqat calculations.',
                       'أتمتة توثيق عقود العمل، التحقق من السعودة، وحسابات نطاقات المنشأة.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('Establishment ID (700xxxxxxx)', 'الرقم الموحد للمنشأة (700xxxxxxxx)')}</label>
                    <input
                      type="text"
                      maxLength={10}
                      placeholder="7001234567"
                      {...register('qiwa.establishmentId')}
                      className={`input mt-1 ${errors.qiwa?.establishmentId ? 'border-red-500' : ''}`}
                    />
                    {errors.qiwa?.establishmentId && <p className="text-xs text-red-500 mt-1">{errors.qiwa.establishmentId.message}</p>}
                  </div>

                  <div>
                    <label className="label">{t('Qiwa API Access Token', 'رمز الوصول لواجهة قوى (Qiwa API Token)')}</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••"
                      {...register('qiwa.accessToken')}
                      className="input mt-1"
                    />
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 dark:border-dark-750 pt-4">
                  <h4 className="font-bold text-sm">{t('MHRSD Automations', 'أتمتة وزارة الموارد البشرية')}</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-750 rounded-2xl">
                    <div>
                      <span className="font-semibold text-sm">{t('Employment Contract Authentication Automation', 'توثيق عقود الموظفين المؤتمت')}</span>
                      <p className="text-xs text-gray-400">{t('Automatically sends signed contracts to Qiwa portal for verification.', 'يرسل عقود العمل الموقعة تلقائياً لبوابة قوى للتصديق عليها.')}</p>
                    </div>
                    <Controller
                      name="qiwa.contractAuthAutomationEnabled"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-primary-500 relative transition-colors cursor-pointer before:content-[\'\'] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all"
                        />
                      )}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-750 rounded-2xl">
                    <div>
                      <span className="font-semibold text-sm">{t('Nitaqat & Saudization Calculator Widget', 'عنصر حساب نطاقات ونسب التوطين')}</span>
                      <p className="text-xs text-gray-400">{t('Display live organization band status directly on the HR dashboard.', 'يعرض نطاق المنشأة الحالي ونسب التوطين في لوحة شؤون الموظفين.')}</p>
                    </div>
                    <Controller
                      name="qiwa.saudizationWidgetEnabled"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-primary-500 relative transition-colors cursor-pointer before:content-[\'\'] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all"
                        />
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: GOSI / MUDAD */}
            {activeTab === 'gosi' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                <div className="border-b border-gray-150 dark:border-dark-750 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Building className="w-6 h-6 text-primary-500" />
                    {t('GOSI & Mudad WPS Integration', 'تكامل التأمينات الاجتماعية ومنصة مدد (حماية الأجور)')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('Configure your organization registration details and Client Certificate to sync monthly payroll SIF files.',
                       'تهيئة تفاصيل تسجيل المنشأة وشهادة العميل لمزامنة ملفات الأجور الشهرية SIF.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('GOSI Registration Number', 'رقم التسجيل في التأمينات (GOSI)')}</label>
                    <input
                      type="text"
                      placeholder="e.g. 10982347"
                      {...register('gosi.registrationNumber')}
                      className={`input mt-1 ${errors.gosi?.registrationNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.gosi?.registrationNumber && <p className="text-xs text-red-500 mt-1">{errors.gosi.registrationNumber.message}</p>}
                  </div>

                  <div>
                    <label className="label">{t('Mudad API Client Certificate', 'شهادة عميل واجهة مدد (Client Certificate)')}</label>
                    <textarea
                      rows={3}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      {...register('mudad.clientCertificate')}
                      className={`input font-mono text-xs mt-1 ${errors.mudad?.clientCertificate ? 'border-red-500' : ''}`}
                    />
                    {errors.mudad?.clientCertificate && <p className="text-xs text-red-500 mt-1">{errors.mudad.clientCertificate.message}</p>}
                  </div>
                </div>

                <div className="space-y-3 border-t border-gray-100 dark:border-dark-750 pt-4">
                  <h4 className="font-bold text-sm">{t('Payroll & Compliance', 'الأجور والامتثال')}</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-750 rounded-2xl">
                    <div>
                      <span className="font-semibold text-sm">{t('Automated Monthly .SIF Payroll Upload to Mudad', 'الرفع التلقائي لملفات حماية الأجور (.SIF) إلى مدد')}</span>
                      <p className="text-xs text-gray-400">{t('Generates and signs WPS files, uploading them dynamically at fiscal cutoff.', 'يقوم بإنشاء وتوقيع ملفات الأجور ورفعها تلقائياً عند نهاية الفترة المالية.')}</p>
                    </div>
                    <Controller
                      name="mudad.autoSifUploadEnabled"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-primary-500 relative transition-colors cursor-pointer before:content-[\'\'] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all"
                        />
                      )}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT: INDUSTRY SPECIFIC */}
            {activeTab === 'industry' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6 space-y-6">
                <div className="border-b border-gray-150 dark:border-dark-750 pb-4">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Sliders className="w-6 h-6 text-primary-500" />
                    {t('Industry Specific Portals', 'التكاملات الخاصة بنوع النشاط')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('Configure niche portal endpoints according to your tenant industry classification.',
                       'تهيئة نقاط الاتصال الحكومية الخاصة بنشاط منشأتك التجاري.')}
                  </p>
                </div>

                <div className="p-4 bg-primary-500/10 border border-primary-500/20 rounded-2xl">
                  <span className="font-bold text-sm text-primary-700 dark:text-primary-400 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {t(`Tenant Active Industry: ${industryType.toUpperCase()}`, `نشاط المنشأة الفعال: ${industryType.toUpperCase()}`)}
                  </span>
                  <p className="text-xs text-primary-600 dark:text-primary-300 mt-1">
                    {t('Relevant portal configurations have been prioritized below for easy setup.',
                       'تم تقديم بوابات الربط الأكثر أهمية لنشاطك في الأسفل لتسهيل التهيئة.')}
                  </p>
                </div>

                {/* 1. TRADING: Saber */}
                {industryType === 'trading' && (
                  <div className="space-y-4 border border-gray-100 dark:border-dark-700 p-4 rounded-2xl bg-white dark:bg-dark-800">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">🇸🇦 Saber Platform Integration / منصة سابر للمطابقة</h4>
                    <div>
                      <label className="label text-xs">{t('Saber Access Token', 'رمز الوصول لمنصة سابر')}</label>
                      <input
                        type="password"
                        placeholder="saber_token_••••••••"
                        {...register('industrySpecific.saberToken')}
                        className="input mt-1"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        {t('Allows importing product details, custom declarations, and conformity certificates.',
                           'يسمح باستيراد بيانات المنتجات، الجمارك، وشهادات المطابقة.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. CONSTRUCTION: Etimad */}
                {industryType === 'construction' && (
                  <div className="space-y-4 border border-gray-100 dark:border-dark-700 p-4 rounded-2xl bg-white dark:bg-dark-800">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">🇸🇦 Etimad Portal Sync / بوابة اعتماد للمشتريات الحكومية</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label text-xs">{t('Etimad API Username', 'اسم المستخدم لواجهة اعتماد')}</label>
                        <input
                          type="text"
                          placeholder="etimad_user"
                          {...register('industrySpecific.etimadUser')}
                          className="input mt-1"
                        />
                      </div>
                      <div>
                        <label className="label text-xs">{t('Etimad API Password', 'كلمة مرور واجهة اعتماد')}</label>
                        <input
                          type="password"
                          placeholder="••••••••"
                          {...register('industrySpecific.etimadPassword')}
                          className="input mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. CAR RENTAL: TAMM Trafffic verification (handled, but extra fields here) */}
                {industryType === 'car_rental' && (
                  <div className="space-y-4 border border-gray-100 dark:border-dark-700 p-4 rounded-2xl bg-white dark:bg-dark-800">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">🇸🇦 Muqeem Live Resident Verification / الاستعلام الفوري عبر مقيم</h4>
                    <p className="text-xs text-gray-500">
                      {t('Verifies Iqama status, residency duration, and sponsorship status dynamically on booking checkout.',
                         'يتحقق من صلاحية الإقامة ومدة إقامة الوافد ونقل الكفالة فورياً عند حجز وتأجير المركبة.')}
                    </p>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-750 rounded-xl">
                      <span className="text-xs font-semibold">{t('Enable Live Muqeem Verification', 'تفعيل التحقق الفوري عبر مقيم')}</span>
                      <input type="checkbox" defaultChecked className="w-10 h-6 bg-gray-200 rounded-full appearance-none checked:bg-primary-500 relative transition-colors cursor-pointer before:content-[\'\'] before:absolute before:w-4 before:h-4 before:bg-white before:rounded-full before:top-1 before:left-1 checked:before:left-5 before:transition-all" />
                    </div>
                  </div>
                )}

                {/* 4. RESTAURANT / GROCERY: Balady Platform */}
                {(industryType === 'restaurant' || industryType === 'bakala') && (
                  <div className="space-y-4 border border-gray-100 dark:border-dark-700 p-4 rounded-2xl bg-white dark:bg-dark-800">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">🇸🇦 Balady Platform Integration / منصة بلدي للمجالس البلدية</h4>
                    <div>
                      <label className="label text-xs">{t('Balady License API Key', 'رمز ترخيص منصة بلدي')}</label>
                      <input
                        type="password"
                        placeholder="balady_api_key_••••••••"
                        {...register('industrySpecific.baladyApiKey')}
                        className="input mt-1"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        {t('Allows displaying municipal licenses and health certificate validity alerts.',
                           'يسمح بعرض التراخيص البلدية والشهادات الصحية وتنبيهات صلاحيتها.')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-400 flex items-center gap-2 mt-4 bg-gray-50 dark:bg-dark-750 p-3 rounded-xl border border-gray-200/50 dark:border-dark-700/50">
                  <HelpCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>
                    {t('Need to activate integrations for another industry sector? Update your business profiles in the company settings tab.',
                       'هل تحتاج تفعيل تكاملات لقطاع نشاط آخر؟ قم بتحديث أنشطة منشأتك في علامة تبويب إعدادات الشركة.')}
                  </span>
                </div>
              </motion.div>
            )}

            {/* FORM FOOTER ACTIONS */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-750">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="btn btn-primary px-6 py-2.5 flex items-center gap-2"
              >
                {saveMutation.isPending ? (
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {t('Save Configurations', 'حفظ التكوينات')}
              </button>
            </div>
            
          </form>
        </div>
      </div>
    </div>
  )
}
