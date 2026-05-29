import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { CreditCard, Save, Wifi, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const PROVIDERS = [
  { id: 'geidea', label: 'Geidea' },
  { id: 'paytabs', label: 'PayTabs' },
  { id: 'ngenius', label: 'Network International (N-Genius)' },
  { id: 'urway', label: 'URWAY' },
  { id: 'moyasar', label: 'Moyasar' },
  { id: 'custom', label: 'Custom / Generic REST' },
]

const defaultConfig = {
  enabled: false,
  provider: 'custom',
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

export default function PosTerminalSettings({ tenant }) {
  const { language } = useSelector((state) => state.ui)
  const isRtl = language === 'ar'
  const queryClient = useQueryClient()
  const [config, setConfig] = useState(defaultConfig)
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    const pt = tenant?.settings?.posTerminal
    if (pt) {
      setConfig({ ...defaultConfig, ...pt })
    }
  }, [tenant])

  const update = (patch) => setConfig((prev) => ({ ...prev, ...patch }))

  const saveMutation = useMutation({
    mutationFn: () => api.put('/tenants/current', {
      settings: { ...(tenant?.settings || {}), posTerminal: config },
    }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم حفظ إعدادات جهاز الدفع' : 'Card machine settings saved')
      queryClient.invalidateQueries(['tenant-settings'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to save'),
  })

  const testMutation = useMutation({
    mutationFn: () => api.post('/pos/test-connection', config).then((res) => res.data),
    onSuccess: (result) => {
      setTestResult(result)
      if (result.ok) toast.success(isRtl ? 'تم الاتصال بالبوابة' : 'Connected to gateway')
      else toast.error(result.message || 'Connection failed')
    },
    onError: (err) => {
      setTestResult({ ok: false, message: err.response?.data?.error || 'Connection failed' })
      toast.error(err.response?.data?.error || 'Connection failed')
    },
  })

  const isSimulation = !config.apiKey && !config.apiSecret && !config.merchantId

  const field = (label, key, opts = {}) => (
    <div>
      <label className="label">{label}</label>
      <input
        type={opts.type || 'text'}
        value={config[key] ?? ''}
        onChange={(e) => update({ [key]: opts.number ? Number(e.target.value) : e.target.value })}
        placeholder={opts.placeholder || ''}
        className="input"
        autoComplete="off"
      />
    </div>
  )

  return (
    <div className="space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{isRtl ? 'جهاز الدفع بالبطاقة (POS)' : 'Card Machine (POS Terminal)'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRtl
                  ? 'اربط جهاز نقاط البيع لمعالجة مدفوعات البطاقات تلقائياً عند إتمام الطلب.'
                  : 'Connect your card terminal to process card payments and auto-complete orders.'}
              </p>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!config.enabled}
              onChange={(e) => update({ enabled: e.target.checked })}
              className="w-5 h-5 rounded accent-primary-600"
            />
            <span className="font-medium">{isRtl ? 'مُفعّل' : 'Enabled'}</span>
          </label>
        </div>

        {isSimulation && config.enabled && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/40 p-3 text-sm text-amber-700 dark:text-amber-400">
            {isRtl
              ? 'وضع المحاكاة نشط: لم تُدخل بيانات اعتماد، لذا ستتم الموافقة على مدفوعات الاختبار تلقائياً.'
              : 'Simulation mode active: no credentials entered, so test payments auto-approve. Enter your provider credentials to go live.'}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{isRtl ? 'مزود الخدمة' : 'Provider'}</label>
            <select value={config.provider} onChange={(e) => update({ provider: e.target.value })} className="select">
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">{isRtl ? 'البيئة' : 'Environment'}</label>
            <select value={config.environment} onChange={(e) => update({ environment: e.target.value })} className="select">
              <option value="test">{isRtl ? 'اختبار' : 'Test / Sandbox'}</option>
              <option value="live">{isRtl ? 'مباشر' : 'Live / Production'}</option>
            </select>
          </div>

          {field(isRtl ? 'اسم الجهاز (للعرض)' : 'Terminal Label', 'terminalLabel', { placeholder: 'Front desk terminal' })}
          {field(isRtl ? 'معرّف الجهاز' : 'Terminal ID', 'terminalId')}
          {field(isRtl ? 'معرّف التاجر' : 'Merchant ID', 'merchantId')}
          {field(isRtl ? 'معرّف المنفذ' : 'Outlet ID', 'outletId')}
          {field(isRtl ? 'رابط واجهة البوابة (API Base URL)' : 'API Base URL', 'apiBaseUrl', { placeholder: 'https://...' })}
          {field(isRtl ? 'مفتاح الواجهة (API Key)' : 'API Key', 'apiKey', { type: 'password' })}
          {field(isRtl ? 'السر (API Secret)' : 'API Secret', 'apiSecret', { type: 'password' })}
          {field(isRtl ? 'سر الـ Webhook' : 'Webhook Secret', 'webhookSecret', { type: 'password' })}
          {field(isRtl ? 'العملة' : 'Currency', 'currency', { placeholder: 'SAR' })}
          {field(isRtl ? 'مهلة الانتظار (ثانية)' : 'Payment Timeout (sec)', 'pollTimeoutSec', { type: 'number', number: true })}
        </div>

        <label className="mt-4 inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!config.autoProceedOnApproval}
            onChange={(e) => update({ autoProceedOnApproval: e.target.checked })}
            className="w-5 h-5 rounded accent-primary-600"
          />
          <span>{isRtl ? 'إتمام الطلب تلقائياً عند الموافقة على الدفع' : 'Auto-complete the order when payment is approved'}</span>
        </label>

        {testResult && (
          <div className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-sm ${
            testResult.ok
              ? 'bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/10 dark:text-red-400'
          }`}>
            {testResult.ok ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="btn btn-secondary"
          >
            {testMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            {isRtl ? 'اختبار الاتصال' : 'Test Connection'}
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="btn btn-primary"
          >
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isRtl ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
