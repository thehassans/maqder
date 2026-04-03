import { useSelector } from 'react-redux'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import SarIcon from './SarIcon'

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

const renderSarMoney = ({ formatted, className = '', amountClassName = '', iconClassName = '' }) => (
  <span dir="ltr" className={joinClasses('inline-flex items-center justify-end whitespace-nowrap align-middle tabular-nums', className)}>
    <span className={joinClasses('me-[0.18em] inline-flex h-[0.9em] w-[0.78em] shrink-0 items-center justify-center align-middle', iconClassName)}>
      <SarIcon className="block h-full w-full" title="Saudi Riyal" />
    </span>
    <span className={joinClasses('inline-block leading-none align-middle', amountClassName)}>{formatted}</span>
  </span>
)

export default function Money({
  value,
  className = '',
  amountClassName = '',
  iconClassName = '',
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
    return <span dir="ltr" className={joinClasses('inline-flex items-center whitespace-nowrap tabular-nums', className)}>{formatted}</span>
  }

  return renderSarMoney({ formatted, className, amountClassName, iconClassName })
}
