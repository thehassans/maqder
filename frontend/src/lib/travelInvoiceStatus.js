import { resolveZatcaStatus } from './zatcaStatus'

const SUCCESS_STATUSES = new Set(['submitted', 'reported', 'cleared'])

const toValidDate = (value) => {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export const isTravelAgencyInvoice = (invoice) => invoice?.businessContext === 'travel_agency' || invoice?.invoiceSubtype === 'travel_ticket'

export const getTravelInvoiceRelevantDate = (invoice) => {
  return toValidDate(invoice?.travelDetails?.departureDate) || toValidDate(invoice?.dueDate)
}

export const getTravelInvoiceSubmissionState = (invoice) => {
  const status = resolveZatcaStatus(invoice)
  if (SUCCESS_STATUSES.has(status)) return 'submitted'

  const relevantDate = getTravelInvoiceRelevantDate(invoice)
  if (relevantDate && relevantDate.getTime() < Date.now()) {
    return 'overdue'
  }

  return 'pending_submission'
}

export const getTravelInvoiceLabelMeta = (invoice, language = 'en') => {
  const state = getTravelInvoiceSubmissionState(invoice)

  if (state === 'submitted') {
    return {
      state,
      className: 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300',
      textClassName: 'text-emerald-700 dark:text-emerald-300',
      description: language === 'ar' ? 'تم الإرسال إلى هيئة الزكاة' : 'Submitted to ZATCA',
    }
  }

  if (state === 'overdue') {
    return {
      state,
      className: 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300',
      textClassName: 'text-amber-700 dark:text-amber-300',
      description: language === 'ar' ? 'تجاوزت الرحلة موعدها ولم تُرسل بعد' : 'Flight date has passed and it is still not submitted',
    }
  }

  return {
    state,
    className: 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300',
    textClassName: 'text-red-700 dark:text-red-300',
    description: language === 'ar' ? 'بانتظار الإرسال إلى هيئة الزكاة' : 'Waiting to be submitted to ZATCA',
  }
}
