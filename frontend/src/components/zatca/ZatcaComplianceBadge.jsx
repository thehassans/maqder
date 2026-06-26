import { ShieldCheck, Clock, XCircle, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

const STATUS_CONFIG = {
  reported: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Reported' },
  cleared: { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Cleared' },
  submitted: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Submitted' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Pending' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Warning' },
  rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Rejected' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', label: 'Failed' },
}

export default function ZatcaComplianceBadge({ status, size = 'sm' }) {
  if (!status) return null

  const config = STATUS_CONFIG[status] || { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-dark-800', label: status }
  const Icon = config.icon

  const sizeClasses = size === 'xs'
    ? 'px-1.5 py-0.5 text-[10px] gap-1'
    : size === 'sm'
    ? 'px-2 py-1 text-xs gap-1'
    : 'px-3 py-1.5 text-sm gap-1.5'

  const iconSize = size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.color} ${sizeClasses}`}>
      <Icon className={iconSize} />
      {config.label}
    </span>
  )
}
