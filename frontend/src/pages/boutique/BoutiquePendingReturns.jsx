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
} from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

/**
 * BoutiquePendingReturns
 * Shows all rentals that are reserved, picked_up, or late_return.
 * Sorted by return date (closest first). Supports marking as returned.
 */

export default function BoutiquePendingReturns() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const queryClient = useQueryClient()

  const isArabic = language === 'ar'
  const label = (en, ar) => (isArabic ? ar : en)

  const [filter, setFilter] = useState('all') // 'all' | 'overdue'
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['boutique-pending-returns', filter],
    queryFn: () =>
      api
        .get('/boutique/rentals/pending-returns', {
          params: { overdue: filter === 'overdue' ? 'true' : 'false', limit: 200 },
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

  const returnMutation = useMutation({
    mutationFn: ({ id, note }) =>
      api.patch(`/boutique/rentals/${id}/status`, { status: 'returned', note }).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boutique-pending-returns'] })
      queryClient.invalidateQueries({ queryKey: ['boutique-rentals'] })
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

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-rose-500" />
            {label('Pending Returns', 'الإرجاعات المعلقة')}
          </h1>
          <p className="text-gray-500 mt-1">
            {label('Track active rentals and overdue items', 'تتبع الإيجارات النشطة والمتأخرة')}
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
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
              }`}
            >
              {label('All', 'الكل')}
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                filter === 'overdue' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              {label('Overdue', 'متأخر')}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">{label('Loading...', 'جاري التحميل...')}</div>
      ) : filteredRentals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <CheckCircle2 className="w-12 h-12 mb-3 opacity-30" />
          <p>{label('No pending returns', 'لا توجد إرجاعات معلقة')}</p>
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
                  <th className="px-4 py-3 text-left font-bold">{label('Return Date', 'تاريخ الإرجاع')}</th>
                  <th className="px-4 py-3 text-left font-bold">{label('Status', 'الحالة')}</th>
                  <th className="px-4 py-3 text-right font-bold">{label('Total', 'الإجمالي')}</th>
                  <th className="px-4 py-3 text-center font-bold">{label('Action', 'إجراء')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRentals.map((rental) => {
                  const overdue = isOverdue(rental)
                  const daysLeft = daysUntil(rental)
                  return (
                    <motion.tr
                      key={rental._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-gray-700">{rental.rentalNumber}</span>
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
                            {new Date(rental.endDate).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <span className={`text-[10px] ${overdue ? 'text-red-500' : daysLeft <= 1 ? 'text-amber-500' : 'text-gray-400'}`}>
                          {overdue
                            ? `${Math.abs(daysLeft)} ${label('days overdue', 'أيام متأخرة')}`
                            : daysLeft === 0
                            ? label('Due today', 'مستحق اليوم')
                            : `${daysLeft} ${label('days left', 'أيام متبقية')}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            rental.status === 'picked_up'
                              ? 'bg-blue-50 text-blue-700'
                              : rental.status === 'late_return'
                              ? 'bg-red-50 text-red-700'
                              : rental.status === 'reserved'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {rental.status === 'picked_up' && <RefreshCw className="w-3 h-3" />}
                          {rental.status === 'late_return' && <AlertTriangle className="w-3 h-3" />}
                          {rental.status === 'reserved' && <Clock className="w-3 h-3" />}
                          {rental.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">
                          <Money value={rental.grandTotal} />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {rental.status !== 'returned' && rental.status !== 'closed' && (
                          <button
                            onClick={() =>
                              returnMutation.mutate({ id: rental._id, note: 'Marked as returned from pending list' })
                            }
                            disabled={returnMutation.isPending}
                            className="inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {label('Returned', 'تم الإرجاع')}
                          </button>
                        )}
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
