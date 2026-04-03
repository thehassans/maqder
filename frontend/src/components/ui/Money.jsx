import { useSelector } from 'react-redux'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import SarIcon from './SarIcon'

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

const renderSarMoney = ({ formatted, className = '', amountClassName = '', iconClassName = '' }) => (
  <span dir="ltr" className={joinClasses('whitespace-nowrap tabular-nums', className)}>
    <SarIcon className={joinClasses('me-[0.18em] h-[0.82em] w-[0.72em]', iconClassName)} title="Saudi Riyal" />
    <span className={joinClasses('inline leading-none', amountClassName)}>{formatted}</span>
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
    return <span dir="ltr" className={joinClasses('whitespace-nowrap tabular-nums', className)}>{formatted}</span>
  }

  return renderSarMoney({ formatted, className, amountClassName, iconClassName })
}
