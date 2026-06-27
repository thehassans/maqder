import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, Loader2, Clock, DollarSign, Users, TrendingUp,
  Trash2, Edit3, Calendar, Briefcase, Download,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import toast from 'react-hot-toast'
import api from '../../lib/api'

const TRADES = ['carpenter', 'plumber', 'mason', 'electrician', 'welder', 'helper', 'driver', 'operator', 'other']

function TimesheetModal({ workers, assignments, onClose, editEntry }) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    workerId: editEntry?.workerId?._id || editEntry?.workerId || '',
    assignmentId: editEntry?.assignmentId?._id || editEntry?.assignmentId || '',
    projectId: editEntry?.projectId?._id || editEntry?.projectId || '',
    date: editEntry?.date?.split('T')[0] || new Date().toISOString().split('T')[0],
    regularHours: editEntry?.regularHours || 8,
    overtimeHours: editEntry?.overtimeHours || 0,
    isBillable: editEntry?.isBillable !== false,
    attendanceStatus: editEntry?.attendanceStatus || 'present',
    checkInTime: editEntry?.checkInTime || '',
    checkOutTime: editEntry?.checkOutTime || '',
    notes: editEntry?.notes || '',
  })

  const mutation = useMutation({
    mutationFn: (data) => editEntry
      ? api.put(`/manpower/timesheets/${editEntry._id}`, data)
      : api.post('/manpower/timesheets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-summary'] })
      toast.success(editEntry ? 'Entry updated' : 'Timesheet entry created')
      onClose()
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const handleSubmit = () => {
    if (!form.workerId) return toast.error('Worker required')
    mutation.mutate({
      ...form,
      regularHours: Number(form.regularHours) || 0,
      overtimeHours: Number(form.overtimeHours) || 0,
    })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">{editEntry ? 'Edit Entry' : 'New Timesheet Entry'}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="label">Worker *</label>
              <select value={form.workerId} onChange={(e) => setForm({ ...form, workerId: e.target.value })} className="select">
                <option value="">Select worker...</option>
                {workers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.trade})</option>)}
              </select>
            </div>

            <div>
              <label className="label">Assignment</label>
              <select value={form.assignmentId} onChange={(e) => setForm({ ...form, assignmentId: e.target.value })} className="select">
                <option value="">None</option>
                {assignments.map(a => <option key={a._id} value={a._id}>{a.assignmentNumber} — {a.clientName}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Regular Hours</label>
                <input type="number" step="0.5" min="0" value={form.regularHours} onChange={(e) => setForm({ ...form, regularHours: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Overtime Hours</label>
                <input type="number" step="0.5" min="0" value={form.overtimeHours} onChange={(e) => setForm({ ...form, overtimeHours: e.target.value })} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Check In</label>
                <input type="time" value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Check Out</label>
                <input type="time" value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} className="input" />
              </div>
            </div>

            <div>
              <label className="label">Attendance</label>
              <select value={form.attendanceStatus} onChange={(e) => setForm({ ...form, attendanceStatus: e.target.value })} className="select">
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isBillable} onChange={(e) => setForm({ ...form, isBillable: e.target.checked })} className="w-4 h-4 rounded" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Billable</span>
            </label>

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-200 dark:border-dark-700">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={mutation.isPending} className="btn btn-action-dark flex items-center gap-1.5">
              {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editEntry ? 'Update' : 'Create'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default function ManpowerTimesheets() {
  const { language } = useSelector((state) => state.ui)
  const queryClient = useQueryClient()
  const [activeView, setActiveView] = useState('entries')
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [showModal, setShowModal] = useState(false)
  const [editEntry, setEditEntry] = useState(null)

  const { data: tsData, isLoading: tsLoading } = useQuery({
    queryKey: ['timesheets', startDate, endDate],
    queryFn: () => api.get('/manpower/timesheets', { params: { startDate, endDate, limit: 100 } }).then(res => res.data),
    enabled: activeView === 'entries',
  })

  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['timesheet-summary', startDate, endDate],
    queryFn: () => api.get('/manpower/timesheets/summary', { params: { startDate, endDate } }).then(res => res.data),
    enabled: activeView === 'summary',
  })

  const { data: workers = [] } = useQuery({
    queryKey: ['manpower-workers'],
    queryFn: () => api.get('/manpower/workers', { params: { limit: 100 } }).then(res => res.data),
  })

  const { data: assignments = [] } = useQuery({
    queryKey: ['manpower-assignments'],
    queryFn: () => api.get('/manpower/assignments', { params: { limit: 50 } }).then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/manpower/timesheets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheets'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-summary'] })
      toast.success('Entry deleted')
    },
  })

  const timesheets = tsData?.timesheets || []
  const groups = summaryData?.groups || []
  const grandTotal = summaryData?.grandTotal || {}

  const chartData = groups.map(g => ({
    name: g._id.name || 'Unassigned',
    hours: g.totalHours,
    cost: g.totalCost,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'سجلات الوقت وتكلفة المشاريع' : 'Timesheets & Project Costing'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'تتبع ساعات العمل وتكلفة المشاريع' : 'Track work hours and project costs'}
          </p>
        </div>
        <button onClick={() => { setEditEntry(null); setShowModal(true) }} className="btn btn-action-dark flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> {language === 'ar' ? 'إدخال جديد' : 'New Entry'}
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-dark-700">
        {[
          { id: 'entries', label: language === 'ar' ? 'السجلات' : 'Entries' },
          { id: 'summary', label: language === 'ar' ? 'الملخص' : 'Summary' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveView(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar className="w-4 h-4 text-gray-400" />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input w-auto" />
        <span className="text-gray-400">to</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input w-auto" />
      </div>

      {/* Entries View */}
      {activeView === 'entries' && (
        <div className="card overflow-hidden">
          {tsLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
          ) : timesheets.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No timesheet entries for this period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Worker</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project/Client</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reg Hrs</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">OT Hrs</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {timesheets.map(t => (
                    <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{t.workerName}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{t.projectName || t.clientName || '—'}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{t.regularHours}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{t.overtimeHours > 0 ? <span className="text-amber-600 dark:text-amber-400">{t.overtimeHours}</span> : '—'}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{t.totalCost?.toLocaleString()} SAR</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          t.attendanceStatus === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          t.attendanceStatus === 'absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>{t.attendanceStatus}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setEditEntry(t); setShowModal(true) }} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(t._id) }} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Summary View */}
      {activeView === 'summary' && (
        <>
          {summaryLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Hours', value: (grandTotal.totalHours || 0).toLocaleString(), color: 'from-blue-500 to-blue-600', icon: Clock },
                  { label: 'Total Cost', value: `${(grandTotal.totalCost || 0).toLocaleString()} SAR`, color: 'from-violet-500 to-violet-600', icon: DollarSign },
                  { label: 'Billable Hrs', value: (grandTotal.billableHours || 0).toLocaleString(), color: 'from-emerald-500 to-emerald-600', icon: TrendingUp },
                  { label: 'Overtime Hrs', value: (grandTotal.overtimeHours || 0).toLocaleString(), color: 'from-amber-500 to-amber-600', icon: Clock },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} shadow-sm w-fit mb-2`}>
                      <s.icon className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  </motion.div>
                ))}
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="card p-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Hours by Project/Client</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#6366f1" radius={[4, 4, 0, 0]} name="Hours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Summary Table */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-dark-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cost Breakdown</h3>
                </div>
                {groups.length === 0 ? (
                  <div className="p-8 text-center text-gray-400"><Users className="w-8 h-8 mx-auto mb-2 opacity-40" /><p>No data for this period</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-dark-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project/Client</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Reg Hrs</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">OT Hrs</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Hrs</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Billable</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                        {groups.map((g, i) => (
                          <tr key={i} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{g._id.name || 'Unassigned'}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-700 dark:text-gray-300">{g.totalRegularHours}</td>
                            <td className="px-4 py-3 text-right text-sm text-amber-600 dark:text-amber-400">{g.totalOvertimeHours}</td>
                            <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">{g.totalHours}</td>
                            <td className="px-4 py-3 text-right text-sm text-emerald-600 dark:text-emerald-400">{g.billableHours}</td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">{g.totalCost?.toLocaleString()} SAR</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {showModal && <TimesheetModal workers={workers} assignments={assignments} onClose={() => { setShowModal(false); setEditEntry(null) }} editEntry={editEntry} />}
    </div>
  )
}
