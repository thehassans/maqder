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

  // Ultra-premium dark green theme
  const headerColor = '#0D4F3C'
  const headerColorLight = '#E8F5F0'
  const accentColor = '#059669'

  // Company logo from tenant settings
  const logo = tenant?.branding?.logo || null

  const seller = invoice.seller || {}
  const buyer = invoice.buyer || {}

  const currencyOpts = { language, currency: 'SAR', currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }

  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : []

  const subtotal = Number(invoice.taxableAmount ?? invoice.subtotalAmount ?? 0)
  const totalTax = Number(invoice.totalTax ?? 0)
  const grandTotal = Number(invoice.grandTotal ?? 0)

  const title = language === 'ar' ? 'فاتورة ضريبية' : 'TAX INVOICE'
  const customerLabel = invoice.flow === 'purchase'
    ? (language === 'ar' ? 'المورد' : 'Supplier')
    : (language === 'ar' ? 'العميل' : 'Bill To')

  const sellerName = language === 'ar' ? seller.nameAr || seller.name : seller.name || seller.nameAr
  const buyerName = language === 'ar' ? buyer.nameAr || buyer.name : buyer.name || buyer.nameAr

  const rootDir = language === 'ar' ? 'rtl' : 'ltr'
  const alignStart = language === 'ar' ? 'right' : 'left'
  const alignEnd = language === 'ar' ? 'left' : 'right'

  // Build line items HTML
  const itemsHtml = lineItems
    .map((l, idx) => {
      const qty = Number(l.quantity || 0)
      const unitPrice = Number(l.unitPrice || 0)
      const taxAmount = Number(l.taxAmount ?? (qty * unitPrice * Number(l.taxRate || 0) / 100))
      const lineTotal = Number(l.lineTotalWithTax ?? (qty * unitPrice + taxAmount))
      const bgColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'

      return `<tr style="background:${bgColor};">
        <td style="padding:14px 12px; text-align:center; font-weight:600; color:#64748b;">${idx + 1}</td>
        <td style="padding:14px 12px; font-weight:500;">${escapeHtml(l.productName || l.description || '')}</td>
        <td style="padding:14px 12px; text-align:center; font-weight:600;">${qty}</td>
        <td style="padding:14px 12px; text-align:right; font-family:monospace;">${escapeHtml(formatCurrency(unitPrice, currencyOpts))}</td>
        <td style="padding:14px 12px; text-align:right; font-family:monospace; color:#64748b;">${escapeHtml(formatCurrency(taxAmount, currencyOpts))}</td>
        <td style="padding:14px 12px; text-align:right; font-weight:700; font-family:monospace;">${escapeHtml(formatCurrency(lineTotal, currencyOpts))}</td>
      </tr>`
    })
    .join('')

  const docHtml = `
  <div dir="${rootDir}" style="width:515px; font-family:'Segoe UI', Arial, sans-serif; color:#1e293b; line-height:1.4;">
    
    <!-- HEADER -->
    <div style="background:linear-gradient(135deg, ${headerColor} 0%, #064E3B 100%); color:white; border-radius:0; padding:28px 24px; position:relative;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div>
          ${logo ? `<img src="${escapeHtml(logo)}" style="height:48px; max-width:180px; object-fit:contain; margin-bottom:12px; background:white; padding:8px 12px; border-radius:8px;" />` : ''}
          <div style="font-size:28px; font-weight:800; letter-spacing:1px; margin-top:${logo ? '8px' : '0'};">${escapeHtml(title)}</div>
          <div style="font-size:13px; opacity:0.9; margin-top:4px;">${escapeHtml(sellerName || '')}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px; opacity:0.8; text-transform:uppercase; letter-spacing:1px;">Invoice Number</div>
          <div style="font-size:18px; font-weight:800; margin-top:2px;">${escapeHtml(safeText(invoice.invoiceNumber))}</div>
          <div style="font-size:11px; opacity:0.8; text-transform:uppercase; letter-spacing:1px; margin-top:12px;">Issue Date</div>
          <div style="font-size:13px; font-weight:600; margin-top:2px;">${escapeHtml(formatDateTime(invoice.issueDate, language))}</div>
        </div>
      </div>
    </div>

    <!-- INVOICE META BAR -->
    <div style="background:${headerColorLight}; padding:16px 24px; display:flex; justify-content:space-between; border-bottom:2px solid ${accentColor};">
      <div>
        <span style="font-size:11px; color:#64748b; text-transform:uppercase;">Type</span>
        <span style="font-size:13px; font-weight:700; margin-left:8px; color:${headerColor};">${escapeHtml(invoice.transactionType || 'B2C')}</span>
      </div>
      <div>
        <span style="font-size:11px; color:#64748b; text-transform:uppercase;">Status</span>
        <span style="font-size:13px; font-weight:700; margin-left:8px; color:${headerColor};">${escapeHtml(invoice?.zatca?.submissionStatus || 'Draft')}</span>
      </div>
      <div>
        <span style="font-size:11px; color:#64748b; text-transform:uppercase;">Flow</span>
        <span style="font-size:13px; font-weight:700; margin-left:8px; color:${headerColor};">${escapeHtml(invoice.flow || 'sell')}</span>
      </div>
    </div>

    <!-- PARTIES -->
    <div style="display:flex; gap:20px; margin:24px 24px 0;">
      <!-- SELLER -->
      <div style="flex:1; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">From</div>
        <div style="font-size:15px; font-weight:800; color:${headerColor};">${escapeHtml(sellerName || '')}</div>
        ${seller.vatNumber ? `<div style="margin-top:10px; font-size:12px; color:#475569;"><span style="color:#94a3b8;">VAT:</span> <span style="font-weight:700; font-family:monospace;">${escapeHtml(seller.vatNumber)}</span></div>` : ''}
        ${(seller.address?.city || seller.address?.district) ? `<div style="margin-top:6px; font-size:12px; color:#64748b;">${escapeHtml([seller.address?.city, seller.address?.district].filter(Boolean).join(', '))}</div>` : ''}
      </div>

      <!-- BUYER -->
      <div style="flex:1; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:18px; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="font-size:10px; color:#64748b; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px; border-bottom:1px solid #e2e8f0; padding-bottom:8px;">${escapeHtml(customerLabel)}</div>
        <div style="font-size:15px; font-weight:800; color:${headerColor};">${escapeHtml(buyerName || '-')}</div>
        ${buyer.vatNumber ? `<div style="margin-top:10px; font-size:12px; color:#475569;"><span style="color:#94a3b8;">VAT:</span> <span style="font-weight:700; font-family:monospace;">${escapeHtml(buyer.vatNumber)}</span></div>` : ''}
        ${(buyer.address?.city || buyer.address?.district) ? `<div style="margin-top:6px; font-size:12px; color:#64748b;">${escapeHtml([buyer.address?.city, buyer.address?.district].filter(Boolean).join(', '))}</div>` : ''}
      </div>
    </div>

    <!-- LINE ITEMS TABLE -->
    <div style="margin:24px 24px 0; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
      <table style="width:100%; border-collapse:collapse; font-size:12px;">
        <thead>
          <tr style="background:${headerColor}; color:white;">
            <th style="padding:14px 12px; text-align:center; font-weight:600; width:40px;">#</th>
            <th style="padding:14px 12px; text-align:left; font-weight:600;">Description</th>
            <th style="padding:14px 12px; text-align:center; font-weight:600; width:60px;">Qty</th>
            <th style="padding:14px 12px; text-align:right; font-weight:600; width:100px;">Unit Price</th>
            <th style="padding:14px 12px; text-align:right; font-weight:600; width:80px;">Tax</th>
            <th style="padding:14px 12px; text-align:right; font-weight:600; width:100px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml || `<tr><td colspan="6" style="padding:24px; text-align:center; color:#94a3b8; font-style:italic;">No line items</td></tr>`}
        </tbody>
      </table>
    </div>

    <!-- TOTALS -->
    <div style="margin:24px 24px 0; display:flex; justify-content:flex-end;">
      <div style="width:280px; background:#ffffff; border:2px solid ${headerColor}; border-radius:12px; overflow:hidden;">
        <div style="padding:14px 18px; display:flex; justify-content:space-between; border-bottom:1px solid #e2e8f0;">
          <span style="color:#64748b; font-size:13px;">Subtotal</span>
          <span style="font-weight:600; font-family:monospace; font-size:13px;">${escapeHtml(formatCurrency(subtotal, currencyOpts))}</span>
        </div>
        <div style="padding:14px 18px; display:flex; justify-content:space-between; border-bottom:1px solid #e2e8f0;">
          <span style="color:#64748b; font-size:13px;">VAT (15%)</span>
          <span style="font-weight:600; font-family:monospace; font-size:13px;">${escapeHtml(formatCurrency(totalTax, currencyOpts))}</span>
        </div>
        <div style="padding:16px 18px; display:flex; justify-content:space-between; background:${headerColor}; color:white;">
          <span style="font-weight:800; font-size:15px;">TOTAL</span>
          <span style="font-weight:800; font-family:monospace; font-size:17px;">${escapeHtml(formatCurrency(grandTotal, currencyOpts))}</span>
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="margin:32px 24px 0; padding-top:16px; border-top:1px solid #e2e8f0;">
      <div style="color:#94a3b8; font-size:10px; text-align:center;">
        ${escapeHtml(language === 'ar' ? 'تم إنشاء هذه الفاتورة إلكترونياً وهي صالحة بدون توقيع.' : 'This invoice was generated electronically and is valid without signature.')}
      </div>
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
      y: 30,
      width: 515,
      html2canvas: {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      },
      autoPaging: 'text',
    })

    const pageCount = doc.getNumberOfPages()
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()

    const generatedAt = `${language === 'ar' ? 'تاريخ الإنشاء' : 'Generated'}: ${formatDateTime(new Date(), language)}`

    for (let i = 1; i <= pageCount; i += 1) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(generatedAt, 40, pageH - 20)
      doc.text(`Page ${i} of ${pageCount}`, pageW - 40, pageH - 20, { align: 'right' })
    }

    const name = sanitizeFileName(invoice.invoiceNumber || 'invoice')
    doc.save(`${name}.pdf`)
  } finally {
    wrapper.remove()
  }
}
