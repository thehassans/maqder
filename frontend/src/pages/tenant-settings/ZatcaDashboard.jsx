import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import {
  ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Activity,
  RotateCcw, FileText, TrendingUp, Clock, Download, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import ZatcaHealthPanel from '../../components/zatca/ZatcaHealthPanel'

const STATUS_COLORS = {
  queued: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  processing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  reported: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cleared: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function ZatcaDashboard() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()
  const [queuePage, setQueuePage] = useState(1)
  const [queueStatus, setQueueStatus] = useState('')
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['zatca-tenant-queue', queuePage, queueStatus],
    queryFn: () => api.get('/tenant/compliance/config/zatca-queue', {
      params: { page: queuePage, limit: 20, status: queueStatus || undefined },
    }).then(res => res.data),
  })

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['zatca-compliance-report', reportMonth, reportYear],
    queryFn: () => api.get('/tenant/compliance/config/zatca-report', {
      params: { month: reportMonth, year: reportYear },
    }).then(res => res.data),
  })

  const retryMutation = useMutation({
    mutationFn: (queueId) => api.post(`/tenant/compliance/config/zatca-queue/${queueId}/retry`).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zatca-tenant-queue'] })
      queryClient.invalidateQueries({ queryKey: ['zatca-health'] })
    },
  })

  const queueItems = queueData?.items || []
  const queueStats = queueData?.stats || {}
  const report = reportData

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-primary-600" />
          {language === 'ar' ? 'لوحة ZATCA' : 'ZATCA Dashboard'}
        </h1>
        <p className="text-gray-500 mt-1">
          {language === 'ar' ? 'مراقبة الامتثال وإدارة الفواتير الفاشلة' : 'Compliance monitoring & failed submission management'}
        </p>
      </div>

      {/* Health Panel */}
      <ZatcaHealthPanel />

      {/* Monthly Compliance Report */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'ar' ? 'تقرير الامتثال الشهري' : 'Monthly Compliance Report'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(parseInt(e.target.value))}
              className="select text-sm py-1.5 w-32"
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              className="select text-sm py-1.5 w-24"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {reportLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : report ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-dark-800">
                <p className="text-xs text-gray-500">{t('total', 'إجمالي')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{report.summary.totalInvoices}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <p className="text-xs text-emerald-600">{t('synced', 'مزامنة')}</p>
                <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{report.summary.syncedInvoices}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <p className="text-xs text-amber-600">{t('pending', 'قيد الانتظار')}</p>
                <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{report.summary.pendingInvoices}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <p className="text-xs text-red-600">{t('failed', 'فشل')}</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-400">{report.summary.failedInvoices}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20">
                <p className="text-xs text-primary-600">{language === 'ar' ? 'نسبة الامتثال' : 'Compliance'}</p>
                <p className="text-xl font-bold text-primary-700 dark:text-primary-400">{report.summary.complianceRate}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">{language === 'ar' ? 'إجمالي المبالغ' : 'Total Amounts'}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'ar' ? 'إجمالي الفواتير' : 'Invoice Total'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {report.summary.totalAmount?.toLocaleString('en-US', { style: 'currency', currency: 'SAR' })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{language === 'ar' ? 'إجمالي الضريبة' : 'Tax Total'}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {report.summary.totalTax?.toLocaleString('en-US', { style: 'currency', currency: 'SAR' })}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">{language === 'ar' ? 'أحداث التدقيق' : 'Audit Events'}</p>
                <div className="space-y-1 text-sm">
                  {(report.auditEvents || []).slice(0, 5).map((evt, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-500 capitalize">{evt.action.replace(/_/g, ' ')}</span>
                      <span className={`font-medium ${evt.status === 'success' ? 'text-emerald-600' : evt.status === 'failed' ? 'text-red-600' : 'text-amber-600'}`}>
                        {evt.count} {evt.status}
                      </span>
                    </div>
                  ))}
                  {(!report.auditEvents || report.auditEvents.length === 0) && (
                    <p className="text-xs text-gray-400">{language === 'ar' ? 'لا توجد أحداث' : 'No events'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Failed Submissions & Retry */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {language === 'ar' ? 'طابور الإرسال' : 'Submission Queue'}
            </h3>
          </div>
          <select
            value={queueStatus}
            onChange={(e) => { setQueueStatus(e.target.value); setQueuePage(1) }}
            className="select text-sm py-1.5 w-36"
          >
            <option value="">{language === 'ar' ? 'الكل' : 'All'}</option>
            <option value="queued">{language === 'ar' ? 'في الطابور' : 'Queued'}</option>
            <option value="processing">{language === 'ar' ? 'قيد المعالجة' : 'Processing'}</option>
            <option value="reported">{language === 'ar' ? 'تم الإبلاغ' : 'Reported'}</option>
            <option value="failed">{language === 'ar' ? 'فشل' : 'Failed'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغى' : 'Cancelled'}</option>
          </select>
        </div>

        {/* Queue stats summary */}
        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(queueStats).map(([status, count]) => (
            <span key={status} className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.queued}`}>
              {status}: {count}
            </span>
          ))}
        </div>

        {queueLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
          </div>
        ) : queueItems.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">
            {language === 'ar' ? 'لا توجد عناصر في الطابور' : 'No queue items'}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{language === 'ar' ? 'الفاتورة' : 'Invoice'}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{language === 'ar' ? 'المحاولات' : 'Retries'}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{language === 'ar' ? 'الخطأ' : 'Error'}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{language === 'ar' ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                  {queueItems.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-dark-800">
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.invoiceNumber}
                        {item.invoiceId?.grandTotal && (
                          <span className="block text-xs text-gray-400">
                            {item.invoiceId.grandTotal.toLocaleString('en-US', { style: 'currency', currency: 'SAR' })}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS.queued}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{item.retryCount}/{item.maxRetries}</td>
                      <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400 max-w-xs truncate">{item.lastError || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-right">
                        {(item.status === 'failed' || item.status === 'cancelled') && (
                          <button
                            onClick={() => retryMutation.mutate(item._id)}
                            disabled={retryMutation.isPending}
                            className="btn btn-secondary btn-sm flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            {language === 'ar' ? 'إعادة' : 'Retry'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {queueData?.pagination?.pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500">
                  {language === 'ar' ? `صفحة ${queuePage} من ${queueData.pagination.pages}` : `Page ${queuePage} of ${queueData.pagination.pages}`}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setQueuePage(p => Math.max(1, p - 1))}
                    disabled={queuePage <= 1}
                    className="btn btn-secondary btn-sm disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setQueuePage(p => Math.min(queueData.pagination.pages, p + 1))}
                    disabled={queuePage >= queueData.pagination.pages}
                    className="btn btn-secondary btn-sm disabled:opacity-50"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
