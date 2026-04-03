export const CURRENCY_CODE = 'SAR'
export const SAR_SYMBOL = '﷼'

export const isSarCurrency = (currency = CURRENCY_CODE) => String(currency || CURRENCY_CODE).trim().toUpperCase() === CURRENCY_CODE

const getFormatter = ({
  language = 'en',
  currency = CURRENCY_CODE,
  currencyDisplay = 'code',
  minimumFractionDigits,
  maximumFractionDigits,
}) => {
  const locale = language === 'ar' ? 'ar-SA' : 'en-SA'
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

  return new Intl.NumberFormat(locale, options)
}

const getSafeValue = (value) => {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

export const formatCurrencyAmount = (
  value,
  {
    language = 'en',
    currency = CURRENCY_CODE,
    currencyDisplay = 'code',
    minimumFractionDigits,
    maximumFractionDigits,
  } = {}
) => {
  const safeValue = getSafeValue(value)
  const formatter = getFormatter({
    language,
    currency,
    currencyDisplay,
    minimumFractionDigits,
    maximumFractionDigits,
  })

  return formatter
    .formatToParts(safeValue)
    .filter((part) => part.type !== 'currency')
    .map((part) => part.value)
    .join('')
    .replace(/[\u200e\u200f\u061c]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

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
  const safeValue = getSafeValue(value)
  const formatter = getFormatter({
    language,
    currency,
    currencyDisplay,
    minimumFractionDigits,
    maximumFractionDigits,
  })

  if (currencyDisplay === 'code' && isSarCurrency(currency)) {
    return `${SAR_SYMBOL} ${formatCurrencyAmount(safeValue, {
      language,
      currency,
      currencyDisplay,
      minimumFractionDigits,
      maximumFractionDigits,
    })}`.trim()
  }

  return formatter.format(safeValue)
}
