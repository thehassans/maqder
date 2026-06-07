import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-dark-600'
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
      checked ? 'translate-x-6' : 'translate-x-1'
    }`} />
  </button>
)

const Input = ({ label, value, onChange, type = 'text', placeholder, hint }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-dark-600 bg-white dark:bg-dark-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
    />
    {hint && <p className="text-xs text-gray-400">{hint}</p>}
  </div>
)

const EnvBadge = ({ value, onChange }) => (
  <div className="flex gap-2">
    {['sandbox', 'production'].map(env => (
      <button
        key={env}
        type="button"
        onClick={() => onChange(env)}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          value === env
            ? env === 'production'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
              : 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
            : 'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400'
        }`}
      >
        {env === 'sandbox' ? '🧪 Sandbox' : '🚀 Production'}
      </button>
    ))}
  </div>
)

const IntegrationCard = ({ icon, name, nameAr, description, badge, children, enabled, onToggleEnabled }) => (
  <div className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
    enabled
      ? 'border-emerald-200 dark:border-emerald-800/50 shadow-lg shadow-emerald-500/5'
      : 'border-gray-200 dark:border-dark-700'
  }`}>
    {/* Header */}
    <div className={`px-5 py-4 flex items-center gap-4 ${
      enabled ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : 'bg-gray-50 dark:bg-dark-800'
    }`}>
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
        enabled ? 'bg-white dark:bg-dark-700 shadow-sm' : 'bg-gray-100 dark:bg-dark-700'
      }`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-gray-900 dark:text-white">{name}</h4>
          {badge && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-semibold ${enabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
          {enabled ? 'Active' : 'Disabled'}
        </span>
        <Toggle checked={enabled} onChange={onToggleEnabled} />
      </div>
    </div>
    {/* Body */}
    {enabled && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="p-5 bg-white dark:bg-dark-800 space-y-4"
      >
        {children}
      </motion.div>
    )}
  </div>
)

