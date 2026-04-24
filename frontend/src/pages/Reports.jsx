import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'
import ExportMenu from '../components/ui/ExportMenu'
import { downloadBusinessReportPdf } from '../lib/businessReportPdf'
import { downloadVatReturnReportPdf } from '../lib/vatReturnReportPdf'
import { Clock3, Download, Mail, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

const formatInputDate = (value) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatTimeInput = (hour = 8, minute = 0) => `${String(Number(hour) || 0).padStart(2, '0')}:${String(Number(minute) || 0).padStart(2, '0')}`

const parseTimeInput = (value) => {
  const [hour, minute] = String(value || '08:00').split(':')
  return {
    sendAtHour: Math.max(0, Math.min(23, Number(hour) || 8)),
    sendAtMinute: Math.max(0, Math.min(59, Number(minute) || 0)),
  }
}

const formatDateTime = (value, language) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
}

export default function Reports() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { tenant, user } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const now = new Date()
  const [startDate, setStartDate] = useState(formatInputDate(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [endDate, setEndDate] = useState(formatInputDate(now))

  const [reportType, setReportType] = useState('vat')
  const [downloadingReportPdf, setDownloadingReportPdf] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    name: '',
    reportType: 'vat',
    rangePreset: 'this_month',
    frequency: 'weekly',
    dayOfWeek: '1',
    dayOfMonth: '1',
    time: '08:00',
    recipients: tenant?.business?.contactEmail || '',
    language,
    enabled: true,
  })
  const hasInvalidRange = Boolean(startDate && endDate && new Date(startDate) > new Date(endDate))
  const hasEmailAddon = Boolean(tenant?.subscription?.hasEmailAddon || tenant?.subscription?.features?.includes('email_automation'))
  const canManageSchedules = user?.role === 'admin' || user?.role === 'super_admin'

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', reportType, startDate, endDate],
    queryFn: () =>
      api
        .get(reportType === 'business' ? '/reports/business-summary' : '/reports/vat-return', { params: { startDate, endDate } })
        .then((res) => res.data)
    ,
    enabled: !!startDate && !!endDate && !hasInvalidRange,
  })

  const { data: schedulesData, isLoading: schedulesLoading } = useQuery({
    queryKey: ['report-schedules'],
    queryFn: () => api.get('/reports/schedules').then((res) => res.data),
    enabled: hasEmailAddon,
  })

  const createScheduleMutation = useMutation({
    mutationFn: (payload) => api.post('/reports/schedules', { schedule: payload }).then((res) => res.data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إنشاء الجدولة' : 'Report schedule created')
      queryClient.invalidateQueries(['report-schedules'])
      setShowScheduleForm(false)
      setScheduleForm((current) => ({
        ...current,
        name: '',
      }))
    },
    onError: (err) => toast.error(err?.response?.data?.error || (language === 'ar' ? 'فشل إنشاء الجدولة' : 'Failed to create schedule')),
  })

  const toggleScheduleMutation = useMutation({
    mutationFn: (schedule) => api.put(`/reports/schedules/${schedule._id}`, {
      schedule: {
        ...schedule,
        enabled: !schedule.enabled,
      },
    }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['report-schedules'])
    },
    onError: (err) => toast.error(err?.response?.data?.error || (language === 'ar' ? 'فشل تحديث الجدولة' : 'Failed to update schedule')),
  })

  const deleteScheduleMutation = useMutation({
    mutationFn: (id) => api.delete(`/reports/schedules/${id}`).then((res) => res.data),
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم حذف الجدولة' : 'Report schedule deleted')
      queryClient.invalidateQueries(['report-schedules'])
    },
    onError: (err) => toast.error(err?.response?.data?.error || (language === 'ar' ? 'فشل حذف الجدولة' : 'Failed to delete schedule')),
  })

  const money = (value) => <Money value={value} minimumFractionDigits={2} maximumFractionDigits={2} />

  const totals = data?.totals
  const byCategory = totals?.byCategory
  const schedules = schedulesData?.schedules || []

  const [exportTable, setExportTable] = useState('byCategory')

  const categories = [
    {
      key: 'standardRated',
      label: language === 'ar' ? 'خاضع للضريبة (Standard)' : 'Standard Rated'
    },
    {
      key: 'zeroRated',
      label: language === 'ar' ? 'صفرية (Zero)' : 'Zero Rated'
    },
    {
      key: 'exempt',
      label: language === 'ar' ? 'معفاة (Exempt)' : 'Exempt'
    },
    {
      key: 'outOfScope',
      label: language === 'ar' ? 'خارج النطاق (Out of Scope)' : 'Out of Scope'
    }
  ]

  const handleCreateSchedule = () => {
    const { sendAtHour, sendAtMinute } = parseTimeInput(scheduleForm.time)
    createScheduleMutation.mutate({
      name: scheduleForm.name,
      reportType: scheduleForm.reportType,
      rangePreset: scheduleForm.rangePreset,
      frequency: scheduleForm.frequency,
      dayOfWeek: Number(scheduleForm.dayOfWeek || 1),
      dayOfMonth: Number(scheduleForm.dayOfMonth || 1),
      sendAtHour,
      sendAtMinute,
      recipients: scheduleForm.recipients
        .split(/[\n,;]+/g)
        .map((item) => item.trim())
        .filter(Boolean),
      language: scheduleForm.language,
      enabled: scheduleForm.enabled,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {reportType === 'business'
              ? (language === 'ar' ? 'تقرير الأعمال' : 'Business Report')
              : (language === 'ar' ? 'تقرير إقرار ضريبة القيمة المضافة' : 'VAT Return Report')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={reportType}
            onChange={(e) => {
              const v = e.target.value
              setReportType(v)
              setExportTable(v === 'business' ? 'salesByTransactionType' : 'byCategory')
            }}
            className="select sm:w-44"
          >
            <option value="vat">{language === 'ar' ? 'VAT' : 'VAT'}</option>
            <option value="business">{language === 'ar' ? 'الأعمال' : 'Business'}</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input sm:w-44" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input sm:w-44" />
        </div>

        {data && !isLoading && !error && !hasInvalidRange && (
          <button
            type="button"
            onClick={async () => {
              try {
                setDownloadingReportPdf(true)
                if (reportType === 'business') {
                  await downloadBusinessReportPdf({ report: data, language, tenant })
                } else {
                  await downloadVatReturnReportPdf({ report: data, language, tenant })
                }
              } catch (e) {
                toast.error(language === 'ar' ? 'فشل تحميل PDF' : 'Failed to download PDF')
              } finally {
                setDownloadingReportPdf(false)
              }
            }}
            disabled={downloadingReportPdf}
            className="btn btn-secondary"
          >
            {downloadingReportPdf ? (
              <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {language === 'ar' ? 'PDF كامل' : 'Full PDF'}
          </button>
        )}
      </div>

      {data?.period?.startDate && data?.period?.endDate && !hasInvalidRange ? (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {language === 'ar'
            ? `الفترة المحددة: ${new Date(data.period.startDate).toLocaleDateString('ar-SA')} - ${new Date(data.period.endDate).toLocaleDateString('ar-SA')}`
            : `Selected period: ${new Date(data.period.startDate).toLocaleDateString('en-US')} - ${new Date(data.period.endDate).toLocaleDateString('en-US')}`}
        </div>
      ) : null}

      {hasEmailAddon ? (
        <div className="card p-6 space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary-600" />
                {language === 'ar' ? 'جدولة التقارير بالبريد' : 'Scheduled Report Delivery'}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar'
                  ? 'أرسل تقارير VAT أو الأعمال تلقائياً إلى بريدك حسب الجدول.'
                  : 'Automatically email VAT or business reports on a recurring schedule.'}
              </p>
            </div>
            {canManageSchedules && (
              <button type="button" className="btn btn-secondary" onClick={() => setShowScheduleForm((value) => !value)}>
                <Clock3 className="w-4 h-4" />
                {showScheduleForm
                  ? (language === 'ar' ? 'إخفاء النموذج' : 'Hide Form')
                  : (language === 'ar' ? 'جدولة جديدة' : 'New Schedule')}
              </button>
            )}
          </div>

          {showScheduleForm && canManageSchedules && (
            <div className="rounded-2xl border border-gray-200 dark:border-dark-600 p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <div>
                <label className="label">{language === 'ar' ? 'اسم الجدولة' : 'Schedule Name'}</label>
                <input value={scheduleForm.name} onChange={(e) => setScheduleForm((current) => ({ ...current, name: e.target.value }))} className="input" placeholder={language === 'ar' ? 'مثال: تقرير VAT الشهري' : 'Example: Monthly VAT Report'} />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'نوع التقرير' : 'Report Type'}</label>
                <select value={scheduleForm.reportType} onChange={(e) => setScheduleForm((current) => ({ ...current, reportType: e.target.value }))} className="select">
                  <option value="vat">{language === 'ar' ? 'VAT' : 'VAT'}</option>
                  <option value="business">{language === 'ar' ? 'الأعمال' : 'Business'}</option>
                </select>
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'النطاق' : 'Range Preset'}</label>
                <select value={scheduleForm.rangePreset} onChange={(e) => setScheduleForm((current) => ({ ...current, rangePreset: e.target.value }))} className="select">
                  <option value="this_month">{language === 'ar' ? 'هذا الشهر' : 'This Month'}</option>
                  <option value="last_month">{language === 'ar' ? 'الشهر الماضي' : 'Last Month'}</option>
                  <option value="this_week">{language === 'ar' ? 'هذا الأسبوع' : 'This Week'}</option>
                  <option value="last_7_days">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                </select>
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'التكرار' : 'Frequency'}</label>
                <select value={scheduleForm.frequency} onChange={(e) => setScheduleForm((current) => ({ ...current, frequency: e.target.value }))} className="select">
                  <option value="daily">{language === 'ar' ? 'يومي' : 'Daily'}</option>
                  <option value="weekly">{language === 'ar' ? 'أسبوعي' : 'Weekly'}</option>
                  <option value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</option>
                </select>
              </div>
              {scheduleForm.frequency === 'weekly' && (
                <div>
                  <label className="label">{language === 'ar' ? 'يوم الأسبوع' : 'Day of Week'}</label>
                  <select value={scheduleForm.dayOfWeek} onChange={(e) => setScheduleForm((current) => ({ ...current, dayOfWeek: e.target.value }))} className="select">
                    <option value="0">{language === 'ar' ? 'الأحد' : 'Sunday'}</option>
                    <option value="1">{language === 'ar' ? 'الاثنين' : 'Monday'}</option>
                    <option value="2">{language === 'ar' ? 'الثلاثاء' : 'Tuesday'}</option>
                    <option value="3">{language === 'ar' ? 'الأربعاء' : 'Wednesday'}</option>
                    <option value="4">{language === 'ar' ? 'الخميس' : 'Thursday'}</option>
                    <option value="5">{language === 'ar' ? 'الجمعة' : 'Friday'}</option>
                    <option value="6">{language === 'ar' ? 'السبت' : 'Saturday'}</option>
                  </select>
                </div>
              )}
              {scheduleForm.frequency === 'monthly' && (
                <div>
                  <label className="label">{language === 'ar' ? 'يوم الشهر' : 'Day of Month'}</label>
                  <input type="number" min="1" max="28" value={scheduleForm.dayOfMonth} onChange={(e) => setScheduleForm((current) => ({ ...current, dayOfMonth: e.target.value }))} className="input" />
                </div>
              )}
              <div>
                <label className="label">{language === 'ar' ? 'وقت الإرسال' : 'Send Time'}</label>
                <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm((current) => ({ ...current, time: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">{language === 'ar' ? 'لغة البريد' : 'Email Language'}</label>
                <select value={scheduleForm.language} onChange={(e) => setScheduleForm((current) => ({ ...current, language: e.target.value }))} className="select">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div className="md:col-span-2 xl:col-span-3">
                <label className="label">{language === 'ar' ? 'المستلمون' : 'Recipients'}</label>
                <textarea value={scheduleForm.recipients} onChange={(e) => setScheduleForm((current) => ({ ...current, recipients: e.target.value }))} className="input min-h-[96px]" placeholder={language === 'ar' ? 'admin@example.com, finance@example.com' : 'admin@example.com, finance@example.com'} />
              </div>
              <div className="md:col-span-2 xl:col-span-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={scheduleForm.enabled} onChange={(e) => setScheduleForm((current) => ({ ...current, enabled: e.target.checked }))} className="h-4 w-4" />
                  {language === 'ar' ? 'تفعيل الجدولة فوراً' : 'Enable schedule immediately'}
                </label>
                <button type="button" onClick={handleCreateSchedule} disabled={createScheduleMutation.isPending} className="btn btn-primary">
                  {createScheduleMutation.isPending
                    ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : (language === 'ar' ? 'حفظ الجدولة' : 'Save Schedule')}
                </button>
              </div>
            </div>
          )}

          {schedulesLoading ? (
            <div className="text-sm text-gray-500 dark:text-gray-400">{language === 'ar' ? 'جاري تحميل الجدولة...' : 'Loading schedules...'}</div>
          ) : schedules.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-dark-600 p-4 text-sm text-gray-500 dark:text-gray-400">
              {language === 'ar' ? 'لا توجد جدولة تقارير حالياً.' : 'No scheduled reports yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <div key={schedule._id} className="rounded-2xl border border-gray-200 dark:border-dark-600 p-4 flex flex-col gap-4">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{schedule.name}</h3>
                        <span className={`badge ${schedule.enabled ? 'badge-success' : 'badge-neutral'}`}>{schedule.enabled ? (language === 'ar' ? 'مفعل' : 'Enabled') : (language === 'ar' ? 'متوقف' : 'Disabled')}</span>
                        <span className="badge badge-info">{schedule.reportType === 'business' ? (language === 'ar' ? 'الأعمال' : 'Business') : 'VAT'}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar'
                          ? `النطاق: ${schedule.rangePreset} • التكرار: ${schedule.frequency}`
                          : `Range: ${schedule.rangePreset} • Frequency: ${schedule.frequency}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {language === 'ar' ? 'التالي:' : 'Next run:'} {formatDateTime(schedule.nextRunAt, language)}
                        {' • '}
                        {language === 'ar' ? 'آخر تشغيل:' : 'Last run:'} {formatDateTime(schedule.lastRunAt, language)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 break-all">
                        {schedule.recipients.join(', ')}
                      </p>
                      {schedule.lastError ? <p className="text-sm text-red-600">{schedule.lastError}</p> : null}
                    </div>
                    {canManageSchedules && (
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className="btn btn-secondary" disabled={toggleScheduleMutation.isPending} onClick={() => toggleScheduleMutation.mutate(schedule)}>
                          {schedule.enabled
                            ? (language === 'ar' ? 'إيقاف' : 'Disable')
                            : (language === 'ar' ? 'تفعيل' : 'Enable')}
                        </button>
                        <button type="button" className="btn btn-ghost text-red-600" disabled={deleteScheduleMutation.isPending} onClick={() => deleteScheduleMutation.mutate(schedule._id)}>
                          <Trash2 className="w-4 h-4" />
                          {language === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-6 text-sm text-gray-500 dark:text-gray-400">
          {language === 'ar'
            ? 'تحتاج إلى إضافة البريد الإلكتروني لتفعيل جدولة التقارير.'
            : 'You need the email add-on enabled to use scheduled report delivery.'}
        </div>
      )}

      {hasInvalidRange ? (
        <div className="card p-6 text-amber-700 dark:text-amber-300">
          {language === 'ar' ? 'يجب أن يكون تاريخ البداية قبل أو يساوي تاريخ النهاية' : 'The from date must be before or equal to the to date'}
        </div>
      ) : isLoading ? (
        <div className="card p-8 text-center">
          <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="card p-6 text-red-600">
          {language === 'ar' ? 'فشل تحميل التقرير' : 'Failed to load report'}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-gray-500">
              {language === 'ar' ? 'تصدير جداول التقرير' : 'Export report tables'}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <select value={exportTable} onChange={(e) => setExportTable(e.target.value)} className="select sm:w-56">
                {reportType === 'business' ? (
                  <>
                    <option value="salesByTransactionType">{language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Type'}</option>
                    <option value="expensesByCategory">{language === 'ar' ? 'المصاريف حسب التصنيف' : 'Expenses by Category'}</option>
                    <option value="topCustomers">{language === 'ar' ? 'أفضل العملاء' : 'Top Customers'}</option>
                  </>
                ) : (
                  <>
                    <option value="byCategory">{language === 'ar' ? 'ملخص حسب التصنيف' : 'Summary by Category'}</option>
                    <option value="byTransactionType">{language === 'ar' ? 'حسب نوع المعاملة' : 'By Transaction Type'}</option>
                    <option value="byTaxCategory">{language === 'ar' ? 'تفاصيل حسب فئة الضريبة' : 'Details by Tax Category'}</option>
                  </>
                )}
              </select>

              <ExportMenu
                language={language}
                t={t}
                rows={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? (data?.breakdown?.expensesByCategory || []).map((row) => ({
                        category: row._id,
                        count: row.count || 0,
                        totalAmount: row.totalAmount || 0,
                      }))
                      : exportTable === 'topCustomers'
                        ? (data?.breakdown?.topCustomers || []).map((row) => ({
                          customer: row._id,
                          invoiceCount: row.invoiceCount || 0,
                          revenue: row.revenue || 0,
                        }))
                        : (data?.breakdown?.salesByTransactionType || []).map((row) => ({
                          type: row._id,
                          invoiceCount: row.invoiceCount || 0,
                          discount: row.discount || 0,
                          revenue: row.revenue || 0,
                          tax: row.tax || 0,
                        }))
                    : exportTable === 'byTransactionType'
                      ? (data?.breakdown?.byTransactionType || []).map((row) => ({
                        type: row._id,
                        invoiceCount: row.invoiceCount || 0,
                        totalDiscount: row.totalDiscount || 0,
                        totalTax: row.totalTax || 0,
                      }))
                      : exportTable === 'byTaxCategory'
                        ? (data?.breakdown?.byTaxCategory || []).map((row) => ({
                          category: row._id?.taxCategory || '-',
                          rate: row._id?.taxRate ?? 0,
                          taxableAmount: row.taxableAmount || 0,
                          taxAmount: row.taxAmount || 0,
                        }))
                        : categories.map((c) => ({
                          category: c.label,
                          taxableAmount: byCategory?.[c.key]?.taxableAmount || 0,
                          taxAmount: byCategory?.[c.key]?.taxAmount || 0,
                        }))
                }
                columns={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? [
                        { key: 'category', label: language === 'ar' ? 'التصنيف' : 'Category', value: (r) => r.category },
                        { key: 'count', label: language === 'ar' ? 'العدد' : 'Count', value: (r) => r.count },
                        { key: 'totalAmount', label: language === 'ar' ? 'الإجمالي' : 'Total', value: (r) => r.totalAmount },
                      ]
                      : exportTable === 'topCustomers'
                        ? [
                          { key: 'customer', label: language === 'ar' ? 'العميل' : 'Customer', value: (r) => r.customer },
                          { key: 'invoiceCount', label: language === 'ar' ? 'عدد الفواتير' : 'Invoices', value: (r) => r.invoiceCount },
                          { key: 'revenue', label: language === 'ar' ? 'الإيراد' : 'Revenue', value: (r) => r.revenue },
                        ]
                        : [
                          { key: 'type', label: language === 'ar' ? 'النوع' : 'Type', value: (r) => r.type },
                          { key: 'invoiceCount', label: language === 'ar' ? 'عدد الفواتير' : 'Invoices', value: (r) => r.invoiceCount },
                          { key: 'discount', label: language === 'ar' ? 'الخصم' : 'Discount', value: (r) => r.discount },
                          { key: 'revenue', label: language === 'ar' ? 'الإيراد' : 'Revenue', value: (r) => r.revenue },
                          { key: 'tax', label: language === 'ar' ? 'الضريبة' : 'Tax', value: (r) => r.tax },
                        ]
                    : exportTable === 'byTransactionType'
                      ? [
                        { key: 'type', label: language === 'ar' ? 'النوع' : 'Type', value: (r) => r.type },
                        { key: 'invoiceCount', label: language === 'ar' ? 'عدد الفواتير' : 'Invoices', value: (r) => r.invoiceCount },
                        { key: 'totalDiscount', label: language === 'ar' ? 'الخصم' : 'Discount', value: (r) => r.totalDiscount },
                        { key: 'totalTax', label: language === 'ar' ? 'الضريبة' : 'VAT', value: (r) => r.totalTax },
                      ]
                      : exportTable === 'byTaxCategory'
                        ? [
                          { key: 'category', label: language === 'ar' ? 'الفئة' : 'Category', value: (r) => r.category },
                          { key: 'rate', label: language === 'ar' ? 'النسبة' : 'Rate', value: (r) => `${r.rate}%` },
                          { key: 'taxableAmount', label: language === 'ar' ? 'خاضع للضريبة' : 'Taxable', value: (r) => r.taxableAmount },
                          { key: 'taxAmount', label: language === 'ar' ? 'الضريبة' : 'VAT', value: (r) => r.taxAmount },
                        ]
                        : [
                          { key: 'category', label: language === 'ar' ? 'التصنيف' : 'Category', value: (r) => r.category },
                          { key: 'taxableAmount', label: language === 'ar' ? 'خاضع للضريبة' : 'Taxable', value: (r) => r.taxableAmount },
                          { key: 'taxAmount', label: language === 'ar' ? 'الضريبة' : 'VAT', value: (r) => r.taxAmount },
                        ]
                }
                fileBaseName={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? (language === 'ar' ? 'تقرير_المصاريف_حسب_التصنيف' : 'Business_Expenses_By_Category')
                      : exportTable === 'topCustomers'
                        ? (language === 'ar' ? 'تقرير_أفضل_العملاء' : 'Business_Top_Customers')
                        : (language === 'ar' ? 'تقرير_المبيعات_حسب_النوع' : 'Business_Sales_By_Type')
                    : exportTable === 'byTransactionType'
                      ? (language === 'ar' ? 'تقرير_حسب_نوع_المعاملة' : 'VAT_Return_By_TransactionType')
                      : exportTable === 'byTaxCategory'
                        ? (language === 'ar' ? 'تفاصيل_حسب_فئة_الضريبة' : 'VAT_Return_By_TaxCategory')
                        : (language === 'ar' ? 'تقرير_الضريبة_حسب_التصنيف' : 'VAT_Return_By_Category')
                }
                title={
                  reportType === 'business'
                    ? exportTable === 'expensesByCategory'
                      ? (language === 'ar' ? 'المصاريف حسب التصنيف' : 'Expenses by Category')
                      : exportTable === 'topCustomers'
                        ? (language === 'ar' ? 'أفضل العملاء' : 'Top Customers')
                        : (language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Type')
                    : exportTable === 'byTransactionType'
                      ? (language === 'ar' ? 'حسب نوع المعاملة' : 'By Transaction Type')
                      : exportTable === 'byTaxCategory'
                        ? (language === 'ar' ? 'تفاصيل حسب فئة الضريبة' : 'Details by Tax Category')
                        : (language === 'ar' ? 'ملخص حسب التصنيف' : 'Summary by Category')
                }
                disabled={false}
              />
            </div>
          </div>

          {reportType === 'business' ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المبيعات' : 'Sales'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.sales?.grandTotal || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المشتريات' : 'Purchases'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.purchases?.grandTotal || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المصاريف' : 'Expenses'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.expenses?.totalAmount || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'خصومات المبيعات' : 'Sales Discounts'}</p>
                  <p className="text-2xl font-bold text-amber-600">{money(totals?.sales?.totalDiscount || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'صافي الربح' : 'Net Profit'}</p>
                  <p className="text-2xl font-bold text-primary-600">{money(totals?.net || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Type'}
                  </h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                          <th>{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</th>
                          <th>{language === 'ar' ? 'الخصم' : 'Discount'}</th>
                          <th>{language === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.breakdown?.salesByTransactionType || []).map((row) => (
                          <tr key={row._id}>
                            <td className="font-medium">{row._id}</td>
                            <td>{(row.invoiceCount || 0).toLocaleString()}</td>
                            <td>{money(row.discount || 0)}</td>
                            <td>{money(row.revenue || 0)}</td>
                          </tr>
                        ))}
                        {(data?.breakdown?.salesByTransactionType || []).length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-gray-500">{t('noData')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'المصاريف حسب التصنيف' : 'Expenses by Category'}
                  </h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                          <th>{language === 'ar' ? 'العدد' : 'Count'}</th>
                          <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.breakdown?.expensesByCategory || []).map((row) => (
                          <tr key={row._id}>
                            <td className="font-medium">{row._id}</td>
                            <td>{(row.count || 0).toLocaleString()}</td>
                            <td>{money(row.totalAmount || 0)}</td>
                          </tr>
                        ))}
                        {(data?.breakdown?.expensesByCategory || []).length === 0 && (
                          <tr>
                            <td colSpan={3} className="text-center text-gray-500">{t('noData')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language === 'ar' ? 'أفضل العملاء' : 'Top Customers'}
                </h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
                        <th>{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</th>
                        <th>{language === 'ar' ? 'الإيراد' : 'Revenue'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.breakdown?.topCustomers || []).map((row, i) => (
                        <tr key={`${row._id}-${i}`}>
                          <td className="font-medium">{row._id}</td>
                          <td>{(row.invoiceCount || 0).toLocaleString()}</td>
                          <td>{money(row.revenue || 0)}</td>
                        </tr>
                      ))}
                      {(data?.breakdown?.topCustomers || []).length === 0 && (
                        <tr>
                          <td colSpan={3} className="text-center text-gray-500">{t('noData')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{(totals?.invoiceCount || 0).toLocaleString()}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'الخصومات' : 'Discounts'}</p>
                  <p className="text-2xl font-bold text-amber-600">{money(totals?.totalDiscount || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.taxableAmount || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي ضريبة القيمة المضافة' : 'Total VAT'}</p>
                  <p className="text-2xl font-bold text-primary-600">{money(totals?.totalTax || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-sm text-gray-500">{language === 'ar' ? 'الإجمالي' : 'Grand Total'}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{money(totals?.grandTotal || 0)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'ملخص حسب التصنيف' : 'Summary by Category'}
                  </h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                          <th>{language === 'ar' ? 'خاضع للضريبة' : 'Taxable'}</th>
                          <th>{language === 'ar' ? 'الضريبة' : 'VAT'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((c) => (
                          <tr key={c.key}>
                            <td className="font-medium">{c.label}</td>
                            <td>{money(byCategory?.[c.key]?.taxableAmount || 0)}</td>
                            <td>{money(byCategory?.[c.key]?.taxAmount || 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {language === 'ar' ? 'حسب نوع المعاملة' : 'By Transaction Type'}
                  </h3>
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                          <th>{language === 'ar' ? 'عدد الفواتير' : 'Invoices'}</th>
                          <th>{language === 'ar' ? 'الخصم' : 'Discount'}</th>
                          <th>{language === 'ar' ? 'الضريبة' : 'VAT'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.breakdown?.byTransactionType || []).map((row) => (
                          <tr key={row._id}>
                            <td className="font-medium">{row._id}</td>
                            <td>{(row.invoiceCount || 0).toLocaleString()}</td>
                            <td>{money(row.totalDiscount || 0)}</td>
                            <td>{money(row.totalTax || 0)}</td>
                          </tr>
                        ))}
                        {(data?.breakdown?.byTransactionType || []).length === 0 && (
                          <tr>
                            <td colSpan={4} className="text-center text-gray-500">{t('noData')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {(totals?.travelMargin?.lineCount || 0) > 0 && (
                <div className="card p-6 border border-primary-200 bg-primary-50/40 dark:border-primary-900/40 dark:bg-primary-900/10">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {language === 'ar' ? 'وكالات السفر — نظام هامش الربح' : 'Travel Agency — Margin Scheme'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {language === 'ar'
                          ? 'ضريبة القيمة المضافة محسوبة على هامش الربح فقط (سعر البيع - سعر الوكالة)'
                          : 'VAT is calculated on profit margin only (Unit Price - Agency Price)'}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'عدد البنود' : 'Margin Lines'}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{(totals.travelMargin.lineCount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'صافي العميل' : 'Customer Net'}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{money(totals.travelMargin.customerNet || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'تكلفة الوكالة' : 'Agency Cost'}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{money(totals.travelMargin.agencyCost || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'هامش الربح (خاضع للضريبة)' : 'Profit Margin (Taxable)'}</p>
                      <p className="text-xl font-bold text-emerald-600">{money(totals.travelMargin.marginTaxable || 0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{language === 'ar' ? 'ضريبة على الربح 15%' : 'VAT on Profit (15%)'}</p>
                      <p className="text-xl font-bold text-primary-600">{money(totals.travelMargin.taxAmount || 0)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {language === 'ar' ? 'تفاصيل حسب فئة الضريبة' : 'Details by Tax Category'}
                </h3>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{language === 'ar' ? 'الفئة' : 'Category'}</th>
                        <th>{language === 'ar' ? 'النسبة' : 'Rate'}</th>
                        <th>{language === 'ar' ? 'خاضع للضريبة' : 'Taxable'}</th>
                        <th>{language === 'ar' ? 'الضريبة' : 'VAT'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.breakdown?.byTaxCategory || []).map((row, i) => (
                        <tr key={`${row._id?.taxCategory}-${row._id?.taxRate}-${i}`}>
                          <td className="font-medium">{row._id?.taxCategory || '-'}</td>
                          <td>{row._id?.taxRate ?? 0}%</td>
                          <td>{money(row.taxableAmount || 0)}</td>
                          <td>{money(row.taxAmount || 0)}</td>
                        </tr>
                      ))}
                      {(data?.breakdown?.byTaxCategory || []).length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-gray-500">{t('noData')}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
