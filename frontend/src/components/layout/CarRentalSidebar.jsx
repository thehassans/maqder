import { NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Car, Users, FileText, BarChart3, Settings,
  ChevronLeft, ChevronRight, X, AlertCircle,
  PlusCircle, ClipboardCheck, Wrench, Ban
} from 'lucide-react'
import { toggleSidebarCollapse, setMobileMenuOpen } from '../../store/slices/uiSlice'

const NavItem = ({ path, icon: Icon, label, end, collapsed, badge, onClick }) => (
  <NavLink
    to={path}
    end={end}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
        isActive
          ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white'
      }`
    }
  >
    <Icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="whitespace-nowrap overflow-hidden"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {badge > 0 && (
      <span className={`absolute ${collapsed ? 'top-0.5 right-0.5' : 'right-3'} bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
        {badge > 9 ? '9+' : badge}
      </span>
    )}
  </NavLink>
)

const SectionLabel = ({ label, collapsed }) =>
  !collapsed ? (
    <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none">
      {label}
    </p>
  ) : <div className="pt-3 border-t border-gray-100 dark:border-dark-700 mx-2" />

export default function CarRentalSidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector(s => s.ui)
  const { tenant } = useSelector(s => s.auth)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const sidebarStyle = tenant?.branding?.sidebarStyle || 'solid'
  const sidebarClassName =
    sidebarStyle === 'glass'
      ? 'bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl'
      : 'bg-white dark:bg-dark-800'

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-transparent">
      {/* Brand Header */}
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
                {isAr ? 'نظام التأجير' : 'Rental System'}
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => dispatch(setMobileMenuOpen(false))}
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
              {isAr ? 'الشركة' : 'Company'}
            </p>
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {isAr ? tenant.business?.legalNameAr : tenant.business?.legalNameEn}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              VAT: {tenant.business?.vatNumber}
            </p>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-0.5">
        <SectionLabel label={t('POS', 'نقطة البيع')} collapsed={sidebarCollapsed} />
        <NavItem path="/app/rental/checkout" icon={PlusCircle} label={t('New Rental', 'تأجير جديد')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />
        <NavItem path="/app/rental/active" icon={Car} label={t('Active Rentals', 'تأجيرات نشطة')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />

        <SectionLabel label={t('Fleet', 'الأسطول')} collapsed={sidebarCollapsed} />
        <NavItem path="/app/rental/fleet" icon={Car} label={t('All Cars', 'كل السيارات')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />
        <NavItem path="/app/rental/fleet?status=MAINTENANCE" icon={Wrench} label={t('Maintenance Queue', 'قائمة الصيانة')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />
        <NavItem path="/app/rental/fleet?alerts=expiry" icon={AlertCircle} label={t('Expiry Alerts', 'تنبيهات انتهاء')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />

        <SectionLabel label={t('Customers', 'العملاء')} collapsed={sidebarCollapsed} />
        <NavItem path="/app/rental/customers" icon={Users} label={t('Customer Registry', 'سجل العملاء')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />
        <NavItem path="/app/rental/customers?blacklisted=true" icon={Ban} label={t('Blacklist', 'القائمة السوداء')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />

        <SectionLabel label={t('Contracts', 'العقود')} collapsed={sidebarCollapsed} />
        <NavItem path="/app/rental/contracts" icon={FileText} label={t('All Contracts', 'كل العقود')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />

        <SectionLabel label={t('Reports', 'التقارير')} collapsed={sidebarCollapsed} />
        <NavItem path="/app/rental/reports" icon={BarChart3} label={t('Revenue Report', 'تقرير الإيرادات')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />

        <SectionLabel label={t('Settings', 'الإعدادات')} collapsed={sidebarCollapsed} />
        <NavItem path="/app/dashboard/settings" icon={Settings} label={t('Settings', 'الإعدادات')} collapsed={sidebarCollapsed} onClick={() => dispatch(setMobileMenuOpen(false))} />
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
              <span>{isAr ? 'طي القائمة' : 'Collapse'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 start-0 z-50 transition-all duration-300 border-e border-gray-200 dark:border-dark-700 ${sidebarClassName} ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => dispatch(setMobileMenuOpen(false))}
            />
            <motion.aside
              initial={{ x: isAr ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isAr ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={`fixed inset-y-0 start-0 z-50 w-72 flex flex-col border-e border-gray-200 dark:border-dark-700 ${sidebarClassName} lg:hidden`}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
