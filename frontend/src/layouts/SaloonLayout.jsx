import { Outlet } from 'react-router-dom'
import Header from '../components/layout/Header'
import SaloonSidebar from '../components/layout/SaloonSidebar'

export default function SaloonLayout() {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-900 overflow-hidden">
      <div className="hidden lg:block w-64 bg-white dark:bg-dark-800 border-e border-gray-100 dark:border-dark-700 h-full overflow-y-auto">
        <SaloonSidebar />
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
