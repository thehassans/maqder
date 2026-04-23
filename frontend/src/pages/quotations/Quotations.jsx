import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Plus, Search, Download, Edit, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'
import ExportMenu from '../../components/ui/ExportMenu'
import { downloadQuotationPdf } from '../../lib/invoicePdf'

export default function Quotations() {
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [pdfLoadingId, setPdfLoadingId] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page, search, status],
    queryFn: () => api.get('/quotations', { params: { page, limit: 20, search, status } }).then((res) => res.data),
  })

  const rows = useMemo(() => (data?.quotations || []).map((quotation) => ({
    quotationNumber: quotation?.quotationNumber || '',
    customer: language === 'ar' ? (quotation?.buyer?.nameAr || quotation?.buyer?.name || '') : (quotation?.buyer?.name || quotation?.buyer?.nameAr || ''),
    businessContext: quotation?.businessContext || '',
    status: quotation?.status || '',
    issueDate: quotation?.issueDate ? new Date(quotation.issueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '',
    validUntil: quotation?.validUntil ? new Date(quotation.validUntil).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '',
    total: Number(quotation?.grandTotal || 0),
  })), [data?.quotations, language])

  const exportColumns = [
    { key: 'quotationNumber', label: language === 'ar' ? 'رقم عرض السعر' : 'Quotation #' },
    { key: 'customer', label: language === 'ar' ? 'العميل' : 'Customer' },
    { key: 'businessContext', label: language === 'ar' ? 'النشاط' : 'Business Context' },
    { key: 'status', label: language === 'ar' ? 'الحالة' : 'Status' },
    { key: 'issueDate', label: language === 'ar' ? 'تاريخ الإصدار' : 'Issue Date' },
    { key: 'validUntil', label: language === 'ar' ? 'صالح حتى' : 'Valid Until' },
    { key: 'total', label: language === 'ar' ? 'الإجمالي' : 'Total' },
  ]

  const pagination = data?.pagination || { page: 1, pages: 1 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'عروض الأسعار' : 'Quotations'}</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">{language === 'ar' ? 'إدارة عروض الأسعار الاحترافية والتنزيل والإرسال.' : 'Manage premium quotations, downloads, and delivery.'}</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            language={language}
            t={t}
            rows={rows}
            columns={exportColumns}
            fileBaseName="quotations"
            title={language === 'ar' ? 'عروض الأسعار' : 'Quotations'}
          />
          <Link to="/app/dashboard/quotations/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'عرض سعر جديد' : 'New Quotation'}
          </Link>
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-8">
            <label className="label">{language === 'ar' ? 'بحث' : 'Search'}</label>
            <div className="relative">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="input ps-10"
                placeholder={language === 'ar' ? 'رقم عرض السعر أو العميل' : 'Quotation number or customer'}
              />
            </div>
          </div>
          <div className="md:col-span-4">
            <label className="label">{language === 'ar' ? 'الحالة' : 'Status'}</label>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="select">
              <option value="">{language === 'ar' ? 'كل الحالات' : 'All statuses'}</option>
              <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
              <option value="sent">{language === 'ar' ? 'مرسل' : 'Sent'}</option>
              <option value="accepted">{language === 'ar' ? 'مقبول' : 'Accepted'}</option>
              <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
              <option value="expired">{language === 'ar' ? 'منتهي' : 'Expired'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-700">
            <thead className="bg-gray-50 dark:bg-dark-800">
              <tr>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'ar' ? 'رقم عرض السعر' : 'Quotation #'}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'ar' ? 'العميل' : 'Customer'}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                <th className="px-6 py-3 text-start text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</th>
                <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                <th className="px-6 py-3 text-end text-xs font-semibold uppercase tracking-wider text-gray-500">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-700 bg-white dark:bg-dark-900">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
                  </td>
                </tr>
              ) : (data?.quotations || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'لا توجد عروض أسعار حتى الآن.' : 'No quotations found yet.'}
                  </td>
                </tr>
              ) : (
                (data?.quotations || []).map((quotation) => (
                  <tr key={quotation._id}>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{quotation.quotationNumber}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{language === 'ar' ? (quotation?.buyer?.nameAr || quotation?.buyer?.name || '—') : (quotation?.buyer?.name || quotation?.buyer?.nameAr || '—')}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{quotation?.status || 'draft'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{quotation?.issueDate ? new Date(quotation.issueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{quotation?.validUntil ? new Date(quotation.validUntil).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</td>
                    <td className="px-6 py-4 text-end font-semibold text-gray-900 dark:text-white"><Money value={quotation?.grandTotal || 0} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/app/dashboard/quotations/${quotation._id}`} className="btn btn-ghost btn-icon" title={language === 'ar' ? 'عرض' : 'View'}>
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link to={`/app/dashboard/quotations/${quotation._id}/edit`} className="btn btn-ghost btn-icon" title={language === 'ar' ? 'تعديل' : 'Edit'}>
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon"
                          title={language === 'ar' ? 'تنزيل PDF' : 'Download PDF'}
                          disabled={pdfLoadingId === quotation._id}
                          onClick={async () => {
                            try {
                              setPdfLoadingId(quotation._id)
                              const full = await api.get(`/quotations/${quotation._id}`).then((res) => res.data)
                              await downloadQuotationPdf({ quotation: full, language, tenant })
                            } catch {
                              toast.error(language === 'ar' ? 'فشل تحميل PDF' : 'Failed to download PDF')
                            } finally {
                              setPdfLoadingId('')
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {language === 'ar'
            ? `الصفحة ${pagination.page} من ${pagination.pages || 1}`
            : `Page ${pagination.page} of ${pagination.pages || 1}`}
        </p>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={pagination.page <= 1}>{language === 'ar' ? 'السابق' : 'Previous'}</button>
          <button className="btn btn-secondary" onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))} disabled={pagination.page >= (pagination.pages || 1)}>{language === 'ar' ? 'التالي' : 'Next'}</button>
        </div>
      </div>
    </div>
  )
}
