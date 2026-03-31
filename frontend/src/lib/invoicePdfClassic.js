const sanitizeFileName = (value) => {
  return String(value || 'invoice')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

const detectImageFormat = (dataUrl) => {
  const match = /^data:image\/(png|jpeg|jpg);/i.exec(String(dataUrl || ''))
  if (!match) return null
  const ext = match[1].toLowerCase()
  return ext === 'jpg' || ext === 'jpeg' ? 'JPEG' : 'PNG'
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

const formatInvoiceDate = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatInvoiceTime = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const numberToEnglishWords = (value) => {
  const small = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

  const toWords = (n) => {
    if (n < 20) return small[n]
    if (n < 100) {
      const rem = n % 10
      return `${tens[Math.floor(n / 10)]}${rem ? `-${small[rem]}` : ''}`
    }
    if (n < 1000) {
      const rem = n % 100
      return `${small[Math.floor(n / 100)]} hundred${rem ? ` ${toWords(rem)}` : ''}`
    }
    if (n < 1000000) {
      const rem = n % 1000
      return `${toWords(Math.floor(n / 1000))} thousand${rem ? ` ${toWords(rem)}` : ''}`
    }
    if (n < 1000000000) {
      const rem = n % 1000000
      return `${toWords(Math.floor(n / 1000000))} million${rem ? ` ${toWords(rem)}` : ''}`
    }
    const rem = n % 1000000000
    return `${toWords(Math.floor(n / 1000000000))} billion${rem ? ` ${toWords(rem)}` : ''}`
  }

  const safe = Math.max(0, Math.floor(Number(value) || 0))
  return toWords(safe)
}

const amountToWords = (value, currency) => {
  const numeric = Number(value) || 0
  const whole = Math.floor(numeric)
  const fraction = Math.round((numeric - whole) * 100)
  const currencyLabel = currency === 'SAR' ? 'Saudi Riyals' : currency
  const wholeWords = numberToEnglishWords(whole)
  const fractionWords = fraction > 0 ? numberToEnglishWords(fraction) : 'zero'
  return `${wholeWords} ${currencyLabel} and ${fractionWords} Halalas only`.toUpperCase()
}

const money = (value, currency) => `${Number(value || 0).toFixed(2)} ${currency}`

const buildAddressLines = (party) => {
  return [
    [party?.address?.buildingNumber, party?.address?.street].filter(Boolean).join(' '),
    [party?.address?.district, party?.address?.city].filter(Boolean).join(' - '),
    [party?.address?.postalCode, party?.address?.country === 'SA' ? 'Saudi Arabia' : party?.address?.country].filter(Boolean).join(' '),
  ].filter(Boolean)
}

const buildPartyLines = (party) => {
  const lines = [party?.name || '']
  if (party?.nameAr) lines.push(party.nameAr)
  if (party?.crNumber) lines.push(`CR: ${party.crNumber}`)
  if (party?.vatNumber) lines.push(`VAT: ${party.vatNumber}`)
  buildAddressLines(party).forEach((line) => lines.push(line))
  if (party?.contactPhone) lines.push(`Mobile: ${party.contactPhone}`)
  if (party?.contactEmail) lines.push(party.contactEmail)
  return lines.filter(Boolean)
}

export const downloadInvoicePdf = async ({ invoice, language = 'en', tenant }) => {
  if (!invoice) return

  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule

  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule?.default || autoTableModule

  const pdfOrientation = tenant?.settings?.invoicePdfOrientation || 'portrait'
  const pdfPageSize = tenant?.settings?.invoicePdfPageSize || 'a4'
  const doc = new jsPDF({ orientation: pdfOrientation, unit: 'pt', format: pdfPageSize })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 34
  const contentW = pageW - margin * 2
  const footerY = pageH - 14
  const tableTop = 346
  const borderColor = [28, 28, 28]
  const headerFill = [229, 229, 229]
  const accentLine = [31, 107, 67]
  const arabicFontReady = await ensureTajawalFont(doc)
  const currency = invoice.currency || tenant?.settings?.currency || 'SAR'

  const setFont = (style = 'normal') => {
    if (!arabicFontReady) return
    try {
      doc.setFont('Tajawal', style)
    } catch {
      doc.setFont('Tajawal', 'normal')
    }
  }

  const shape = (value) => {
    const raw = safeText(value)
    if (!raw) return ''
    if (/[\u0600-\u06FF]/.test(raw) && typeof doc.processArabic === 'function') {
      try {
        return doc.processArabic(raw)
      } catch {
        return raw
      }
    }
    return raw
  }

  const writeText = (value, x, y, options = {}) => {
    const payload = Array.isArray(value) ? value.map(shape) : shape(value)
    doc.text(payload, x, y, options)
  }

  const writeWrappedLines = (lines, x, startY, maxWidth, lineHeight = 12) => {
    let currentY = startY
    lines.forEach((line) => {
      const parts = doc.splitTextToSize(shape(line), maxWidth)
      parts.forEach((part) => {
        writeText(part, x, currentY)
        currentY += lineHeight
      })
    })
    return currentY
  }

  const business = tenant?.business || {}
  const seller = {
    ...business,
    ...invoice?.seller,
    address: {
      ...(business.address || {}),
      ...(invoice?.seller?.address || {}),
    },
    name: invoice?.seller?.name || business.legalNameEn || tenant?.name || '',
    nameAr: invoice?.seller?.nameAr || business.legalNameAr || '',
    vatNumber: invoice?.seller?.vatNumber || business.vatNumber || '',
    crNumber: invoice?.seller?.crNumber || business.crNumber || '',
    contactPhone: invoice?.seller?.contactPhone || business.contactPhone || '',
    contactEmail: invoice?.seller?.contactEmail || business.contactEmail || '',
  }

  const buyer = {
    ...(invoice?.buyer || {}),
    address: {
      ...(invoice?.buyer?.address || {}),
    },
    name: invoice?.buyer?.name || 'Customer',
    nameAr: invoice?.buyer?.nameAr || '',
  }

  const logo = tenant?.branding?.logo || null
  const logoFormat = detectImageFormat(logo)
  const qr = invoice?.zatca?.qrCodeImage || null
  const qrFormat = detectImageFormat(qr)

  const drawHeader = (pageNumber) => {
    doc.setDrawColor(...borderColor)
    doc.setTextColor(...borderColor)
    doc.setLineWidth(0.8)

    const topY = 24
    const logoW = 54
    const logoH = 54
    const qrSize = 82
    const qrX = pageW - margin - qrSize
    const companyX = logo && logoFormat && pageNumber === 1 ? margin + logoW + 10 : margin

    if (logo && logoFormat && pageNumber === 1) {
      doc.addImage(logo, logoFormat, margin, topY, logoW, logoH)
    }

    setFont('bold')
    doc.setFontSize(15)
    writeText(seller.name || tenant?.name || '', companyX, topY + 14)

    if (seller.nameAr) {
      setFont('normal')
      doc.setFontSize(12)
      writeText(seller.nameAr, companyX, topY + 31)
    }

    setFont('bold')
    doc.setFontSize(17)
    writeText('Tax Invoice', pageW / 2, topY + 18, { align: 'center' })
    doc.setFontSize(13)
    writeText('فاتورة ضريبية', pageW / 2, topY + 37, { align: 'center' })

    if (qr && qrFormat && pageNumber === 1) {
      doc.addImage(qr, qrFormat, qrX, topY, qrSize, qrSize)
    }

    const metaY = 98
    const metaH = 42
    const metaW = contentW / 3
    const metaRows = [
      { label: 'Invoice No. - رقم الفاتورة', value: invoice.invoiceNumber || '-' },
      { label: 'VAT - ضريبة', value: seller.vatNumber || '-' },
      { label: 'Date - تاريخ', value: `${formatInvoiceDate(invoice.issueDate)} ${formatInvoiceTime(invoice.issueDate)}`.trim() || '-' },
    ]

    metaRows.forEach((item, index) => {
      const x = margin + metaW * index
      doc.rect(x, metaY, metaW, metaH)
      setFont('bold')
      doc.setFontSize(9)
      writeText(item.label, x + 8, metaY + 14)
      doc.setFontSize(11)
      writeText(item.value, x + 8, metaY + 30)
    })

    doc.line(margin, metaY + metaH + 10, pageW - margin, metaY + metaH + 10)
  }

  drawHeader(1)

  const partyTop = 154
  const partyHeaderH = 22
  const partyH = 154
  const partyW = contentW / 2

  doc.rect(margin, partyTop, contentW, partyH)
  doc.setFillColor(...headerFill)
  doc.rect(margin, partyTop, contentW, partyHeaderH, 'F')
  doc.line(margin + partyW, partyTop, margin + partyW, partyTop + partyH)
  doc.line(margin, partyTop + partyHeaderH, pageW - margin, partyTop + partyHeaderH)

  setFont('bold')
  doc.setFontSize(10)
  writeText('SELLER - البائع', margin + 8, partyTop + 15)
  writeText('BUYER - المشتري', margin + partyW + 8, partyTop + 15)

  setFont('normal')
  doc.setFontSize(10.5)
  writeWrappedLines(buildPartyLines(seller), margin + 8, partyTop + partyHeaderH + 14, partyW - 16)
  writeWrappedLines(buildPartyLines(buyer), margin + partyW + 8, partyTop + partyHeaderH + 14, partyW - 16)

  const lineItems = Array.isArray(invoice.lineItems) && invoice.lineItems.length ? invoice.lineItems : [{}]
  const widths = { idx: 28, desc: 220, qty: 60, unit: 72, subtotal: 76, tax: 60, total: 76 }
  const totalBaseWidth = Object.values(widths).reduce((sum, value) => sum + value, 0)
  const scale = Math.min(1, contentW / totalBaseWidth)
  const idxW = Math.round(widths.idx * scale)
  const qtyW = Math.round(widths.qty * scale)
  const unitW = Math.round(widths.unit * scale)
  const subtotalW = Math.round(widths.subtotal * scale)
  const taxW = Math.round(widths.tax * scale)
  const totalW = Math.round(widths.total * scale)
  const descW = Math.max(120, Math.floor(contentW - idxW - qtyW - unitW - subtotalW - taxW - totalW))

  const bodyRows = lineItems.map((line, index) => {
    if (!line || (!line.productName && !line.productNameAr && !line.description)) {
      return ['', 'No line items', '', '', '', '', '']
    }

    const quantity = Number(line.quantity || 0)
    const unitPrice = Number(line.unitPrice || 0)
    const subtotal = Number(line.lineTotal ?? quantity * unitPrice)
    const taxAmount = Number(line.taxAmount ?? subtotal * (Number(line.taxRate || 0) / 100))
    const total = Number(line.lineTotalWithTax ?? subtotal + taxAmount)
    const desc = [line.productName || line.description || '', line.productNameAr || ''].filter(Boolean).join('\n')

    return [
      String(index + 1),
      desc,
      `${quantity}${line.unitCode ? ` ${line.unitCode}` : ''}`,
      Number(unitPrice).toFixed(2),
      Number(subtotal).toFixed(2),
      Number(taxAmount).toFixed(2),
      Number(total).toFixed(2),
    ]
  })

  autoTable(doc, {
    startY: tableTop,
    margin: { left: margin, right: margin, top: tableTop, bottom: 48 },
    head: [[
      '#',
      'Description\nوصف المنتج',
      'Quantity\nمقدار',
      'Unit Price\nسعر الوحدة',
      'Subtotal\nمبلغ إجمالي',
      'VAT\nضريبة',
      'Total\nالمجموع',
    ]],
    body: bodyRows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 5,
      textColor: borderColor,
      lineColor: borderColor,
      lineWidth: 0.6,
      ...(arabicFontReady ? { font: 'Tajawal' } : {}),
    },
    headStyles: {
      fillColor: headerFill,
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: idxW, halign: 'center' },
      1: { cellWidth: descW, halign: 'left' },
      2: { cellWidth: qtyW, halign: 'center' },
      3: { cellWidth: unitW, halign: 'right' },
      4: { cellWidth: subtotalW, halign: 'right' },
      5: { cellWidth: taxW, halign: 'right' },
      6: { cellWidth: totalW, halign: 'right' },
    },
    didParseCell: (data) => {
      data.cell.text = data.cell.text.map((entry) => shape(entry))
    },
    didDrawPage: () => {
      drawHeader(doc.getCurrentPageInfo().pageNumber)
    },
  })

  const subtotal = Number(invoice.taxableAmount ?? invoice.subtotal ?? 0)
  const discount = Number(invoice.totalDiscount ?? 0)
  const totalTax = Number(invoice.totalTax ?? 0)
  const grandTotal = Number(invoice.grandTotal ?? 0)
  const vatRate = (() => {
    const firstLine = (Array.isArray(invoice.lineItems) ? invoice.lineItems : []).find((line) => Number.isFinite(Number(line?.taxRate)))
    return Number(firstLine?.taxRate || 15)
  })()
  const amountWords = amountToWords(grandTotal, currency)

  let summaryTop = (doc.lastAutoTable?.finalY || tableTop) + 10
  if (summaryTop + 182 > pageH - 36) {
    doc.addPage()
    drawHeader(doc.getCurrentPageInfo().pageNumber)
    summaryTop = 96
  }

  const remarksW = Math.min(270, Math.floor(contentW * 0.55))
  const totalsW = contentW - remarksW
  const totalsX = margin + remarksW
  const remarks = invoice.notes || invoice.note || ''

  doc.rect(margin, summaryTop, remarksW, 92)
  doc.setFillColor(...headerFill)
  doc.rect(margin, summaryTop, remarksW, 22, 'F')
  doc.line(margin, summaryTop + 22, margin + remarksW, summaryTop + 22)
  setFont('bold')
  doc.setFontSize(10)
  writeText('Remarks - ملاحظات :', margin + 8, summaryTop + 15)
  if (remarks) {
    setFont('normal')
    doc.setFontSize(9)
    const remarkLines = doc.splitTextToSize(shape(remarks), remarksW - 16)
    writeText(remarkLines, margin + 8, summaryTop + 36)
  }

  doc.rect(totalsX, summaryTop, totalsW, 92)
  const rows = [
    ['Subtotal - إجمالي', money(subtotal, currency)],
    ['Discount - خصم', discount ? money(discount, currency) : '-'],
    [`VAT ${vatRate}% - ضريبة`, money(totalTax, currency)],
    ['Total - مجموع', money(grandTotal, currency)],
  ]
  const rowH = 23
  rows.forEach((row, index) => {
    const rowY = summaryTop + index * rowH
    if (index === 0) {
      doc.setFillColor(...headerFill)
      doc.rect(totalsX, rowY, totalsW, rowH, 'F')
    }
    doc.line(totalsX, rowY + rowH, totalsX + totalsW, rowY + rowH)
    setFont(index === rows.length - 1 ? 'bold' : 'normal')
    doc.setFontSize(10)
    writeText(row[0], totalsX + 8, rowY + 15)
    writeText(row[1], totalsX + totalsW - 8, rowY + 15, { align: 'right' })
  })

  const wordsTop = summaryTop + 92
  doc.rect(totalsX, wordsTop, totalsW, 40)
  setFont('bold')
  doc.setFontSize(9.5)
  const amountLines = doc.splitTextToSize(amountWords, totalsW - 12)
  writeText(amountLines.slice(0, 2), totalsX + totalsW / 2, wordsTop + 15, { align: 'center', maxWidth: totalsW - 12 })

  const bankTop = wordsTop + 60
  setFont('bold')
  doc.setFontSize(10)
  writeText('Bank Account details', margin, bankTop)
  writeText('تفاصيل الحساب البنكي', margin, bankTop + 14)

  const signatureX = pageW - margin - 140
  writeText('Date', signatureX, bankTop)
  writeText('التاريخ', signatureX, bankTop + 14)
  doc.line(signatureX, bankTop + 28, pageW - margin, bankTop + 28)

  const pageCount = doc.getNumberOfPages()
  const generatedAt = formatDateTime(new Date(), language)

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    setFont('normal')
    doc.setFontSize(8)
    writeText(generatedAt, margin, footerY)
    writeText(`Page ${page} of ${pageCount}`, pageW - margin, footerY, { align: 'right' })
    doc.setDrawColor(...accentLine)
    doc.line(margin, pageH - 22, margin + 90, pageH - 22)
  }

  const fileName = sanitizeFileName(invoice.invoiceNumber || 'invoice')
  doc.save(`${fileName}.pdf`)
}
