import { useSelector } from 'react-redux'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import SarIcon from './SarIcon'

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

const renderSarMoney = ({ formatted, className = '', amountClassName = '', iconClassName = '' }) => (
  <span dir="ltr" className={joinClasses('inline whitespace-nowrap tabular-nums leading-none', className)}>
    <span className={joinClasses('relative -top-[0.02em] inline-block leading-none', amountClassName)}>{formatted}</span>
    <span className="ms-[0.14em] inline-block h-[0.82em] w-[0.82em] overflow-visible align-[-0.2em]">
      <SarIcon
        className={joinClasses('block h-full w-full shrink-0 overflow-visible', iconClassName)}
        style={{ overflow: 'visible' }}
        title="Saudi Riyal"
      />
    </span>
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
