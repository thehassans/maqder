export const toNumber = (value, fallback = 0) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

export const passengerTitleLabel = (value, language = 'en') => {
  const labels = {
    mr: language === 'ar' ? 'السيد' : 'Mr.',
    mrs: language === 'ar' ? 'السيدة' : 'Mrs.',
    ms: language === 'ar' ? 'الآنسة' : 'Ms.',
  }
  return labels[value] || ''
}

export const sanitizeTravelSegments = (segments = []) => {
  return (Array.isArray(segments) ? segments : [])
    .map((segment) => ({
      from: String(segment?.from || '').trim(),
      to: String(segment?.to || '').trim(),
      fromAr: String(segment?.fromAr || '').trim(),
      toAr: String(segment?.toAr || '').trim(),
    }))
    .filter((segment) => segment.from || segment.to || segment.fromAr || segment.toAr)
}

export const formatPassengerList = (passengers = [], language = 'en') => {
  const safePassengers = Array.isArray(passengers) ? passengers : []
  return safePassengers
    .map((passenger) => {
      const title = passengerTitleLabel(passenger?.title, language)
      const name = String(language === 'ar' ? (passenger?.nameAr || passenger?.name || '') : (passenger?.name || passenger?.nameAr || '')).trim()
      const passportNumber = String(passenger?.passportNumber || '').trim()
      const label = [title, name].filter(Boolean).join(' ')
      if (label && passportNumber) return `${label} (${passportNumber})`
      return label || passportNumber
    })
    .filter(Boolean)
    .join(', ')
}

const formatRouteLeg = (from, to) => {
  const fromCode = String(from || '').trim()
  const toCode = String(to || '').trim()
  if (fromCode && toCode) return `${fromCode} - ${toCode}`
  return fromCode || toCode || '—'
}

export const getRouteText = (travelDetails = {}, language = 'en') => {
  const segments = sanitizeTravelSegments(travelDetails?.segments)
  if (segments.length > 0) {
    return segments
      .map((segment) => formatRouteLeg(
        language === 'ar' ? (segment.fromAr || segment.from || 'غير محدد') : (segment.from || segment.fromAr || 'Unknown'),
        language === 'ar' ? (segment.toAr || segment.to || 'غير محدد') : (segment.to || segment.toAr || 'Unknown'),
      ))
      .join(' | ')
  }

  const routeFrom = String(language === 'ar' ? (travelDetails?.routeFromAr || travelDetails?.routeFrom || '') : (travelDetails?.routeFrom || travelDetails?.routeFromAr || '')).trim()
  const routeTo = String(language === 'ar' ? (travelDetails?.routeToAr || travelDetails?.routeTo || '') : (travelDetails?.routeTo || travelDetails?.routeToAr || '')).trim()
  if (routeFrom && routeTo) return formatRouteLeg(routeFrom, routeTo)
  return routeFrom || routeTo || '—'
}

export const normalizeTravelDetails = (travelDetails = {}, buyerName = '', language = 'en') => {
  const segments = sanitizeTravelSegments(travelDetails?.segments)
  const firstSegment = segments[0]
  const lastSegment = segments[segments.length - 1]
  const routeFrom = String(language === 'ar' ? (travelDetails?.routeFromAr || travelDetails?.routeFrom || firstSegment?.fromAr || firstSegment?.from || '') : (travelDetails?.routeFrom || travelDetails?.routeFromAr || firstSegment?.from || firstSegment?.fromAr || '')).trim()
  const routeTo = String(language === 'ar' ? (travelDetails?.routeToAr || travelDetails?.routeTo || lastSegment?.toAr || lastSegment?.to || '') : (travelDetails?.routeTo || travelDetails?.routeToAr || lastSegment?.to || lastSegment?.toAr || '')).trim()
  const hasReturnDate = Boolean((travelDetails?.hasReturnDate ?? true) && travelDetails?.returnDate)
  const travelerName = String(language === 'ar' ? (travelDetails?.travelerNameAr || travelDetails?.travelerName || buyerName || '') : (travelDetails?.travelerName || travelDetails?.travelerNameAr || buyerName || '')).trim()
  const travelerDisplayName = [passengerTitleLabel(travelDetails?.passengerTitle, language), travelerName].filter(Boolean).join(' ')
  const airlineDisplayName = String(language === 'ar' ? (travelDetails?.airlineNameAr || travelDetails?.airlineName || '') : (travelDetails?.airlineName || travelDetails?.airlineNameAr || '')).trim()
  const layoverStayDisplay = String(language === 'ar' ? (travelDetails?.layoverStayAr || travelDetails?.layoverStay || '') : (travelDetails?.layoverStay || travelDetails?.layoverStayAr || '')).trim()

  return {
    ...travelDetails,
    routeFrom,
    routeTo,
    segments,
    hasReturnDate,
    travelerName,
    travelerDisplayName,
    airlineDisplayName,
    layoverStayDisplay,
    routeText: getRouteText({ ...travelDetails, routeFrom, routeTo, segments }, language),
    additionalPassengersText: formatPassengerList(travelDetails?.passengers, language) || '—',
  }
}

