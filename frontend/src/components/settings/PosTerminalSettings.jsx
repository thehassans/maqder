import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCard,
  Save,
  Wifi,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Terminal,
  ArrowRight,
  Clock,
  Activity,
  BadgeCheck,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

/* ─── Provider definitions ──────────────────────────────────────────────── */
const PROVIDERS = [
  {
    id: 'geidea',
    label: 'Geidea',
    desc_en: "Saudi Arabia's leading POS gateway – VISA, MC, Mada",
    desc_ar: 'بوابة جيدية – المعيار السعودي لنقاط البيع',
    color: 'from-blue-600 to-blue-800',
    emoji: '🏦',
  },
  {
    id: 'paytabs',
    label: 'PayTabs',
    desc_en: 'Multi-currency MENA payment gateway',
    desc_ar: 'بوابة دفع متعددة العملات للشرق الأوسط',
    color: 'from-green-600 to-emerald-700',
    emoji: '💳',
  },
  {
    id: 'ngenius',
    label: 'N-Genius',
    desc_en: 'Network International – UAE & regional leader',
    desc_ar: 'نيتورك إنترناشيونال – الرائد الإقليمي',
    color: 'from-purple-600 to-violet-700',
    emoji: '🌐',
  },
  {
    id: 'urway',
    label: 'URWAY',
    desc_en: 'Saudi local payment acquirer',
    desc_ar: 'أرواي – مقدم خدمات الدفع السعودي',
    color: 'from-orange-500 to-orange-700',
    emoji: '🇸🇦',
  },
  {
    id: 'moyasar',
    label: 'Moyasar',
    desc_en: 'Developer-friendly Saudi payment API',
    desc_ar: 'ميسّر – واجهة مطورين سعودية سلسة',
    color: 'from-teal-500 to-teal-700',
    emoji: '⚡',
  },
  {
    id: 'custom',
    label: 'Custom / Generic REST',
    desc_en: 'Connect any REST-based terminal or aggregator',
    desc_ar: 'بوابة مخصصة أو أي نظام REST',
    color: 'from-gray-500 to-gray-700',
    emoji: '🔧',
  },
]

const defaultConfig = {
  enabled: false,
  provider: 'geidea',
  terminalLabel: '',
  apiBaseUrl: '',
  apiKey: '',
  apiSecret: '',
  merchantId: '',
  terminalId: '',
  outletId: '',
  webhookSecret: '',
  currency: 'SAR',
  environment: 'test',
  pollTimeoutSec: 120,
  autoProceedOnApproval: true,
}

