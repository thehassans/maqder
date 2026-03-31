import { QRCodeSVG } from 'qrcode.react'
import { getInvoiceTemplateLabel } from '../../lib/invoiceTemplates'
import { generateZatcaQrValue } from '../../lib/zatcaQr'

const formatMoney = (value, currency = 'SAR', language = 'en') => {
  try {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(value || 0))
  } catch {
    return `${Number(value || 0).toFixed(2)} ${currency}`
  }
}

const formatDate = (value, language = 'en') => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTemplateClasses = (templateId) => {
  switch (Number(templateId)) {
    case 2:
      return {
        shell: 'bg-gradient-to-br from-white via-slate-50 to-primary-50/50 border-primary-100',
        header: 'border-b border-primary-100',
        badge: 'bg-primary-50 text-primary-700 border-primary-100',
        block: 'border border-slate-200/80 bg-white/90',
        tableHead: 'bg-primary-50/80 text-slate-700',
      }
    case 3:
      return {
        shell: 'bg-white border-slate-200',
        header: 'border-b border-slate-200',
        badge: 'bg-slate-900 text-white border-slate-900',
        block: 'border border-slate-200 bg-white',
        tableHead: 'bg-slate-100 text-slate-700',
        sidebar: 'before:absolute before:inset-y-0 before:start-0 before:w-3 before:rounded-s-3xl before:bg-slate-900',
      }
    case 4:
      return {
        shell: 'bg-white border-slate-200 shadow-none',
        header: 'border-b border-slate-100',
        badge: 'bg-white text-slate-700 border-slate-200',
        block: 'border border-slate-100 bg-slate-50/60',
        tableHead: 'bg-slate-50 text-slate-600',
      }
    case 5:
      return {
        shell: 'bg-slate-950 border-slate-800 text-white',
        header: 'border-b border-slate-800',
        badge: 'bg-white/10 text-white border-white/10',
        block: 'border border-slate-800 bg-slate-900',
        tableHead: 'bg-slate-900 text-slate-200',
      }
    case 6:
      return {
        shell: 'bg-white border-slate-300 shadow-md',
        header: 'border-b-2 border-slate-300',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        block: 'border-2 border-slate-300 bg-white',
        tableHead: 'bg-slate-200 text-slate-800',
      }
    default:
      return {
        shell: 'bg-white border-slate-200',
        header: 'border-b border-slate-200',
        badge: 'bg-slate-50 text-slate-700 border-slate-200',
        block: 'border border-slate-200 bg-white',
        tableHead: 'bg-slate-100 text-slate-700',
      }
  }
}

