export const resolveZatcaStatus = (invoice, phase = 2) => {
  const submissionStatus = String(invoice?.zatca?.submissionStatus || '').trim().toLowerCase()
  const invoiceStatus = String(invoice?.status || '').trim().toLowerCase()

  if (submissionStatus && submissionStatus !== 'pending') return submissionStatus

  if (invoiceStatus === 'draft' && !invoice?.zatca?.signedXml && !(phase === 1 && invoice?.zatca?.qrCodeData)) {
    return 'draft'
  }

  if (invoice?.zatca?.submittedAt) {
    return invoice?.transactionType === 'B2C' ? 'reported' : 'submitted'
  }

  if (invoice?.zatca?.signedXml || invoice?.zatca?.invoiceHash || (phase === 1 && invoice?.zatca?.qrCodeData)) {
    return submissionStatus === 'pending' ? 'generated' : (submissionStatus || 'generated')
  }

  if (invoice?.zatca?.qrCodeData && !invoice?.zatca?.signedXml) {
    return invoiceStatus === 'pending' ? 'not_started' : (submissionStatus || 'draft')
  }

  return submissionStatus || 'not_started'
}

export const getZatcaStatusMeta = (invoice, language = 'en', phase = 2) => {
  const status = resolveZatcaStatus(invoice, phase)

  const labelsPhase2 = {
    cleared: language === 'ar' ? 'تمت التصفية' : 'Cleared',
    reported: language === 'ar' ? 'تم الإبلاغ' : 'Reported',
    submitted: language === 'ar' ? 'تم الإرسال' : 'Submitted',
    generated: language === 'ar' ? 'تم إنشاء الفاتورة الإلكترونية' : 'E-Invoice Generated',
    rejected: language === 'ar' ? 'مرفوضة' : 'Rejected',
    warning: language === 'ar' ? 'تحذير' : 'Warning',
    draft: language === 'ar' ? 'مسودة' : 'Draft',
    not_started: language === 'ar' ? 'غير مرسلة' : 'Not Submitted',
    pending: language === 'ar' ? 'قيد المعالجة' : 'Processing',
  }

  const labelsPhase1 = {
    ...labelsPhase2,
    generated: language === 'ar' ? 'مكتملة' : 'Finalized',
    not_started: language === 'ar' ? 'مسودة' : 'Draft',
  }

  const labels = phase === 1 ? labelsPhase1 : labelsPhase2

  const tones = {
    cleared: 'success',
    reported: 'info',
    submitted: 'info',
    generated: 'info',
    rejected: 'danger',
    warning: 'warning',
    draft: 'neutral',
    not_started: 'neutral',
    pending: 'warning',
  }

  return {
    status,
    label: labels[status] || status,
    tone: tones[status] || 'neutral',
  }
}

export const hasGeneratedEInvoice = (invoice, phase = 2) => {
  const status = resolveZatcaStatus(invoice, phase)
  if (['generated', 'reported', 'submitted', 'cleared', 'warning', 'rejected'].includes(status)) {
    return true
  }

  return Boolean(
    invoice?.zatca?.signedXml
    || invoice?.zatca?.invoiceHash
    || invoice?.zatca?.uuid
    || invoice?.zatca?.submittedAt
    || (phase === 1 && invoice?.zatca?.qrCodeData)
  )
}

export const isEditableInvoice = (invoice, phase = 2) => {
  const invoiceStatus = String(invoice?.status || '').trim().toLowerCase()
  return ['draft', 'pending'].includes(invoiceStatus) && !hasGeneratedEInvoice(invoice, phase)
}
