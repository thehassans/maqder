import { useSelector } from 'react-redux'
import { formatCurrency } from '../../lib/currency'
import SarIcon from './SarIcon'

export default function Money({ value, className = '', minimumFractionDigits, maximumFractionDigits }) {
  const { language } = useSelector((state) => state.ui)

  const formatted = formatCurrency(value, {
    language,
    currencyDisplay: 'code',
    minimumFractionDigits,
    maximumFractionDigits
  })

  const withoutCode = formatted.replace(/\s*SAR\s*/gi, ' ').trim()

  return (
    <span className={`inline-flex items-center gap-1 ${className}`.trim()}>
      <SarIcon className="w-[1em] h-[1em]" />
      <span>{withoutCode}</span>
    </span>
  )
}