export const calculateInvoiceSummary = (invoice = {}) => {
  const lines = Array.isArray(invoice?.lineItems) ? invoice.lineItems : []
  const invoiceDiscountInput = Math.max(0, toNumber(invoice?.invoiceDiscount, 0))

  const normalizedLines = lines.map((line) => {
    const quantity = Math.max(0, toNumber(line?.quantity, 0))
    const unitPrice = Math.max(0, toNumber(line?.unitPrice, 0))
    const taxRate = Math.max(0, toNumber(line?.taxRate, 0))
    const agencyPrice = Math.max(0, toNumber(line?.agencyPrice, 0))
    const isTravelMargin = Boolean(line?.isTravelMargin) && agencyPrice > 0 && agencyPrice <= unitPrice
    const lineSubtotal = quantity * unitPrice
    const rawDiscount = Math.max(0, toNumber(line?.discount, 0))
    const lineDiscount = line?.discountType === 'percentage'
      ? Math.min(lineSubtotal, lineSubtotal * (rawDiscount / 100))
      : Math.min(lineSubtotal, rawDiscount)
    const netBeforeInvoiceDiscount = Math.max(0, lineSubtotal - lineDiscount)
    const marginBeforeInvoiceDiscount = isTravelMargin
      ? Math.max(0, quantity * (unitPrice - agencyPrice) - (lineDiscount * (unitPrice > 0 ? (unitPrice - agencyPrice) / unitPrice : 0)))
      : 0

    return {
      raw: line,
      quantity,
      unitPrice,
      taxRate,
      agencyPrice,
      isTravelMargin,
      lineSubtotal,
      lineDiscount,
      netBeforeInvoiceDiscount,
      marginBeforeInvoiceDiscount,
    }
  })

  const subtotal = normalizedLines.reduce((sum, line) => sum + line.lineSubtotal, 0)
  const subtotalBeforeInvoiceDiscount = normalizedLines.reduce((sum, line) => sum + line.netBeforeInvoiceDiscount, 0)
  const appliedInvoiceDiscount = Math.min(invoiceDiscountInput, subtotalBeforeInvoiceDiscount)
  let remainingInvoiceDiscount = appliedInvoiceDiscount

  const lineSummaries = normalizedLines.map((line, index) => {
    const isLast = index === normalizedLines.length - 1
    const proportionalDiscount = subtotalBeforeInvoiceDiscount > 0
      ? appliedInvoiceDiscount * (line.netBeforeInvoiceDiscount / subtotalBeforeInvoiceDiscount)
      : 0
    const invoiceDiscountShare = isLast
      ? remainingInvoiceDiscount
      : Math.min(remainingInvoiceDiscount, proportionalDiscount)
    const taxableLineTotal = Math.max(0, line.netBeforeInvoiceDiscount - invoiceDiscountShare)
    const marginShareFactor = line.netBeforeInvoiceDiscount > 0
      ? Math.max(0, line.netBeforeInvoiceDiscount - invoiceDiscountShare) / line.netBeforeInvoiceDiscount
      : 0
    const marginTaxable = line.isTravelMargin
      ? Math.max(0, line.marginBeforeInvoiceDiscount * marginShareFactor)
      : 0
    const vatBase = line.isTravelMargin ? marginTaxable : taxableLineTotal
    const taxAmount = vatBase * (line.taxRate / 100)
    const lineTotalWithTax = taxableLineTotal + taxAmount

    remainingInvoiceDiscount = Math.max(0, remainingInvoiceDiscount - invoiceDiscountShare)

    return {
      ...line,
      invoiceDiscountShare,
      lineTotal: taxableLineTotal,
      marginTaxable,
      taxAmount,
      lineTotalWithTax,
    }
  })

  const lineDiscountTotal = lineSummaries.reduce((sum, line) => sum + line.lineDiscount, 0)
  const taxableAmount = lineSummaries.reduce((sum, line) => sum + line.lineTotal, 0)
  const totalTax = lineSummaries.reduce((sum, line) => sum + line.taxAmount, 0)
  const grandTotal = taxableAmount + totalTax
  const travelMarginTaxable = lineSummaries.reduce((sum, line) => sum + (line.isTravelMargin ? line.marginTaxable : 0), 0)
  const travelAgencyCost = lineSummaries.reduce((sum, line) => sum + (line.isTravelMargin ? line.quantity * line.agencyPrice : 0), 0)

  return {
    subtotal,
    invoiceDiscount: appliedInvoiceDiscount,
    totalDiscount: lineDiscountTotal + appliedInvoiceDiscount,
    taxableAmount,
    totalTax,
    grandTotal,
    travelMarginTaxable,
    travelAgencyCost,
    lines: lineSummaries,
  }
}
