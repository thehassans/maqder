import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Cpu, MapPin, Clock, Edit } from 'lucide-react'
import api from '../lib/api'
import { useTranslation } from '../lib/translations'

export default function IoT() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', type: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['iot-devices', page, search, filters],
    queryFn: () =>
      api
        .get('/iot/devices', {
          params: {
            page,
            limit: 25,
            search,
            status: filters.status,
            type: filters.type,
          },
        })
        .then((res) => res.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['iot-devices-stats'],
    queryFn: () => api.get('/iot/devices/stats').then((res) => res.data),
  })

  const totals = stats?.totals?.[0]
  const totalDevices = totals?.total || 0
  const activeDevices = totals?.active || 0
  const maintenanceDevices = totals?.maintenance || 0
  const recentlySeen = stats?.recentlySeen?.[0]?.count || 0

  const devices = data?.devices || []
  const pagination = data?.pagination

  const statusBadge = (status) => {
    if (status === 'active') return 'badge-success'
    if (status === 'maintenance') return 'badge-warning'
    return 'badge-neutral'
  }

  const statusLabel = (status) => {
    if (language === 'ar') {
      if (status === 'active') return 'نشط'
      if (status === 'inactive') return 'غير نشط'
      if (status === 'maintenance') return 'صيانة'
      return status
    }
    return status
  }

  const typeLabel = (type) => {
    if (language === 'ar') {
      if (type === 'sensor') return 'حساس'
      if (type === 'gateway') return 'بوابة'
      if (type === 'meter') return 'عداد'
      if (type === 'tracker') return 'متعقب'
      if (type === 'custom') return 'مخصص'
      return type
    }
    return type
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{language === 'ar' ? 'إنترنت الأشياء' : 'Internet of Things'}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة الأجهزة وقراءات المستشعرات' : 'Manage devices and sensor readings'}
          </p>
        </div>
        <Link to="/iot/devices/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة جهاز' : 'Add Device'}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
            <Cpu className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'إجمالي الأجهزة' : 'Total Devices'}</p>
            <p className="text-2xl font-bold">{totalDevices}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <Cpu className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'أجهزة نشطة' : 'Active'}</p>
            <p className="text-2xl font-bold text-emerald-600">{activeDevices}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Cpu className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'صيانة' : 'Maintenance'}</p>
            <p className="text-2xl font-bold text-amber-600">{maintenanceDevices}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{language === 'ar' ? 'آخر 24 ساعة' : 'Seen (24h)'}</p>
            <p className="text-2xl font-bold">{recentlySeen}</p>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={language === 'ar' ? 'بحث بالكود / الاسم / الموقع...' : 'Search by code / name / location...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="input ps-10"
            />
          </div>

          <select
            value={filters.type}
            onChange={(e) => {
              setFilters((f) => ({ ...f, type: e.target.value }))
              setPage(1)
            }}
            className="select w-full lg:w-44"
          >
            <option value="">{language === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
            <option value="sensor">{language === 'ar' ? 'حساس' : 'Sensor'}</option>
            <option value="gateway">{language === 'ar' ? 'بوابة' : 'Gateway'}</option>
            <option value="meter">{language === 'ar' ? 'عداد' : 'Meter'}</option>
            <option value="tracker">{language === 'ar' ? 'متعقب' : 'Tracker'}</option>
            <option value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => {
              setFilters((f) => ({ ...f, status: e.target.value }))
              setPage(1)
            }}
            className="select w-full lg:w-44"
          >
            <option value="">{language === 'ar' ? 'كل الحالات' : 'All Status'}</option>
            <option value="active">{language === 'ar' ? 'نشط' : 'Active'}</option>
            <option value="inactive">{language === 'ar' ? 'غير نشط' : 'Inactive'}</option>
            <option value="maintenance">{language === 'ar' ? 'صيانة' : 'Maintenance'}</option>
          </select>
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
                  <th>{language === 'ar' ? 'الكود' : 'Code'}</th>
                  <th>{language === 'ar' ? 'الاسم' : 'Name'}</th>
                  <th>{language === 'ar' ? 'النوع' : 'Type'}</th>
                  <th>{t('status')}</th>
                  <th>{language === 'ar' ? 'آخر اتصال' : 'Last Seen'}</th>
                  <th>{language === 'ar' ? 'الموقع' : 'Location'}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((d) => (
                  <tr key={d._id}>
                    <td className="font-mono text-sm">{d.code}</td>
                    <td>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {language === 'ar' ? d.nameAr || d.nameEn : d.nameEn}
                      </p>
                      {d.tags?.length ? <p className="text-xs text-gray-500">{d.tags.slice(0, 3).join(' · ')}</p> : null}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        <Cpu className="w-4 h-4 text-gray-400" />
                        {typeLabel(d.type)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge(d.status)}`}>{statusLabel(d.status)}</span>
                    </td>
                    <td>
                      {d.lastSeenAt ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {new Date(d.lastSeenAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {d.location?.name || d.location?.zone ? (
                        <span className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {(d.location?.name || '-') + (d.location?.zone ? ` · ${d.location.zone}` : '')}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link to={`/iot/devices/${d._id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg">
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
