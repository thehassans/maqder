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
  MessageSquare,
  Mail,
  Cpu,
  Landmark,
  Briefcase,
  Factory,
  Receipt,
  Plane,
  UtensilsCrossed,
  Fingerprint,
  Shield,
  FileSignature,
  Anchor,
  AlertCircle,
  ShoppingBag,
  ChefHat,
  Globe,
  ListOrdered,
  Shirt,
  Car,
  PlusCircle,
  Wrench,
  Ban,
  TrendingUp
} from 'lucide-react'
import { toggleSidebarCollapse, setMobileMenuOpen } from '../../store/slices/uiSlice'
import { useTranslation } from '../../lib/translations'
import { getTenantBusinessTypes } from '../../lib/businessTypes'

export default function Sidebar() {
  const dispatch = useDispatch()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector((state) => state.ui)
  const { tenant, user } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const businessTypes = getTenantBusinessTypes(tenant)

  const hasAccess = (module, action) => {
    if (!user) return false
    if (user.role === 'super_admin' || user.role === 'admin') return true
    const perm = Array.isArray(user.permissions) ? user.permissions.find((p) => p?.module === module) : null
    const actions = Array.isArray(perm?.actions) ? perm.actions : []
    return actions.includes(action)
  }

  const sidebarStyle = tenant?.branding?.sidebarStyle || 'solid'
  const sidebarClassName =
    sidebarStyle === 'glass'
      ? 'bg-white/70 dark:bg-dark-800/70 backdrop-blur-xl'
      : 'bg-white dark:bg-dark-800'

  const navSections = [
      {
        title: language === 'ar' ? 'الخياطة' : 'Tailoring',
        businessTypes: ['khayyat'],
        items: [
          { path: '/app/dashboard/khayyat', icon: LayoutDashboard, label: language === 'ar' ? 'نقطة البيع (الخياط)' : 'Tailor POS', end: true },
          { path: '/app/dashboard/khayyat/analytics', icon: TrendingUp, label: language === 'ar' ? 'الإحصائيات' : 'Analytics' },
          { path: '/app/dashboard/khayyat/stitchings', icon: FileSignature, label: t('orders') },
          { path: '/app/dashboard/khayyat/workers', icon: Users, label: t('workers') },
          { path: '/app/dashboard/khayyat/worker-amounts', icon: Wallet, label: language === 'ar' ? 'أرباح العمال' : 'Worker Amounts' },
          { path: '/app/dashboard/khayyat/embroidery-designs', icon: Package, label: language === 'ar' ? 'التطريز' : 'Embroidery Designs' },
          { path: '/app/dashboard/khayyat/fabrics', icon: Package, label: language === 'ar' ? 'الأقمشة' : 'Fabrics' },
          { path: '/app/dashboard/khayyat/laundry', icon: ShoppingBag, label: language === 'ar' ? 'المغسلة' : 'Laundry' },
          { path: '/app/dashboard/khayyat/loyalty', icon: Landmark, label: language === 'ar' ? 'نقاط الولاء' : 'Loyalty' },
        ]
      },
    {
      title: language === 'ar' ? 'الرئيسية' : 'Main',
      items: [
        { path: '/app/dashboard', icon: LayoutDashboard, label: t('dashboard'), end: true },
        { path: '/app/dashboard/invoices', icon: FileText, label: t('invoices'), perm: { module: 'invoicing', action: 'read' }, excludeBusinessTypes: ['khayyat'] },
        { path: '/app/dashboard/quotations', icon: FileText, label: language === 'ar' ? 'عروض الأسعار' : 'Quotations', perm: { module: 'invoicing', action: 'read' }, excludeBusinessTypes: ['laundry', 'saloon', 'restaurant', 'khayyat'] },
        { path: '/app/dashboard/shipments/new?type=outbound&document=delivery-note', icon: FileText, label: language === 'ar' ? 'إذن تسليم' : 'Delivery Note', perm: { module: 'supply_chain', action: 'read' }, businessTypes: ['trading'] },
        { path: '/app/dashboard/contacts', icon: Users, label: language === 'ar' ? 'جهات الاتصال' : 'Contacts', perm: { module: 'invoicing', action: 'read' } },
        { path: '/app/dashboard/customers', icon: Building, label: language === 'ar' ? 'العملاء' : 'Customers', perm: { module: 'invoicing', action: 'read' } },
        { path: '/app/dashboard/letterhead', icon: FileText, label: language === 'ar' ? 'منشئ الخطابات' : 'Letterhead', perm: { module: 'invoicing', action: 'read' } },
        { path: '/app/dashboard/purchase-orders', icon: ShoppingCart, label: language === 'ar' ? 'طلبات الشراء' : 'Purchase Orders', perm: { module: 'supply_chain', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'نقطة البيع (مغسلة)' : 'Point of sale',
      businessTypes: ['laundry'],
      items: [
        { path: '/app/laundry/pos', icon: ShoppingCart, label: language === 'ar' ? 'طلب جديد (نقطة البيع)' : 'New Order (POS)', perm: { module: 'laundry', action: 'create' } },
        { path: '/app/laundry/orders', icon: ListOrdered, label: language === 'ar' ? 'الطلبات النشطة' : 'Active Orders', perm: { module: 'laundry', action: 'read' } },
        { path: '/app/laundry/customers', icon: Users, label: language === 'ar' ? 'العملاء' : 'Customers', perm: { module: 'laundry', action: 'read' } },
        { path: '/app/laundry/inventory', icon: Package, label: language === 'ar' ? 'مخزون المستلزمات' : 'Supplies Inventory', perm: { module: 'laundry', action: 'read' } },
        { path: '/app/laundry/catalog', icon: Shirt, label: language === 'ar' ? 'قائمة الخدمات' : 'Service Catalog', perm: { module: 'laundry', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'صالون / حلاقة' : 'Saloon & POS',
      businessTypes: ['saloon'],
      items: [
        { path: '/app/saloon/pos', icon: ShoppingCart, label: language === 'ar' ? 'نقطة البيع (صالون)' : 'Saloon POS', perm: { module: 'saloon', action: 'create' } },
        { path: '/app/saloon/orders', icon: ListOrdered, label: language === 'ar' ? 'الطلبات النشطة' : 'Active Orders', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/services', icon: Package, label: language === 'ar' ? 'قائمة الخدمات' : 'Services Catalog', perm: { module: 'saloon', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'المطعم' : 'Restaurant',
      businessTypes: ['restaurant'],
      items: [
        { path: '/app/dashboard/restaurant/pos', icon: ShoppingBag, label: language === 'ar' ? 'نقطة البيع' : 'POS', perm: { module: 'restaurant', action: 'create' } },
        { path: '/app/dashboard/restaurant/menu-items', icon: UtensilsCrossed, label: language === 'ar' ? 'قائمة الطعام' : 'Menu Items', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/tables', icon: Users, label: language === 'ar' ? 'الطاولات' : 'Tables', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/inventory', icon: Package, label: language === 'ar' ? 'المخزون' : 'Inventory', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/orders', icon: Receipt, label: language === 'ar' ? 'الطلبات' : 'Orders', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/kitchen', icon: ChefHat, label: language === 'ar' ? 'المطبخ' : 'Kitchen', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/branches', icon: Building, label: language === 'ar' ? 'الفروع' : 'Branches', perm: { module: 'restaurant', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'تأجير السيارات' : 'Car Rental',
      businessTypes: ['car_rental'],
      items: [
        { path: '/app/rental/checkout', icon: PlusCircle, label: language === 'ar' ? 'تأجير جديد' : 'New Rental', perm: { module: 'car_rental', action: 'create' } },
        { path: '/app/rental/active', icon: Car, label: language === 'ar' ? 'تأجيرات نشطة' : 'Active Rentals', perm: { module: 'car_rental', action: 'read' } },
        { path: '/app/rental/fleet', icon: Car, label: language === 'ar' ? 'الأسطول' : 'All Cars', perm: { module: 'car_rental', action: 'read' } },
        { path: '/app/rental/customers', icon: Users, label: language === 'ar' ? 'العملاء' : 'Customer Registry', perm: { module: 'car_rental', action: 'read' } },
        { path: '/app/rental/contracts', icon: FileText, label: language === 'ar' ? 'العقود' : 'All Contracts', perm: { module: 'car_rental', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'المخزون' : 'Inventory',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/products', icon: Package, label: t('products'), perm: { module: 'inventory', action: 'read' } },
        { path: '/app/dashboard/warehouses', icon: Warehouse, label: t('warehouses'), perm: { module: 'inventory', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'سلسلة التوريد' : 'Supply Chain',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/suppliers', icon: Building, label: language === 'ar' ? 'الموردين' : 'Suppliers', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/shipments', icon: Truck, label: language === 'ar' ? 'الشحنات' : 'Shipments', perm: { module: 'supply_chain', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'الموارد البشرية والعمالة' : 'Manpower & Labor Supply',
      businessTypes: ['manpower'],
      items: [
        { path: '/app/dashboard/manpower/workers', icon: Users, label: language === 'ar' ? 'العمالة' : 'Workers' },
        { path: '/app/dashboard/manpower/assignments', icon: Briefcase, label: language === 'ar' ? 'العقود والتعيينات' : 'Assignments' },
      ]
    },
    {
      title: language === 'ar' ? 'السفر' : 'Travel',
      businessTypes: ['travel_agency'],
      items: [
        { path: '/app/dashboard/travel-bookings', icon: Plane, label: language === 'ar' ? 'الحجوزات' : 'Bookings', perm: { module: 'travel', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'الموارد البشرية' : 'Human Resources',
      items: [
        { path: '/app/dashboard/employees', icon: Users, label: t('employees'), perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/attendance', icon: Fingerprint, label: language === 'ar' ? 'الحضور والبيومتري' : 'Attendance & Biometrics', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/payroll', icon: Wallet, label: t('payroll'), perm: { module: 'payroll', action: 'read' } },
        { path: '/app/dashboard/payroll/calculators', icon: Calculator, label: 'GOSI/EOSB', perm: { module: 'payroll', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'إدارة المشاريع' : 'Project Management',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/projects', icon: FolderKanban, label: language === 'ar' ? 'المشاريع' : 'Projects', perm: { module: 'project_management', action: 'read' } },
        { path: '/app/dashboard/tasks', icon: ClipboardList, label: language === 'ar' ? 'المهام' : 'Tasks', perm: { module: 'project_management', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'التواصل' : 'Communication',
      items: [
        { path: '/app/dashboard/communicate', icon: MessageSquare, label: language === 'ar' ? 'الرسائل' : 'Communicate', perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/whatsapp', icon: MessageCircle, label: 'WhatsApp', perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/email', icon: Mail, label: language === 'ar' ? 'البريد' : 'Email', perm: { module: 'settings', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'إنترنت الأشياء' : 'Internet of Things',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/iot', icon: Cpu, label: language === 'ar' ? 'إنترنت الأشياء' : 'IoT', perm: { module: 'iot', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'المالية' : 'Finance',
      items: [
        { path: '/app/dashboard/finance', icon: Landmark, label: language === 'ar' ? 'المالية' : 'Finance', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/expenses', icon: Receipt, label: language === 'ar' ? 'المصروفات' : 'Expenses', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/vat-returns', icon: Calculator, label: language === 'ar' ? 'إقرارات القيمة المضافة' : 'VAT Returns', perm: { module: 'finance', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'التكلفة والتخطيط' : 'Costing & Planning',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/job-costing', icon: Briefcase, label: language === 'ar' ? 'تكلفة الأعمال' : 'Job Costing', perm: { module: 'job_costing', action: 'read' } },
        { path: '/app/dashboard/mrp', icon: Factory, label: 'MRP', perm: { module: 'mrp', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'الإعدادات' : 'Settings',
      items: [
        { path: '/app/dashboard/reports', icon: BarChart3, label: language === 'ar' ? 'التقارير' : 'Reports', perm: { module: 'invoicing', action: 'read' } },
        { path: '/app/dashboard/users', icon: Users, label: t('users'), perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/settings', icon: Settings, label: t('settings'), perm: { module: 'settings', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'الأسطول والمعدات' : 'Fleet & Machinery',
      businessTypes: ['construction', 'trading'],
      items: [
        { path: '/app/dashboard/fleet', icon: Truck, label: language === 'ar' ? 'الأصول' : 'Assets', perm: { module: 'fleet', action: 'read' } },
        { path: '/app/dashboard/fleet/maintenance-alerts', icon: AlertCircle, label: language === 'ar' ? 'تنبيهات الصيانة' : 'Maintenance Alerts', perm: { module: 'fleet', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'إدارة العقود' : 'Contracts',
      businessTypes: ['construction'],
      items: [
        { path: '/app/dashboard/contracts', icon: FileSignature, label: language === 'ar' ? 'العقود' : 'Contracts', perm: { module: 'contracts', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'التكاليف المرسية' : 'Landed Costs',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/landed-costs', icon: Anchor, label: language === 'ar' ? 'التكاليف المرسية' : 'Landed Costs', perm: { module: 'landed_costs', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'الامتثال' : 'Compliance',
      items: [
        { path: '/app/dashboard/compliance', icon: Shield, label: language === 'ar' ? 'لوحة الامتثال' : 'Compliance Dashboard' },
        { path: '/app/dashboard/saudi-compliance', icon: Globe, label: language === 'ar' ? 'الامتثال التنظيمي السعودي' : 'Saudi Regulatory' },
      ]
    },
  ]

  const visibleNavSections = navSections
    .map((section) => {
      if (Array.isArray(section.businessTypes) && !section.businessTypes.some((type) => businessTypes.includes(type))) {
        return { ...section, items: [] }
      }

      const items = (Array.isArray(section.items) ? section.items : []).filter((item) => {
        if (Array.isArray(item?.businessTypes) && !item.businessTypes.some((type) => businessTypes.includes(type))) {
          return false
        }
        if (Array.isArray(item?.excludeBusinessTypes) && item.excludeBusinessTypes.some((type) => businessTypes.includes(type))) {
          return false
        }
        if (!item?.perm) return true
        return hasAccess(item.perm.module, item.perm.action)
      })

      return { ...section, items }
    })
    .filter((section) => (Array.isArray(section.items) ? section.items.length > 0 : false))

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
        {visibleNavSections.map((section, idx) => (
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

