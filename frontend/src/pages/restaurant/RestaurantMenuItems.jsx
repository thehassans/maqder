import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, UtensilsCrossed, Edit } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import Money from '../../components/ui/Money'

export default function RestaurantMenuItems() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-menu-items', page, search],
    queryFn: () =>
      api
        .get('/restaurant/menu-items', { params: { page, limit: 50, search } })
        .then((res) => res.data),
  })

  const items = data?.items || []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {language === 'ar' ? 'قائمة الطعام' : 'Menu Items'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة أصناف قائمة الطعام' : 'Manage restaurant menu items'}
          </p>
        </div>
        <Link to="/app/dashboard/restaurant/menu-items/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة صنف' : 'Add Item'}
        </Link>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالاسم / SKU...' : 'Search by name / SKU...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>
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
                  <th>{language === 'ar' ? 'SKU' : 'SKU'}</th>
                  <th>{language === 'ar' ? 'الصنف' : 'Item'}</th>
                  <th>{language === 'ar' ? 'التصنيف' : 'Category'}</th>
                  <th>{language === 'ar' ? 'السعر' : 'Price'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it._id}>
                    <td className="font-mono text-sm">{it.sku || '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <UtensilsCrossed className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {language === 'ar' ? it.nameAr || it.nameEn : it.nameEn || it.nameAr}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{it.category || '-'}</td>
                    <td className="font-semibold">
                      <Money value={it.sellingPrice || 0} />
                    </td>
                    <td>
                      <span className={`badge ${it.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {it.isActive ? (language === 'ar' ? 'نشط' : 'Active') : language === 'ar' ? 'غير نشط' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/dashboard/restaurant/menu-items/${it._id}`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg"
                        >
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      {language === 'ar' ? 'لا توجد أصناف' : 'No items found'}
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
          <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
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
