import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Package, ListOrdered, X, ChevronRight, ChevronLeft } from 'lucide-react'
import { toggleSidebarCollapse, setMobileMenuOpen } from '../../store/slices/uiSlice'

export default function SaloonSidebar() {
  const dispatch = useDispatch()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const isRtl = language === 'ar'

  const sidebarStyle = tenant?.branding?.sidebarStyle || 'solid'
  const sidebarClassName =
    sidebarStyle === 'glass'
      ? 'bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl'
      : 'bg-white dark:bg-dark-800'

  const navItems = [
    { path: '/app/saloon/pos', icon: ShoppingCart, labelEn: 'Saloon POS', labelAr: 'نقطة البيع (صالون)' },
    { path: '/app/saloon/orders', icon: ListOrdered, labelEn: 'Active Orders', labelAr: 'الطلبات النشطة' },
    { path: '/app/saloon/services', icon: Package, labelEn: 'Services Catalog', labelAr: 'قائمة الخدمات' },
  ]

  const SidebarContent = () => (
    <>
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
            <div className="flex flex-col min-w-0">
              <span className="text-white font-bold truncate text-sm">
                {tenant?.business?.legalNameEn || tenant?.name || 'Maqder ERP'}
              </span>
              <span className="text-[10px] text-primary-200 uppercase tracking-wider font-semibold truncate">
                {isRtl ? 'إدارة الصالون' : 'Saloon Management'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => dispatch(setMobileMenuOpen(false))}
          className="lg:hidden p-2 rounded-lg text-white/70 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${sidebarCollapsed ? 'justify-center px-3' : ''}`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {isRtl ? item.labelAr : item.labelEn}
                </motion.span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

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
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 ${sidebarClassName} border-e border-gray-200 dark:border-dark-700 z-40 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: language === 'ar' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-72 ${sidebarClassName} border-e border-gray-200 dark:border-dark-700 z-50 lg:hidden flex flex-col`}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
