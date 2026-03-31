import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Receipt, Edit } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

export default function RestaurantOrders() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '' })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-orders', page, search, filters],
    queryFn: () =>
      api
        .get('/restaurant/orders', { params: { page, limit: 25, search, ...filters } })
        .then((res) => res.data),
  })

  const orders = data?.orders || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'طلبات المطعم' : 'Restaurant Orders'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة الطلبات والمدفوعات' : 'Manage orders and payments'}
          </p>
        </div>
        <Link to="/app/dashboard/restaurant/orders/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'طلب جديد' : 'New Order'}
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث برقم الطلب / الطاولة...' : 'Search by order / table...'}
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
              setFilters((p) => ({ ...p, status: e.target.value }))
              setPage(1)
            }}
            className="select w-full sm:w-48"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="open">{language === 'ar' ? 'مفتوح' : 'Open'}</option>
            <option value="paid">{language === 'ar' ? 'مدفوع' : 'Paid'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          </select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الرقم' : 'Number'}</th>
                  <th>{language === 'ar' ? 'الطاولة' : 'Table'}</th>
                  <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-mono text-sm">{o.orderNumber}</td>
                    <td>{o.tableNumber || '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{o.customerName || '-'}</div>
                          {o.customerPhone ? <div className="text-xs text-gray-500">{o.customerPhone}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td className="font-semibold">
                      <Money value={o.grandTotal || 0} />
                    </td>
                    <td>
                      <span className="badge badge-neutral capitalize">{o.status || '-'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/dashboard/restaurant/orders/${o._id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد طلبات' : 'No orders found'}
                    </td>
                  </tr>
                )}
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
