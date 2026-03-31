import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, ShoppingCart, FileText, Building, Calendar, Edit } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'
import Money from '../components/ui/Money'
import ExportMenu from '../components/ui/ExportMenu'

export default function PurchaseOrders() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', supplierId: '' })

  const exportColumns = [
    {
      key: 'poNumber',
      label: language === 'ar' ? 'رقم الطلب' : 'PO Number',
      value: (r) => r?.poNumber || ''
    },
    {
      key: 'supplier',
      label: language === 'ar' ? 'المورد' : 'Supplier',
      value: (r) => {
        const s = r?.supplierId
        return s ? (language === 'ar' ? s.nameAr || s.nameEn : s.nameEn || s.nameAr) : ''
      }
    },
    {
      key: 'orderDate',
      label: language === 'ar' ? 'تاريخ الطلب' : 'Order Date',
      value: (r) => (r?.orderDate ? new Date(r.orderDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US') : '')
    },
    {
      key: 'status',
      label: t('status'),
      value: (r) => r?.status || ''
    },
    {
      key: 'grandTotal',
      label: t('total'),
      value: (r) => r?.grandTotal ?? ''
    },
  ]

  const getExportRows = async () => {
    const limit = 200
    let currentPage = 1
    let all = []

    while (true) {
      const res = await api.get('/purchase-orders', {
        params: { page: currentPage, limit, search, status: filters.status, supplierId: filters.supplierId }
      })
      const batch = res.data?.purchaseOrders || []
      all = all.concat(batch)

      const pages = res.data?.pagination?.pages || 1
      if (currentPage >= pages) break
      currentPage += 1

      if (all.length >= 10000) break
    }

    return all
  }

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page, search, filters],
    queryFn: () =>
      api
        .get('/purchase-orders', { params: { page, limit: 25, search, status: filters.status, supplierId: filters.supplierId } })
        .then((res) => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['purchase-orders-stats'],
    queryFn: () => api.get('/purchase-orders/stats').then((res) => res.data),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-lookup'],
    queryFn: () => api.get('/suppliers', { params: { limit: 200 } }).then((res) => res.data.suppliers),
  })

  const totals = stats?.totals?.[0]
  const totalOrders = totals?.count || 0
  const openOrders = totals?.openCount || 0
  const totalValue = totals?.totalValue || 0
  const receivedCount = stats?.byStatus?.find((x) => x._id === 'received')?.count || 0

  const orders = data?.purchaseOrders || []
  const pagination = data?.pagination

  const statusBadge = (status) => {
    if (status === 'received') return 'badge-success'
    if (status === 'partially_received') return 'badge-warning'
    if (status === 'cancelled') return 'badge-danger'
    if (status === 'approved') return 'badge-info'
    if (status === 'sent') return 'badge-info'
    return 'badge-neutral'
  }

  const statusLabel = (status) => {
    if (language === 'ar') {
      if (status === 'draft') return 'مسودة'
      if (status === 'sent') return 'مرسل'
      if (status === 'approved') return 'معتمد'
      if (status === 'partially_received') return 'مستلم جزئياً'
      if (status === 'received') return 'مستلم'
      if (status === 'cancelled') return 'ملغي'
      return status
    }
    return status
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'طلبات الشراء' : 'Purchase Orders'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{language === 'ar' ? 'إدارة أوامر الشراء' : 'Manage purchase orders'}</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            language={language}
            t={t}
            rows={orders}
            getRows={getExportRows}
            columns={exportColumns}
            fileBaseName={language === 'ar' ? 'طلبات_الشراء' : 'PurchaseOrders'}
            title={language === 'ar' ? 'طلبات الشراء' : 'Purchase Orders'}
            disabled={isLoading || orders.length === 0}
          />
          <Link to="/purchase-orders/new" className="btn btn-primary">
            <Plus className="w-4 h-4" />
            {language === 'ar' ? 'إضافة طلب شراء' : 'Add Purchase Order'}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}</p>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'طلبات مفتوحة' : 'Open Orders'}</p>
            <p className="text-2xl font-bold text-amber-600">{openOrders}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي القيمة' : 'Total Value'}</p>
            <p className="text-xl font-bold"><Money value={totalValue} /></p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'طلبات مستلمة' : 'Received'}</p>
            <p className="text-2xl font-bold">{receivedCount}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث برقم الطلب...' : 'Search by PO number...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }))
              setPage(1)
            }}
            className="select w-full lg:w-48"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
            <option value="sent">{language === 'ar' ? 'مرسل' : 'Sent'}</option>
            <option value="approved">{language === 'ar' ? 'معتمد' : 'Approved'}</option>
            <option value="partially_received">{language === 'ar' ? 'مستلم جزئياً' : 'Partially Received'}</option>
            <option value="received">{language === 'ar' ? 'مستلم' : 'Received'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          </select>

          <select
            value={filters.supplierId}
            onChange={(e) => {
              setFilters((f) => ({ ...f, supplierId: e.target.value }))
              setPage(1)
            }}
            className="select w-full lg:w-64"
          >
            <option value="">{language === 'ar' ? 'كل الموردين' : 'All Suppliers'}</option>
            {(suppliers || []).map((s) => (
              <option key={s._id} value={s._id}>
                {(language === 'ar' ? s.nameAr || s.nameEn : s.nameEn) || s.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'رقم الطلب' : 'PO Number'}</th>
                  <th>{language === 'ar' ? 'المورد' : 'Supplier'}</th>
                  <th>{language === 'ar' ? 'تاريخ الطلب' : 'Order Date'}</th>
                  <th>{t('status')}</th>
                  <th>{t('total')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po._id}>
                    <td className="font-mono text-sm">{po.poNumber}</td>
                    <td>
                      <span className="inline-flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {language === 'ar'
                            ? po.supplierId?.nameAr || po.supplierId?.nameEn || '-'
                            : po.supplierId?.nameEn || po.supplierId?.nameAr || '-'}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {po.orderDate
                          ? new Date(po.orderDate).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
                          : '-'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(po.status)}`}>{statusLabel(po.status)}</span>
                    </td>
                    <td className="font-semibold"><Money value={po.grandTotal} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/purchase-orders/${po._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {pagination?.pages > 1 && (
        <div className="flex items-center justify-between">
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {language === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <div className="text-sm text-gray-500">
            {language === 'ar' ? 'صفحة' : 'Page'} {page} / {pagination.pages}
          </div>
          <button
            className="btn btn-secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          >
            {language === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}
