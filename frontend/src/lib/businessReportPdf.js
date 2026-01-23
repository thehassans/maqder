import { formatCurrency } from './currency'

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

export const downloadBusinessReportPdf = async ({ report, language = 'en', tenant }) => {
  if (!report) return

  const jspdfModule = await import('jspdf')
  const jsPDF = jspdfModule?.jsPDF || jspdfModule?.default || jspdfModule
  const autoTableModule = await import('jspdf-autotable')
  const autoTable = autoTableModule?.default || autoTableModule

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  const primary = tenant?.branding?.primaryColor || '#2563EB'
  const rgb = hexToRgb(primary) || { r: 37, g: 99, b: 235 }

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 40

  const isRtl = language === 'ar'
  const align = isRtl ? 'right' : 'left'

  const logo = tenant?.branding?.logo
  const logoFormat = detectImageFormat(logo)

  doc.setFillColor(rgb.r, rgb.g, rgb.b)
  doc.rect(0, 0, pageW, 6, 'F')

  const title = language === 'ar' ? 'تقرير الأعمال' : 'Business Report'

  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text(title, isRtl ? pageW - margin : margin, 46, { align })

  doc.setFontSize(10)
  doc.setTextColor(100)

  const startDate = report?.period?.startDate
  const endDate = report?.period?.endDate
  const periodText = `${formatDate(startDate, language)} - ${formatDate(endDate, language)}`

  doc.text(
    `${language === 'ar' ? 'الفترة' : 'Period'}: ${periodText}`,
    isRtl ? pageW - margin : margin,
    64,
    { align }
  )

  if (logo && logoFormat) {
    const imgW = 92
    const imgH = 28
    const x = isRtl ? margin : pageW - margin - imgW
    const y = 26
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(x - 6, y - 6, imgW + 12, imgH + 12, 10, 10, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x - 6, y - 6, imgW + 12, imgH + 12, 10, 10, 'S')
    doc.addImage(logo, logoFormat, x, y, imgW, imgH)
  }

  const currency = report?.currency || tenant?.settings?.currency || 'SAR'

  const sales = report?.totals?.sales || {}
  const purchases = report?.totals?.purchases || {}
  const expenses = report?.totals?.expenses || {}
  const net = Number(report?.totals?.net || 0)

  const cardY = 86
  const cardH = 78
  const gap = 12
  const cardW = (pageW - margin * 2 - gap) / 2

  const drawCard = ({ x, y, title: t, subtitle, value, valueColor }) => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, cardW, cardH, 14, 14, 'FD')

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(t, isRtl ? x + cardW - 14 : x + 14, y + 24, { align })

    if (subtitle) {
      doc.setFontSize(9)
      doc.text(subtitle, isRtl ? x + cardW - 14 : x + 14, y + 40, { align })
    }

    doc.setFontSize(14)
    const [r, g, b] = valueColor || [15, 23, 42]
    doc.setTextColor(r, g, b)
    doc.text(value, isRtl ? x + cardW - 14 : x + 14, y + 62, { align })
  }

  const salesSubtitle = language === 'ar'
    ? `فواتير: ${sales.invoiceCount || 0}`
    : `Invoices: ${sales.invoiceCount || 0}`
  const purchasesSubtitle = language === 'ar'
    ? `فواتير: ${purchases.invoiceCount || 0}`
    : `Invoices: ${purchases.invoiceCount || 0}`
  const expensesSubtitle = language === 'ar'
    ? `مصروفات: ${expenses.expenseCount || 0}`
    : `Expenses: ${expenses.expenseCount || 0}`

  drawCard({
    x: margin,
    y: cardY,
    title: language === 'ar' ? 'المبيعات' : 'Sales',
    subtitle: salesSubtitle,
    value: fmtMoney(sales.grandTotal, { language, currency }),
    valueColor: [22, 163, 74],
  })

  drawCard({
    x: margin + cardW + gap,
    y: cardY,
    title: language === 'ar' ? 'المشتريات' : 'Purchases',
    subtitle: purchasesSubtitle,
    value: fmtMoney(purchases.grandTotal, { language, currency }),
    valueColor: [37, 99, 235],
  })

  drawCard({
    x: margin,
    y: cardY + cardH + gap,
    title: language === 'ar' ? 'المصاريف' : 'Expenses',
    subtitle: expensesSubtitle,
    value: fmtMoney(expenses.totalAmount, { language, currency }),
    valueColor: [234, 88, 12],
  })

  drawCard({
    x: margin + cardW + gap,
    y: cardY + cardH + gap,
    title: language === 'ar' ? 'صافي الربح' : 'Net Profit',
    subtitle: language === 'ar' ? 'بعد المشتريات والمصاريف' : 'After purchases and expenses',
    value: fmtMoney(net, { language, currency }),
    valueColor: net >= 0 ? [22, 163, 74] : [220, 38, 38],
  })

  let y = cardY + (cardH + gap) * 2 + 10

  const sectionTitle = (text) => {
    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(text, isRtl ? pageW - margin : margin, y, { align })
    y += 10
  }

  const tableTheme = {
    styles: { fontSize: 9, cellPadding: 6 },
    headStyles: { fillColor: [rgb.r, rgb.g, rgb.b], textColor: [255, 255, 255] },
  }

  const salesByType = Array.isArray(report?.breakdown?.salesByTransactionType) ? report.breakdown.salesByTransactionType : []
  sectionTitle(language === 'ar' ? 'المبيعات حسب النوع' : 'Sales by Transaction Type')
  autoTable(doc, {
    startY: y,
    head: [[
      language === 'ar' ? 'النوع' : 'Type',
      language === 'ar' ? 'عدد الفواتير' : 'Invoices',
      language === 'ar' ? 'الإيراد' : 'Revenue',
      language === 'ar' ? 'الضريبة' : 'Tax',
    ]],
    body: (salesByType.length ? salesByType : [{}]).map((r) => {
      if (!r || !r._id) return [language === 'ar' ? 'لا توجد بيانات' : 'No data', '', '', '']
      return [
        safeText(r._id),
        safeText(r.invoiceCount || 0),
        fmtMoney(r.revenue, { language, currency }),
        fmtMoney(r.tax, { language, currency }),
      ]
    }),
    ...tableTheme,
  })
  y = doc.lastAutoTable.finalY + 22

  const topCustomers = Array.isArray(report?.breakdown?.topCustomers) ? report.breakdown.topCustomers : []
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
  y = doc.lastAutoTable.finalY + 22

  const expensesByCategory = Array.isArray(report?.breakdown?.expensesByCategory) ? report.breakdown.expensesByCategory : []
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

  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i += 1) {
    doc.setPage(i)
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(
      `${language === 'ar' ? 'صفحة' : 'Page'} ${i} / ${pages}`,
      isRtl ? margin : pageW - margin,
      pageH - 22,
      { align: isRtl ? 'left' : 'right' }
    )
  }

  const name = sanitizeFileName(language === 'ar' ? 'تقرير_الأعمال' : 'business_report')
  doc.save(`${name}.pdf`)
}
