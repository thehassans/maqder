import { QRCodeSVG } from 'qrcode.react'
import { generateZatcaQrValue } from '../../lib/zatcaQr'
import { calculateInvoiceSummary, toNumber } from '../../lib/invoiceDocument'
import { getInvoiceBranding } from '../../lib/invoiceBranding'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import { Building2, Calendar, Hash, User, Phone, MapPin, CreditCard, FileText } from 'lucide-react'
import { getAmountInWords } from '../../lib/amountInWords'

const hasArabicText = (value = '') => /[\u0600-\u06FF]/.test(String(value || ''))

export default function ModernZatcaTemplate({ invoice, tenant, language = 'en', bilingual = false, documentType = 'invoice' }) {
  const currency = invoice?.currency || tenant?.settings?.currency || 'SAR'
  const invoiceBranding = getInvoiceBranding(tenant, language, invoice?.businessContext)
  
  const sellerNameEn = invoice?.seller?.name || invoice?.seller?.nameAr || tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || ''
  const sellerNameAr = invoice?.seller?.nameAr || (hasArabicText(invoice?.seller?.name) ? invoice?.seller?.name : '') || tenant?.business?.legalNameAr || ''
  const buyerNameEn = invoice?.buyer?.name || invoice?.buyer?.nameAr || 'Cash Customer'
  const buyerNameAr = invoice?.buyer?.nameAr || (hasArabicText(invoice?.buyer?.name) ? invoice?.buyer?.name : '')
  
  const sellerName = bilingual ? sellerNameEn : (language === 'ar' ? (sellerNameAr || sellerNameEn) : (sellerNameEn || sellerNameAr))
  const buyerName = bilingual ? buyerNameEn : (language === 'ar' ? (buyerNameAr || buyerNameEn) : (buyerNameEn || buyerNameAr))

  const logoSrc = invoiceBranding.logoSrc
  
  const qrValue = invoice?.zatca?.qrCodeData || generateZatcaQrValue({
    sellerName: sellerNameEn || sellerNameAr,
    vatNumber: invoice?.seller?.vatNumber || tenant?.business?.vatNumber,
    timestamp: invoice?.issueDate || new Date().toISOString(),
    totalWithVat: toNumber(invoice?.grandTotal),
    vatTotal: toNumber(invoice?.totalTax),
  })

  const totals = calculateInvoiceSummary(invoice)
  const lineItems = totals.lines.length > 0 ? totals.lines : [{ raw: { productName: language === 'ar' ? 'خدمة' : 'Service' }, quantity: 1, unitPrice: 0, taxAmount: 0, lineTotalWithTax: 0 }]
  
  const documentNumber = invoice?.quotationNumber || invoice?.invoiceNumber || 'DRAFT-PREVIEW'
  
  const formatDate = (dateString, locale = 'en-SA') => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderMoney = (value) => {
    return formatCurrency(value, {
      language,
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const isQuotation = documentType === 'quotation'

  return (
    <div className="mx-auto max-w-5xl bg-white border rounded-[2rem] shadow-xl overflow-hidden font-sans">
      {/* Header */}
      <div className="border-b bg-white p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-4">
              {logoSrc ? (
                <img src={logoSrc} alt="Logo" className="h-16 w-auto object-contain" />
              ) : (
                <Building2 className="h-8 w-8 text-primary-600" />
              )}
              <h2 className="text-2xl font-bold text-gray-900">
                {sellerName}
              </h2>
            </div>
            {bilingual && sellerNameAr && (
              <p className="text-lg font-semibold text-gray-500" dir="rtl">
                {sellerNameAr}
              </p>
            )}
            
            <div className="mt-4 space-y-1 text-sm">
              {(invoice?.seller?.address?.street || invoice?.seller?.address?.city) && (
                <p className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                  <span>{[invoice.seller.address.street, invoice.seller.address.district, invoice.seller.address.city, invoice.seller.address.country].filter(Boolean).join(', ')}</span>
                </p>
              )}
              {invoice?.seller?.contactPhone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  {invoice.seller.contactPhone}
                </p>
              )}
              {invoice?.seller?.contactEmail && (
                <p className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  {invoice.seller.contactEmail}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 md:items-end">
            <div className="inline-flex items-center rounded-full border bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 w-fit">
              <FileText className="mr-2 h-4 w-4" />
              {isQuotation ? 'Quotation / عرض سعر' : 'Tax Invoice / فاتورة ضريبية'}
            </div>
            
            <div className="mt-2 space-y-1 text-sm text-gray-600 md:text-right">
              {(invoice?.seller?.vatNumber || tenant?.business?.vatNumber) && (
                <div className="flex flex-col md:items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">VAT No:</span>
                    <span className="font-mono">{invoice?.seller?.vatNumber || tenant?.business?.vatNumber}</span>
                  </div>
                  {bilingual && (
                    <div className="flex items-center gap-2" dir="rtl">
                      <span className="font-mono">{invoice?.seller?.vatNumber || tenant?.business?.vatNumber}</span>
                      <span className="font-semibold text-gray-900">:الرقم الضريبي</span>
                    </div>
                  )}
                </div>
              )}
              {(invoice?.seller?.crNumber || tenant?.business?.crNumber) && (
                <div className="flex items-center gap-2 md:justify-end mt-2">
                  <span className="font-semibold text-gray-900">CR No:</span>
                  <span className="font-mono">{invoice?.seller?.crNumber || tenant?.business?.crNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Bill To & Invoice Details Grid */}
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border bg-gray-50 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 border-b pb-2">
              <User className="h-4 w-4 text-primary-600" />
              Bill To / الفاتورة إلى
            </h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p className="font-bold text-gray-900 text-lg">{buyerName}</p>
              {bilingual && buyerNameAr && (
                <p className="font-bold text-gray-500" dir="rtl">{buyerNameAr}</p>
              )}
              
              <div className="mt-3 space-y-2">
                {(invoice?.buyer?.address?.street || invoice?.buyer?.address?.city) && (
                  <p>{[invoice.buyer.address.street, invoice.buyer.address.district, invoice.buyer.address.city, invoice.buyer.address.country].filter(Boolean).join(', ')}</p>
                )}
                {invoice?.buyer?.contactPhone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {invoice.buyer.contactPhone}
                  </p>
                )}
                {invoice?.buyer?.vatNumber && (
                  <p className="mt-2">
                    <span className="font-semibold text-gray-900">VAT No:</span>{" "}
                    <span className="font-mono">{invoice.buyer.vatNumber}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-gray-50 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 border-b pb-2">
              <Calendar className="h-4 w-4 text-primary-600" />
              Details / التفاصيل
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">No:</span>
                <span className="font-mono font-bold text-gray-900">{documentNumber}</span>
                {bilingual && <span className="text-gray-500" dir="rtl">:رقم</span>}
              </div>
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Date:</span>
                <span className="font-semibold text-gray-900">{formatDate(invoice?.issueDate)}</span>
                {bilingual && <span className="text-gray-500" dir="rtl">:التاريخ</span>}
              </div>
              <hr className="border-gray-200" />
              
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Due Date:</span>
                <span className="font-semibold text-gray-900">{formatDate(invoice?.dueDate || invoice?.validUntil)}</span>
                {bilingual && <span className="text-gray-500" dir="rtl">:تاريخ الاستحقاق</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="mb-6 overflow-hidden rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-start font-semibold text-gray-900">#</th>
                <th className="px-4 py-3 text-start font-semibold text-gray-900">
                  <div className="flex flex-col">
                    <span>Description</span>
                    {bilingual && <span className="text-xs text-gray-500" dir="rtl">الوصف</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-900">
                  <div className="flex flex-col">
                    <span>Qty</span>
                    {bilingual && <span className="text-xs text-gray-500" dir="rtl">الكمية</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">
                  <div className="flex flex-col items-end">
                    <span>Unit Price</span>
                    {bilingual && <span className="text-xs text-gray-500" dir="rtl">سعر الوحدة</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">
                  <div className="flex flex-col items-end">
                    <span>Tax</span>
                    {bilingual && <span className="text-xs text-gray-500" dir="rtl">الضريبة</span>}
                  </div>
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-900">
                  <div className="flex flex-col items-end">
                    <span>Total</span>
                    {bilingual && <span className="text-xs text-gray-500" dir="rtl">المجموع</span>}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white text-gray-700">
              {lineItems.map((item, index) => {
                const productNameEn = item?.raw?.productName || item?.productName || item?.raw?.productNameAr || item?.productNameAr || '—'
                const productNameAr = item?.raw?.productNameAr || item?.productNameAr || (hasArabicText(productNameEn) ? productNameEn : '')
                
                return (
                  <tr key={index} className="hover:bg-gray-50/50">
                    <td className="px-4 py-4 font-medium text-gray-900">{index + 1}</td>
                    <td className="px-4 py-4 max-w-xs">
                      <div>
                        <p className="font-medium text-gray-900 whitespace-pre-wrap">{productNameEn}</p>
                        {bilingual && productNameAr && (
                          <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap" dir="rtl">
                            {productNameAr}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">{item.quantity}</td>
                    <td className="px-4 py-4 text-right font-mono text-gray-900">
                      {renderMoney(toNumber(item.unitPrice))}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono text-gray-900">
                          {renderMoney(toNumber(item.taxAmount))}
                        </span>
                        <span className="text-xs text-gray-500 mt-0.5">
                          ({item.taxRate}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono font-bold text-gray-900">
                      {renderMoney(toNumber(item.lineTotalWithTax))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary & Notes */}
        <div className="flex flex-col gap-6 md:flex-row">
          <div className="flex-1 rounded-xl border bg-gray-50 p-5">
            <h4 className="mb-3 font-semibold text-gray-900 border-b pb-2">Notes / ملاحظات</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice?.notes || '—'}</p>
            {bilingual && invoice?.notesAr && (
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap" dir="rtl">{invoice?.notesAr}</p>
            )}
            
            {invoice?.paymentMethod && (
              <>
                <hr className="my-4 border-gray-200" />
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="font-semibold text-gray-900">Payment Method:</span>
                  <span className="text-gray-700">{invoice.paymentMethod}</span>
                </div>
              </>
            )}
          </div>

          <div className="w-full rounded-xl border bg-gray-50 p-5 md:w-80">
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">Subtotal</span>
                  {bilingual && <span className="text-xs text-gray-400" dir="rtl">المجموع الفرعي</span>}
                </div>
                <span className="font-mono font-semibold text-gray-900">
                  {renderMoney(totals.subtotal)}
                </span>
              </div>
              <hr className="border-gray-200" />
              
              <div className="flex justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500">VAT Total</span>
                  {bilingual && <span className="text-xs text-gray-400" dir="rtl">إجمالي الضريبة</span>}
                </div>
                <span className="font-mono font-semibold text-gray-900">
                  {renderMoney(totals.totalTax)}
                </span>
              </div>
              <hr className="border-gray-200" />
              
              <div className="flex justify-between rounded-lg bg-primary-100/50 p-4 border border-primary-100">
                <div className="flex flex-col">
                  <span className="font-bold text-gray-900">Total</span>
                  {bilingual && <span className="text-xs font-semibold text-gray-600" dir="rtl">الإجمالي</span>}
                </div>
                <span className="font-mono text-xl font-bold text-primary-700">
                  {renderMoney(totals.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Amount In Words & ZATCA QR */}
        <div className="mt-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-5">
            <div className="flex items-start gap-3">
              <Hash className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
              <div className="flex-1 text-sm text-gray-600">
                <p className="mb-2 font-semibold text-gray-900">
                  Amount in Words / المبلغ كتابةً
                </p>
                <p className="font-medium text-gray-800">{getAmountInWords(totals.grandTotal, currency, 'en')}</p>
                {bilingual && (
                  <p dir="rtl" className="mt-1 font-medium text-gray-800">
                    {getAmountInWords(totals.grandTotal, currency, 'ar')}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {!isQuotation && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-5 w-full md:w-64">
              <QRCodeSVG value={qrValue} size={110} bgColor="transparent" fgColor="#111827" />
              <p className="mt-3 text-xs text-center text-gray-500">ZATCA Compliant QR</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
