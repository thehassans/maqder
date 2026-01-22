import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Warehouse as WarehouseIcon, MapPin } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'

export default function Warehouses() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const { data: warehouses, isLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => api.get('/warehouses').then(res => res.data)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('warehouses')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'إدارة مستودعات المخزون' : 'Manage inventory warehouses'}
          </p>
        </div>
        <Link to="/warehouses/new" className="btn btn-primary">
          <Plus className="w-4 h-4" />
          {language === 'ar' ? 'إضافة مستودع' : 'Add Warehouse'}
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {warehouses?.map((warehouse) => (
            <motion.div
              key={warehouse._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-6 hover:shadow-card-hover transition-shadow"
            >
              <Link to={`/warehouses/${warehouse._id}`} className="block">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${warehouse.isPrimary ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-dark-700'}`}>
                  <WarehouseIcon className={`w-6 h-6 ${warehouse.isPrimary ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                {warehouse.isPrimary && (
                  <span className="badge badge-success">{language === 'ar' ? 'رئيسي' : 'Primary'}</span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {language === 'ar' ? warehouse.nameAr || warehouse.nameEn : warehouse.nameEn}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{warehouse.code}</p>

              {warehouse.address?.city && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{warehouse.address.city}, {warehouse.address.district}</span>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{language === 'ar' ? 'النوع' : 'Type'}</span>
                  <span className="font-medium capitalize">{warehouse.type}</span>
                </div>
              </div>
              </Link>
            </motion.div>
          ))}

          {warehouses?.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              <WarehouseIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'ar' ? 'لا توجد مستودعات' : 'No warehouses found'}</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
