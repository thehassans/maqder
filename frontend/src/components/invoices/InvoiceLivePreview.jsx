import { QRCodeSVG } from 'qrcode.react'
import { generateZatcaQrValue } from '../../lib/zatcaQr'
import { calculateInvoiceSummary, normalizeTravelDetails, toNumber } from '../../lib/invoiceDocument'
import { getInvoiceBranding, getInvoiceCssFontFamily, splitBrandingText } from '../../lib/invoiceBranding'
import { getZatcaStatusMeta } from '../../lib/zatcaStatus'
import { getAmountInWords } from '../../lib/amountInWords'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import SarIcon from '../ui/SarIcon'

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

const renderSarMoney = ({ formatted, className = '', iconClassName = '' }) => (
  <span dir="ltr" className={joinClasses('inline-flex items-end whitespace-nowrap tabular-nums leading-none', className)}>
    <SarIcon className={joinClasses('me-[0.18em] h-[0.82em] w-[0.72em] shrink-0 self-end', iconClassName)} title="Saudi Riyal" />
    <span className="inline-block leading-none">{formatted}</span>
  </span>
)

const renderSarMoneySnapshotIcon = ({ formatted, className = '' }) => (
  <span dir="ltr" className={joinClasses('inline-flex items-end whitespace-nowrap tabular-nums leading-none', className)}>
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'flex-end',
        width: '0.72em',
        height: '0.82em',
        marginInlineEnd: '0.18em',
        flexShrink: 0,
        overflow: 'visible',
        lineHeight: '1',
      }}
    >
      <SarIcon
        title="Saudi Riyal"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      />
    </span>
    <span className="inline-block leading-none">{formatted}</span>
  </span>
)

const hasArabicText = (value = '') => /[\u0600-\u06FF]/.test(String(value || ''))

const uniqueLines = (...values) => {
  const seen = new Set()
  const result = []

  for (const value of values) {
    const lines = String(value || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    for (const line of lines) {
      const key = line.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      result.push(line)
    }
  }

  return result
}

const toBilingualText = (englishValue, arabicValue, fallback = '—') => {
  const lines = uniqueLines(englishValue, arabicValue)
  return lines.length > 0 ? lines.join('\n') : fallback
}

const getUntranslatedRouteText = (travelDetails = {}) => {
  const segments = Array.isArray(travelDetails?.segments) ? travelDetails.segments : []
  if (segments.length > 0) {
    return segments
      .map((segment) => {
        const from = String(segment?.from || segment?.fromAr || '').trim()
        const to = String(segment?.to || segment?.toAr || '').trim()
        if (from && to) return `${from} - ${to}`
        return from || to || '—'
      })
      .join(' | ')
  }

  const routeFrom = String(travelDetails?.routeFrom || travelDetails?.routeFromAr || '').trim()
  const routeTo = String(travelDetails?.routeTo || travelDetails?.routeToAr || '').trim()
  if (routeFrom && routeTo) return `${routeFrom} - ${routeTo}`
  return routeFrom || routeTo || '—'
}

const getRawDisplayValue = (value, fallback = '—') => {
  if (value === null || value === undefined) return fallback
  const text = String(value).trim()
  return text || fallback
}

const formatAddress = (address = {}) => {
  return [address?.street, address?.district, address?.city, address?.postalCode, address?.country]
    .filter(Boolean)
    .join(', ')
}

const getPartyDetailLines = (party = {}, language = 'en', role = 'party') => {
  const lines = []
  const vatLabel = role === 'seller'
    ? (language === 'ar' ? 'الرقم الضريبي للشركة' : 'Company VAT')
    : (language === 'ar' ? 'الرقم الضريبي' : 'VAT')

  if (party?.vatNumber) {
    lines.push({ label: vatLabel, value: party.vatNumber })
  }

  if (party?.crNumber) {
    lines.push({ label: language === 'ar' ? 'السجل التجاري' : 'CR', value: party.crNumber })
  }

  if (party?.contactPhone) {
    lines.push({ label: language === 'ar' ? 'الهاتف' : 'Phone', value: party.contactPhone })
  }

  if (party?.contactEmail) {
    lines.push({ label: language === 'ar' ? 'البريد الإلكتروني' : 'Email', value: party.contactEmail })
  }

  const addressText = formatAddress(party?.address)
  if (addressText) {
    lines.push({ label: language === 'ar' ? 'العنوان' : 'Address', value: addressText })
  }

  return lines.length > 0 ? lines : [{ label: '', value: '—' }]
}

const getPartyDetailLinesBilingual = (party = {}, role = 'party') => {
  const lines = []

  if (role !== 'seller' && party?.contactPhone) {
    lines.push({ label: toBilingualText('Phone', 'الهاتف'), value: party.contactPhone })
  }

  if (party?.contactEmail) {
    lines.push({ label: 'Email', value: party.contactEmail, dir: 'ltr' })
  }

  const addressText = formatAddress(party?.address)
  if (addressText) {
    lines.push({ label: toBilingualText('Address', 'العنوان'), value: addressText })
  }

  return lines.length > 0 ? lines : [{ label: '', value: '—' }]
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
    return language === 'ar' ? 'فاتورة خدمات السفر' : 'Travel Services Invoice'
  }

  if (invoice?.businessContext === 'construction') {
    return language === 'ar' ? 'فاتورة مقاولات' : 'Construction Invoice'
  }

  if (invoice?.businessContext === 'restaurant') {
    return language === 'ar' ? 'فاتورة مطعم' : 'Restaurant Invoice'
  }

  return language === 'ar' ? 'فاتورة تجارة' : 'Trading Invoice'
}

