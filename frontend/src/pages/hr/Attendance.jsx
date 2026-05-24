import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Fingerprint, Clock, Users, CheckCircle2, XCircle,
  AlertTriangle, Wifi, WifiOff, RefreshCw, Plus,
  Download, Filter, Search, ChevronRight, X,
  Activity, Calendar, Settings2, Cpu, ScanLine,
  ArrowUpRight, ArrowDownRight, Timer, Shield,
  Signal, Zap, Eye, Trash2, ToggleLeft, ToggleRight,
  TrendingUp, UserCheck, UserX, Coffee
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

/* ─── helpers ──────────────────────────────────────────────── */
const fmtDate = (v, language) => {
  if (!v) return '—'
  return new Date(v).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}
const fmtTime = (v) => {
  if (!v) return '—'
  return new Date(v).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}
const fmtDateTime = (v, language) => {
  if (!v) return '—'
  return new Date(v).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-GB', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}
const today = () => new Date().toISOString().split('T')[0]
const monthStart = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

const STATUS_STYLE = {
  present:   'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',
  absent:    'bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20',
  late:      'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',
  early:     'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20',
  leave:     'bg-violet-500/10 text-violet-700 dark:text-violet-400 border border-violet-500/20',
  holiday:   'bg-pink-500/10 text-pink-700 dark:text-pink-400 border border-pink-500/20',
  weekend:   'bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-600',
}
const EVENT_STYLE = {
  check_in:  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  check_out: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  break_in:  'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  break_out: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  manual:    'bg-violet-500/10 text-violet-600 dark:text-violet-400',
}
const DEVICE_STATUS_STYLE = {
  online:  'bg-emerald-500 shadow-emerald-500/40',
  offline: 'bg-gray-400',
  error:   'bg-red-500 shadow-red-500/40',
  syncing: 'bg-amber-500 shadow-amber-500/40 animate-pulse',
}

/* ─── sub-components ───────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, gradient, trend }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 flex items-center gap-4 relative overflow-hidden group hover:shadow-lg transition-all"
    >
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
          {Math.abs(trend)}%
        </div>
      )}
    </motion.div>
  )
}

function DeviceStatusDot({ status }) {
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full shadow-md ${DEVICE_STATUS_STYLE[status] || DEVICE_STATUS_STYLE.offline}`} />
  )
}

function TabPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
        active
          ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700'
      }`}
    >
      {children}
    </button>
  )
}

/* ─── Device Form Panel ─────────────────────────────────────── */
function DevicePanel({ device, onClose, language, onSaved }) {
  const queryClient = useQueryClient()
  const isEdit = Boolean(device?._id)
  const [form, setForm] = useState({
    name: device?.name || '',
    location: device?.location || '',
    ipAddress: device?.ipAddress || '',
    port: device?.port || '4370',
    serialNumber: device?.serialNumber || '',
    model: device?.model || '',
    manufacturer: device?.manufacturer || 'ZKTeco',
    type: device?.type || 'fingerprint',
    syncInterval: device?.syncInterval || 5,
    enabled: device?.enabled !== false,
  })

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? api.put(`/attendance/devices/${device._id}`, payload).then(r => r.data)
        : api.post('/attendance/devices', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(isEdit
        ? (language === 'ar' ? 'تم تحديث الجهاز' : 'Device updated')
        : (language === 'ar' ? 'تمت إضافة الجهاز' : 'Device added'))
      queryClient.invalidateQueries(['attendance-devices'])
      onSaved?.()
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const pingMutation = useMutation({
    mutationFn: () => api.post(`/attendance/devices/${device?._id}/ping`).then(r => r.data),
    onSuccess: (data) => toast.success(data?.message || (language === 'ar' ? 'الجهاز متصل' : 'Device reachable')),
    onError: () => toast.error(language === 'ar' ? 'الجهاز غير متصل' : 'Device unreachable'),
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/attendance/devices/${device?._id}/sync`).then(r => r.data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'بدء المزامنة' : 'Sync started')
      queryClient.invalidateQueries(['attendance-logs'])
      queryClient.invalidateQueries(['attendance-summary'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Sync failed'),
  })

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="card overflow-hidden flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">{isEdit ? (language === 'ar' ? 'تعديل جهاز' : 'Edit Device') : (language === 'ar' ? 'جهاز جديد' : 'New Device')}</p>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{isEdit ? device.name : (language === 'ar' ? 'إضافة جهاز بيومتري' : 'Add Biometric Device')}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{language === 'ar' ? 'اسم الجهاز *' : 'Device Name *'}</label>
            <input className="input text-sm" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Main Entrance" />
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'الموقع *' : 'Location *'}</label>
            <input className="input text-sm" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Head Office" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{language === 'ar' ? 'عنوان IP *' : 'IP Address *'}</label>
            <input className="input text-sm font-mono" value={form.ipAddress} onChange={e => setForm(f => ({ ...f, ipAddress: e.target.value }))} placeholder="192.168.1.100" />
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'المنفذ' : 'Port'}</label>
            <input className="input text-sm font-mono" value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))} placeholder="4370" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{language === 'ar' ? 'الرقم التسلسلي' : 'Serial Number'}</label>
            <input className="input text-sm" value={form.serialNumber} onChange={e => setForm(f => ({ ...f, serialNumber: e.target.value }))} placeholder="ZK-ABCD-1234" />
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'الموديل' : 'Model'}</label>
            <input className="input text-sm" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="ZKTeco K40" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">{language === 'ar' ? 'المصنّع' : 'Manufacturer'}</label>
            <select className="select text-sm" value={form.manufacturer} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))}>
              <option value="ZKTeco">ZKTeco</option>
              <option value="Suprema">Suprema</option>
              <option value="Hikvision">Hikvision</option>
              <option value="Anviz">Anviz</option>
              <option value="HID">HID Global</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="label">{language === 'ar' ? 'نوع الجهاز' : 'Type'}</label>
            <select className="select text-sm" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option value="fingerprint">{language === 'ar' ? 'بصمة الإصبع' : 'Fingerprint'}</option>
              <option value="face">{language === 'ar' ? 'التعرف على الوجه' : 'Face Recognition'}</option>
              <option value="card">{language === 'ar' ? 'بطاقة RFID' : 'RFID Card'}</option>
              <option value="finger_face">{language === 'ar' ? 'بصمة + وجه' : 'Fingerprint + Face'}</option>
              <option value="palm">{language === 'ar' ? 'بصمة اليد' : 'Palm Reader'}</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'فترة المزامنة (دقائق)' : 'Sync Interval (minutes)'}</label>
          <input type="number" min="1" max="60" className="input text-sm" value={form.syncInterval} onChange={e => setForm(f => ({ ...f, syncInterval: Number(e.target.value) }))} />
        </div>
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-700/50 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{language === 'ar' ? 'الجهاز مفعّل' : 'Device Enabled'}</p>
            <p className="text-xs text-gray-400">{language === 'ar' ? 'يتصل الجهاز ويزامن تلقائياً' : 'Device connects and auto-syncs'}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={form.enabled} onChange={e => setForm(f => ({ ...f, enabled: e.target.checked }))} />
            <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-dark-600 peer-checked:after:translate-x-full peer-checked:bg-primary-500 after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
          </label>
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-gray-100 dark:border-dark-700 p-4 space-y-3">
        {isEdit && (
          <div className="flex gap-2">
            <button type="button" onClick={() => pingMutation.mutate()} disabled={pingMutation.isPending} className="btn btn-secondary flex-1 text-sm">
              {pingMutation.isPending ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Signal className="w-4 h-4" />}
              {language === 'ar' ? 'اختبار الاتصال' : 'Ping'}
            </button>
            <button type="button" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending} className="btn btn-secondary flex-1 text-sm">
              {syncMutation.isPending ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {language === 'ar' ? 'مزامنة الآن' : 'Sync Now'}
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          <button
            type="button"
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.name || !form.ipAddress || !form.location}
            className="btn btn-primary flex-1"
          >
            {mutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : language === 'ar' ? 'حفظ' : 'Save'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Manual Log Panel ──────────────────────────────────────── */
function ManualLogPanel({ onClose, language, employees }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    employeeId: '',
    eventType: 'check_in',
    timestamp: new Date().toISOString().slice(0, 16),
    note: '',
  })

  const mutation = useMutation({
    mutationFn: (payload) => api.post('/attendance/logs/manual', payload).then(r => r.data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تسجيل الحضور يدوياً' : 'Manual attendance recorded')
      queryClient.invalidateQueries(['attendance-logs'])
      queryClient.invalidateQueries(['attendance-summary'])
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed'),
  })

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="card overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <p className="font-bold text-gray-900 dark:text-white text-sm">{language === 'ar' ? 'تسجيل حضور يدوي' : 'Manual Attendance Log'}</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="label">{language === 'ar' ? 'الموظف *' : 'Employee *'}</label>
          <select className="select text-sm" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
            <option value="">{language === 'ar' ? 'اختر موظفاً' : 'Select employee'}</option>
            {(employees || []).map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.firstNameEn} {emp.lastNameEn} — {emp.employeeId}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'نوع الحدث *' : 'Event Type *'}</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'check_in', labelEn: 'Check In', labelAr: 'دخول', icon: ArrowUpRight },
              { value: 'check_out', labelEn: 'Check Out', labelAr: 'خروج', icon: ArrowDownRight },
              { value: 'break_in', labelEn: 'Break Start', labelAr: 'بداية استراحة', icon: Coffee },
              { value: 'break_out', labelEn: 'Break End', labelAr: 'نهاية استراحة', icon: Activity },
            ].map(ev => (
              <label key={ev.value} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.eventType === ev.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500/30' : 'border-gray-200 dark:border-dark-600 hover:border-gray-300'}`}>
                <input type="radio" className="sr-only" value={ev.value} checked={form.eventType === ev.value} onChange={e => setForm(f => ({ ...f, eventType: e.target.value }))} />
                <ev.icon className="w-4 h-4 text-primary-500" />
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{language === 'ar' ? ev.labelAr : ev.labelEn}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'التاريخ والوقت *' : 'Date & Time *'}</label>
          <input type="datetime-local" className="input text-sm" value={form.timestamp} onChange={e => setForm(f => ({ ...f, timestamp: e.target.value }))} />
        </div>
        <div>
          <label className="label">{language === 'ar' ? 'ملاحظة' : 'Note'}</label>
          <input className="input text-sm" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder={language === 'ar' ? 'سبب التسجيل اليدوي...' : 'Reason for manual entry...'} />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn btn-secondary flex-1">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          <button
            onClick={() => mutation.mutate({ ...form, timestamp: new Date(form.timestamp).toISOString() })}
            disabled={mutation.isPending || !form.employeeId || !form.timestamp}
            className="btn btn-primary flex-1"
          >
            {mutation.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : language === 'ar' ? 'تسجيل' : 'Record'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Component ────────────────────────────────────────── */
export default function Attendance() {
  const queryClient = useQueryClient()
  const { language } = useSelector(s => s.ui)
  const { t } = useTranslation(language)

  const [activeTab, setActiveTab] = useState('overview')  // overview | devices | logs | shifts
  const [dateFrom, setDateFrom] = useState(monthStart())
  const [dateTo, setDateTo] = useState(today())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deviceFilter, setDeviceFilter] = useState('')
  const [page, setPage] = useState(1)
  const [panel, setPanel] = useState(null) // null | 'device-new' | 'device-edit' | 'manual'
  const [editDevice, setEditDevice] = useState(null)
  const [liveMode, setLiveMode] = useState(true)
  const liveRef = useRef()

  // ── Queries ──────────────────────────────────────────────────
  const summaryQuery = useQuery({
    queryKey: ['attendance-summary', dateFrom, dateTo],
    queryFn: () => api.get('/attendance/summary', { params: { from: dateFrom, to: dateTo } }).then(r => r.data),
    refetchInterval: liveMode ? 30000 : false,
  })

  const logsQuery = useQuery({
    queryKey: ['attendance-logs', page, dateFrom, dateTo, search, statusFilter, deviceFilter],
    queryFn: () => api.get('/attendance/logs', {
      params: { page, limit: 30, from: dateFrom, to: dateTo, search, status: statusFilter, deviceId: deviceFilter }
    }).then(r => r.data),
    refetchInterval: liveMode ? 15000 : false,
    placeholderData: prev => prev,
  })

  const devicesQuery = useQuery({
    queryKey: ['attendance-devices'],
    queryFn: () => api.get('/attendance/devices').then(r => r.data),
    refetchInterval: 20000,
  })

  const employeesQuery = useQuery({
    queryKey: ['employees-for-attendance'],
    queryFn: () => api.get('/employees', { params: { limit: 500 } }).then(r => r.data),
  })

  const todayQuery = useQuery({
    queryKey: ['attendance-today'],
    queryFn: () => api.get('/attendance/today').then(r => r.data),
    refetchInterval: liveMode ? 10000 : false,
  })

  // ── Mutations ─────────────────────────────────────────────────
  const deleteDeviceMutation = useMutation({
    mutationFn: (id) => api.delete(`/attendance/devices/${id}`).then(r => r.data),
    onSuccess: () => { toast.success(language === 'ar' ? 'تم حذف الجهاز' : 'Device deleted'); queryClient.invalidateQueries(['attendance-devices']) },
    onError: () => toast.error(language === 'ar' ? 'فشل الحذف' : 'Delete failed'),
  })

  const toggleDeviceMutation = useMutation({
    mutationFn: ({ id, enabled }) => api.patch(`/attendance/devices/${id}`, { enabled }).then(r => r.data),
    onSuccess: () => queryClient.invalidateQueries(['attendance-devices']),
    onError: () => toast.error('Failed'),
  })

  const exportMutation = useMutation({
    mutationFn: () => api.get('/attendance/export', {
      params: { from: dateFrom, to: dateTo, search, status: statusFilter },
      responseType: 'blob'
    }).then(r => r.data),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendance_${dateFrom}_${dateTo}.xlsx`
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    },
    onError: () => toast.error(language === 'ar' ? 'فشل التصدير' : 'Export failed'),
  })

  // Live clock
  const [clock, setClock] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const summary = summaryQuery.data?.summary || {}
  const devices = devicesQuery.data?.devices || []
  const logs = logsQuery.data?.logs || []
  const pagination = logsQuery.data?.pagination
  const employees = employeesQuery.data?.employees || []
  const todayData = todayQuery.data || {}

  const closePanel = () => { setPanel(null); setEditDevice(null) }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <Fingerprint className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {language === 'ar' ? 'الحضور والبيومتري' : 'Attendance & Biometrics'}
            </h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {language === 'ar' ? 'تتبع حضور الموظفين عبر الأجهزة البيومترية' : 'Track employee attendance via biometric devices'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live clock */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-mono font-semibold text-gray-700 dark:text-gray-300">
              {clock.toLocaleTimeString('en-GB')}
            </span>
          </div>
          <button
            onClick={() => { setPanel('manual'); setEditDevice(null) }}
            className="btn btn-secondary"
          >
            <ScanLine className="w-4 h-4" />
            {language === 'ar' ? 'تسجيل يدوي' : 'Manual Log'}
          </button>
          <button
            onClick={() => { setPanel('device-new'); setEditDevice(null) }}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة جهاز' : 'Add Device'}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-dark-800 rounded-2xl w-fit">
        {[
          { key: 'overview', labelEn: 'Overview', labelAr: 'نظرة عامة', icon: Activity },
          { key: 'logs',     labelEn: 'Logs',     labelAr: 'السجلات',  icon: Clock },
          { key: 'devices',  labelEn: 'Devices',  labelAr: 'الأجهزة',  icon: Cpu },
          { key: 'shifts',   labelEn: 'Today',    labelAr: 'اليوم',    icon: Calendar },
        ].map(tab => (
          <TabPill key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
            <span className="flex items-center gap-1.5">
              <tab.icon className="w-3.5 h-3.5" />
              {language === 'ar' ? tab.labelAr : tab.labelEn}
            </span>
          </TabPill>
        ))}
      </div>

      {/* ── 2-column layout ── */}
      <div className={`grid gap-6 ${panel ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
        <div className="space-y-6 min-w-0">

          {/* ═══════════════ OVERVIEW ═══════════════ */}
          {activeTab === 'overview' && (
            <>
              {/* Date filter */}
              <div className="card p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{language === 'ar' ? 'الفترة:' : 'Period:'}</span>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input text-sm h-9 py-1" />
                  <span className="text-gray-400">→</span>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input text-sm h-9 py-1" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${liveMode ? 'bg-primary-500' : 'bg-gray-300 dark:bg-dark-600'}`}
                      onClick={() => setLiveMode(v => !v)}>
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${liveMode ? 'translate-x-4' : 'translate-x-1'}`} />
                    </div>
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{language === 'ar' ? 'مباشر' : 'Live'}</span>
                  </label>
                  <button onClick={() => summaryQuery.refetch()} className="p-2 rounded-xl border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                    <RefreshCw className={`w-4 h-4 text-gray-500 ${summaryQuery.isFetching ? 'animate-spin' : ''}`} />
                  </button>
                  <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} className="btn btn-secondary text-sm h-9 py-0">
                    {exportMutation.isPending ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
                    {language === 'ar' ? 'تصدير' : 'Export'}
                  </button>
                </div>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={UserCheck} label={language === 'ar' ? 'حاضر' : 'Present'} value={summary.present ?? '—'} gradient="from-emerald-500 to-green-500" />
                <StatCard icon={UserX}    label={language === 'ar' ? 'غائب' : 'Absent'}   value={summary.absent ?? '—'}  gradient="from-red-500 to-rose-500" />
                <StatCard icon={Timer}    label={language === 'ar' ? 'متأخر' : 'Late'}     value={summary.late ?? '—'}    gradient="from-amber-500 to-orange-500" />
                <StatCard icon={Coffee}   label={language === 'ar' ? 'في استراحة' : 'On Break'} value={summary.onBreak ?? '—'} gradient="from-blue-500 to-sky-500" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Activity}  label={language === 'ar' ? 'إجمالي أيام العمل' : 'Total Work Days'} value={summary.totalWorkDays ?? '—'} gradient="from-violet-500 to-purple-500" />
                <StatCard icon={Clock}     label={language === 'ar' ? 'ساعات العمل' : 'Work Hours'} value={summary.totalHours ? `${summary.totalHours}h` : '—'} gradient="from-cyan-500 to-teal-500" />
                <StatCard icon={Zap}       label={language === 'ar' ? 'وقت إضافي' : 'Overtime'} value={summary.overtimeHours ? `${summary.overtimeHours}h` : '—'} gradient="from-pink-500 to-rose-500" />
                <StatCard icon={Shield}    label={language === 'ar' ? 'معدل الحضور' : 'Attendance Rate'} value={summary.attendanceRate ? `${summary.attendanceRate}%` : '—'} gradient="from-indigo-500 to-blue-500" />
              </div>

              {/* Device status strip */}
              {devices.length > 0 && (
                <div className="card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-primary-500" />
                      {language === 'ar' ? 'حالة الأجهزة' : 'Device Status'}
                    </p>
                    <button onClick={() => setActiveTab('devices')} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                      {language === 'ar' ? 'إدارة' : 'Manage'} <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {devices.map(d => (
                      <div key={d._id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50 text-sm">
                        <DeviceStatusDot status={d.status} />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{d.name}</span>
                        <span className="text-xs text-gray-400">{d.location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent logs preview */}
              <div className="card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-dark-700">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{language === 'ar' ? 'آخر السجلات' : 'Recent Logs'}</p>
                  <button onClick={() => setActiveTab('logs')} className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                    {language === 'ar' ? 'عرض الكل' : 'View All'} <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-dark-700/50">
                  {logsQuery.isLoading ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-dark-600 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/3 bg-gray-200 dark:bg-dark-600 rounded" />
                        <div className="h-2.5 w-1/2 bg-gray-100 dark:bg-dark-700 rounded" />
                      </div>
                    </div>
                  )) : logs.slice(0, 8).map((log, i) => (
                    <motion.div key={log._id || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-700/40 transition-colors">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-sm ${EVENT_STYLE[log.eventType] || EVENT_STYLE.manual}`}>
                        {log.eventType === 'check_in' ? <ArrowUpRight className="w-4 h-4" /> :
                         log.eventType === 'check_out' ? <ArrowDownRight className="w-4 h-4" /> :
                         log.eventType === 'break_in' ? <Coffee className="w-4 h-4" /> :
                         <Activity className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {log.employeeName || `${log.employee?.firstNameEn || ''} ${log.employee?.lastNameEn || ''}`.trim() || '—'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {log.eventType?.replace('_', ' ')} · {log.deviceName || (log.source === 'manual' ? (language === 'ar' ? 'يدوي' : 'Manual') : '—')}
                        </p>
                      </div>
                      <span className="text-xs font-mono text-gray-500 flex-shrink-0">{fmtDateTime(log.timestamp, language)}</span>
                    </motion.div>
                  ))}
                  {!logsQuery.isLoading && logs.length === 0 && (
                    <div className="px-5 py-12 text-center text-sm text-gray-400">
                      {language === 'ar' ? 'لا توجد سجلات لهذه الفترة' : 'No logs for this period'}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ═══════════════ LOGS ═══════════════ */}
          {activeTab === 'logs' && (
            <>
              {/* Filters */}
              <div className="card p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input className="input ps-9 text-sm" placeholder={language === 'ar' ? 'بحث عن موظف...' : 'Search employee…'} value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <input type="date" className="input text-sm h-10 py-0 w-36" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  <input type="date" className="input text-sm h-10 py-0 w-36" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  <select className="select text-sm h-10 py-0" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
                    <option value="">{language === 'ar' ? 'كل الأحداث' : 'All Events'}</option>
                    <option value="check_in">{language === 'ar' ? 'دخول' : 'Check In'}</option>
                    <option value="check_out">{language === 'ar' ? 'خروج' : 'Check Out'}</option>
                    <option value="break_in">{language === 'ar' ? 'بداية استراحة' : 'Break Start'}</option>
                    <option value="break_out">{language === 'ar' ? 'نهاية استراحة' : 'Break End'}</option>
                    <option value="manual">{language === 'ar' ? 'يدوي' : 'Manual'}</option>
                  </select>
                  {devices.length > 0 && (
                    <select className="select text-sm h-10 py-0" value={deviceFilter} onChange={e => { setDeviceFilter(e.target.value); setPage(1) }}>
                      <option value="">{language === 'ar' ? 'كل الأجهزة' : 'All Devices'}</option>
                      {devices.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  )}
                  <button onClick={() => exportMutation.mutate()} disabled={exportMutation.isPending} className="btn btn-secondary text-sm h-10 py-0">
                    <Download className="w-4 h-4" />
                    {language === 'ar' ? 'Excel' : 'Export'}
                  </button>
                </div>
              </div>

              {/* Logs table */}
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
                        {[
                          language === 'ar' ? 'الموظف' : 'Employee',
                          language === 'ar' ? 'نوع الحدث' : 'Event',
                          language === 'ar' ? 'التاريخ والوقت' : 'Timestamp',
                          language === 'ar' ? 'الجهاز / المصدر' : 'Device / Source',
                          language === 'ar' ? 'المكتب / الموقع' : 'Location',
                          language === 'ar' ? 'ملاحظة' : 'Note',
                        ].map(h => (
                          <th key={h} className="text-start px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logsQuery.isLoading ? Array.from({ length: 10 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-100 dark:border-dark-700/50 animate-pulse">
                          {Array.from({ length: 6 }).map((__, j) => (
                            <td key={j} className="px-4 py-3"><div className="h-3 bg-gray-200 dark:bg-dark-600 rounded w-3/4" /></td>
                          ))}
                        </tr>
                      )) : logs.map((log, i) => (
                        <motion.tr key={log._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                          className="border-b border-gray-100 dark:border-dark-700/50 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(log.employeeName || log.employee?.firstNameEn || '?')[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                  {log.employeeName || `${log.employee?.firstNameEn || ''} ${log.employee?.lastNameEn || ''}`.trim() || '—'}
                                </p>
                                <p className="text-xs text-gray-400">{log.employee?.employeeId || ''}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${EVENT_STYLE[log.eventType] || EVENT_STYLE.manual}`}>
                              {log.eventType === 'check_in'  ? <ArrowUpRight className="w-3 h-3" /> :
                               log.eventType === 'check_out' ? <ArrowDownRight className="w-3 h-3" /> :
                               log.eventType === 'break_in'  ? <Coffee className="w-3 h-3" /> :
                               <Activity className="w-3 h-3" />}
                              {log.eventType?.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-mono text-xs whitespace-nowrap">{fmtDateTime(log.timestamp, language)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {log.source === 'manual' ? (
                                <span className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400">
                                  <ScanLine className="w-3 h-3" />
                                  {language === 'ar' ? 'يدوي' : 'Manual'}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                  <Fingerprint className="w-3 h-3" />
                                  {log.deviceName || 'Biometric'}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{log.deviceLocation || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-400 max-w-32 truncate">{log.note || '—'}</td>
                        </motion.tr>
                      ))}
                      {!logsQuery.isLoading && logs.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                            {language === 'ar' ? 'لا توجد سجلات لهذه الفترة' : 'No attendance logs for this period'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination?.pages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 dark:border-dark-700">
                    <p className="text-xs text-gray-400">
                      {language === 'ar'
                        ? `${pagination.total} سجل`
                        : `${pagination.total} records`}
                    </p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-secondary text-sm py-1.5">
                        {language === 'ar' ? 'السابق' : 'Prev'}
                      </button>
                      <span className="text-sm text-gray-500">{page} / {pagination.pages}</span>
                      <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="btn btn-secondary text-sm py-1.5">
                        {language === 'ar' ? 'التالي' : 'Next'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════════ DEVICES ═══════════════ */}
          {activeTab === 'devices' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? `${devices.length} جهاز مسجّل` : `${devices.length} registered device${devices.length !== 1 ? 's' : ''}`}
                </p>
                <button onClick={() => { setPanel('device-new'); setEditDevice(null) }} className="btn btn-primary text-sm">
                  <Plus className="w-4 h-4" />
                  {language === 'ar' ? 'إضافة جهاز' : 'Add Device'}
                </button>
              </div>

              {devicesQuery.isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-5 animate-pulse space-y-3">
                      <div className="h-4 w-1/2 bg-gray-200 dark:bg-dark-600 rounded" />
                      <div className="h-3 w-1/3 bg-gray-100 dark:bg-dark-700 rounded" />
                    </div>
                  ))}
                </div>
              ) : devices.length === 0 ? (
                <div className="card p-16 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-500/10 to-teal-500/5 border border-primary-500/15 flex items-center justify-center mx-auto mb-5">
                    <Fingerprint className="w-10 h-10 text-primary-400" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{language === 'ar' ? 'لا توجد أجهزة بيومترية' : 'No Biometric Devices'}</h3>
                  <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
                    {language === 'ar'
                      ? 'أضف جهاز بصمة أو وجه للبدء في تسجيل الحضور تلقائياً'
                      : 'Add a fingerprint or face recognition device to start recording attendance automatically'}
                  </p>
                  <button onClick={() => { setPanel('device-new'); setEditDevice(null) }} className="btn btn-primary">
                    <Plus className="w-4 h-4" />
                    {language === 'ar' ? 'إضافة أول جهاز' : 'Add First Device'}
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {devices.map((device, i) => (
                    <motion.div key={device._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="card p-5 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 flex items-center justify-center">
                            <Fingerprint className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white">{device.name}</p>
                            <p className="text-xs text-gray-400">{device.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DeviceStatusDot status={device.status} />
                          <span className="text-xs font-semibold text-gray-500 capitalize">{device.status}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          { label: 'IP', value: device.ipAddress },
                          { label: language === 'ar' ? 'المنفذ' : 'Port', value: device.port || '4370' },
                          { label: language === 'ar' ? 'النوع' : 'Type', value: device.type },
                          { label: language === 'ar' ? 'المصنّع' : 'Manufacturer', value: device.manufacturer || '—' },
                          { label: language === 'ar' ? 'آخر مزامنة' : 'Last Sync', value: device.lastSyncAt ? fmtDateTime(device.lastSyncAt, language) : (language === 'ar' ? 'لم تتم بعد' : 'Never'), span: true },
                        ].map(row => (
                          <div key={row.label} className={`${row.span ? 'col-span-2' : ''}`}>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">{row.label}</p>
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-0.5 font-mono">{row.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-dark-700">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleDeviceMutation.mutate({ id: device._id, enabled: !device.enabled })}
                            className={`p-2 rounded-lg transition-colors ${device.enabled ? 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700'}`}
                            title={device.enabled ? 'Disable' : 'Enable'}
                          >
                            {device.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                          </button>
                          <button
                            onClick={() => { setEditDevice(device); setPanel('device-edit') }}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { if (window.confirm(language === 'ar' ? 'حذف الجهاز؟' : 'Delete device?')) deleteDeviceMutation.mutate(device._id) }}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {device.lastSyncCount !== undefined && (
                          <span className="text-xs text-gray-400">
                            {language === 'ar' ? `${device.lastSyncCount} سجل` : `${device.lastSyncCount} records synced`}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Integration guide */}
              <div className="card p-6 bg-gradient-to-br from-[#0a1f14]/5 to-transparent border-primary-500/15">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary-500/30">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      {language === 'ar' ? 'دليل ربط الأجهزة البيومترية' : 'Biometric Device Integration Guide'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {language === 'ar'
                        ? 'يدعم Maqder بروتوكول ZKTeco وSDK الموحّد للتكامل مع أجهزة البصمة والوجه'
                        : 'Maqder supports ZKTeco protocol and unified SDK for seamless integration with fingerprint and face recognition devices'}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { step: '1', en: 'Connect device to same network', ar: 'وصّل الجهاز بالشبكة ذاتها', icon: Wifi },
                        { step: '2', en: 'Add device IP & port above', ar: 'أضف IP والمنفذ أعلاه', icon: Cpu },
                        { step: '3', en: 'Click Sync to pull all records', ar: 'اضغط مزامنة لسحب السجلات', icon: RefreshCw },
                      ].map(s => (
                        <div key={s.step} className="flex items-center gap-3 p-3 rounded-xl bg-primary-50/50 dark:bg-primary-900/10 border border-primary-500/10">
                          <div className="w-7 h-7 rounded-full bg-primary-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{s.step}</div>
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">{language === 'ar' ? s.ar : s.en}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════ TODAY ═══════════════ */}
          {activeTab === 'shifts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900 dark:text-white">
                  {language === 'ar' ? `حضور اليوم — ${fmtDate(new Date(), language)}` : `Today's Attendance — ${fmtDate(new Date(), language)}`}
                </h2>
                <button onClick={() => todayQuery.refetch()} className="p-2 rounded-xl border border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors">
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${todayQuery.isFetching ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { key: 'present', label: language === 'ar' ? 'حاضر' : 'Present', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
                  { key: 'late', label: language === 'ar' ? 'متأخر' : 'Late', icon: Timer, color: 'text-amber-600', bg: 'bg-amber-500/10' },
                  { key: 'absent', label: language === 'ar' ? 'غائب' : 'Absent', icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10' },
                  { key: 'onLeave', label: language === 'ar' ? 'في إجازة' : 'On Leave', icon: Coffee, color: 'text-violet-600', bg: 'bg-violet-500/10' },
                  { key: 'notYet', label: language === 'ar' ? 'لم يصل' : 'Not Yet', icon: AlertTriangle, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-dark-700' },
                ].map(stat => (
                  <div key={stat.key} className="card p-4 flex flex-col items-center gap-2 text-center">
                    <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className={`text-2xl font-bold ${stat.color}`}>{todayData?.[stat.key] ?? 0}</p>
                    <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Today employee status list */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-dark-700">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">
                    {language === 'ar' ? 'حالة الموظفين اليوم' : 'Employee Status Today'}
                  </p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-dark-700/50 max-h-[480px] overflow-y-auto">
                  {todayQuery.isLoading ? Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="px-5 py-3 flex gap-3 animate-pulse">
                      <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-dark-600 flex-shrink-0" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-3 w-1/3 bg-gray-200 dark:bg-dark-600 rounded" />
                        <div className="h-2.5 w-1/4 bg-gray-100 dark:bg-dark-700 rounded" />
                      </div>
                    </div>
                  )) : (todayData?.employees || []).map((emp, i) => (
                    <motion.div key={emp._id || i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.025 }}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-dark-700/30 transition-colors">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(emp.firstNameEn || emp.name || '?')[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                          {emp.firstNameEn} {emp.lastNameEn}
                        </p>
                        <p className="text-xs text-gray-400">{emp.department || emp.employeeId}</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {emp.checkIn && <span className="text-xs text-emerald-600 font-mono">{fmtTime(emp.checkIn)}</span>}
                        {emp.checkOut && <span className="text-xs text-blue-600 font-mono">{fmtTime(emp.checkOut)}</span>}
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${STATUS_STYLE[emp.status] || STATUS_STYLE.weekend}`}>
                          {emp.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  {!todayQuery.isLoading && (todayData?.employees || []).length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-400">
                      {language === 'ar' ? 'لا توجد بيانات حضور لهذا اليوم' : 'No attendance data for today yet'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Side Panel ── */}
        <AnimatePresence>
          {panel && (
            <div>
              {panel === 'device-new' && (
                <DevicePanel key="new" device={null} onClose={closePanel} language={language} onSaved={() => {}} />
              )}
              {panel === 'device-edit' && editDevice && (
                <DevicePanel key={editDevice._id} device={editDevice} onClose={closePanel} language={language} onSaved={() => {}} />
              )}
              {panel === 'manual' && (
                <ManualLogPanel key="manual" onClose={closePanel} language={language} employees={employees} />
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
