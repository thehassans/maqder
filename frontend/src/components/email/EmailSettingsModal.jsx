import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Save, Settings2 } from 'lucide-react'

const templateVariables = ['{{invoiceNumber}}', '{{companyName}}', '{{customerName}}', '{{invoiceDate}}', '{{invoiceTotal}}']

export default function EmailSettingsModal({ open, onClose, onSave, isSaving, language, initialSettings, tenant }) {
  const isArabic = language === 'ar'
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      enabled: false,
      autoSendInvoices: false,
      identityType: 'platform',
      identityStatus: 'not_requested',
      requestedSenderName: '',
      requestedSenderEmail: '',
      senderName: '',
      fromEmail: '',
      replyTo: '',
      inboundAddress: '',
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUser: '',
      smtpPass: '',
      subjectEn: '',
      subjectAr: '',
      bodyEn: '',
      bodyAr: '',
      signatureEn: '',
      signatureAr: '',
    },
  })

  useEffect(() => {
    reset({
      enabled: !!initialSettings?.enabled,
      autoSendInvoices: !!initialSettings?.autoSendInvoices,
      identityType: initialSettings?.identityType || 'platform',
      identityStatus: initialSettings?.identityStatus || 'not_requested',
      requestedSenderName: initialSettings?.requestedSenderName || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || '',
      requestedSenderEmail: initialSettings?.requestedSenderEmail || tenant?.business?.contactEmail || '',
      senderName: initialSettings?.senderName || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || '',
      fromEmail: initialSettings?.fromEmail || initialSettings?.requestedSenderEmail || tenant?.business?.contactEmail || '',
      replyTo: initialSettings?.replyTo || tenant?.business?.contactEmail || '',
      inboundAddress: initialSettings?.inboundAddress || `${tenant?.slug || 'tenant'}@inbound.maqder.local`,
      smtpHost: initialSettings?.smtpHost || '',
      smtpPort: Number(initialSettings?.smtpPort || 587),
      smtpSecure: !!initialSettings?.smtpSecure,
      smtpUser: initialSettings?.smtpUser || '',
      smtpPass: '',
      subjectEn: initialSettings?.subjectEn || '',
      subjectAr: initialSettings?.subjectAr || '',
      bodyEn: initialSettings?.bodyEn || '',
      bodyAr: initialSettings?.bodyAr || '',
      signatureEn: initialSettings?.signatureEn || '',
      signatureAr: initialSettings?.signatureAr || '',
    })
  }, [initialSettings, reset, tenant])

  const identityType = watch('identityType')
  const hasStoredPassword = initialSettings?.hasSmtpPass

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-4 top-4 z-50 mx-auto max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-dark-700 dark:bg-dark-900"
          >
            <form onSubmit={handleSubmit((values) => onSave(values))} className="flex max-h-[calc(100vh-2rem)] flex-col">
              <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-6 py-5 dark:border-dark-700">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-primary-100 p-3 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'إعدادات البريد والهوية' : 'Email Identity & Settings'}</h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'قم بتحديد عنوان المرسل، صندوق الوارد، وإعدادات SMTP الخاصة بالشركة.' : 'Configure the sender identity, inbox address, and tenant-specific SMTP settings.'}</p>
                  </div>
                </div>
                <button type="button" onClick={onClose} className="btn btn-secondary">{isArabic ? 'إغلاق' : 'Close'}</button>
              </div>

              <div className="grid gap-6 overflow-y-auto p-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-dark-700 dark:bg-dark-800/60 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{isArabic ? 'تفعيل البريد' : 'Enable Email'}</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'السماح بالإرسال اليدوي والآلي من صندوق بريد الشركة.' : 'Allow manual and automated sending from the tenant mailbox.'}</p>
                      </div>
                      <input type="checkbox" {...register('enabled')} className="h-4 w-4" />
                    </label>
                    <label className="rounded-2xl border border-gray-200 bg-gray-50/80 p-4 dark:border-dark-700 dark:bg-dark-800/60 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{isArabic ? 'إرسال تلقائي للفواتير' : 'Automatic Invoice Delivery'}</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'إرسال الفاتورة مباشرة بعد اعتمادها أو توقيعها.' : 'Send invoices automatically after approval or signing.'}</p>
                      </div>
                      <input type="checkbox" {...register('autoSendInvoices')} className="h-4 w-4" />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="label">{isArabic ? 'نوع الهوية' : 'Identity Type'}</label>
                      <select {...register('identityType')} className="select">
                        <option value="platform">{isArabic ? 'عنوان مستضاف من Maqder' : 'Platform-hosted identity'}</option>
                        <option value="custom_smtp">{isArabic ? 'SMTP مخصص' : 'Custom SMTP'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">{isArabic ? 'حالة الهوية' : 'Identity Status'}</label>
                      <select {...register('identityStatus')} className="select">
                        <option value="not_requested">{isArabic ? 'غير مطلوب' : 'Not Requested'}</option>
                        <option value="requested">{isArabic ? 'تم الطلب' : 'Requested'}</option>
                        <option value="configured">{isArabic ? 'تم الإعداد' : 'Configured'}</option>
                        <option value="verified">{isArabic ? 'تم التحقق' : 'Verified'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">{isArabic ? 'اسم المرسل المطلوب' : 'Requested Sender Name'}</label>
                      <input {...register('requestedSenderName')} className="input" placeholder="Finance Team" />
                    </div>
                    <div>
                      <label className="label">{isArabic ? 'البريد المطلوب' : 'Requested Sender Email'}</label>
                      <input type="email" {...register('requestedSenderEmail')} className="input" placeholder="company@maqder.com" />
                    </div>
                    <div>
                      <label className="label">{isArabic ? 'اسم المرسل الفعلي' : 'Sender Name'}</label>
                      <input {...register('senderName')} className="input" placeholder={tenant?.business?.legalNameEn || 'Maqder ERP'} />
                    </div>
                    <div>
                      <label className="label">{isArabic ? 'From Email' : 'From Email'}</label>
                      <input type="email" {...register('fromEmail')} className="input" placeholder="billing@company.com" />
                    </div>
                    <div>
                      <label className="label">{isArabic ? 'Reply-To' : 'Reply-To'}</label>
                      <input type="email" {...register('replyTo')} className="input" placeholder="accounts@company.com" />
                    </div>
                    <div>
                      <label className="label">{isArabic ? 'عنوان الوارد' : 'Inbound Address'}</label>
                      <input {...register('inboundAddress')} className="input" placeholder={`${tenant?.slug || 'tenant'}@inbound.maqder.local`} />
                    </div>
                  </div>

                  {identityType === 'custom_smtp' ? (
                    <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5 dark:border-dark-700 dark:bg-dark-800/50">
                      <div className="mb-4 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary-600" />
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{isArabic ? 'إعدادات SMTP الخاصة بالشركة' : 'Tenant SMTP Settings'}</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="label">SMTP Host</label>
                          <input {...register('smtpHost')} className="input" placeholder="smtp.office365.com" />
                        </div>
                        <div>
                          <label className="label">SMTP Port</label>
                          <input type="number" {...register('smtpPort', { valueAsNumber: true })} className="input" placeholder="587" />
                        </div>
                        <div>
                          <label className="label">SMTP User</label>
                          <input {...register('smtpUser')} className="input" placeholder="mailer@company.com" />
                        </div>
                        <div>
                          <label className="label">SMTP Password</label>
                          <input type="password" {...register('smtpPass')} className="input" placeholder={hasStoredPassword ? initialSettings?.smtpPassMasked || '••••••••' : '••••••••'} />
                          {hasStoredPassword ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{isArabic ? 'اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية.' : 'Leave blank to keep the current SMTP password.'}</p> : null}
                        </div>
                        <label className="md:col-span-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-dark-600 dark:bg-dark-900 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{isArabic ? 'اتصال آمن' : 'Secure Connection'}</p>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'فعّل SSL/TLS عندما يطلب مزود البريد ذلك.' : 'Enable SSL/TLS when required by your mail provider.'}</p>
                          </div>
                          <input type="checkbox" {...register('smtpSecure')} className="h-4 w-4" />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-6">
                  <div className="rounded-3xl border border-gray-200 bg-gray-50/70 p-5 dark:border-dark-700 dark:bg-dark-800/50">
                    <div className="mb-4 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary-600" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{isArabic ? 'قوالب الفاتورة الثنائية' : 'Bilingual Invoice Templates'}</h3>
                    </div>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'المتغيرات المتاحة:' : 'Available variables:'} {templateVariables.join(', ')}</p>
                    <div className="space-y-4">
                      <div>
                        <label className="label">English Subject</label>
                        <input {...register('subjectEn')} className="input" placeholder="Invoice {{invoiceNumber}} from {{companyName}}" />
                      </div>
                      <div>
                        <label className="label">English Body</label>
                        <textarea {...register('bodyEn')} rows={8} className="input min-h-[180px]" placeholder="Hello {{customerName}},&#10;&#10;Please find your invoice {{invoiceNumber}} dated {{invoiceDate}} with a total of {{invoiceTotal}}." />
                      </div>
                      <div>
                        <label className="label">English Signature</label>
                        <textarea {...register('signatureEn')} rows={3} className="input" placeholder="Regards,&#10;Finance Team" />
                      </div>
                      <div>
                        <label className="label">Arabic Subject</label>
                        <input {...register('subjectAr')} dir="rtl" className="input" placeholder="الفاتورة {{invoiceNumber}} من {{companyName}}" />
                      </div>
                      <div>
                        <label className="label">Arabic Body</label>
                        <textarea {...register('bodyAr')} dir="rtl" rows={8} className="input min-h-[180px]" placeholder="مرحباً {{customerName}}،&#10;&#10;نرفق لكم الفاتورة رقم {{invoiceNumber}} بتاريخ {{invoiceDate}} بإجمالي {{invoiceTotal}}." />
                      </div>
                      <div>
                        <label className="label">Arabic Signature</label>
                        <textarea {...register('signatureAr')} dir="rtl" rows={3} className="input" placeholder="مع التحية،&#10;فريق المالية" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-dark-700">
                <button type="button" onClick={onClose} className="btn btn-secondary">{isArabic ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" disabled={isSaving} className="btn btn-action-dark">
                  {isSaving ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Save className="h-4 w-4" />{isArabic ? 'حفظ الإعدادات' : 'Save Settings'}</>}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  )
}
