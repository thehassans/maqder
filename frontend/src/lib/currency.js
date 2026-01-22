export const CURRENCY_CODE = 'SAR'

export const formatCurrency = (
  value,
  {
    language = 'en',
    currency = CURRENCY_CODE,
    currencyDisplay = 'code',
    minimumFractionDigits,
    maximumFractionDigits,
  } = {}
) => {
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA'
  const numericValue = typeof value === 'number' ? value : Number(value)
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0

  const options = {
    style: 'currency',
    currency,
    currencyDisplay,
  }

  if (typeof minimumFractionDigits === 'number') {
    options.minimumFractionDigits = minimumFractionDigits
  }

  if (typeof maximumFractionDigits === 'number') {
    options.maximumFractionDigits = maximumFractionDigits
  }

  return new Intl.NumberFormat(locale, options).format(safeValue)
}
