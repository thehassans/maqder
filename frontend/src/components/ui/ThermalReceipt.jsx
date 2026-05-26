import React, { forwardRef } from 'react'
import { useSelector } from 'react-redux'

const ThermalReceipt = forwardRef(({ order, type = 'laundry' }, ref) => {
  const { tenant } = useSelector(state => state.auth)
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'

  if (!order) return null

  const businessNameEn = tenant?.business?.legalNameEn || tenant?.name || 'Maqder POS'
  const businessNameAr = tenant?.business?.legalNameAr || tenant?.name || 'مقدر نقاط البيع'

  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString(isRtl ? 'ar-SA' : 'en-US')
  const orderNumber = order.orderNumber || order._id?.slice(-8) || 'N/A'
  const customerName = order.customerName || order.customer?.fullName || (isRtl ? 'عميل نقدي' : 'Cash Customer')

  const items = order.items || order.lineItems || []

  return (
    <div 
      ref={ref} 
      className="print-section bg-white text-black p-4 mx-auto font-mono text-sm leading-snug"
      style={{ width: '80mm', maxWidth: '100%', boxSizing: 'border-box' }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <style type="text/css" media="print">
        {`
          @page { size: auto; margin: 0; }
          body { margin: 0; padding: 0; background: white; }
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
          }
          /* Hide scrollbars during print */
          ::-webkit-scrollbar { display: none; }
        `}
      </style>

      {/* Header */}
      <div className="text-center mb-4">
        {tenant?.branding?.logoUrl && (
          <img src={tenant.branding.logoUrl} alt="Logo" className="w-16 h-16 mx-auto mb-2 object-contain grayscale" />
        )}
        <h2 className="font-bold text-lg">{isRtl ? businessNameAr : businessNameEn}</h2>
        {tenant?.business?.vatNumber && (
          <div className="text-xs mt-1">VAT: {tenant.business.vatNumber}</div>
        )}
        <div className="text-xs mt-1">{tenant?.business?.address}</div>
      </div>

      <div className="border-t border-b border-dashed border-gray-400 py-2 mb-3 text-xs">
        <div className="flex justify-between">
          <span>{isRtl ? 'رقم الطلب:' : 'Order #:'}</span>
          <span className="font-bold">{orderNumber}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>{isRtl ? 'التاريخ:' : 'Date:'}</span>
          <span>{dateStr}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>{isRtl ? 'العميل:' : 'Customer:'}</span>
          <span>{customerName}</span>
        </div>
        {type === 'restaurant' && order.tableNumber && (
          <div className="flex justify-between mt-1">
            <span>{isRtl ? 'الطاولة:' : 'Table:'}</span>
            <span className="font-bold">{order.tableNumber}</span>
          </div>
        )}
      </div>

      {/* Items Table */}
      <table className="w-full text-xs mb-3">
        <thead>
          <tr className="border-b border-dashed border-gray-400">
            <th className="text-left py-1 w-1/2">{isRtl ? 'الصنف' : 'Item'}</th>
            <th className="text-center py-1">#</th>
            <th className="text-right py-1 w-1/4">{isRtl ? 'المجموع' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100 last:border-0">
              <td className="py-2 pr-2">
                <div className="font-semibold break-words">
                  {isRtl ? (item.nameAr || item.nameEn || item.name) : (item.nameEn || item.nameAr || item.name)}
                </div>
                {type === 'laundry' && item.treatment && (
                  <div className="text-[10px] text-gray-600 mt-0.5 font-medium leading-tight">
                    {item.treatment} {item.customizations?.length > 0 && `(${item.customizations.join(', ')})`}
                  </div>
                )}
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {Number(item.unitPrice).toFixed(2)}
                </div>
              </td>
              <td className="text-center py-2 align-top">{item.quantity}</td>
              <td className="text-right py-2 align-top font-semibold">
                {(Number(item.total || item.lineTotal || (item.unitPrice * item.quantity))).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="border-t border-dashed border-gray-400 pt-2 text-sm">
        <div className="flex justify-between">
          <span>{isRtl ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
          <span>{(Number(order.subtotal)).toFixed(2)}</span>
        </div>
        {order.isUrgent && (
          <div className="flex justify-between mt-1 font-semibold text-gray-800 border-b border-dashed border-gray-200 pb-1">
            <span>{isRtl ? 'رسوم العاجل:' : 'Urgent Fee:'}</span>
            <span>10.00</span>
          </div>
        )}
        <div className="flex justify-between mt-1">
          <span>{isRtl ? 'ضريبة القيمة المضافة:' : 'VAT:'}</span>
          <span>{(Number(order.totalVat || order.totalTax)).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mt-2 font-bold text-base">
          <span>{isRtl ? 'الإجمالي:' : 'Total:'}</span>
          <span>SAR {(Number(order.grandTotal)).toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs mt-6 pt-4 border-t border-dashed border-gray-400">
        <p className="font-bold mb-1">{isRtl ? 'شكراً لزيارتكم!' : 'Thank you for your visit!'}</p>
        <p>{isRtl ? 'يرجى الاحتفاظ بالإيصال.' : 'Please keep this receipt.'}</p>
      </div>
    </div>
  )
})

ThermalReceipt.displayName = 'ThermalReceipt'
export default ThermalReceipt
