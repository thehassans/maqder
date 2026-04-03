import { useSelector } from 'react-redux'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import SarIcon from './SarIcon'

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

export default function Money({
  value,
  className = '',
  amountClassName = '',
  iconClassName = 'w-[0.82em] h-[0.82em]',
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
    return <span className={joinClasses('whitespace-nowrap tabular-nums', className)}>{formatted}</span>
  }

  return (
    <span className={joinClasses('inline-flex items-baseline whitespace-nowrap align-baseline tabular-nums leading-none', className)}>
      <SarIcon className={joinClasses('me-[0.22em] shrink-0 self-baseline translate-y-[0.08em]', iconClassName)} title="Saudi Riyal" />
      <span className={joinClasses('leading-none', amountClassName)}>{formatted}</span>
    </span>
  )
}
