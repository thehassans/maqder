import { Mail, Settings2, ShieldCheck, Sparkles } from 'lucide-react'

const templateVariables = ['{{invoiceNumber}}', '{{companyName}}', '{{customerName}}', '{{invoiceDate}}', '{{invoiceTotal}}']

export default function EmailAdminSettingsSection({ register, watch, language, tenantName, tenantSlug, contactEmail, initialEmailSettings }) {
  const isArabic = language === 'ar'
  const identityType = watch('settings.communication.email.identityType') || 'platform'
  const platformProvider = watch('settings.communication.email.platformProvider') || 'platform'
  const currentSlug = watch('slug') || tenantSlug || 'tenant'
  const currentSenderName = watch('settings.communication.email.senderName') || tenantName || ''
  const currentFromEmail = watch('settings.communication.email.fromEmail') || watch('settings.communication.email.requestedSenderEmail') || contactEmail || ''
  const hasStoredPassword = Boolean(initialEmailSettings?.hasSmtpPass)
  const smtpPassMasked = initialEmailSettings?.smtpPassMasked || '••••••••'

  return (
    <div className="card overflow-hidden p-0">
      <div className="border-b border-gray-200 bg-gradient-to-r from-[#163b27] via-[#1f4c33] to-[#173523] px-6 py-6 text-white dark:border-dark-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isArabic ? 'المشرف العام فقط' : 'Super Admin Only'}
              </div>
              <h3 className="mt-3 text-xl font-semibold">{isArabic ? 'إعدادات البريد والهوية للمستأجر' : 'Tenant Email Identity & Automation'}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">{isArabic ? 'يتم من هنا ضبط هوية المرسل، القوالب، الإرسال التلقائي، وعنوان الوارد لهذا المستأجر. هذه الإعدادات غير قابلة للتعديل من داخل لوحة المستأجر.' : 'Configure the sender identity, templates, automatic delivery, and inbound address for this tenant here. These settings are not editable from the tenant panel.'}</p>
            </div>
          </div>
          <div className="min-w-[260px] rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-white/55">{isArabic ? 'المعاينة الحالية' : 'Current Preview'}</p>
            <p className="mt-2 text-base font-semibold text-white">{currentSenderName || (isArabic ? 'اسم المرسل' : 'Sender Name')}</p>
            <p className="mt-1 truncate text-sm text-white/70">{currentFromEmail || (isArabic ? 'لا يوجد بريد مرسل بعد' : 'No sender email yet')}</p>
            <p className="mt-3 truncate rounded-2xl border border-white/10 bg-black/10 px-3 py-2 text-xs text-white/70">{watch('settings.communication.email.inboundAddress') || `${currentSlug}@inbound.maqder.local`}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-gray-50/80 p-5 dark:border-dark-700 dark:bg-dark-800/60">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{isArabic ? 'تفعيل البريد' : 'Enable Email'}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'السماح بالإرسال اليدوي والآلي من صندوق بريد المستأجر.' : 'Allow manual and automated sending from the tenant mailbox.'}</p>
                </div>
                <input type="checkbox" {...register('settings.communication.email.enabled')} className="h-4 w-4" />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-3xl border border-gray-200 bg-gray-50/80 p-5 dark:border-dark-700 dark:bg-dark-800/60">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{isArabic ? 'إرسال تلقائي للفواتير' : 'Automatic Invoice Delivery'}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'إرسال الفاتورة تلقائياً بعد الاعتماد أو التوقيع.' : 'Automatically send invoices after approval or signing.'}</p>
                </div>
                <input type="checkbox" {...register('settings.communication.email.autoSendInvoices')} className="h-4 w-4" />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">{isArabic ? 'نوع الهوية' : 'Identity Type'}</label>
                <select {...register('settings.communication.email.identityType')} className="select">
                  <option value="platform">{isArabic ? 'عنوان مستضاف من المنصة' : 'Platform-hosted identity'}</option>
                  <option value="custom_smtp">{isArabic ? 'SMTP مخصص' : 'Custom SMTP'}</option>
                </select>
              </div>
              <div>
                <label className="label">{isArabic ? 'حالة الهوية' : 'Identity Status'}</label>
                <select {...register('settings.communication.email.identityStatus')} className="select">
                  <option value="not_requested">{isArabic ? 'غير مطلوب' : 'Not Requested'}</option>
                  <option value="requested">{isArabic ? 'تم الطلب' : 'Requested'}</option>
                  <option value="configured">{isArabic ? 'تم الإعداد' : 'Configured'}</option>
                  <option value="verified">{isArabic ? 'تم التحقق' : 'Verified'}</option>
                </select>
              </div>
              {identityType === 'platform' ? (
                <>
                  <div>
                    <label className="label">{isArabic ? 'مزود المنصة' : 'Platform Provider'}</label>
                    <select {...register('settings.communication.email.platformProvider')} className="select">
                      <option value="platform">{isArabic ? 'منصة داخلية' : 'Internal Platform'}</option>
                      <option value="brevo">Brevo</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">{isArabic ? 'معرف المرسل لدى المزود' : 'Provider Sender ID'}</label>
                    <input {...register('settings.communication.email.providerSenderId')} className="input" placeholder={platformProvider === 'brevo' ? 'brevo-sender-id' : 'platform-sender-id'} />
                  </div>
                  <div>
                    <label className="label">{isArabic ? 'حالة المرسل لدى المزود' : 'Provider Sender Status'}</label>
                    <input {...register('settings.communication.email.providerSenderStatus')} className="input" placeholder={platformProvider === 'brevo' ? 'pending / active / rejected' : 'configured'} />
                  </div>
                </>
              ) : null}
              <div>
                <label className="label">{isArabic ? 'اسم المرسل المطلوب' : 'Requested Sender Name'}</label>
                <input {...register('settings.communication.email.requestedSenderName')} className="input" placeholder={tenantName || 'Finance Team'} />
              </div>
              <div>
                <label className="label">{isArabic ? 'البريد المطلوب' : 'Requested Sender Email'}</label>
                <input type="email" {...register('settings.communication.email.requestedSenderEmail')} className="input" placeholder={contactEmail || 'billing@company.com'} />
              </div>
              <div>
                <label className="label">{isArabic ? 'اسم المرسل الفعلي' : 'Sender Name'}</label>
                <input {...register('settings.communication.email.senderName')} className="input" placeholder={tenantName || 'Maqder ERP'} />
              </div>
              <div>
                <label className="label">{isArabic ? 'From Email' : 'From Email'}</label>
                <input type="email" {...register('settings.communication.email.fromEmail')} className="input" placeholder={contactEmail || 'mailer@company.com'} />
              </div>
              <div>
                <label className="label">{isArabic ? 'Reply-To' : 'Reply-To'}</label>
                <input type="email" {...register('settings.communication.email.replyTo')} className="input" placeholder={contactEmail || 'accounts@company.com'} />
              </div>
              <div>
                <label className="label">{isArabic ? 'عنوان الوارد' : 'Inbound Address'}</label>
                <input {...register('settings.communication.email.inboundAddress')} className="input" placeholder={`${currentSlug}@inbound.maqder.local`} />
              </div>
            </div>

            {identityType === 'custom_smtp' ? (
              <div className="rounded-[28px] border border-violet-200 bg-violet-50/60 p-5 dark:border-violet-900/30 dark:bg-violet-950/15">
                <div className="mb-4 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-violet-600" />
                  <h4 className="text-base font-semibold text-gray-900 dark:text-white">{isArabic ? 'بيانات SMTP المخصصة' : 'Custom SMTP Credentials'}</h4>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">SMTP Host</label>
                    <input {...register('settings.communication.email.smtpHost')} className="input" placeholder="smtp.office365.com" />
                  </div>
                  <div>
                    <label className="label">SMTP Port</label>
                    <input type="number" {...register('settings.communication.email.smtpPort', { valueAsNumber: true })} className="input" placeholder="587" />
                  </div>
                  <div>
                    <label className="label">SMTP User</label>
                    <input {...register('settings.communication.email.smtpUser')} className="input" placeholder="mailer@company.com" />
                  </div>
                  <div>
                    <label className="label">SMTP Password</label>
                    <input type="password" {...register('settings.communication.email.smtpPass')} className="input" placeholder={hasStoredPassword ? smtpPassMasked : '••••••••'} />
                    {hasStoredPassword ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{isArabic ? 'اترك الحقل فارغاً للاحتفاظ بكلمة المرور الحالية.' : 'Leave blank to keep the current SMTP password.'}</p> : null}
                  </div>
                  <label className="md:col-span-2 flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-dark-600 dark:bg-dark-900">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{isArabic ? 'اتصال آمن' : 'Secure Connection'}</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'فعّل SSL/TLS عندما يطلب مزود البريد ذلك.' : 'Enable SSL/TLS when required by your mail provider.'}</p>
                    </div>
                    <input type="checkbox" {...register('settings.communication.email.smtpSecure')} className="h-4 w-4" />
                  </label>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-gray-200 bg-gray-50/80 p-5 dark:border-dark-700 dark:bg-dark-800/50">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <h4 className="text-base font-semibold text-gray-900 dark:text-white">{isArabic ? 'قوالب الفواتير الثنائية' : 'Bilingual Invoice Templates'}</h4>
              </div>
              <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'المتغيرات المتاحة:' : 'Available variables:'} {templateVariables.join(', ')}</p>
              <div className="space-y-4">
                <div>
                  <label className="label">English Subject</label>
                  <input {...register('settings.communication.email.subjectEn')} className="input" placeholder="Invoice {{invoiceNumber}} from {{companyName}}" />
                </div>
                <div>
                  <label className="label">English Body</label>
                  <textarea {...register('settings.communication.email.bodyEn')} rows={7} className="input min-h-[180px]" placeholder="Hello {{customerName}},&#10;&#10;Please find your invoice {{invoiceNumber}} dated {{invoiceDate}} with a total of {{invoiceTotal}}." />
                </div>
                <div>
                  <label className="label">English Signature</label>
                  <textarea {...register('settings.communication.email.signatureEn')} rows={3} className="input" placeholder="Regards,&#10;Finance Team" />
                </div>
                <div>
                  <label className="label">Arabic Subject</label>
                  <input {...register('settings.communication.email.subjectAr')} dir="rtl" className="input" placeholder="الفاتورة {{invoiceNumber}} من {{companyName}}" />
                </div>
                <div>
                  <label className="label">Arabic Body</label>
                  <textarea {...register('settings.communication.email.bodyAr')} dir="rtl" rows={7} className="input min-h-[180px]" placeholder="مرحباً {{customerName}}،&#10;&#10;نرفق لكم الفاتورة رقم {{invoiceNumber}} بتاريخ {{invoiceDate}} بإجمالي {{invoiceTotal}}." />
                </div>
                <div>
                  <label className="label">Arabic Signature</label>
                  <textarea {...register('settings.communication.email.signatureAr')} dir="rtl" rows={3} className="input" placeholder="مع التحية،&#10;فريق المالية" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
