import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Package,
  Calendar,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Trash2,
  ArrowRight,
  Box,
  ClipboardCheck,
  XCircle,
  Ban,
  Scissors,
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

/**
 * BoutiqueRentals — full rental lifecycle management
 * Shows all rentals with status filtering and transition actions.
 */

const STATUS_TABS = [
  { key: 'all', label: 'All', labelAr: 'الكل' },
  { key: 'reserved', label: 'Reserved', labelAr: 'محجوز' },
  { key: 'picked_up', label: 'Picked Up', labelAr: 'تم الاستلام' },
  { key: 'late_return', label: 'Late', labelAr: 'متأخر' },
  { key: 'returned', label: 'Returned', labelAr: 'تم الإرجاع' },
  { key: 'inspected', label: 'Inspected', labelAr: 'تم الفحص' },
  { key: 'closed', label: 'Closed', labelAr: 'مغلق' },
  { key: 'cancelled', label: 'Cancelled', labelAr: 'ملغى' },
]

const STATUS_CONFIG = {
  draft: { color: 'bg-gray-100 text-gray-600', icon: Box },
  reserved: { color: 'bg-amber-50 text-amber-700', icon: Clock },
  picked_up: { color: 'bg-blue-50 text-blue-700', icon: RefreshCw },
  late_return: { color: 'bg-red-50 text-red-700', icon: AlertTriangle },
  returned: { color: 'bg-purple-50 text-purple-700', icon: Box },
  inspected: { color: 'bg-teal-50 text-teal-700', icon: ClipboardCheck },
  closed: { color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  cancelled: { color: 'bg-gray-100 text-gray-500', icon: Ban },
  disputed: { color: 'bg-orange-50 text-orange-700', icon: AlertTriangle },
}

// Allowed transitions per status (frontend mirror of backend logic)
const ALLOWED_TRANSITIONS = {
  reserved: [
    { status: 'picked_up', label: 'Mark Picked Up', labelAr: 'تم الاستلام', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { status: 'cancelled', label: 'Cancel', labelAr: 'إلغاء', color: 'bg-gray-50 text-gray-600 hover:bg-gray-100' },
  ],
  picked_up: [
    { status: 'returned', label: 'Mark Returned', labelAr: 'تم الإرجاع', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  ],
  late_return: [
    { status: 'returned', label: 'Mark Returned', labelAr: 'تم الإرجاع', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
  ],
  returned: [
    { status: 'inspected', label: 'Mark Inspected', labelAr: 'تم الفحص', color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
  ],
  inspected: [
    { status: 'closed', label: 'Close', labelAr: 'إغلاق', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { status: 'disputed', label: 'Dispute', labelAr: 'نزاع', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  ],
  disputed: [
    { status: 'closed', label: 'Close', labelAr: 'إغلاق', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  ],
}

export default function BoutiquePendingReturns() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()

  const isArabic = language === 'ar'
  const label = (en, ar) => (isArabic ? ar : en)

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['boutique-rentals', statusFilter],
    queryFn: () =>
      api
        .get('/boutique/rentals', {
          params: {
            status: statusFilter === 'all' ? undefined : statusFilter,
            limit: 200,
          },
        })
        .then((res) => res.data.rentals || []),
  })

  const rentals = data || []

  const filteredRentals = rentals.filter((r) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      r.customerName?.toLowerCase().includes(term) ||
      r.customerPhone?.includes(term) ||
      r.rentalNumber?.toLowerCase().includes(term)
    )
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status, note }) =>
      api.patch(`/boutique/rentals/${id}/status`, { status, note }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-rentals'] })
      queryClient.invalidateQueries({ queryKey: ['boutique-pending-returns'] })
    },
  })

  const isOverdue = (rental) => {
    const end = new Date(rental.endDate)
    return end < new Date() && ['picked_up', 'late_return'].includes(rental.status)
  }

  const daysUntil = (rental) => {
    const diff = Math.ceil((new Date(rental.endDate) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const renderStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color}`}>
        <Icon className="w-3 h-3" />
        {label(status.replace(/_/g, ' '), status === 'picked_up' ? 'تم الاستلام' : status === 'late_return' ? 'متأخر' : status === 'reserved' ? 'محجوز' : status === 'returned' ? 'تم الإرجاع' : status === 'inspected' ? 'تم الفحص' : status === 'closed' ? 'مغلق' : status === 'cancelled' ? 'ملغى' : status === 'disputed' ? 'نزاع' : status)}
      </span>
    )
  }

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-rose-500" />
            {label('Rentals', 'الإيجارات')}
          </h1>
          <p className="text-gray-500 mt-1">
            {label('Track and manage all rental orders', 'تتبع وإدارة جميع أوامر الإيجار')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={label('Search...', 'بحث...')}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm w-48 focus:ring-2 focus:ring-rose-200 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label(tab.label, tab.labelAr)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">{label('Loading...', 'جاري التحميل...')}</div>
      ) : filteredRentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
          <p>{label('No rentals found', 'لا توجد إيجارات')}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">{label('Rental #', 'رقم الإيجار')}</th>
                  <th className="px-4 py-3 text-left font-bold">{label('Customer', 'العميل')}</th>
                  <th className="px-4 py-3 text-left font-bold">{label('Items', 'المنتجات')}</th>
                  <th className="px-4 py-3 text-left font-bold">{label('Dates', 'التواريخ')}</th>
                  <th className="px-4 py-3 text-left font-bold">{label('Status', 'الحالة')}</th>
                  <th className="px-4 py-3 text-right font-bold">{label('Total', 'الإجمالي')}</th>
                  <th className="px-4 py-3 text-center font-bold">{label('Actions', 'إجراءات')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRentals.map((rental) => {
                  const overdue = isOverdue(rental)
                  const daysLeft = daysUntil(rental)
                  const transitions = ALLOWED_TRANSITIONS[rental.status] || []
                  return (
                    <motion.tr
                      key={rental._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-700">{rental.rentalNumber}</span>
                        <div className="text-[10px] text-gray-400">{rental.transactionType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{rental.customerName}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {rental.customerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {rental.lineItems?.slice(0, 2).map((item, i) => (
                            <span key={i} className="text-xs text-gray-600">
                              {item.productName || item.name}
                              {rental.lineItems.length > 2 && i === 1 && ' ...'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className={`w-3.5 h-3.5 ${overdue ? 'text-red-500' : 'text-gray-400'}`} />
                          <span className={`text-xs ${overdue ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                            {new Date(rental.startDate).toLocaleDateString('en-GB')} → {new Date(rental.endDate).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        {rental.status !== 'closed' && rental.status !== 'cancelled' && (
                          <span className={`text-[10px] ${overdue ? 'text-red-500' : daysLeft <= 1 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {overdue
                              ? `${Math.abs(daysLeft)} ${label('days overdue', 'أيام متأخرة')}`
                              : daysLeft === 0
                              ? label('Due today', 'مستحق اليوم')
                              : `${daysLeft} ${label('days left', 'أيام متبقية')}`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {renderStatusBadge(rental.status)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">
                          <Money value={rental.grandTotal} />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1 flex-wrap">
                          {transitions.map((t) => (
                            <button
                              key={t.status}
                              onClick={() =>
                                statusMutation.mutate({ id: rental._id, status: t.status, note: `Marked as ${t.status}` })
                              }
                              disabled={statusMutation.isPending}
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors ${t.color}`}
                            >
                              <ArrowRight className="w-3 h-3" />
                              {label(t.label, t.labelAr)}
                            </button>
                          ))}
                          {transitions.length === 0 && (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
