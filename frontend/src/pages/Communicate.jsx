import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Search, Send, Plus, X, Tag, ChevronRight,
  Clock, Inbox, Activity, Users, FileText, ShoppingCart,
  Briefcase, CheckSquare, Globe, Circle, Edit3, Paperclip, Hash
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatRelative(dateStr, isAr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr)) / 1000
  if (diff < 60) return isAr ? 'الآن' : 'Just now'
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return isAr ? `منذ ${m} دقيقة` : `${m}m ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return isAr ? `منذ ${h} ساعة` : `${h}h ago`
  }
  const d = Math.floor(diff / 86400)
  return isAr ? `منذ ${d} يوم` : `${d}d ago`
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const TAG_TYPES = [
  { value: 'invoice', label: 'Invoice', labelAr: 'فاتورة', icon: FileText, color: 'blue' },
  { value: 'project', label: 'Project', labelAr: 'مشروع', icon: Briefcase, color: 'purple' },
  { value: 'order', label: 'Order', labelAr: 'طلب', icon: ShoppingCart, color: 'orange' },
  { value: 'task', label: 'Task', labelAr: 'مهمة', icon: CheckSquare, color: 'green' },
  { value: 'general', label: 'General', labelAr: 'عام', icon: Globe, color: 'gray' },
]

const TAG_COLOR_MAP = {
  invoice: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  project: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  order: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  task: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  general: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
}

// ─── sub-components ───────────────────────────────────────────────────────────

function AvatarBubble({ name, size = 'md', color = 0 }) {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-600',
  ]
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${colors[color % colors.length]} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}>
      {getInitials(name)}
    </div>
  )
}

function TagBadge({ tag }) {
  const def = TAG_TYPES.find(t => t.value === tag?.type) || TAG_TYPES[4]
  const Icon = def.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TAG_COLOR_MAP[def.value]}`}>
      <Icon className="w-3 h-3" />
      {def.label}{tag?.refId ? ` #${tag.refId}` : ''}
    </span>
  )
}

// ─── modals ───────────────────────────────────────────────────────────────────

