import { useEffect, useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'
import ExportMenu from '../../components/ui/ExportMenu'
import toast from 'react-hot-toast'
import { downloadInvoicePdf } from '../../lib/invoicePdf'
import { getTenantBusinessTypes } from '../../lib/businessTypes'
import { getZatcaStatusMeta } from '../../lib/zatcaStatus'
import { getTravelInvoiceLabelMeta, isTravelAgencyInvoice } from '../../lib/travelInvoiceStatus'

const getInvoiceContextLabel = (invoice, language = 'en') => {
  const context = String(invoice?.businessContext || '').trim()
  const labels = {
    trading: language === 'ar' ? 'فاتورة تجارة' : 'Trading Invoice',
    construction: language === 'ar' ? 'فاتورة مقاولات' : 'Construction Invoice',
    travel_agency: language === 'ar' ? 'فاتورة وكالة سفر' : 'Travel Agency Invoice',
    restaurant: language === 'ar' ? 'فاتورة مطعم' : 'Restaurant Invoice',
  }

  if (labels[context]) return labels[context]
  return language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'
}

const getTransactionTypeLabel = (transactionType, language = 'en', t) => {
  if (transactionType === 'B2B') return t('b2bInvoice')
  if (transactionType === 'B2C') return t('b2cInvoice')
  return transactionType || (language === 'ar' ? 'غير محدد' : 'Unknown')
}

const isEditableInvoice = (invoice) => ['draft', 'pending'].includes(invoice?.status) && !invoice?.zatca?.signedXml

export default function Invoices() {
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', businessContext: '' })
  const [page, setPage] = useState(1)
  const [pdfLoadingId, setPdfLoadingId] = useState(null)
  const tenantBusinessTypes = getTenantBusinessTypes(tenant)

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(handle)
  }, [search])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['invoices', page, debouncedSearch, filters],
    queryFn: () => api.get('/invoices', {
      params: { page, search: debouncedSearch, ...filters }
    }).then(res => res.data),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  })

  const getStatusBadge = (invoice) => {
    const meta = getZatcaStatusMeta(invoice, language)
    const badgeClass = meta.tone === 'success'
      ? 'badge-success'
      : meta.tone === 'info'
        ? 'badge-info'
        : meta.tone === 'danger'
          ? 'badge-danger'
          : meta.tone === 'warning'
            ? 'badge-warning'
            : 'badge-neutral'

    const icon = meta.tone === 'success'
      ? <CheckCircle className="w-3 h-3 me-1" />
      : meta.tone === 'danger'
        ? <XCircle className="w-3 h-3 me-1" />
        : meta.tone === 'warning'
          ? <AlertTriangle className="w-3 h-3 me-1" />
          : <Clock className="w-3 h-3 me-1" />

    return <span className={`badge ${badgeClass}`}>{icon}{meta.label}</span>
  }

  const exportColumns = [
    {
      key: 'invoiceNumber',
      label: t('invoiceNumber'),
      value: (r) => r?.invoiceNumber || ''
    },
    {
      key: 'buyerName',
      label: t('customer'),
      value: (r) => language === 'ar' ? (r?.buyer?.nameAr || r?.buyer?.name || '') : (r?.buyer?.name || r?.buyer?.nameAr || '')
    },
    {
      label: language === 'ar' ? 'النوع' : 'Type',
      value: (r) => getInvoiceContextLabel(r, language)
    },
    {
      key: 'issueDate',
      label: t('date'),
      value: (r) => (r?.issueDate ? new Date(r.issueDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '')
    },
    {
      key: 'grandTotal',
      label: t('total'),
      value: (r) => r?.grandTotal ?? ''
    },
    {
      key: 'zatcaStatus',
      label: t('zatcaStatus'),
      value: (r) => getZatcaStatusMeta(r, language).label
    },
  ]

  const getExportRows = async () => {
    const limit = 200
    let currentPage = 1
    let all = []

    while (true) {
      const res = await api.get('/invoices', {
        params: { page: currentPage, limit, search, ...filters }
      })
      const batch = res.data?.invoices || []
      all = all.concat(batch)

      const pages = res.data?.pagination?.pages || 1
      if (currentPage >= pages) break
      currentPage += 1

      if (all.length >= 10000) break
    }

    return all
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('invoices')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة الفواتير الضريبية والمبسطة' : 'Manage tax and simplified invoices'}
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            language={language}
            t={t}
            rows={data?.invoices || []}
            getRows={getExportRows}
            columns={exportColumns}
            fileBaseName={language === 'ar' ? 'فواتير' : 'Invoices'}
            title={language === 'ar' ? 'الفواتير' : 'Invoices'}
            disabled={isLoading || (data?.invoices || []).length === 0}
          />
          <Link to="/app/dashboard/invoices/new" className="btn btn-action-dark">
            <Plus className="w-4 h-4" />
            {t('newInvoice')}
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`${t('search')}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>
          <select
            value={filters.businessContext}
            onChange={(e) => {
              setFilters({ ...filters, businessContext: e.target.value })
              setPage(1)
            }}
            className="select w-full sm:w-52"
          >
            <option value="">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
            {tenantBusinessTypes.map((businessType) => (
              <option key={businessType} value={businessType}>{getInvoiceContextLabel({ businessContext: businessType }, language)}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value })
              setPage(1)
            }}
            className="select w-full sm:w-40"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
            <option value="pending">{t('pending')}</option>
            <option value="approved">{language === 'ar' ? 'معتمدة' : 'Approved'}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card"
      >
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('invoiceNumber')}</th>
                    <th>{t('customer')}</th>
                    <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                    <th>{t('date')}</th>
                    <th>{language === 'ar' ? 'تم الإنشاء بواسطة' : 'Created By'}</th>
                    <th>{t('total')}</th>
                    <th>{t('zatcaStatus')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.invoices?.map((invoice) => (
                    <tr key={invoice._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                            <FileText className="w-4 h-4 text-primary-600" />
                          </div>
                          <span className="font-medium">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {language === 'ar' ? (invoice.buyer?.nameAr || invoice.buyer?.name || '-') : (invoice.buyer?.name || invoice.buyer?.nameAr || '-')}
                        </p>
                        {invoice.buyer?.vatNumber && (
                          <p className="text-xs text-gray-500">{invoice.buyer.vatNumber}</p>
                        )}
                      </td>
                      <td>
                        <div>
                          {isTravelAgencyInvoice(invoice) ? (
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getTravelInvoiceLabelMeta(invoice, language).className}`}>
                              {getInvoiceContextLabel(invoice, language)}
                            </span>
                          ) : (
                            <span className="badge badge-neutral">
                              {getInvoiceContextLabel(invoice, language)}
                            </span>
                          )}
                          <p className="mt-1 text-xs text-gray-500">{getTransactionTypeLabel(invoice.transactionType, language, t)}</p>
                          {isTravelAgencyInvoice(invoice) && (
                            <p className={`mt-1 text-[11px] font-medium ${getTravelInvoiceLabelMeta(invoice, language).textClassName}`}>
                              {getTravelInvoiceLabelMeta(invoice, language).description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="text-gray-600 dark:text-gray-400">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </td>
                      <td className="text-gray-600 dark:text-gray-400 text-sm">
                        {(() => {
                          const en = [invoice?.createdBy?.firstName, invoice?.createdBy?.lastName].filter(Boolean).join(' ')
                          const ar = [invoice?.createdBy?.firstNameAr, invoice?.createdBy?.lastNameAr].filter(Boolean).join(' ')
                          return (language === 'ar'
                            ? (invoice.createdByNameAr || ar || invoice.createdByName || en)
                            : (invoice.createdByName || en || invoice.createdByNameAr || ar)) || '—'
                        })()}
                      </td>
                      <td className="font-semibold"><Money value={invoice.grandTotal} /></td>
                      <td>{getStatusBadge(invoice)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {isEditableInvoice(invoice) && (
                            <Link
                              to={`/app/dashboard/invoices/${invoice._id}/edit`}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                              title={language === 'ar' ? 'تعديل' : 'Edit'}
                            >
                              <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            </Link>
                          )}
                          <Link
                            to={`/app/dashboard/invoices/${invoice._id}`}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </Link>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                setPdfLoadingId(invoice._id)
                                const full = await api.get(`/invoices/${invoice._id}`).then((res) => res.data)
                                await downloadInvoicePdf({ invoice: full, language, tenant })
                              } catch (e) {
                                toast.error(language === 'ar' ? 'فشل تحميل PDF' : 'Failed to download PDF')
                              } finally {
                                setPdfLoadingId(null)
                              }
                            }}
                            disabled={pdfLoadingId === invoice._id}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                            title={language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
                          >
                            {pdfLoadingId === invoice._id ? (
                              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && (
              <div className="p-4 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {language === 'ar' 
                    ? `عرض ${data.invoices.length} من ${data.pagination.total}`
                    : `Showing ${data.invoices.length} of ${data.pagination.total}`}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-secondary"
                  >
                    {language === 'ar' ? 'السابق' : 'Previous'}
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page >= data.pagination.pages}
                    className="btn btn-secondary"
                  >
                    {language === 'ar' ? 'التالي' : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
