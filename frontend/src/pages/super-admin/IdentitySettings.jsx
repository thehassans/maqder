import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Globe, Save, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function IdentitySettings() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      enabled: false,
      provider: 'custom_webhook',
      endpoint: '',
      apiKey: '',
      ocrEnabled: false,
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-identity-settings'],
    queryFn: () => api.get('/super-admin/settings/identity').then((res) => res.data),
  })

  useEffect(() => {
    const identity = data?.identity
    if (!identity) return
    reset({
      enabled: !!identity.enabled,
      provider: identity.provider || 'custom_webhook',
      endpoint: identity.endpoint || '',
      apiKey: '',
      ocrEnabled: !!identity.ocrEnabled,
    })
  }, [data, reset])

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/super-admin/settings/identity', payload).then((res) => res.data),
    onSuccess: (response) => {
      queryClient.setQueryData(['super-admin-identity-settings'], response)
      queryClient.invalidateQueries(['super-admin-identity-settings'])
      toast.success(isArabic ? 'تم حفظ إعدادات الهوية' : 'Identity settings saved')
      const identity = response?.identity
      reset({
        enabled: !!identity?.enabled,
        provider: identity?.provider || 'custom_webhook',
        endpoint: identity?.endpoint || '',
        apiKey: '',
        ocrEnabled: !!identity?.ocrEnabled,
      })
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to save identity settings'),
  })

  const onSubmit = (formData) => {
    const payload = {
      identity: {
        enabled: !!formData.enabled,
        provider: String(formData.provider || 'custom_webhook').trim() || 'custom_webhook',
        endpoint: String(formData.endpoint || '').trim(),
        ocrEnabled: !!formData.ocrEnabled,
      },
    }

    const apiKey = String(formData.apiKey || '').trim()
    if (apiKey) {
      payload.identity.apiKey = apiKey
    }

    saveMutation.mutate(payload)
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  const identity = data?.identity || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isArabic ? 'إعدادات مزود الهوية' : 'Identity Provider Settings'}</h1>
        <p className="mt-1 text-gray-500">{isArabic ? 'أدخل بيانات API العامة هنا ليتم استخدامها كقيمة افتراضية لكل المستأجرين عند عدم وجود إعدادات خاصة بهم.' : 'Enter the global API credentials here to use them as defaults for tenants that do not have their own identity settings.'}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">{isArabic ? 'استخدام عام مع دعم تجاوز المستأجر' : 'Global defaults with tenant overrides'}</p>
                <p className="mt-1 leading-6">{isArabic ? 'إذا لم يضع المستأجر endpoint أو API key خاص به، سيستخدم النظام هذه القيم العامة تلقائياً في جلب تفاصيل الهوية وOCR.' : 'If a tenant does not configure its own endpoint or API key, the system will automatically use these global values for identity lookup and OCR.'}</p>
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'إعدادات المزود' : 'Provider Configuration'}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="card-glass p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{isArabic ? 'تفعيل المزود' : 'Enable provider'}</span>
                <input type="checkbox" {...register('enabled')} className="h-4 w-4" />
              </label>
              <label className="card-glass p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{isArabic ? 'تفعيل OCR' : 'Enable OCR'}</span>
                <input type="checkbox" {...register('ocrEnabled')} className="h-4 w-4" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">{isArabic ? 'نوع المزود' : 'Provider Type'}</label>
                <select {...register('provider')} className="select">
                  <option value="custom_webhook">{isArabic ? 'Webhook مخصص' : 'Custom Webhook'}</option>
                </select>
              </div>

              <div>
                <label className="label">{isArabic ? 'رابط الـ Endpoint' : 'Endpoint URL'}</label>
                <input {...register('endpoint')} className="input" placeholder="https://api.example.com/identity" />
              </div>

              <div className="md:col-span-2">
                <label className="label">API Key</label>
                <input
                  type="password"
                  {...register('apiKey')}
                  className="input"
                  placeholder={identity?.hasApiKey ? (isArabic ? `محفوظ: ${identity.apiKeyMasked}` : `Saved: ${identity.apiKeyMasked}`) : (isArabic ? 'أدخل المفتاح' : 'Enter API key')}
                />
                <p className="mt-1 text-xs text-gray-500">{isArabic ? 'اتركه فارغاً للاحتفاظ بالمفتاح الحالي.' : 'Leave empty to keep the current key.'}</p>
              </div>
            </div>
          </section>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-300">
            <p className="font-semibold">{isArabic ? 'صيغة الطلب إلى المزود' : 'Provider request shape'}</p>
            <p className="mt-2 leading-7">{isArabic ? 'سيتم إرسال body يحتوي على mode و nationalId و language و images.front و images.back. يجب أن يعيد المزود details أو lookup ليتم تعبئة نموذج الموظف تلقائياً.' : 'The server will send mode, nationalId, language, and images.front / images.back in the request body. Your provider should return details or lookup so the employee form can be auto-filled.'}</p>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
              {saveMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{isArabic ? 'حفظ' : 'Save'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
