import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { getThermalPrinterSettings, getReceiptStyle, getPrintCss, getPageCss } from '../../lib/thermalPrinter';

const KitchenTicket = forwardRef(({ order, isUpdated = false }, ref) => {
  const { tenant } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const isRtl = language === 'ar';

  if (!order) return null;

  const thermalSettings = getThermalPrinterSettings(tenant);

  const businessName = tenant?.business?.legalNameEn || tenant?.name || 'Restaurant';
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString(isRtl ? 'ar-SA' : 'en-GB');
  const orderNumber = order.orderNumber || order._id?.slice(-8) || 'N/A';
  const tableNumber = order.tableNumber || (isRtl ? 'تيك أواي' : 'Takeaway');
  const orderType = order.orderType || 'dine_in';

  const typeLabel = {
    dine_in: isRtl ? 'داخل المطعم' : 'Dine In',
    takeaway: isRtl ? 'سفري' : 'Takeaway',
    delivery: isRtl ? 'توصيل' : 'Delivery',
  };

  const items = order.lineItems || [];

  const ticketStyle = { ...getReceiptStyle(thermalSettings), fontSize: '12px', lineHeight: 1.3 };
  const printCss = getPrintCss('kitchen-ticket', thermalSettings);
  const pageCss = getPageCss(thermalSettings);

  return (
    <div
      ref={ref}
      className="kitchen-ticket bg-white text-black font-mono"
      style={ticketStyle}
    >
      <style>{`
        ${pageCss}
        ${printCss}
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '6px', borderBottom: '2px dashed #000', paddingBottom: '4px' }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
          {isUpdated ? (isRtl ? '✎ طلب مُحدَّث' : '✎ UPDATED ORDER') : (isRtl ? '★ طلب جديد' : '★ NEW ORDER')}
        </div>
        <div style={{ fontSize: '10px', marginTop: '2px' }}>{businessName}</div>
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: '6px', fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><b>Order / الطلب:</b> #{orderNumber}</span>
          <span>{typeLabel[orderType]}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span><b>Table / الطاولة:</b> {tableNumber}</span>
          <span>{dateStr}</span>
        </div>
        {order.customerName && (
          <div><b>Customer / العميل:</b> {order.customerName}</div>
        )}
        {order.notes && (
          <div style={{ color: '#d00', fontWeight: 'bold', marginTop: '2px' }}>
            ⚠ {isRtl ? 'ملاحظة:' : 'NOTE:'} {order.notes}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '4px 0' }} />

      {/* Items */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
            <th style={{ textAlign: isRtl ? 'right' : 'left', padding: '2px 0' }}>Item / البند</th>
            <th style={{ textAlign: 'center', padding: '2px 0' }}>Qty / الكمية</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px dashed #ccc' }}>
              <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                <b>{isRtl ? (item.nameAr || item.name) : item.name}</b>
                {item.nameAr && !isRtl && (
                  <div style={{ fontSize: '9px', color: '#555' }}>{item.nameAr}</div>
                )}
              </td>
              <td style={{ textAlign: 'center', padding: '3px 0', fontSize: '14px', fontWeight: 'bold' }}>
                x{item.quantity}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer */}
      <div style={{ borderTop: '2px dashed #000', marginTop: '6px', paddingTop: '4px', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', color: '#555' }}>
          {isRtl ? 'الرجاء إعداد الطلب فوراً' : 'Please prepare immediately'}
        </div>
        <div style={{ fontSize: '9px', color: '#777', marginTop: '2px' }}>
          {isRtl ? 'شكراً لفريق المطبخ' : 'Thank you, Kitchen Team'}
        </div>
      </div>

      {/* Spacer */}
      <div style={{ height: '4mm' }} />
    </div>
  );
});

KitchenTicket.displayName = 'KitchenTicket';
export default KitchenTicket;
