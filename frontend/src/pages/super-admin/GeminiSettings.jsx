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
      geminiModel: 'gemini-2.5-flash',
      geminiKey: '',
      geminiEnabled: true,
      openaiModel: 'gpt-4o-mini',
      openaiKey: '',
      openaiEnabled: true,
      grokModel: 'grok-2-latest',
      grokKey: '',
      grokEnabled: true,
      groqModel: 'llama3-8b-8192',
      groqKey: '',
      groqEnabled: true,
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['ai-settings'],
    queryFn: () => api.get('/super-admin/settings/ai').then((res) => res.data),
    onSuccess: (d) => {
      reset({
        geminiModel: d?.gemini?.model || 'gemini-2.5-flash',
        geminiKey: '',
        geminiEnabled: d?.gemini?.enabled !== false,
        openaiModel: d?.openai?.model || 'gpt-4o-mini',
        openaiKey: '',
        openaiEnabled: d?.openai?.enabled !== false,
        grokModel: d?.grok?.model || 'grok-2-latest',
        grokKey: '',
        grokEnabled: d?.grok?.enabled !== false,
        groqModel: d?.groq?.model || 'llama3-8b-8192',
        groqKey: '',
        groqEnabled: d?.groq?.enabled !== false,
      })
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/super-admin/settings/ai', payload).then((res) => res.data),
    onSuccess: (d) => {
      toast.success(language === 'ar' ? 'تم حفظ إعدادات الذكاء الاصطناعي' : 'AI settings saved')
      queryClient.setQueryData(['ai-settings'], d)
      queryClient.invalidateQueries(['ai-settings'])
      reset({
        geminiModel: d?.gemini?.model || 'gemini-2.5-flash',
        geminiKey: '',
        geminiEnabled: d?.gemini?.enabled !== false,
        openaiModel: d?.openai?.model || 'gpt-4o-mini',
        openaiKey: '',
        openaiEnabled: d?.openai?.enabled !== false,
        grokModel: d?.grok?.model || 'grok-2-latest',
        grokKey: '',
        grokEnabled: d?.grok?.enabled !== false,
        groqModel: d?.groq?.model || 'llama3-8b-8192',
        groqKey: '',
        groqEnabled: d?.groq?.enabled !== false,
      })
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error saving settings'),
  })

  const testMutation = useMutation({
    mutationFn: (provider) => api.post('/super-admin/settings/ai/test', { 
      provider, 
      apiKey: getValues(`${provider}Key`) 
    }).then((res) => res.data),
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
      gemini: {
        model: String(formData.geminiModel || 'gemini-2.5-flash').trim(),
        enabled: formData.geminiEnabled
      },
      openai: {
        model: String(formData.openaiModel || 'gpt-4o-mini').trim(),
        enabled: formData.openaiEnabled
      },
      grok: {
        model: String(formData.grokModel || 'grok-2-latest').trim(),
        enabled: formData.grokEnabled
      },
      groq: {
        model: String(formData.groqModel || 'llama3-8b-8192').trim(),
        enabled: formData.groqEnabled
      }
    }

    if (String(formData.geminiKey || '').trim()) payload.gemini.apiKey = String(formData.geminiKey).trim()
    if (String(formData.openaiKey || '').trim()) payload.openai.apiKey = String(formData.openaiKey).trim()
    if (String(formData.grokKey || '').trim()) payload.grok.apiKey = String(formData.grokKey).trim()
    if (String(formData.groqKey || '').trim()) payload.groq.apiKey = String(formData.groqKey).trim()

    saveMutation.mutate(payload)
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'إعدادات الذكاء الاصطناعي (AI)' : 'AI Providers Settings'}
        </h1>
        <p className="text-gray-500 mt-1">
          {language === 'ar' ? 'إعداد مفاتيح API للترجمة والتحليل (Gemini, OpenAI, Grok, Groq)' : 'Configure API keys for translation & analysis (Gemini, OpenAI, Grok, Groq)'}
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Gemini */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-2">
              <h3 className="text-lg font-bold">Google Gemini</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('geminiEnabled')} className="checkbox" />
                <span className="text-sm">{language === 'ar' ? 'مفعل' : 'Enabled'}</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{language === 'ar' ? 'الموديل' : 'Model'}</label>
                <input {...register('geminiModel')} className="input" placeholder="gemini-2.5-flash" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'مفتاح API' : 'API Key'}</label>
                <input type="password" {...register('geminiKey')} className="input" placeholder={data?.gemini?.hasApiKey ? `Saved: ${data.gemini.apiKeyMasked}` : 'Enter key'} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" disabled={testMutation.isPending || !data?.gemini?.hasApiKey} onClick={() => testMutation.mutate('gemini')} className="btn btn-secondary btn-sm">
                <PlugZap className="w-4 h-4" />{language === 'ar' ? 'اختبار Gemini' : 'Test Gemini'}
              </button>
            </div>
          </div>

          {/* Grok */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-2">
              <h3 className="text-lg font-bold">xAI Grok (Fallback 1)</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('grokEnabled')} className="checkbox" />
                <span className="text-sm">{language === 'ar' ? 'مفعل' : 'Enabled'}</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{language === 'ar' ? 'الموديل' : 'Model'}</label>
                <input {...register('grokModel')} className="input" placeholder="grok-2-latest" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'مفتاح API' : 'API Key'}</label>
                <input type="password" {...register('grokKey')} className="input" placeholder={data?.grok?.hasApiKey ? `Saved: ${data.grok.apiKeyMasked}` : 'Enter key'} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" disabled={testMutation.isPending || !data?.grok?.hasApiKey} onClick={() => testMutation.mutate('grok')} className="btn btn-secondary btn-sm">
                <PlugZap className="w-4 h-4" />{language === 'ar' ? 'اختبار Grok' : 'Test Grok'}
              </button>
            </div>
          </div>

          {/* OpenAI */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-2">
              <h3 className="text-lg font-bold">OpenAI (Fallback 2)</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('openaiEnabled')} className="checkbox" />
                <span className="text-sm">{language === 'ar' ? 'مفعل' : 'Enabled'}</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{language === 'ar' ? 'الموديل' : 'Model'}</label>
                <input {...register('openaiModel')} className="input" placeholder="gpt-4o-mini" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'مفتاح API' : 'API Key'}</label>
                <input type="password" {...register('openaiKey')} className="input" placeholder={data?.openai?.hasApiKey ? `Saved: ${data.openai.apiKeyMasked}` : 'Enter key'} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" disabled={testMutation.isPending || !data?.openai?.hasApiKey} onClick={() => testMutation.mutate('openai')} className="btn btn-secondary btn-sm">
                <PlugZap className="w-4 h-4" />{language === 'ar' ? 'اختبار OpenAI' : 'Test OpenAI'}
              </button>
            </div>
          </div>

          {/* Groq */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-2">
              <h3 className="text-lg font-bold">Groq (Fallback 3)</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('groqEnabled')} className="checkbox" />
                <span className="text-sm">{language === 'ar' ? 'مفعل' : 'Enabled'}</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{language === 'ar' ? 'الموديل' : 'Model'}</label>
                <input {...register('groqModel')} className="input" placeholder="llama3-8b-8192" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'مفتاح API' : 'API Key'}</label>
                <input type="password" {...register('groqKey')} className="input" placeholder={data?.groq?.hasApiKey ? `Saved: ${data.groq.apiKeyMasked}` : 'Enter key'} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" disabled={testMutation.isPending || !data?.groq?.hasApiKey} onClick={() => testMutation.mutate('groq')} className="btn btn-secondary btn-sm">
                <PlugZap className="w-4 h-4" />{language === 'ar' ? 'اختبار Groq' : 'Test Groq'}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-dark-700">
            <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary w-full sm:w-auto">
              {saveMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{language === 'ar' ? 'حفظ إعدادات الذكاء الاصطناعي' : 'Save AI Settings'}</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
