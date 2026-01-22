import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

export default function Invoices() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', transactionType: '' })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, search, filters],
    queryFn: () => api.get('/invoices', { 
      params: { page, search, ...filters } 
    }).then(res => res.data)
  })

  const getStatusBadge = (status, zatcaStatus) => {
    if (zatcaStatus === 'cleared') return <span className="badge badge-success"><CheckCircle className="w-3 h-3 me-1" />{t('cleared')}</span>
    if (zatcaStatus === 'reported') return <span className="badge badge-info"><CheckCircle className="w-3 h-3 me-1" />{t('reported')}</span>
    if (zatcaStatus === 'rejected') return <span className="badge badge-danger"><XCircle className="w-3 h-3 me-1" />{t('rejected')}</span>
    if (zatcaStatus === 'warning') return <span className="badge badge-warning"><AlertTriangle className="w-3 h-3 me-1" />Warning</span>
    return <span className="badge badge-neutral"><Clock className="w-3 h-3 me-1" />{t('pending')}</span>
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
        <Link to="/invoices/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {t('newInvoice')}
        </Link>
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
              onChange={(e) => setSearch(e.target.value)}
              className="input ps-10"
            />
          </div>
          <select
            value={filters.transactionType}
            onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
            className="select w-full sm:w-40"
          >
            <option value="">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
            <option value="B2B">{t('b2bInvoice')}</option>
            <option value="B2C">{t('b2cInvoice')}</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
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
                          {invoice.buyer?.name || '-'}
                        </p>
                        {invoice.buyer?.vatNumber && (
                          <p className="text-xs text-gray-500">{invoice.buyer.vatNumber}</p>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${invoice.transactionType === 'B2B' ? 'badge-info' : 'badge-neutral'}`}>
                          {invoice.transactionType}
                        </span>
                      </td>
                      <td className="text-gray-600 dark:text-gray-400">
                        {new Date(invoice.issueDate).toLocaleDateString()}
                      </td>
                      <td className="font-semibold"><Money value={invoice.grandTotal} /></td>
                      <td>{getStatusBadge(invoice.status, invoice.zatca?.submissionStatus)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/invoices/${invoice._id}`}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </Link>
                          <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
                            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
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
