import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { useSelector } from 'react-redux'
import Sidebar from '../components/layout/Sidebar'
import Header from '../components/layout/Header'
import LoadingScreen from '../components/ui/LoadingScreen'

export default function WorkshopLayout() {
  const { sidebarCollapsed } = useSelector(state => state.ui)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      <Sidebar />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ms-20' : 'lg:ms-72'
        }`}
      >
        <Header />
        <main className="p-4 lg:p-6">
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
