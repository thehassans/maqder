import { CURRENCY_CODE, formatCurrencyAmount } from './currency'

// ─── Utilities ────────────────────────────────────────────────────────────────

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

const sanitizeFileName = (value) => {
  return String(value || 'vat_return_report')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

const detectImageFormat = (dataUrl) => {
  const m = /^data:image\/(png|jpeg|jpg);/i.exec(String(dataUrl || ''))
  if (!m) return null
  const ext = m[1].toLowerCase()
  return ext === 'jpg' ? 'JPEG' : ext === 'jpeg' ? 'JPEG' : 'PNG'
}

const safeText = (value) => {
  if (value === null || value === undefined) return ''
  return String(value)
}

const sanitizePdfText = (value) => {
  return safeText(value)
    .replace(/[\u200e\u200f\u061c]/g, '')
    .replace(/﷼/g, 'SAR')
    .replace(/\s+/g, ' ')
    .trim()
}

const fmtMoney = (value, { language, currency }) => {
  const currencyCode = String(currency || CURRENCY_CODE).trim().toUpperCase() || CURRENCY_CODE
  const amount = formatCurrencyAmount(Number(value || 0), {
    language,
    currency: currencyCode,
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return sanitizePdfText(language === 'ar' ? `${amount} ${currencyCode}` : `${currencyCode} ${amount}`)
}

const formatDate = (value, language) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const downloadVatReturnReportPdf = async ({ report, language = 'en', tenant }) => {
  if (!report) return

  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule?.default || autoTableModule

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  // ── Theme colours ─────────────────────────────────────────────────────────
  const accentHex = tenant?.branding?.primaryColor || '#2563EB'
  const accentRgb = hexToRgb(accentHex) || { r: 37, g: 99, b: 235 }
  const darkBg1 = { r: 15, g: 23, b: 42 }
  const darkBg2 = { r: 30, g: 41, b: 59 }
  const white = { r: 255, g: 255, b: 255 }
  const cardBg = { r: 248, g: 250, b: 252 }
  const border = { r: 226, g: 232, b: 240 }
  const textDark = { r: 15, g: 23, b: 42 }
  const textMuted = { r: 100, g: 116, b: 139 }

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const isRtl = language === 'ar'
  const align = isRtl ? 'right' : 'left'

  const logo = tenant?.branding?.logo
  const logoFormat = detectImageFormat(logo)

  const currency = report?.currency || tenant?.settings?.currency || 'SAR'
  const companyName = tenant?.business?.name || tenant?.name || (language === 'ar' ? 'الشركة' : 'Company')
  const reportTitle = language === 'ar' ? 'تقرير إقرار ضريبة القيمة المضافة' : 'VAT Return Report'
  const startDate = report?.period?.startDate
  const endDate = report?.period?.endDate
  const periodText = `${formatDate(startDate, language)} – ${formatDate(endDate, language)}`

  // ── Dark gradient header ──────────────────────────────────────────────────
  const headerH = 90
  const steps = 40
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps
    const r = Math.round(darkBg1.r + (darkBg2.r - darkBg1.r) * ratio)
    const g = Math.round(darkBg1.g + (darkBg2.g - darkBg1.g) * ratio)
    const b = Math.round(darkBg1.b + (darkBg2.b - darkBg1.b) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(0, (headerH / steps) * i, pageW, headerH / steps + 0.5, 'F')
  }

  // Accent stripe at very top
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.rect(0, 0, pageW, 3, 'F')

  // Company name
  const textX = isRtl ? pageW - margin : margin
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(white.r, white.g, white.b)
  doc.text(sanitizePdfText(companyName), textX, 36, { align })

  // Report title
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setGState(doc.GState({ opacity: 0.7 }))
  doc.text(reportTitle, textX, 54, { align })
  doc.setGState(doc.GState({ opacity: 1 }))

  // Period
  const periodX = isRtl ? margin : pageW - margin
  const periodAlign = isRtl ? 'left' : 'right'
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.setGState(doc.GState({ opacity: 0.75 }))
  doc.text(language === 'ar' ? 'الفترة' : 'Period', periodX, 36, { align: periodAlign })
  doc.setGState(doc.GState({ opacity: 1 }))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(white.r, white.g, white.b)
  doc.text(periodText, periodX, 50, { align: periodAlign })

  // Logo pill
  if (logo && logoFormat) {
    const imgW = 88
    const imgH = 28
    const logoX = isRtl ? margin : pageW - margin - imgW
    const logoY = 56
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(logoX - 6, logoY - 4, imgW + 12, imgH + 8, 8, 8, 'F')
    doc.addImage(logo, logoFormat, logoX, logoY, imgW, imgH)
  }

  // ── KPI stat cards: 4 cards ───────────────────────────────────────────────
  const totals = report?.totals || {}
  const vatReturn = report?.vatReturn || {}
  const byCategory = totals?.byCategory || {}

  const fitFontSize = (text, width, preferred = 10, minimum = 7.5) => {
    let nextSize = preferred
    doc.setFontSize(nextSize)
    while (nextSize > minimum && doc.getTextWidth(sanitizePdfText(text)) > width) {
      nextSize -= 0.5
      doc.setFontSize(nextSize)
    }
    return nextSize
  }

  const cardTop = headerH + 18
  const cardH = 64
  const totalCardsW = pageW - margin * 2
  const cardGap = 10
  const cardCount = 4
  const cardW = (totalCardsW - cardGap * (cardCount - 1)) / cardCount

  const kpiCards = [
    {
      label: language === 'ar' ? 'عدد الفواتير' : 'Invoices',
      value: safeText(totals?.invoiceCount || 0),
      color: [15, 23, 42],
    },
    {
      label: language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount',
      value: fmtMoney(totals?.taxableAmount, { language, currency }),
      color: [37, 99, 235],
    },
    {
      label: language === 'ar' ? 'إجمالي ضريبة القيمة المضافة' : 'Total VAT',
      value: fmtMoney(totals?.totalTax, { language, currency }),
      color: [22, 163, 74],
    },
    {
      label: language === 'ar' ? 'صافي الضريبة المستحقة' : 'Net VAT Due',
      value: fmtMoney(vatReturn?.statement?.netVatDue?.vatAmount, { language, currency }),
      color: [234, 88, 12],
    },
  ]

  kpiCards.forEach((card, i) => {
    const cx = margin + i * (cardW + cardGap)
    const cy = cardTop

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b)
    doc.setDrawColor(border.r, border.g, border.b)
    doc.setLineWidth(0.5)
    doc.roundedRect(cx, cy, cardW, cardH, 8, 8, 'FD')

    // Accent top bar
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
    doc.roundedRect(cx, cy, cardW, 3, 1, 1, 'F')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b)
    const labelX = isRtl ? cx + cardW - 8 : cx + 8
    doc.text(sanitizePdfText(card.label).toUpperCase(), labelX, cy + 18, { align, maxWidth: cardW - 16 })

    // Value
    const valueFontSize = fitFontSize(card.value, cardW - 16, 11, 7.5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(valueFontSize)
    doc.setTextColor(card.color[0], card.color[1], card.color[2])
    doc.text(sanitizePdfText(card.value), labelX, cy + 48, { align, maxWidth: cardW - 16 })
  })

  // ── Divider ───────────────────────────────────────────────────────────────
  let y = cardTop + cardH + 20

  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageW - margin, y)
  y += 16

  // ── Section heading helper ────────────────────────────────────────────────
  const sectionTitle = (text) => {
    const safeHeading = sanitizePdfText(text)
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
    doc.rect(isRtl ? pageW - margin - 4 : margin, y, 4, 14, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(textDark.r, textDark.g, textDark.b)
    const titleX = isRtl ? pageW - margin - 12 : margin + 12
    doc.text(safeHeading, titleX, y + 10.5, { align })
    y += 22
  }

  // ── Shared table theme ────────────────────────────────────────────────────
  const tableTheme = {
    styles: {
      fontSize: 9,
      cellPadding: 6,
      overflow: 'linebreak',
      textColor: [31, 41, 55],
      lineColor: [border.r, border.g, border.b],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [accentRgb.r, accentRgb.g, accentRgb.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [cardBg.r, cardBg.g, cardBg.b],
    },
    margin: { left: margin, right: margin },
    tableLineColor: [border.r, border.g, border.b],
    tableLineWidth: 0.4,
  }

  // ── VAT Statement (highlighted) ───────────────────────────────────────────
  const statementRows = [
    {
      label: language === 'ar' ? 'إجمالي ضريبة الفترة الحالية' : 'Total VAT Due Current Period',
      value: vatReturn?.statement?.totalVatDueCurrentPeriod?.vatAmount || 0,
      bold: false,
    },
    {
      label: language === 'ar' ? 'تصحيحات الفترات السابقة' : 'Corrections Previous Period',
      value: vatReturn?.statement?.correctionsPreviousPeriod?.vatAmount || 0,
      bold: false,
    },
    {
      label: language === 'ar' ? 'رصيد ضريبة مرحل' : 'VAT Credit Carried Forward',
      value: vatReturn?.statement?.vatCreditCarriedForward?.vatAmount || 0,
      bold: false,
    },
    {
      label: language === 'ar' ? 'صافي الضريبة المستحقة' : 'Net VAT Due',
      value: vatReturn?.statement?.netVatDue?.vatAmount || 0,
      bold: true,
    },
  ]

  sectionTitle(language === 'ar' ? 'بيان الضريبة' : 'VAT Statement')
  autoTable(doc, {
    startY: y,
    head: [[language === 'ar' ? 'البند' : 'Line Item', language === 'ar' ? 'القيمة' : 'Value']],
    body: statementRows.map((row) => [
      sanitizePdfText(row.label),
      fmtMoney(row.value, { language, currency }),
    ]),
    ...tableTheme,
    columnStyles: { 0: { cellWidth: 290 }, 1: { cellWidth: 160 } },
    didParseCell: (data) => {
      // Bold + highlight the Net VAT Due row (last body row)
      if (data.section === 'body' && data.row.index === statementRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = [239, 246, 255]   // accent-50 blue-ish
        data.cell.styles.textColor = [accentRgb.r, accentRgb.g, accentRgb.b]
      }
    },
  })
  y = doc.lastAutoTable.finalY + 24

  // ── Summary by category ───────────────────────────────────────────────────
  const summaryRows = [
    {
      label: language === 'ar' ? 'خاضع للضريبة (Standard)' : 'Standard Rated',
      taxableAmount: byCategory?.standardRated?.taxableAmount || 0,
      taxAmount: byCategory?.standardRated?.taxAmount || 0,
    },
    {
      label: language === 'ar' ? 'صفرية (Zero)' : 'Zero Rated',
      taxableAmount: byCategory?.zeroRated?.taxableAmount || 0,
      taxAmount: byCategory?.zeroRated?.taxAmount || 0,
    },
    {
      label: language === 'ar' ? 'معفاة (Exempt)' : 'Exempt',
      taxableAmount: byCategory?.exempt?.taxableAmount || 0,
      taxAmount: byCategory?.exempt?.taxAmount || 0,
    },
    {
      label: language === 'ar' ? 'خارج النطاق (Out of Scope)' : 'Out of Scope',
      taxableAmount: byCategory?.outOfScope?.taxableAmount || 0,
      taxAmount: byCategory?.outOfScope?.taxAmount || 0,
    },
  ]

  sectionTitle(language === 'ar' ? 'ملخص حسب التصنيف' : 'Summary by Category')
  autoTable(doc, {
    startY: y,
    head: [[
      language === 'ar' ? 'التصنيف' : 'Category',
      language === 'ar' ? 'خاضع للضريبة' : 'Taxable',
      language === 'ar' ? 'الضريبة' : 'VAT',
    ]],
    body: summaryRows.map((row) => ([
      sanitizePdfText(row.label),
      fmtMoney(row.taxableAmount, { language, currency }),
      fmtMoney(row.taxAmount, { language, currency }),
    ])),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 170 },
      1: { cellWidth: 150 },
      2: { cellWidth: 140 },
    },
  })
  y = doc.lastAutoTable.finalY + 24

  // ── By transaction type ───────────────────────────────────────────────────
  const byTransactionType = Array.isArray(report?.breakdown?.byTransactionType)
    ? report.breakdown.byTransactionType : []

  sectionTitle(language === 'ar' ? 'حسب نوع المعاملة' : 'By Transaction Type')
  autoTable(doc, {
    startY: y,
    head: [[
      language === 'ar' ? 'النوع' : 'Type',
      language === 'ar' ? 'عدد الفواتير' : 'Invoices',
      language === 'ar' ? 'الخصم' : 'Discount',
      language === 'ar' ? 'الضريبة' : 'VAT',
    ]],
    body: (byTransactionType.length ? byTransactionType : [{}]).map((row) => {
      if (!row || !row._id) return [language === 'ar' ? 'لا توجد بيانات' : 'No data', '', '', '']
      return [
        sanitizePdfText(row._id),
        sanitizePdfText(row.invoiceCount || 0),
        fmtMoney(row.totalDiscount, { language, currency }),
        fmtMoney(row.totalTax, { language, currency }),
      ]
    }),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 90 },
      2: { cellWidth: 115 },
      3: { cellWidth: 115 },
    },
  })
  y = doc.lastAutoTable.finalY + 24

  // ── Details by tax category ───────────────────────────────────────────────
  const byTaxCategory = Array.isArray(report?.breakdown?.byTaxCategory)
    ? report.breakdown.byTaxCategory : []

  sectionTitle(language === 'ar' ? 'تفاصيل حسب فئة الضريبة' : 'Details by Tax Category')
  autoTable(doc, {
    startY: y,
    head: [[
      language === 'ar' ? 'الفئة' : 'Category',
      language === 'ar' ? 'النسبة' : 'Rate',
      language === 'ar' ? 'خاضع للضريبة' : 'Taxable',
      language === 'ar' ? 'الضريبة' : 'VAT',
    ]],
    body: (byTaxCategory.length ? byTaxCategory : [{}]).map((row) => {
      if (!row || !row._id) return [language === 'ar' ? 'لا توجد بيانات' : 'No data', '', '', '']
      return [
        sanitizePdfText(row._id?.taxCategory || '-'),
        sanitizePdfText(`${safeText(row._id?.taxRate ?? 0)}%`),
        fmtMoney(row.taxableAmount, { language, currency }),
        fmtMoney(row.taxAmount, { language, currency }),
      ]
    }),
    ...tableTheme,
    columnStyles: {
      0: { cellWidth: 110 },
      1: { cellWidth: 70 },
      2: { cellWidth: 140 },
      3: { cellWidth: 140 },
    },
  })

  // ── Footer on every page ──────────────────────────────────────────────────
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)

    // Footer line
    doc.setDrawColor(border.r, border.g, border.b)
    doc.setLineWidth(0.6)
    doc.line(margin, pageH - 36, pageW - margin, pageH - 36)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b)

    // Left: company + Confidential
    doc.text(
      `${sanitizePdfText(companyName)} · ${language === 'ar' ? 'سري' : 'Confidential'}`,
      margin,
      pageH - 22,
      { align: 'left' }
    )

    // Center: report title
    doc.text(reportTitle, pageW / 2, pageH - 22, { align: 'center' })

    // Right: Page X of Y
    doc.text(
      `${language === 'ar' ? 'صفحة' : 'Page'} ${i} / ${pages}`,
      pageW - margin,
      pageH - 22,
      { align: 'right' }
    )
  }

  const name = sanitizeFileName(language === 'ar' ? 'تقرير_ضريبة_القيمة_المضافة' : 'vat_return_report')
  doc.save(`${name}.pdf`)
}
