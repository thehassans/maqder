import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Save, PlugZap } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function GeminiSettings() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)

  const { register, handleSubmit, reset, getValues } = useForm({
    defaultValues: {
      model: 'gemini-3-flash-preview',
      apiKey: '',
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['gemini-settings'],
    queryFn: () => api.get('/super-admin/settings/gemini').then((res) => res.data),
    onSuccess: (d) => {
      reset({
        model: d?.model || 'gemini-3-flash-preview',
        apiKey: '',
      })
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/super-admin/settings/gemini', payload).then((res) => res.data),
    onSuccess: (d) => {
      toast.success(language === 'ar' ? 'تم حفظ إعدادات Gemini' : 'Gemini settings saved')
      queryClient.setQueryData(['gemini-settings'], d)
      queryClient.invalidateQueries(['gemini-settings'])
      reset({
        model: d?.model || 'gemini-3-flash-preview',
        apiKey: '',
      })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving settings'),
  })

  const testMutation = useMutation({
    mutationFn: () => api.post('/super-admin/settings/gemini/test', { apiKey: getValues('apiKey') }).then((res) => res.data),
    onSuccess: (d) => {
      toast.success(language === 'ar' ? 'تم الاتصال بنجاح' : 'Connection successful')
      if (d?.responseText) {
        toast.success(d.responseText)
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Connection test failed'),
  })

  const onSubmit = (formData) => {
    const payload = {
      model: String(formData.model || 'gemini-3-flash-preview').trim(),
    }

    const apiKey = String(formData.apiKey || '').trim()
    if (apiKey) payload.apiKey = apiKey

    saveMutation.mutate(payload)
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'إعدادات Gemini 2.5 Flash' : 'Gemini 2.5 Flash Settings'}
        </h1>
        <p className="text-gray-500 mt-1">
          {language === 'ar' ? 'إعداد مفتاح API واختبار الاتصال' : 'Configure the API key and test connectivity'}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <p className="font-medium text-green-800 dark:text-green-300">
              {language === 'ar' ? 'Gemini مفعّل تلقائياً عند وجود مفتاح API' : 'Gemini is automatically enabled when API key is configured'}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {data?.hasApiKey 
                ? (language === 'ar' ? '✓ مفتاح API محفوظ - الترجمة الحية نشطة' : '✓ API key saved - Live translation is active')
                : (language === 'ar' ? 'أدخل مفتاح API لتفعيل الترجمة الحية' : 'Enter an API key to enable live translation')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{language === 'ar' ? 'الموديل' : 'Model'}</label>
              <input {...register('model')} className="input" placeholder="gemini-2.5-flash" />
            </div>

            <div>
              <label className="label">{language === 'ar' ? 'مفتاح API' : 'API Key'}</label>
              <input
                type="password"
                {...register('apiKey')}
                className="input"
                placeholder={data?.hasApiKey ? (language === 'ar' ? `محفوظ: ${data.apiKeyMasked}` : `Saved: ${data.apiKeyMasked}`) : (language === 'ar' ? 'أدخل المفتاح' : 'Enter key')}
              />
              <p className="text-xs text-gray-500 mt-1">
                {language === 'ar' ? 'اتركه فارغاً للاحتفاظ بالمفتاح الحالي' : 'Leave empty to keep the current key'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={testMutation.isPending || !data?.hasApiKey}
              onClick={() => testMutation.mutate()}
              className="btn btn-secondary"
            >
              {testMutation.isPending ? <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> : <><PlugZap className="w-4 h-4" />{language === 'ar' ? 'اختبار الاتصال' : 'Test Connection'}</>}
            </button>

            <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
              {saveMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{language === 'ar' ? 'حفظ' : 'Save'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
