import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  FileText,
  Users,
  Wallet,
  Package,
  Warehouse,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Calculator,
  Truck,
  FolderKanban,
  ClipboardList,
  BarChart3,
  ShoppingCart,
  Building,
  MessageCircle,
  Cpu,
  Landmark,
  Briefcase,
  Factory,
  Receipt,
} from 'lucide-react'
import { toggleSidebarCollapse, setMobileMenuOpen } from '../../store/slices/uiSlice'
import { useTranslation } from '../../lib/translations'

export default function Sidebar() {
  const dispatch = useDispatch()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const sidebarStyle = tenant?.branding?.sidebarStyle || 'solid'
  const sidebarClassName =
    sidebarStyle === 'glass'
      ? 'bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl'
      : 'bg-white dark:bg-dark-800'

  const navSections = [
    {
      title: language === 'ar' ? 'الرئيسية' : 'Main',
      items: [
        { path: '/app/dashboard', icon: LayoutDashboard, label: t('dashboard'), end: true },
        { path: '/app/dashboard/invoices', icon: FileText, label: t('invoices') },
        { path: '/app/dashboard/contacts', icon: Users, label: language === 'ar' ? 'جهات الاتصال' : 'Contacts' },
        { path: '/app/dashboard/customers', icon: Building, label: language === 'ar' ? 'العملاء' : 'Customers' },
      ]
    },
    {
      title: language === 'ar' ? 'الموارد البشرية' : 'Human Resources',
      items: [
        { path: '/app/dashboard/employees', icon: Users, label: t('employees') },
        { path: '/app/dashboard/payroll', icon: Wallet, label: t('payroll') },
        { path: '/app/dashboard/payroll/calculators', icon: Calculator, label: 'GOSI/EOSB' },
      ]
    },
    {
      title: language === 'ar' ? 'المخزون' : 'Inventory',
      items: [
        { path: '/app/dashboard/products', icon: Package, label: t('products') },
        { path: '/app/dashboard/warehouses', icon: Warehouse, label: t('warehouses') },
      ]
    },
    {
      title: language === 'ar' ? 'سلسلة التوريد' : 'Supply Chain',
      items: [
        { path: '/app/dashboard/suppliers', icon: Building, label: language === 'ar' ? 'الموردين' : 'Suppliers' },
        { path: '/app/dashboard/purchase-orders', icon: ShoppingCart, label: language === 'ar' ? 'طلبات الشراء' : 'Purchase Orders' },
        { path: '/app/dashboard/shipments', icon: Truck, label: language === 'ar' ? 'الشحنات' : 'Shipments' },
      ]
    },
    {
      title: language === 'ar' ? 'إدارة المشاريع' : 'Project Management',
      items: [
        { path: '/app/dashboard/projects', icon: FolderKanban, label: language === 'ar' ? 'المشاريع' : 'Projects' },
        { path: '/app/dashboard/tasks', icon: ClipboardList, label: language === 'ar' ? 'المهام' : 'Tasks' },
      ]
    },
    {
      title: language === 'ar' ? 'التواصل' : 'Communication',
      items: [
        { path: '/app/dashboard/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
      ]
    },
    {
      title: language === 'ar' ? 'إنترنت الأشياء' : 'Internet of Things',
      items: [
        { path: '/app/dashboard/iot', icon: Cpu, label: language === 'ar' ? 'إنترنت الأشياء' : 'IoT' },
      ]
    },
    {
      title: language === 'ar' ? 'المالية' : 'Finance',
      items: [
        { path: '/app/dashboard/finance', icon: Landmark, label: language === 'ar' ? 'المالية' : 'Finance' },
        { path: '/app/dashboard/expenses', icon: Receipt, label: language === 'ar' ? 'المصروفات' : 'Expenses' },
      ]
    },
    {
      title: language === 'ar' ? 'التكلفة والتخطيط' : 'Costing & Planning',
      items: [
        { path: '/app/dashboard/job-costing', icon: Briefcase, label: language === 'ar' ? 'تكلفة الأعمال' : 'Job Costing' },
        { path: '/app/dashboard/mrp', icon: Factory, label: 'MRP' },
      ]
    },
    {
      title: language === 'ar' ? 'الإعدادات' : 'Settings',
      items: [
        { path: '/app/dashboard/reports', icon: BarChart3, label: language === 'ar' ? 'التقارير' : 'Reports' },
        { path: '/app/dashboard/settings', icon: Settings, label: t('settings') },
      ]
    },
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="font-bold text-lg text-white">Maqder ERP</span>
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

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-4">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!sidebarCollapsed && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
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
                      {item.label}
                    </motion.span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
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
