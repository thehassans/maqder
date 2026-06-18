import { forwardRef } from 'react';

/**
 * BoutiqueThermalReceipt
 * ZATCA Phase 2 compliant 80mm thermal receipt for Ladies Boutique & Dress Rental.
 *
 * Print-optimized CSS:
 *  - @page { size: auto; margin: 0; } ensures the browser prints on continuous roll paper.
 *  - The receipt container is fixed to 80mm width.
 *  - All web UI chrome is hidden via print:hidden utilities.
 */

const BoutiqueThermalReceipt = forwardRef(({ rental, tenant }, ref) => {
  if (!rental) return null;

  const isArabic = false; // Default to bilingual layout; can be driven by prop
  const businessName = tenant?.business?.legalNameEn || tenant?.name || 'Boutique';
  const businessNameAr = tenant?.business?.legalNameAr || 'بوتيك';
  const vatNumber = tenant?.business?.vatNumber || '000000000000000';
  const address = [tenant?.business?.address?.street, tenant?.business?.address?.city]
    .filter(Boolean)
    .join(', ');

  const rentalNumber = rental.rentalNumber || '---';
  const customerName = rental.customerName || '---';
  const customerPhone = rental.customerPhone || '---';
  const startDate = rental.startDate ? new Date(rental.startDate).toLocaleDateString('en-GB') : '---';
  const endDate = rental.endDate ? new Date(rental.endDate).toLocaleDateString('en-GB') : '---';
  const issueDate = rental.createdAt ? new Date(rental.createdAt).toLocaleString('en-GB') : new Date().toLocaleString('en-GB');

  const lineItems = rental.lineItems || [];
  const rentalSubtotal = rental.rentalSubtotal || 0;
  const totalDeposit = rental.totalDeposit || 0;
  const totalTax = rental.totalTax || 0;
  const grandTotal = rental.grandTotal || 0;

  // ZATCA QR from invoice linkage
  const qrData = rental.invoiceId?.zatca?.qrCodeData || '';

  return (
    <div
      ref={ref}
      className="thermal-receipt bg-white text-black font-mono"
      style={{
        width: '80mm',
        padding: '4mm',
        boxSizing: 'border-box',
        fontSize: '10px',
        lineHeight: 1.4,
      }}
    >
      {/* Inline print-only CSS for environments where Tailwind @apply may not reach */}
      <style>{`
        @media print {
          .thermal-receipt {
            width: 80mm !important;
            padding: 4mm !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
          body * { visibility: hidden !important; }
          .thermal-receipt, .thermal-receipt * { visibility: visible !important; }
          .thermal-receipt { position: absolute; left: 0; top: 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          {businessName}
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
          {businessNameAr}
        </div>
        {address && (
          <div style={{ fontSize: '8px', marginTop: '3px', color: '#444' }}>{address}</div>
        )}
        <div style={{ fontSize: '8px', marginTop: '2px' }}>
          VAT / الرقم الضريبي: <b>{vatNumber}</b>
        </div>
        <div style={{ fontSize: '9px', marginTop: '6px', fontWeight: 'bold' }}>
          SIMPLIFIED TAX INVOICE
        </div>
        <div style={{ fontSize: '9px', fontWeight: 'bold' }}>
          فاتورة ضريبية مبسطة
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      {/* Meta */}
      <div style={{ marginBottom: '8px', fontSize: '9px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Invoice No / رقم الفاتورة:</span>
          <b>{rentalNumber}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Date / التاريخ:</span>
          <span>{issueDate}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Customer / العميل:</span>
          <b>{customerName}</b>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Phone / الجوال:</span>
          <span>{customerPhone}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pickup / الاستلام:</span>
          <span>{startDate}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Return / الإرجاع:</span>
          <span>{endDate}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
        <thead>
          <tr style={{ borderBottom: '1px dashed #999' }}>
            <th style={{ textAlign: 'left', padding: '2px 0', fontWeight: 'bold' }}>Item</th>
            <th style={{ textAlign: 'center', padding: '2px 0', fontWeight: 'bold' }}>Days</th>
            <th style={{ textAlign: 'right', padding: '2px 0', fontWeight: 'bold' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px dashed #ddd' }}>
              <td style={{ padding: '3px 0', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 'bold' }}>{item.productName || item.name}</div>
                <div style={{ fontSize: '8px', color: '#555' }}>
                  {item.sku} {item.size ? `· ${item.size}` : ''}
                </div>
              </td>
              <td style={{ textAlign: 'center', padding: '3px 0', verticalAlign: 'top' }}>
                {item.rentalDays || 1}
              </td>
              <td style={{ textAlign: 'right', padding: '3px 0', fontWeight: 'bold', verticalAlign: 'top' }}>
                SAR {(item.rentalSubtotal || 0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      {/* Totals */}
      <div style={{ fontSize: '9px', marginBottom: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Subtotal / الإجمالي الفرعي:</span>
          <span>SAR {rentalSubtotal.toFixed(2)}</span>
        </div>
        {totalDeposit > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span>Security Deposit / التأمين:</span>
            <span>SAR {totalDeposit.toFixed(2)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>VAT 15% / ضريبة القيمة المضافة:</span>
          <span>SAR {totalTax.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            paddingTop: '4px',
            borderTop: '1px dashed #ccc',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          <span>Total / الإجمالي:</span>
          <span>SAR {grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px dashed #999', margin: '6px 0' }} />

      {/* ZATCA QR */}
      {qrData && (
        <div style={{ textAlign: 'center', marginTop: '8px' }}>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`}
            alt="ZATCA QR"
            style={{ width: '45mm', height: '45mm', imageRendering: 'pixelated' }}
          />
          <div style={{ fontSize: '7px', color: '#666', marginTop: '4px' }}>
            ZATCA Phase 2 Compliant QR Code
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '8px', color: '#555' }}>
        <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#000', marginBottom: '3px' }}>
          Thank you for choosing us!
        </div>
        <div>شكراً لاختياركم</div>
        <div style={{ marginTop: '4px' }}>Please keep this receipt for returns.</div>
        <div>يرجى الاحتفاظ بهذا الإيصال عند الإرجاع</div>
      </div>

      {/* Spacer for cutter */}
      <div style={{ height: '4mm' }} />
    </div>
  );
});

BoutiqueThermalReceipt.displayName = 'BoutiqueThermalReceipt';
export default BoutiqueThermalReceipt;
