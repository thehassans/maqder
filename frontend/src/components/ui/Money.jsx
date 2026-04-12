import { useSelector } from 'react-redux'
import { formatCurrency, formatCurrencyAmount, isSarCurrency } from '../../lib/currency'
import SarIcon from './SarIcon'

const joinClasses = (...classes) => classes.filter(Boolean).join(' ')

const renderSarMoney = ({ formatted, className = '', amountClassName = '', iconClassName = '' }) => (
  <span dir="ltr" className={joinClasses('inline whitespace-nowrap tabular-nums', className)}>
    <span className={joinClasses('inline', amountClassName)}>{formatted}</span>
    <SarIcon
      className={joinClasses('ms-[0.15em] shrink-0', iconClassName)}
      style={{ display: 'inline', width: '0.75em', height: '0.75em', verticalAlign: '-0.32em' }}
      title="Saudi Riyal"
    />
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
