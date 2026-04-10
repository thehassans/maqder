import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { AlertCircle, Mail, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function EmailSettings() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'
  const templateVariables = '{{invoiceNumber}}, {{invoiceDate}}, {{invoiceTotal}}, {{companyName}}, {{customerName}}, {{brandName}}, {{loginEmail}}, {{tenantSlug}}'

  const { register, handleSubmit, reset, getValues } = useForm({
    defaultValues: {
      enabled: false,
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPass: '',
      fromName: 'Maqder ERP',
      fromEmail: '',
      replyTo: '',
      tenantCreatedSubjectEn: '',
      tenantCreatedSubjectAr: '',
      tenantCreatedBodyEn: '',
      tenantCreatedBodyAr: '',
      invoiceSubjectEn: '',
      invoiceSubjectAr: '',
      invoiceBodyEn: '',
      invoiceBodyAr: '',
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['super-admin-email-settings'],
    queryFn: () => api.get('/super-admin/settings/email').then((res) => res.data),
  })

  useEffect(() => {
    const email = data?.email
    if (!email) return
    reset({
      enabled: !!email.enabled,
      smtpHost: email.smtpHost || '',
      smtpPort: email.smtpPort || 587,
      smtpSecure: !!email.smtpSecure,
      smtpUser: email.smtpUser || '',
      smtpPass: '',
      fromName: email.fromName || 'Maqder ERP',
      fromEmail: email.fromEmail || '',
      replyTo: email.replyTo || '',
      tenantCreatedSubjectEn: email.templates?.tenantCreated?.subjectEn || '',
      tenantCreatedSubjectAr: email.templates?.tenantCreated?.subjectAr || '',
      tenantCreatedBodyEn: email.templates?.tenantCreated?.bodyEn || '',
      tenantCreatedBodyAr: email.templates?.tenantCreated?.bodyAr || '',
      invoiceSubjectEn: email.templates?.invoice?.subjectEn || '',
      invoiceSubjectAr: email.templates?.invoice?.subjectAr || '',
      invoiceBodyEn: email.templates?.invoice?.bodyEn || '',
      invoiceBodyAr: email.templates?.invoice?.bodyAr || '',
    })
  }, [data, reset])

  const buildEmailPayload = (formData) => ({
    email: {
      enabled: !!formData.enabled,
      smtpHost: String(formData.smtpHost || '').trim(),
      smtpPort: Number(formData.smtpPort || 587),
      smtpSecure: !!formData.smtpSecure,
      smtpUser: String(formData.smtpUser || '').trim(),
      smtpPass: String(formData.smtpPass || '').trim(),
      fromName: String(formData.fromName || '').trim(),
      fromEmail: String(formData.fromEmail || '').trim(),
      replyTo: String(formData.replyTo || '').trim(),
      templates: {
        tenantCreated: {
          subjectEn: String(formData.tenantCreatedSubjectEn || '').trim(),
          subjectAr: String(formData.tenantCreatedSubjectAr || '').trim(),
          bodyEn: String(formData.tenantCreatedBodyEn || '').trim(),
          bodyAr: String(formData.tenantCreatedBodyAr || '').trim(),
        },
        invoice: {
          subjectEn: String(formData.invoiceSubjectEn || '').trim(),
          subjectAr: String(formData.invoiceSubjectAr || '').trim(),
          bodyEn: String(formData.invoiceBodyEn || '').trim(),
          bodyAr: String(formData.invoiceBodyAr || '').trim(),
        },
      },
    },
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/super-admin/settings/email', payload).then((res) => res.data),
    onSuccess: (response) => {
      queryClient.setQueryData(['super-admin-email-settings'], response)
      queryClient.invalidateQueries(['super-admin-email-settings'])
      toast.success(isArabic ? 'تم حفظ إعدادات البريد' : 'Email settings saved')
      const email = response?.email
      reset({
        smtpPass: '',
        enabled: !!email?.enabled,
        smtpHost: email?.smtpHost || '',
        smtpPort: email?.smtpPort || 587,
        smtpSecure: !!email?.smtpSecure,
        smtpUser: email?.smtpUser || '',
        fromName: email?.fromName || 'Maqder ERP',
        fromEmail: email?.fromEmail || '',
        replyTo: email?.replyTo || '',
        tenantCreatedSubjectEn: email?.templates?.tenantCreated?.subjectEn || '',
        tenantCreatedSubjectAr: email?.templates?.tenantCreated?.subjectAr || '',
        tenantCreatedBodyEn: email?.templates?.tenantCreated?.bodyEn || '',
        tenantCreatedBodyAr: email?.templates?.tenantCreated?.bodyAr || '',
        invoiceSubjectEn: email?.templates?.invoice?.subjectEn || '',
        invoiceSubjectAr: email?.templates?.invoice?.subjectAr || '',
        invoiceBodyEn: email?.templates?.invoice?.bodyEn || '',
        invoiceBodyAr: email?.templates?.invoice?.bodyAr || '',
      })
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to save email settings'),
  })

  const testConnectionMutation = useMutation({
    mutationFn: (payload) => api.post('/super-admin/settings/email/test-connection', payload).then((res) => res.data),
    onSuccess: () => {
      toast.success(isArabic ? 'تم التحقق من اتصال SMTP بنجاح' : 'SMTP connection verified successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to verify SMTP connection')
    },
  })

  const onSubmit = (formData) => {
    saveMutation.mutate(buildEmailPayload(formData))
  }

  const handleTestConnection = () => {
    testConnectionMutation.mutate(buildEmailPayload(getValues()))
  }

  const connectionPanelClass = testConnectionMutation.isSuccess
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100'
    : testConnectionMutation.isError
      ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-100'
      : 'border-gray-200 bg-gray-50 text-gray-700 dark:border-dark-700 dark:bg-dark-800 dark:text-gray-200'

  const connectionIconClass = testConnectionMutation.isSuccess
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
    : testConnectionMutation.isError
      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'
      : 'bg-white text-gray-600 dark:bg-dark-700 dark:text-gray-200'

  const connectionMessage = testConnectionMutation.isSuccess
    ? (isArabic
        ? 'تم التحقق من الاتصال بنجاح. التكامل يعمل ويمكن استخدامه لإرسال رسائل إنشاء المستأجر.'
        : 'Connection verified successfully. The integration is working and can be used for tenant creation emails.')
    : testConnectionMutation.isError
      ? (testConnectionMutation.error?.response?.data?.error || testConnectionMutation.error?.message || (isArabic ? 'فشل التحقق من الاتصال.' : 'Connection verification failed.'))
      : (isArabic ? 'اختبر اتصال SMTP الحالي أو القيم التي أدخلتها قبل الحفظ.' : 'Test the current SMTP integration or the values you entered before saving.')

  if (isLoading) {
    return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isArabic ? 'إعدادات البريد' : 'Email Settings'}</h1>
        <p className="mt-1 text-gray-500">{isArabic ? 'إدارة SMTP والقوالب العامة لإنشاء اللوحات وإرسال الفواتير.' : 'Manage SMTP and global templates for panel creation and invoice delivery.'}</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
            <p className="font-semibold">{isArabic ? 'متغيرات القوالب' : 'Template variables'}</p>
            <p className="mt-1 leading-7">{templateVariables}</p>
          </div>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'إعدادات SMTP' : 'SMTP Settings'}</h2>
            </div>

            <div className={`rounded-2xl border p-4 text-sm ${connectionPanelClass}`}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-2 ${connectionIconClass}`}>
                    {testConnectionMutation.isSuccess ? <ShieldCheck className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{isArabic ? 'فحص تكامل البريد' : 'Mail Integration Check'}</p>
                    <p className="mt-1 leading-6">{connectionMessage}</p>
                    {testConnectionMutation.data?.fromEmail ? <p className="mt-2 text-xs opacity-80">{`${testConnectionMutation.data.fromName} <${testConnectionMutation.data.fromEmail}>`}</p> : null}
                  </div>
                </div>
                <button type="button" onClick={handleTestConnection} disabled={testConnectionMutation.isPending} className="btn btn-secondary">
                  {testConnectionMutation.isPending ? <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> : <><RefreshCw className="w-4 h-4" />{isArabic ? 'فحص الاتصال' : 'Test Connection'}</>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="card-glass p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{isArabic ? 'تفعيل الإرسال' : 'Enable email delivery'}</span>
                <input type="checkbox" {...register('enabled')} className="h-4 w-4" />
              </label>
              <div>
                <label className="label">{isArabic ? 'SMTP Host' : 'SMTP Host'}</label>
                <input {...register('smtpHost')} className="input" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <label className="label">{isArabic ? 'SMTP Port' : 'SMTP Port'}</label>
                <input type="number" {...register('smtpPort')} className="input" />
              </div>
              <label className="card-glass p-4 flex items-center justify-between md:col-span-2 xl:col-span-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{isArabic ? 'اتصال آمن' : 'Secure connection'}</span>
                <input type="checkbox" {...register('smtpSecure')} className="h-4 w-4" />
              </label>
              <div>
                <label className="label">{isArabic ? 'SMTP User' : 'SMTP User'}</label>
                <input {...register('smtpUser')} className="input" placeholder="mailer@maqder.com" />
              </div>
              <div>
                <label className="label">{isArabic ? 'SMTP Password' : 'SMTP Password'}</label>
                <input type="password" {...register('smtpPass')} className="input" placeholder={data?.email?.hasSmtpPass ? (isArabic ? `محفوظ: ${data.email.smtpPassMasked}` : `Saved: ${data.email.smtpPassMasked}`) : '••••••••'} />
              </div>
              <div>
                <label className="label">{isArabic ? 'اسم المرسل' : 'From name'}</label>
                <input {...register('fromName')} className="input" placeholder="Maqder ERP" />
              </div>
              <div>
                <label className="label">{isArabic ? 'بريد المرسل' : 'From email'}</label>
                <input type="email" {...register('fromEmail')} className="input" placeholder="info@maqder.com" />
              </div>
              <div>
                <label className="label">{isArabic ? 'الرد إلى' : 'Reply-To'}</label>
                <input type="email" {...register('replyTo')} className="input" placeholder="support@maqder.com" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'قالب إنشاء اللوحة' : 'Panel Creation Template'}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">{isArabic ? 'الموضوع (EN)' : 'Subject (EN)'}</label>
                <input {...register('tenantCreatedSubjectEn')} className="input" />
              </div>
              <div>
                <label className="label">{isArabic ? 'الموضوع (AR)' : 'Subject (AR)'}</label>
                <input {...register('tenantCreatedSubjectAr')} className="input" dir="rtl" />
              </div>
              <div>
                <label className="label">{isArabic ? 'المحتوى (EN)' : 'Body (EN)'}</label>
                <textarea {...register('tenantCreatedBodyEn')} rows={8} className="input min-h-[180px]" />
              </div>
              <div>
                <label className="label">{isArabic ? 'المحتوى (AR)' : 'Body (AR)'}</label>
                <textarea {...register('tenantCreatedBodyAr')} rows={8} dir="rtl" className="input min-h-[180px]" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'قالب الفاتورة' : 'Invoice Template'}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">{isArabic ? 'الموضوع (EN)' : 'Subject (EN)'}</label>
                <input {...register('invoiceSubjectEn')} className="input" />
              </div>
              <div>
                <label className="label">{isArabic ? 'الموضوع (AR)' : 'Subject (AR)'}</label>
                <input {...register('invoiceSubjectAr')} className="input" dir="rtl" />
              </div>
              <div>
                <label className="label">{isArabic ? 'المحتوى (EN)' : 'Body (EN)'}</label>
                <textarea {...register('invoiceBodyEn')} rows={8} className="input min-h-[180px]" />
              </div>
              <div>
                <label className="label">{isArabic ? 'المحتوى (AR)' : 'Body (AR)'}</label>
                <textarea {...register('invoiceBodyAr')} rows={8} dir="rtl" className="input min-h-[180px]" />
              </div>
            </div>
          </section>

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
