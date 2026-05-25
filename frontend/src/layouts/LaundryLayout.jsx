import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import LaundrySidebar from '../components/layout/LaundrySidebar'
import Header from '../components/layout/Header'

/**
 * LaundryLayout — dedicated shell for tenants with businessType: 'laundry'.
 * Uses LaundrySidebar instead of the standard ERP Sidebar.
 */
export default function LaundryLayout() {
  const { sidebarCollapsed } = useSelector(state => state.ui)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <LaundrySidebar />
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