export default function InvoiceLivePreview({ invoice, tenant, language = 'en', templateId = 1 }) {
  const currency = invoice?.currency || tenant?.settings?.currency || 'SAR'
  const styles = getTemplateClasses(templateId)
  const sellerName = language === 'ar' ? (invoice?.seller?.nameAr || invoice?.seller?.name || tenant?.business?.legalNameAr || tenant?.business?.legalNameEn) : (invoice?.seller?.name || invoice?.seller?.nameAr || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr)
  const buyerName = language === 'ar' ? (invoice?.buyer?.nameAr || invoice?.buyer?.name || 'Cash Customer') : (invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Cash Customer')
  const qrValue = invoice?.zatca?.qrCodeData || generateZatcaQrValue({
    sellerName,
    vatNumber: invoice?.seller?.vatNumber || tenant?.business?.vatNumber,
    timestamp: invoice?.issueDate || new Date().toISOString(),
    totalWithVat: invoice?.grandTotal || 0,
    vatTotal: invoice?.totalTax || 0,
  })
  const travelDetails = invoice?.travelDetails || {}
  const lineItems = Array.isArray(invoice?.lineItems) && invoice.lineItems.length > 0 ? invoice.lineItems : [{ productName: language === 'ar' ? 'خدمة' : 'Service', quantity: 1, unitPrice: 0, taxRate: 15, lineTotalWithTax: 0 }]
  const isDark = Number(templateId) === 5
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-500'
  const titleText = isDark ? 'text-white' : 'text-slate-900'

  return (
    <div className={`relative overflow-hidden rounded-3xl border shadow-sm ${styles.shell} ${styles.sidebar || ''}`}>
      <div className={`flex flex-col gap-6 p-6 ${styles.header}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-white/5' : 'border-slate-200 bg-white'}`}>
              {tenant?.branding?.logo ? (
                <img src={tenant.branding.logo} alt="" className="h-full w-full object-contain" />
              ) : (
                <img src="/maqder-logo.png" alt="Maqder" className="h-full w-full object-contain" />
              )}
            </div>
            <div>
              <p className={`text-xs uppercase tracking-[0.25em] ${mutedText}`}>{getInvoiceTemplateLabel(templateId, language)}</p>
              <h3 className={`mt-1 text-2xl font-semibold ${titleText}`}>{language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}</h3>
              <p className={`mt-1 text-sm ${mutedText}`}>{invoice?.invoiceSubtype === 'travel_ticket' ? (language === 'ar' ? 'فاتورة سفر / تذاكر' : 'Travel / Ticket Invoice') : (language === 'ar' ? 'معاينة مباشرة قبل الحفظ' : 'Live preview before saving')}</p>
            </div>
          </div>
          <div className="text-end">
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles.badge}`}>
              {invoice?.transactionType || 'B2C'}
            </div>
            <p className={`mt-3 text-sm font-medium ${titleText}`}>{invoice?.invoiceNumber || 'DRAFT-PREVIEW'}</p>
            <p className={`text-xs ${mutedText}`}>{formatDate(invoice?.issueDate || new Date(), language)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className={`rounded-2xl p-4 ${styles.block}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedText}`}>{language === 'ar' ? 'البائع' : 'Seller'}</p>
              <p className={`mt-2 text-sm font-semibold ${titleText}`}>{sellerName || '—'}</p>
              <p className={`mt-1 text-sm ${mutedText}`}>{invoice?.seller?.vatNumber || tenant?.business?.vatNumber || '—'}</p>
              <p className={`text-sm ${mutedText}`}>{invoice?.seller?.address?.city || tenant?.business?.address?.city || '—'}</p>
            </div>
            <div className={`rounded-2xl p-4 ${styles.block}`}>
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedText}`}>{language === 'ar' ? 'المشتري' : 'Buyer'}</p>
              <p className={`mt-2 text-sm font-semibold ${titleText}`}>{buyerName}</p>
              <p className={`mt-1 text-sm ${mutedText}`}>{invoice?.buyer?.contactPhone || invoice?.buyer?.vatNumber || '—'}</p>
              <p className={`text-sm ${mutedText}`}>{invoice?.buyer?.address?.city || '—'}</p>
            </div>
          </div>
          <div className={`flex w-full flex-col items-center justify-center rounded-2xl p-4 lg:w-[160px] ${styles.block}`}>
            <QRCodeSVG value={qrValue} size={108} bgColor="transparent" fgColor={isDark ? '#F8FAFC' : '#0F172A'} />
            <p className={`mt-3 text-center text-[11px] ${mutedText}`}>{language === 'ar' ? 'رمز QR متوافق مع ZATCA' : 'ZATCA-ready QR code'}</p>
          </div>
        </div>
      </div>

      {invoice?.invoiceSubtype === 'travel_ticket' && (
        <div className="px-6 pt-6">
          <div className={`grid grid-cols-1 gap-4 rounded-2xl p-4 md:grid-cols-3 ${styles.block}`}>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'اسم المسافر' : 'Passenger Name'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.travelerName || buyerName}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'رقم الجواز' : 'Passport Number'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.passportNumber || '—'}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'رقم التذكرة / PNR' : 'Ticket / PNR'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.ticketNumber || travelDetails?.pnr || '—'}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'المسار' : 'Route'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.routeFrom || '—'} {travelDetails?.routeTo ? `→ ${travelDetails.routeTo}` : ''}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'شركة الطيران / المورد' : 'Airline / Vendor'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.airlineName || invoice?.seller?.name || '—'}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'تاريخ الرحلة' : 'Travel Date'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{formatDate(travelDetails?.departureDate, language)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className={styles.tableHead}>
              <tr>
                <th className="px-4 py-3 text-start font-medium">#</th>
                <th className="px-4 py-3 text-start font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th className="px-4 py-3 text-center font-medium">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'السعر' : 'Price'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className={isDark ? 'divide-y divide-slate-800 text-slate-200' : 'divide-y divide-slate-200 text-slate-700'}>
              {lineItems.map((line, index) => {
                const quantity = Number(line?.quantity || 0)
                const unitPrice = Number(line?.unitPrice || 0)
                const subtotal = quantity * unitPrice
                const tax = subtotal * (Number(line?.taxRate || 0) / 100)
                const total = Number(line?.lineTotalWithTax || subtotal + tax)
                return (
                  <tr key={`${line?.productName || 'line'}-${index}`}>
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{language === 'ar' ? (line?.productNameAr || line?.productName || '—') : (line?.productName || line?.productNameAr || '—')}</div>
                      {line?.description && <div className={`mt-1 text-xs ${mutedText}`}>{line.description}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">{quantity || '—'}</td>
                    <td className="px-4 py-3 text-end">{formatMoney(unitPrice, currency, language)}</td>
                    <td className="px-4 py-3 text-end font-semibold">{formatMoney(total, currency, language)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
          <div className={`rounded-2xl p-4 ${styles.block}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedText}`}>{language === 'ar' ? 'ملاحظات' : 'Remarks'}</p>
            <p className={`mt-2 text-sm ${titleText}`}>{invoice?.notes || (language === 'ar' ? 'أضف ملاحظات الفاتورة هنا' : 'Add invoice remarks here')}</p>
          </div>
          <div className={`rounded-2xl p-4 ${styles.block}`}>
            <div className={`flex items-center justify-between text-sm ${mutedText}`}>
              <span>{language === 'ar' ? 'الإجمالي الفرعي' : 'Subtotal'}</span>
              <span>{formatMoney(invoice?.subtotal || 0, currency, language)}</span>
            </div>
            <div className={`mt-2 flex items-center justify-between text-sm ${mutedText}`}>
              <span>{language === 'ar' ? 'الضريبة' : 'VAT'}</span>
              <span>{formatMoney(invoice?.totalTax || 0, currency, language)}</span>
            </div>
            <div className={`mt-4 flex items-center justify-between border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-200'} ${titleText}`}>
              <span className="text-sm font-semibold">{language === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</span>
              <span className="text-lg font-semibold">{formatMoney(invoice?.grandTotal || 0, currency, language)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
