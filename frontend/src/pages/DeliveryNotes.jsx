import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Plus, Eye, Edit, Truck, Search, FileText } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'

export default function DeliveryNotes() {
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [searchParams, setSearchParams] = useSearchParams()
  
  const page = parseInt(searchParams.get('page') || '1')
  const statusFilter = searchParams.get('status') || ''

  const { data, isLoading } = useQuery({
    queryKey: ['delivery-notes', page, statusFilter],
    queryFn: () => api.get('/delivery-notes', { params: { page, status: statusFilter } }).then((res) => res.data),
  })

  const statusBadge = (status) => {
    if (status === 'pending_invoice') return 'badge-warning'
    if (status === 'partially_invoiced') return 'badge-info'
    if (status === 'fully_invoiced') return 'badge-success'
    if (status === 'cancelled') return 'badge-danger'
    return 'badge-neutral'
  }

  const formatStatus = (status) => {
    if (language === 'ar') {
      if (status === 'pending_invoice') return 'بانتظار الفوترة'
      if (status === 'partially_invoiced') return 'مفوتر جزئياً'
      if (status === 'fully_invoiced') return 'مفوتر كلياً'
      if (status === 'cancelled') return 'ملغي'
    }
    return status?.replace('_', ' ')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'سندات التسليم' : 'Delivery Notes'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'ar' ? 'إدارة إثباتات التسليم للعملاء' : 'Manage proof of deliveries for customers'}
          </p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <select 
            value={statusFilter} 
            onChange={(e) => setSearchParams(prev => { prev.set('status', e.target.value); prev.set('page', '1'); return prev; })}
            className="select max-w-xs"
          >
            <option value="">{language === 'ar' ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="pending_invoice">{language === 'ar' ? 'بانتظار الفوترة' : 'Pending Invoice'}</option>
            <option value="partially_invoiced">{language === 'ar' ? 'مفوتر جزئياً' : 'Partially Invoiced'}</option>
            <option value="fully_invoiced">{language === 'ar' ? 'مفوتر كلياً' : 'Fully Invoiced'}</option>
          </select>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>{language === 'ar' ? 'رقم السند' : 'DN Number'}</th>
                <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
                <th>{language === 'ar' ? 'رقم الطلب' : 'PO Number'}</th>
                <th>{language === 'ar' ? 'الشحنة' : 'Shipment'}</th>
                <th>{t('status')}</th>
                <th className="text-end">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8">
                    <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : data?.deliveryNotes?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    {language === 'ar' ? 'لا يوجد سندات تسليم' : 'No delivery notes found'}
                  </td>
                </tr>
              ) : (
                data?.deliveryNotes?.map((dn) => (
                  <tr key={dn._id}>
                    <td className="font-medium text-gray-900 dark:text-white">
                      {dn.dnNumber}
                    </td>
                    <td>
                      {language === 'ar' 
                        ? dn.customerId?.nameAr || dn.customerId?.nameEn 
                        : dn.customerId?.nameEn || dn.customerId?.nameAr}
                    </td>
                    <td>{dn.purchaseOrderId?.poNumber || '-'}</td>
                    <td>
                      {dn.shipmentId ? (
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <Truck className="w-3 h-3" />
                          {dn.shipmentId.shipmentNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(dn.status)}`}>
                        {formatStatus(dn.status)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/app/dashboard/delivery-notes/${dn._id}`)}
                          className="btn btn-ghost btn-icon text-primary-600 hover:text-primary-700"
                        >
                          <Eye className="w-4 h-4" />
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
    </div>
  )
}
