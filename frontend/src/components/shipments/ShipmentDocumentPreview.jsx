import { Fragment } from 'react'
import { getInvoiceBranding } from '../../lib/invoiceBranding'

const formatDate = (value, language = 'en') => {
  if (!value) return 'â€”'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'â€”'
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

const resolveCompanyName = (tenant = {}, language = 'en') => {
  if (language === 'ar') {
    return tenant?.business?.legalNameAr || tenant?.business?.legalNameEn || 'â€”'
  }
  return tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || 'â€”'
}

const resolveWarehouseName = (shipment = {}, language = 'en') => {
  const warehouse = shipment?.warehouseId || {}
  if (language === 'ar') {
    return warehouse?.nameAr || warehouse?.nameEn || 'â€”'
  }
  return warehouse?.nameEn || warehouse?.nameAr || 'â€”'
}

const getRecipientName = (shipment = {}, language = 'en') => {
  const recipient = shipment?.deliveryRecipient || {}
  if (language === 'ar') {
    return recipient?.nameAr || recipient?.name || recipient?.company || 'â€”'
  }
  return recipient?.name || recipient?.nameAr || recipient?.company || 'â€”'
}

const getRecipientCompany = (shipment = {}, language = 'en') => {
  const recipient = shipment?.deliveryRecipient || {}
  if (language === 'ar') {
    return recipient?.company || recipient?.nameAr || recipient?.name || 'â€”'
  }
  return recipient?.company || recipient?.name || recipient?.nameAr || 'â€”'
}

export default function ShipmentDocumentPreview({ shipment, tenant, language = 'en', documentType = 'delivery-note' }) {
  const isLabel = documentType === 'shipping-label'
  const branding = getInvoiceBranding(tenant, language, 'trading')
  const logoSrc = branding?.logoSrc || tenant?.business?.logoUrl || tenant?.branding?.logo || '/maqdernewlogo.webp'
  const companyName = resolveCompanyName(tenant, language)
  const companyNameEn = tenant?.business?.legalNameEn || tenant?.business?.legalNameAr || 'â€”'
  const companyNameAr = tenant?.business?.legalNameAr || tenant?.business?.legalNameEn || 'â€”'
  const warehouseName = resolveWarehouseName(shipment, language)
  const recipient = shipment?.deliveryRecipient || {}
  const recipientAddressLines = joinAddress(recipient?.address || {})
  const itemCount = Array.isArray(shipment?.lineItems) ? shipment.lineItems.length : 0
  const totalQty = (shipment?.lineItems || []).reduce((sum, line) => sum + Number(line?.quantity || 0), 0)
  const lineItems = Array.isArray(shipment?.lineItems) ? shipment.lineItems : []
  const documentTitle = isLabel
    ? (language === 'ar' ? 'Ù…Ù„ØµÙ‚ Ø§Ù„Ø´Ø­Ù†' : 'Shipping Label')
    : (language === 'ar' ? 'Ø¥Ø°Ù† ØªØ³Ù„ÙŠÙ…' : 'Delivery Note')
  const eyebrow = isLabel
    ? (language === 'ar' ? 'Ø¬Ø§Ù‡Ø² Ù„Ù„ØªØ³Ù„ÙŠÙ…' : 'Ready for Dispatch')
    : (language === 'ar' ? 'ÙˆØ«ÙŠÙ‚Ø© ØªØ³Ù„ÙŠÙ… Ø§Ø­ØªØ±Ø§ÙÙŠØ©' : 'Premium Delivery Document')

  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.32)] ${isLabel ? 'p-5' : 'p-6'}`}>
      <div className="absolute inset-x-0 top-0 h-1.5 bg-slate-900" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        {logoSrc ? (
          <img src={logoSrc} alt="" className={`${isLabel ? 'h-32 w-32' : 'h-48 w-48'} object-contain opacity-[0.05]`} />
        ) : null}
      </div>

      <div className="relative">
        <div className={`grid gap-4 ${isLabel ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[minmax(0,1fr)_220px]'}`}>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.26em] text-slate-500">{eyebrow}</p>
            <div className="mt-3 flex items-start gap-4">
              <div className={`${isLabel ? 'h-16 w-16 rounded-2xl' : 'h-20 w-20 rounded-[1.5rem]'} flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3`}>
                {logoSrc ? (
                  <img src={logoSrc} alt="" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-center text-xs font-semibold tracking-[0.3em] text-slate-500">{companyName.slice(0, 2)}</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className={`${isLabel ? 'text-2xl' : 'text-3xl'} font-semibold text-slate-950`}>{documentTitle}</h2>
                <p className="mt-2 text-base font-semibold text-slate-900">{companyName}</p>
                {!isLabel ? (
                  <div className="mt-2 space-y-1 text-sm text-slate-500">
                    <p>{companyNameEn}</p>
                    <p dir="rtl">{companyNameAr}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{language === 'ar' ? 'Ù…Ø±Ø¬Ø¹ Ø§Ù„Ù…Ø³ØªÙ†Ø¯' : 'Document Ref'}</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{shipment?.shipmentNumber || 'â€”'}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'Ø§Ù„Ø­Ø§Ù„Ø©' : 'Status'}</p>
                <p className="mt-1 font-medium text-slate-900">{shipment?.status || 'draft'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'Ø§Ù„ØªØ§Ø±ÙŠØ®' : 'Date'}</p>
                <p className="mt-1 font-medium text-slate-900">{formatDate(shipment?.shippedAt || shipment?.createdAt, language)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'Ø§Ù„ØªØªØ¨Ø¹' : 'Tracking'}</p>
                <p className="mt-1 font-medium text-slate-900 break-words">{shipment?.trackingNumber || 'â€”'}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'Ø§Ù„Ù†Ø§Ù‚Ù„' : 'Carrier'}</p>
                <p className="mt-1 font-medium text-slate-900 break-words">{shipment?.carrier || 'â€”'}</p>
              </div>
            </div>
          </div>
        </div>

        {isLabel ? (
          <div className="mt-5 grid grid-cols-1 gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{language === 'ar' ? 'Ù…Ù†' : 'From'}</p>
                <p className="mt-2 text-base font-semibold text-slate-950">{companyName}</p>
                <p className="mt-1 text-sm text-slate-600">{warehouseName}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-950 p-4 text-white">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">{language === 'ar' ? 'Ø¥Ù„Ù‰' : 'To'}</p>
                <p className="mt-2 text-xl font-semibold">{getRecipientName(shipment, language)}</p>
                <p className="mt-1 text-sm text-slate-200">{getRecipientCompany(shipment, language)}</p>
                {recipient?.phone ? <p className="mt-2 text-sm text-slate-200">{recipient.phone}</p> : null}
              </div>
            </div>
            <div className="rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{language === 'ar' ? 'Ø¹Ù†ÙˆØ§Ù† Ø§Ù„ØªØ³Ù„ÙŠÙ…' : 'Delivery Address'}</p>
              <div className="mt-2 space-y-1 text-sm font-medium text-slate-900">
                {recipientAddressLines.length > 0 ? recipientAddressLines.map((line, index) => (
                  <p key={`${line}-${index}`}>{line}</p>
                )) : <p>â€”</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 rounded-[1.25rem] bg-slate-50 p-4 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'Ø§Ù„Ø¨Ù†ÙˆØ¯' : 'Items'}</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{itemCount}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'Ø§Ù„ÙƒÙ…ÙŠØ©' : 'Qty'}</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{totalQty}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{language === 'ar' ? 'Ø§Ù„Ù…Ø±Ø¬Ø¹' : 'Reference'}</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{recipient?.referenceNumber || 'â€”'}</p>
              </div>
            </div>
          </div>
        ) : (
          <Fragment>
            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'Ù…Ù†Ø´Ø£ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„' : 'Dispatch Origin'}</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{companyName}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>{language === 'ar' ? 'Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹' : 'Warehouse'}: <span className="font-medium text-slate-900">{warehouseName}</span></p>
                  <p>{language === 'ar' ? 'Ø§Ù„Ù†Ø§Ù‚Ù„' : 'Carrier'}: <span className="font-medium text-slate-900">{shipment?.carrier || 'â€”'}</span></p>
                  <p>{language === 'ar' ? 'Ø±Ù‚Ù… Ø§Ù„ØªØªØ¨Ø¹' : 'Tracking'}: <span className="font-medium text-slate-900">{shipment?.trackingNumber || 'â€”'}</span></p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{language === 'ar' ? 'ÙˆØ¬Ù‡Ø© Ø§Ù„ØªØ³Ù„ÙŠÙ…' : 'Delivery Destination'}</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">{getRecipientName(shipment, language)}</p>
                <div className="mt-3 space-y-2 text-sm text-slate-600">
                  <p>{language === 'ar' ? 'Ø§Ù„Ø´Ø±ÙƒØ©' : 'Company'}: <span className="font-medium text-slate-900">{getRecipientCompany(shipment, language)}</span></p>
                  <p>{language === 'ar' ? 'Ø§Ù„Ù‡Ø§ØªÙ' : 'Phone'}: <span className="font-medium text-slate-900">{recipient?.phone || 'â€”'}</span></p>
                  <p>{language === 'ar' ? 'Ø§Ù„Ù…Ø±Ø¬Ø¹' : 'Reference'}: <span className="font-medium text-slate-900">{recipient?.referenceNumber || 'â€”'}</span></p>
                </div>
                <div className="mt-4 rounded-[1.25rem] border border-dashed border-slate-300 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{language === 'ar' ? 'Ø§Ù„Ø¹Ù†ÙˆØ§Ù†' : 'Address'}</p>
                  <div className="mt-2 space-y-1 text-sm font-medium text-slate-900">
                    {recipientAddressLines.length > 0 ? recipientAddressLines.map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    )) : <p>â€”</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-start font-medium">#</th>
                    <th className="px-4 py-3 text-start font-medium">{language === 'ar' ? 'Ø§Ù„Ù…Ù†ØªØ¬' : 'Product'}</th>
                    <th className="px-4 py-3 text-start font-medium">{language === 'ar' ? 'Ø§Ù„ÙˆØµÙ' : 'Description'}</th>
                    <th className="px-4 py-3 text-end font-medium">{language === 'ar' ? 'Ø§Ù„ÙƒÙ…ÙŠØ©' : 'Qty'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {lineItems.length > 0 ? lineItems.map((line, index) => {
                    const productName = language === 'ar'
                      ? (line?.productId?.nameAr || line?.productId?.nameEn || 'â€”')
                      : (line?.productId?.nameEn || line?.productId?.nameAr || 'â€”')
                    return (
                      <tr key={`${line?._id || index}`}>
                        <td className="px-4 py-3">{index + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{productName}</td>
                        <td className="px-4 py-3">{line?.description || 'â€”'}</td>
                        <td className="px-4 py-3 text-end font-semibold text-slate-900">{Number(line?.quantity || 0)}</td>
                      </tr>
                    )
                  }) : (
                    <tr>
                      <td className="px-4 py-6 text-center text-slate-500" colSpan="4">{language === 'ar' ? 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨Ù†ÙˆØ¯' : 'No line items'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{language === 'ar' ? 'ØªØ¹Ù„ÙŠÙ…Ø§Øª Ø§Ù„ØªØ³Ù„ÙŠÙ…' : 'Delivery Instructions'}</p>
                <p className="mt-3 whitespace-pre-line text-sm font-medium leading-7 text-slate-900">{recipient?.instructions || shipment?.notes || 'â€”'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>{language === 'ar' ? 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ø¨Ù†ÙˆØ¯' : 'Total Items'}</span>
                  <span className="font-semibold text-slate-900">{itemCount}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                  <span>{language === 'ar' ? 'Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙƒÙ…ÙŠØ©' : 'Total Quantity'}</span>
                  <span className="font-semibold text-slate-900">{totalQty}</span>
                </div>
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{language === 'ar' ? 'ØªÙˆÙ‚ÙŠØ¹ Ø§Ù„Ù…Ø³ØªÙ„Ù…' : 'Receiver Signature'}</p>
                  <div className="mt-6 h-16 rounded-xl border border-dashed border-slate-300 bg-white" />
                </div>
              </div>
            </div>
          </Fragment>
        )}
      </div>
    </div>
  )
}
