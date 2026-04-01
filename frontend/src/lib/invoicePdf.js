import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { QRCodeSVG } from 'qrcode.react'
import { formatCurrency } from './currency'
import { calculateInvoiceSummary, normalizeTravelDetails } from './invoiceDocument'
import { getInvoiceBranding, getInvoiceTemplateId, splitBrandingText } from './invoiceBranding'
import { getAmountInWords } from './amountInWords'
import { generateZatcaQrValue } from './zatcaQr'

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
const toNumber = (value, fallback = 0) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const detectImageFormat = (dataUrl) => {
  const m = /^data:image\/(png|jpeg|jpg);/i.exec(String(dataUrl || ''))
  if (!m) return null
  const ext = m[1].toLowerCase()
  return ext === 'jpg' ? 'JPEG' : ext === 'jpeg' ? 'JPEG' : 'PNG'
}

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})

const resolveImageSource = async (value) => {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (/^data:image\//i.test(raw)) return raw

  try {
    const res = await fetch(raw)
    if (!res.ok) return null
    const blob = await res.blob()
    return await blobToDataUrl(blob)
  } catch {
    return null
  }
}

const renderQrToDataUrl = async (value, size = 112) => {
  const raw = String(value || '').trim()
  if (!raw || typeof document === 'undefined' || typeof Image === 'undefined') return null

  try {
    const svgMarkup = renderToStaticMarkup(createElement(QRCodeSVG, {
      value: raw,
      size,
      includeMargin: true,
      bgColor: '#FFFFFF',
      fgColor: '#0F172A',
    }))

    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
    const svgUrl = URL.createObjectURL(svgBlob)

    const dataUrl = await new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          URL.revokeObjectURL(svgUrl)
          resolve(null)
          return
        }
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, size, size)
        ctx.drawImage(img, 0, 0, size, size)
        URL.revokeObjectURL(svgUrl)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = () => {
        URL.revokeObjectURL(svgUrl)
        resolve(null)
      }
      img.src = svgUrl
    })

    return dataUrl
  } catch {
    return null
  }
}

let tajawalRegularBase64
let tajawalBoldBase64
let tajawalLoadPromise
const customArabicFontEnabled = false

const bufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const hasFontSignature = (buffer) => {
  const bytes = new Uint8Array(buffer)
  if (bytes.length < 4) return false
  if (bytes[0] === 0x00 && bytes[1] === 0x01 && bytes[2] === 0x00 && bytes[3] === 0x00) return true
  const signature = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])
  return signature === 'OTTO' || signature === 'true' || signature === 'ttcf'
}

const looksLikeHtmlDocument = (buffer) => {
  try {
    const sample = new TextDecoder('utf-8').decode(buffer.slice(0, 160)).trim().toLowerCase()
    return sample.startsWith('<!doctype html') || sample.startsWith('<html') || sample.includes('<html')
  } catch {
    return false
  }
}

const tryFetchFontBase64 = async (url) => {
  const res = await fetch(url)
  if (!res.ok) return null
  const buf = await res.arrayBuffer()
  if (looksLikeHtmlDocument(buf) || !hasFontSignature(buf)) return null
  return bufferToBase64(buf)
}

