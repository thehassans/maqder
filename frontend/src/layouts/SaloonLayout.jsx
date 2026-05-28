import { Outlet } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Header from '../components/layout/Header'
import SaloonSidebar from '../components/layout/SaloonSidebar'

export default function SaloonLayout() {
  const { sidebarCollapsed } = useSelector((state) => state.ui)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <SaloonSidebar />
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
