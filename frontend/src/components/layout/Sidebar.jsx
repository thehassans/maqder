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
  Key,
  ChevronLeft,
  ChevronRight,
  X,
  Calculator,
  Truck,
  FolderKanban,
  ClipboardList,
  BarChart3,
  ShoppingCart,
  ShieldCheck,
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
  TrendingUp,
  PackageMinus,
  QrCode,
  MonitorPlay,
  Database,
  Monitor,
  Scale,
  Leaf,
  AlertTriangle,
  CalendarDays,
  Target,
  Sparkles,
  Printer,
  CalendarClock,
  Tag,
  Calendar,
  Clock,
  Navigation,
  History,
  Scissors,
  Ruler
} from 'lucide-react'
import { toggleSidebarCollapse, setMobileMenuOpen } from '../../store/slices/uiSlice'
import { useTranslation } from '../../lib/translations'
import { getTenantBusinessTypes } from '../../lib/businessTypes'

export default function Sidebar() {
  const dispatch = useDispatch()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector((state) => state.ui)
  const { tenant, user } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const si = tenant?.settings?.saudiIntegrations || {};
  const isZatcaPhase1 = (tenant?.zatca?.phase || 1) === 1;
  const business = tenant?.business || {};
  const isZatcaPhase1Ready = isZatcaPhase1 && !!business.vatNumber && !!(business.legalNameEn || business.legalNameAr) && !!(business.address?.city && business.address?.country);
  const hasZatca = si.zatcaConnectionStatus === 'connected' || tenant?.zatca?.isOnboarded || isZatcaPhase1Ready;
  const hasElm = si.elmConnectionStatus === 'connected';
  const hasQiwa = si.qiwaConnectionStatus === 'connected';
  const hasGosi = si.gosiConnectionStatus === 'connected';

  const govChildren = [];
  if (hasZatca) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/zatca', label: language === 'ar' ? `بوابة زاتكا ${isZatcaPhase1 ? '(المرحلة 1)' : ''}` : `ZATCA${isZatcaPhase1 ? ' Phase 1' : ''} Portal` });
  if (hasElm) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/elm', label: language === 'ar' ? 'بوابة علم / يقين' : 'Elm Portal' });
  if (hasQiwa) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/qiwa', label: language === 'ar' ? 'بوابة قوى' : 'Qiwa Portal' });
  if (hasGosi) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/gosi', label: language === 'ar' ? 'بوابة التأمينات / مدد' : 'GOSI/Mudad Portal' });

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
      title: language === 'ar' ? 'البقالة' : 'Bakala',
      businessTypes: ['bakala'],
      items: [
        { path: '/app/dashboard/bakala/pos', icon: ShoppingCart, label: language === 'ar' ? 'نقطة البيع' : 'POS Checkout' },
        { path: '/app/dashboard/bakala/products', icon: Package, label: language === 'ar' ? 'المنتجات' : 'Products' },
        { path: '/app/dashboard/bakala/add-product', icon: PlusCircle, label: language === 'ar' ? 'إضافة منتج' : 'Add Product' },
        { path: '/app/dashboard/bakala/alerts', icon: AlertTriangle, label: language === 'ar' ? 'تنبيهات المخزون' : 'Stock Alerts' },
        { path: '/app/dashboard/bakala/expiry-waste', icon: CalendarClock, label: language === 'ar' ? 'الانتهاء والهدر' : 'Expiry & Waste' },
        { path: '/app/dashboard/bakala/promotions', icon: Tag, label: language === 'ar' ? 'العروض' : 'Promotions' },
        { path: '/app/dashboard/bakala/profit-margins', icon: TrendingUp, label: language === 'ar' ? 'هوامش الربح' : 'Profit Margins' },
        { path: '/app/dashboard/bakala/auto-reorder', icon: ShoppingCart, label: language === 'ar' ? 'إعادة الطلب' : 'Auto-Reorder' },
        { path: '/app/dashboard/bakala/label-printing', icon: Printer, label: language === 'ar' ? 'طباعة الملصقات' : 'Label Printing' },
        { path: '/app/dashboard/bakala/pnl', icon: BarChart3, label: language === 'ar' ? 'الأرباح اليومية' : 'Daily P&L' },
        { path: '/app/dashboard/bakala/produce', icon: Leaf, label: language === 'ar' ? 'الفواكه والخضروات' : 'Fruits & Vegetables', requireAddon: 'hasWeightScaleAddon' },
        { path: '/app/dashboard/bakala/weight-scale', icon: Scale, label: language === 'ar' ? 'الميزان' : 'Weight Scale', requireAddon: 'hasWeightScaleAddon' },
        { path: '/app/dashboard/bakala/shift', icon: Wallet, label: language === 'ar' ? 'إدارة الوردية' : 'Shift Management' },
        { path: '/app/dashboard/bakala/returns', icon: FileText, label: language === 'ar' ? 'المرتجعات' : 'Returns' },
        { path: '/app/dashboard/khata', icon: Users, label: language === 'ar' ? 'العملاء (خاتا)' : 'Khata', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/bakala/dashboard', icon: ShieldCheck, label: language === 'ar' ? 'لوحة التحكم' : 'Administration' },
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
        { path: '/app/dashboard/restaurant/cashier', icon: MonitorPlay, label: language === 'ar' ? 'لوحة الكاشير' : 'Cashier Panel', perm: { module: 'restaurant', action: 'update' } },
        { path: '/app/dashboard/restaurant/kitchen', icon: ChefHat, label: language === 'ar' ? 'المطبخ' : 'Kitchen', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/kds', icon: Monitor, label: language === 'ar' ? 'شاشة المطبخ' : 'KDS Board', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/branches', icon: Building, label: language === 'ar' ? 'الفروع' : 'Branches', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/qr-menu', icon: QrCode, label: language === 'ar' ? 'رمز القائمة (QR)' : 'QR Menu', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/reservations', icon: Calendar, label: language === 'ar' ? 'الحجوزات' : 'Reservations', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/combos', icon: Tag, label: language === 'ar' ? 'العروض والباقات' : 'Combos & Deals', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/analytics', icon: TrendingUp, label: language === 'ar' ? 'تحليلات المبيعات' : 'Analytics', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/mess', icon: UtensilsCrossed, label: language === 'ar' ? 'المطعم الجماعي' : 'Mess / Cafeteria', perm: { module: 'restaurant', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'بوتيك وإيجار فساتين' : 'Boutique & Rentals',
      businessTypes: ['boutique'],
      items: [
        { path: '/app/dashboard/boutique/pos', icon: Sparkles, label: language === 'ar' ? 'نقطة البيع' : 'POS', perm: { module: 'boutique', action: 'create' } },
        { path: '/app/dashboard/boutique/dresses', icon: Shirt, label: language === 'ar' ? 'الفساتين' : 'Dresses', perm: { module: 'boutique', action: 'read' } },
        { path: '/app/dashboard/boutique/pending-returns', icon: Package, label: language === 'ar' ? 'الإرجاعات المعلقة' : 'Pending Returns', perm: { module: 'boutique', action: 'read' } },
        { path: '/app/dashboard/boutique/rental-calendar', icon: Calendar, label: language === 'ar' ? 'تقويم الإيجار' : 'Rental Calendar', perm: { module: 'boutique', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'الرئيسية' : 'Main',
      items: [
        { path: '/app/dashboard', icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', end: true, excludeBusinessTypes: ['khayyat'] },
        { path: '/app/dashboard/invoices', icon: FileText, label: t('invoices'), perm: { module: 'invoicing', action: 'read' }, excludeBusinessTypes: ['khayyat'] },
        { path: '/app/dashboard/customers', icon: Users, label: language === 'ar' ? 'العملاء' : 'Customers', perm: { module: 'sales', action: 'read' } },
        { path: '/app/dashboard/customers/statement', icon: FileText, label: language === 'ar' ? 'كشف حساب' : 'Customer Statement', perm: { module: 'sales', action: 'read' } },
        { path: '/app/dashboard/quotations', icon: FileSignature, label: language === 'ar' ? 'عروض الأسعار' : 'Quotations', perm: { module: 'sales', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/delivery-notes', icon: FileText, label: language === 'ar' ? 'سندات التسليم' : 'Delivery Notes', perm: { module: 'supply_chain', action: 'read' }, businessTypes: ['trading'] },
        { path: '/app/dashboard/contacts', icon: Users, label: language === 'ar' ? 'جهات الاتصال' : 'Contacts', perm: { module: 'invoicing', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/letterhead', icon: FileText, label: language === 'ar' ? 'منشئ الخطابات' : 'Letterhead', perm: { module: 'invoicing', action: 'read' } },
        { path: '/app/dashboard/purchase-orders', icon: ShoppingCart, label: language === 'ar' ? 'طلبات الشراء' : 'Purchase Orders', perm: { module: 'supply_chain', action: 'read' } },
      ]
    },
      {
        title: language === 'ar' ? 'الخياطة' : 'Tailoring',
        businessTypes: ['khayyat'],
        items: [
          { path: '/app/dashboard/khayyat/analytics', icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard' },
          { path: '/app/dashboard/khayyat', icon: ShoppingCart, label: language === 'ar' ? 'نقطة البيع (الخياط)' : 'Tailor POS', end: true },
          { path: '/app/dashboard/khayyat/stitchings', icon: FileSignature, label: t('orders') },
          { path: '/app/dashboard/khayyat/workers', icon: Users, label: t('workers') },
          { path: '/app/dashboard/khayyat/worker-amounts', icon: Wallet, label: language === 'ar' ? 'أرباح العمال' : 'Worker Amounts' },
          { path: '/app/dashboard/khayyat/embroidery-designs', icon: Package, label: language === 'ar' ? 'التطريز' : 'Embroidery Designs' },
          { path: '/app/dashboard/khayyat/fabrics', icon: Package, label: language === 'ar' ? 'الأقمشة' : 'Fabrics' },
          { path: '/app/dashboard/khayyat/laundry', icon: ShoppingBag, label: language === 'ar' ? 'المغسلة' : 'Laundry' },
          { path: '/app/dashboard/khayyat/loyalty', icon: Landmark, label: language === 'ar' ? 'نقاط الولاء' : 'Loyalty' },
        { path: '/app/dashboard/khayyat/measurements', icon: Ruler, label: language === 'ar' ? 'القياسات والتوصيل' : 'Measurements & Delivery' },
        ]
      },
    {
      title: language === 'ar' ? 'صالون / حلاقة' : 'Saloon & POS',
      businessTypes: ['saloon'],
      items: [
        { path: '/app/saloon/dashboard', icon: LayoutDashboard, label: language === 'ar' ? 'لوحة التحكم' : 'Dashboard', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/pos', icon: ShoppingCart, label: language === 'ar' ? 'نقطة البيع (صالون)' : 'Saloon POS', perm: { module: 'saloon', action: 'create' } },
        { path: '/app/saloon/queue', icon: Monitor, label: language === 'ar' ? 'شاشة الانتظار' : 'Queue TV', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/services', icon: Package, label: language === 'ar' ? 'قائمة الخدمات' : 'Services Catalog', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/barbers', icon: Users, label: language === 'ar' ? 'الحلاقين' : 'Barbers', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/qr', icon: QrCode, label: language === 'ar' ? 'كتالوج QR' : 'QR Catalog', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/dashboard/saloon/appointments', icon: Clock, label: language === 'ar' ? 'المواعيد والعمولات' : 'Appointments & Commissions', perm: { module: 'saloon', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'سلسلة التوريد' : 'Supply Chain',
      businessTypes: ['trading', 'bakala'],
      items: [
        { path: '/app/dashboard/suppliers', icon: Building, label: language === 'ar' ? 'الموردين' : 'Suppliers', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/supplier-performance', icon: TrendingUp, label: language === 'ar' ? 'أداء الموردين' : 'Supplier Performance', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/grn', icon: Truck, label: language === 'ar' ? 'استلام البضائع' : 'Goods Receipt', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/purchase-returns', icon: PackageMinus, label: language === 'ar' ? 'مرتجعات المشتريات' : 'Purchase Returns', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/shipments', icon: Truck, label: language === 'ar' ? 'الشحنات' : 'Shipments', perm: { module: 'supply_chain', action: 'read' } },
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
        { path: '/app/dashboard/laundry/delivery', icon: Navigation, label: language === 'ar' ? 'التوصيل والمسارات' : 'Delivery & Routes', perm: { module: 'laundry', action: 'read' } },
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
        { path: '/app/dashboard/rental/maintenance', icon: Wrench, label: language === 'ar' ? 'الصيانة والأسطول' : 'Maintenance & Fleet', perm: { module: 'car_rental', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'مركز الصيانة' : 'Car Workshop',
      businessTypes: ['car_workshop'],
      items: [
        { path: '/app/workshop', icon: Wrench, label: language === 'ar' ? 'ورشة العمل' : 'Workshop', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/workshop/job-cards', icon: ClipboardList, label: language === 'ar' ? 'بطاقات الإصلاح' : 'Job Cards', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/workshop/vehicles', icon: Car, label: language === 'ar' ? 'السيارات' : 'Vehicles', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/workshop/inventory', icon: Package, label: language === 'ar' ? 'قطع الغيار' : 'Spare Parts', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/dashboard/workshop/service-history', icon: History, label: language === 'ar' ? 'سجل الخدمة' : 'Service History', perm: { module: 'workshop', action: 'read' } },
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
      title: language === 'ar' ? 'المالية' : 'Finance',
      items: [
        { path: '/app/dashboard/finance', icon: Landmark, label: language === 'ar' ? 'المالية' : 'Finance', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/vouchers', icon: Receipt, label: language === 'ar' ? 'السندات' : 'Vouchers', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/expenses', icon: Receipt, label: language === 'ar' ? 'المصروفات' : 'Expenses', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/vat-returns', icon: Calculator, label: language === 'ar' ? 'إقرارات القيمة المضافة' : 'VAT Returns', perm: { module: 'finance', action: 'read' } },
        ...(tenant?.zatca?.phase !== 1 ? [{ path: '/app/dashboard/finance/zatca-logs', icon: Shield, label: language === 'ar' ? 'سجل زاتكا' : 'ZATCA Logs', perm: { module: 'finance', action: 'read' } }] : []),
        { path: '/app/dashboard/reports', icon: BarChart3, label: language === 'ar' ? 'التقارير' : 'Reports', perm: { module: 'invoicing', action: 'read' } },
      ]
    },

    {
      title: language === 'ar' ? 'الموارد البشرية والعمالة' : 'Manpower & Labor Supply',
      businessTypes: ['manpower'],
      items: [
        { path: '/app/dashboard/manpower/workers', icon: Users, label: language === 'ar' ? 'العمالة' : 'Workers' },
        { path: '/app/dashboard/manpower/assignments', icon: Briefcase, label: language === 'ar' ? 'تعيينات العمالة' : 'Assignments' },
        { path: '/app/dashboard/contracts', icon: FileSignature, label: language === 'ar' ? 'العقود' : 'Contracts' },
        { path: '/app/dashboard/projects', icon: FolderKanban, label: language === 'ar' ? 'المشاريع' : 'Projects' },
        { path: '/app/dashboard/tasks', icon: ClipboardList, label: language === 'ar' ? 'المهام' : 'Tasks' },
        { path: '/app/dashboard/manpower/timesheets', icon: Clock, label: language === 'ar' ? 'سجلات الوقت' : 'Timesheets', perm: { module: 'hr', action: 'read' } },
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
        { path: '/app/dashboard/hr/attendance', icon: Fingerprint, label: language === 'ar' ? 'الحضور والبيومتري' : 'Attendance & Biometrics', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/compliance', icon: ShieldCheck, label: language === 'ar' ? 'الامتثال (بلدي وإقامة)' : 'Compliance (Balady/Iqama)', perm: { module: 'hr', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/hr/hiring', icon: Briefcase, label: language === 'ar' ? 'التوظيف' : 'Hiring', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/leaves', icon: CalendarDays, label: language === 'ar' ? 'الإجازات' : 'Leaves', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/performance', icon: Target, label: language === 'ar' ? 'الأداء' : 'Performance', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/payroll', icon: Wallet, label: t('payroll'), perm: { module: 'payroll', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/payroll/calculators', icon: Calculator, label: 'GOSI/EOSB', perm: { module: 'payroll', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/hr/reports', icon: BarChart3, label: language === 'ar' ? 'تقارير الموارد البشرية' : 'HR Reports', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/expense-claims', icon: Wallet, label: language === 'ar' ? 'مطالبات المصروفات' : 'Expense Claims', perm: { module: 'hr', action: 'read' } },
      ]
    },

    {
      title: language === 'ar' ? 'إدارة العملاء (CRM)' : 'CRM',
      items: [
        { path: '/app/dashboard/crm', icon: Target, label: language === 'ar' ? 'لوحة CRM' : 'CRM Dashboard', end: true, perm: { module: 'crm', action: 'read' } },
        { path: '/app/dashboard/crm/leads', icon: Users, label: language === 'ar' ? 'العملاء المحتملون' : 'Leads', perm: { module: 'crm', action: 'read' } },
        { path: '/app/dashboard/crm/deals', icon: BarChart3, label: language === 'ar' ? 'الصفقات' : 'Deals', perm: { module: 'crm', action: 'read' } },
        { path: '/app/dashboard/crm/activities', icon: ClipboardList, label: language === 'ar' ? 'الأنشطة' : 'Activities', perm: { module: 'crm', action: 'read' } },
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
        { path: '/app/dashboard/users', icon: Users, label: t('users'), perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/backup', icon: Database, label: language === 'ar' ? 'النسخ الاحتياطي' : 'Backup', perm: { module: 'settings', action: 'read' } },
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
        { path: '/app/dashboard/tenant-settings/government-integrations', icon: Key, label: language === 'ar' ? 'التكاملات الحكومية' : 'Gov Integrations', children: govChildren },
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
        if (item.requireAddon && !tenant?.subscription?.[item.requireAddon]) {
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
      <div className="flex items-center justify-center px-4 h-16 bg-[#1a3d28] relative overflow-hidden">
        <div className="w-full h-12 flex items-center justify-center flex-shrink-0">
          <img src="/maqdernewlogo.png" alt="Maqder" className="h-full w-auto object-contain scale-[2] origin-center" />
        </div>
        
        {/* Mobile close button */}
        <button
          onClick={() => dispatch(setMobileMenuOpen(false))}
          className="lg:hidden absolute right-4 p-2 rounded-lg hover:bg-white/10 text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tenant Info */}
      {!sidebarCollapsed && tenant && (
        <div className="px-6 py-6 border-b border-gray-100 dark:border-dark-700 flex flex-col items-center text-center">
          {tenant?.branding?.logo ? (
            <div className="w-full h-20 mb-5 flex items-center justify-center">
              <img src={tenant.branding.logo} alt="Company Logo" className="max-h-full max-w-[85%] object-contain dark:mix-blend-normal" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-700 text-gray-900 dark:text-white flex items-center justify-center font-light text-2xl mb-4">
              {tenant.business?.legalNameEn?.charAt(0) || tenant.name?.charAt(0) || 'M'}
            </div>
          )}
          
          <h3 className="font-bold text-gray-900 dark:text-white text-xs leading-snug tracking-widest uppercase">
            {language === 'ar' ? tenant.business?.legalNameAr : tenant.business?.legalNameEn}
          </h3>
          {tenant.business?.vatNumber && (
            <div className="mt-1.5 text-[9px] text-gray-400 tracking-widest font-mono uppercase">
              VAT {tenant.business?.vatNumber}
            </div>
          )}
          {user?.branchId && (
            <div className="mt-2 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">
              {language === 'ar' ? 'فرع' : 'Branch'}
            </div>
          )}
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
              {section.items.map((item) => {
                const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                return (
                  <div key={item.path} className="space-y-1">
                    <NavLink
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
                          className="flex-1 flex justify-between items-center"
                        >
                          <span>{item.label}</span>
                        </motion.span>
                      )}
                    </NavLink>
                    {hasChildren && !sidebarCollapsed && (
                      <div className="ps-6 ml-6 border-l border-gray-200 dark:border-dark-600 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <NavLink
                            key={child.path}
                            to={child.path}
                            onClick={() => dispatch(setMobileMenuOpen(false))}
                            className={({ isActive }) =>
                              `block py-1.5 px-3 rounded-lg text-[11px] font-medium transition-all ${
                                isActive
                                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 font-semibold'
                                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-dark-700/50'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
        {SidebarContent()}
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
              {SidebarContent()}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

