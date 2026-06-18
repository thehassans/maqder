import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Receipt, Edit, Printer, Utensils, History, Clock } from 'lucide-react'
import { useRef } from 'react'
import api from '../../lib/api'
import ThermalReceipt from '../../components/ui/ThermalReceipt'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

export default function RestaurantOrders() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '' })
  const [page, setPage] = useState(1)
  const [printOrder, setPrintOrder] = useState(null)
  const [receiptType, setReceiptType] = useState('customer')
  const [kitchenNote, setKitchenNote] = useState('')
  const [historyOrder, setHistoryOrder] = useState(null)
  const receiptRef = useRef(null)

  const handlePrint = () => {
    if (receiptRef.current) window.print()
  }

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
                        {(o.updateHistory?.length > 0 || (o.updatedAt && o.createdAt && new Date(o.updatedAt).getTime() > new Date(o.createdAt).getTime() + 5000)) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 whitespace-nowrap" title={language === 'ar' ? 'تم التحديث' : 'Updated'}>
                            <Clock className="w-3 h-3" />
                            {language === 'ar' ? 'محدث' : 'UPDATED'}
                          </span>
                        )}
                        <button
                          onClick={() => { setPrintOrder(o); setReceiptType('customer'); setKitchenNote(''); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-amber-600"
                          title={language === 'ar' ? 'طباعة إيصال' : 'Print Receipt'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setPrintOrder(o); setReceiptType('kitchen'); setKitchenNote(''); }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-indigo-600"
                          title={language === 'ar' ? 'طباعة للمطبخ' : 'Print for Kitchen'}
                        >
                          <Utensils className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/app/dashboard/restaurant/pos?orderId=${o._id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                        <button
                          onClick={() => setHistoryOrder(o)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-gray-500"
                          title={language === 'ar' ? 'سجل التحديثات' : 'Update History'}
                        >
                          <History className="w-4 h-4" />
                        </button>
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

      {printOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 print:bg-white print:static print:inset-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[400px] max-h-[90vh] overflow-y-auto print:shadow-none print:p-0 print:w-auto print:max-h-none print:overflow-visible">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="text-lg font-bold">
                {receiptType === 'kitchen' 
                  ? (language === 'ar' ? 'إيصال المطبخ' : 'Kitchen Receipt')
                  : (language === 'ar' ? 'إيصال الطلب' : 'Order Receipt')}
              </h3>
              <button onClick={() => setPrintOrder(null)} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center">
                ×
              </button>
            </div>
            
            {receiptType === 'kitchen' && (
              <div className="mb-4 print:hidden">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ar' ? 'ملاحظة مخصصة للمطبخ' : 'Custom Kitchen Note'}
                </label>
                <input 
                  type="text" 
                  value={kitchenNote}
                  onChange={e => setKitchenNote(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder={language === 'ar' ? 'مثال: بدون بصل' : 'e.g. No onions'}
                />
              </div>
            )}
            
            <div className="border border-gray-200 rounded-lg p-2 print:border-none print:p-0 flex justify-center">
              <ThermalReceipt
                ref={receiptRef}
                order={receiptType === 'kitchen' && kitchenNote ? { ...printOrder, kitchenNote } : printOrder}
                type="restaurant"
                isKitchen={receiptType === 'kitchen'}
                isUpdated={(printOrder.updateHistory?.length > 0 || (printOrder.updatedAt && printOrder.createdAt && new Date(printOrder.updatedAt).getTime() > new Date(printOrder.createdAt).getTime() + 5000)) && receiptType !== 'kitchen'}
              />
            </div>

            <div className="mt-6 flex gap-3 print:hidden">
              <button onClick={() => setPrintOrder(null)} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 text-gray-700">
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              <button onClick={handlePrint} className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold hover:bg-amber-700">
                {language === 'ar' ? 'طباعة' : 'Print'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[480px] max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {language === 'ar' ? 'سجل التحديثات' : 'Update History'}
              </h3>
              <button onClick={() => setHistoryOrder(null)} className="text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center">
                ×
              </button>
            </div>
            <div className="space-y-3">
              {historyOrder.updateHistory?.length > 0 ? (
                historyOrder.updateHistory.map((entry, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {new Date(entry.updatedAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                    {entry.changes && (
                      <div className="text-gray-700">
                        <span className="font-medium">{language === 'ar' ? 'التغييرات:' : 'Changes:'}</span> {entry.changes}
                      </div>
                    )}
                    {entry.reason && (
                      <div className="text-gray-700 mt-1">
                        <span className="font-medium">{language === 'ar' ? 'السبب:' : 'Reason:'}</span> {entry.reason}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-6">
                  {language === 'ar' ? 'لا يوجد سجل تحديثات مسجل' : 'No update history recorded'}
                </div>
              )}
            </div>
            <div className="mt-6">
              <button onClick={() => setHistoryOrder(null)} className="w-full py-3 rounded-xl border border-gray-200 font-bold hover:bg-gray-50 text-gray-700">
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
