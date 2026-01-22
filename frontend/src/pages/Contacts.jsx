import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Users, Building2, Briefcase, Edit, Phone, Mail, Hash } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'

const typeMeta = {
  customer: { badge: 'badge-info', en: 'Customer', ar: 'عميل', icon: Building2 },
  supplier: { badge: 'badge-warning', en: 'Supplier', ar: 'مورد', icon: Briefcase },
  employee: { badge: 'badge-success', en: 'Employee', ar: 'موظف', icon: Users },
}

const getEntityRoute = (contact) => {
  if (contact?.entityType === 'customer') return `/customers/${contact.entityId}`
  if (contact?.entityType === 'supplier') return `/suppliers/${contact.entityId}`
  if (contact?.entityType === 'employee') return `/employees/${contact.entityId}`
  return null
}

export default function Contacts() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [isActive, setIsActive] = useState('true')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', { search, type, isActive, page }],
    queryFn: () =>
      api
        .get('/contacts', {
          params: {
            search,
            types: type || undefined,
            isActive,
            page,
            limit: 25,
          },
        })
        .then((res) => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['contacts-stats', { isActive }],
    queryFn: () => api.get('/contacts/stats', { params: { isActive } }).then((res) => res.data),
  })

  const contacts = data?.contacts || []
  const pagination = data?.pagination

  const totals = stats?.byType || { customers: 0, suppliers: 0, employees: 0 }

  const totalContacts = stats?.total || 0

  const rows = useMemo(() => {
    return contacts.map((c) => {
      const meta = typeMeta[c.entityType] || { badge: 'badge-neutral', en: c.entityType, ar: c.entityType, icon: Users }
      const name = language === 'ar' ? c.displayNameAr || c.displayName : c.displayName
      const route = getEntityRoute(c)
      const Icon = meta.icon

      return {
        ...c,
        meta,
        name,
        route,
        Icon,
      }
    })
  }, [contacts, language])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'جهات الاتصال' : 'Contacts'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar'
              ? 'دليل موحد للعملاء والموردين والموظفين'
              : 'Unified directory for customers, suppliers, and employees'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Users className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'الإجمالي' : 'Total'}</p>
            <p className="text-2xl font-bold">{totalContacts.toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'العملاء' : 'Customers'}</p>
            <p className="text-2xl font-bold">{(totals.customers || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Briefcase className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'الموردين' : 'Suppliers'}</p>
            <p className="text-2xl font-bold">{(totals.suppliers || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Users className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'الموظفين' : 'Employees'}</p>
            <p className="text-2xl font-bold">{(totals.employees || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالاسم / البريد / الهاتف / الرقم الضريبي...' : 'Search by name / email / phone / VAT...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>

          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              setPage(1)
            }}
            className="select w-full sm:w-44"
          >
            <option value="">{language === 'ar' ? 'الكل' : 'All'}</option>
            <option value="customer">{language === 'ar' ? 'العملاء' : 'Customers'}</option>
            <option value="supplier">{language === 'ar' ? 'الموردين' : 'Suppliers'}</option>
            <option value="employee">{language === 'ar' ? 'الموظفين' : 'Employees'}</option>
          </select>

          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value)
              setPage(1)
            }}
            className="select w-full sm:w-44"
          >
            <option value="true">{language === 'ar' ? 'نشط فقط' : 'Active only'}</option>
            <option value="false">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
            <option value="all">{language === 'ar' ? 'الكل' : 'All'}</option>
          </select>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-gray-500">{t('noData')}</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                  <th>{language === 'ar' ? 'الهاتف' : 'Phone'}</th>
                  <th>{language === 'ar' ? 'البريد' : 'Email'}</th>
                  <th>{language === 'ar' ? 'الرمز' : 'Code'}</th>
                  <th>{language === 'ar' ? 'الرقم الضريبي' : 'VAT'}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={`${c.entityType}-${c.entityId}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-dark-700 flex items-center justify-center">
                          <c.Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{c.name || '-'}</p>
                          {c.displayNameAr && language !== 'ar' && (
                            <p className="text-xs text-gray-500" dir="rtl">
                              {c.displayNameAr}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${c.meta.badge}`}>{language === 'ar' ? c.meta.ar : c.meta.en}</span>
                    </td>
                    <td>
                      {c.phone ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {c.phone}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {c.email ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {c.email}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {c.code ? (
                        <span className="inline-flex items-center gap-2 text-sm">
                          <Hash className="w-4 h-4 text-gray-400" />
                          <span className="font-mono">{c.code}</span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="font-mono text-sm">{c.vatNumber || '-'}</td>
                    <td>
                      <span className={`badge ${c.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {c.isActive ? (language === 'ar' ? 'نشط' : 'Active') : language === 'ar' ? 'غير نشط' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {c.route ? (
                        <Link to={c.route} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg inline-flex">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </Link>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
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
