export const resolveZatcaStatus = (invoice) => {
  const submissionStatus = String(invoice?.zatca?.submissionStatus || '').trim().toLowerCase()
  const invoiceStatus = String(invoice?.status || '').trim().toLowerCase()

  if (submissionStatus && submissionStatus !== 'pending') return submissionStatus

  if (invoiceStatus === 'draft' && !invoice?.zatca?.signedXml) {
    return 'draft'
  }

  if (invoice?.zatca?.submittedAt) {
    return invoice?.transactionType === 'B2C' ? 'reported' : 'submitted'
  }

  if (invoice?.zatca?.signedXml || invoice?.zatca?.invoiceHash) {
    return submissionStatus === 'pending' ? 'generated' : submissionStatus
  }

  if (invoice?.zatca?.qrCodeData && !invoice?.zatca?.signedXml) {
    return invoiceStatus === 'pending' ? 'not_started' : (submissionStatus || 'draft')
  }

  return submissionStatus || 'not_started'
}

export const getZatcaStatusMeta = (invoice, language = 'en') => {
  const status = resolveZatcaStatus(invoice)

  const labels = {
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
