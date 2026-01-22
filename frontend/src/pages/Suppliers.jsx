import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Building, Phone, Mail, MapPin, Edit } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'

export default function Suppliers() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => api.get('/suppliers', { params: { page, search, limit: 25 } }).then((res) => res.data)
  })

  const { data: stats } = useQuery({
    queryKey: ['suppliers-stats'],
    queryFn: () => api.get('/suppliers/stats').then((res) => res.data)
  })

  const suppliers = data?.suppliers || []
  const pagination = data?.pagination

  const totals = stats?.totals?.[0]
  const totalSuppliers = totals?.total || 0
  const activeSuppliers = totals?.active || 0
  const companyCount = stats?.byType?.find((x) => x._id === 'company')?.count || 0
  const individualCount = stats?.byType?.find((x) => x._id === 'individual')?.count || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'الموردين' : 'Suppliers'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة الموردين وسجلهم' : 'Manage suppliers and vendor records'}
          </p>
        </div>
        <Link to="/suppliers/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة مورد' : 'Add Supplier'}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Building className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي الموردين' : 'Total Suppliers'}</p>
            <p className="text-2xl font-bold">{totalSuppliers}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Building className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'موردين نشطين' : 'Active Suppliers'}</p>
            <p className="text-2xl font-bold text-emerald-600">{activeSuppliers}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Building className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'شركات' : 'Companies'}</p>
            <p className="text-2xl font-bold">{companyCount}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Building className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'أفراد' : 'Individuals'}</p>
            <p className="text-2xl font-bold">{individualCount}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالاسم / الرمز / الرقم الضريبي...' : 'Search by name / code / VAT...'}
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
          <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الرمز' : 'Code'}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th>{language === 'ar' ? 'البريد' : 'Email'}</th>
                  <th>{language === 'ar' ? 'المدينة' : 'City'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s._id}>
                    <td className="font-mono text-sm">{s.code}</td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {language === 'ar' ? s.nameAr || s.nameEn : s.nameEn}
                        </p>
                        {s.vatNumber && (
                          <p className="text-xs text-gray-500">VAT: {s.vatNumber}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      {s.phone ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {s.phone}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {s.email ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {s.email}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {s.address?.city ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {s.address.city}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {s.isActive ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'غير نشط' : 'Inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/suppliers/${s._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
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
