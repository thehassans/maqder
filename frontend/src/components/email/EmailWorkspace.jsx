import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { Inbox, Mail, MailOpen, Paperclip, PenSquare, RefreshCw, Reply, Save, Search, Send, Settings2, ShieldCheck, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { usePublicWebsiteSettings } from '../../lib/website'
import { updateTenant } from '../../store/slices/authSlice'
import EmailSettingsModal from './EmailSettingsModal'

const parseAddressList = (value) => String(value || '')
  .split(/[;,\n]+/)
  .map((item) => item.trim())
  .filter(Boolean)

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

const plainTextToHtml = (value) => escapeHtml(value).replace(/\r?\n/g, '<br />')

const formatDateTime = (value, language) => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => {
    const result = String(reader.result || '')
    const base64 = result.includes(',') ? result.split(',').pop() : result
    resolve(base64 || '')
  }
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const folderOptions = (language) => ([
  { key: 'inbox', label: language === 'ar' ? 'الوارد' : 'Inbox', icon: Inbox },
  { key: 'sent', label: language === 'ar' ? 'المرسل' : 'Sent', icon: Send },
  { key: 'draft', label: language === 'ar' ? 'المسودات' : 'Drafts', icon: Save },
])

const buildComposeState = (message = null) => ({
  to: Array.isArray(message?.to) ? message.to.join(', ') : '',
  cc: Array.isArray(message?.cc) ? message.cc.join(', ') : '',
  bcc: Array.isArray(message?.bcc) ? message.bcc.join(', ') : '',
  subject: message?.subject || '',
  bodyText: message?.bodyText || '',
  attachments: Array.isArray(message?.attachments) ? message.attachments.map((attachment) => ({
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    contentBase64: attachment.contentBase64 || '',
    contentId: attachment.contentId || '',
  })) : [],
})

export default function EmailWorkspace() {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const isArabic = language === 'ar'
  const { data: websiteSettings } = usePublicWebsiteSettings()
  const hasEmailAddon = tenant?.subscription?.hasEmailAddon === true || (Array.isArray(tenant?.subscription?.features) && tenant.subscription.features.includes('email_automation'))

  const [activeFolder, setActiveFolder] = useState('inbox')
  const [search, setSearch] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [composeState, setComposeState] = useState(null)

  const salesPhone = websiteSettings?.contactPhone || '+966595930045'
  const salesEmail = websiteSettings?.contactEmail || 'info@maqder.com'
  const contactSalesSubject = encodeURIComponent('Email Automation Add-on')

  const emailSettingsQuery = useQuery({
    queryKey: ['tenant-email-settings'],
    queryFn: () => api.get('/email/settings').then((res) => res.data),
    enabled: hasEmailAddon,
  })

  const messagesQuery = useQuery({
    queryKey: ['tenant-email-messages', activeFolder, search],
    queryFn: () => api.get('/email/messages', { params: { folder: activeFolder, search } }).then((res) => res.data),
    enabled: hasEmailAddon,
  })

  const selectedMessageQuery = useQuery({
    queryKey: ['tenant-email-message', selectedMessageId],
    queryFn: () => api.get(`/email/messages/${selectedMessageId}`).then((res) => res.data),
    enabled: hasEmailAddon && !!selectedMessageId && !composeState,
  })

  const messages = messagesQuery.data?.messages || []
  const counts = messagesQuery.data?.counts || { inbox: { count: 0, unread: 0 }, sent: { count: 0, unread: 0 }, draft: { count: 0, unread: 0 } }
  const selectedMessage = selectedMessageQuery.data || messages.find((message) => message._id === selectedMessageId) || null

  useEffect(() => {
    if (composeState) return
    if (!messages.length) {
      setSelectedMessageId('')
      return
    }
    if (!selectedMessageId || !messages.some((message) => message._id === selectedMessageId)) {
      setSelectedMessageId(messages[0]._id)
    }
  }, [messages, selectedMessageId, composeState])

  const settingsMutation = useMutation({
    mutationFn: (payload) => api.put('/email/settings', { email: payload }).then((res) => res.data),
    onSuccess: (response) => {
      const nextTenant = {
        ...tenant,
        settings: {
          ...(tenant?.settings || {}),
          communication: {
            ...(tenant?.settings?.communication || {}),
            email: response.email,
          },
        },
      }
      dispatch(updateTenant(nextTenant))
      queryClient.setQueryData(['tenant-email-settings'], response)
      queryClient.setQueryData(['tenant-current'], nextTenant)
      toast.success(isArabic ? 'تم حفظ إعدادات البريد' : 'Email settings saved')
      setShowSettings(false)
    },
    onError: (error) => toast.error(error.userMessage || error.response?.data?.error || 'Failed to save email settings'),
  })

  const sendMutation = useMutation({
    mutationFn: (payload) => api.post('/email/send', payload).then((res) => res.data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-email-messages'] })
      if (variables.saveAsDraft) {
        toast.success(isArabic ? 'تم حفظ المسودة' : 'Draft saved')
        setActiveFolder('draft')
      } else {
        toast.success(isArabic ? 'تم إرسال البريد' : 'Email sent successfully')
        setActiveFolder('sent')
      }
      setComposeState(null)
      setSelectedMessageId(response?.draft?._id || response?.delivery?.message?._id || '')
    },
    onError: (error) => toast.error(error.userMessage || error.response?.data?.error || 'Failed to send email'),
  })

  const handleOpenMessage = async (message) => {
    if (!message) return
    if (message.type === 'draft') {
      setComposeState(buildComposeState(message))
      setSelectedMessageId(message._id)
      return
    }

    if (message.type === 'inbox' && !message.isRead) {
      try {
        await api.patch(`/email/messages/${message._id}/read`, { isRead: true })
      } catch {
      }
      queryClient.invalidateQueries({ queryKey: ['tenant-email-messages'] })
    }

    setComposeState(null)
    setSelectedMessageId(message._id)
  }

  const handleReply = () => {
    if (!selectedMessage) return
    setComposeState({
      to: selectedMessage.from || '',
      cc: '',
      bcc: '',
      subject: selectedMessage.subject?.startsWith('Re:') ? selectedMessage.subject : `Re: ${selectedMessage.subject || ''}`,
      bodyText: `\n\n----\n${selectedMessage.bodyText || ''}`,
      attachments: [],
    })
  }

  const handleAttachmentChange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length || !composeState) return

    try {
      const nextAttachments = await Promise.all(files.map(async (file) => ({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        contentBase64: await readFileAsBase64(file),
      })))
      setComposeState((current) => ({
        ...(current || buildComposeState()),
        attachments: [...(current?.attachments || []), ...nextAttachments],
      }))
      event.target.value = ''
    } catch {
      toast.error(isArabic ? 'تعذر تحميل المرفق' : 'Failed to load attachment')
    }
  }

  const handleRemoveAttachment = (index) => {
    setComposeState((current) => ({
      ...(current || buildComposeState()),
      attachments: (current?.attachments || []).filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  const handleDownloadAttachment = (attachment) => {
    if (!attachment) return
    if (attachment.contentBase64) {
      const byteCharacters = atob(attachment.contentBase64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let index = 0; index < byteCharacters.length; index += 1) {
        byteNumbers[index] = byteCharacters.charCodeAt(index)
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: attachment.type || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = attachment.name || 'attachment'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return
    }

    if (attachment.url) {
      window.open(attachment.url, '_blank', 'noopener,noreferrer')
    }
  }

  const submitCompose = (saveAsDraft = false) => {
    const payload = {
      saveAsDraft,
      to: parseAddressList(composeState?.to),
      cc: parseAddressList(composeState?.cc),
      bcc: parseAddressList(composeState?.bcc),
      subject: String(composeState?.subject || '').trim(),
      bodyText: String(composeState?.bodyText || '').trim(),
      bodyHtml: plainTextToHtml(composeState?.bodyText || ''),
      attachments: (composeState?.attachments || []).map((attachment) => ({
        filename: attachment.name,
        contentType: attachment.type,
        size: attachment.size,
        contentBase64: attachment.contentBase64,
        contentId: attachment.contentId,
      })),
    }
    sendMutation.mutate(payload)
  }

  const currentEmailSettings = emailSettingsQuery.data?.email || tenant?.settings?.communication?.email || {}
  const folders = useMemo(() => folderOptions(language), [language])

  if (!hasEmailAddon) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isArabic ? 'التواصل عبر البريد' : 'Email Communication'}</h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">{isArabic ? 'إدارة البريد الوارد والمرسل وإرسال الفواتير تلقائياً.' : 'Manage inbox, sent mail, and automated invoice delivery.'}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            {isArabic ? 'إضافة مطلوبة' : 'Add-on Required'}
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden border border-amber-200 dark:border-amber-900/40">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 text-white">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 w-5 h-5" />
              <div>
                <h2 className="text-lg font-semibold">{isArabic ? 'ميزة البريد الإلكتروني متاحة كإضافة' : 'Email communication is available as an add-on'}</h2>
                <p className="mt-1 text-sm text-white/85">{isArabic ? 'فعّل الإضافة لإتاحة صندوق البريد، استقبال الرسائل، والإرسال التلقائي للفواتير.' : 'Activate the add-on to unlock the mailbox, inbound parsing, and automatic invoice delivery.'}</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 px-6 py-6 md:grid-cols-3">
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{isArabic ? 'العميل الكامل' : 'Full Client'}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{isArabic ? 'صندوق وارد وصادر ومسودات بتجربة شبيهة ببرامج البريد.' : 'Inbox, sent, and drafts with a familiar email-client experience.'}</p>
            </div>
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-dark-700/50">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">{isArabic ? 'تسليم تلقائي' : 'Auto Delivery'}</p>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">{isArabic ? 'إرسال تلقائي للفواتير بعد الاعتماد مع قوالب عربية وإنجليزية.' : 'Automatic invoice delivery after approval with English and Arabic templates.'}</p>
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
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{isArabic ? 'التواصل عبر البريد' : 'Email Communication'}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{isArabic ? 'إدارة صندوق البريد للشركة، القوالب الثنائية، والهويات البريدية.' : 'Manage the tenant mailbox, bilingual templates, and sender identities.'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            {isArabic ? 'الإضافة مفعلة' : 'Add-on Active'}
          </div>
          <button type="button" onClick={() => messagesQuery.refetch()} className="btn btn-secondary">
            <RefreshCw className={`h-4 w-4 ${messagesQuery.isFetching ? 'animate-spin' : ''}`} />
            {isArabic ? 'تحديث' : 'Refresh'}
          </button>
          <button type="button" onClick={() => setShowSettings(true)} className="btn btn-secondary">
            <Settings2 className="h-4 w-4" />
            {isArabic ? 'الإعدادات' : 'Settings'}
          </button>
          <button type="button" onClick={() => setComposeState(buildComposeState())} className="btn btn-action-dark">
            <PenSquare className="h-4 w-4" />
            {isArabic ? 'رسالة جديدة' : 'Compose'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[240px_340px_minmax(0,1fr)]">
        <div className="card p-4">
          <div className="mb-4 rounded-3xl bg-gradient-to-br from-[#163b27] to-[#245138] p-5 text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{currentEmailSettings?.senderName || tenant?.business?.legalNameEn || tenant?.name}</h2>
                <p className="mt-1 text-sm text-white/75">{currentEmailSettings?.fromEmail || currentEmailSettings?.requestedSenderEmail || tenant?.business?.contactEmail || (isArabic ? 'قم بإعداد الهوية البريدية' : 'Configure your sender identity')}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {folders.map((folder) => {
              const Icon = folder.icon
              const folderMeta = counts?.[folder.key] || { count: 0, unread: 0 }
              const isActive = activeFolder === folder.key
              return (
                <button
                  key={folder.key}
                  type="button"
                  onClick={() => {
                    setActiveFolder(folder.key)
                    setComposeState(null)
                  }}
                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-start transition-all ${isActive ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200' : 'hover:bg-gray-50 dark:hover:bg-dark-800 text-gray-700 dark:text-gray-200'}`}
                >
                  <span className="flex items-center gap-3 font-medium">
                    <Icon className="h-4 w-4" />
                    {folder.label}
                  </span>
                  <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:bg-dark-700 dark:text-gray-200">{folder.key === 'inbox' ? folderMeta.unread : folderMeta.count}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-gray-200 p-4 dark:border-dark-700">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} className="input pl-10" placeholder={isArabic ? 'ابحث في الرسائل...' : 'Search emails...'} />
            </div>
          </div>
          <div className="max-h-[680px] overflow-y-auto">
            {messagesQuery.isLoading ? (
              <div className="flex justify-center p-10"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" /></div>
            ) : messages.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'لا توجد رسائل في هذا المجلد حالياً.' : 'No messages in this folder yet.'}</div>
            ) : messages.map((message) => (
              <button
                key={message._id}
                type="button"
                onClick={() => handleOpenMessage(message)}
                className={`w-full border-b border-gray-100 px-4 py-4 text-start transition-colors last:border-b-0 dark:border-dark-800 ${selectedMessageId === message._id && !composeState ? 'bg-primary-50/70 dark:bg-primary-900/15' : 'hover:bg-gray-50 dark:hover:bg-dark-800/70'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {message.isRead ? <MailOpen className="h-4 w-4 text-gray-400" /> : <Mail className="h-4 w-4 text-primary-600" />}
                      <p className={`truncate text-sm ${message.isRead ? 'font-medium text-gray-700 dark:text-gray-200' : 'font-semibold text-gray-900 dark:text-white'}`}>{message.subject || (isArabic ? 'بدون موضوع' : 'No subject')}</p>
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">{message.type === 'sent' ? (Array.isArray(message.to) ? message.to.join(', ') : '') : message.from}</p>
                    <p className="mt-2 max-h-10 overflow-hidden text-sm text-gray-500 dark:text-gray-400">{message.previewText || message.bodyText || ''}</p>
                  </div>
                  <div className="shrink-0 text-xs text-gray-400">{formatDateTime(message.createdAt, language)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="card min-h-[680px] overflow-hidden">
          {composeState ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-dark-700">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'إنشاء رسالة' : 'Compose Email'}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'يمكنك الإرسال فوراً أو حفظ الرسالة كمسودة.' : 'Send immediately or save the email as a draft.'}</p>
                </div>
                <button type="button" onClick={() => setComposeState(null)} className="btn btn-secondary">{isArabic ? 'إغلاق' : 'Close'}</button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                <div>
                  <label className="label">{isArabic ? 'إلى' : 'To'}</label>
                  <input value={composeState.to} onChange={(event) => setComposeState((current) => ({ ...(current || buildComposeState()), to: event.target.value }))} className="input" placeholder="customer@example.com" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label">CC</label>
                    <input value={composeState.cc} onChange={(event) => setComposeState((current) => ({ ...(current || buildComposeState()), cc: event.target.value }))} className="input" placeholder="finance@example.com" />
                  </div>
                  <div>
                    <label className="label">BCC</label>
                    <input value={composeState.bcc} onChange={(event) => setComposeState((current) => ({ ...(current || buildComposeState()), bcc: event.target.value }))} className="input" placeholder="audit@example.com" />
                  </div>
                </div>
                <div>
                  <label className="label">{isArabic ? 'الموضوع' : 'Subject'}</label>
                  <input value={composeState.subject} onChange={(event) => setComposeState((current) => ({ ...(current || buildComposeState()), subject: event.target.value }))} className="input" placeholder={isArabic ? 'اكتب موضوع الرسالة' : 'Write the subject'} />
                </div>
                <div>
                  <label className="label">{isArabic ? 'الرسالة' : 'Message'}</label>
                  <textarea value={composeState.bodyText} onChange={(event) => setComposeState((current) => ({ ...(current || buildComposeState()), bodyText: event.target.value }))} rows={16} className="input min-h-[320px]" placeholder={isArabic ? 'اكتب محتوى البريد هنا...' : 'Write your email here...'} />
                </div>
                <div className="rounded-2xl border border-dashed border-gray-300 p-4 dark:border-dark-600">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{isArabic ? 'المرفقات' : 'Attachments'}</p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'أضف ملفات ليتم إرسالها مع الرسالة.' : 'Add files to send along with the email.'}</p>
                    </div>
                    <label className="btn btn-secondary cursor-pointer">
                      <Paperclip className="h-4 w-4" />
                      {isArabic ? 'إرفاق ملفات' : 'Attach Files'}
                      <input type="file" multiple className="hidden" onChange={handleAttachmentChange} />
                    </label>
                  </div>
                  {composeState.attachments?.length ? (
                    <div className="mt-4 space-y-2">
                      {composeState.attachments.map((attachment, index) => (
                        <div key={`${attachment.name}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl bg-gray-50 px-3 py-2 text-sm dark:bg-dark-800">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 dark:text-white">{attachment.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{attachment.size ? `${Math.max(1, Math.round(attachment.size / 1024))} KB` : attachment.type}</p>
                          </div>
                          <button type="button" onClick={() => handleRemoveAttachment(index)} className="text-sm font-medium text-red-600">{isArabic ? 'إزالة' : 'Remove'}</button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-5 py-4 dark:border-dark-700">
                <button type="button" onClick={() => submitCompose(true)} disabled={sendMutation.isPending} className="btn btn-secondary">
                  {sendMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-600 border-t-transparent" /> : <><Save className="h-4 w-4" />{isArabic ? 'حفظ كمسودة' : 'Save Draft'}</>}
                </button>
                <button type="button" onClick={() => submitCompose(false)} disabled={sendMutation.isPending} className="btn btn-action-dark">
                  {sendMutation.isPending ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <><Send className="h-4 w-4" />{isArabic ? 'إرسال' : 'Send Email'}</>}
                </button>
              </div>
            </div>
          ) : selectedMessage ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-gray-200 px-5 py-4 dark:border-dark-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedMessage.subject || (isArabic ? 'بدون موضوع' : 'No subject')}</h2>
                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                      <span>{selectedMessage.type === 'sent' ? `${isArabic ? 'إلى' : 'To'}: ${(selectedMessage.to || []).join(', ')}` : `${isArabic ? 'من' : 'From'}: ${selectedMessage.from}`}</span>
                      <span>{formatDateTime(selectedMessage.createdAt, language)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedMessage.type !== 'draft' ? (
                      <button type="button" onClick={handleReply} className="btn btn-secondary">
                        <Reply className="h-4 w-4" />
                        {isArabic ? 'رد' : 'Reply'}
                      </button>
                    ) : null}
                    {selectedMessage.type === 'draft' ? (
                      <button type="button" onClick={() => setComposeState(buildComposeState(selectedMessage))} className="btn btn-action-dark">
                        <PenSquare className="h-4 w-4" />
                        {isArabic ? 'تحرير' : 'Edit Draft'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="max-w-none text-sm leading-7 text-gray-700 dark:text-gray-200">
                  {selectedMessage.bodyHtml ? <div dangerouslySetInnerHTML={{ __html: selectedMessage.bodyHtml }} /> : <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 dark:text-gray-200">{selectedMessage.bodyText || ''}</pre>}
                </div>

                {selectedMessage.attachments?.length ? (
                  <div className="mt-6 rounded-3xl border border-gray-200 bg-gray-50/70 p-4 dark:border-dark-700 dark:bg-dark-800/50">
                    <div className="mb-3 flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-primary-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{isArabic ? 'المرفقات' : 'Attachments'}</h3>
                    </div>
                    <div className="space-y-2">
                      {selectedMessage.attachments.map((attachment, index) => (
                        <button key={`${attachment.name}-${index}`} type="button" onClick={() => handleDownloadAttachment(attachment)} className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3 text-start shadow-sm transition hover:bg-primary-50 dark:bg-dark-900 dark:hover:bg-dark-700">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{attachment.name}</p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{attachment.type || 'attachment'}</p>
                          </div>
                          <Paperclip className="h-4 w-4 text-primary-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
              <div className="rounded-3xl bg-primary-50 p-4 text-primary-700 dark:bg-primary-900/20 dark:text-primary-200">
                <Mail className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{isArabic ? 'اختر رسالة لعرضها' : 'Select an email to view'}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{isArabic ? 'يمكنك أيضاً إنشاء رسالة جديدة من الأعلى.' : 'You can also start a new message from the top action bar.'}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <EmailSettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(values) => settingsMutation.mutate(values)}
        isSaving={settingsMutation.isPending}
        language={language}
        initialSettings={currentEmailSettings}
        tenant={tenant}
      />
    </div>
  )
}
