import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import OfflineBanner from '../components/ui/OfflineBanner'
import { getTenantBusinessTypes } from '../lib/businessTypes'

export default function MainLayout() {
  const { sidebarCollapsed } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const location = useLocation()

  const businessTypes = getTenantBusinessTypes(tenant)
  const isOnlySaloon = businessTypes.includes('saloon') && businessTypes.length === 1
  const isOnlyLaundry = businessTypes.includes('laundry') && businessTypes.length === 1

  if (isOnlySaloon && !location.pathname.startsWith('/app/saloon')) {
    return <Navigate to="/app/saloon/pos" replace />
  }

  if (isOnlyLaundry && !location.pathname.startsWith('/app/laundry')) {
    return <Navigate to="/app/laundry/pos" replace />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <OfflineBanner />
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ms-20' : 'lg:ms-72'
        }`}
      >
        <Header />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
