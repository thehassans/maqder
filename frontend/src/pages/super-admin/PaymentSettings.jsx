import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Save, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react'
import api from '../../lib/api'

export default function PaymentSettings() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    enabled: false,
    publishableKey: '',
    secretKey: '',
    webhookSecret: '',
    environment: 'test',
  })
  const [showSecret, setShowSecret] = useState(false)
  const [showWebhook, setShowWebhook] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-payment-settings'],
    queryFn: () => api.get('/super-admin/settings/payment').then((res) => res.data),
  })

  useEffect(() => {
    if (data?.payment?.moyasar) {
      const m = data.payment.moyasar
      setForm({
        enabled: m.enabled,
        publishableKey: m.publishableKey || '',
        secretKey: '',
        webhookSecret: '',
        environment: m.environment || 'test',
      })
    }
  }, [data])

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/super-admin/settings/payment', { payment: { moyasar: payload } }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-payment-settings'] })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    },
  })

  const handleSave = () => {
    const payload = { ...form }
    if (!payload.secretKey) delete payload.secretKey
    if (!payload.webhookSecret) delete payload.webhookSecret
    saveMutation.mutate(payload)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const moyasar = data?.payment?.moyasar || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment Gateway Settings</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Configure Moyasar payment gateway for demo user upgrades</p>
      </div>

      <div className="max-w-2xl space-y-5 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-6">
        {/* Provider Info */}
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-dark-700 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
            <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Moyasar</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Saudi payment gateway — Visa, Mastercard, Mada, Apple Pay</p>
          </div>
        </div>

        {/* Enabled Toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Moyasar Payments</span>
          </label>
        </div>

        {/* Environment */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Environment</label>
          <select
            value={form.environment}
            onChange={(e) => setForm({ ...form, environment: e.target.value })}
            className="w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 py-2.5 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="test">Test (Sandbox)</option>
            <option value="live">Live (Production)</option>
          </select>
        </div>

        {/* Publishable Key */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Publishable Key</label>
          <input
            type="text"
            value={form.publishableKey}
            onChange={(e) => setForm({ ...form, publishableKey: e.target.value })}
            placeholder="pk_test_..."
            className="w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 py-2.5 px-4 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Secret Key */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Secret Key {moyasar.hasSecretKey && <span className="text-xs text-gray-400">(currently set: {moyasar.secretKeyMasked})</span>}
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
              placeholder={moyasar.hasSecretKey ? '•••••••• (enter new to replace)' : 'sk_test_...'}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 py-2.5 px-4 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Webhook Secret {moyasar.hasWebhookSecret && <span className="text-xs text-gray-400">(currently set: {moyasar.webhookSecretMasked})</span>}
          </label>
          <div className="relative">
            <input
              type={showWebhook ? 'text' : 'password'}
              value={form.webhookSecret}
              onChange={(e) => setForm({ ...form, webhookSecret: e.target.value })}
              placeholder={moyasar.hasWebhookSecret ? '•••••••• (enter new to replace)' : 'whsec_...'}
              className="w-full rounded-lg border border-gray-300 dark:border-dark-600 bg-white dark:bg-dark-800 py-2.5 px-4 pr-10 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="button"
              onClick={() => setShowWebhook(!showWebhook)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Webhook URL Info */}
        <div className="rounded-lg bg-gray-50 dark:bg-dark-700 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Webhook URL:</span> POST /api/payments/webhook
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-semibold">Callback URL:</span> GET /api/payments/callback
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Settings
          </button>
          {saveSuccess && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4" />
              Saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
