import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Plane, Edit } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

export default function TravelBookings() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ status: '', serviceType: '' })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['travel-bookings', page, search, filters],
    queryFn: () =>
      api
        .get('/travel-bookings', { params: { page, limit: 25, search, ...filters } })
        .then((res) => res.data),
  })

  const bookings = data?.bookings || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'الحجوزات' : 'Bookings'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة حجوزات وكالة السفر' : 'Manage travel agency bookings'}
          </p>
        </div>
        <Link to="/app/dashboard/travel-bookings/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'حجز جديد' : 'New Booking'}
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالرقم / الاسم / البريد...' : 'Search by number / name / email...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((p) => ({ ...p, status: e.target.value }))
              setPage(1)
            }}
            className="select w-full sm:w-48"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="draft">{language === 'ar' ? 'مسودة' : 'Draft'}</option>
            <option value="confirmed">{language === 'ar' ? 'مؤكد' : 'Confirmed'}</option>
            <option value="ticketed">{language === 'ar' ? 'تم إصدار التذكرة' : 'Ticketed'}</option>
            <option value="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</option>
            <option value="cancelled">{language === 'ar' ? 'ملغي' : 'Cancelled'}</option>
          </select>

          <select
            value={filters.serviceType}
            onChange={(e) => {
              setFilters((p) => ({ ...p, serviceType: e.target.value }))
              setPage(1)
            }}
            className="select w-full sm:w-48"
          >
            <option value="">{language === 'ar' ? 'كل الخدمات' : 'All Services'}</option>
            <option value="flight">{language === 'ar' ? 'طيران' : 'Flight'}</option>
            <option value="hotel">{language === 'ar' ? 'فندق' : 'Hotel'}</option>
            <option value="package">{language === 'ar' ? 'باقة' : 'Package'}</option>
            <option value="visa">{language === 'ar' ? 'تأشيرة' : 'Visa'}</option>
            <option value="other">{language === 'ar' ? 'أخرى' : 'Other'}</option>
          </select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الرقم' : 'Number'}</th>
                  <th>{language === 'ar' ? 'العميل' : 'Customer'}</th>
                  <th>{language === 'ar' ? 'الخدمة' : 'Service'}</th>
                  <th>{language === 'ar' ? 'المغادرة' : 'Departure'}</th>
                  <th>{language === 'ar' ? 'الإجمالي' : 'Total'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="font-mono text-sm">{b.bookingNumber}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Plane className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{b.customerName}</div>
                          {b.customerEmail ? <div className="text-xs text-gray-500">{b.customerEmail}</div> : null}
                        </div>
                      </div>
                    </td>
                    <td className="capitalize">{b.serviceType || '-'}</td>
                    <td className="text-gray-500">
                      {b.departureDate ? new Date(b.departureDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="font-semibold">
                      <Money value={b.grandTotal || 0} />
                    </td>
                    <td>
                      <span className="badge badge-neutral capitalize">{b.status || '-'}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/dashboard/travel-bookings/${b._id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد حجوزات' : 'No bookings found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {pagination?.pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            className="btn btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {language === 'ar' ? 'السابق' : 'Previous'}
          </button>
          <div className="text-sm text-gray-500">
            {language === 'ar' ? 'صفحة' : 'Page'} {page} / {pagination.pages}
          </div>
          <button
            className="btn btn-secondary"
            disabled={page >= pagination.pages}
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
          >
            {language === 'ar' ? 'التالي' : 'Next'}
          </button>
        </div>
      )}
    </div>
  )
}
