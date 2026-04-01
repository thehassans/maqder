import { QRCodeSVG } from 'qrcode.react'
import { generateZatcaQrValue } from '../../lib/zatcaQr'
import { calculateInvoiceSummary, normalizeTravelDetails, toNumber } from '../../lib/invoiceDocument'
import { getInvoiceBranding, splitBrandingText } from '../../lib/invoiceBranding'

const formatAddress = (address = {}) => {
  return [address?.street, address?.district, address?.city, address?.postalCode, address?.country]
    .filter(Boolean)
    .join(', ')
}

const getPartyDetailLines = (party = {}, language = 'en') => {
  const lines = []

  if (party?.vatNumber) {
    lines.push(`${language === 'ar' ? 'الرقم الضريبي' : 'VAT'}: ${party.vatNumber}`)
  }

  if (party?.crNumber) {
    lines.push(`${language === 'ar' ? 'السجل التجاري' : 'CR'}: ${party.crNumber}`)
  }

  if (party?.contactPhone) {
    lines.push(`${language === 'ar' ? 'الهاتف' : 'Phone'}: ${party.contactPhone}`)
  }

  if (party?.contactEmail) {
    lines.push(`${language === 'ar' ? 'البريد الإلكتروني' : 'Email'}: ${party.contactEmail}`)
  }

  const addressText = formatAddress(party?.address)
  if (addressText) {
    lines.push(`${language === 'ar' ? 'العنوان' : 'Address'}: ${addressText}`)
  }

  return lines.length > 0 ? lines : ['—']
}

const formatMoney = (value, currency = 'SAR', language = 'en') => {
  try {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(toNumber(value))
  } catch {
    return `${toNumber(value).toFixed(2)} ${currency}`
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
    case 5:
      return {
        shell: 'bg-white border-slate-300 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)]',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        block: 'border border-slate-300 bg-white',
        tableHead: 'bg-slate-900 text-white',
      }
    case 6:
      return {
        shell: 'bg-white border-slate-300 shadow-[0_24px_70px_-36px_rgba(15,23,42,0.4)]',
        badge: 'bg-slate-100 text-slate-800 border-slate-300',
        block: 'border-2 border-slate-300 bg-white',
        tableHead: 'bg-slate-900 text-white',
      }
    default:
      return {
        shell: 'bg-white border-slate-200 shadow-[0_24px_70px_-38px_rgba(15,23,42,0.32)]',
        badge: 'bg-slate-50 text-slate-700 border-slate-200',
        block: 'border border-slate-200 bg-white',
        tableHead: 'bg-slate-900 text-white',
      }
  }
}

const getInvoiceEyebrow = (invoice, language = 'en') => {
  if (invoice?.invoiceSubtype === 'travel_ticket' || invoice?.businessContext === 'travel_agency') {
    return language === 'ar' ? 'فاتورة وكالة سفر' : 'Travel Agency Invoice'
  }

  if (invoice?.businessContext === 'construction') {
    return language === 'ar' ? 'فاتورة مقاولات' : 'Construction Invoice'
  }

  if (invoice?.businessContext === 'restaurant') {
    return language === 'ar' ? 'فاتورة مطعم' : 'Restaurant Invoice'
  }

  return language === 'ar' ? 'فاتورة تجارة' : 'Trading Invoice'
}

