import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ClipboardList, RefreshCw, Receipt, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

function formatTime(value) {
  if (!value) return '-'
  try {
    return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '-'
  }
}

function printHtml(html) {
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)

  const doc = iframe.contentWindow?.document
  if (!doc) return

  doc.open()
  doc.write(html)
  doc.close()

  const win = iframe.contentWindow
  if (!win) return

  win.focus()
  win.print()

  setTimeout(() => {
    document.body.removeChild(iframe)
  }, 500)
}

export default function RestaurantKitchen() {
  const queryClient = useQueryClient()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [statuses, setStatuses] = useState(['new', 'preparing', 'ready'])

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['restaurant-kitchen', statuses],
    queryFn: () => api.get('/restaurant/orders/kitchen', { params: { statuses: statuses.join(',') } }).then((res) => res.data),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  const orders = data?.orders || []

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, kitchenStatus }) => api.put(`/restaurant/orders/${id}/kitchen-status`, { kitchenStatus }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurant-kitchen'])
      queryClient.invalidateQueries(['restaurant-orders'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const markPrintedMutation = useMutation({
    mutationFn: (id) => api.post(`/restaurant/orders/${id}/kitchen-ticket/printed`).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries(['restaurant-kitchen'])
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Error'),
  })

  const statusOptions = useMemo(
    () => [
      { key: 'new', labelEn: 'New', labelAr: 'جديد' },
      { key: 'preparing', labelEn: 'Preparing', labelAr: 'قيد التحضير' },
      { key: 'ready', labelEn: 'Ready', labelAr: 'جاهز' },
      { key: 'served', labelEn: 'Served', labelAr: 'تم التقديم' },
    ],
    []
  )

  const buildKitchenTicketHtml = (order) => {
    const isAr = language === 'ar'

    const items = (order?.lineItems || [])
      .map((li) => {
        const name = isAr ? li?.nameAr || li?.name : li?.name
        return `<tr><td style="padding:6px 0;">${String(name || '')}</td><td style="padding:6px 0;text-align:end;">${Number(li?.quantity || 0)}</td></tr>`
      })
      .join('')

    const title = isAr ? 'تذكرة المطبخ' : 'Kitchen Ticket'
    const tableLabel = isAr ? 'الطاولة' : 'Table'
    const orderLabel = isAr ? 'الطلب' : 'Order'
    const timeLabel = isAr ? 'الوقت' : 'Time'

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
body{font-family:Arial, sans-serif; margin:0; padding:14px;}
.h{display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px;}
.k{font-size:18px; font-weight:700;}
.meta{font-size:12px; color:#111;}
table{width:100%; border-collapse:collapse; margin-top:12px;}
th{font-size:12px; text-align:start; border-bottom:1px solid #ddd; padding-bottom:6px;}
</style>
</head>
<body dir="${isAr ? 'rtl' : 'ltr'}">
  <div class="h">
    <div class="k">${title}</div>
    <div class="meta">
      <div>${orderLabel}: ${order?.orderNumber || ''}</div>
      <div>${tableLabel}: ${order?.tableNumber || '-'}</div>
      <div>${timeLabel}: ${formatTime(order?.createdAt)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isAr ? 'الصنف' : 'Item'}</th>
        <th style="text-align:end;">${isAr ? 'الكمية' : 'Qty'}</th>
      </tr>
    </thead>
    <tbody>
      ${items}
    </tbody>
  </table>

  <script>window.onafterprint = () => window.close && window.close();</script>
</body>
</html>`
  }

  const buildReceiptHtml = (order) => {
    const isAr = language === 'ar'

    const items = (order?.lineItems || [])
      .map((li) => {
        const name = isAr ? li?.nameAr || li?.name : li?.name
        const qty = Number(li?.quantity || 0)
        const unitPrice = Number(li?.unitPrice || 0)
        const total = qty * unitPrice
        return `<tr><td style="padding:6px 0;">${String(name || '')}</td><td style="padding:6px 0;text-align:end;">${qty}</td><td style="padding:6px 0;text-align:end;">${unitPrice.toFixed(2)}</td><td style="padding:6px 0;text-align:end;">${total.toFixed(2)}</td></tr>`
      })
      .join('')

    const title = isAr ? 'إيصال' : 'Receipt'

    return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
body{font-family:Arial, sans-serif; margin:0; padding:14px;}
.h{display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:10px;}
.k{font-size:18px; font-weight:700;}
.meta{font-size:12px; color:#111;}
table{width:100%; border-collapse:collapse; margin-top:12px;}
th{font-size:12px; text-align:start; border-bottom:1px solid #ddd; padding-bottom:6px;}
.tot{margin-top:10px; display:flex; justify-content:flex-end;}
.tot div{width:220px; font-size:12px;}
.row{display:flex; justify-content:space-between; padding:4px 0;}
.bold{font-weight:700;}
</style>
</head>
<body dir="${isAr ? 'rtl' : 'ltr'}">
  <div class="h">
    <div class="k">${title}</div>
    <div class="meta">
      <div>${isAr ? 'الطلب' : 'Order'}: ${order?.orderNumber || ''}</div>
      <div>${isAr ? 'الطاولة' : 'Table'}: ${order?.tableNumber || '-'}</div>
      <div>${isAr ? 'الوقت' : 'Time'}: ${formatTime(order?.createdAt)}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>${isAr ? 'الصنف' : 'Item'}</th>
        <th style="text-align:end;">${isAr ? 'الكمية' : 'Qty'}</th>
        <th style="text-align:end;">${isAr ? 'السعر' : 'Price'}</th>
        <th style="text-align:end;">${isAr ? 'الإجمالي' : 'Total'}</th>
      </tr>
    </thead>
    <tbody>
      ${items}
    </tbody>
  </table>

  <div class="tot">
    <div>
      <div class="row"><span>${isAr ? 'المجموع' : 'Subtotal'}</span><span>${Number(order?.subtotal || 0).toFixed(2)}</span></div>
      <div class="row"><span>${isAr ? 'الضريبة' : 'Tax'}</span><span>${Number(order?.totalTax || 0).toFixed(2)}</span></div>
      <div class="row bold"><span>${isAr ? 'الإجمالي' : 'Total'}</span><span>${Number(order?.grandTotal || 0).toFixed(2)}</span></div>
    </div>
  </div>

  <script>window.onafterprint = () => window.close && window.close();</script>
</body>
</html>`
  }

  const statusLabel = (s) => {
    const found = statusOptions.find((x) => x.key === s)
    if (!found) return s || '-'
    return language === 'ar' ? found.labelAr : found.labelEn
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'شاشة المطبخ' : 'Kitchen Screen'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{language === 'ar' ? 'إدارة تجهيز الطلبات' : 'Manage order preparation'}</p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => refetch()} disabled={isFetching} className="btn btn-secondary">
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            {language === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="text-sm text-gray-500 mb-2">{language === 'ar' ? 'الحالات' : 'Statuses'}</div>
            <div className="flex flex-wrap gap-2">
              {['new', 'preparing', 'ready'].map((s) => {
                const active = statuses.includes(s)
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : prev.concat(s)))
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                      active
                        ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                        : 'bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-700'
                    }`}
                  >
                    {statusLabel(s)}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="sm:w-64">
            <div className="text-sm text-gray-500 mb-2">{language === 'ar' ? 'عدد الطلبات' : 'Orders'}</div>
            <div className="text-2xl font-bold">{orders.length}</div>
          </div>
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
                  <th>{language === 'ar' ? 'الطلب' : 'Order'}</th>
                  <th>{language === 'ar' ? 'الطاولة' : 'Table'}</th>
                  <th>{language === 'ar' ? 'الوقت' : 'Time'}</th>
                  <th>{language === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th>{language === 'ar' ? 'المجموع' : 'Total'}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-mono text-sm">{o.orderNumber}</td>
                    <td>{o.tableNumber || '-'}</td>
                    <td className="text-gray-500">{formatTime(o.createdAt)}</td>
                    <td>
                      <span className="badge badge-neutral capitalize inline-flex items-center gap-1">
                        {o.kitchenStatus === 'ready' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {statusLabel(o.kitchenStatus)}
                      </span>
                    </td>
                    <td className="font-semibold">
                      <Money value={o.grandTotal || 0} />
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            try {
                              printHtml(buildKitchenTicketHtml(o))
                              markPrintedMutation.mutate(o._id)
                            } catch {
                              toast.error(language === 'ar' ? 'فشل الطباعة' : 'Print failed')
                            }
                          }}
                        >
                          <Receipt className="w-4 h-4" />
                          {language === 'ar' ? 'تذكرة' : 'Ticket'}
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            try {
                              printHtml(buildReceiptHtml(o))
                            } catch {
                              toast.error(language === 'ar' ? 'فشل الطباعة' : 'Print failed')
                            }
                          }}
                        >
                          <Receipt className="w-4 h-4" />
                          {language === 'ar' ? 'إيصال' : 'Receipt'}
                        </button>

                        {o.kitchenStatus !== 'preparing' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => updateStatusMutation.mutate({ id: o._id, kitchenStatus: 'preparing' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <ClipboardList className="w-4 h-4" />
                            {language === 'ar' ? 'تحضير' : 'Preparing'}
                          </button>
                        )}

                        {o.kitchenStatus !== 'ready' && (
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => updateStatusMutation.mutate({ id: o._id, kitchenStatus: 'ready' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {language === 'ar' ? 'جاهز' : 'Ready'}
                          </button>
                        )}

                        {o.kitchenStatus !== 'served' && (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => updateStatusMutation.mutate({ id: o._id, kitchenStatus: 'served' })}
                            disabled={updateStatusMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4" />
                            {language === 'ar' ? 'تم' : 'Served'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد طلبات في المطبخ' : 'No kitchen orders'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