/* ─── Status dot ─────────────────────────────────────────────────────────── */
function StatusDot({ ok, pulse }) {
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      {pulse && (
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
            ok ? 'bg-green-400' : 'bg-red-400'
          }`}
        />
      )}
      <span
        className={`relative inline-flex rounded-full w-2.5 h-2.5 ${
          ok ? 'bg-green-500' : 'bg-red-500'
        }`}
      />
    </span>
  )
}

/* ─── Password input with toggle ─────────────────────────────────────────── */
function SecretField({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder || ''}
          className="input pr-10"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

/* ─── Step Progress Bar ──────────────────────────────────────────────────── */
function StepBar({ step, total, isRtl }) {
  const steps_en = ['Choose Provider', 'Credentials', 'Test Connection', 'Confirm']
  const steps_ar = ['اختر المزود', 'بيانات الاعتماد', 'اختبار الاتصال', 'تأكيد']
  const steps = isRtl ? steps_ar : steps_en
  return (
    <div className="flex items-center gap-0 mb-8" dir={isRtl ? 'rtl' : 'ltr'}>
      {steps.map((label, i) => {
        const active = i === step
        const done = i < step
        return (
          <div key={i} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  done
                    ? 'bg-green-500 text-white'
                    : active
                    ? 'bg-primary-500 text-white ring-4 ring-primary-200 dark:ring-primary-900/40'
                    : 'bg-gray-100 dark:bg-dark-700 text-gray-400'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`mt-1.5 text-[10px] font-semibold text-center leading-tight ${
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : done
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 transition-all ${
                  done ? 'bg-green-400' : 'bg-gray-200 dark:bg-dark-600'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Recent Payments Mini Table ─────────────────────────────────────────── */
function RecentPayments({ isRtl }) {
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['pos-payments-recent'],
    queryFn: () => api.get('/pos/payments?limit=5').then((r) => r.data?.payments || r.data || []),
    staleTime: 30_000,
  })

  const statusBadge = (s) => {
    const map = {
      approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      declined: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      cancelled: 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-400',
      expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    }
    return map[s] || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="card-glass p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-4 h-4 text-primary-500" />
        <h4 className="font-semibold text-sm">
          {isRtl ? 'آخر 5 مدفوعات' : 'Recent 5 Payments'}
        </h4>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : payments.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">
          {isRtl ? 'لا توجد مدفوعات حتى الآن' : 'No payments yet'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-100 dark:border-dark-700">
                <th className="pb-2 text-start font-medium">
                  {isRtl ? 'المبلغ' : 'Amount'}
                </th>
                <th className="pb-2 text-start font-medium">
                  {isRtl ? 'الحالة' : 'Status'}
                </th>
                <th className="pb-2 text-start font-medium">
                  {isRtl ? 'البطاقة' : 'Card'}
                </th>
                <th className="pb-2 text-start font-medium">
                  {isRtl ? 'الوقت' : 'Time'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-dark-700">
              {payments.slice(0, 5).map((p, i) => (
                <tr key={p._id || i} className="hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                  <td className="py-2 font-bold text-gray-900 dark:text-white">
                    {p.currency || 'SAR'} {Number(p.amount || 0).toFixed(2)}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusBadge(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500 text-xs">
                    {p.cardScheme ? `${p.cardScheme} ****${p.cardLast4 || ''}` : '—'}
                  </td>
                  <td className="py-2 text-gray-400 text-xs">
                    {p.createdAt
                      ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function PosTerminalSettings({ tenant, language, onSave }) {
  const isRtl = language === 'ar'
  const [config, setConfig] = useState(defaultConfig)
  const [wizardStep, setWizardStep] = useState(0) // 0-3
  const [testResult, setTestResult] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const pt = tenant?.settings?.posTerminal
    if (pt) setConfig({ ...defaultConfig, ...pt })
  }, [tenant])

  const update = (patch) => setConfig((prev) => ({ ...prev, ...patch }))

  /* Test connection mutation */
  const testMutation = useMutation({
    mutationFn: () => api.post('/pos/test-connection', config).then((r) => r.data),
    onSuccess: (result) => {
      setTestResult(result)
      if (result.ok) toast.success(isRtl ? 'تم الاتصال بالبوابة بنجاح' : 'Gateway connected successfully')
      else toast.error(result.message || 'Connection failed')
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Connection failed'
      setTestResult({ ok: false, message: msg })
      toast.error(msg)
    },
  })

  /* Save */
  const handleSave = async () => {
    setSaving(true)
    try {
      if (onSave) {
        await onSave(config)
      } else {
        await api.put('/tenants/current', {
          settings: { ...(tenant?.settings || {}), posTerminal: config },
        })
        toast.success(isRtl ? 'تم حفظ الإعدادات' : 'Settings saved')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isSimulation = !config.apiKey && !config.apiSecret && !config.merchantId
  const selectedProvider = PROVIDERS.find((p) => p.id === config.provider) || PROVIDERS[0]

  /* ── Wizard Steps ─── */
  const renderStep = () => {
    /* Step 0: Provider picker */
    if (wizardStep === 0) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {isRtl
              ? 'اختر بوابة الدفع التي تستخدمها مع جهازك.'
              : 'Select the payment gateway connected to your terminal.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => update({ provider: p.id })}
                className={`rounded-2xl border-2 p-4 text-start transition-all hover:shadow-md ${
                  config.provider === p.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                    : 'border-gray-200 dark:border-dark-600 hover:border-primary-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-xl mb-3`}>
                  {p.emoji}
                </div>
                <div className="font-bold text-gray-900 dark:text-white text-sm">{p.label}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-snug">
                  {isRtl ? p.desc_ar : p.desc_en}
                </div>
                {config.provider === p.id && (
                  <div className="mt-2 flex items-center gap-1 text-primary-600 text-xs font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {isRtl ? 'محدد' : 'Selected'}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )
    }

    /* Step 1: Credentials */
    if (wizardStep === 1) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {isRtl
              ? `أدخل بيانات اعتماد بوابة ${selectedProvider.label}.`
              : `Enter your ${selectedProvider.label} gateway credentials.`}
          </p>

          {isSimulation && config.enabled && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/40 p-3 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? 'وضع المحاكاة: لم تُدخل بيانات اعتماد حقيقية، ستتم الموافقة على مدفوعات الاختبار تلقائياً.'
                  : 'Simulation mode: no real credentials entered — test payments will auto-approve.'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{isRtl ? 'اسم الجهاز (للعرض)' : 'Terminal Label'}</label>
              <input
                type="text"
                value={config.terminalLabel}
                onChange={(e) => update({ terminalLabel: e.target.value })}
                placeholder={isRtl ? 'مثال: كاشير الاستقبال' : 'e.g. Front Desk Terminal'}
                className="input"
              />
            </div>
            <div>
              <label className="label">{isRtl ? 'البيئة' : 'Environment'}</label>
              <select value={config.environment} onChange={(e) => update({ environment: e.target.value })} className="select">
                <option value="test">{isRtl ? 'اختبار / Sandbox' : 'Test / Sandbox'}</option>
                <option value="live">{isRtl ? 'مباشر / Production' : 'Live / Production'}</option>
              </select>
            </div>
            <div>
              <label className="label">{isRtl ? 'معرّف الجهاز' : 'Terminal ID'}</label>
              <input type="text" value={config.terminalId} onChange={(e) => update({ terminalId: e.target.value })} className="input" autoComplete="off" />
            </div>
            <div>
              <label className="label">{isRtl ? 'معرّف التاجر' : 'Merchant ID'}</label>
              <input type="text" value={config.merchantId} onChange={(e) => update({ merchantId: e.target.value })} className="input" autoComplete="off" />
            </div>
            <div>
              <label className="label">{isRtl ? 'معرّف المنفذ' : 'Outlet ID'}</label>
              <input type="text" value={config.outletId} onChange={(e) => update({ outletId: e.target.value })} className="input" autoComplete="off" />
            </div>
            <div>
              <label className="label">{isRtl ? 'العملة' : 'Currency'}</label>
              <input type="text" value={config.currency} onChange={(e) => update({ currency: e.target.value })} placeholder="SAR" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">{isRtl ? 'رابط واجهة البوابة (API Base URL)' : 'API Base URL'}</label>
              <input type="text" value={config.apiBaseUrl} onChange={(e) => update({ apiBaseUrl: e.target.value })} placeholder="https://..." className="input" autoComplete="off" />
            </div>
            <SecretField
              label={isRtl ? 'مفتاح الواجهة (API Key)' : 'API Key'}
              value={config.apiKey}
              onChange={(e) => update({ apiKey: e.target.value })}
            />
            <SecretField
              label={isRtl ? 'السر (API Secret)' : 'API Secret'}
              value={config.apiSecret}
              onChange={(e) => update({ apiSecret: e.target.value })}
            />
            <SecretField
              label={isRtl ? 'سر الـ Webhook' : 'Webhook Secret'}
              value={config.webhookSecret}
              onChange={(e) => update({ webhookSecret: e.target.value })}
            />
          </div>
        </div>
      )
    }

    /* Step 2: Test Connection */
    if (wizardStep === 2) {
      return (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="text-center space-y-2">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${selectedProvider.color} flex items-center justify-center text-4xl mx-auto shadow-lg`}>
              {selectedProvider.emoji}
            </div>
            <h4 className="font-bold text-lg text-gray-900 dark:text-white">{selectedProvider.label}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isRtl
                ? 'اضغط على "اختبار الاتصال" للتحقق من صحة بيانات الاعتماد.'
                : 'Click "Test Connection" to verify your credentials.'}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-300">
              <span className={`w-2 h-2 rounded-full ${config.environment === 'live' ? 'bg-red-500' : 'bg-amber-400'}`} />
              {config.environment === 'live' ? (isRtl ? 'بيئة مباشرة' : 'Live') : (isRtl ? 'بيئة اختبار' : 'Sandbox')}
            </div>
          </div>

          <button
            type="button"
            onClick={() => { setTestResult(null); testMutation.mutate() }}
            disabled={testMutation.isPending}
            className="btn btn-primary gap-2"
          >
            {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            {isRtl ? 'اختبار الاتصال' : 'Test Connection'}
          </button>

          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`w-full max-w-sm rounded-2xl border p-4 flex items-start gap-3 ${
                  testResult.ok
                    ? 'border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30'
                    : 'border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-semibold text-sm ${testResult.ok ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                    {testResult.ok
                      ? (isRtl ? 'تم الاتصال بنجاح' : 'Connection successful')
                      : (isRtl ? 'فشل الاتصال' : 'Connection failed')}
                  </p>
                  {testResult.message && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{testResult.message}</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )
    }

    /* Step 3: Confirmation */
    if (wizardStep === 3) {
      return (
        <div className="flex flex-col items-center gap-6 py-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <BadgeCheck className="w-14 h-14 text-green-500" />
          </motion.div>

          <div className="text-center">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">
              {isRtl ? 'تم الإعداد بنجاح' : 'Setup Complete'}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isRtl
                ? 'يمكنك الآن حفظ الإعدادات وبدء قبول المدفوعات.'
                : 'You can now save settings and start accepting payments.'}
            </p>
          </div>

          {/* Summary card */}
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{isRtl ? 'المزود' : 'Provider'}</span>
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <span>{selectedProvider.emoji}</span>
                <span>{selectedProvider.label}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{isRtl ? 'اسم الجهاز' : 'Terminal Label'}</span>
              <span className="font-medium text-sm text-gray-900 dark:text-white">
                {config.terminalLabel || (isRtl ? 'غير محدد' : 'Not set')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{isRtl ? 'البيئة' : 'Environment'}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                config.environment === 'live'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}>
                {config.environment === 'live' ? (isRtl ? 'مباشر' : 'Live') : (isRtl ? 'اختبار' : 'Test')}
              </span>
            </div>
            {testResult && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{isRtl ? 'اختبار الاتصال' : 'Connection Test'}</span>
                <div className="flex items-center gap-1.5">
                  <StatusDot ok={testResult.ok} />
                  <span className={`text-xs font-semibold ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                    {testResult.ok ? (isRtl ? 'ناجح' : 'Passed') : (isRtl ? 'فاشل' : 'Failed')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }

  /* ── Terminal status summary card ─── */
  const renderStatusCard = () => {
    const pt = tenant?.settings?.posTerminal
    if (!pt?.enabled) return null
    return (
      <div className="card-glass p-5 flex flex-wrap gap-4 items-center">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedProvider.color} flex items-center justify-center text-2xl`}>
          {selectedProvider.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <StatusDot ok={pt.lastTestStatus === 'ok'} pulse={pt.lastTestStatus === 'ok'} />
            <span className="font-semibold text-gray-900 dark:text-white">
              {pt.terminalLabel || selectedProvider.label}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
              pt.environment === 'live'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {pt.environment || 'test'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 flex-wrap">
            {pt.merchantId && <span>MID: {pt.merchantId}</span>}
            {pt.lastTestedAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {isRtl ? 'آخر اختبار:' : 'Last tested:'}&nbsp;
                {new Date(pt.lastTestedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
          pt.lastTestStatus === 'ok'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            : 'bg-gray-100 text-gray-600 dark:bg-dark-700 dark:text-gray-300'
        }`}>
          {pt.lastTestStatus === 'ok' ? (isRtl ? 'متصل' : 'Connected') : (isRtl ? 'غير مختبر' : 'Not tested')}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isRtl ? 'إعداد جهاز نقاط البيع (POS)' : 'POS Terminal Setup'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {isRtl
                  ? 'اربط جهازك لمعالجة بطاقات الدفع تلقائياً.'
                  : 'Connect your card terminal to auto-process card payments.'}
              </p>
            </div>
          </div>

          {/* Enabled toggle */}
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRtl ? 'مُفعّل' : 'Enabled'}
            </span>
            <div
              onClick={() => update({ enabled: !config.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                config.enabled ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                config.enabled ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0.5'
              }`} />
            </div>
          </label>
        </div>

        {/* Terminal status summary */}
        {renderStatusCard()}
      </div>

      {/* Wizard card */}
      {config.enabled && (
        <div className="card p-6">
          <StepBar step={wizardStep} total={4} isRtl={isRtl} />

          <AnimatePresence mode="wait">
            <motion.div
              key={wizardStep}
              initial={{ opacity: 0, x: isRtl ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isRtl ? 20 : -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className={`mt-8 flex ${wizardStep === 0 ? 'justify-end' : 'justify-between'} gap-3`}>
            {wizardStep > 0 && (
              <button
                type="button"
                onClick={() => setWizardStep((s) => s - 1)}
                className="btn btn-secondary gap-1"
              >
                {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                {isRtl ? 'السابق' : 'Back'}
              </button>
            )}
            {wizardStep < 3 ? (
              <button
                type="button"
                onClick={() => setWizardStep((s) => s + 1)}
                className="btn btn-primary gap-1"
              >
                {isRtl ? 'التالي' : 'Next'}
                {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isRtl ? 'حفظ الإعدادات' : 'Save Settings'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Advanced settings (always visible when enabled) */}
      {config.enabled && (
        <div className="card p-6 space-y-6">
          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary-500" />
            {isRtl ? 'الإعدادات المتقدمة' : 'Advanced Settings'}
          </h4>

          {/* autoProceedOnApproval */}
          <div className="card-glass p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                {isRtl ? 'إتمام الطلب تلقائياً عند الموافقة' : 'Auto-complete order on approval'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                {isRtl
                  ? 'عند تفعيل هذا الخيار، يُكمل النظام الطلب مباشرةً فور موافقة البوابة على الدفع دون الحاجة لتدخل يدوي.'
                  : 'When enabled, the system auto-completes the order the moment the gateway approves payment.'}
              </p>
            </div>
            <div
              onClick={() => update({ autoProceedOnApproval: !config.autoProceedOnApproval })}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ${
                config.autoProceedOnApproval ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                config.autoProceedOnApproval ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0.5'
              }`} />
            </div>
          </div>

          {/* Poll Timeout Slider */}
          <div className="card-glass p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {isRtl ? 'مهلة انتظار الدفع' : 'Payment Polling Timeout'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isRtl ? 'المدة القصوى لانتظار استجابة الجهاز' : 'Maximum wait time for terminal response'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary-600">{config.pollTimeoutSec}</span>
                <span className="text-xs text-gray-400 ml-1">{isRtl ? 'ثانية' : 'sec'}</span>
              </div>
            </div>
            <input
              type="range"
              min={30}
              max={300}
              step={10}
              value={config.pollTimeoutSec}
              onChange={(e) => update({ pollTimeoutSec: Number(e.target.value) })}
              className="w-full h-2 rounded-full bg-gray-200 dark:bg-dark-600 appearance-none cursor-pointer accent-primary-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>30s</span>
              <span className="text-gray-500">
                {config.pollTimeoutSec <= 60
                  ? (isRtl ? 'سريع' : 'Fast')
                  : config.pollTimeoutSec <= 150
                  ? (isRtl ? 'متوسط' : 'Standard')
                  : (isRtl ? 'طويل' : 'Long wait')}
              </span>
              <span>300s</span>
            </div>
          </div>

          {/* Quick-save for advanced settings */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isRtl ? 'حفظ' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {config.enabled && <RecentPayments isRtl={isRtl} />}
    </div>
  )
}
