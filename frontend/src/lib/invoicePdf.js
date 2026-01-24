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

const rgbArr = (rgb) => [rgb.r, rgb.g, rgb.b]

const detectImageFormat = (dataUrl) => {
  const m = /^data:image\/(png|jpeg|jpg);/i.exec(String(dataUrl || ''))
  if (!m) return null
  const ext = m[1].toLowerCase()
  return ext === 'jpg' ? 'JPEG' : ext === 'jpeg' ? 'JPEG' : 'PNG'
}

let tajawalRegularBase64
let tajawalBoldBase64
let tajawalLoadPromise

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const tryFetchFontBase64 = async (url) => {
  const res = await fetch(url)
  if (!res.ok) return null
  const buf = await res.arrayBuffer()
  return bufferToBase64(buf)
}

const ensureTajawalFont = async (doc) => {
  if (!doc || typeof doc.addFileToVFS !== 'function' || typeof doc.addFont !== 'function') return false

  if (!tajawalLoadPromise) {
    tajawalLoadPromise = (async () => {
      tajawalRegularBase64 = await tryFetchFontBase64('/fonts/Tajawal-Regular.ttf')
      tajawalBoldBase64 = await tryFetchFontBase64('/fonts/Tajawal-Bold.ttf')
    })()
  }

  try {
    await tajawalLoadPromise
  } catch {
    tajawalLoadPromise = null
    return false
  }

  if (!tajawalRegularBase64) {
    tajawalLoadPromise = null
    return false
  }

  try {
    doc.addFileToVFS('Tajawal-Regular.ttf', tajawalRegularBase64)
    doc.addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal')
    if (tajawalBoldBase64) {
      doc.addFileToVFS('Tajawal-Bold.ttf', tajawalBoldBase64)
      doc.addFont('Tajawal-Bold.ttf', 'Tajawal', 'bold')
    }
    doc.setFont('Tajawal', 'normal')
    return true
  } catch {
    return false
  }
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

export const downloadInvoicePdf = async ({ invoice, language = 'en', tenant }) => {
  if (!invoice) return

  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule

  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule?.default || autoTableModule

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const footerH = 44
  const headerH = 98
  const topMargin = headerH + 26

  const isRtl = language === 'ar'
  const align = isRtl ? 'right' : 'left'
  const oppositeAlign = isRtl ? 'left' : 'right'

  const arabicFontReady = isRtl ? await ensureTajawalFont(doc) : false

  if (isRtl && typeof doc.setR2L === 'function') {
    try {
      doc.setR2L(true)
    } catch {
      // ignore
    }
  }

  const primary = tenant?.branding?.primaryColor || '#2563EB'
  const primaryRgb = hexToRgb(primary) || { r: 37, g: 99, b: 235 }
  const lightRgb = mixRgb(primaryRgb, { r: 255, g: 255, b: 255 }, 0.90)

  const secondary = tenant?.branding?.secondaryColor || '#D946EF'
  const secondaryRgb = hexToRgb(secondary) || { r: 217, g: 70, b: 239 }

  const templateId = Number(tenant?.settings?.invoicePdfTemplate || 1)

  const theme = (() => {
    const base = {
      sidebarW: 0,
      headerBgRgb: null,
      headerTitleRgb: { r: 15, g: 23, b: 42 },
      headerMutedRgb: { r: 100, g: 116, b: 139 },
      metaFillRgb: lightRgb,
      metaStrokeRgb: { r: 226, g: 232, b: 240 },
      boxFillRgb: { r: 255, g: 255, b: 255 },
      boxStrokeRgb: { r: 226, g: 232, b: 240 },
      tableHeadFillRgb: lightRgb,
      tableHeadTextRgb: { r: 15, g: 23, b: 42 },
      altRowFillRgb: { r: 248, g: 250, b: 252 },
      drawFrame: () => {
        doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        doc.rect(0, 0, pageW, 6, 'F')
      },
    }

    const drawGradientTop = () => {
      const steps = 18
      const stepW = pageW / steps
      for (let i = 0; i < steps; i += 1) {
        const w = i / Math.max(1, steps - 1)
        const c = mixRgb(primaryRgb, secondaryRgb, w)
        doc.setFillColor(c.r, c.g, c.b)
        doc.rect(i * stepW, 0, stepW + 1, 6, 'F')
      }
    }

    if (templateId === 2) {
      return {
        ...base,
        drawFrame: drawGradientTop,
      }
    }

    if (templateId === 3) {
      const sidebarW = 56
      return {
        ...base,
        sidebarW,
        drawFrame: () => {
          const x = isRtl ? pageW - sidebarW : 0
          doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
          doc.rect(x, 0, sidebarW, pageH, 'F')
        },
      }
    }

    if (templateId === 4) {
      return {
        ...base,
        metaFillRgb: { r: 255, g: 255, b: 255 },
        tableHeadFillRgb: primaryRgb,
        tableHeadTextRgb: { r: 255, g: 255, b: 255 },
        altRowFillRgb: { r: 255, g: 255, b: 255 },
        drawFrame: () => {
          doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
          doc.rect(0, 0, pageW, 2, 'F')
        },
      }
    }

    if (templateId === 5) {
      const headerBgRgb = { r: 15, g: 23, b: 42 }
      return {
        ...base,
        headerBgRgb,
        headerTitleRgb: { r: 255, g: 255, b: 255 },
        headerMutedRgb: { r: 203, g: 213, b: 225 },
        metaFillRgb: { r: 255, g: 255, b: 255 },
        tableHeadFillRgb: headerBgRgb,
        tableHeadTextRgb: { r: 255, g: 255, b: 255 },
        drawFrame: () => {
          doc.setFillColor(headerBgRgb.r, headerBgRgb.g, headerBgRgb.b)
          doc.rect(0, 0, pageW, headerH, 'F')
          drawGradientTop()
        },
      }
    }

    return base
  })()

  const contentLeft = margin + (theme.sidebarW && !isRtl ? theme.sidebarW : 0)
  const contentRight = margin + (theme.sidebarW && isRtl ? theme.sidebarW : 0)
  const contentRightEdge = pageW - contentRight
  const contentW = pageW - contentLeft - contentRight

  const logo = tenant?.branding?.logo || null
  const logoFormat = detectImageFormat(logo)

  const qr = invoice?.zatca?.qrCodeImage || null
  const qrFormat = detectImageFormat(qr)

  const seller = invoice.seller || {}
  const buyer = invoice.buyer || {}

  const currency = invoice.currency || tenant?.settings?.currency || 'SAR'
  const currencyOpts = { language, currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }

  const money = (value) => formatCurrency(Number(value || 0), currencyOpts)
  const txt = (value) => safeText(value)

  const shape = (value) => {
    const raw = safeText(value)
    if (!raw) return ''
    if (isRtl && typeof doc.processArabic === 'function') {
      try {
        return doc.processArabic(raw)
      } catch {
        return raw
      }
    }
    return raw
  }

  const sellerName = isRtl ? (seller.nameAr || seller.name) : (seller.name || seller.nameAr)
  const buyerName = isRtl ? (buyer.nameAr || buyer.name) : (buyer.name || buyer.nameAr)

  const title = isRtl ? 'فاتورة' : 'Invoice'
  const customerLabel = invoice.flow === 'purchase'
    ? (isRtl ? 'المشتري' : 'Buyer')
    : (isRtl ? 'العميل' : 'Customer')

  const drawHeader = ({ pageNumber }) => {
    theme.drawFrame({ pageNumber })

    const y = 18
    const boxPad = 6
    const logoW = 92
    const logoH = 28
    const qrSize = 72

    if (logo && logoFormat) {
      const x = isRtl ? contentRightEdge - logoW : contentLeft
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(x - boxPad, y - boxPad, logoW + boxPad * 2, logoH + boxPad * 2, 10, 10, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(x - boxPad, y - boxPad, logoW + boxPad * 2, logoH + boxPad * 2, 10, 10, 'S')
      doc.addImage(logo, logoFormat, x, y, logoW, logoH)
    }

    if (qr && qrFormat && pageNumber === 1) {
      const x = isRtl ? contentLeft : contentRightEdge - qrSize
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(x - boxPad, y - boxPad, qrSize + boxPad * 2, qrSize + boxPad * 2, 10, 10, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(x - boxPad, y - boxPad, qrSize + boxPad * 2, qrSize + boxPad * 2, 10, 10, 'S')
      doc.addImage(qr, qrFormat, x, y, qrSize, qrSize)
    }

    const titleX = isRtl ? contentRightEdge : contentLeft
    const rightX = isRtl ? contentLeft : contentRightEdge

    doc.setTextColor(theme.headerTitleRgb.r, theme.headerTitleRgb.g, theme.headerTitleRgb.b)
    doc.setFontSize(16)
    doc.text(shape(title), titleX, y + 56, { align })

    doc.setFontSize(10)
    doc.setTextColor(theme.headerMutedRgb.r, theme.headerMutedRgb.g, theme.headerMutedRgb.b)
    doc.text(shape(sellerName || ''), titleX, y + 72, { align })

    doc.setFontSize(12)
    doc.setTextColor(theme.headerTitleRgb.r, theme.headerTitleRgb.g, theme.headerTitleRgb.b)
    doc.text(shape(txt(invoice.invoiceNumber)), rightX, y + 56, { align: oppositeAlign })

    doc.setFontSize(9)
    doc.setTextColor(theme.headerMutedRgb.r, theme.headerMutedRgb.g, theme.headerMutedRgb.b)
    doc.text(shape(formatDateTime(invoice.issueDate, language)), rightX, y + 72, { align: oppositeAlign })
  }

  drawHeader({ pageNumber: 1 })

  const cardX = contentLeft
  const cardW = contentW
  const cardY = topMargin
  const metaH = 62

  doc.setFillColor(theme.metaFillRgb.r, theme.metaFillRgb.g, theme.metaFillRgb.b)
  doc.setDrawColor(theme.metaStrokeRgb.r, theme.metaStrokeRgb.g, theme.metaStrokeRgb.b)
  doc.roundedRect(cardX, cardY, cardW, metaH, 14, 14, 'FD')

  const metaRows = [
    { k: isRtl ? 'رقم الفاتورة' : 'Invoice #', v: invoice.invoiceNumber },
    { k: isRtl ? 'التاريخ' : 'Date', v: formatDateTime(invoice.issueDate, language) },
    { k: isRtl ? 'النوع' : 'Type', v: invoice.transactionType },
    { k: isRtl ? 'التدفق' : 'Flow', v: invoice.flow || 'sell' },
    invoice?.zatca?.submissionStatus ? { k: isRtl ? 'حالة ZATCA' : 'ZATCA', v: invoice.zatca.submissionStatus } : null,
  ].filter(Boolean)

  const leftColX = isRtl ? cardX + cardW - 14 : cardX + 14
  const rightColX = isRtl ? cardX + 14 : cardX + cardW - 14

  doc.setFontSize(9)
  let metaY = cardY + 22

  for (let i = 0; i < metaRows.length; i += 2) {
    const a = metaRows[i]
    const b = metaRows[i + 1]

    doc.setTextColor(100)
    doc.text(shape(`${txt(a.k)}:`), leftColX, metaY, { align })
    doc.setTextColor(15, 23, 42)
    doc.text(shape(txt(a.v)), leftColX, metaY + 14, { align })

    if (b) {
      doc.setTextColor(100)
      doc.text(shape(`${txt(b.k)}:`), rightColX, metaY, { align: isRtl ? 'left' : 'right' })
      doc.setTextColor(15, 23, 42)
      doc.text(shape(txt(b.v)), rightColX, metaY + 14, { align: isRtl ? 'left' : 'right' })
    }

    metaY += 32
  }

  const boxGap = 12
  const boxY = cardY + metaH + 12
  const boxH = 92
  const boxW = (cardW - boxGap) / 2

  const drawPartyBox = ({ x, y, label, name, vat, address }) => {
    doc.setFillColor(theme.boxFillRgb.r, theme.boxFillRgb.g, theme.boxFillRgb.b)
    doc.setDrawColor(theme.boxStrokeRgb.r, theme.boxStrokeRgb.g, theme.boxStrokeRgb.b)
    doc.roundedRect(x, y, boxW, boxH, 14, 14, 'FD')

    const pad = 12
    const tx = isRtl ? x + boxW - pad : x + pad

    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(shape(label), tx, y + 22, { align })

    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(shape(name || ''), tx, y + 38, { align, maxWidth: boxW - pad * 2 })

    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    let ty = y + 56

    if (vat) {
      const vatLabel = isRtl ? 'الرقم الضريبي' : 'VAT'
      doc.text(shape(`${vatLabel}: ${vat}`), tx, ty, { align, maxWidth: boxW - pad * 2 })
      ty += 14
    }

    if (address) {
      doc.text(shape(address), tx, ty, { align, maxWidth: boxW - pad * 2 })
    }
  }

  const sellerAddress = [seller.address?.city, seller.address?.district].filter(Boolean).join(', ')
  const buyerAddress = [buyer.address?.city, buyer.address?.district].filter(Boolean).join(', ')

  const leftX = contentLeft
  const rightBoxX = contentLeft + boxW + boxGap

  const firstBoxX = isRtl ? rightBoxX : leftX
  const secondBoxX = isRtl ? leftX : rightBoxX

  drawPartyBox({
    x: firstBoxX,
    y: boxY,
    label: isRtl ? 'البائع' : 'Seller',
    name: sellerName,
    vat: seller.vatNumber,
    address: sellerAddress,
  })

  drawPartyBox({
    x: secondBoxX,
    y: boxY,
    label: customerLabel,
    name: buyerName,
    vat: buyer.vatNumber,
    address: buyerAddress,
  })

  let y = boxY + boxH + 24

  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(shape(isRtl ? 'البنود' : 'Items'), isRtl ? contentRightEdge : contentLeft, y, { align })
  y += 10

  const lineItems = Array.isArray(invoice.lineItems) ? invoice.lineItems : []

  const itemsBaseWidths = {
    idx: 28,
    desc: 214,
    qty: 48,
    unit: 72,
    tax: 66,
    total: 72,
  }
  const baseSum = Object.values(itemsBaseWidths).reduce((a, b) => a + b, 0)
  const scale = Math.min(1, contentW / baseSum)
  const idxW = Math.max(22, Math.round(itemsBaseWidths.idx * scale))
  const qtyW = Math.max(36, Math.round(itemsBaseWidths.qty * scale))
  const unitW = Math.max(56, Math.round(itemsBaseWidths.unit * scale))
  const taxW = Math.max(50, Math.round(itemsBaseWidths.tax * scale))
  const totalW = Math.max(56, Math.round(itemsBaseWidths.total * scale))
  const fixedW = idxW + qtyW + unitW + taxW + totalW
  const descW = Math.max(110, Math.floor(contentW - fixedW))

  const bodyRows = (lineItems.length ? lineItems : [{}]).map((l, idx) => {
    if (!l || !l.productName) {
      return [
        '',
        shape(isRtl ? 'لا توجد بنود' : 'No line items'),
        '',
        '',
        '',
        '',
      ]
    }

    const qty = Number(l.quantity || 0)
    const unitPrice = Number(l.unitPrice || 0)
    const taxRate = Number(l.taxRate || 0)
    const taxAmount = Number(l.taxAmount ?? (Number(l.lineTotal || qty * unitPrice) * taxRate / 100))
    const lineTotalWithTax = Number(l.lineTotalWithTax ?? (Number(l.lineTotal || qty * unitPrice) + taxAmount))
    const desc = isRtl ? (l.productNameAr || l.productName || l.description) : (l.productName || l.productNameAr || l.description)

    return [
      String(idx + 1),
      shape(desc || ''),
      String(qty),
      money(unitPrice),
      money(taxAmount),
      money(lineTotalWithTax),
    ]
  })

  autoTable(doc, {
    startY: y,
    margin: { left: contentLeft, right: contentRight, top: topMargin, bottom: footerH },
    head: [[
      '#',
      isRtl ? 'الوصف' : 'Description',
      isRtl ? 'الكمية' : 'Qty',
      isRtl ? 'سعر الوحدة' : 'Unit Price',
      isRtl ? 'الضريبة' : 'Tax',
      isRtl ? 'الإجمالي' : 'Total',
    ]],
    body: bodyRows,
    styles: {
      fontSize: 9,
      cellPadding: 6,
      ...(arabicFontReady ? { font: 'Tajawal' } : {}),
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: rgbArr(theme.tableHeadFillRgb),
      textColor: rgbArr(theme.tableHeadTextRgb),
      fontStyle: 'bold',
    },
    alternateRowStyles: theme.altRowFillRgb ? { fillColor: rgbArr(theme.altRowFillRgb) } : {},
    columnStyles: {
      0: { cellWidth: idxW, halign: 'center' },
      1: { cellWidth: descW, halign: isRtl ? 'right' : 'left' },
      2: { cellWidth: qtyW, halign: 'center' },
      3: { cellWidth: unitW, halign: 'right' },
      4: { cellWidth: taxW, halign: 'right' },
      5: { cellWidth: totalW, halign: 'right', fontStyle: 'bold' },
    },
    didDrawPage: () => {
      const pageNumber = doc.getCurrentPageInfo().pageNumber
      drawHeader({ pageNumber })
    },
  })

  const taxable = Number(invoice.taxableAmount ?? invoice.subtotal ?? 0)
  const totalTax = Number(invoice.totalTax ?? 0)
  const grandTotal = Number(invoice.grandTotal ?? 0)

  const totalsRows = [
    [isRtl ? 'الإجمالي قبل الضريبة' : 'Subtotal', money(taxable)],
    [isRtl ? 'الضريبة' : 'Tax', money(totalTax)],
    [isRtl ? 'الإجمالي' : 'Total', money(grandTotal)],
  ]

  const totalsW = 220
  const totalsLeft = isRtl ? contentLeft : contentRightEdge - totalsW

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    margin: { left: totalsLeft, right: contentRight, top: topMargin, bottom: footerH },
    tableWidth: totalsW,
    theme: 'plain',
    body: totalsRows,
    styles: {
      fontSize: 10,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      ...(arabicFontReady ? { font: 'Tajawal' } : {}),
      textColor: [15, 23, 42],
    },
    columnStyles: {
      0: { cellWidth: 120, halign: align, textColor: [100, 116, 139] },
      1: { cellWidth: 100, halign: oppositeAlign },
    },
    didParseCell: (data) => {
      if (data.row.index !== 2) return
      data.cell.styles.fontStyle = 'bold'
      if (data.column.index === 1) {
        data.cell.styles.textColor = [primaryRgb.r, primaryRgb.g, primaryRgb.b]
      }
    },
    didDrawPage: () => {
      const pageNumber = doc.getCurrentPageInfo().pageNumber
      drawHeader({ pageNumber })
    },
  })

  const pageCount = doc.getNumberOfPages()
  const generatedAt = `${isRtl ? 'تاريخ الإنشاء' : 'Generated'}: ${formatDateTime(new Date(), language)}`

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(100)

    doc.text(
      shape(generatedAt),
      isRtl ? contentRightEdge : contentLeft,
      pageH - 22,
      { align }
    )

    doc.text(
      `${i} / ${pageCount}`,
      isRtl ? contentLeft : contentRightEdge,
      pageH - 22,
      { align: oppositeAlign }
    )
  }

  const name = sanitizeFileName(invoice.invoiceNumber || 'invoice')
  doc.save(`${name}.pdf`)
}