export default function InvoiceLivePreview({ invoice, tenant, language = 'en', templateId = 1 }) {
  const currency = invoice?.currency || tenant?.settings?.currency || 'SAR'
  const invoiceBranding = getInvoiceBranding(tenant, language, invoice?.businessContext)
  const styles = getTemplateClasses(Number(templateId || invoiceBranding.templateId || 1))
  const sellerName = language === 'ar' ? (invoice?.seller?.nameAr || invoice?.seller?.name || tenant?.business?.legalNameAr || tenant?.business?.legalNameEn) : (invoice?.seller?.name || invoice?.seller?.nameAr || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr)
  const buyerName = language === 'ar' ? (invoice?.buyer?.nameAr || invoice?.buyer?.name || 'Cash Customer') : (invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Cash Customer')
  const customerLabel = invoice?.flow === 'purchase' ? (language === 'ar' ? 'المشتري' : 'Buyer') : (language === 'ar' ? 'العميل' : 'Customer')
  const logoSrc = invoiceBranding.logoSrc
  const qrValue = invoice?.zatca?.qrCodeData || generateZatcaQrValue({
    sellerName,
    vatNumber: invoice?.seller?.vatNumber || tenant?.business?.vatNumber,
    timestamp: invoice?.issueDate || new Date().toISOString(),
    totalWithVat: toNumber(invoice?.grandTotal),
    vatTotal: toNumber(invoice?.totalTax),
  })
  const totals = calculateInvoiceSummary(invoice)
  const travelDetails = normalizeTravelDetails(invoice?.travelDetails || {}, buyerName, language)
  const lineItems = totals.lines.length > 0 ? totals.lines : [{ raw: { productName: language === 'ar' ? 'خدمة' : 'Service' }, quantity: 1, unitPrice: 0, taxAmount: 0, lineTotalWithTax: 0 }]
  const sellerDetails = getPartyDetailLines(invoice?.seller || tenant?.business || {}, language)
  const buyerDetails = getPartyDetailLines(invoice?.buyer || {}, language)
  const companyName = invoiceBranding.companyName || sellerName || '—'
  const headerLines = splitBrandingText(invoiceBranding.headerText)
  const footerLines = splitBrandingText(invoiceBranding.footerText)
  const accentBarStyle = {
    background: invoiceBranding.primaryColor,
  }
  const metaCardStyle = {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  }
  const mutedText = 'text-slate-500'
  const titleText = 'text-slate-900'

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border shadow-[0_30px_80px_-40px_rgba(15,23,42,0.30)] ${styles.shell}`}>
      <div className="absolute inset-x-0 top-0 h-1.5" style={accentBarStyle} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {logoSrc ? <img src={logoSrc} alt="" className="h-52 w-52 object-contain opacity-[0.05]" /> : null}
      </div>
      <div className="relative px-6 pb-6 pt-7">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-24 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-2">
                <img src={logoSrc} alt="" className="h-full w-full object-contain scale-110" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-[11px] uppercase tracking-[0.24em] ${mutedText}`}>{getInvoiceEyebrow(invoice, language)}</p>
                <h3 className={`mt-2 text-2xl font-semibold ${titleText}`}>{companyName || '—'}</h3>
                {headerLines.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {headerLines.map((line, index) => (
                      <p key={`${line}-${index}`} className={`text-sm leading-6 ${mutedText}`}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex min-w-[148px] flex-col items-end gap-3 self-start text-end">
              {invoiceBranding.showVision2030 && invoiceBranding.vision2030LogoSrc ? (
                <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <img src={invoiceBranding.vision2030LogoSrc} alt="" className="h-full w-full object-contain" />
                </div>
              ) : null}
              <div className="space-y-1 text-sm text-slate-600 text-end">
                {(invoice?.seller?.vatNumber || invoiceBranding.vatNumber) && (
                  <p><span className="font-medium text-slate-900">{language === 'ar' ? 'الرقم الضريبي' : 'VAT'}:</span> {invoice?.seller?.vatNumber || invoiceBranding.vatNumber}</p>
                )}
                {(invoice?.seller?.crNumber || invoiceBranding.crNumber) && (
                  <p><span className="font-medium text-slate-900">{language === 'ar' ? 'السجل التجاري' : 'CR'}:</span> {invoice?.seller?.crNumber || invoiceBranding.crNumber}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-[minmax(0,1fr)_188px]">
          <div className="space-y-4">
            <div className="text-center lg:text-start">
              <p className={`text-[11px] uppercase tracking-[0.26em] ${mutedText}`}>{getInvoiceEyebrow(invoice, language)}</p>
              <h2 className={`mt-2 text-3xl font-semibold ${titleText}`}>{language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'}</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`rounded-[1.5rem] p-5 ${styles.block}`} style={metaCardStyle}>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedText}`}>{language === 'ar' ? 'البائع' : 'Seller'}</p>
                <p className={`mt-3 text-base font-semibold ${titleText}`}>{sellerName || '—'}</p>
                <div className="mt-3 space-y-1.5">
                  {sellerDetails.map((detail, index) => (
                    <p key={index} className={`text-sm leading-6 ${mutedText}`}>{detail}</p>
                  ))}
                </div>
              </div>
              <div className={`rounded-[1.5rem] p-5 ${styles.block}`} style={metaCardStyle}>
                <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${mutedText}`}>{customerLabel}</p>
                <p className={`mt-3 text-base font-semibold ${titleText}`}>{buyerName || '—'}</p>
                <div className="mt-3 space-y-1.5">
                  {buyerDetails.map((detail, index) => (
                    <p key={index} className={`text-sm leading-6 ${mutedText}`}>{detail}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`flex flex-col items-center justify-center rounded-[1.75rem] p-5 ${styles.block}`}>
            <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles.badge}`}>
              {invoice?.transactionType || 'B2C'}
            </div>
            <p className={`mt-4 text-center text-base font-semibold ${titleText}`}>{invoice?.invoiceNumber || 'DRAFT-PREVIEW'}</p>
            <p className={`mt-1 text-center text-xs ${mutedText}`}>{formatDate(invoice?.issueDate || new Date(), language)}</p>
            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3">
              <QRCodeSVG value={qrValue} size={104} bgColor="transparent" fgColor="#0F172A" />
            </div>
            <p className={`mt-3 text-[11px] font-medium ${mutedText}`}>{language === 'ar' ? 'رمز QR' : 'QR Code'}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 md:grid-cols-3">
          <div>
            <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'رقم الفاتورة' : 'Invoice #'}</p>
            <p className={`mt-1 text-sm font-semibold ${titleText}`}>{invoice?.invoiceNumber || 'DRAFT-PREVIEW'}</p>
          </div>
          <div>
            <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'التاريخ' : 'Date'}</p>
            <p className={`mt-1 text-sm font-semibold ${titleText}`}>{formatDate(invoice?.issueDate || new Date(), language)}</p>
          </div>
          <div>
            <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'التدفق' : 'Flow'}</p>
            <p className={`mt-1 text-sm font-semibold ${titleText}`}>{invoice?.flow || 'sell'}</p>
          </div>
        </div>
      </div>

      {invoice?.invoiceSubtype === 'travel_ticket' && (
        <div className="px-6 pt-6">
          <div className={`grid grid-cols-1 gap-4 rounded-2xl p-4 md:grid-cols-3 ${styles.block}`}>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'اسم العميل / الراكب' : 'Customer / Traveler Name'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.travelerDisplayName || '—'}</p>
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
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.routeText || '—'}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'شركة الطيران / المورد' : 'Airline / Vendor'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.airlineDisplayName || invoice?.seller?.name || '—'}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'تاريخ الرحلة' : 'Travel Date'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{formatDate(travelDetails?.departureDate, language)}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'تاريخ العودة' : 'Return Date'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.hasReturnDate ? formatDate(travelDetails?.returnDate, language) : '—'}</p>
            </div>
            <div>
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'التوقف / الإقامة' : 'Layover / Stay'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.layoverStayDisplay || '—'}</p>
            </div>
            <div className="md:col-span-3">
              <p className={`text-xs ${mutedText}`}>{language === 'ar' ? 'مسافرون إضافيون' : 'Additional Passengers'}</p>
              <p className={`mt-1 text-sm font-semibold ${titleText}`}>{travelDetails?.additionalPassengersText || '—'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className={styles.tableHead}>
              <tr>
                <th className="px-4 py-3 text-start font-medium">#</th>
                <th className="px-4 py-3 text-start font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th className="px-4 py-3 text-center font-medium">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'السعر' : 'Price'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'الضريبة' : 'Tax'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {lineItems.map((line, index) => {
                const quantity = toNumber(line?.quantity)
                const unitPrice = toNumber(line?.unitPrice)
                const tax = toNumber(line?.taxAmount)
                const total = toNumber(line?.lineTotalWithTax)
                return (
                  <tr key={`${line?.raw?.productName || line?.productName || 'line'}-${index}`}>
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{language === 'ar' ? (line?.raw?.productNameAr || line?.raw?.productName || line?.productNameAr || line?.productName || '—') : (line?.raw?.productName || line?.raw?.productNameAr || line?.productName || line?.productNameAr || '—')}</div>
                      {(line?.raw?.description || line?.raw?.descriptionAr || line?.description || line?.descriptionAr) && <div className={`mt-1 text-xs ${mutedText}`}>{language === 'ar' ? (line?.raw?.descriptionAr || line?.raw?.description || line?.descriptionAr || line?.description) : (line?.raw?.description || line?.raw?.descriptionAr || line?.description || line?.descriptionAr)}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">{quantity || '—'}</td>
                    <td className="px-4 py-3 text-end">{formatMoney(unitPrice, currency, language)}</td>
                    <td className="px-4 py-3 text-end">{formatMoney(tax, currency, language)}</td>
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
            {invoice?.notes ? <p className={`mt-3 text-sm ${titleText}`}>{invoice.notes}</p> : <div className="min-h-12" />}
          </div>
          <div className={`rounded-2xl p-4 ${styles.block}`}>
            <div className={`flex items-center justify-between text-sm ${mutedText}`}>
              <span>{language === 'ar' ? 'الإجمالي الفرعي' : 'Subtotal'}</span>
              <span>{formatMoney(totals.subtotal, currency, language)}</span>
            </div>
            <div className={`mt-2 flex items-center justify-between text-sm ${mutedText}`}>
              <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
              <span>{formatMoney(totals.totalDiscount, currency, language)}</span>
            </div>
            <div className={`mt-2 flex items-center justify-between text-sm ${mutedText}`}>
              <span>{language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount'}</span>
              <span>{formatMoney(totals.taxableAmount, currency, language)}</span>
            </div>
            <div className={`mt-2 flex items-center justify-between text-sm ${mutedText}`}>
              <span>{language === 'ar' ? 'الضريبة' : 'VAT'}</span>
              <span>{formatMoney(totals.totalTax, currency, language)}</span>
            </div>
            <div className={`mt-4 flex items-center justify-between border-t border-slate-200 pt-4 ${titleText}`}>
              <span className="text-sm font-semibold">{language === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</span>
              <span className="text-lg font-semibold">{formatMoney(totals.grandTotal, currency, language)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4 text-center">
          {footerLines.length > 0 ? (
            <div className="space-y-1">
              {footerLines.map((line, index) => (
                <p key={`${line}-${index}`} className={`text-sm leading-6 ${mutedText}`}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
