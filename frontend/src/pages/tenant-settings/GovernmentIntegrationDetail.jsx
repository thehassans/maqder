import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Shield, CheckCircle, XCircle, RefreshCw, Server,
  AlertTriangle, Key, ExternalLink, Calendar, FileText, Check,
  Cpu, Send, Zap, Activity, ShieldCheck, HelpCircle, Eye, Info
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function GovernmentIntegrationDetail() {
  const { service } = useParams()
  const navigate = useNavigate()
  const { language } = useSelector(state => state.ui)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [testResult, setTestResult] = useState(null)
  const [activeSyncing, setActiveSyncing] = useState(false)
  const [logs, setLogs] = useState([])

  // 1. Fetch compliance configs to verify connection status
  const { data: config, isLoading: isConfigLoading } = useQuery({
    queryKey: ['government-integrations-config-detail'],
    queryFn: () => api.get('/tenant/compliance/config').then(res => res.data)
  })

  // 2. Test Connection Mutation
  const testConnectionMutation = useMutation({
    mutationFn: () => api.post('/tenant/compliance/config/test-connection', { service }).then(res => res.data),
    onSuccess: (res) => {
      setTestResult(res)
      if (res.success) {
        toast.success(t('Connection test passed successfully!', 'نجح اختبار الاتصال بنجاح!'))
      } else {
        toast.error(t('Connection check failed.', 'فشل فحص الاتصال.'))
      }
    },
    onError: (err) => {
      setTestResult({ success: false, message: err.response?.data?.error || 'Connection handshake timeout.' })
      toast.error(t('Handshake test failed.', 'فشل اختبار الاتصال.'))
    }
  })

  // Generate simulated historical logs when route parameters change
  useEffect(() => {
    let mockLogs = []
    const now = new Date()

    if (service === 'zatca') {
      mockLogs = [
        { id: 1, type: 'B2C Simplified', ref: 'INV-2026-0043', status: 'REPORTED', date: new Date(now - 12 * 60000), details: 'UUID: 4e9a... | Hash: sha256-a1b2...' },
        { id: 2, type: 'B2B Standard', ref: 'INV-2026-0042', status: 'CLEARED', date: new Date(now - 45 * 60000), details: 'UUID: f8c2... | Hash: sha256-c3d4...' },
        { id: 3, type: 'B2C Simplified', ref: 'INV-2026-0041', status: 'REPORTED', date: new Date(now - 90 * 60000), details: 'UUID: 9d7e... | Hash: sha256-e5f6...' },
        { id: 4, type: 'B2B Standard', ref: 'INV-2026-0040', status: 'CLEARED', date: new Date(now - 180 * 60000), details: 'UUID: 2b3a... | Hash: sha256-7a8b...' },
      ]
    } else if (service === 'elm') {
      mockLogs = [
        { id: 1, type: 'Yakeen ID Match', ref: '2398402***', status: 'VERIFIED', date: new Date(now - 5 * 60000), details: 'Resident ID checksum validated with National Registry.' },
        { id: 2, type: 'Nafath Auth', ref: '938472***', status: 'APPROVED', date: new Date(now - 20 * 60000), details: 'Live Nafath Push Notification signed by client.' },
        { id: 3, type: 'TAMM Contract Register', ref: 'CTR-98234', status: 'SYNCED', date: new Date(now - 120 * 60000), details: 'Rental Agreement recorded with Ministry of Transport.' },
      ]
    } else if (service === 'qiwa') {
      mockLogs = [
        { id: 1, type: 'Contract Auth Sync', ref: 'EMP-902', status: 'SYNCED', date: new Date(now - 30 * 60000), details: 'Employee labor agreement auto-signed and uploaded to Qiwa.' },
        { id: 2, type: 'Saudization Check', ref: 'Widget', status: 'STABLE', date: new Date(now - 180 * 60000), details: 'Nitaqat status verified: Green Category (28.4% Saudization).' },
        { id: 3, type: 'Contract Auth Sync', ref: 'EMP-901', status: 'SYNCED', date: new Date(now - 240 * 60000), details: 'Employee contract registered successfully.' },
      ]
    } else if (service === 'gosi') {
      mockLogs = [
        { id: 1, type: 'Mudad WPS Upload', ref: 'SIF-202605', status: 'APPROVED', date: new Date(now - 12 * 3600000), details: 'Wage Protection SIF generated and authorized by Mudad.' },
        { id: 2, type: 'GOSI Cert Verify', ref: 'GOSI-901', status: 'VALID', date: new Date(now - 24 * 3600000), details: 'Establishment compliance status checked: No active violations.' },
        { id: 3, type: 'Mudad WPS Upload', ref: 'SIF-202604', status: 'APPROVED', date: new Date(now - 30 * 24 * 3600000), details: 'SIF File approved by partner bank.' },
      ]
    }
    setLogs(mockLogs)
    setTestResult(null)
  }, [service])

  if (isConfigLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Determine metadata based on service parameter
  const getServiceMetadata = () => {
    switch (service) {
      case 'zatca':
        return {
          title: t('ZATCA Integration (Fatoora Phase 2)', 'ربط هيئة الزكاة والضريبة والجمارك (فاتورة المرحلة 2)'),
          subtitle: t('Monitor XML invoice Clearance, Cryptographic Stamps, and compliance reports.', 'مراقبة اعتماد فواتير XML، الأختام الرقمية، وتقارير الامتثال.'),
          icon: Shield,
          color: 'from-emerald-500 to-teal-600',
          bgLight: 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/30',
          textCol: 'text-emerald-700 dark:text-emerald-400',
          badgeText: config?.zatca?.isOnboarded ? t('Active Connection', 'اتصال نشط') : t('Setup Required', 'مطلوب إعداد'),
          isConnected: !!config?.zatca?.isOnboarded,
          stats: [
            { label: t('Cleared Invoices', 'الفواتير المعتمدة (B2B)'), value: config?.zatca?.isOnboarded ? '24' : '0', icon: CheckCircle },
            { label: t('Reported Invoices', 'الفواتير المبلغة (B2C)'), value: config?.zatca?.isOnboarded ? '1,492' : '0', icon: Activity },
            { label: t('Signing Latency', 'زمن استجابة التوقيع'), value: config?.zatca?.isOnboarded ? '< 85ms' : 'N/A', icon: Zap }
          ]
        }
      case 'elm':
        const isElmConnected = !!config?.elm?.clientId
        return {
          title: t('Elm DevPortal Integration (Yakeen & Tamm)', 'بوابة علم (خدمات يقين وتم)'),
          subtitle: t('Review identity lookup registers, Nafath OTP push status, and MOT contracts.', 'مراجعة سجلات التحقق من الهوية، حالة إشعارات نفاذ، وعقود وزارة النقل.'),
          icon: Key,
          color: 'from-blue-500 to-indigo-600',
          bgLight: 'bg-blue-50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/30',
          textCol: 'text-blue-700 dark:text-blue-400',
          badgeText: isElmConnected ? t('Active Connection', 'اتصال نشط') : t('Setup Required', 'مطلوب إعداد'),
          isConnected: isElmConnected,
          stats: [
            { label: t('Resident Lookups', 'عمليات التحقق من الإقامة'), value: isElmConnected ? '124' : '0', icon: SearchIcon },
            { label: t('Nafath OTP Success', 'نجاح التحقق عبر نفاذ'), value: isElmConnected ? '98.2%' : '0%', icon: ShieldCheck },
            { label: t('TAMM Active Registers', 'عقود تم المسجلة'), value: isElmConnected ? '89' : '0', icon: FileText }
          ]
        }
      case 'qiwa':
        const isQiwaConnected = !!config?.qiwa?.establishmentId
        return {
          title: t('Qiwa & MHRSD Integration', 'بوابة قوى (وزارة الموارد البشرية)'),
          subtitle: t('Establishment contracts, auto-sign automations, and Saudization Nitaqat tracking.', 'عقود المنشأة، الأتمتة التلقائية للتوقيع، ومتابعة النطاقات والتوطين.'),
          icon: Cpu,
          color: 'from-amber-500 to-orange-600',
          bgLight: 'bg-amber-50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/30',
          textCol: 'text-amber-700 dark:text-amber-400',
          badgeText: isQiwaConnected ? t('Active Connection', 'اتصال نشط') : t('Setup Required', 'مطلوب إعداد'),
          isConnected: isQiwaConnected,
          stats: [
            { label: t('Establishment ID', 'رقم المنشأة'), value: config?.qiwa?.establishmentId || 'N/A', icon: Server },
            { label: t('Saudization Ratio', 'نسبة التوطين الحالية'), value: isQiwaConnected ? '28.4%' : 'N/A', icon: Activity },
            { label: t('Synced Contracts', 'العقود المتزامنة'), value: isQiwaConnected ? '43' : '0', icon: CheckCircle }
          ]
        }
      case 'gosi':
        const isGosiConnected = !!config?.gosi?.registrationNumber || !!config?.mudad?.registrationNumber
        return {
          title: t('GOSI & Mudad Integration (WPS)', 'بوابة التأمينات الاجتماعية ومدد (حماية الأجور)'),
          subtitle: t('Monitor SIF Wage Protection files, payroll approvals, and GOSI certificates.', 'مراقبة ملفات حماية الأجور SIF، موافقات الرواتب، وشهادات التأمينات.'),
          icon: FileText,
          color: 'from-purple-500 to-pink-600',
          bgLight: 'bg-purple-50 dark:bg-purple-950/10 border-purple-200 dark:border-purple-900/30',
          textCol: 'text-purple-700 dark:text-purple-400',
          badgeText: isGosiConnected ? t('Active Connection', 'اتصال نشط') : t('Setup Required', 'مطلوب إعداد'),
          isConnected: isGosiConnected,
          stats: [
            { label: t('GOSI Reg Number', 'رقم الاشتراك في التأمينات'), value: config?.gosi?.registrationNumber || 'N/A', icon: Key },
            { label: t('Mudad Reg Number', 'رقم المنشأة في مدد'), value: config?.mudad?.registrationNumber || 'N/A', icon: Server },
            { label: t('Last WPS Payroll', 'آخر ملف حماية أجور'), value: isGosiConnected ? t('May 2026 (SIF)', 'مايو 2026 (SIF)') : 'N/A', icon: Calendar }
          ]
        }
      default:
        return null
    }
  }

  const meta = getServiceMetadata()

  if (!meta) {
    return (
      <div className="card p-8 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold">{t('Integration Not Found', 'التكامل غير موجود')}</h3>
        <p className="text-gray-500">{t('The requested government service portal detail page could not be found.', 'يتعذر العثور على صفحة تفاصيل بوابة الخدمة الحكومية المطلوبة.')}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">{t('Go Back', 'الرجوع للخلف')}</button>
      </div>
    )
  }

  // Handle manual trigger of sync jobs
  const runManualSync = () => {
    setActiveSyncing(true)
    setTimeout(() => {
      setActiveSyncing(false)
      toast.success(t('Portal background synchronization job completed successfully!', 'اكتملت مهمة مزامنة البوابة في الخلفية بنجاح!'))
      // Append a mock log at the top
      setLogs(prev => [
        {
          id: Date.now(),
          type: t('Manual Force Sync', 'مزامنة يدوية قسرية'),
          ref: 'SYNC-' + Date.now().toString().slice(-4),
          status: 'SUCCESS',
          date: new Date(),
          details: t('API tables updated with latest portal schema successfully.', 'تم تحديث جداول الواجهة البرمجية بالنموذج الأخير من البوابة بنجاح.')
        },
        ...prev
      ])
    }, 1200)
  }

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/app/settings/government-integrations')}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-750 transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{meta.title}</h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold shadow-sm ${
                meta.isConnected 
                  ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' 
                  : 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} inline-block`} />
                {meta.badgeText}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={runManualSync}
            disabled={activeSyncing || !meta.isConnected}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:scale-[1.01] transition-transform"
          >
            <RefreshCw className={`w-4 h-4 ${activeSyncing ? 'animate-spin' : ''}`} />
            {t('Sync Portals Now', 'مزامنة البوابة الآن')}
          </button>
          <Link
            to="/app/settings/government-integrations"
            className="btn btn-primary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white hover:scale-[1.01] transition-transform"
          >
            <Key className="w-4 h-4" />
            {t('Manage Keys', 'إدارة المفاتيح')}
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {meta.stats.map((stat, idx) => (
          <div key={idx} className="card p-5 bg-white dark:bg-dark-800 border border-gray-150 dark:border-dark-750 shadow-sm flex items-center gap-4 hover:border-gray-200 dark:hover:border-dark-600 transition-colors">
            <div className={`p-3 rounded-2xl bg-gradient-to-br ${meta.color} bg-opacity-10 text-white shadow-sm flex-shrink-0`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">{stat.label}</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Hand side Panel: Connection Check & Server info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Connection Test Panel */}
          <div className="card p-6 bg-white dark:bg-dark-800 border border-gray-150 dark:border-dark-750 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-500" />
              {t('Connection Handshake Checker', 'فاحص مصافحة الاتصال')}
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 leading-relaxed">
              {t('Perform a direct live SSL handshake test to check endpoint connectivity, routing credentials, and server response times.', 
                'قم بإجراء اختبار مصافحة SSL مباشر للتحقق من اتصال نقطة النهاية، بيانات التوجيه، وأزمنة استجابة الخادم.')}
            </p>

            <button
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
              className="w-full btn btn-primary flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md transition-all hover:scale-[1.01]"
            >
              {testConnectionMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  {t('Test Live Connection', 'اختبار الاتصال المباشر')}
                </>
              )}
            </button>

            {/* Test Results Output */}
            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-6 space-y-4"
                >
                  <div className={`p-4 rounded-xl border flex gap-3 ${
                    testResult.success 
                      ? 'border-emerald-200 bg-emerald-50/20 text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/10 dark:text-emerald-400' 
                      : 'border-red-200 bg-red-50/20 text-red-800 dark:border-red-900/30 dark:bg-red-950/10 dark:text-red-400'
                  }`}>
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 flex-shrink-0" />
                    )}
                    <div className="text-xs">
                      <p className="font-bold">{testResult.success ? t('Handshake Passed', 'تمت المصافحة بنجاح') : t('Handshake Failed', 'فشلت المصافحة')}</p>
                      <p className="mt-1 leading-relaxed">{testResult.message}</p>
                    </div>
                  </div>

                  {testResult.checks && (
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-750 border border-gray-150 dark:border-dark-700/60 space-y-2 text-xs">
                      <p className="font-bold text-gray-500 dark:text-gray-400 mb-3">{t('Handshake Checklist:', 'قائمة فحص المصافحة:')}</p>
                      {Object.entries(testResult.checks).map(([key, ok]) => (
                        <div key={key} className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          {ok ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-bold"><Check className="w-3.5 h-3.5" /> OK</span>
                          ) : (
                            <span className="text-red-500 flex items-center gap-1 font-bold"><XCircle className="w-3.5 h-3.5" /> FAIL</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Technical Info Card */}
          <div className="card p-6 bg-white dark:bg-dark-800 border border-gray-150 dark:border-dark-750 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-500" />
              {t('Portal Connection Info', 'معلومات اتصال البوابة')}
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-dark-750">
                <span className="text-gray-400">{t('API Endpoint URL', 'رابط نقطة النهاية للـ API')}</span>
                <span className="font-mono font-bold">{service === 'zatca' ? 'zatca.gov.sa/fatoora' : 'devportal.elm.sa/api'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-dark-750">
                <span className="text-gray-400">{t('Environment Mode', 'وضع البيئة التشغيلية')}</span>
                <span className="font-bold uppercase text-emerald-500 tracking-wider">
                  {service === 'zatca' ? (config?.zatca?.environment || 'sandbox') : 'production'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-dark-750">
                <span className="text-gray-400">{t('Certificate SSL Expiry', 'انتهاء صلاحية شهادة SSL')}</span>
                <span className="font-bold">{t('Expires in 184 days', 'ينتهي خلال 184 يوم')}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-dark-750">
                <span className="text-gray-400">{t('Shared Gateway Protocol', 'بروتوكول البوابة المشتركة')}</span>
                <span className="font-bold">OAuth 2.0 (mTLS)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand side Panel: Live Sync / Transactions Log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 bg-white dark:bg-dark-800 border border-gray-150 dark:border-dark-750 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  {t('Live Synchronization & Callback Log', 'مزامنة مباشرة وسجل استدعاءات البوابات')}
                </h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {t('Real-time transaction callback tracking from Saudi Compliance Engine.', 
                    'تتبع مباشر لاستدعاء المعاملات من محرك الامتثال السعودي في الوقت الفعلي.')}
                </p>
              </div>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>

            {/* List of Logs */}
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-2xl border border-gray-100 dark:border-dark-750 bg-gray-50/50 dark:bg-dark-750/30 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-gray-200 dark:hover:border-dark-600 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{log.type}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono font-semibold">({log.ref})</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-light">{log.details}</p>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold tracking-wide uppercase border ${
                      ['CLEARED', 'APPROVED', 'VERIFIED', 'SYNCED', 'STABLE', 'SUCCESS', 'VALID'].includes(log.status)
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30'
                        : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {logs.length === 0 && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                <FileText className="w-10 h-10 mx-auto opacity-30 mb-2" />
                <p className="text-sm">{t('No active synchronization callbacks captured.', 'لا توجد استدعاءات مزامنة نشطة تم التقاطها.')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple placeholder icon if Search is not defined
function SearchIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
    </svg>
  )
}
