import { formatCurrency } from './currency'

const sanitizeFileName = (value) => {
  return String(value || 'invoice')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const hexToRgb = (hex) => {
  if (!hex) return null
  const raw = String(hex).trim().replace('#', '')

  if (raw.length === 3) {
    const r = parseInt(raw[0] + raw[0], 16)
    const g = parseInt(raw[1] + raw[1], 16)
    const b = parseInt(raw[2] + raw[2], 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    return { r, g, b }
  }

  if (raw.length !== 6) return null
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return null
  return { r, g, b }
}

const mix = (a, b, w) => Math.round(a * (1 - w) + b * w)

const mixRgb = (rgb, target, w) => ({
  r: mix(rgb.r, target.r, w),
  g: mix(rgb.g, target.g, w),
  b: mix(rgb.b, target.b, w),
})

const rgbToHex = (rgb) => {
  const to = (n) => clamp(n, 0, 255).toString(16).padStart(2, '0')
  return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`
}

const escapeHtml = (value) => {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

const safeText = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

const formatDateTime = (value, language) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')
}

const getLogoImageType = (dataUrl) => {
  const s = String(dataUrl || '')
  if (s.startsWith('data:image/png')) return 'PNG'
  if (s.startsWith('data:image/jpeg') || s.startsWith('data:image/jpg')) return 'JPEG'
  if (s.startsWith('data:image/webp')) return 'WEBP'
  return null
}

export const downloadInvoicePdf = async ({ invoice, language = 'en', tenant }) => {
  if (!invoice) return

  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const primary = tenant?.branding?.primaryColor || '#2563EB'
  const primaryRgb = hexToRgb(primary) || { r: 37, g: 99, b: 235 }
  const lightRgb = mixRgb(primaryRgb, { r: 255, g: 255, b: 255 }, 0.88)
  const primaryLight = rgbToHex(lightRgb)

  const logo = tenant?.branding?.logo || null
  const logoType = getLogoImageType(logo)

  const seller = invoice.seller || {}
  const buyer = invoice.buyer || {}

  const currencyOpts = { language, currency: 'SAR', currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }

  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : []

  const subtotal = Number(invoice.taxableAmount ?? invoice.subtotalAmount ?? 0)
  const totalTax = Number(invoice.totalTax ?? 0)
  const grandTotal = Number(invoice.grandTotal ?? 0)

  const title = language === 'ar' ? 'فاتورة' : 'Invoice'
  const customerLabel = invoice.flow === 'purchase'
    ? (language === 'ar' ? 'المشتري' : 'Buyer')
    : (language === 'ar' ? 'العميل' : 'Customer')

  const invoiceMeta = [
    { k: language === 'ar' ? 'رقم الفاتورة' : 'Invoice #', v: invoice.invoiceNumber },
    { k: language === 'ar' ? 'التاريخ' : 'Date', v: formatDateTime(invoice.issueDate, language) },
    { k: language === 'ar' ? 'النوع' : 'Type', v: invoice.transactionType },
    { k: language === 'ar' ? 'التدفق' : 'Flow', v: invoice.flow || 'sell' },
    invoice?.zatca?.submissionStatus ? { k: language === 'ar' ? 'حالة ZATCA' : 'ZATCA', v: invoice.zatca.submissionStatus } : null,
  ].filter(Boolean)

  const metaHtml = invoiceMeta
    .map((m) => `<div style="display:flex; justify-content:space-between; gap:12px;">
      <div style="color:#64748b;">${escapeHtml(m.k)}</div>
      <div style="font-weight:600;">${escapeHtml(safeText(m.v))}</div>
    </div>`)
    .join('')

  const itemsHtml = lineItems
    .map((l, idx) => {
      const qty = Number(l.quantity || 0)
      const unitPrice = Number(l.unitPrice || 0)
      const taxAmount = Number(l.taxAmount ?? (qty * unitPrice * Number(l.taxRate || 0) / 100))
      const lineTotal = Number(l.lineTotalWithTax ?? (qty * unitPrice + taxAmount))

      return `<tr>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; text-align:center;">${idx + 1}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0;">${escapeHtml(l.productName || l.description || '')}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; text-align:center;">${escapeHtml(qty)}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; text-align:right; white-space:nowrap;">${escapeHtml(formatCurrency(unitPrice, currencyOpts))}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; text-align:right; white-space:nowrap;">${escapeHtml(formatCurrency(taxAmount, currencyOpts))}</td>
        <td style="padding:10px 8px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:700; white-space:nowrap;">${escapeHtml(formatCurrency(lineTotal, currencyOpts))}</td>
      </tr>`
    })
    .join('')

  const sellerName = language === 'ar' ? seller.nameAr || seller.name : seller.name || seller.nameAr
  const buyerName = language === 'ar' ? buyer.nameAr || buyer.name : buyer.name || buyer.nameAr

  const rootDir = language === 'ar' ? 'rtl' : 'ltr'
  const align = language === 'ar' ? 'right' : 'left'
  const flexDir = language === 'ar' ? 'row-reverse' : 'row'

  const docHtml = `
  <div dir="${rootDir}" style="width:515px; font-family:Arial, sans-serif; color:#0f172a;">
    <div style="background:${escapeHtml(primary)}; color:white; border-radius:16px; padding:18px 18px 16px;">
      <div style="display:flex; flex-direction:${flexDir}; justify-content:space-between; align-items:center; gap:12px;">
        <div style="display:flex; flex-direction:${flexDir}; align-items:center; gap:12px;">
          ${logo && logoType ? `<img src="${escapeHtml(logo)}" style="height:36px; max-width:160px; object-fit:contain; background:white; padding:6px 10px; border-radius:12px;" />` : ''}
          <div>
            <div style="font-size:18px; font-weight:800; line-height:1.2; text-align:${align};">${escapeHtml(title)}</div>
            <div style="opacity:0.9; font-size:12px; text-align:${align};">${escapeHtml(sellerName || seller.name || '')}</div>
          </div>
        </div>
        <div style="text-align:${align}; font-size:12px;">
          <div style="font-weight:800; font-size:14px;">${escapeHtml(safeText(invoice.invoiceNumber))}</div>
          <div style="opacity:0.9;">${escapeHtml(formatDateTime(invoice.issueDate, language))}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:12px; background:${escapeHtml(primaryLight)}; border-radius:14px; padding:12px 14px; border:1px solid #e2e8f0;">
      <div style="display:grid; grid-template-columns:1fr; gap:8px; font-size:11px;">${metaHtml}</div>
    </div>

    <div style="display:flex; flex-direction:${flexDir}; gap:12px; margin-top:12px;">
      <div style="flex:1; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:12px;">
        <div style="font-size:11px; color:#64748b; margin-bottom:6px; text-align:${align};">${escapeHtml(language === 'ar' ? 'البائع' : 'Seller')}</div>
        <div style="font-size:13px; font-weight:800; text-align:${align};">${escapeHtml(sellerName || '')}</div>
        ${seller.vatNumber ? `<div style="margin-top:6px; font-size:11px; color:#334155; text-align:${align};">${escapeHtml(language === 'ar' ? 'الرقم الضريبي' : 'VAT')}: <span style="font-weight:700;">${escapeHtml(seller.vatNumber)}</span></div>` : ''}
        ${(seller.address?.city || seller.address?.district) ? `<div style="margin-top:6px; font-size:11px; color:#334155; text-align:${align};">${escapeHtml([seller.address?.city, seller.address?.district].filter(Boolean).join(', '))}</div>` : ''}
      </div>

      <div style="flex:1; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:12px;">
        <div style="font-size:11px; color:#64748b; margin-bottom:6px; text-align:${align};">${escapeHtml(customerLabel)}</div>
        <div style="font-size:13px; font-weight:800; text-align:${align};">${escapeHtml(buyerName || '')}</div>
        ${buyer.vatNumber ? `<div style="margin-top:6px; font-size:11px; color:#334155; text-align:${align};">${escapeHtml(language === 'ar' ? 'الرقم الضريبي' : 'VAT')}: <span style="font-weight:700;">${escapeHtml(buyer.vatNumber)}</span></div>` : ''}
        ${(buyer.address?.city || buyer.address?.district) ? `<div style="margin-top:6px; font-size:11px; color:#334155; text-align:${align};">${escapeHtml([buyer.address?.city, buyer.address?.district].filter(Boolean).join(', '))}</div>` : ''}
      </div>
    </div>

    <div style="margin-top:12px; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; background:white;">
      <table style="width:100%; border-collapse:collapse; font-size:11px;">
        <thead>
          <tr style="background:${escapeHtml(primaryLight)};">
            <th style="padding:10px 8px; text-align:center;">#</th>
            <th style="padding:10px 8px; text-align:${align};">${escapeHtml(language === 'ar' ? 'الوصف' : 'Description')}</th>
            <th style="padding:10px 8px; text-align:center;">${escapeHtml(language === 'ar' ? 'الكمية' : 'Qty')}</th>
            <th style="padding:10px 8px; text-align:right;">${escapeHtml(language === 'ar' ? 'سعر الوحدة' : 'Unit Price')}</th>
            <th style="padding:10px 8px; text-align:right;">${escapeHtml(language === 'ar' ? 'الضريبة' : 'Tax')}</th>
            <th style="padding:10px 8px; text-align:right;">${escapeHtml(language === 'ar' ? 'الإجمالي' : 'Total')}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || `<tr><td colspan="6" style="padding:14px; text-align:center; color:#64748b;">${escapeHtml(language === 'ar' ? 'لا توجد بنود' : 'No line items')}</td></tr>`}
        </tbody>
      </table>
    </div>

    <div style="display:flex; flex-direction:${flexDir}; justify-content:flex-end; margin-top:12px;">
      <div style="width:240px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:12px;">
        <div style="display:flex; justify-content:space-between; gap:12px; font-size:11px; margin-bottom:8px;">
          <div style="color:#64748b;">${escapeHtml(language === 'ar' ? 'الإجمالي قبل الضريبة' : 'Subtotal')}</div>
          <div style="font-weight:700; white-space:nowrap;">${escapeHtml(formatCurrency(subtotal, currencyOpts))}</div>
        </div>
        <div style="display:flex; justify-content:space-between; gap:12px; font-size:11px; margin-bottom:8px;">
          <div style="color:#64748b;">${escapeHtml(language === 'ar' ? 'الضريبة' : 'Tax')}</div>
          <div style="font-weight:700; white-space:nowrap;">${escapeHtml(formatCurrency(totalTax, currencyOpts))}</div>
        </div>
        <div style="height:1px; background:#e2e8f0; margin:10px 0;"></div>
        <div style="display:flex; justify-content:space-between; gap:12px; font-size:12px;">
          <div style="font-weight:900;">${escapeHtml(language === 'ar' ? 'الإجمالي' : 'Total')}</div>
          <div style="font-weight:900; color:${escapeHtml(primary)}; white-space:nowrap;">${escapeHtml(formatCurrency(grandTotal, currencyOpts))}</div>
        </div>
      </div>
    </div>

    <div style="margin-top:12px; color:#64748b; font-size:10px; text-align:${align};">
      ${escapeHtml(language === 'ar' ? 'تم إنشاء هذا الملف تلقائياً من النظام.' : 'This document was generated automatically by the system.')}
    </div>
  </div>
  `

  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-10000px'
  wrapper.style.top = '0'
  wrapper.style.background = 'white'
  wrapper.style.padding = '0'
  wrapper.innerHTML = docHtml
  document.body.appendChild(wrapper)

  try {
    const content = wrapper.firstElementChild
    await doc.html(content, {
      x: 40,
      y: 40,
      width: 515,
      html2canvas: {
        scale: 1,
        useCORS: true,
        backgroundColor: '#ffffff',
      },
      autoPaging: 'text',
    })

    const pageCount = doc.getNumberOfPages()
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    const generatedAt = `${language === 'ar' ? 'تاريخ الإنشاء' : 'Generated'}: ${formatDateTime(new Date(), language)}`

    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i)
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(generatedAt, 40, pageH - 22)
      doc.text(`${i} / ${pageCount}`, pageW - 40, pageH - 22, { align: 'right' })
    }

    const name = sanitizeFileName(invoice.invoiceNumber || 'invoice')
    doc.save(`${name}.pdf`)
  } finally {
    wrapper.remove()
  }
}
