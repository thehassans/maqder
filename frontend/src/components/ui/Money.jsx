import { useSelector } from 'react-redux'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import SarIcon from './SarIcon'

export default function Money({
  value,
  className = '',
  amountClassName = '',
  iconClassName = 'w-[1em] h-[1em]',
  minimumFractionDigits,
  maximumFractionDigits,
  currency = 'SAR',
  language: providedLanguage,
}) {
  const { language: storeLanguage } = useSelector((state) => state.ui)
  const language = providedLanguage || storeLanguage

  const isSar = isSarCurrency(currency)

  const formatted = isSar
    ? formatCurrencyAmount(value, {
        language,
        currency,
        currencyDisplay: 'code',
        minimumFractionDigits,
        maximumFractionDigits
      })
    : formatCurrency(value, {
        language,
        currency,
        currencyDisplay: 'code',
        minimumFractionDigits,
        maximumFractionDigits
      })

  if (!isSar) {
    return <span className={className}>{formatted}</span>
  }

  return (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      <SarIcon className={iconClassName} title="Saudi Riyal" />
      <span className={amountClassName}>{formatted}</span>
    </span>
  )
}