function NewMessageModal({ users, onClose, onSent, isAr, currentUser }) {
  const [recipient, setRecipient] = useState('')
  const [body, setBody] = useState('')
  const [tagType, setTagType] = useState('general')
  const [refId, setRefId] = useState('')
  const qc = useQueryClient()

  const { mutate: sendMsg, isPending } = useMutation({
    mutationFn: (data) => api.post('/communicate', data),
    onSuccess: () => {
      toast.success(isAr ? 'تم إرسال الرسالة' : 'Message sent')
      qc.invalidateQueries({ queryKey: ['communicate-messages'] })
      onSent?.()
      onClose()
    },
    onError: (err) => toast.error(err.userMessage || 'Failed to send'),
  })

  const handleSend = () => {
    if (!recipient || !body.trim()) return toast.error(isAr ? 'يرجى تحديد المستلم وكتابة الرسالة' : 'Select recipient and write a message')
    sendMsg({
      recipient,
      body: body.trim(),
      tags: [{ type: tagType, refId: refId.trim() || undefined }]
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-dark-800 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-100 dark:border-dark-700 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white font-bold text-lg">
              {isAr ? 'رسالة جديدة' : 'New Message'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipient */}
          <div>
            <label className="label">{isAr ? 'المستلم' : 'To'}</label>
            <select
              className="select w-full mt-1"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            >
              <option value="">{isAr ? '-- اختر مستلماً --' : '-- Select recipient --'}</option>
              {users?.filter(u => u._id !== currentUser?._id).map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div>
            <label className="label">{isAr ? 'الرسالة' : 'Message'}</label>
            <textarea
              className="input w-full mt-1 resize-none"
              rows={4}
              placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>

          {/* Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{isAr ? 'نوع الوسم' : 'Tag Type'}</label>
              <select className="select w-full mt-1" value={tagType} onChange={e => setTagType(e.target.value)}>
                {TAG_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{isAr ? 'رقم المرجع (اختياري)' : 'Ref ID (optional)'}</label>
              <input
                className="input w-full mt-1"
                placeholder="INV-001"
                value={refId}
                onChange={e => setRefId(e.target.value)}
              />
            </div>
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isPending}
            className="btn btn-primary w-full justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isPending ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال' : 'Send Message')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function Communicate() {
  const { language } = useSelector(s => s.ui)
  const { user } = useSelector(s => s.auth)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const [activeView, setActiveView] = useState('inbox') // 'inbox' | 'activity'
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [search, setSearch] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [replyTagType, setReplyTagType] = useState('general')
  const [replyRefId, setReplyRefId] = useState('')
  const [showNewMsg, setShowNewMsg] = useState(false)

  const messagesEndRef = useRef(null)
  const qc = useQueryClient()

  // ── queries ──────────────────────────────────────────────────────────────
  const { data: usersData } = useQuery({
    queryKey: ['communicate-users'],
    queryFn: () => api.get('/communicate/users').then(r => r.data),
    staleTime: 30000,
  })

  const { data: messagesData } = useQuery({
    queryKey: ['communicate-messages', selectedUser?._id],
    queryFn: () => api.get('/communicate', { params: { userId: selectedUser?._id } }).then(r => r.data),
    enabled: true,
    refetchInterval: 5000,
  })

  const { data: threadData } = useQuery({
    queryKey: ['communicate-thread', selectedMsg?._id],
    queryFn: () => api.get(`/communicate/threads/${selectedMsg?._id}`).then(r => r.data),
    enabled: !!selectedMsg?._id,
    refetchInterval: 5000,
  })

  const { mutate: sendReply, isPending: sending } = useMutation({
    mutationFn: (data) => api.post('/communicate', data),
    onSuccess: () => {
      setReplyBody('')
      setReplyRefId('')
      setReplyTagType('general')
      qc.invalidateQueries({ queryKey: ['communicate-thread', selectedMsg?._id] })
      qc.invalidateQueries({ queryKey: ['communicate-messages'] })
    },
    onError: (err) => toast.error(err.userMessage || t('Failed to send', 'فشل الإرسال')),
  })

  const users = usersData?.users || usersData || []
  const messages = messagesData?.messages || messagesData || []
  const thread = threadData?.thread || threadData

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  const filteredMessages = selectedUser
    ? messages.filter(m => m.sender?._id === selectedUser._id || m.recipient?._id === selectedUser._id)
    : messages

  const taggedMessages = messages.filter(m => m.tags?.length)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [thread])

  const handleSendReply = () => {
    if (!replyBody.trim()) return
    sendReply({
      body: replyBody.trim(),
      thread: selectedMsg?._id,
      recipient: thread?.parent?.sender?._id === user?._id
        ? thread?.parent?.recipient?._id
        : thread?.parent?.sender?._id,
      tags: replyTagType !== 'general' ? [{ type: replyTagType, refId: replyRefId.trim() || undefined }] : [],
    })
  }

  // ── thread replies
  const replies = thread?.replies || []
  const parent = thread?.parent || selectedMsg

  return (
    <div className={`flex h-[calc(100vh-6rem)] overflow-hidden rounded-2xl border border-gray-200 dark:border-dark-700 shadow-xl bg-white dark:bg-dark-900 ${isAr ? 'rtl' : 'ltr'}`}>

      {/* ── LEFT: Users list ──────────────────────────────────────────────── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col bg-gradient-to-b from-gray-900 via-dark-900 to-gray-950 border-r border-dark-700">
        {/* Header */}
        <div className="px-4 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white font-bold text-base">{t('Messages', 'الرسائل')}</h2>
          </div>
          <button
            onClick={() => setShowNewMsg(true)}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-primary-600 flex items-center justify-center text-gray-300 hover:text-white transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* View tabs */}
        <div className="flex mx-3 mt-3 rounded-xl overflow-hidden bg-white/5 p-0.5">
          {[
            { id: 'inbox', label: t('Inbox', 'البريد'), icon: Inbox },
            { id: 'activity', label: t('Activity', 'النشاط'), icon: Activity },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => setActiveView(v.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeView === v.id
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <v.icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 mt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              placeholder={t('Search users...', 'البحث...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto mt-3 px-2 pb-4 space-y-1">
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-600 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>{t('No users found', 'لا يوجد مستخدمون')}</p>
            </div>
          )}
          {filteredUsers.map((u, idx) => {
            const unread = messages.filter(m => m.sender?._id === u._id && !m.read).length
            const isActive = selectedUser?._id === u._id
            return (
              <motion.button
                key={u._id}
                whileHover={{ x: 2 }}
                onClick={() => { setSelectedUser(u); setSelectedMsg(null) }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  isActive
                    ? 'bg-primary-600/20 border border-primary-500/30'
                    : 'hover:bg-white/5 border border-transparent'
                }`}
              >
                <div className="relative">
                  <AvatarBubble name={u.name} size="md" color={idx} />
                  {/* Status dot */}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-gray-900" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate ${isActive ? 'text-primary-300' : 'text-gray-200'}`}>{u.name}</p>
                  <p className="text-xs text-gray-500 truncate capitalize">{u.role}</p>
                </div>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {unread}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* ── CENTER: Messages ──────────────────────────────────────────────── */}
      <div className="w-[350px] flex-shrink-0 flex flex-col border-r border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50">
        {/* Center header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
          <h3 className="font-bold text-gray-900 dark:text-white">
            {activeView === 'inbox'
              ? (selectedUser ? selectedUser.name : t('All Messages', 'جميع الرسائل'))
              : t('Activity Feed', 'سجل النشاط')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {activeView === 'inbox'
              ? `${filteredMessages.length} ${t('messages', 'رسالة')}`
              : `${taggedMessages.length} ${t('tagged items', 'عنصر موسوم')}`}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {activeView === 'inbox' ? (
            filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Inbox className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">{t('No messages yet', 'لا توجد رسائل بعد')}</p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isSelected = selectedMsg?._id === msg._id
                const isUnread = !msg.read && msg.recipient?._id === user?._id
                const senderName = msg.sender?.name || t('Unknown', 'غير معروف')
                return (
                  <motion.button
                    key={msg._id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setSelectedMsg(msg)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700 shadow-md'
                        : isUnread
                          ? 'bg-white dark:bg-dark-800 border-l-4 border-l-blue-500 border-r border-t border-b border-gray-100 dark:border-dark-700'
                          : 'bg-white dark:bg-dark-800 border-gray-100 dark:border-dark-700 hover:border-gray-200 dark:hover:border-dark-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AvatarBubble name={senderName} size="sm" color={senderName.charCodeAt(0) % 6} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {senderName}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                            {formatRelative(msg.createdAt, isAr)}
                          </span>
                        </div>
                        <p className={`text-xs truncate mb-2 ${isUnread ? 'text-gray-800 dark:text-gray-200' : 'text-gray-500 dark:text-gray-400'}`}>
                          {msg.body}
                        </p>
                        {msg.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {msg.tags.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                          </div>
                        )}
                      </div>
                    </div>
                    {isUnread && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-4 right-4" />
                    )}
                  </motion.button>
                )
              })
            )
          ) : (
            // Activity Feed
            Object.entries(
              taggedMessages.reduce((acc, msg) => {
                const type = msg.tags?.[0]?.type || 'general'
                if (!acc[type]) acc[type] = []
                acc[type].push(msg)
                return acc
              }, {})
            ).map(([type, msgs]) => {
              const def = TAG_TYPES.find(t => t.value === type) || TAG_TYPES[4]
              const Icon = def.icon
              return (
                <div key={type} className="mb-4">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {isAr ? def.labelAr : def.label}
                    </span>
                    <span className="text-xs bg-gray-200 dark:bg-dark-600 text-gray-500 px-2 py-0.5 rounded-full">{msgs.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {msgs.map(msg => (
                      <motion.button
                        key={msg._id}
                        whileHover={{ x: 2 }}
                        onClick={() => { setSelectedMsg(msg); setActiveView('inbox') }}
                        className="w-full text-left px-3 py-3 rounded-xl bg-white dark:bg-dark-800 border border-gray-100 dark:border-dark-700 hover:border-primary-200 dark:hover:border-primary-700 transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{msg.sender?.name}</span>
                              {' → '}
                              <span>{msg.recipient?.name}</span>
                            </p>
                            <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{msg.body}</p>
                            <div className="flex gap-1 mt-1.5">
                              {msg.tags?.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap">{formatRelative(msg.createdAt, isAr)}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── RIGHT: Thread View ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-dark-900 min-w-0">
        {!selectedMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-gray-600">
            <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-dark-800 flex items-center justify-center">
              <MessageSquare className="w-10 h-10 opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-500 dark:text-gray-400">{t('Select a message', 'اختر رسالة')}</p>
              <p className="text-sm mt-1">{t('Pick a conversation to view the thread', 'اختر محادثة لعرض تفاصيلها')}</p>
            </div>
            <button onClick={() => setShowNewMsg(true)} className="btn btn-primary gap-2">
              <Plus className="w-4 h-4" />
              {t('New Message', 'رسالة جديدة')}
            </button>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 flex items-center gap-4">
              <AvatarBubble name={parent?.sender?.name || ''} size="md" color={(parent?.sender?.name || '').charCodeAt(0) % 6} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white truncate">{parent?.sender?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('to', 'إلى')} {parent?.recipient?.name} · {formatRelative(parent?.createdAt, isAr)}
                </p>
              </div>
              <div className="flex gap-2">
                {parent?.tags?.map((tag, i) => <TagBadge key={i} tag={tag} />)}
              </div>
              <button onClick={() => setSelectedMsg(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thread body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Parent message */}
              <div className={`flex gap-3 ${parent?.sender?._id === user?._id ? 'flex-row-reverse' : ''}`}>
                <AvatarBubble name={parent?.sender?.name || ''} size="sm" color={(parent?.sender?.name || '').charCodeAt(0) % 6} />
                <div className={`max-w-[70%] ${parent?.sender?._id === user?._id ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                    parent?.sender?._id === user?._id
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                  }`}>
                    <p className="text-sm leading-relaxed">{parent?.body}</p>
                  </div>
                  {parent?.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {parent.tags.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                    </div>
                  )}
                  <span className="text-xs text-gray-400">{formatRelative(parent?.createdAt, isAr)}</span>
                </div>
              </div>

              {/* Separator */}
              {replies.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-100 dark:bg-dark-700" />
                  <span className="text-xs text-gray-400 px-2">{replies.length} {t('replies', 'رد')}</span>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-dark-700" />
                </div>
              )}

              {/* Replies */}
              {replies.map((reply) => (
                <motion.div
                  key={reply._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${reply.sender?._id === user?._id ? 'flex-row-reverse' : ''}`}
                >
                  <AvatarBubble name={reply.sender?.name || ''} size="sm" color={(reply.sender?.name || '').charCodeAt(0) % 6} />
                  <div className={`max-w-[70%] flex flex-col gap-1 ${reply.sender?._id === user?._id ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-3 rounded-2xl shadow-sm ${
                      reply.sender?._id === user?._id
                        ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm'
                        : 'bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                    }`}>
                      <p className="text-sm leading-relaxed">{reply.body}</p>
                    </div>
                    {reply.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {reply.tags.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                      </div>
                    )}
                    <span className="text-xs text-gray-400">{formatRelative(reply.createdAt, isAr)}</span>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply composer */}
            <div className="border-t border-gray-100 dark:border-dark-700 bg-white dark:bg-dark-800 p-4">
              {/* Tag selectors */}
              <div className="flex gap-2 mb-3">
                <select
                  className="select text-xs py-1.5 pl-2 pr-7"
                  value={replyTagType}
                  onChange={e => setReplyTagType(e.target.value)}
                >
                  {TAG_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
                  ))}
                </select>
                {replyTagType !== 'general' && (
                  <input
                    className="input text-xs py-1.5 w-32"
                    placeholder={t('Ref ID...', 'رقم المرجع...')}
                    value={replyRefId}
                    onChange={e => setReplyRefId(e.target.value)}
                  />
                )}
              </div>

              {/* Text + send */}
              <div className="flex gap-3">
                <textarea
                  className="input flex-1 resize-none text-sm"
                  rows={2}
                  placeholder={isAr ? 'اكتب ردًا...' : 'Write a reply...'}
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendReply()
                  }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyBody.trim()}
                  className="btn btn-primary px-4 flex-shrink-0 self-end"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1.5 ms-1">{t('Ctrl+Enter to send', 'Ctrl+Enter للإرسال')}</p>
            </div>
          </>
        )}
      </div>

      {/* New Message Modal */}
      <AnimatePresence>
        {showNewMsg && (
          <NewMessageModal
            users={users}
            onClose={() => setShowNewMsg(false)}
            isAr={isAr}
            currentUser={user}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