const ensureTajawalFont = async (doc) => {
  if (!customArabicFontEnabled) return false
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
    doc.getTextWidth('اختبار')
    return true
  } catch {
    doc.setFont('helvetica', 'normal')
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
  return d.toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatAddress = (address = {}) => {
  return [address?.street, address?.district, address?.city, address?.postalCode, address?.country]
    .filter(Boolean)
    .join(', ')
}

const getPartyDetailLines = (party = {}, language = 'en', role = 'party') => {
  const lines = []
  const vatLabel = role === 'seller'
    ? (language === 'ar' ? 'الرقم الضريبي للشركة' : 'Company VAT')
    : (language === 'ar' ? 'الرقم الضريبي' : 'VAT')

  if (party?.vatNumber) {
    lines.push({ label: vatLabel, value: party.vatNumber })
  }

  if (party?.crNumber) {
    lines.push({ label: language === 'ar' ? 'السجل التجاري' : 'CR', value: party.crNumber })
  }

  if (party?.contactPhone) {
    lines.push({ label: language === 'ar' ? 'الهاتف' : 'Phone', value: party.contactPhone })
  }

  if (party?.contactEmail) {
    lines.push({ label: language === 'ar' ? 'البريد الإلكتروني' : 'Email', value: party.contactEmail })
  }

  const addressText = formatAddress(party?.address)
  if (addressText) {
    lines.push({ label: language === 'ar' ? 'العنوان' : 'Address', value: addressText })
  }

  return lines.length > 0 ? lines : [{ label: '', value: '—' }]
}

const getInvoiceEyebrow = (invoice, language = 'en') => {
  if (invoice?.invoiceSubtype === 'travel_ticket' || invoice?.businessContext === 'travel_agency') {
    return language === 'ar' ? 'فاتورة خدمات السفر' : 'Travel Services Invoice'
  }

  if (invoice?.businessContext === 'construction') {
    return language === 'ar' ? 'فاتورة مقاولات' : 'Construction Invoice'
  }

  if (invoice?.businessContext === 'restaurant') {
    return language === 'ar' ? 'فاتورة مطعم' : 'Restaurant Invoice'
  }

  return language === 'ar' ? 'فاتورة تجارة' : 'Trading Invoice'
}

const getInvoiceTitle = (invoice, language = 'en') => {
  if (invoice?.invoiceSubtype === 'travel_ticket' || invoice?.businessContext === 'travel_agency') {
    return language === 'ar' ? 'فاتورة ضريبية لخدمات السفر' : 'Travel Services Tax Invoice'
  }

  return language === 'ar' ? 'فاتورة ضريبية' : 'Tax Invoice'
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
  const margin = 40
  const footerH = 76
  const headerH = 132
  const topMargin = headerH + 14

  const isRtl = language === 'ar'
  const align = isRtl ? 'right' : 'left'
  const oppositeAlign = isRtl ? 'left' : 'right'
  const invoiceBranding = getInvoiceBranding(tenant, language, invoice?.businessContext)

  const arabicFontReady = isRtl ? await ensureTajawalFont(doc) : false

  if (isRtl && typeof doc.setR2L === 'function') {
    try {
      doc.setR2L(true)
    } catch {
      // ignore
    }
  }

  const primaryRgb = hexToRgb(invoiceBranding.primaryColor) || { r: 15, g: 23, b: 42 }
  const secondaryRgb = hexToRgb(invoiceBranding.secondaryColor) || { r: 203, g: 213, b: 225 }
  const lightRgb = mixRgb(primaryRgb, { r: 255, g: 255, b: 255 }, 0.94)

  const templateId = getInvoiceTemplateId(tenant, invoice?.businessContext, invoice?.pdfTemplateId)

  const theme = (() => {
    const base = {
      sidebarW: 0,
      headerBgRgb: null,
      headerTitleRgb: { r: 15, g: 23, b: 42 },
      headerMutedRgb: { r: 100, g: 116, b: 139 },
      metaFillRgb: { r: 248, g: 250, b: 252 },
      metaStrokeRgb: { r: 203, g: 213, b: 225 },
      boxFillRgb: { r: 255, g: 255, b: 255 },
      boxStrokeRgb: { r: 203, g: 213, b: 225 },
      tableHeadFillRgb: { r: 15, g: 23, b: 42 },
      tableHeadTextRgb: { r: 255, g: 255, b: 255 },
      altRowFillRgb: { r: 248, g: 250, b: 252 },
      drawFrame: () => {
        doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        doc.rect(0, 0, pageW, 4, 'F')
        doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b)
        doc.rect(0, 8, pageW, 2, 'F')
      },
    }

    if (templateId === 2) {
      return {
        ...base,
        drawFrame: () => {
          doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
          doc.rect(0, 0, pageW, 4, 'F')
        },
      }
    }

    if (templateId === 3) {
      return {
        ...base,
        drawFrame: () => {
          doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
          doc.rect(0, 0, pageW, 2, 'F')
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
      return {
        ...base,
        headerTitleRgb: { r: 15, g: 23, b: 42 },
        headerMutedRgb: { r: 100, g: 116, b: 139 },
        metaFillRgb: { r: 255, g: 255, b: 255 },
        tableHeadFillRgb: primaryRgb,
        tableHeadTextRgb: { r: 255, g: 255, b: 255 },
        boxStrokeRgb: { r: 203, g: 213, b: 225 },
        altRowFillRgb: { r: 248, g: 250, b: 252 },
      }
    }

    if (templateId === 6) {
      return {
        ...base,
        metaFillRgb: { r: 255, g: 255, b: 255 },
        metaStrokeRgb: { r: 203, g: 213, b: 225 },
        boxStrokeRgb: { r: 148, g: 163, b: 184 },
        tableHeadFillRgb: primaryRgb,
        tableHeadTextRgb: { r: 255, g: 255, b: 255 },
        altRowFillRgb: { r: 255, g: 255, b: 255 },
        drawFrame: () => {
          doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
          doc.rect(0, 0, pageW, 3, 'F')
        },
      }
    }

    return base
  })()

  const contentLeft = margin + (theme.sidebarW && !isRtl ? theme.sidebarW : 0)
  const contentRight = margin + (theme.sidebarW && isRtl ? theme.sidebarW : 0)
  const contentRightEdge = pageW - contentRight
  const contentW = pageW - contentLeft - contentRight

  const logo = await resolveImageSource(invoiceBranding.logoSrc)
  const logoFormat = detectImageFormat(logo)
  const visionLogo = invoiceBranding.showVision2030 ? await resolveImageSource(invoiceBranding.vision2030LogoSrc) : null
  const visionLogoFormat = detectImageFormat(visionLogo)

  const seller = invoice.seller || {}
  const buyer = invoice.buyer || {}

  const currency = invoice.currency || tenant?.settings?.currency || 'SAR'
  const currencyOpts = { language, currency, currencyDisplay: 'code', minimumFractionDigits: 2, maximumFractionDigits: 2 }

  const money = (value) => formatCurrency(toNumber(value), currencyOpts)
  const txt = (value) => safeText(value)

  const shape = (value) => {
    const raw = safeText(value)
    if (!raw) return ''
    if (isRtl && arabicFontReady && typeof doc.processArabic === 'function') {
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
  const sellerDetailLines = getPartyDetailLines(seller, language, 'seller')
  const buyerDetailLines = getPartyDetailLines(buyer, language, 'buyer')
  const totals = calculateInvoiceSummary(invoice)
  const travelDetails = normalizeTravelDetails(invoice.travelDetails || {}, buyerName, language)
  const qrValue = invoice?.zatca?.qrCodeData || generateZatcaQrValue({
    sellerName,
    vatNumber: seller?.vatNumber || tenant?.business?.vatNumber,
    timestamp: invoice?.issueDate || new Date().toISOString(),
    totalWithVat: totals.grandTotal,
    vatTotal: totals.totalTax,
  })
  const fallbackQrImage = invoice?.zatca?.qrCodeImage ? null : await renderQrToDataUrl(qrValue, 120)
  const qr = await resolveImageSource(invoice?.zatca?.qrCodeImage || fallbackQrImage || null)
  const qrFormat = detectImageFormat(qr)
  const companyName = invoiceBranding.companyName || sellerName || ''
  const headerLines = splitBrandingText(invoiceBranding.headerText)
  const footerLines = splitBrandingText(invoiceBranding.footerText)
  const invoiceEyebrow = getInvoiceEyebrow(invoice, language)

  const title = getInvoiceTitle(invoice, language)
  const customerLabel = invoice.flow === 'purchase'
    ? (isRtl ? 'المشتري' : 'Buyer')
    : (isRtl ? 'العميل' : 'Customer')
  const amountInWords = getAmountInWords(totals.grandTotal, currency, language)
  const typography = invoiceBranding.typography || {}
  const bodyFontName = arabicFontReady ? 'Tajawal' : (typography.bodyFontFamily || 'helvetica')
  const headingFontName = arabicFontReady ? 'Tajawal' : (typography.headingFontFamily || 'helvetica')
  const bodyFontSize = Number(typography.bodyFontSize || 12)
  const headingFontSize = Number(typography.headingFontSize || 18)

  const setBodyFont = (size = bodyFontSize, style = 'normal') => {
    try {
      doc.setFont(bodyFontName, style)
    } catch {
      doc.setFont(arabicFontReady ? 'Tajawal' : 'helvetica', style)
    }
    doc.setFontSize(size)
  }

  const setHeadingFont = (size = headingFontSize, style = 'bold') => {
    try {
      doc.setFont(headingFontName, style)
    } catch {
      doc.setFont(arabicFontReady ? 'Tajawal' : 'helvetica', style)
    }
    doc.setFontSize(size)
  }

  const drawHeader = ({ pageNumber }) => {
    theme.drawFrame({ pageNumber })

    const y = 20
    const logoW = 64
    const logoH = 64
    const rightPanelW = 148
    const qrW = 64
    const qrH = 64
    const rightPanelX = isRtl ? contentLeft : contentRightEdge - rightPanelW
    const logoX = isRtl ? contentRightEdge - logoW : contentLeft
    const brandBlockX = isRtl ? logoX - 16 : contentLeft + logoW + 16
    const brandBlockW = Math.max(160, contentW - logoW - rightPanelW - 40)
    const qrX = isRtl ? rightPanelX : rightPanelX + rightPanelW - qrW

    if (logo && logoFormat) {
      doc.addImage(logo, logoFormat, logoX, y + 4, logoW, logoH)
    }

    doc.setTextColor(theme.headerMutedRgb.r, theme.headerMutedRgb.g, theme.headerMutedRgb.b)
    setBodyFont(8, 'normal')
    doc.text(shape(invoiceEyebrow), brandBlockX, y + 14, { align, maxWidth: brandBlockW })

    doc.setTextColor(theme.headerTitleRgb.r, theme.headerTitleRgb.g, theme.headerTitleRgb.b)
    setHeadingFont(Math.max(headingFontSize + 1, 17), 'bold')
    const companyLines = doc.splitTextToSize(shape(companyName), brandBlockW).slice(0, 2)
    doc.text(companyLines, brandBlockX, y + 32, { align, maxWidth: brandBlockW })
    const companyBottomY = y + 32 + Math.max(0, companyLines.length - 1) * 15

    if (headerLines.length > 0) {
      doc.setTextColor(theme.headerMutedRgb.r, theme.headerMutedRgb.g, theme.headerMutedRgb.b)
      setBodyFont(8, 'normal')
      let headerY = companyBottomY + 13
      for (const line of headerLines.slice(0, 2)) {
        doc.text(shape(line), brandBlockX, headerY, { align, maxWidth: brandBlockW })
        headerY += 10
      }
    }

    if (qr && qrFormat) {
      doc.addImage(qr, qrFormat, qrX, y + 2, qrW, qrH)
    }

    const qrCenterX = qrX + qrW / 2
    const vatValue = seller.vatNumber || invoiceBranding.vatNumber
    const crValue = seller.crNumber || invoiceBranding.crNumber
    doc.setTextColor(theme.headerTitleRgb.r, theme.headerTitleRgb.g, theme.headerTitleRgb.b)
    setBodyFont(8, 'normal')
    if (vatValue) {
      doc.text(shape(`${isRtl ? 'الرقم الضريبي' : 'VAT'}: ${vatValue}`), qrCenterX, y + 76, { align: 'center', maxWidth: rightPanelW })
    }
    if (crValue) {
      doc.text(shape(`${isRtl ? 'السجل التجاري' : 'CR'}: ${crValue}`), qrCenterX, y + 87, { align: 'center', maxWidth: rightPanelW })
    }

    const dividerY = y + 100

    doc.setDrawColor(226, 232, 240)
    doc.line(contentLeft, dividerY, contentRightEdge, dividerY)

    doc.setTextColor(theme.headerTitleRgb.r, theme.headerTitleRgb.g, theme.headerTitleRgb.b)
    setHeadingFont(Math.max(headingFontSize, 18), 'bold')
    doc.text(shape(title), pageW / 2, dividerY + 23, { align: 'center' })
  }

  drawHeader({ pageNumber: 1 })

  const cardX = contentLeft
  const cardW = contentW
  const cardY = topMargin

  const metaRows = [
    { k: isRtl ? 'رقم الفاتورة' : 'Invoice #', v: invoice.invoiceNumber },
    { k: isRtl ? 'التاريخ' : 'Date', v: formatDateTime(invoice.issueDate, language) },
    { k: isRtl ? 'المستند' : 'Document', v: invoiceEyebrow },
    { k: isRtl ? 'النوع / التدفق' : 'Type / Flow', v: `${invoice.transactionType || '—'} / ${invoice.flow || 'sell'}` },
  ].filter(Boolean)

  const metaPairs = Math.ceil(metaRows.length / 2)
  const metaRowH = 26
  const metaYStart = 18
  const metaBottomPad = 10
  const metaH = metaYStart + metaPairs * metaRowH + metaBottomPad

  doc.setFillColor(theme.metaFillRgb.r, theme.metaFillRgb.g, theme.metaFillRgb.b)
  doc.setDrawColor(theme.metaStrokeRgb.r, theme.metaStrokeRgb.g, theme.metaStrokeRgb.b)
  doc.roundedRect(cardX, cardY, cardW, metaH, 14, 14, 'FD')

  const leftColX = isRtl ? cardX + cardW - 14 : cardX + 14
  const rightColX = isRtl ? cardX + 14 : cardX + cardW - 14

  setBodyFont(8, 'normal')
  let metaY = cardY + metaYStart

  for (let i = 0; i < metaRows.length; i += 2) {
    const a = metaRows[i]
    const b = metaRows[i + 1]

    doc.setTextColor(100)
    doc.text(shape(`${txt(a.k)}:`), leftColX, metaY, { align })
    doc.setTextColor(15, 23, 42)
    doc.text(shape(txt(a.v)), leftColX, metaY + 12, { align })

    if (b) {
      doc.setTextColor(100)
      doc.text(shape(`${txt(b.k)}:`), rightColX, metaY, { align: isRtl ? 'left' : 'right' })
      doc.setTextColor(15, 23, 42)
      doc.text(shape(txt(b.v)), rightColX, metaY + 12, { align: isRtl ? 'left' : 'right' })
    }

    metaY += metaRowH
  }

  const boxGap = 10
  const boxY = cardY + metaH + 10
  const boxW = (cardW - boxGap) / 2
  const partyLineHeight = 13
  const partyPad = 12
  const measureTextLines = (value, width, setter) => {
    setter()
    const lines = doc.splitTextToSize(shape(value || '—'), width)
    return Array.isArray(lines) && lines.length > 0 ? lines : ['—']
  }
  const sellerNameLines = measureTextLines(sellerName || '—', boxW - partyPad * 2, () => setHeadingFont(Math.max(bodyFontSize + 1, 10), 'bold'))
  const buyerNameLines = measureTextLines(buyerName || '—', boxW - partyPad * 2, () => setHeadingFont(Math.max(bodyFontSize + 1, 10), 'bold'))
  const sellerDetailTextLines = sellerDetailLines.flatMap((detail) => measureTextLines(detail.label ? `${detail.label}: ${detail.value}` : detail.value, boxW - partyPad * 2, () => setBodyFont(Math.max(bodyFontSize - 1, 8), 'bold')))
  const buyerDetailTextLines = buyerDetailLines.flatMap((detail) => measureTextLines(detail.label ? `${detail.label}: ${detail.value}` : detail.value, boxW - partyPad * 2, () => setBodyFont(Math.max(bodyFontSize - 1, 8), 'bold')))
  const sellerNameHeight = sellerNameLines.length * 13
  const buyerNameHeight = buyerNameLines.length * 13
  const detailStartOffset = 33 + Math.max(sellerNameHeight, buyerNameHeight)
  const partyDetailsCount = Math.max(sellerDetailTextLines.length, buyerDetailTextLines.length, 1)
  const boxH = Math.max(94, detailStartOffset + partyDetailsCount * partyLineHeight + 14)

  const drawPartyBox = ({ x, y, label, nameLines, detailLines }) => {
    doc.setFillColor(theme.boxFillRgb.r, theme.boxFillRgb.g, theme.boxFillRgb.b)
    doc.setDrawColor(theme.boxStrokeRgb.r, theme.boxStrokeRgb.g, theme.boxStrokeRgb.b)
    doc.roundedRect(x, y, boxW, boxH, 14, 14, 'FD')

    const tx = isRtl ? x + boxW - partyPad : x + partyPad

    setBodyFont(8, 'normal')
    doc.setTextColor(100)
    doc.text(shape(label), tx, y + 18, { align })

    setHeadingFont(Math.max(bodyFontSize + 1, 10), 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(nameLines, tx, y + 31, { align, maxWidth: boxW - partyPad * 2 })

    setBodyFont(Math.max(bodyFontSize - 1, 8), 'bold')
    doc.setTextColor(31, 41, 55)
    let ty = y + detailStartOffset

    for (const detailLine of detailLines.length > 0 ? detailLines : ['—']) {
      doc.text(shape(detailLine), tx, ty, { align, maxWidth: boxW - partyPad * 2 })
      ty += partyLineHeight
    }
  }

  const leftX = contentLeft
  const rightBoxX = contentLeft + boxW + boxGap

  const firstBoxX = isRtl ? rightBoxX : leftX
  const secondBoxX = isRtl ? leftX : rightBoxX

  drawPartyBox({
    x: firstBoxX,
    y: boxY,
    label: isRtl ? 'البائع' : 'Seller',
    nameLines: sellerNameLines,
    detailLines: sellerDetailTextLines,
  })

  drawPartyBox({
    x: secondBoxX,
    y: boxY,
    label: customerLabel,
    nameLines: buyerNameLines,
    detailLines: buyerDetailTextLines,
  })

  let y = boxY + boxH + 14

  if (invoice?.invoiceSubtype === 'travel_ticket') {
    const travelRows = [
      [isRtl ? 'اسم المسافر الرئيسي' : 'Lead Traveler', travelDetails.travelerDisplayName || buyerName || ''],
      [isRtl ? 'رقم الجواز' : 'Passport', travelDetails.passportNumber || ''],
      [isRtl ? 'مرجع التذكرة / PNR' : 'Ticket Reference / PNR', [travelDetails.ticketNumber, travelDetails.pnr].filter(Boolean).join(' / ')],
      [isRtl ? 'مسار الرحلة' : 'Travel Route', travelDetails.routeText || ''],
      [isRtl ? 'الناقل / مزود الخدمة' : 'Carrier / Service Provider', travelDetails.airlineDisplayName || ''],
      [isRtl ? 'تاريخ المغادرة' : 'Departure Date', formatDateTime(travelDetails.departureDate, language)],
      [isRtl ? 'تاريخ العودة' : 'Return Date', travelDetails.hasReturnDate ? formatDateTime(travelDetails.returnDate, language) : ''],
      [isRtl ? 'التوقف / الإقامة' : 'Layover / Stay', travelDetails.layoverStayDisplay || ''],
      [isRtl ? 'مسافرون إضافيون' : 'Additional Passengers', travelDetails.additionalPassengersText === '—' ? '' : travelDetails.additionalPassengersText],
    ].filter(([, value]) => String(value || '').trim())

    autoTable(doc, {
      startY: y,
      margin: { left: contentLeft, right: contentRight, top: topMargin, bottom: footerH },
      theme: 'grid',
      tableWidth: contentW,
      body: travelRows,
      styles: {
        fontSize: Math.max(8, Math.min(14, bodyFontSize - 1)),
        cellPadding: 3.5,
        font: bodyFontName,
        textColor: [15, 23, 42],
        lineColor: [203, 213, 225],
        lineWidth: 0.35,
      },
      columnStyles: {
        0: { cellWidth: 112, fontStyle: 'bold', halign: align },
        1: { cellWidth: contentW - 112, halign: align },
      },
      didDrawPage: () => {
        const pageNumber = doc.getCurrentPageInfo().pageNumber
        drawHeader({ pageNumber })
      },
    })

    y = doc.lastAutoTable.finalY + 10
  }

  setHeadingFont(Math.max(bodyFontSize + 1, 11), 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text(shape(isRtl ? 'البنود' : 'Items'), isRtl ? contentRightEdge : contentLeft, y, { align })
  y += 8

  const lineItems = totals.lines

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
    if (!l || !(l.raw?.productName || l.productName)) {
      return [
        '',
        shape(isRtl ? 'خدمة' : 'Service'),
        '1',
        money(0),
        money(0),
        money(0),
      ]
    }

    const quantity = toNumber(l.quantity)
    const unitPrice = toNumber(l.unitPrice)
    const taxAmount = toNumber(l.taxAmount)
    const lineTotalWithTax = toNumber(l.lineTotalWithTax)
    const productName = isRtl ? (l.raw?.productNameAr || l.raw?.productName || l.productNameAr || l.productName) : (l.raw?.productName || l.raw?.productNameAr || l.productName || l.productNameAr)
    const description = isRtl ? (l.raw?.descriptionAr || l.raw?.description || l.descriptionAr || l.description) : (l.raw?.description || l.raw?.descriptionAr || l.description || l.descriptionAr)
    const desc = [productName, description].filter((value, index, list) => value && list.indexOf(value) === index).join('\n')

    return [
      String(idx + 1),
      shape(desc),
      String(quantity),
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
      fontSize: Math.max(8, Math.min(14, bodyFontSize - 1)),
      cellPadding: 4,
      font: bodyFontName,
      textColor: [15, 23, 42],
      lineColor: [226, 232, 240],
      lineWidth: 0.4,
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

  const taxable = Number(totals.taxableAmount ?? 0)
  const totalTax = Number(totals.totalTax ?? 0)
  const grandTotal = Number(totals.grandTotal ?? 0)

  const totalsRows = [
    [isRtl ? 'الإجمالي الفرعي' : 'Subtotal', money(totals.subtotal)],
    [isRtl ? 'الخصم' : 'Discount', money(totals.totalDiscount)],
    [isRtl ? 'الإجمالي قبل الضريبة' : 'Taxable Amount', money(taxable)],
    [isRtl ? 'الضريبة' : 'Tax', money(totalTax)],
    [isRtl ? 'الإجمالي' : 'Total', money(grandTotal)],
  ]

  const summaryGap = 12
  const totalsW = 250
  const amountWordsW = Math.max(180, contentW - totalsW - summaryGap)
  const amountWordsLeft = isRtl ? contentRightEdge - amountWordsW : contentLeft
  const totalsLeft = isRtl ? contentLeft : contentRightEdge - totalsW
  const totalsTop = doc.lastAutoTable.finalY + 10
  const amountWordsH = Math.max(74, invoice?.notes ? 110 : 84)
  const totalsH = 118

  doc.setFillColor(255, 255, 255)
  doc.setDrawColor(theme.boxStrokeRgb.r, theme.boxStrokeRgb.g, theme.boxStrokeRgb.b)
  doc.roundedRect(amountWordsLeft, totalsTop, amountWordsW, amountWordsH, 12, 12, 'FD')

  setBodyFont(8, 'normal')
  doc.setTextColor(theme.headerMutedRgb.r, theme.headerMutedRgb.g, theme.headerMutedRgb.b)
  doc.text(shape(isRtl ? 'المبلغ كتابةً' : 'Amount in Words'), isRtl ? amountWordsLeft + amountWordsW - 12 : amountWordsLeft + 12, totalsTop + 18, { align, maxWidth: amountWordsW - 24 })

  setHeadingFont(Math.max(bodyFontSize + 1, 10), 'bold')
  doc.setTextColor(theme.headerTitleRgb.r, theme.headerTitleRgb.g, theme.headerTitleRgb.b)
  const amountWordLines = doc.splitTextToSize(shape(amountInWords), amountWordsW - 24)
  doc.text(amountWordLines, isRtl ? amountWordsLeft + amountWordsW - 12 : amountWordsLeft + 12, totalsTop + 38, { align, maxWidth: amountWordsW - 24 })

  if (invoice?.notes) {
    setBodyFont(Math.max(bodyFontSize - 1, 8), 'bold')
    doc.setTextColor(51, 65, 85)
    const noteLines = doc.splitTextToSize(shape(invoice.notes), amountWordsW - 24)
    doc.text(noteLines, isRtl ? amountWordsLeft + amountWordsW - 12 : amountWordsLeft + 12, totalsTop + 68, { align, maxWidth: amountWordsW - 24 })
  }

  doc.setFillColor(lightRgb.r, lightRgb.g, lightRgb.b)
  doc.setDrawColor(theme.boxStrokeRgb.r, theme.boxStrokeRgb.g, theme.boxStrokeRgb.b)
  doc.roundedRect(totalsLeft, totalsTop, totalsW, totalsH, 12, 12, 'FD')

  let totalsY = totalsTop + 18
  for (let i = 0; i < totalsRows.length; i += 1) {
    const [label, value] = totalsRows[i]
    const isGrandTotal = i === totalsRows.length - 1

    if (isGrandTotal) {
      setHeadingFont(Math.max(bodyFontSize + 4, 12), 'bold')
    } else {
      setBodyFont(Math.max(bodyFontSize - 1, 8), 'bold')
    }
    doc.setTextColor(isGrandTotal ? theme.headerTitleRgb.r : theme.headerMutedRgb.r, isGrandTotal ? theme.headerTitleRgb.g : theme.headerMutedRgb.g, isGrandTotal ? theme.headerTitleRgb.b : theme.headerMutedRgb.b)
    doc.text(shape(label), isRtl ? totalsLeft + totalsW - 14 : totalsLeft + 14, totalsY, { align, maxWidth: 132 })

    doc.setTextColor(theme.headerTitleRgb.r, theme.headerTitleRgb.g, theme.headerTitleRgb.b)
    doc.text(shape(value), isRtl ? totalsLeft + 14 : totalsLeft + totalsW - 14, totalsY, { align: oppositeAlign, maxWidth: 110 })

    if (isGrandTotal) {
      doc.setDrawColor(203, 213, 225)
      doc.line(totalsLeft + 14, totalsY - 12, totalsLeft + totalsW - 14, totalsY - 12)
    }

    totalsY += isGrandTotal ? 20 : 16
  }

  const pageCount = doc.getNumberOfPages()
  const generatedAt = `${isRtl ? 'تاريخ الإنشاء' : 'Generated'}: ${formatDateTime(new Date(), language)}`
  const footerTextLines = footerLines.length > 0 ? footerLines : []
  const footerVisionW = 74
  const footerVisionH = 30
  const footerVisionX = contentLeft
  const footerVisionY = pageH - footerH + 20

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    setBodyFont(9, 'normal')
    doc.setTextColor(100)

    doc.setDrawColor(226, 232, 240)
    doc.line(contentLeft, pageH - footerH + 6, contentRightEdge, pageH - footerH + 6)

    if (visionLogo && visionLogoFormat) {
      doc.addImage(visionLogo, visionLogoFormat, footerVisionX, footerVisionY, footerVisionW, footerVisionH)
    }

    if (footerTextLines.length > 0) {
      setBodyFont(8, 'normal')
      let footerY = pageH - footerH + 22
      for (const line of footerTextLines.slice(0, 3)) {
        doc.text(shape(line), pageW / 2, footerY, { align: 'center', maxWidth: contentW - (visionLogo && visionLogoFormat ? 160 : 120) })
        footerY += 10
      }
      setBodyFont(9, 'normal')
    }

    doc.text(
      shape(generatedAt),
      isRtl ? contentRightEdge : contentLeft + (visionLogo && visionLogoFormat ? footerVisionW + 12 : 0),
      pageH - 16,
      { align }
    )

    doc.text(
      `${i} / ${pageCount}`,
      isRtl ? contentLeft : contentRightEdge,
      pageH - 16,
      { align: oppositeAlign }
    )
  }

  const name = sanitizeFileName(invoice.invoiceNumber || 'invoice')
  doc.save(`${name}.pdf`)
}
