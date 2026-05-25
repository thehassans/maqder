import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shirt, 
  ShoppingCart, 
  ListOrdered, 
  Users, 
  Box,
  Settings,
  X,
  ChevronRight
} from 'lucide-react'
import { toggleSidebar } from '../../store/slices/uiSlice'

const NAV_ITEMS = [
  { id: 'pos', path: '/app/laundry/pos', icon: ShoppingCart, labelEn: 'New Order (POS)', labelAr: 'طلب جديد (نقطة البيع)' },
  { id: 'orders', path: '/app/laundry/orders', icon: ListOrdered, labelEn: 'Active Orders', labelAr: 'الطلبات النشطة' },
  { id: 'customers', path: '/app/laundry/customers', icon: Users, labelEn: 'Customers', labelAr: 'العملاء' },
  { id: 'inventory', path: '/app/laundry/inventory', icon: Box, labelEn: 'Supplies Inventory', labelAr: 'مخزون المستلزمات' },
  { id: 'catalog', path: '/app/laundry/catalog', icon: Shirt, labelEn: 'Service Catalog', labelAr: 'قائمة الخدمات' },
]

export default function LaundrySidebar() {
  const dispatch = useDispatch()
  const { sidebarOpen, sidebarCollapsed, language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-dark-800 border-e border-gray-200 dark:border-dark-700 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-dark-700 justify-between">
        <div className={`flex items-center gap-3 overflow-hidden ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
            <Shirt className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-teal-400 truncate whitespace-nowrap">
              {isRtl ? 'المغسلة' : 'Laundry System'}
            </span>
          )}
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative
              ${isActive 
                ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 font-medium' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700/50 hover:text-gray-900 dark:hover:text-white'
              }
            `}
            title={sidebarCollapsed ? (isRtl ? item.labelAr : item.labelEn) : ''}
          >
            <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
              sidebarCollapsed ? 'mx-auto' : isRtl ? 'ms-3' : 'me-3'
            }`} />
            
            {!sidebarCollapsed && (
              <span className="truncate">{isRtl ? item.labelAr : item.labelEn}</span>
            )}
            
            {!sidebarCollapsed && (
              <ChevronRight className={`w-4 h-4 ms-auto opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 ${isRtl ? 'rotate-180' : ''}`} />
            )}
          </NavLink>
        ))}
      </div>

      {/* Settings Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-700">
        <NavLink
          to="/app/settings/general"
          className="flex items-center px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700/50"
          title={sidebarCollapsed ? (isRtl ? 'الإعدادات' : 'Settings') : ''}
        >
          <Settings className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : isRtl ? 'ms-3' : 'me-3'}`} />
          {!sidebarCollapsed && (
            <span>{isRtl ? 'إعدادات النظام' : 'System Settings'}</span>
          )}
        </NavLink>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dispatch(toggleSidebar())}
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 z-50 transition-all duration-300 ease-in-out
          ${isRtl ? 'right-0' : 'left-0'}
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
          ${sidebarOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <NavContent />
      </aside>
    </>
  )
}
