import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Plus, Search, Download, Edit, Eye, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'
import ExportMenu from '../../components/ui/ExportMenu'
import { downloadQuotationPdf } from '../../lib/invoicePdf'

const isEditableQuotation = (quotation) => ['draft', 'sent'].includes(String(quotation?.status || '').toLowerCase())
const hasConvertedInvoice = (quotation) => Boolean(quotation?.convertedInvoiceId)

const getQuotationStatusMeta = (quotation, language = 'en') => {
  const status = String(quotation?.status || 'draft').toLowerCase()
  const labels = {
    draft: language === 'ar' ? 'مسودة' : 'Draft',
    sent: language === 'ar' ? 'مرسل' : 'Sent',
    accepted: language === 'ar' ? 'مقبول' : 'Accepted',
    rejected: language === 'ar' ? 'مرفوض' : 'Rejected',
    expired: language === 'ar' ? 'منتهي' : 'Expired',
    cancelled: language === 'ar' ? 'ملغي' : 'Cancelled',
    converted: language === 'ar' ? 'تم التحويل' : 'Converted',
  }
  const className = status === 'accepted'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : status === 'converted'
      ? 'border-violet-200 bg-violet-50 text-violet-700'
    : status === 'sent'
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : status === 'rejected' || status === 'cancelled'
        ? 'border-rose-200 bg-rose-50 text-rose-700'
        : status === 'expired'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-slate-200 bg-slate-50 text-slate-700'

  return {
    label: labels[status] || quotation?.status || 'Draft',
    className,
  }
}

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

  const quotationStats = useMemo(() => {
    const quotations = data?.quotations || []
    return {
      total: quotations.length,
      draft: quotations.filter((quotation) => String(quotation?.status || '').toLowerCase() === 'draft').length,
      active: quotations.filter((quotation) => ['draft', 'sent'].includes(String(quotation?.status || '').toLowerCase())).length,
      value: quotations.reduce((sum, quotation) => sum + Number(quotation?.grandTotal || 0), 0),
    }
  }, [data?.quotations])

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
          <p className="mt-1 text-gray-500 dark:text-gray-400">{language === 'ar' ? 'واجهة هادئة لعروض الأسعار مع مراجعة سريعة وتنزيل وطباعة ومتابعة الحالة.' : 'A quieter quotation workspace with fast review, download, print, and status tracking.'}</p>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'الإجمالي' : 'Visible Quotations'}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{quotationStats.total}</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'المسودات' : 'Drafts'}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{quotationStats.draft}</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'قابلة للتعديل' : 'Editable'}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{quotationStats.active}</p>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'قيمة العروض' : 'Visible Value'}</p>
          <p className="mt-3 text-xl font-semibold tracking-tight text-slate-950"><Money value={quotationStats.value} /></p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
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
              <option value="converted">{language === 'ar' ? 'تم التحويل' : 'Converted'}</option>
              <option value="rejected">{language === 'ar' ? 'مرفوض' : 'Rejected'}</option>
              <option value="expired">{language === 'ar' ? 'منتهي' : 'Expired'}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : (data?.quotations || []).length === 0 ? (
          <div className="rounded-[1.75rem] border border-slate-200 bg-white px-6 py-16 text-center text-gray-500 shadow-sm">
            {language === 'ar' ? 'لا توجد عروض أسعار حتى الآن.' : 'No quotations found yet.'}
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {(data?.quotations || []).map((quotation) => {
              const statusMeta = getQuotationStatusMeta(quotation, language)
              return (
                <div key={quotation._id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'رقم العرض' : 'Quotation #'}</p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-950">{quotation.quotationNumber}</h3>
                      <p className="mt-2 text-sm text-slate-600">{language === 'ar' ? (quotation?.buyer?.nameAr || quotation?.buyer?.name || '—') : (quotation?.buyer?.name || quotation?.buyer?.nameAr || '—')}</p>
                    </div>
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'الإصدار' : 'Issue'}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{quotation?.issueDate ? new Date(quotation.issueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</p>
                      <p className="mt-1 text-sm font-medium text-slate-900">{quotation?.validUntil ? new Date(quotation.validUntil).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '—'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-950 px-4 py-3 text-white">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{language === 'ar' ? 'الإجمالي' : 'Total'}</p>
                      <p className="mt-1 text-sm font-semibold"><Money value={quotation?.grandTotal || 0} /></p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <Link to={`/app/dashboard/quotations/${quotation._id}`} className="btn btn-ghost btn-icon" title={language === 'ar' ? 'عرض' : 'View'}>
                      <Eye className="h-4 w-4" />
                    </Link>
                    {hasConvertedInvoice(quotation) ? (
                      <Link to={`/app/dashboard/invoices/${quotation.convertedInvoiceId}`} className="btn btn-ghost btn-icon" title={language === 'ar' ? 'عرض الفاتورة' : 'View Invoice'}>
                        <FileText className="h-4 w-4" />
                      </Link>
                    ) : null}
                    {isEditableQuotation(quotation) ? (
                      <Link to={`/app/dashboard/quotations/${quotation._id}/edit`} className="btn btn-ghost btn-icon" title={language === 'ar' ? 'تعديل' : 'Edit'}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    ) : null}
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
                </div>
              )
            })}
          </div>
        )}
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
