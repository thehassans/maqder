import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { generateZatcaQrValue } from '../../lib/zatcaQr'
import { calculateInvoiceSummary, toNumber } from '../../lib/invoiceDocument'
import { getInvoiceBranding } from '../../lib/invoiceBranding'
import { formatCurrencyAmount } from '../../lib/currency'
import { getAmountInWords } from '../../lib/amountInWords'

const hasArabicText = (value = '') => /[\u0600-\u06FF]/.test(String(value || ''))

export default function AirTemplate({ invoice, tenant, language = 'en', bilingual = false, documentType = 'invoice' }) {
  const currency = invoice?.currency || tenant?.settings?.currency || 'SAR'
  const invoiceBranding = getInvoiceBranding(tenant, language, invoice?.businessContext)
  
  const primaryColor = invoiceBranding.primaryColor || '#64748b'
  
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
  
  const formatDate = (dateString, locale = 'en-US') => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const renderMoney = (value) => {
    const amount = formatCurrencyAmount(value, {
      language,
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return (
      <span className="inline-flex items-center gap-[0.3em] whitespace-nowrap">
        <span className="tabular-nums font-light">{amount}</span>
        <span className="text-[0.65em] text-slate-400 font-medium uppercase tracking-widest">{currency}</span>
      </span>
    )
  }

  const isQuotation = documentType === 'quotation'
  const invoiceTitleEn = isQuotation ? 'Quotation' : 'Invoice'
  const invoiceTitleAr = isQuotation ? 'عرض سعر' : 'فاتورة'

  return (
    <div dir="ltr" className="mx-auto max-w-5xl bg-white overflow-hidden font-sans rounded-3xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-50">
      
      <div className="p-16">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-20">
          <div className="flex-1">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="h-12 object-contain mb-8" />
            ) : (
              <div className="h-12 w-12 bg-slate-100 rounded-full mb-8"></div>
            )}
            <h2 className="text-3xl font-light text-slate-800 tracking-tight">{sellerNameEn}</h2>
            {bilingual && sellerNameAr && <h2 className="text-xl font-light text-slate-600 mt-2" dir="rtl">{sellerNameAr}</h2>}
            
            <div className="mt-6 text-sm text-slate-400 space-y-2 font-light">
              {invoice?.seller?.vatNumber && <p>VAT Registration &middot; {invoice.seller.vatNumber}</p>}
              {invoice?.seller?.crNumber && <p>Commercial Reg &middot; {invoice.seller.crNumber}</p>}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-end text-right">
            <h1 className="text-4xl font-extralight tracking-wide text-slate-300 uppercase">
              {invoiceTitleEn}
            </h1>
            {bilingual && <h1 className="text-2xl font-light text-slate-300 mt-2" dir="rtl">{invoiceTitleAr}</h1>}
            
            <div className="mt-12 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">Invoice Number</p>
              <p className="text-xl font-light text-slate-800" style={{ color: primaryColor }}>{documentNumber}</p>
            </div>
            <div className="mt-6 text-right">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-1">Date of Issue</p>
              <p className="text-lg font-light text-slate-800">{formatDate(invoice?.issueDate || new Date())}</p>
            </div>
          </div>
        </div>

        {/* Bill To & QR */}
        <div className="flex justify-between items-end mb-20 relative">
          <div className="absolute left-0 top-0 bottom-0 w-[1px] bg-slate-100"></div>
          <div className="pl-8">
            <p className="text-xs text-slate-400 uppercase tracking-widest font-medium mb-4">Billed To</p>
            <h3 className="text-2xl font-light text-slate-800">{buyerNameEn}</h3>
            {bilingual && buyerNameAr && <h3 className="text-xl font-light text-slate-600 mt-2" dir="rtl">{buyerNameAr}</h3>}
            {invoice?.buyer?.vatNumber && <p className="text-sm text-slate-400 mt-4 font-light">VAT: {invoice.buyer.vatNumber}</p>}
          </div>

          <div>
             {qrValue && (
                <div className="p-4 bg-slate-50/50 rounded-3xl">
                  <QRCodeSVG value={qrValue} size={80} bgColor="transparent" fgColor={primaryColor} />
                </div>
              )}
          </div>
        </div>

        {/* Table */}
        <div className="mb-20">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="py-4 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-12">No.</th>
                <th className="py-4 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">Item Description</th>
                <th className="py-4 text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-24">Qty</th>
                <th className="py-4 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-32">Rate</th>
                <th className="py-4 text-right text-[10px] font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100 w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {lineItems.map((line, idx) => {
                const productNameEn = line?.raw?.productName || line?.productName || '—'
                const productNameAr = line?.raw?.productNameAr || line?.productNameAr || ''
                return (
                  <tr key={idx} className="group">
                    <td className="py-6 whitespace-nowrap text-xs font-light text-slate-400">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="py-6 pr-8">
                      <p className="text-base font-light text-slate-800 group-hover:text-slate-900 transition-colors">{productNameEn}</p>
                      {bilingual && productNameAr && <p className="text-sm font-light text-slate-500 mt-1" dir="rtl">{productNameAr}</p>}
                    </td>
                    <td className="py-6 whitespace-nowrap text-sm font-light text-center text-slate-600">{toNumber(line?.quantity) || '—'}</td>
                    <td className="py-6 whitespace-nowrap text-right text-slate-600">{renderMoney(line?.unitPrice)}</td>
                    <td className="py-6 whitespace-nowrap text-right text-slate-800">{renderMoney(line?.lineTotalWithTax)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-20">
          <div className="w-1/2">
            <div className="flex justify-between py-4 border-b border-slate-100">
              <span className="text-sm font-light text-slate-500">Subtotal</span>
              <span className="text-slate-600">{renderMoney(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between py-4 border-b border-slate-100">
              <span className="text-sm font-light text-slate-500">Tax (15%)</span>
              <span className="text-slate-600">{renderMoney(totals.totalTax)}</span>
            </div>
            <div className="flex justify-between py-8">
              <span className="text-lg font-light text-slate-800">Total Due</span>
              <span className="text-3xl font-light" style={{ color: primaryColor }}>{renderMoney(totals.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 flex justify-center">
          <p className="text-xs font-light text-slate-400 tracking-wider">
            {invoiceBranding.footerText || 'Thank you for your business.'}
          </p>
        </div>
      </div>
    </div>
  )
}
