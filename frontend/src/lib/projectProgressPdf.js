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

const sanitizeFileName = (value) => {
  return String(value || 'project_progress')
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

export const downloadProjectProgressPdf = async ({ project, language = 'en', tenant }) => {
  if (!project) return

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

  let headerY = 22

  if (logo && logoFormat) {
    const imgW = 90
    const imgH = 28
    const x = isRtl ? pageW - margin - imgW : margin
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(x - 6, headerY - 6, imgW + 12, imgH + 12, 10, 10, 'F')
    doc.setDrawColor(226, 232, 240)
    doc.roundedRect(x - 6, headerY - 6, imgW + 12, imgH + 12, 10, 10, 'S')
    doc.addImage(logo, logoFormat, x, headerY, imgW, imgH)
  }

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(16)

  const title = language === 'ar' ? 'تقرير تقدم المشروع' : 'Project Progress Report'
  doc.text(title, isRtl ? pageW - margin : margin, headerY + 54, { align })

  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `${language === 'ar' ? 'تم الإنشاء' : 'Generated'}: ${new Date().toLocaleString(isRtl ? 'ar-SA' : 'en-US')}`,
    isRtl ? pageW - margin : margin,
    headerY + 72,
    { align }
  )

  const cardX = margin
  const cardY = headerY + 90
  const cardW = pageW - margin * 2
  const cardH = 110

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(cardX, cardY, cardW, cardH, 14, 14, 'FD')

  const leftColX = isRtl ? cardX + cardW - 14 : cardX + 14
  const rightColX = isRtl ? cardX + 14 : cardX + cardW - 14

  const labelColor = [100, 116, 139]
  const valueColor = [15, 23, 42]

  const name = isRtl ? project?.nameAr || project?.nameEn : project?.nameEn || project?.nameAr
  const currency = project?.currency || tenant?.settings?.currency || 'SAR'
  const moneyOpts = { language, currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }

  const rows = [
    { k: language === 'ar' ? 'الكود' : 'Code', v: project?.code },
    { k: language === 'ar' ? 'المشروع' : 'Project', v: name },
    { k: language === 'ar' ? 'الحالة' : 'Status', v: project?.status },
    { k: language === 'ar' ? 'المالك' : 'Owner', v: project?.ownerName },
    { k: language === 'ar' ? 'تاريخ الانتهاء' : 'Due Date', v: project?.dueDate ? new Date(project.dueDate).toLocaleDateString(isRtl ? 'ar-SA' : 'en-US') : '' },
    { k: language === 'ar' ? 'التقدم' : 'Progress', v: `${clamp(Number(project?.progress || 0), 0, 100)}%` },
    { k: language === 'ar' ? 'الميزانية' : 'Budget', v: formatCurrency(Number(project?.budget || 0), moneyOpts) },
  ]

  doc.setFontSize(10)
  let y = cardY + 22

  const pairs = []
  for (let i = 0; i < rows.length; i += 2) {
    pairs.push([rows[i], rows[i + 1]].filter(Boolean))
  }

  for (const pair of pairs) {
    const a = pair[0]
    const b = pair[1]

    doc.setTextColor(...labelColor)
    doc.text(`${safeText(a.k)}:`, leftColX, y, { align })
    doc.setTextColor(...valueColor)
    doc.text(safeText(a.v), leftColX, y + 14, { align })

    if (b) {
      doc.setTextColor(...labelColor)
      doc.text(`${safeText(b.k)}:`, rightColX, y, { align: isRtl ? 'left' : 'right' })
      doc.setTextColor(...valueColor)
      doc.text(safeText(b.v), rightColX, y + 14, { align: isRtl ? 'left' : 'right' })
    }

    y += 40
  }

  const updates = Array.isArray(project?.progressUpdates) ? project.progressUpdates : []
  const sorted = [...updates].sort((a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0))

  const startY = cardY + cardH + 26

  doc.setFontSize(12)
  doc.setTextColor(15, 23, 42)
  doc.text(language === 'ar' ? 'سجل التقدم' : 'Progress History', isRtl ? pageW - margin : margin, startY, { align })

  autoTable(doc, {
    startY: startY + 12,
    head: [[
      language === 'ar' ? 'التاريخ' : 'Date',
      language === 'ar' ? 'التقدم' : 'Progress',
      language === 'ar' ? 'الملاحظة' : 'Note',
      language === 'ar' ? 'بواسطة' : 'By',
    ]],
    body: (sorted.length ? sorted : [{}]).map((u) => {
      if (!u || !u.createdAt) {
        return [
          language === 'ar' ? 'لا توجد بيانات' : 'No data',
          '',
          '',
          '',
        ]
      }

      const by = u?.createdBy
      const byLabel = by?.firstName
        ? `${by.firstName} ${by.lastName || ''}`.trim()
        : safeText(by?.email || by || '')

      return [
        formatDateTime(u.createdAt, language),
        `${clamp(Number(u.progress || 0), 0, 100)}%`,
        safeText(u.note),
        byLabel,
      ]
    }),
    styles: {
      fontSize: 9,
      cellPadding: 6,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [rgb.r, rgb.g, rgb.b],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 140 },
      1: { cellWidth: 70, halign: 'center' },
      2: { cellWidth: 250 },
      3: { cellWidth: 90 },
    },
    didDrawPage: () => {
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(
        `${language === 'ar' ? 'صفحة' : 'Page'} ${doc.getCurrentPageInfo().pageNumber}`,
        isRtl ? margin : pageW - margin,
        pageH - 22,
        { align: isRtl ? 'left' : 'right' }
      )
    },
  })

  const namePart = sanitizeFileName(project?.code || 'project')
  doc.save(`${namePart}_progress.pdf`)
}
