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
          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
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
    <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-400/70 select-none">
      {label}
    </p>
  ) : <div className="pt-3 border-t border-white/10 mx-2" />

export default function CarRentalSidebar() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector(s => s.ui)
  const { tenant } = useSelector(s => s.auth)
  const isAr = language === 'ar'
  const t = (en, ar) => isAr ? ar : en

  const logo = tenant?.branding?.logo

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center justify-between px-4 h-16 bg-black/30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            {logo
              ? <img src={logo} alt="" className="w-full h-full object-contain rounded-xl" />
              : <Car className="w-5 h-5 text-white" />
            }
          </div>
          {!sidebarCollapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span className="font-black text-white text-sm leading-tight block">
                {tenant?.business?.tradeName || tenant?.name || 'Car Rental'}
              </span>
              <span className="text-[10px] text-amber-300 font-medium">
                {t('Rental Management', 'إدارة التأجير')}
              </span>
            </motion.div>
          )}
        </div>
        <button
          onClick={() => dispatch(toggleSidebarCollapse())}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
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
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <div
        className={`hidden lg:flex flex-col fixed inset-y-0 start-0 z-50 transition-all duration-300 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => dispatch(setMobileMenuOpen(false))}
            />
            <motion.div
              initial={{ x: isAr ? '100%' : '-100%' }} animate={{ x: 0 }} exit={{ x: isAr ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 start-0 z-50 w-72 flex flex-col bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 lg:hidden"
            >
              <div className="absolute top-4 end-4">
                <button onClick={() => dispatch(setMobileMenuOpen(false))} className="p-2 rounded-xl bg-white/10 text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
