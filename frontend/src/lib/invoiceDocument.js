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
    }))
    .filter((segment) => segment.from || segment.to)
}

export const formatPassengerList = (passengers = [], language = 'en') => {
  const safePassengers = Array.isArray(passengers) ? passengers : []
  return safePassengers
    .map((passenger) => {
      const title = passengerTitleLabel(passenger?.title, language)
      const name = String(passenger?.name || '').trim()
      const passportNumber = String(passenger?.passportNumber || '').trim()
      const label = [title, name].filter(Boolean).join(' ')
      if (label && passportNumber) return `${label} (${passportNumber})`
      return label || passportNumber
    })
    .filter(Boolean)
    .join(', ')
}

export const getRouteText = (travelDetails = {}, language = 'en') => {
  const segments = sanitizeTravelSegments(travelDetails?.segments)
  if (segments.length > 0) {
    return segments
      .map((segment) => [segment.from || (language === 'ar' ? 'غير محدد' : 'Unknown'), segment.to || (language === 'ar' ? 'غير محدد' : 'Unknown')].join(' → '))
      .join('   •   ')
  }

  const routeFrom = String(travelDetails?.routeFrom || '').trim()
  const routeTo = String(travelDetails?.routeTo || '').trim()
  if (routeFrom && routeTo) return `${routeFrom} → ${routeTo}`
  return routeFrom || routeTo || '—'
}

export const normalizeTravelDetails = (travelDetails = {}, buyerName = '', language = 'en') => {
  const segments = sanitizeTravelSegments(travelDetails?.segments)
  const firstSegment = segments[0]
  const lastSegment = segments[segments.length - 1]
  const routeFrom = String(travelDetails?.routeFrom || firstSegment?.from || '').trim()
  const routeTo = String(travelDetails?.routeTo || lastSegment?.to || '').trim()
  const hasReturnDate = Boolean((travelDetails?.hasReturnDate ?? true) && travelDetails?.returnDate)
  const travelerName = String(travelDetails?.travelerName || buyerName || '').trim()
  const travelerDisplayName = [passengerTitleLabel(travelDetails?.passengerTitle, language), travelerName].filter(Boolean).join(' ')

  return {
    ...travelDetails,
    routeFrom,
    routeTo,
    segments,
    hasReturnDate,
    travelerName,
    travelerDisplayName,
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
    const lineSubtotal = quantity * unitPrice
    const rawDiscount = Math.max(0, toNumber(line?.discount, 0))
    const lineDiscount = line?.discountType === 'percentage'
      ? Math.min(lineSubtotal, lineSubtotal * (rawDiscount / 100))
      : Math.min(lineSubtotal, rawDiscount)
    const netBeforeInvoiceDiscount = Math.max(0, lineSubtotal - lineDiscount)

    return {
      raw: line,
      quantity,
      unitPrice,
      taxRate,
      lineSubtotal,
      lineDiscount,
      netBeforeInvoiceDiscount,
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
    const taxAmount = taxableLineTotal * (line.taxRate / 100)
    const lineTotalWithTax = taxableLineTotal + taxAmount

    remainingInvoiceDiscount = Math.max(0, remainingInvoiceDiscount - invoiceDiscountShare)

    return {
      ...line,
      invoiceDiscountShare,
      lineTotal: taxableLineTotal,
      taxAmount,
      lineTotalWithTax,
    }
  })

  const lineDiscountTotal = lineSummaries.reduce((sum, line) => sum + line.lineDiscount, 0)
  const taxableAmount = lineSummaries.reduce((sum, line) => sum + line.lineTotal, 0)
  const totalTax = lineSummaries.reduce((sum, line) => sum + line.taxAmount, 0)
  const grandTotal = taxableAmount + totalTax

  return {
    subtotal,
    invoiceDiscount: appliedInvoiceDiscount,
    totalDiscount: lineDiscountTotal + appliedInvoiceDiscount,
    taxableAmount,
    totalTax,
    grandTotal,
    lines: lineSummaries,
  }
}