export default function CarRentalApiSettings({ tenant, isAr }) {
  const queryClient = useQueryClient()
  const t = (en, ar) => isAr ? ar : en

  const cri = tenant?.settings?.carRentalIntegrations || {}

  const [tamm, setTamm] = useState({
    enabled: cri.tamm?.enabled || false,
    apiKey: cri.tamm?.apiKey || '',
    apiSecret: cri.tamm?.apiSecret || '',
    companyLicenseNumber: cri.tamm?.companyLicenseNumber || '',
    environment: cri.tamm?.environment || 'sandbox',
    autoSyncContracts: cri.tamm?.autoSyncContracts || false,
  })

  const [najm, setNajm] = useState({
    enabled: cri.najm?.enabled || false,
    apiKey: cri.najm?.apiKey || '',
    clientId: cri.najm?.clientId || '',
    clientSecret: cri.najm?.clientSecret || '',
    environment: cri.najm?.environment || 'sandbox',
    autoCheckOnCheckout: cri.najm?.autoCheckOnCheckout !== false,
  })

  const [wathiq, setWathiq] = useState({
    enabled: cri.wathiq?.enabled || false,
    apiKey: cri.wathiq?.apiKey || '',
    appId: cri.wathiq?.appId || '',
    environment: cri.wathiq?.environment || 'sandbox',
    autoVerifyId: cri.wathiq?.autoVerifyId !== false,
  })

  const [sms, setSms] = useState({
    enabled: cri.smsNotifications?.enabled || false,
    provider: cri.smsNotifications?.provider || 'taqnyat',
    apiKey: cri.smsNotifications?.apiKey || '',
    senderId: cri.smsNotifications?.senderId || '',
    sendOnCheckout: cri.smsNotifications?.sendOnCheckout !== false,
    sendOnCheckin: cri.smsNotifications?.sendOnCheckin !== false,
    sendOnOverdue: cri.smsNotifications?.sendOnOverdue !== false,
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/tenants/current', data),
    onSuccess: (res) => {
      toast.success(t('Car rental API settings saved', 'تم حفظ إعدادات واجهات التأجير'))
      queryClient.invalidateQueries(['tenant-settings'])
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Error saving')
  })

  const handleSave = () => {
    updateMutation.mutate({
      settings: {
        carRentalIntegrations: {
          tamm,
          najm,
          wathiq,
          smsNotifications: sms,
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {t('Car Rental API Integrations', 'واجهات برمجة تأجير السيارات')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t(
              'Connect to Saudi government & third-party platforms to automate your rental workflow.',
              'اربط منصات حكومية وخارجية لأتمتة عمليات التأجير'
            )}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-60"
        >
          {updateMutation.isPending
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          }
          {t('Save All', 'حفظ الكل')}
        </button>
      </div>

      {/* Overview Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Tamm', icon: '🏛️', active: tamm.enabled },
          { label: 'NAJM', icon: '🛡️', active: najm.enabled },
          { label: 'Wathiq', icon: '🪪', active: wathiq.enabled },
          { label: t('SMS Alerts', 'تنبيهات SMS'), icon: '📱', active: sms.enabled },
        ].map(item => (
          <div
            key={item.label}
            className={`rounded-2xl p-4 text-center border transition-all ${
              item.active
                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40'
                : 'bg-gray-50 dark:bg-dark-800 border-gray-200 dark:border-dark-700'
            }`}
          >
            <div className="text-2xl mb-1">{item.icon}</div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.label}</p>
            <span className={`text-xs font-semibold ${item.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
              {item.active ? t('Connected', 'متصل') : t('Off', 'معطل')}
            </span>
          </div>
        ))}
      </div>

      {/* ── Tamm ── */}
      <IntegrationCard
        icon="🏛️"
        name="Tamm (Amakin)"
        nameAr="تمم (أماكن)"
        description={t("Saudi Ministry of Transport – rental contract registry", "وزارة النقل السعودية – سجل عقود التأجير")}
        badge="MOT"
        enabled={tamm.enabled}
        onToggleEnabled={v => setTamm(t => ({ ...t, enabled: v }))}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('API Key', 'مفتاح API')} value={tamm.apiKey} onChange={v => setTamm(t => ({ ...t, apiKey: v }))} type="password" placeholder="tamm_key_..." />
          <Input label={t('API Secret', 'سر API')} value={tamm.apiSecret} onChange={v => setTamm(t => ({ ...t, apiSecret: v }))} type="password" placeholder="tamm_secret_..." />
          <Input label={t('Company License No.', 'رقم رخصة الشركة')} value={tamm.companyLicenseNumber} onChange={v => setTamm(t => ({ ...t, companyLicenseNumber: v }))} placeholder="7100XXXXXXX" />
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Environment', 'البيئة')}</label>
            <EnvBadge value={tamm.environment} onChange={v => setTamm(t => ({ ...t, environment: v }))} />
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('Auto-sync contracts to Tamm', 'مزامنة العقود تلقائياً إلى تمم')}</p>
            <p className="text-xs text-gray-500">{t('Push every checkout to the government registry', 'إرسال كل عقد تأجير إلى سجل وزارة النقل')}</p>
          </div>
          <Toggle checked={tamm.autoSyncContracts} onChange={v => setTamm(t => ({ ...t, autoSyncContracts: v }))} />
        </div>
      </IntegrationCard>

      {/* ── NAJM ── */}
      <IntegrationCard
        icon="🛡️"
        name="NAJM Insurance"
        nameAr="نجم للتأمين"
        description={t("Saudi Insurance Services – accident & claim verification", "شركة نجم – التحقق من التأمين والحوادث")}
        badge="NAJM"
        enabled={najm.enabled}
        onToggleEnabled={v => setNajm(n => ({ ...n, enabled: v }))}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('API Key', 'مفتاح API')} value={najm.apiKey} onChange={v => setNajm(n => ({ ...n, apiKey: v }))} type="password" placeholder="najm_..." />
          <Input label={t('Client ID', 'معرف العميل')} value={najm.clientId} onChange={v => setNajm(n => ({ ...n, clientId: v }))} placeholder="client_id" />
          <Input label={t('Client Secret', 'سر العميل')} value={najm.clientSecret} onChange={v => setNajm(n => ({ ...n, clientSecret: v }))} type="password" placeholder="client_secret" />
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Environment', 'البيئة')}</label>
            <EnvBadge value={najm.environment} onChange={v => setNajm(n => ({ ...n, environment: v }))} />
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('Auto-check customer at checkout', 'التحقق التلقائي عند التأجير')}</p>
            <p className="text-xs text-gray-500">{t('Verify insurance & accident history before rental', 'التحقق من التأمين وتاريخ الحوادث قبل التأجير')}</p>
          </div>
          <Toggle checked={najm.autoCheckOnCheckout} onChange={v => setNajm(n => ({ ...n, autoCheckOnCheckout: v }))} />
        </div>
      </IntegrationCard>

      {/* ── Wathiq ── */}
      <IntegrationCard
        icon="🪪"
        name="Wathiq (SAFCSP)"
        nameAr="وثيق"
        description={t("National identity & document verification – هيئة الاتصالات", "التحقق من الهوية الوطنية – وثيق")}
        badge="NIC"
        enabled={wathiq.enabled}
        onToggleEnabled={v => setWathiq(w => ({ ...w, enabled: v }))}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label={t('API Key', 'مفتاح API')} value={wathiq.apiKey} onChange={v => setWathiq(w => ({ ...w, apiKey: v }))} type="password" placeholder="wathiq_..." />
          <Input label={t('App ID', 'معرف التطبيق')} value={wathiq.appId} onChange={v => setWathiq(w => ({ ...w, appId: v }))} placeholder="app_id" />
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Environment', 'البيئة')}</label>
            <EnvBadge value={wathiq.environment} onChange={v => setWathiq(w => ({ ...w, environment: v }))} />
          </div>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('Auto-verify ID on customer registration', 'تحقق تلقائي عند تسجيل العميل')}</p>
            <p className="text-xs text-gray-500">{t('Verify Iqama/National ID against government DB', 'التحقق من الإقامة/الهوية من قاعدة بيانات الحكومة')}</p>
          </div>
          <Toggle checked={wathiq.autoVerifyId} onChange={v => setWathiq(w => ({ ...w, autoVerifyId: v }))} />
        </div>
      </IntegrationCard>

      {/* ── SMS ── */}
      <IntegrationCard
        icon="📱"
        name={t('SMS Notifications', 'إشعارات SMS')}
        description={t('Taqnyat / Unifonic / Msegat – automated customer alerts', 'تقنيات / يونيفونيك / مسجات – إشعارات تلقائية')}
        enabled={sms.enabled}
        onToggleEnabled={v => setSms(s => ({ ...s, enabled: v }))}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1 col-span-full">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('Provider', 'المزود')}</label>
            <div className="flex flex-wrap gap-2">
              {['taqnyat', 'unifonic', 'msegat', 'custom'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSms(s => ({ ...s, provider: p }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    sms.provider === p
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <Input label={t('API Key', 'مفتاح API')} value={sms.apiKey} onChange={v => setSms(s => ({ ...s, apiKey: v }))} type="password" placeholder="sms_api_key" />
          <Input label={t('Sender ID', 'معرف المرسل')} value={sms.senderId} onChange={v => setSms(s => ({ ...s, senderId: v }))} placeholder="MAQDER" hint={t('Max 11 chars', 'حد أقصى 11 حرف')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: t('On Checkout', 'عند التأجير'), key: 'sendOnCheckout', emoji: '🚗' },
            { label: t('On Check-In', 'عند الإرجاع'), key: 'sendOnCheckin', emoji: '✅' },
            { label: t('On Overdue', 'عند التأخر'), key: 'sendOnOverdue', emoji: '⚠️' },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-dark-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.emoji} {item.label}</span>
              <Toggle checked={sms[item.key]} onChange={v => setSms(s => ({ ...s, [item.key]: v }))} />
            </div>
          ))}
        </div>
      </IntegrationCard>

      {/* Docs Notice */}
      <div className="rounded-2xl p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/40 flex gap-3">
        <span className="text-xl flex-shrink-0">ℹ️</span>
        <div className="text-sm text-blue-800 dark:text-blue-300">
          <p className="font-bold mb-1">{t('Integration Documentation', 'توثيق التكاملات')}</p>
          <ul className="space-y-0.5 text-blue-700 dark:text-blue-400 text-xs">
            <li>• <strong>Tamm:</strong> developer.tamm.sa</li>
            <li>• <strong>NAJM:</strong> developer.najm.sa</li>
            <li>• <strong>Wathiq:</strong> wathiq.com/api</li>
            <li>• <strong>Taqnyat:</strong> api.taqnyat.sa</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