const getInvoiceTitle = (invoice, language = 'en') => {
  if (invoice?.invoiceSubtype === 'travel_ticket' || invoice?.businessContext === 'travel_agency') {
    return language === 'ar' ? 'فاتورة ضريبية لخدمات السفر' : 'Travel Services Tax Invoice'
  }

  if (invoice?.businessContext === 'construction') {
    return language === 'ar' ? 'فاتورة ضريبية للمقاولات' : 'Construction Tax Invoice'
  }

  if (invoice?.businessContext === 'trading') {
    return language === 'ar' ? 'فاتورة ضريبية للتجارة' : 'Trading Tax Invoice'
  }

  return language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'
}

export default function InvoiceLivePreview({ invoice, tenant, language = 'en', templateId = 1, bilingual = false, currencyRenderMode = 'symbol' }) {
  const currency = invoice?.currency || tenant?.settings?.currency || 'SAR'
  const invoiceBranding = getInvoiceBranding(tenant, language, invoice?.businessContext)
  const styles = getTemplateClasses(Number(templateId || invoiceBranding.templateId || 1))
  const sellerNameEn = invoice?.seller?.name || invoice?.seller?.nameAr || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || ''
  const sellerNameAr = invoice?.seller?.nameAr || (hasArabicText(invoice?.seller?.name) ? invoice?.seller?.name : '') || tenant?.business?.legalNameAr || ''
  const buyerNameEn = invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Cash Customer'
  const buyerNameAr = invoice?.buyer?.nameAr || (hasArabicText(invoice?.buyer?.name) ? invoice?.buyer?.name : '')
  const sellerName = bilingual ? toBilingualText(sellerNameEn, sellerNameAr) : (language === 'ar' ? (sellerNameAr || sellerNameEn) : (sellerNameEn || sellerNameAr))
  const buyerName = bilingual ? toBilingualText(buyerNameEn, buyerNameAr) : (language === 'ar' ? (buyerNameAr || buyerNameEn) : (buyerNameEn || buyerNameAr))
  const customerLabel = bilingual
    ? (invoice?.flow === 'purchase' ? toBilingualText('Buyer', 'المشتري') : toBilingualText('Customer', 'العميل'))
    : (invoice?.flow === 'purchase' ? (language === 'ar' ? 'المشتري' : 'Buyer') : (language === 'ar' ? 'العميل' : 'Customer'))
  const logoSrc = invoiceBranding.logoSrc
  const qrValue = invoice?.zatca?.qrCodeData || generateZatcaQrValue({
    sellerName: sellerNameEn || sellerNameAr,
    vatNumber: invoice?.seller?.vatNumber || tenant?.business?.vatNumber,
    timestamp: invoice?.issueDate || new Date().toISOString(),
    totalWithVat: toNumber(invoice?.grandTotal),
    vatTotal: toNumber(invoice?.totalTax),
  })
  const totals = calculateInvoiceSummary(invoice)
  const travelDetails = normalizeTravelDetails(invoice?.travelDetails || {}, buyerNameEn || buyerNameAr, language)
  const travelDetailsEn = normalizeTravelDetails(invoice?.travelDetails || {}, buyerNameEn || buyerNameAr, 'en')
  const travelDetailsAr = normalizeTravelDetails(invoice?.travelDetails || {}, buyerNameAr || buyerNameEn, 'ar')
  const lineItems = totals.lines.length > 0 ? totals.lines : [{ raw: { productName: language === 'ar' ? 'خدمة' : 'Service' }, quantity: 1, unitPrice: 0, taxAmount: 0, lineTotalWithTax: 0 }]
  const sellerDetails = bilingual ? getPartyDetailLinesBilingual(invoice?.seller || tenant?.business || {}, 'seller') : getPartyDetailLines(invoice?.seller || tenant?.business || {}, language, 'seller')
  const buyerDetails = bilingual ? getPartyDetailLinesBilingual(invoice?.buyer || {}, 'buyer') : getPartyDetailLines(invoice?.buyer || {}, language, 'buyer')
  const companyName = invoiceBranding.companyName || sellerNameEn || sellerNameAr || '—'
  const headerLines = splitBrandingText(invoiceBranding.headerText)
  const footerLines = splitBrandingText(invoiceBranding.footerText)
  const showVisionLogo = invoiceBranding.showVision2030 && invoiceBranding.vision2030LogoSrc
  const typography = invoiceBranding.typography || {}
  const zatcaStatusMeta = getZatcaStatusMeta(invoice, language)
  const amountInWordsLines = bilingual
    ? uniqueLines(
        getAmountInWords(totals.grandTotal, currency, 'en'),
        getAmountInWords(totals.grandTotal, currency, 'ar'),
      )
    : [getAmountInWords(totals.grandTotal, currency, language)]
  const showInvoiceTitle = !(invoice?.invoiceSubtype === 'travel_ticket' || invoice?.businessContext === 'travel_agency')
  const invoiceTitle = bilingual
    ? toBilingualText(getInvoiceTitle(invoice, 'en'), getInvoiceTitle(invoice, 'ar'))
    : getInvoiceTitle(invoice, language)
  const rawRouteText = getUntranslatedRouteText(invoice?.travelDetails || {})
  const rawDepartureDate = getRawDisplayValue(invoice?.travelDetails?.departureDate)
  const renderStackedLabel = (english, arabic, uppercaseEnglish = false) => {
    if (!bilingual) return language === 'ar' ? arabic : english

    return (
      <span className="flex flex-col gap-1 leading-tight">
        <span className={uppercaseEnglish ? 'uppercase tracking-[0.2em]' : ''}>{english}</span>
        <span dir="rtl" className="tracking-normal normal-case">{arabic}</span>
      </span>
    )
  }
  const travelRows = invoice?.invoiceSubtype === 'travel_ticket'
    ? [
        {
          key: 'lead-traveler',
          label: bilingual ? toBilingualText('Lead Traveler', 'اسم المسافر الرئيسي') : (language === 'ar' ? 'اسم المسافر الرئيسي' : 'Lead Traveler'),
          value: bilingual ? toBilingualText(travelDetailsEn?.travelerDisplayName, travelDetailsAr?.travelerDisplayName) : (travelDetails?.travelerDisplayName || '—'),
        },
        {
          key: 'passport',
          label: bilingual ? toBilingualText('Passport', 'رقم الجواز') : (language === 'ar' ? 'رقم الجواز' : 'Passport Number'),
          value: travelDetails?.passportNumber || '—',
        },
        {
          key: 'ticket-reference',
          label: bilingual ? toBilingualText('Ticket Reference', 'مرجع التذكرة') : (language === 'ar' ? 'مرجع التذكرة' : 'Ticket Reference'),
          value: travelDetails?.ticketNumber || '—',
        },
        {
          key: 'pnr',
          label: bilingual ? toBilingualText('PNR', 'رمز الحجز') : 'PNR',
          value: travelDetails?.pnr || '—',
        },
        {
          key: 'travel-route',
          label: bilingual ? toBilingualText('Travel Route', 'مسار الرحلة') : (language === 'ar' ? 'مسار الرحلة' : 'Travel Route'),
          value: rawRouteText,
          dir: hasArabicText(rawRouteText) ? 'rtl' : 'ltr',
        },
        {
          key: 'carrier',
          label: bilingual ? toBilingualText('Carrier / Service Provider', 'الناقل / مزود الخدمة') : (language === 'ar' ? 'الناقل / مزود الخدمة' : 'Carrier / Service Provider'),
          value: getRawDisplayValue(invoice?.travelDetails?.airlineName || travelDetailsEn?.airlineDisplayName || invoice?.seller?.name),
          dir: 'ltr',
        },
        {
          key: 'departure-date',
          label: bilingual ? toBilingualText('Departure Date', 'تاريخ المغادرة') : (language === 'ar' ? 'تاريخ المغادرة' : 'Departure Date'),
          value: rawDepartureDate,
          dir: 'ltr',
        },
        travelDetails?.hasReturnDate || (bilingual && travelDetailsEn?.hasReturnDate)
          ? {
              key: 'return-date',
              label: bilingual ? toBilingualText('Return Date', 'تاريخ العودة') : (language === 'ar' ? 'تاريخ العودة' : 'Return Date'),
              value: bilingual ? toBilingualText(formatDate(travelDetailsEn?.returnDate, 'en'), formatDate(travelDetailsAr?.returnDate, 'ar')) : formatDate(travelDetails?.returnDate, language),
            }
          : null,
        {
          key: 'layover-stay',
          label: bilingual ? toBilingualText('Layover / Stay', 'التوقف / الإقامة') : (language === 'ar' ? 'التوقف / الإقامة' : 'Layover / Stay'),
          value: bilingual ? toBilingualText(travelDetailsEn?.layoverStayDisplay, travelDetailsAr?.layoverStayDisplay) : (travelDetails?.layoverStayDisplay || '—'),
        },
        {
          key: 'additional-passengers',
          label: bilingual ? toBilingualText('Additional Passengers', 'مسافرون إضافيون') : (language === 'ar' ? 'مسافرون إضافيون' : 'Additional Passengers'),
          value: bilingual
            ? toBilingualText(travelDetailsEn?.additionalPassengersText === '—' ? '' : travelDetailsEn?.additionalPassengersText, travelDetailsAr?.additionalPassengersText === '—' ? '' : travelDetailsAr?.additionalPassengersText)
            : (travelDetails?.additionalPassengersText || '—'),
          spanFull: true,
        },
      ].filter(Boolean)
    : []
  const accentBarStyle = {
    background: invoiceBranding.primaryColor,
  }
  const metaCardStyle = {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  }
  const mutedText = 'text-slate-500'
  const titleText = 'text-slate-900'
  const shellStyle = {
    fontFamily: bilingual ? '"InvoiceTajawal", Arial, Helvetica, sans-serif' : getInvoiceCssFontFamily(typography.bodyFontFamily),
    fontSize: `${typography.bodyFontSize || 12}px`,
  }
  const headingStyle = {
    fontFamily: bilingual ? '"InvoiceTajawal", Arial, Helvetica, sans-serif' : getInvoiceCssFontFamily(typography.headingFontFamily),
  }
  const companyHeadingStyle = {
    ...headingStyle,
    fontSize: `${Math.max((typography.headingFontSize || 18) + 10, 28)}px`,
  }
  const invoiceTitleStyle = {
    ...headingStyle,
    fontSize: `${Math.max((typography.headingFontSize || 18) + 6, 24)}px`,
  }
  const renderMoney = (value, options = {}) => {
    const isSar = isSarCurrency(currency)
    const formatted = isSar
      ? formatCurrencyAmount(value, {
          language,
          currency,
          currencyDisplay: 'code',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : formatCurrency(value, {
          language,
          currency,
          currencyDisplay: 'code',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })

    if (!isSar) {
      return formatted
    }

    if (currencyRenderMode === 'symbol') {
      return formatCurrency(value, {
        language,
        currency,
        currencyDisplay: 'code',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    }

    if (currencyRenderMode === 'snapshot-icon') {
      return renderSarMoneySnapshotIcon({
        formatted,
        className: options.className || '',
      })
    }

    return renderSarMoney({
      formatted,
      className: options.className || '',
    })
  }

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border shadow-[0_30px_80px_-40px_rgba(15,23,42,0.30)] ${styles.shell}`} style={shellStyle}>
      <div className="absolute inset-x-0 top-0 h-1.5" style={accentBarStyle} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {logoSrc ? <img src={logoSrc} alt="" className="h-52 w-52 object-contain opacity-[0.05]" /> : null}
      </div>
      <div className="relative px-6 pb-6 pt-7">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm">
                <img src={logoSrc} alt="" className="h-full w-full object-contain" />
              </div>
              <div className="min-w-0 max-w-[34rem] flex-1">
                <p className={`text-[11px] uppercase tracking-[0.24em] ${mutedText}`}>{getInvoiceEyebrow(invoice, language)}</p>
                <h3 className={`mt-2 text-[1.75rem] font-semibold leading-tight ${titleText}`} style={companyHeadingStyle}>{companyName || '—'}</h3>
                {headerLines.length > 0 && (
                  <div className="mt-2 max-w-[30rem] space-y-1 overflow-hidden">
                    {headerLines.slice(0, 2).map((line, index) => (
                      <p key={`${line}-${index}`} className={`text-sm leading-5 ${mutedText}`}>{line}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex min-w-[148px] flex-col items-center gap-3 self-start text-center">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-2 shadow-sm">
                <QRCodeSVG value={qrValue} size={88} bgColor="transparent" fgColor="#0F172A" />
              </div>
              <div className="w-full max-w-[132px] space-y-1 text-[11px] leading-4 text-slate-600 text-center">
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
              {showInvoiceTitle ? <h2 className={`mt-2 text-3xl font-semibold whitespace-pre-line ${titleText}`} style={invoiceTitleStyle}>{invoiceTitle}</h2> : null}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className={`rounded-[1.5rem] p-5 ${styles.block}`} style={metaCardStyle}>
                <p className={`text-xs font-semibold ${mutedText}`}>{renderStackedLabel('Seller', 'البائع', true)}</p>
                <p className={`mt-3 text-[1.05rem] font-bold leading-7 ${titleText} whitespace-pre-line`}>{sellerName || '—'}</p>
                <div className="mt-3 space-y-2">
                  {sellerDetails.map((detail, index) => (
                    <div key={`${detail.label}-${index}`} className="text-sm font-semibold leading-6 text-slate-800 break-words whitespace-pre-line">
                      {detail.label ? <p className="font-bold text-slate-900 whitespace-pre-line">{detail.label}</p> : null}
                      <p dir={detail.dir || undefined} className={detail.dir ? 'block whitespace-pre-line' : 'whitespace-pre-line'}>{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`rounded-[1.5rem] p-5 ${styles.block}`} style={metaCardStyle}>
                <p className={`text-xs font-semibold ${mutedText}`}>{invoice?.flow === 'purchase' ? renderStackedLabel('Buyer', 'المشتري', true) : renderStackedLabel('Customer', 'العميل', true)}</p>
                <p className={`mt-3 text-[1.05rem] font-bold leading-7 ${titleText} whitespace-pre-line`}>{buyerName || '—'}</p>
                <div className="mt-3 space-y-2">
                  {buyerDetails.map((detail, index) => (
                    <div key={`${detail.label}-${index}`} className="text-sm font-semibold leading-6 text-slate-800 break-words whitespace-pre-line">
                      {detail.label ? <p className="font-bold text-slate-900 whitespace-pre-line">{detail.label}</p> : null}
                      <p dir={detail.dir || undefined} className={detail.dir ? 'block whitespace-pre-line' : 'whitespace-pre-line'}>{detail.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={`flex flex-col items-center justify-center rounded-[1.75rem] p-5 ${styles.block}`}>
            <div className="flex w-full justify-center">
              <div className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${styles.badge}`}>
                {invoice?.transactionType || 'B2C'}
              </div>
            </div>
            <p className={`mt-4 text-center text-base font-semibold ${titleText}`}>{invoice?.invoiceNumber || 'DRAFT-PREVIEW'}</p>
            <p className={`mt-1 text-center text-xs ${mutedText}`}>{formatDate(invoice?.issueDate || new Date(), language)}</p>
            <div className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center">
              <p className={`text-[11px] font-medium uppercase tracking-[0.2em] ${mutedText}`}>{language === 'ar' ? 'الحالة' : 'Status'}</p>
              <p className={`mt-2 text-sm font-semibold ${titleText}`} style={headingStyle}>{zatcaStatusMeta.label}</p>
            </div>
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
            {travelRows.map((row, index) => (
              <div key={row.key || `${index}`} className={row.spanFull ? 'md:col-span-3' : ''}>
                <p className={`text-xs ${mutedText} whitespace-pre-line`}>{row.label}</p>
                <p dir={row.dir || undefined} className={`mt-1 text-sm font-semibold ${titleText} whitespace-pre-line`}>{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-6 py-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className={styles.tableHead}>
              <tr>
                <th className="px-4 py-3 text-start font-medium">#</th>
                <th className="px-4 py-3 text-start font-medium whitespace-pre-line">{bilingual ? toBilingualText('Description', 'الوصف') : (language === 'ar' ? 'الوصف' : 'Description')}</th>
                <th className="px-4 py-3 text-center font-medium whitespace-pre-line">{bilingual ? toBilingualText('Qty', 'الكمية') : (language === 'ar' ? 'الكمية' : 'Qty')}</th>
                <th className="px-4 py-3 text-end font-medium whitespace-pre-line">{bilingual ? toBilingualText('Unit Price', 'سعر الوحدة') : (language === 'ar' ? 'السعر' : 'Price')}</th>
                <th className="px-4 py-3 text-end font-medium whitespace-pre-line">{bilingual ? toBilingualText('Tax', 'الضريبة') : (language === 'ar' ? 'الضريبة' : 'Tax')}</th>
                <th className="px-4 py-3 text-end font-medium whitespace-pre-line">{bilingual ? toBilingualText('Total', 'الإجمالي') : (language === 'ar' ? 'الإجمالي' : 'Total')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {lineItems.map((line, index) => {
                const quantity = toNumber(line?.quantity)
                const unitPrice = toNumber(line?.unitPrice)
                const tax = toNumber(line?.taxAmount)
                const total = toNumber(line?.lineTotalWithTax)
                const productNameEn = line?.raw?.productName || line?.productName || line?.raw?.productNameAr || line?.productNameAr || '—'
                const productNameAr = line?.raw?.productNameAr || line?.productNameAr || (hasArabicText(productNameEn) ? productNameEn : '')
                const descriptionEn = line?.raw?.description || line?.description || line?.raw?.descriptionAr || line?.descriptionAr || ''
                const descriptionAr = line?.raw?.descriptionAr || line?.descriptionAr || (hasArabicText(descriptionEn) ? descriptionEn : '')
                return (
                  <tr key={`${line?.raw?.productName || line?.productName || 'line'}-${index}`}>
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium whitespace-pre-line">{bilingual ? toBilingualText(productNameEn, productNameAr) : (language === 'ar' ? (line?.raw?.productNameAr || line?.raw?.productName || line?.productNameAr || line?.productName || '—') : (line?.raw?.productName || line?.raw?.productNameAr || line?.productName || line?.productNameAr || '—'))}</div>
                      {(line?.raw?.description || line?.raw?.descriptionAr || line?.description || line?.descriptionAr) && <div className={`mt-1 text-xs ${mutedText} whitespace-pre-line`}>{bilingual ? toBilingualText(descriptionEn, descriptionAr) : (language === 'ar' ? (line?.raw?.descriptionAr || line?.raw?.description || line?.descriptionAr || line?.description) : (line?.raw?.description || line?.raw?.descriptionAr || line?.description || line?.descriptionAr))}</div>}
                    </td>
                    <td className="px-4 py-3 text-center">{quantity || '—'}</td>
                    <td className="px-4 py-3 text-end">{renderMoney(unitPrice)}</td>
                    <td className="px-4 py-3 text-end">{renderMoney(tax)}</td>
                    <td className="px-4 py-3 text-end font-semibold">{renderMoney(total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <div className={`rounded-2xl p-4 ${styles.block}`}>
            <p className={`text-xs font-semibold ${mutedText}`}>{renderStackedLabel('Amount in Words', 'المبلغ كتابةً')}</p>
            <div className={`mt-3 space-y-1 text-base font-bold leading-8 ${titleText}`}>
              {amountInWordsLines.map((line, index) => (
                <p key={`${line}-${index}`} dir="auto" className="whitespace-pre-line">{line}</p>
              ))}
            </div>
            {invoice?.notes ? <p className={`mt-4 text-sm font-semibold leading-7 text-slate-700`}>{invoice.notes}</p> : null}
          </div>
          <div className={`rounded-2xl p-4 ${styles.block}`}>
            <div className="flex items-center justify-between text-sm font-bold text-slate-800">
              <span className="whitespace-pre-line">{bilingual ? toBilingualText('Subtotal', 'الإجمالي الفرعي') : (language === 'ar' ? 'الإجمالي الفرعي' : 'Subtotal')}</span>
              <span>{renderMoney(totals.subtotal)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-800">
              <span className="whitespace-pre-line">{bilingual ? toBilingualText('Discount', 'الخصم') : (language === 'ar' ? 'الخصم' : 'Discount')}</span>
              <span>{renderMoney(totals.totalDiscount)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm font-bold text-slate-800">
              <span className="whitespace-pre-line">{bilingual ? toBilingualText('Tax', 'الضريبة') : (language === 'ar' ? 'الضريبة' : 'VAT')}</span>
              <span>{renderMoney(totals.totalTax)}</span>
            </div>
            <div className={`mt-4 flex items-center justify-between border-t border-slate-200 pt-4 ${titleText}`}>
              <span className="text-base font-bold whitespace-pre-line">{bilingual ? toBilingualText('Total', 'الإجمالي') : (language === 'ar' ? 'الإجمالي النهائي' : 'Grand Total')}</span>
              <span className="text-2xl font-bold">{renderMoney(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-h-16 items-end justify-center lg:justify-start">
            {showVisionLogo ? (
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <img src={invoiceBranding.vision2030LogoSrc} alt="" className="h-full w-full object-contain" />
              </div>
            ) : <div />}
          </div>
          {footerLines.length > 0 ? (
            <div className="flex-1 space-y-1 text-center lg:text-end">
              {footerLines.map((line, index) => (
                <p key={`${line}-${index}`} className={`text-sm leading-6 ${mutedText}`}>{line}</p>
              ))}
            </div>
          ) : <div className="flex-1" />}
        </div>
      </div>
    </div>
  )
}
