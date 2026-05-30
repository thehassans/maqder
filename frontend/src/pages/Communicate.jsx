import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Search, Send, Plus, X,
  Inbox, Activity, Users, FileText, ShoppingCart,
  Briefcase, CheckSquare, Globe, Edit3, Lock
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
    return isAr ? `منذ ${m} دقيقة` : `${m}m`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return isAr ? `منذ ${h} ساعة` : `${h}h`
  }
  const d = Math.floor(diff / 86400)
  return isAr ? `منذ ${d} يوم` : `${d}d`
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
  invoice: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-800',
  project: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-800',
  order: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 border-orange-100 dark:border-orange-800',
  task: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-800',
  general: 'bg-gray-50 text-gray-600 dark:bg-dark-800 dark:text-gray-400 border-gray-200 dark:border-dark-700',
}

// ─── sub-components ───────────────────────────────────────────────────────────

function AvatarBubble({ name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm'
  return (
    <div className={`${sz} rounded-full bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 flex items-center justify-center font-medium flex-shrink-0 border border-gray-200 dark:border-dark-700`}>
      {getInitials(name)}
    </div>
  )
}

function TagBadge({ tag }) {
  const def = TAG_TYPES.find(t => t.value === tag?.type) || TAG_TYPES[4]
  const Icon = def.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${TAG_COLOR_MAP[def.value]}`}>
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
  
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin'

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
    if (!recipient || !body.trim()) return toast.error(isAr ? 'يرجى التحديد والكتابة' : 'Select recipient and write')
    sendMsg({
      toUser: recipient,
      body: body.trim(),
      tags: isAdmin && tagType !== 'general' ? [{ type: tagType, refId: refId.trim() || undefined }] : []
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="bg-white dark:bg-dark-900 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-dark-800 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-800 flex items-center justify-between">
          <h2 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-gray-400" />
            {isAr ? 'رسالة جديدة' : 'New Message'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <select
              className="w-full bg-transparent border-b border-gray-200 dark:border-dark-700 py-2 text-sm focus:outline-none focus:border-gray-900 dark:focus:border-white transition-colors"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
            >
              <option value="">{isAr ? 'إلى: (اختر مستلماً)' : 'To: (Select recipient)'}</option>
              {users?.filter(u => u._id !== currentUser?._id).map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div>
            <textarea
              className="w-full bg-transparent border-none py-2 text-sm focus:outline-none focus:ring-0 resize-none placeholder-gray-400 min-h-[100px]"
              placeholder={isAr ? 'اكتب رسالتك...' : 'Write your message...'}
              value={body}
              onChange={e => setBody(e.target.value)}
            />
          </div>

          {isAdmin && (
            <div className="flex gap-3 bg-gray-50 dark:bg-dark-800 p-3 rounded-xl border border-gray-100 dark:border-dark-700">
              <select className="bg-transparent border-none text-xs focus:ring-0 text-gray-600 dark:text-gray-300 w-1/2 cursor-pointer" value={tagType} onChange={e => setTagType(e.target.value)}>
                {TAG_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{isAr ? t.labelAr : t.label}</option>
                ))}
              </select>
              {tagType !== 'general' && (
                <input
                  className="bg-transparent border-none text-xs focus:ring-0 text-gray-600 dark:text-gray-300 w-1/2 placeholder-gray-400"
                  placeholder={isAr ? '# المرجع' : '# Ref ID'}
                  value={refId}
                  onChange={e => setRefId(e.target.value)}
                />
              )}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handleSend}
              disabled={isPending}
              className="w-full bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isPending ? (isAr ? 'إرسال...' : 'Sending...') : (isAr ? 'إرسال' : 'Send')}
            </button>
          </div>
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

  const [activeView, setActiveView] = useState('inbox')
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedMsg, setSelectedMsg] = useState(null)
  const [search, setSearch] = useState('')
  const [replyBody, setReplyBody] = useState('')
  const [showNewMsg, setShowNewMsg] = useState(false)

  const messagesEndRef = useRef(null)
  const qc = useQueryClient()

  // ── queries
  const { data: usersData } = useQuery({
    queryKey: ['communicate-users'],
    queryFn: () => api.get('/communicate/users').then(r => r.data),
    staleTime: 30000,
  })

  const { data: messagesData } = useQuery({
    queryKey: ['communicate-messages', selectedUser?._id],
    queryFn: () => api.get('/communicate', { params: { userId: selectedUser?._id } }).then(r => r.data),
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
      qc.invalidateQueries({ queryKey: ['communicate-thread', selectedMsg?._id] })
      qc.invalidateQueries({ queryKey: ['communicate-messages'] })
    },
    onError: (err) => toast.error(err.userMessage || t('Failed to send', 'فشل الإرسال')),
  })
  
  const { mutate: closeThread } = useMutation({
    mutationFn: (id) => api.patch(`/communicate/${id}/close`),
    onSuccess: () => {
      toast.success(t('Ticket closed', 'تم إغلاق التذكرة'))
      qc.invalidateQueries({ queryKey: ['communicate-thread', selectedMsg?._id] })
      qc.invalidateQueries({ queryKey: ['communicate-messages'] })
    },
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
      toUser: thread?.parent?.fromUser?._id === user?._id
        ? thread?.parent?.toUser?._id
        : thread?.parent?.fromUser?._id,
    })
  }

  const replies = thread?.replies || []
  const parent = thread?.parent || selectedMsg

  return (
    <div className={`flex h-[calc(100vh-6rem)] bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-[2rem] shadow-sm overflow-hidden ${isAr ? 'rtl' : 'ltr'}`}>
      
      {/* ── LEFT: Users list ── */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-gray-100 dark:border-dark-800 bg-gray-50/30 dark:bg-dark-900">
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium tracking-tight text-gray-900 dark:text-white">{t('Messages', 'الرسائل')}</h2>
            <button
              onClick={() => setShowNewMsg(true)}
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-dark-700 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          <div className="relative mb-6">
            <Search className={`absolute ${isAr ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              className={`w-full bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-full py-2 ${isAr ? 'pr-9 pl-4' : 'pl-9 pr-4'} text-sm placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors`}
              placeholder={t('Search...', 'بحث...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-4 mb-2">
            <button
              onClick={() => setActiveView('inbox')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeView === 'inbox' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {t('Inbox', 'البريد')}
            </button>
            <button
              onClick={() => setActiveView('activity')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${activeView === 'activity' ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {t('Tickets', 'التذاكر')}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
          {filteredUsers.map((u) => {
            const isActive = selectedUser?._id === u._id
            return (
              <button
                key={u._id}
                onClick={() => { setSelectedUser(u); setSelectedMsg(null) }}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                  isActive ? 'bg-white dark:bg-dark-800 shadow-sm border border-gray-100 dark:border-dark-700' : 'hover:bg-gray-100 dark:hover:bg-dark-800 border border-transparent'
                }`}
              >
                <AvatarBubble name={u.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{u.name}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── CENTER: Thread List ── */}
      <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-gray-100 dark:border-dark-800 bg-white dark:bg-dark-900">
        <div className="p-6 border-b border-gray-50 dark:border-dark-800">
          <h3 className="font-medium text-gray-800 dark:text-gray-200">
            {activeView === 'inbox' ? (selectedUser ? selectedUser.name : t('All Chats', 'كل المحادثات')) : t('Tagged Tickets', 'تذاكر موسومة')}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {activeView === 'inbox' ? (
            filteredMessages.map((msg) => {
              const isSelected = selectedMsg?._id === msg._id
              const isUnread = !msg.isRead && msg.toUser?._id === user?._id
              const senderName = msg.fromUser?.name || t('Unknown', 'غير معروف')
              return (
                <button
                  key={msg._id}
                  onClick={() => setSelectedMsg(msg)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-gray-900 dark:border-white shadow-sm bg-gray-50 dark:bg-dark-800'
                      : isUnread
                        ? 'border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-900/10'
                        : 'border-transparent hover:bg-gray-50 dark:hover:bg-dark-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-sm font-medium truncate ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>{senderName}</span>
                    <span className="text-[10px] text-gray-400">{formatRelative(msg.createdAt, isAr)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">{msg.body}</p>
                  <div className="flex flex-wrap gap-1 items-center">
                    {msg.isClosed && <Lock className="w-3 h-3 text-gray-400" />}
                    {msg.tags?.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                  </div>
                </button>
              )
            })
          ) : (
            taggedMessages.map(msg => (
               <button
                  key={msg._id}
                  onClick={() => { setSelectedMsg(msg); setActiveView('inbox') }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedMsg?._id === msg._id
                      ? 'border-gray-900 dark:border-white shadow-sm bg-gray-50 dark:bg-dark-800'
                      : 'border-transparent hover:bg-gray-50 dark:hover:bg-dark-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{msg.fromUser?.name}</span>
                    <span className="text-[10px] text-gray-400">{formatRelative(msg.createdAt, isAr)}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2 leading-relaxed">{msg.body}</p>
                  <div className="flex flex-wrap gap-1 items-center">
                    {msg.isClosed && <Lock className="w-3 h-3 text-gray-400" />}
                    {msg.tags?.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                  </div>
                </button>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT: Chat View ── */}
      <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-dark-900/50 relative">
        {!selectedMsg ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" strokeWidth={1.5} />
              <p className="text-sm">{t('Select a conversation', 'اختر محادثة')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-8 py-5 border-b border-gray-100 dark:border-dark-800 flex items-center justify-between bg-white dark:bg-dark-900">
              <div className="flex items-center gap-3">
                <AvatarBubble name={parent?.fromUser?.name || ''} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{parent?.fromUser?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{t('to', 'إلى')} {parent?.toUser?.name || t('All', 'الجميع')}</span>
                    {parent?.tags?.map((tag, i) => <TagBadge key={i} tag={tag} />)}
                    {parent?.isClosed && (
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full flex items-center gap-1 border border-red-100"><Lock className="w-2.5 h-2.5"/> {t('Closed', 'مغلق')}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!parent?.isClosed && (
                   <button 
                    onClick={() => closeThread(parent._id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
                  >
                    {t('Close Ticket', 'إغلاق التذكرة')}
                  </button>
                )}
                <button onClick={() => setSelectedMsg(null)} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              {/* Parent */}
              <div className={`flex gap-4 ${parent?.fromUser?._id === user?._id ? 'flex-row-reverse' : ''}`}>
                <AvatarBubble name={parent?.fromUser?.name || ''} size="sm" />
                <div className={`max-w-[65%] flex flex-col ${parent?.fromUser?._id === user?._id ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                    parent?.fromUser?._id === user?._id
                      ? 'bg-gray-900 text-white rounded-tr-sm dark:bg-white dark:text-gray-900'
                      : 'bg-white border border-gray-100 dark:bg-dark-800 dark:border-dark-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                  }`}>
                    {parent?.body}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1.5 px-1">{formatRelative(parent?.createdAt, isAr)}</span>
                </div>
              </div>

              {/* Replies */}
              {replies.map(reply => (
                <div key={reply._id} className={`flex gap-4 ${reply.fromUser?._id === user?._id ? 'flex-row-reverse' : ''}`}>
                  <AvatarBubble name={reply.fromUser?.name || ''} size="sm" />
                  <div className={`max-w-[65%] flex flex-col ${reply.fromUser?._id === user?._id ? 'items-end' : 'items-start'}`}>
                    <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed ${
                      reply.fromUser?._id === user?._id
                        ? 'bg-gray-900 text-white rounded-tr-sm dark:bg-white dark:text-gray-900'
                        : 'bg-white border border-gray-100 dark:bg-dark-800 dark:border-dark-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                    }`}>
                      {reply.body}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1.5 px-1">{formatRelative(reply.createdAt, isAr)}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            {parent?.isClosed ? (
              <div className="p-6 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800 text-center text-sm text-gray-500">
                <Lock className="w-4 h-4 mx-auto mb-1 opacity-50"/>
                {t('This ticket is closed and cannot receive new replies.', 'هذه التذكرة مغلقة ولا يمكن الرد عليها.')}
              </div>
            ) : (
              <div className="p-6 bg-white dark:bg-dark-900 border-t border-gray-100 dark:border-dark-800">
                <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-dark-800 border border-gray-200 dark:border-dark-700 rounded-3xl p-2 focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
                  <textarea
                    className="w-full bg-transparent border-none text-sm resize-none py-2 px-4 focus:ring-0 placeholder-gray-400"
                    rows={1}
                    placeholder={t('Type a reply...', 'اكتب ردًا...')}
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendReply()
                      }
                    }}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !replyBody.trim()}
                    className="w-10 h-10 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showNewMsg && <NewMessageModal users={users} onClose={() => setShowNewMsg(false)} isAr={isAr} currentUser={user} />}
      </AnimatePresence>
    </div>
  )
}
