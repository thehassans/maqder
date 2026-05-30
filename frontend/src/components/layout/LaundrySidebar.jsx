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
  ChevronRight,
  ChevronLeft
} from 'lucide-react'
import { toggleSidebar, toggleSidebarCollapse, setMobileMenuOpen } from '../../store/slices/uiSlice'

const NAV_ITEMS = [
  { id: 'pos', path: '/app/laundry/pos', icon: ShoppingCart, labelEn: 'New Order (POS)', labelAr: 'طلب جديد (نقطة البيع)' },
  { id: 'orders', path: '/app/laundry/orders', icon: ListOrdered, labelEn: 'Active Orders', labelAr: 'الطلبات النشطة' },
  { id: 'customers', path: '/app/laundry/customers', icon: Users, labelEn: 'Customers', labelAr: 'العملاء' },
  { id: 'inventory', path: '/app/laundry/inventory', icon: Box, labelEn: 'Supplies Inventory', labelAr: 'مخزون المستلزمات' },
  { id: 'catalog', path: '/app/laundry/catalog', icon: Shirt, labelEn: 'Service Catalog', labelAr: 'قائمة الخدمات' },
]

export default function LaundrySidebar() {
  const dispatch = useDispatch()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector(state => state.ui)
  const { tenant } = useSelector(state => state.auth)
  const isRtl = language === 'ar'
  
  const sidebarStyle = tenant?.branding?.sidebarStyle || 'solid'
  const sidebarClassName =
    sidebarStyle === 'glass'
      ? 'bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl'
      : 'bg-white dark:bg-dark-800'

  const NavContent = () => (
    <div className="flex flex-col h-full bg-transparent">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 bg-[#1a3d28]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {tenant?.branding?.logo ? (
              <img src={tenant.branding.logo} alt="" className="w-full h-full object-contain" />
            ) : (
              <img src="/maqder-logo.png" alt="Maqder" className="w-full h-full object-contain" />
            )}
          </div>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="font-bold text-lg text-white">Maqder ERP</span>
              <span className="block text-[10px] text-primary-200 uppercase tracking-wider font-semibold truncate">
                {isRtl ? 'نظام المغسلة' : 'Laundry System'}
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tenant Info */}
      {!sidebarCollapsed && tenant && (
        <div className="px-4 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl">
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium mb-1">
              {language === 'ar' ? 'الشركة' : 'Company'}
            </p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {language === 'ar' ? tenant.business?.legalNameAr : tenant.business?.legalNameEn}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              VAT: {tenant.business?.vatNumber}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) => `
              group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 relative
              ${isActive 
                ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium' 
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

      {/* Collapse Button (Desktop) */}
      <div className="hidden lg:block p-3 border-t border-gray-200 dark:border-dark-700">
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>{language === 'ar' ? 'طي القائمة' : 'Collapse'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
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
        className={`fixed top-0 bottom-0 z-50 transition-all duration-300 ease-in-out border-e border-gray-200 dark:border-dark-700 ${sidebarClassName}
          ${isRtl ? 'right-0' : 'left-0'}
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
          ${mobileMenuOpen ? 'translate-x-0' : isRtl ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <NavContent />
      </aside>
    </>
  )
}
