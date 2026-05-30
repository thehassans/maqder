import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import OfflineBanner from '../components/ui/OfflineBanner'
import TerminationBanner, { TerminationBlocker, isTenantTerminated } from '../components/ui/TerminationBanner'
import { getTenantBusinessTypes } from '../lib/businessTypes'

export default function MainLayout() {
  const { sidebarCollapsed } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const location = useLocation()

  const businessTypes = getTenantBusinessTypes(tenant)

  if (isTenantTerminated(tenant)) {
    return <TerminationBlocker />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col">
      <OfflineBanner />
      <div className="flex flex-1">
        <Sidebar />
        <div
          className={`flex-1 transition-all duration-300 w-full flex flex-col ${
            sidebarCollapsed ? 'lg:ms-20' : 'lg:ms-72'
          }`}
        >
        <TerminationBanner />
        <Header />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      </div>
    </div>
  )
}
