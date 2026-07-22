import React, { forwardRef } from 'react';
import { useSelector } from 'react-redux';
import { getThermalPrinterSettings, getReceiptStyle, getPrintCss, getPageCss } from '../../lib/thermalPrinter';

const OrderReceipt = forwardRef(({ order, invoice, isUpdated = false }, ref) => {
  const { tenant } = useSelector(state => state.auth);
  const { language } = useSelector(state => state.ui);
  const isRtl = language === 'ar';

  if (!order) return null;

  const thermalSettings = getThermalPrinterSettings(tenant);

  const businessName = tenant?.business?.legalNameEn || tenant?.name || 'Restaurant';
  const businessNameAr = tenant?.business?.legalNameAr || businessName;
  const vatNumber = tenant?.business?.vatNumber || '000000000000000';
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleString(isRtl ? 'ar-SA' : 'en-GB');
  const orderNumber = order.orderNumber || 'N/A';
  const tableNumber = order.tableNumber || (isRtl ? 'تيك أواي' : 'Takeaway');
  const orderType = order.orderType || 'dine_in';
  const paymentMethod = order.paymentMethod || 'cash';

  const typeLabel = {
    dine_in: isRtl ? 'داخل المطعم' : 'Dine In',
    takeaway: isRtl ? 'سفري' : 'Takeaway',
    delivery: isRtl ? 'توصيل' : 'Delivery',
  };

  const paymentLabel = {
    cash: isRtl ? 'نقدي' : 'Cash',
    card: isRtl ? 'بطاقة' : 'Card',
    transfer: isRtl ? 'تحويل' : 'Transfer',
    other: isRtl ? 'أخرى' : 'Other',
  };

  const items = order.lineItems || [];
  const subtotal = order.subtotal || 0;
  const totalTax = order.totalTax || 0;
  const grandTotal = order.grandTotal || 0;

  const receiptStyle = getReceiptStyle(thermalSettings);
  const printCss = getPrintCss('order-receipt', thermalSettings);
  const pageCss = getPageCss(thermalSettings);

  return (
    <div
      ref={ref}
      className="order-receipt bg-white text-black font-mono"
      style={receiptStyle}
    >
      <style>{`
        ${pageCss}
        ${printCss}
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{businessName}</div>
        {businessNameAr && (
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{businessNameAr}</div>
        )}
        <div style={{ fontSize: '8px', marginTop: '2px' }}>
          VAT / الرقم الضريبي: <b>{vatNumber}</b>
        </div>
        <div style={{ fontSize: '9px', marginTop: '4px', fontWeight: 'bold' }}>
          {isUpdated ? (isRtl ? 'فاتورة مُحدَّثة' : 'UPDATED INVOICE') : (isRtl ? 'فاتورة ضريبية مبسطة' : 'SIMPLIFIED TAX INVOICE')}
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      {/* Order Number Box */}
      <div style={{ margin: '8px 0', border: '1px solid #000', padding: '6px', textAlign: 'center' }}>
        <div style={{ fontSize: '10px', marginBottom: '2px' }}>Order / الطلب</div>
        <div style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '0.5px' }}>#{orderNumber}</div>
      </div>

      {/* Order Info */}
      <div style={{ marginBottom: '8px', fontSize: '9px' }}>
        {invoice?.invoiceNumber && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Invoice / الفاتورة:</span>
            <b>{invoice.invoiceNumber}</b>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date / التاريخ:</span>
          <span>{dateStr}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Type / النوع:</span>
          <span>{typeLabel[orderType]}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Table / الطاولة:</span>
          <span>{tableNumber}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Payment / الدفع:</span>
          <span>{paymentLabel[paymentMethod]}</span>
        </div>
        {order.customerName && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Customer / العميل:</span>
            <b>{order.customerName}</b>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #999' }}>
            <th style={{ textAlign: isRtl ? 'right' : 'left', padding: '2px 0' }}>Item</th>
            <th style={{ textAlign: 'center', padding: '2px 0' }}>Qty</th>
            <th style={{ textAlign: 'right', padding: '2px 0' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px dashed #ddd' }}>
              <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                <b>{isRtl ? (item.nameAr || item.name) : item.name}</b>
              </td>
              <td style={{ textAlign: 'center', padding: '3px 0' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 'bold' }}>
                SAR {(item.lineTotal || 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      {/* Totals */}
      <div style={{ fontSize: '9px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal / الإجمالي:</span>
          <span>SAR {subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>VAT 15% / ضريبة:</span>
          <span>SAR {totalTax.toFixed(2)}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '4px',
          paddingTop: '4px',
          borderTop: '1px dashed #ccc',
          fontSize: '12px',
          fontWeight: 'bold',
        }}>
          <span>Total / الإجمالي:</span>
          <span>SAR {grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '8px', color: '#555' }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#000', marginBottom: '3px' }}>
          Thank you for choosing us!
        </div>
        <div>شكراً لاختياركم</div>
        {orderType === 'dine_in' && (
          <div style={{ marginTop: '4px' }}>Please keep this receipt for your records.</div>
        )}
      </div>

      {/* Spacer */}
      <div style={{ height: '4mm' }} />
    </div>
  );
});

OrderReceipt.displayName = 'OrderReceipt';
export default OrderReceipt;
