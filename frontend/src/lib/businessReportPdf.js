import { formatCurrency } from './currency'

// ─── Utilities ────────────────────────────────────────────────────────────────

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

const sanitizeFileName = (value) => {
  return String(value || 'business_report')
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

const fmtMoney = (value, { language, currency }) => {
  return formatCurrency(Number(value || 0), {
    language,
    currency: currency || 'SAR',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const formatDate = (value, language) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const downloadBusinessReportPdf = async ({ report, language = 'en', tenant }) => {
  if (!report) return

  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule?.default || autoTableModule

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  // ── Theme colours ─────────────────────────────────────────────────────────
  const accentHex = tenant?.branding?.primaryColor || '#2563EB'
  const accentRgb = hexToRgb(accentHex) || { r: 37, g: 99, b: 235 }
  const darkBg1 = { r: 15, g: 23, b: 42 }      // #0f172a
  const darkBg2 = { r: 30, g: 41, b: 59 }       // #1e293b
  const white = { r: 255, g: 255, b: 255 }
  const cardBg = { r: 248, g: 250, b: 252 }      // #f8fafc
  const border = { r: 226, g: 232, b: 240 }      // #e2e8f0
  const textDark = { r: 15, g: 23, b: 42 }
  const textMuted = { r: 100, g: 116, b: 139 }   // slate-500

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40
  const isRtl = language === 'ar'
  const align = isRtl ? 'right' : 'left'

  const logo = tenant?.branding?.logo
  const logoFormat = detectImageFormat(logo)

  const currency = report?.currency || tenant?.settings?.currency || 'SAR'
  const companyName = tenant?.business?.name || tenant?.name || (language === 'ar' ? 'الشركة' : 'Company')
  const reportTitle = language === 'ar' ? 'تقرير الأعمال' : 'Business Report'
  const startDate = report?.period?.startDate
  const endDate = report?.period?.endDate
  const periodText = `${formatDate(startDate, language)} – ${formatDate(endDate, language)}`

  // ── Header gradient block (height 90pt) ──────────────────────────────────
  const headerH = 90

  // Draw gradient manually with stacked thin rects
  const steps = 40
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps
    const r = Math.round(darkBg1.r + (darkBg2.r - darkBg1.r) * ratio)
    const g = Math.round(darkBg1.g + (darkBg2.g - darkBg1.g) * ratio)
    const b = Math.round(darkBg1.b + (darkBg2.b - darkBg1.b) * ratio)
    doc.setFillColor(r, g, b)
    doc.rect(0, (headerH / steps) * i, pageW, headerH / steps + 0.5, 'F')
  }

  // Accent stripe at very top (3pt)
  doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.rect(0, 0, pageW, 3, 'F')

  // Company name (left/right depending on RTL)
  const textX = isRtl ? pageW - margin : margin
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(white.r, white.g, white.b)
  doc.text(safeText(companyName), textX, 36, { align })

  // Report title below company name
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.setGState(doc.GState({ opacity: 0.7 }))
  doc.text(reportTitle, textX, 54, { align })
  doc.setGState(doc.GState({ opacity: 1 }))

  // Period (opposite side)
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

  // Logo pill (right/left)
  if (logo && logoFormat) {
    const imgW = 88
    const imgH = 28
    const logoX = isRtl ? margin : pageW - margin - imgW
    const logoY = 56
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(logoX - 6, logoY - 4, imgW + 12, imgH + 8, 8, 8, 'F')
    doc.addImage(logo, logoFormat, logoX, logoY, imgW, imgH)
  }

  // ── KPI stat cards (5 in a row) ───────────────────────────────────────────
  const sales = report?.totals?.sales || {}
  const purchases = report?.totals?.purchases || {}
  const expenses = report?.totals?.expenses || {}
  const discounts = Number(sales?.totalDiscount || 0)
  const net = Number(report?.totals?.net || 0)

  const cardTop = headerH + 18
  const cardH = 64
  const totalCardsW = pageW - margin * 2
  const cardGap = 8
  const cardCount = 5
  const cardW = (totalCardsW - cardGap * (cardCount - 1)) / cardCount

  const kpiCards = [
    {
      label: language === 'ar' ? 'المبيعات' : 'Sales',
      value: fmtMoney(sales.grandTotal, { language, currency }),
      color: [22, 163, 74],
    },
    {
      label: language === 'ar' ? 'المشتريات' : 'Purchases',
      value: fmtMoney(purchases.grandTotal, { language, currency }),
      color: [37, 99, 235],
    },
    {
      label: language === 'ar' ? 'المصاريف' : 'Expenses',
      value: fmtMoney(expenses.totalAmount, { language, currency }),
      color: [234, 88, 12],
    },
    {
      label: language === 'ar' ? 'الخصومات' : 'Discounts',
      value: fmtMoney(discounts, { language, currency }),
      color: [202, 138, 4],
    },
    {
      label: language === 'ar' ? 'صافي الربح' : 'Net Profit',
      value: fmtMoney(net, { language, currency }),
      color: net >= 0 ? [22, 163, 74] : [220, 38, 38],
    },
  ]

  kpiCards.forEach((card, i) => {
    const cx = margin + i * (cardW + cardGap)
    const cy = cardTop

    // Card background
    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b)
    doc.setDrawColor(border.r, border.g, border.b)
    doc.setLineWidth(0.5)
    doc.roundedRect(cx, cy, cardW, cardH, 8, 8, 'FD')

    // Accent bar at top of card
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
    doc.roundedRect(cx, cy, cardW, 3, 1, 1, 'F')

    // Label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b)
    const labelX = isRtl ? cx + cardW - 8 : cx + 8
    doc.text(safeText(card.label).toUpperCase(), labelX, cy + 18, { align })

    // Value
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(clamp(10 - card.value.length * 0.08, 8, 11))
    doc.setTextColor(card.color[0], card.color[1], card.color[2])
    doc.text(safeText(card.value), labelX, cy + 48, { align, maxWidth: cardW - 16 })
  })

  // ── Divider ───────────────────────────────────────────────────────────────
  let y = cardTop + cardH + 20

  doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageW - margin, y)
  y += 16

  // ── Section heading helper ────────────────────────────────────────────────
  const sectionTitle = (text) => {
    // Colored left accent bar
    doc.setFillColor(accentRgb.r, accentRgb.g, accentRgb.b)
    doc.rect(isRtl ? pageW - margin - 4 : margin, y, 4, 14, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(textDark.r, textDark.g, textDark.b)
    const titleX = isRtl ? pageW - margin - 12 : margin + 12
    doc.text(safeText(text), titleX, y + 10.5, { align })
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

  // ── Sales by transaction type ─────────────────────────────────────────────
  const salesByType = Array.isArray(report?.breakdown?.salesByTransactionType)
    ? report.breakdown.salesByTransactionType : []

  sectionTitle(language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Transaction Type')
  autoTable(doc, {
    startY: y,
    head: [[
      language === 'ar' ? 'النوع' : 'Type',
      language === 'ar' ? 'عدد الفواتير' : 'Invoices',
      language === 'ar' ? 'الخصم' : 'Discount',
      language === 'ar' ? 'الإيراد' : 'Revenue',
      language === 'ar' ? 'الضريبة' : 'Tax',
    ]],
    body: (salesByType.length ? salesByType : [{}]).map((r) => {
      if (!r || !r._id) return [language === 'ar' ? 'لا توجد بيانات' : 'No data', '', '', '', '']
      return [
        safeText(r._id),
        safeText(r.invoiceCount || 0),
        fmtMoney(r.discount, { language, currency }),
        fmtMoney(r.revenue, { language, currency }),
        fmtMoney(r.tax, { language, currency }),
      ]
    }),
    ...tableTheme,
  })
  y = doc.lastAutoTable.finalY + 24

  // ── Top customers ─────────────────────────────────────────────────────────
  const topCustomers = Array.isArray(report?.breakdown?.topCustomers)
    ? report.breakdown.topCustomers : []

  sectionTitle(language === 'ar' ? 'أفضل العملاء' : 'Top Customers')
  autoTable(doc, {
    startY: y,
    head: [[
      language === 'ar' ? 'العميل' : 'Customer',
      language === 'ar' ? 'عدد الفواتير' : 'Invoices',
      language === 'ar' ? 'الإيراد' : 'Revenue',
    ]],
    body: (topCustomers.length ? topCustomers : [{}]).map((r) => {
      if (!r || !r._id) return [language === 'ar' ? 'لا توجد بيانات' : 'No data', '', '']
      return [
        safeText(r._id),
        safeText(r.invoiceCount || 0),
        fmtMoney(r.revenue, { language, currency }),
      ]
    }),
    ...tableTheme,
    columnStyles: { 0: { cellWidth: 240 } },
  })
  y = doc.lastAutoTable.finalY + 24

  // ── Expenses by category ──────────────────────────────────────────────────
  const expensesByCategory = Array.isArray(report?.breakdown?.expensesByCategory)
    ? report.breakdown.expensesByCategory : []

  sectionTitle(language === 'ar' ? 'المصاريف حسب التصنيف' : 'Expenses by Category')
  autoTable(doc, {
    startY: y,
    head: [[
      language === 'ar' ? 'التصنيف' : 'Category',
      language === 'ar' ? 'العدد' : 'Count',
      language === 'ar' ? 'الإجمالي' : 'Total',
    ]],
    body: (expensesByCategory.length ? expensesByCategory : [{}]).map((r) => {
      if (!r || !r._id) return [language === 'ar' ? 'لا توجد بيانات' : 'No data', '', '']
      return [
        safeText(r._id),
        safeText(r.count || 0),
        fmtMoney(r.totalAmount, { language, currency }),
      ]
    }),
    ...tableTheme,
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
    doc.text(`${safeText(companyName)} · ${language === 'ar' ? 'سري' : 'Confidential'}`, margin, pageH - 22, { align: 'left' })

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

  const name = sanitizeFileName(language === 'ar' ? 'تقرير_الأعمال' : 'business_report')
  doc.save(`${name}.pdf`)
}
