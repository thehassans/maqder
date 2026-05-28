import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, UtensilsCrossed, Grid2X2, Shirt, Building2 } from 'lucide-react'
import api from '../../lib/api'
import { useTranslation } from '../../lib/translations'
import { getTenantBusinessTypes } from '../../lib/businessTypes'

import RestaurantMenuItems from '../restaurant/RestaurantMenuItems'
import Tables from '../restaurant/Tables'
import LaundryServices from '../laundry/LaundryServices'
import { Outlet, useLocation } from 'react-router-dom'

export default function TenantCustomization() {
  const { id } = useParams()
  const location = useLocation()
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [activeTab, setActiveTab] = useState('menu-items')

  // Setup Axios interceptor to append x-tenant-id for all requests
  useEffect(() => {
    const interceptorId = api.interceptors.request.use((config) => {
      config.headers['x-tenant-id'] = id
      return config
    })

    return () => {
      api.interceptors.request.eject(interceptorId)
    }
  }, [id])

  // Fetch tenant info for header
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get(`/super-admin/tenants/${id}`).then(res => res.data),
  })

  const tabs = useMemo(() => {
    const tenantBusinessTypes = getTenantBusinessTypes(tenant)
    const isRestaurant = tenantBusinessTypes.includes('restaurant')
    const isLaundry = tenantBusinessTypes.includes('laundry')

    return [
      { id: 'menu-items', label: language === 'ar' ? 'قائمة الطعام' : 'Menu Items', icon: UtensilsCrossed, component: RestaurantMenuItems, show: isRestaurant },
      { id: 'tables', label: language === 'ar' ? 'الطاولات' : 'Tables', icon: Grid2X2, component: Tables, show: isRestaurant },
      { id: 'laundry', label: language === 'ar' ? 'خدمات المغسلة' : 'Laundry Services', icon: Shirt, component: LaundryServices, show: isLaundry },
    ].filter(t => t.show)
  }, [tenant, language])

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, activeTab])

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link to="/super-admin/tenants" className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors">
          <ArrowLeft className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {language === 'ar' ? 'تخصيص بيانات المستأجر' : 'Tenant Customization'}
            </h1>
            {tenant && (
              <span className="badge badge-primary flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {tenant.name}
              </span>
            )}
          </div>
          <p className="text-gray-500 mt-1">
            {language === 'ar' 
              ? 'إدارة أصناف القائمة والطاولات وخدمات المغسلة لهذا المستأجر' 
              : 'Manage menu items, tables, and laundry services for this tenant'}
          </p>
        </div>
      </div>

      {location.pathname.endsWith('/customization') ? (
        <div className="card">
          <div className="border-b border-gray-100 dark:border-dark-700">
            <div className="flex overflow-x-auto custom-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {ActiveComponent && <ActiveComponent />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </div>
  )
}
