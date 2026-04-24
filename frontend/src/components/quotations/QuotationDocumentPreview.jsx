import { getInvoiceBranding } from '../../lib/invoiceBranding'
import { formatCurrency } from '../../lib/currency'

const formatDate = (value, language = 'en') => {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

const joinAddress = (address = {}) => {
  return [
    address?.buildingNumber,
    address?.additionalNumber,
    address?.street,
    address?.district,
    address?.city,
    address?.postalCode,
    address?.country,
  ].filter(Boolean)
}

const pickLocalizedText = (primary, secondary) => primary || secondary || '—'

const getStatusLabel = (status, language = 'en') => {
  const value = String(status || 'draft').trim().toLowerCase()
  const map = {
    draft: language === 'ar' ? 'مسودة' : 'Draft',
    sent: language === 'ar' ? 'مرسل' : 'Sent',
    accepted: language === 'ar' ? 'مقبول' : 'Accepted',
    rejected: language === 'ar' ? 'مرفوض' : 'Rejected',
    expired: language === 'ar' ? 'منتهي' : 'Expired',
    cancelled: language === 'ar' ? 'ملغي' : 'Cancelled',
    converted: language === 'ar' ? 'تم التحويل' : 'Converted',
  }
  return map[value] || status || '—'
}

const getStatusTone = (status) => {
  const value = String(status || 'draft').trim().toLowerCase()
  if (value === 'accepted') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (value === 'converted') return 'bg-violet-50 text-violet-700 border-violet-200'
  if (value === 'sent') return 'bg-sky-50 text-sky-700 border-sky-200'
  if (value === 'rejected' || value === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-200'
  if (value === 'expired') return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

export default function QuotationDocumentPreview({ quotation, tenant, language = 'en' }) {
  const branding = getInvoiceBranding(tenant, language, quotation?.businessContext || 'trading')
  const logoSrc = branding?.logoSrc || tenant?.business?.logoUrl || tenant?.branding?.logo || '/maqder-logo.png'
  const companyName = language === 'ar'
    ? pickLocalizedText(tenant?.business?.legalNameAr, tenant?.business?.legalNameEn)
    : pickLocalizedText(tenant?.business?.legalNameEn, tenant?.business?.legalNameAr)
  const companySecondary = language === 'ar'
    ? pickLocalizedText(tenant?.business?.legalNameEn, tenant?.business?.legalNameAr)
    : pickLocalizedText(tenant?.business?.legalNameAr, tenant?.business?.legalNameEn)
  const buyerName = language === 'ar'
    ? pickLocalizedText(quotation?.buyer?.nameAr, quotation?.buyer?.name)
    : pickLocalizedText(quotation?.buyer?.name, quotation?.buyer?.nameAr)
  const buyerAddress = joinAddress(quotation?.buyer?.address || {})
  const currency = quotation?.currency || 'SAR'
  const lineItems = Array.isArray(quotation?.lineItems) ? quotation.lineItems : []
  const totals = {
    subtotal: Number(quotation?.subtotal || 0),
    totalDiscount: Number(quotation?.totalDiscount || quotation?.invoiceDiscount || 0),
    totalTax: Number(quotation?.totalTax || 0),
    grandTotal: Number(quotation?.grandTotal || 0),
  }
  const itemCount = lineItems.length

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_90px_-48px_rgba(15,23,42,0.28)]">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-950" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {logoSrc ? <img src={logoSrc} alt="" className="h-56 w-56 object-contain opacity-[0.04]" /> : null}
      </div>

      <div className="relative px-7 pb-7 pt-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
          <div className="min-w-0">
            <div className="flex items-start gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
                {logoSrc ? (
                  <img src={logoSrc} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-sm font-semibold tracking-[0.3em] text-slate-500">{companyName.slice(0, 2)}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">{language === 'ar' ? 'عرض سعر احترافي' : 'Minimal Commercial Offer'}</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{language === 'ar' ? 'عرض سعر' : 'Quotation'}</h2>
                <p className="mt-3 text-base font-semibold text-slate-900">{companyName}</p>
                <p className="mt-1 text-sm text-slate-500">{companySecondary}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{language === 'ar' ? 'الحالة' : 'Status'}</p>
              <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusTone(quotation?.status)}`}>
                {getStatusLabel(quotation?.status, language)}
              </span>
            </div>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'ar' ? 'رقم العرض' : 'Quotation #'}</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{quotation?.quotationNumber || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</p>
                  <p className="mt-1 font-medium text-slate-900">{formatDate(quotation?.issueDate, language)}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">{language === 'ar' ? 'صالح حتى' : 'Valid Until'}</p>
                  <p className="mt-1 font-medium text-slate-900">{formatDate(quotation?.validUntil, language)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'من' : 'Prepared By'}</p>
            <p className="mt-3 text-lg font-semibold text-slate-950">{companyName}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p>{language === 'ar' ? 'الرقم الضريبي' : 'VAT'}: <span className="font-medium text-slate-900">{tenant?.business?.vatNumber || '—'}</span></p>
              <p>{language === 'ar' ? 'السجل التجاري' : 'CR'}: <span className="font-medium text-slate-900">{tenant?.business?.crNumber || '—'}</span></p>
              <p>{language === 'ar' ? 'البريد' : 'Email'}: <span className="font-medium text-slate-900">{tenant?.business?.contactEmail || '—'}</span></p>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-950 p-5 text-white">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-300">{language === 'ar' ? 'إلى' : 'Prepared For'}</p>
            <p className="mt-3 text-lg font-semibold">{buyerName}</p>
            <div className="mt-3 space-y-2 text-sm text-slate-200">
              <p>{language === 'ar' ? 'الرقم الضريبي' : 'VAT'}: <span className="font-medium text-white">{quotation?.buyer?.vatNumber || '—'}</span></p>
              <p>{language === 'ar' ? 'الهاتف' : 'Phone'}: <span className="font-medium text-white">{quotation?.buyer?.contactPhone || '—'}</span></p>
              <p>{language === 'ar' ? 'البريد' : 'Email'}: <span className="font-medium text-white">{quotation?.buyer?.contactEmail || '—'}</span></p>
            </div>
            <div className="mt-4 rounded-[1.25rem] border border-white/15 bg-white/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-300">{language === 'ar' ? 'العنوان' : 'Address'}</p>
              <div className="mt-2 space-y-1 text-sm text-white">
                {buyerAddress.length > 0 ? buyerAddress.map((line, index) => <p key={`${line}-${index}`}>{line}</p>) : <p>—</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 overflow-hidden rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 text-start font-medium">#</th>
                <th className="px-4 py-3 text-start font-medium">{language === 'ar' ? 'البند' : 'Item'}</th>
                <th className="px-4 py-3 text-start font-medium">{language === 'ar' ? 'الوصف' : 'Description'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'الكمية' : 'Qty'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'السعر' : 'Price'}</th>
                <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
              {lineItems.length > 0 ? lineItems.map((line, index) => {
                const itemName = language === 'ar'
                  ? pickLocalizedText(line?.productNameAr, line?.productName)
                  : pickLocalizedText(line?.productName, line?.productNameAr)
                const description = language === 'ar'
                  ? pickLocalizedText(line?.descriptionAr, line?.description)
                  : pickLocalizedText(line?.description, line?.descriptionAr)
                return (
                  <tr key={`${line?._id || index}`}>
                    <td className="px-4 py-4">{index + 1}</td>
                    <td className="px-4 py-4 font-medium text-slate-950">{itemName}</td>
                    <td className="px-4 py-4">{description}</td>
                    <td className="px-4 py-4 text-end">{Number(line?.quantity || 0)}</td>
                    <td className="px-4 py-4 text-end">{formatCurrency(line?.unitPrice || 0, { language, currency })}</td>
                    <td className="px-4 py-4 text-end font-semibold text-slate-950">{formatCurrency(line?.lineTotalWithTax || line?.lineTotal || 0, { language, currency })}</td>
                  </tr>
                )
              }) : (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-500" colSpan="6">{language === 'ar' ? 'لا توجد بنود' : 'No quotation items'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{language === 'ar' ? 'ملاحظات العرض' : 'Quotation Notes'}</p>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{quotation?.notes || '—'}</p>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>{language === 'ar' ? 'عدد البنود' : 'Items'}</span>
              <span className="font-semibold text-slate-950">{itemCount}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>{language === 'ar' ? 'الإجمالي الفرعي' : 'Subtotal'}</span>
              <span className="font-semibold text-slate-950">{formatCurrency(totals.subtotal, { language, currency })}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>{language === 'ar' ? 'الخصم' : 'Discount'}</span>
              <span className="font-semibold text-slate-950">{formatCurrency(totals.totalDiscount, { language, currency })}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>{language === 'ar' ? 'الضريبة' : 'Tax'}</span>
              <span className="font-semibold text-slate-950">{formatCurrency(totals.totalTax, { language, currency })}</span>
            </div>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">{language === 'ar' ? 'الإجمالي النهائي' : 'Grand Total'}</span>
                <span className="text-xl font-semibold tracking-tight text-slate-950">{formatCurrency(totals.grandTotal, { language, currency })}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
