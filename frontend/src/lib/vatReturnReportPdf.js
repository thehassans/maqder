import { formatCurrency } from './currency'

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

export const downloadVatReturnReportPdf = async ({ report, language = 'en', tenant }) => {
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

  doc.setFontSize(18)
  doc.setTextColor(15, 23, 42)
  doc.text(language === 'ar' ? 'تقرير إقرار ضريبة القيمة المضافة' : 'VAT Return Report', isRtl ? pageW - margin : margin, 46, { align })

  doc.setFontSize(10)
  doc.setTextColor(100)
  const startDate = report?.period?.startDate
  const endDate = report?.period?.endDate
  doc.text(
    `${language === 'ar' ? 'الفترة' : 'Period'}: ${formatDate(startDate, language)} - ${formatDate(endDate, language)}`,
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
  const totals = report?.totals || {}
  const vatReturn = report?.vatReturn || {}
  const byCategory = totals?.byCategory || {}

  const cardY = 86
  const cardH = 78
  const gap = 12
  const cardW = (pageW - margin * 2 - gap) / 2

  const drawCard = ({ x, y, title, subtitle, value, valueColor }) => {
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x, y, cardW, cardH, 14, 14, 'FD')

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(title, isRtl ? x + cardW - 14 : x + 14, y + 24, { align })

    if (subtitle) {
      doc.setFontSize(9)
      doc.text(subtitle, isRtl ? x + cardW - 14 : x + 14, y + 40, { align })
    }

    doc.setFontSize(14)
    const [r, g, b] = valueColor || [15, 23, 42]
    doc.setTextColor(r, g, b)
    doc.text(value, isRtl ? x + cardW - 14 : x + 14, y + 62, { align })
  }

  drawCard({
    x: margin,
    y: cardY,
    title: language === 'ar' ? 'عدد الفواتير' : 'Invoices',
    subtitle: language === 'ar' ? 'خلال الفترة المحددة' : 'Within selected period',
    value: safeText(totals?.invoiceCount || 0),
    valueColor: [15, 23, 42],
  })

  drawCard({
    x: margin + cardW + gap,
    y: cardY,
    title: language === 'ar' ? 'المبلغ الخاضع للضريبة' : 'Taxable Amount',
    subtitle: language === 'ar' ? 'إجمالي المبيعات الخاضعة' : 'Total taxable sales',
    value: fmtMoney(totals?.taxableAmount, { language, currency }),
    valueColor: [37, 99, 235],
  })

  drawCard({
    x: margin,
    y: cardY + cardH + gap,
    title: language === 'ar' ? 'إجمالي ضريبة القيمة المضافة' : 'Total VAT',
    subtitle: language === 'ar' ? 'المخرجات خلال الفترة' : 'Output tax for the period',
    value: fmtMoney(totals?.totalTax, { language, currency }),
    valueColor: [22, 163, 74],
  })

  drawCard({
    x: margin + cardW + gap,
    y: cardY + cardH + gap,
    title: language === 'ar' ? 'صافي الضريبة المستحقة' : 'Net VAT Due',
    subtitle: language === 'ar' ? 'بعد الخصومات والتعديلات' : 'After credits and adjustments',
    value: fmtMoney(vatReturn?.statement?.netVatDue?.vatAmount, { language, currency }),
    valueColor: [234, 88, 12],
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

  const summaryRows = [
    {
      label: language === 'ar' ? 'خاضع للضريبة' : 'Standard Rated',
      taxableAmount: byCategory?.standardRated?.taxableAmount || 0,
      taxAmount: byCategory?.standardRated?.taxAmount || 0,
    },
    {
      label: language === 'ar' ? 'صفرية' : 'Zero Rated',
      taxableAmount: byCategory?.zeroRated?.taxableAmount || 0,
      taxAmount: byCategory?.zeroRated?.taxAmount || 0,
    },
    {
      label: language === 'ar' ? 'معفاة' : 'Exempt',
      taxableAmount: byCategory?.exempt?.taxableAmount || 0,
      taxAmount: byCategory?.exempt?.taxAmount || 0,
    },
    {
      label: language === 'ar' ? 'خارج النطاق' : 'Out of Scope',
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
      row.label,
      fmtMoney(row.taxableAmount, { language, currency }),
      fmtMoney(row.taxAmount, { language, currency }),
    ])),
    ...tableTheme,
  })
  y = doc.lastAutoTable.finalY + 22

  const byTransactionType = Array.isArray(report?.breakdown?.byTransactionType) ? report.breakdown.byTransactionType : []
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
        safeText(row._id),
        safeText(row.invoiceCount || 0),
        fmtMoney(row.totalDiscount, { language, currency }),
        fmtMoney(row.totalTax, { language, currency }),
      ]
    }),
    ...tableTheme,
  })
  y = doc.lastAutoTable.finalY + 22

  const byTaxCategory = Array.isArray(report?.breakdown?.byTaxCategory) ? report.breakdown.byTaxCategory : []
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
        safeText(row._id?.taxCategory || '-'),
        `${safeText(row._id?.taxRate ?? 0)}%`,
        fmtMoney(row.taxableAmount, { language, currency }),
        fmtMoney(row.taxAmount, { language, currency }),
      ]
    }),
    ...tableTheme,
  })
  y = doc.lastAutoTable.finalY + 22

  const statementRows = [
    { label: language === 'ar' ? 'إجمالي ضريبة الفترة الحالية' : 'Total VAT Due Current Period', value: vatReturn?.statement?.totalVatDueCurrentPeriod?.vatAmount || 0 },
    { label: language === 'ar' ? 'تصحيحات الفترات السابقة' : 'Corrections Previous Period', value: vatReturn?.statement?.correctionsPreviousPeriod?.vatAmount || 0 },
    { label: language === 'ar' ? 'رصيد ضريبة مرحل' : 'VAT Credit Carried Forward', value: vatReturn?.statement?.vatCreditCarriedForward?.vatAmount || 0 },
    { label: language === 'ar' ? 'صافي الضريبة المستحقة' : 'Net VAT Due', value: vatReturn?.statement?.netVatDue?.vatAmount || 0 },
  ]

  sectionTitle(language === 'ar' ? 'بيان الضريبة' : 'VAT Statement')
  autoTable(doc, {
    startY: y,
    head: [[language === 'ar' ? 'البند' : 'Line Item', language === 'ar' ? 'القيمة' : 'Value']],
    body: statementRows.map((row) => [row.label, fmtMoney(row.value, { language, currency })]),
    ...tableTheme,
    columnStyles: { 0: { cellWidth: 290 } },
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

  const name = sanitizeFileName(language === 'ar' ? 'تقرير_ضريبة_القيمة_المضافة' : 'vat_return_report')
  doc.save(`${name}.pdf`)
}
