import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Mail, Send, ShieldCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { usePublicWebsiteSettings } from '../lib/website'
import { updateTenant } from '../store/slices/authSlice'

export default function EmailCommunication() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const isArabic = language === 'ar'
  const { data: websiteSettings } = usePublicWebsiteSettings()
  const hasEmailAddon = Array.isArray(tenant?.subscription?.features) && tenant.subscription.features.includes('email_automation')

  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      enabled: false,
      autoSendInvoices: false,
      senderName: '',
      replyTo: '',
      subjectEn: '',
      subjectAr: '',
      bodyEn: '',
      bodyAr: '',
    },
  })

  useEffect(() => {
    const emailSettings = tenant?.settings?.communication?.email
    reset({
      enabled: !!emailSettings?.enabled,
      autoSendInvoices: !!emailSettings?.autoSendInvoices,
      senderName: emailSettings?.senderName || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || '',
      replyTo: emailSettings?.replyTo || tenant?.business?.contactEmail || '',
      subjectEn: emailSettings?.subjectEn || '',
      subjectAr: emailSettings?.subjectAr || '',
      bodyEn: emailSettings?.bodyEn || '',
      bodyAr: emailSettings?.bodyAr || '',
    })
  }, [reset, tenant])

  const saveMutation = useMutation({
    mutationFn: (payload) => api.put('/tenants/current', payload).then((res) => res.data),
    onSuccess: (nextTenant) => {
      dispatch(updateTenant(nextTenant))
      queryClient.setQueryData(['tenant-current'], nextTenant)
      toast.success(isArabic ? 'تم حفظ إعدادات البريد' : 'Email settings saved')
    },
    onError: (error) => toast.error(error.response?.data?.error || 'Failed to save email settings'),
  })

  const onSubmit = (formData) => {
    saveMutation.mutate({
      settings: {
        communication: {
          email: {
            enabled: !!formData.enabled,
            autoSendInvoices: !!formData.autoSendInvoices,
            senderName: String(formData.senderName || '').trim(),
            replyTo: String(formData.replyTo || '').trim(),
            subjectEn: String(formData.subjectEn || '').trim(),
            subjectAr: String(formData.subjectAr || '').trim(),
            bodyEn: String(formData.bodyEn || '').trim(),
            bodyAr: String(formData.bodyAr || '').trim(),
          },
        },
      },
    })
  }

  const salesPhone = websiteSettings?.contactPhone || '+966595930045'
  const salesEmail = websiteSettings?.contactEmail || 'info@maqder.com'
  const contactSalesSubject = encodeURIComponent('Email Automation Add-on')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isArabic ? 'التواصل عبر البريد' : 'Email Communication'}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{isArabic ? 'إدارة إرسال الفواتير الآلي وقوالب البريد باللغتين الإنجليزية والعربية.' : 'Manage automatic invoice delivery and bilingual email templates.'}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          {hasEmailAddon ? (isArabic ? 'الإضافة مفعلة' : 'Add-on Active') : (isArabic ? 'إضافة مطلوبة' : 'Add-on Required')}
        </div>
      </div>

      {!hasEmailAddon ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden border border-amber-200 dark:border-amber-900/40">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 w-5 h-5" />
              <div>
                <h2 className="text-lg font-semibold">{isArabic ? 'ميزة إرسال الفواتير بالبريد متاحة كإضافة' : 'Email invoicing is available as an add-on'}</h2>
                <p className="mt-1 text-sm text-white/85">{isArabic ? 'فعّل الإضافة لتمكين الإرسال التلقائي من الفاتورة إلى بريد العميل.' : 'Activate the add-on to unlock automatic invoice delivery to your customer inbox.'}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{isArabic ? 'تسليم تلقائي' : 'Auto Delivery'}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{isArabic ? 'إرسال تلقائي بعد اعتماد الفاتورة مباشرة.' : 'Automatically send invoices after approval/signing.'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{isArabic ? 'قوالب ثنائية اللغة' : 'Bilingual Templates'}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{isArabic ? 'موضوع ونص مستقلان للإنجليزية والعربية.' : 'Dedicated English and Arabic subject/body templates.'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{isArabic ? 'معلومات المبيعات' : 'Sales Contact'}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-200">
                <p>{salesPhone}</p>
                <a href={`mailto:${salesEmail}?subject=${contactSalesSubject}`} className="text-primary-600 hover:text-primary-700">{salesEmail}</a>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
              <div className="xl:col-span-2 rounded-3xl bg-gradient-to-br from-[#163b27] to-[#245138] p-6 text-white shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{isArabic ? 'التسليم الذكي للفواتير' : 'Smart Invoice Delivery'}</h2>
                    <p className="mt-1 text-sm text-white/75">{isArabic ? 'استخدم نفس إعدادات SMTP العامة مع تحكم خاص لكل شركة.' : 'Use the shared SMTP engine with tenant-specific delivery behavior.'}</p>
                  </div>
                </div>
              </div>

              <label className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-800 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{isArabic ? 'تفعيل البريد' : 'Enable Email'}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'السماح بالإرسال من الفواتير يدويًا وآليًا.' : 'Allow manual and automatic invoice sending.'}</p>
                </div>
                <input type="checkbox" {...register('enabled')} className="h-4 w-4" />
              </label>

              <label className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-dark-700 dark:bg-dark-800 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{isArabic ? 'إرسال تلقائي بعد الاعتماد' : 'Auto Send After Approval'}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'يرسل البريد مباشرة بعد توقيع الفاتورة.' : 'Email the invoice automatically after signing/approval.'}</p>
                </div>
                <input type="checkbox" {...register('autoSendInvoices')} className="h-4 w-4" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="label">{isArabic ? 'اسم المرسل' : 'Sender Name'}</label>
                <input {...register('senderName')} className="input" placeholder={tenant?.business?.legalNameEn || 'Maqder ERP'} />
              </div>
              <div>
                <label className="label">{isArabic ? 'الرد إلى' : 'Reply-To'}</label>
                <input type="email" {...register('replyTo')} className="input" placeholder={tenant?.business?.contactEmail || 'accounts@company.com'} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                <div className="mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">English Template</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">{isArabic ? 'الموضوع' : 'Subject'}</label>
                    <input {...register('subjectEn')} className="input" placeholder="Invoice {{invoiceNumber}} from {{companyName}}" />
                  </div>
                  <div>
                    <label className="label">{isArabic ? 'المحتوى' : 'Body'}</label>
                    <textarea {...register('bodyEn')} rows={10} className="input min-h-[220px]" placeholder="Hello {{customerName}},&#10;&#10;Please find your invoice {{invoiceNumber}} dated {{invoiceDate}} with a total of {{invoiceTotal}}." />
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-dark-700 dark:bg-dark-800">
                <div className="mb-4 flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'القالب العربي' : 'Arabic Template'}</h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="label">{isArabic ? 'الموضوع' : 'Subject'}</label>
                    <input {...register('subjectAr')} dir="rtl" className="input" placeholder="الفاتورة {{invoiceNumber}} من {{companyName}}" />
                  </div>
                  <div>
                    <label className="label">{isArabic ? 'المحتوى' : 'Body'}</label>
                    <textarea {...register('bodyAr')} rows={10} dir="rtl" className="input min-h-[220px]" placeholder="مرحباً {{customerName}}،&#10;&#10;نرفق لكم الفاتورة رقم {{invoiceNumber}} بتاريخ {{invoiceDate}} بإجمالي {{invoiceTotal}}." />
                  </div>
                </div>
              </section>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saveMutation.isPending} className="btn btn-primary">
                {saveMutation.isPending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Mail className="w-4 h-4" />{isArabic ? 'حفظ إعدادات البريد' : 'Save Email Settings'}</>}
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  )
}
