import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/api'
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
  Ruler,
  Bike,
  CreditCard,
  FileSpreadsheet,
  GraduationCap,
  Recycle,
  BookMarked,
  Store,
  Palette,
  Boxes,
  RotateCcw,
  Gift,
  HelpCircle,
  Globe2,
  PanelLeftClose
} from 'lucide-react'
import { toggleSidebarCollapse, setMobileMenuOpen, setHideSidebar } from '../../store/slices/uiSlice'
import { useTranslation } from '../../lib/translations'
import { getTenantBusinessTypes } from '../../lib/businessTypes'

export default function Sidebar() {
  const dispatch = useDispatch()
  const { sidebarCollapsed, mobileMenuOpen, language } = useSelector((state) => state.ui)
  const { tenant, user } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const [pendingQuestions, setPendingQuestions] = useState(0)
  const [pendingReviews, setPendingReviews] = useState(0)

  const si = tenant?.settings?.saudiIntegrations || {};
  const isZatcaPhase1 = (tenant?.zatca?.phase || 1) === 1;
  const business = tenant?.business || {};
  const isZatcaPhase1Ready = isZatcaPhase1 && !!business.vatNumber && !!(business.legalNameEn || business.legalNameAr) && !!(business.address?.city && business.address?.country);
  const hasZatca = si.zatcaConnectionStatus === 'connected' || tenant?.zatca?.isOnboarded || isZatcaPhase1Ready;
  const hasElm = si.elmConnectionStatus === 'connected';
  const hasQiwa = si.qiwaConnectionStatus === 'connected';
  const hasGosi = si.gosiConnectionStatus === 'connected';

  const govChildren = [];
  if (hasZatca) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/zatca', label: language === 'ar' ? `Ø¨ÙˆØ§Ø¨Ø© Ø²Ø§ØªÙƒØ§ ${isZatcaPhase1 ? '(Ø§Ù„Ù…Ø±Ø­Ù„Ø© 1)' : ''}` : `ZATCA${isZatcaPhase1 ? ' Phase 1' : ''} Portal` });
  if (hasElm) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/elm', label: language === 'ar' ? 'Ø¨ÙˆØ§Ø¨Ø© Ø¹Ù„Ù… / ÙŠÙ‚ÙŠÙ†' : 'Elm Portal' });
  if (hasQiwa) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/qiwa', label: language === 'ar' ? 'Ø¨ÙˆØ§Ø¨Ø© Ù‚ÙˆÙ‰' : 'Qiwa Portal' });
  if (hasGosi) govChildren.push({ path: '/app/dashboard/tenant-settings/government-integrations/gosi', label: language === 'ar' ? 'Ø¨ÙˆØ§Ø¨Ø© Ø§Ù„ØªØ£Ù…ÙŠÙ†Ø§Øª / Ù…Ø¯Ø¯' : 'GOSI/Mudad Portal' });

  const businessTypes = getTenantBusinessTypes(tenant)

  useEffect(() => {
    if (businessTypes.includes('ecommerce') || businessTypes.includes('trading')) {
      api.get('/ecommerce/products/questions/pending').then(res => setPendingQuestions(res.data?.questions?.length || 0)).catch(() => {})
      api.get('/ecommerce/reviews?status=pending&limit=1').then(res => setPendingReviews(res.data?.total || 0)).catch(() => {})
      const interval = setInterval(() => {
        api.get('/ecommerce/products/questions/pending').then(res => setPendingQuestions(res.data?.questions?.length || 0)).catch(() => {})
        api.get('/ecommerce/reviews?status=pending&limit=1').then(res => setPendingReviews(res.data?.total || 0)).catch(() => {})
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [businessTypes])

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
      title: language === 'ar' ? 'Ø§Ù„Ø¨Ù‚Ø§Ù„Ø©' : 'Bakala',
      businessTypes: ['bakala'],
      items: [
        { path: '/app/dashboard/bakala/pos', icon: ShoppingCart, label: language === 'ar' ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹' : 'POS Checkout' },
        { path: '/app/dashboard/bakala/products', icon: Package, label: language === 'ar' ? 'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª' : 'Products' },
        { path: '/app/dashboard/bakala/add-product', icon: PlusCircle, label: language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬' : 'Add Product' },
        { path: '/app/dashboard/bakala/alerts', icon: AlertTriangle, label: language === 'ar' ? 'ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„Ù…Ø®Ø²ÙˆÙ†' : 'Stock Alerts' },
        { path: '/app/dashboard/bakala/expiry-waste', icon: CalendarClock, label: language === 'ar' ? 'Ø§Ù„Ø§Ù†ØªÙ‡Ø§Ø¡ ÙˆØ§Ù„Ù‡Ø¯Ø±' : 'Expiry & Waste' },
        { path: '/app/dashboard/bakala/promotions', icon: Tag, label: language === 'ar' ? 'Ø§Ù„Ø¹Ø±ÙˆØ¶' : 'Promotions' },
        { path: '/app/dashboard/bakala/profit-margins', icon: TrendingUp, label: language === 'ar' ? 'Ù‡ÙˆØ§Ù…Ø´ Ø§Ù„Ø±Ø¨Ø­' : 'Profit Margins' },
        { path: '/app/dashboard/bakala/auto-reorder', icon: ShoppingCart, label: language === 'ar' ? 'Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø·Ù„Ø¨' : 'Auto-Reorder' },
        { path: '/app/dashboard/bakala/label-printing', icon: Printer, label: language === 'ar' ? 'Ø·Ø¨Ø§Ø¹Ø© Ø§Ù„Ù…Ù„ØµÙ‚Ø§Øª' : 'Label Printing' },
        { path: '/app/dashboard/bakala/pnl', icon: BarChart3, label: language === 'ar' ? 'Ø§Ù„Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„ÙŠÙˆÙ…ÙŠØ©' : 'Daily P&L' },
        { path: '/app/dashboard/bakala/produce', icon: Leaf, label: language === 'ar' ? 'Ø§Ù„ÙÙˆØ§ÙƒÙ‡ ÙˆØ§Ù„Ø®Ø¶Ø±ÙˆØ§Øª' : 'Fruits & Vegetables', requireAddon: 'hasWeightScaleAddon' },
        { path: '/app/dashboard/bakala/weight-scale', icon: Scale, label: language === 'ar' ? 'Ø§Ù„Ù…ÙŠØ²Ø§Ù†' : 'Weight Scale', requireAddon: 'hasWeightScaleAddon' },
        { path: '/app/dashboard/bakala/shift', icon: Wallet, label: language === 'ar' ? 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙˆØ±Ø¯ÙŠØ©' : 'Shift Management' },
        { path: '/app/dashboard/bakala/returns', icon: FileText, label: language === 'ar' ? 'Ø§Ù„Ù…Ø±ØªØ¬Ø¹Ø§Øª' : 'Returns' },
        { path: '/app/dashboard/khata', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ (Ø®Ø§ØªØ§)' : 'Khata', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/bakala/dashboard', icon: ShieldCheck, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Administration' },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ù…ÙƒØªØ¨Ø©' : 'Bookstore',
      businessTypes: ['bookstore'],
      items: [
        { path: '/app/dashboard/bookstore/pos', icon: ShoppingCart, label: language === 'ar' ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹' : 'POS Checkout' },
        { path: '/app/dashboard/bookstore/products', icon: Package, label: language === 'ar' ? 'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª' : 'Products' },
        { path: '/app/dashboard/bookstore/add-product', icon: PlusCircle, label: language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬' : 'Add Product' },
        { path: '/app/dashboard/bookstore/import', icon: FileSpreadsheet, label: language === 'ar' ? 'Ø§Ø³ØªÙŠØ±Ø§Ø¯' : 'Bulk Import' },
        { path: '/app/dashboard/bookstore/supply-lists', icon: GraduationCap, label: language === 'ar' ? 'Ù‚ÙˆØ§Ø¦Ù… Ø§Ù„Ù…Ø¯Ø§Ø±Ø³' : 'Supply Lists' },
        { path: '/app/dashboard/bookstore/buyback', icon: Recycle, label: language === 'ar' ? 'Ø§Ù„ÙƒØªØ¨ Ø§Ù„Ù…Ø³ØªØ¹Ù…Ù„Ø©' : 'Buy-Back' },
        { path: '/app/dashboard/bookstore/rentals', icon: BookMarked, label: language === 'ar' ? 'Ø§Ù„Ø¥Ø¹Ø§Ø±Ø©' : 'Rentals' },
        { path: '/app/dashboard/bookstore/bestsellers', icon: TrendingUp, label: language === 'ar' ? 'Ø§Ù„Ø£ÙƒØ«Ø± Ù…Ø¨ÙŠØ¹Ø§Ù‹' : 'Bestsellers' },
        { path: '/app/dashboard/bookstore/reports', icon: BarChart3, label: language === 'ar' ? 'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±' : 'Reports' },
        { path: '/app/dashboard/bookstore/shift', icon: Wallet, label: language === 'ar' ? 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„ÙˆØ±Ø¯ÙŠØ©' : 'Shift Management' },
        { path: '/app/dashboard/khata', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ (Ø®Ø§ØªØ§)' : 'Khata', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/bookstore/dashboard', icon: ShieldCheck, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Administration' },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ù…ØªØ¬Ø± Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'E-Commerce',
      businessTypes: ['ecommerce', 'trading'],
      items: [
        { path: '/app/dashboard/ecommerce', icon: LayoutDashboard, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Insights', end: true },
        { path: '/app/dashboard/ecommerce/orders', icon: ListOrdered, label: language === 'ar' ? 'Ø§Ù„Ø·Ù„Ø¨Ø§Øª' : 'Orders' },
        { path: '/app/dashboard/ecommerce/products', icon: Package, label: language === 'ar' ? 'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª' : 'Products' },
        { path: '/app/dashboard/ecommerce/inventory', icon: Boxes, label: language === 'ar' ? 'Ø§Ù„Ù…Ø®Ø²ÙˆÙ†' : 'Inventory' },
        { path: '/app/dashboard/ecommerce/customers', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡' : 'Customers' },
        { path: '/app/dashboard/ecommerce/sales-report', icon: BarChart3, label: language === 'ar' ? 'ØªÙ‚Ø±ÙŠØ± Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª' : 'Sales Report' },
        { path: '/app/dashboard/ecommerce/products/new', icon: PlusCircle, label: language === 'ar' ? 'Ø¥Ø¶Ø§ÙØ© Ù…Ù†ØªØ¬' : 'Add Product' },
        { path: '/app/dashboard/ecommerce/theme', icon: Palette, label: language === 'ar' ? 'ØªØµÙ…ÙŠÙ… Ø§Ù„Ù…ØªØ¬Ø±' : 'Theme Editor' },
        { path: '/app/dashboard/ecommerce/domains', icon: Globe, label: language === 'ar' ? 'Ø§Ù„Ù†Ø·Ø§Ù‚Ø§Øª' : 'Domains' },
        { path: '/app/dashboard/ecommerce/payments', icon: CreditCard, label: language === 'ar' ? 'Ø¨ÙˆØ§Ø¨Ø§Øª Ø§Ù„Ø¯ÙØ¹' : 'Payments' },
        { path: '/app/dashboard/ecommerce/couriers', icon: Truck, label: language === 'ar' ? 'Ø´Ø±ÙƒØ§Øª Ø§Ù„Ø´Ø­Ù†' : 'Couriers' },
        { path: '/app/dashboard/ecommerce/pixels', icon: BarChart3, label: language === 'ar' ? 'Ø¨ÙŠÙƒØ³Ù„Ø§Øª Ø§Ù„ØªØªØ¨Ø¹' : 'Tracking Pixels' },
        { path: '/app/dashboard/ecommerce/coupons', icon: Tag, label: language === 'ar' ? 'ÙƒÙˆØ¨ÙˆÙ†Ø§Øª Ø§Ù„Ø®ØµÙ…' : 'Coupons' },
        { path: '/app/dashboard/ecommerce/bundles', icon: Package, label: language === 'ar' ? 'Ø­Ø²Ù… Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª' : 'Bundles' },
        { path: '/app/dashboard/ecommerce/reviews', icon: MessageSquare, label: language === 'ar' ? 'Ø§Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª' : 'Reviews' },
        { path: '/app/dashboard/ecommerce/newsletter', icon: Mail, label: language === 'ar' ? 'Ø§Ù„Ù†Ø´Ø±Ø© Ø§Ù„Ø¨Ø±ÙŠØ¯ÙŠØ©' : 'Newsletter' },
        { path: '/app/dashboard/ecommerce/abandoned-carts', icon: ShoppingCart, label: language === 'ar' ? 'Ø³Ù„Ø§Øª Ù…ØªØ±ÙˆÙƒØ©' : 'Abandoned Carts' },
        { path: '/app/dashboard/ecommerce/returns', icon: RotateCcw, label: language === 'ar' ? 'Ø§Ù„Ù…Ø±ØªØ¬Ø¹Ø§Øª' : 'Returns & Refunds' },
        { path: '/app/dashboard/ecommerce/gift-cards', icon: Gift, label: language === 'ar' ? 'Ø¨Ø·Ø§Ù‚Ø§Øª Ø§Ù„Ù‡Ø¯Ø§ÙŠØ§' : 'Gift Cards' },
        { path: '/app/dashboard/ecommerce/questions', icon: HelpCircle, label: language === 'ar' ? 'Ø£Ø³Ø¦Ù„Ø© ÙˆØ£Ø¬ÙˆØ¨Ø©' : 'Product Q&A' },
        { path: '/app/dashboard/ecommerce/wordpress', icon: Globe2, label: language === 'ar' ? 'ÙˆÙˆØ±Ø¯Ø¨Ø±ÙŠØ³' : 'WordPress' },
        { path: '/app/dashboard/ecommerce/settings', icon: Settings, label: language === 'ar' ? 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª' : 'Store Settings' },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ù…Ø·Ø¹Ù…' : 'Restaurant',
      businessTypes: ['restaurant'],
      items: [
        { path: '/app/dashboard/restaurant/pos', icon: ShoppingBag, label: language === 'ar' ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹' : 'POS', perm: { module: 'restaurant', action: 'create' } },
        { path: '/app/dashboard/restaurant/menu-items', icon: UtensilsCrossed, label: language === 'ar' ? 'Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø·Ø¹Ø§Ù…' : 'Menu Items', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/tables', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø·Ø§ÙˆÙ„Ø§Øª' : 'Tables', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/inventory', icon: Package, label: language === 'ar' ? 'Ø§Ù„Ù…Ø®Ø²ÙˆÙ†' : 'Inventory', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/orders', icon: Receipt, label: language === 'ar' ? 'Ø§Ù„Ø·Ù„Ø¨Ø§Øª' : 'Orders', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/cashier', icon: MonitorPlay, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„ÙƒØ§Ø´ÙŠØ±' : 'Cashier Panel', perm: { module: 'restaurant', action: 'update' } },
        { path: '/app/dashboard/restaurant/kitchen', icon: ChefHat, label: language === 'ar' ? 'Ø§Ù„Ù…Ø·Ø¨Ø®' : 'Kitchen', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/kds', icon: Monitor, label: language === 'ar' ? 'Ø´Ø§Ø´Ø© Ø§Ù„Ù…Ø·Ø¨Ø®' : 'KDS Board', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/branches', icon: Building, label: language === 'ar' ? 'Ø§Ù„ÙØ±ÙˆØ¹' : 'Branches', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/qr-menu', icon: QrCode, label: language === 'ar' ? 'Ø±Ù…Ø² Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© (QR)' : 'QR Menu', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/reservations', icon: Calendar, label: language === 'ar' ? 'Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª' : 'Reservations', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/combos', icon: Tag, label: language === 'ar' ? 'Ø§Ù„Ø¹Ø±ÙˆØ¶ ÙˆØ§Ù„Ø¨Ø§Ù‚Ø§Øª' : 'Combos & Deals', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/analytics', icon: TrendingUp, label: language === 'ar' ? 'ØªØ­Ù„ÙŠÙ„Ø§Øª Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª' : 'Analytics', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/mess', icon: UtensilsCrossed, label: language === 'ar' ? 'Ø§Ù„Ù…Ø·Ø¹Ù… Ø§Ù„Ø¬Ù…Ø§Ø¹ÙŠ' : 'Mess / Cafeteria', perm: { module: 'restaurant', action: 'read' } },
        { path: '/app/dashboard/restaurant/delivery', icon: Bike, label: language === 'ar' ? 'Ù…Ù†ØµØ§Øª Ø§Ù„ØªÙˆØµÙŠÙ„' : 'Delivery Platforms', perm: { module: 'restaurant', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø¨ÙˆØªÙŠÙƒ ÙˆØ¥ÙŠØ¬Ø§Ø± ÙØ³Ø§ØªÙŠÙ†' : 'Boutique & Rentals',
      businessTypes: ['boutique'],
      items: [
        { path: '/app/dashboard/boutique/pos', icon: Sparkles, label: language === 'ar' ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹' : 'POS', perm: { module: 'boutique', action: 'create' } },
        { path: '/app/dashboard/boutique/dresses', icon: Shirt, label: language === 'ar' ? 'Ø§Ù„ÙØ³Ø§ØªÙŠÙ†' : 'Dresses', perm: { module: 'boutique', action: 'read' } },
        { path: '/app/dashboard/boutique/pending-returns', icon: Package, label: language === 'ar' ? 'Ø§Ù„Ø¥Ø±Ø¬Ø§Ø¹Ø§Øª Ø§Ù„Ù…Ø¹Ù„Ù‚Ø©' : 'Pending Returns', perm: { module: 'boutique', action: 'read' } },
        { path: '/app/dashboard/boutique/rental-calendar', icon: Calendar, label: language === 'ar' ? 'ØªÙ‚ÙˆÙŠÙ… Ø§Ù„Ø¥ÙŠØ¬Ø§Ø±' : 'Rental Calendar', perm: { module: 'boutique', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©' : 'Main',
      items: [
        { path: '/app/dashboard', icon: LayoutDashboard, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Dashboard', end: true, excludeBusinessTypes: ['khayyat'] },
        { path: '/app/dashboard/invoices', icon: FileText, label: t('invoices'), perm: { module: 'invoicing', action: 'read' }, excludeBusinessTypes: ['khayyat'] },
        { path: '/app/dashboard/customers', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡' : 'Customers', perm: { module: 'sales', action: 'read' } },
        { path: '/app/dashboard/customers/statement', icon: FileText, label: language === 'ar' ? 'ÙƒØ´Ù Ø­Ø³Ø§Ø¨' : 'Customer Statement', perm: { module: 'sales', action: 'read' } },
        { path: '/app/dashboard/quotations', icon: FileSignature, label: language === 'ar' ? 'Ø¹Ø±ÙˆØ¶ Ø§Ù„Ø£Ø³Ø¹Ø§Ø±' : 'Quotations', perm: { module: 'sales', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/delivery-notes', icon: FileText, label: language === 'ar' ? 'Ø³Ù†Ø¯Ø§Øª Ø§Ù„ØªØ³Ù„ÙŠÙ…' : 'Delivery Notes', perm: { module: 'supply_chain', action: 'read' }, businessTypes: ['trading'] },
        { path: '/app/dashboard/contacts', icon: Users, label: language === 'ar' ? 'Ø¬Ù‡Ø§Øª Ø§Ù„Ø§ØªØµØ§Ù„' : 'Contacts', perm: { module: 'invoicing', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/letterhead', icon: FileText, label: language === 'ar' ? 'Ù…Ù†Ø´Ø¦ Ø§Ù„Ø®Ø·Ø§Ø¨Ø§Øª' : 'Letterhead', perm: { module: 'invoicing', action: 'read' } },
        { path: '/app/dashboard/purchase-orders', icon: ShoppingCart, label: language === 'ar' ? 'Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ø´Ø±Ø§Ø¡' : 'Purchase Orders', perm: { module: 'supply_chain', action: 'read' } },
      ]
    },
      {
        title: language === 'ar' ? 'Ø§Ù„Ø®ÙŠØ§Ø·Ø©' : 'Tailoring',
        businessTypes: ['khayyat'],
        items: [
          { path: '/app/dashboard/khayyat/analytics', icon: LayoutDashboard, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Dashboard' },
          { path: '/app/dashboard/khayyat', icon: ShoppingCart, label: language === 'ar' ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹ (Ø§Ù„Ø®ÙŠØ§Ø·)' : 'Tailor POS', end: true },
          { path: '/app/dashboard/khayyat/stitchings', icon: FileSignature, label: t('orders') },
          { path: '/app/dashboard/khayyat/workers', icon: Users, label: t('workers') },
          { path: '/app/dashboard/khayyat/worker-amounts', icon: Wallet, label: language === 'ar' ? 'Ø£Ø±Ø¨Ø§Ø­ Ø§Ù„Ø¹Ù…Ø§Ù„' : 'Worker Amounts' },
          { path: '/app/dashboard/khayyat/embroidery-designs', icon: Package, label: language === 'ar' ? 'Ø§Ù„ØªØ·Ø±ÙŠØ²' : 'Embroidery Designs' },
          { path: '/app/dashboard/khayyat/fabrics', icon: Package, label: language === 'ar' ? 'Ø§Ù„Ø£Ù‚Ù…Ø´Ø©' : 'Fabrics' },
          { path: '/app/dashboard/khayyat/laundry', icon: ShoppingBag, label: language === 'ar' ? 'Ø§Ù„Ù…ØºØ³Ù„Ø©' : 'Laundry' },
          { path: '/app/dashboard/khayyat/loyalty', icon: Landmark, label: language === 'ar' ? 'Ù†Ù‚Ø§Ø· Ø§Ù„ÙˆÙ„Ø§Ø¡' : 'Loyalty' },
        { path: '/app/dashboard/khayyat/measurements', icon: Ruler, label: language === 'ar' ? 'Ø§Ù„Ù‚ÙŠØ§Ø³Ø§Øª ÙˆØ§Ù„ØªÙˆØµÙŠÙ„' : 'Measurements & Delivery' },
        ]
      },
    {
      title: language === 'ar' ? 'ØµØ§Ù„ÙˆÙ† / Ø­Ù„Ø§Ù‚Ø©' : 'Saloon & POS',
      businessTypes: ['saloon'],
      items: [
        { path: '/app/saloon/dashboard', icon: LayoutDashboard, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Dashboard', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/pos', icon: ShoppingCart, label: language === 'ar' ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹ (ØµØ§Ù„ÙˆÙ†)' : 'Saloon POS', perm: { module: 'saloon', action: 'create' } },
        { path: '/app/saloon/queue', icon: Monitor, label: language === 'ar' ? 'Ø´Ø§Ø´Ø© Ø§Ù„Ø§Ù†ØªØ¸Ø§Ø±' : 'Queue TV', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/services', icon: Package, label: language === 'ar' ? 'Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø®Ø¯Ù…Ø§Øª' : 'Services Catalog', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/barbers', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø­Ù„Ø§Ù‚ÙŠÙ†' : 'Barbers', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/saloon/qr', icon: QrCode, label: language === 'ar' ? 'ÙƒØªØ§Ù„ÙˆØ¬ QR' : 'QR Catalog', perm: { module: 'saloon', action: 'read' } },
        { path: '/app/dashboard/saloon/appointments', icon: Clock, label: language === 'ar' ? 'Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ ÙˆØ§Ù„Ø¹Ù…ÙˆÙ„Ø§Øª' : 'Appointments & Commissions', perm: { module: 'saloon', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø³Ù„Ø³Ù„Ø© Ø§Ù„ØªÙˆØ±ÙŠØ¯' : 'Supply Chain',
      businessTypes: ['trading', 'bakala'],
      items: [
        { path: '/app/dashboard/suppliers', icon: Building, label: language === 'ar' ? 'Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†' : 'Suppliers', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/supplier-performance', icon: TrendingUp, label: language === 'ar' ? 'Ø£Ø¯Ø§Ø¡ Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†' : 'Supplier Performance', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/grn', icon: Truck, label: language === 'ar' ? 'Ø§Ø³ØªÙ„Ø§Ù… Ø§Ù„Ø¨Ø¶Ø§Ø¦Ø¹' : 'Goods Receipt', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/purchase-returns', icon: PackageMinus, label: language === 'ar' ? 'Ù…Ø±ØªØ¬Ø¹Ø§Øª Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª' : 'Purchase Returns', perm: { module: 'supply_chain', action: 'read' } },
        { path: '/app/dashboard/shipments', icon: Truck, label: language === 'ar' ? 'Ø§Ù„Ø´Ø­Ù†Ø§Øª' : 'Shipments', perm: { module: 'supply_chain', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹ (Ù…ØºØ³Ù„Ø©)' : 'Point of sale',
      businessTypes: ['laundry'],
      items: [
        { path: '/app/laundry/pos', icon: ShoppingCart, label: language === 'ar' ? 'Ø·Ù„Ø¨ Ø¬Ø¯ÙŠØ¯ (Ù†Ù‚Ø·Ø© Ø§Ù„Ø¨ÙŠØ¹)' : 'New Order (POS)', perm: { module: 'laundry', action: 'create' } },
        { path: '/app/laundry/orders', icon: ListOrdered, label: language === 'ar' ? 'Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù†Ø´Ø·Ø©' : 'Active Orders', perm: { module: 'laundry', action: 'read' } },
        { path: '/app/laundry/customers', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡' : 'Customers', perm: { module: 'laundry', action: 'read' } },
        { path: '/app/laundry/inventory', icon: Package, label: language === 'ar' ? 'Ù…Ø®Ø²ÙˆÙ† Ø§Ù„Ù…Ø³ØªÙ„Ø²Ù…Ø§Øª' : 'Supplies Inventory', perm: { module: 'laundry', action: 'read' } },
        { path: '/app/laundry/catalog', icon: Shirt, label: language === 'ar' ? 'Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ø®Ø¯Ù…Ø§Øª' : 'Service Catalog', perm: { module: 'laundry', action: 'read' } },
        { path: '/app/dashboard/laundry/delivery', icon: Navigation, label: language === 'ar' ? 'Ø§Ù„ØªÙˆØµÙŠÙ„ ÙˆØ§Ù„Ù…Ø³Ø§Ø±Ø§Øª' : 'Delivery & Routes', perm: { module: 'laundry', action: 'read' } },
      ]
    },


    {
      title: language === 'ar' ? 'ØªØ£Ø¬ÙŠØ± Ø§Ù„Ø³ÙŠØ§Ø±Ø§Øª' : 'Car Rental',
      businessTypes: ['car_rental'],
      items: [
        { path: '/app/rental/checkout', icon: PlusCircle, label: language === 'ar' ? 'ØªØ£Ø¬ÙŠØ± Ø¬Ø¯ÙŠØ¯' : 'New Rental', perm: { module: 'car_rental', action: 'create' } },
        { path: '/app/rental/active', icon: Car, label: language === 'ar' ? 'ØªØ£Ø¬ÙŠØ±Ø§Øª Ù†Ø´Ø·Ø©' : 'Active Rentals', perm: { module: 'car_rental', action: 'read' } },
        { path: '/app/rental/fleet', icon: Car, label: language === 'ar' ? 'Ø§Ù„Ø£Ø³Ø·ÙˆÙ„' : 'All Cars', perm: { module: 'car_rental', action: 'read' } },
        { path: '/app/rental/customers', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡' : 'Customer Registry', perm: { module: 'car_rental', action: 'read' } },
        { path: '/app/rental/contracts', icon: FileText, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù‚ÙˆØ¯' : 'All Contracts', perm: { module: 'car_rental', action: 'read' } },
        { path: '/app/dashboard/rental/maintenance', icon: Wrench, label: language === 'ar' ? 'Ø§Ù„ØµÙŠØ§Ù†Ø© ÙˆØ§Ù„Ø£Ø³Ø·ÙˆÙ„' : 'Maintenance & Fleet', perm: { module: 'car_rental', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ù…Ø±ÙƒØ² Ø§Ù„ØµÙŠØ§Ù†Ø©' : 'Car Workshop',
      businessTypes: ['car_workshop'],
      items: [
        { path: '/app/workshop', icon: Wrench, label: language === 'ar' ? 'ÙˆØ±Ø´Ø© Ø§Ù„Ø¹Ù…Ù„' : 'Workshop', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/workshop/job-cards', icon: ClipboardList, label: language === 'ar' ? 'Ø¨Ø·Ø§Ù‚Ø§Øª Ø§Ù„Ø¥ØµÙ„Ø§Ø­' : 'Job Cards', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/workshop/vehicles', icon: Car, label: language === 'ar' ? 'Ø§Ù„Ø³ÙŠØ§Ø±Ø§Øª' : 'Vehicles', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/workshop/inventory', icon: Package, label: language === 'ar' ? 'Ù‚Ø·Ø¹ Ø§Ù„ØºÙŠØ§Ø±' : 'Spare Parts', perm: { module: 'workshop', action: 'read' } },
        { path: '/app/dashboard/workshop/service-history', icon: History, label: language === 'ar' ? 'Ø³Ø¬Ù„ Ø§Ù„Ø®Ø¯Ù…Ø©' : 'Service History', perm: { module: 'workshop', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ù…Ø®Ø²ÙˆÙ†' : 'Inventory',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/products', icon: Package, label: t('products'), perm: { module: 'inventory', action: 'read' } },
        { path: '/app/dashboard/warehouses', icon: Warehouse, label: t('warehouses'), perm: { module: 'inventory', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ù…Ø§Ù„ÙŠØ©' : 'Finance',
      items: [
        { path: '/app/dashboard/finance', icon: Landmark, label: language === 'ar' ? 'Ø§Ù„Ù…Ø§Ù„ÙŠØ©' : 'Finance', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/vouchers', icon: Receipt, label: language === 'ar' ? 'Ø§Ù„Ø³Ù†Ø¯Ø§Øª' : 'Vouchers', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/expenses', icon: Receipt, label: language === 'ar' ? 'Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª' : 'Expenses', perm: { module: 'finance', action: 'read' } },
        { path: '/app/dashboard/vat-returns', icon: Calculator, label: language === 'ar' ? 'Ø¥Ù‚Ø±Ø§Ø±Ø§Øª Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ©' : 'VAT Returns', perm: { module: 'finance', action: 'read' } },
        ...(tenant?.zatca?.phase !== 1 ? [{ path: '/app/dashboard/finance/zatca-logs', icon: Shield, label: language === 'ar' ? 'Ø³Ø¬Ù„ Ø²Ø§ØªÙƒØ§' : 'ZATCA Logs', perm: { module: 'finance', action: 'read' } }] : []),
        { path: '/app/dashboard/reports', icon: BarChart3, label: language === 'ar' ? 'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±' : 'Reports', perm: { module: 'invoicing', action: 'read' } },
      ]
    },

    {
      title: language === 'ar' ? 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© ÙˆØ§Ù„Ø¹Ù…Ø§Ù„Ø©' : 'Manpower & Labor Supply',
      businessTypes: ['manpower'],
      items: [
        { path: '/app/dashboard/manpower/workers', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ø§Ù„Ø©' : 'Workers' },
        { path: '/app/dashboard/manpower/assignments', icon: Briefcase, label: language === 'ar' ? 'ØªØ¹ÙŠÙŠÙ†Ø§Øª Ø§Ù„Ø¹Ù…Ø§Ù„Ø©' : 'Assignments' },
        { path: '/app/dashboard/contracts', icon: FileSignature, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù‚ÙˆØ¯' : 'Contracts' },
        { path: '/app/dashboard/projects', icon: FolderKanban, label: language === 'ar' ? 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹' : 'Projects' },
        { path: '/app/dashboard/tasks', icon: ClipboardList, label: language === 'ar' ? 'Ø§Ù„Ù…Ù‡Ø§Ù…' : 'Tasks' },
        { path: '/app/dashboard/manpower/timesheets', icon: Clock, label: language === 'ar' ? 'Ø³Ø¬Ù„Ø§Øª Ø§Ù„ÙˆÙ‚Øª' : 'Timesheets', perm: { module: 'hr', action: 'read' } },
      ]
    },

    {
      title: language === 'ar' ? 'Ø§Ù„Ø³ÙØ±' : 'Travel',
      businessTypes: ['travel_agency'],
      items: [
        { path: '/app/dashboard/travel-bookings', icon: Plane, label: language === 'ar' ? 'Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª' : 'Bookings', perm: { module: 'travel', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©' : 'Human Resources',
      items: [
        { path: '/app/dashboard/employees', icon: Users, label: t('employees'), perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/attendance', icon: Fingerprint, label: language === 'ar' ? 'Ø§Ù„Ø­Ø¶ÙˆØ± ÙˆØ§Ù„Ø¨ÙŠÙˆÙ…ØªØ±ÙŠ' : 'Attendance & Biometrics', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/compliance', icon: ShieldCheck, label: language === 'ar' ? 'Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„ (Ø¨Ù„Ø¯ÙŠ ÙˆØ¥Ù‚Ø§Ù…Ø©)' : 'Compliance (Balady/Iqama)', perm: { module: 'hr', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/hr/hiring', icon: Briefcase, label: language === 'ar' ? 'Ø§Ù„ØªÙˆØ¸ÙŠÙ' : 'Hiring', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/leaves', icon: CalendarDays, label: language === 'ar' ? 'Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§Øª' : 'Leaves', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/performance', icon: Target, label: language === 'ar' ? 'Ø§Ù„Ø£Ø¯Ø§Ø¡' : 'Performance', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/payroll', icon: Wallet, label: t('payroll'), perm: { module: 'payroll', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/payroll/calculators', icon: Calculator, label: 'GOSI/EOSB', perm: { module: 'payroll', action: 'read' }, excludeBusinessTypes: ['bakala'] },
        { path: '/app/dashboard/hr/reports', icon: BarChart3, label: language === 'ar' ? 'ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©' : 'HR Reports', perm: { module: 'hr', action: 'read' } },
        { path: '/app/dashboard/hr/expense-claims', icon: Wallet, label: language === 'ar' ? 'Ù…Ø·Ø§Ù„Ø¨Ø§Øª Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª' : 'Expense Claims', perm: { module: 'hr', action: 'read' } },
      ]
    },

    {
      title: language === 'ar' ? 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ (CRM)' : 'CRM',
      items: [
        { path: '/app/dashboard/crm', icon: Target, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© CRM' : 'CRM Dashboard', end: true, perm: { module: 'crm', action: 'read' } },
        { path: '/app/dashboard/crm/leads', icon: Users, label: language === 'ar' ? 'Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø­ØªÙ…Ù„ÙˆÙ†' : 'Leads', perm: { module: 'crm', action: 'read' } },
        { path: '/app/dashboard/crm/deals', icon: BarChart3, label: language === 'ar' ? 'Ø§Ù„ØµÙÙ‚Ø§Øª' : 'Deals', perm: { module: 'crm', action: 'read' } },
        { path: '/app/dashboard/crm/activities', icon: ClipboardList, label: language === 'ar' ? 'Ø§Ù„Ø£Ù†Ø´Ø·Ø©' : 'Activities', perm: { module: 'crm', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„ØªÙˆØ§ØµÙ„' : 'Communication',
      items: [
        { path: '/app/dashboard/communicate', icon: MessageSquare, label: language === 'ar' ? 'Ø§Ù„Ø±Ø³Ø§Ø¦Ù„' : 'Communicate', perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/whatsapp', icon: MessageCircle, label: 'WhatsApp', perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/email', icon: Mail, label: language === 'ar' ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯' : 'Email', perm: { module: 'settings', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø¥Ù†ØªØ±Ù†Øª Ø§Ù„Ø£Ø´ÙŠØ§Ø¡' : 'Internet of Things',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/iot', icon: Cpu, label: language === 'ar' ? 'Ø¥Ù†ØªØ±Ù†Øª Ø§Ù„Ø£Ø´ÙŠØ§Ø¡' : 'IoT', perm: { module: 'iot', action: 'read' } },
      ]
    },

    {
      title: language === 'ar' ? 'Ø§Ù„ØªÙƒÙ„ÙØ© ÙˆØ§Ù„ØªØ®Ø·ÙŠØ·' : 'Costing & Planning',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/job-costing', icon: Briefcase, label: language === 'ar' ? 'ØªÙƒÙ„ÙØ© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„' : 'Job Costing', perm: { module: 'job_costing', action: 'read' } },
        { path: '/app/dashboard/mrp', icon: Factory, label: 'MRP', perm: { module: 'mrp', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª' : 'Settings',
      items: [
        { path: '/app/dashboard/users', icon: Users, label: t('users'), perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/backup', icon: Database, label: language === 'ar' ? 'Ø§Ù„Ù†Ø³Ø® Ø§Ù„Ø§Ø­ØªÙŠØ§Ø·ÙŠ' : 'Backup', perm: { module: 'settings', action: 'read' } },
        { path: '/app/dashboard/settings', icon: Settings, label: t('settings'), perm: { module: 'settings', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ø£Ø³Ø·ÙˆÙ„ ÙˆØ§Ù„Ù…Ø¹Ø¯Ø§Øª' : 'Fleet & Machinery',
      businessTypes: ['construction', 'trading'],
      items: [
        { path: '/app/dashboard/fleet', icon: Truck, label: language === 'ar' ? 'Ø§Ù„Ø£ØµÙˆÙ„' : 'Assets', perm: { module: 'fleet', action: 'read' } },
        { path: '/app/dashboard/fleet/maintenance-alerts', icon: AlertCircle, label: language === 'ar' ? 'ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„ØµÙŠØ§Ù†Ø©' : 'Maintenance Alerts', perm: { module: 'fleet', action: 'read' } },
      ]
    },

    {
      title: language === 'ar' ? 'Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ù…Ø±Ø³ÙŠØ©' : 'Landed Costs',
      businessTypes: ['trading'],
      items: [
        { path: '/app/dashboard/landed-costs', icon: Anchor, label: language === 'ar' ? 'Ø§Ù„ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ù…Ø±Ø³ÙŠØ©' : 'Landed Costs', perm: { module: 'landed_costs', action: 'read' } },
      ]
    },
    {
      title: language === 'ar' ? 'Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„' : 'Compliance',
      items: [
        { path: '/app/dashboard/compliance', icon: Shield, label: language === 'ar' ? 'Ù„ÙˆØ­Ø© Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„' : 'Compliance Dashboard' },
        { path: '/app/dashboard/saudi-compliance', icon: Globe, label: language === 'ar' ? 'Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„ Ø§Ù„ØªÙ†Ø¸ÙŠÙ…ÙŠ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠ' : 'Saudi Regulatory' },
        { path: '/app/dashboard/tenant-settings/government-integrations', icon: Key, label: language === 'ar' ? 'Ø§Ù„ØªÙƒØ§Ù…Ù„Ø§Øª Ø§Ù„Ø­ÙƒÙˆÙ…ÙŠØ©' : 'Gov Integrations', children: govChildren },
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
          <img src="/maqdernewlogo.webp" alt="Maqder" className="h-full w-auto object-contain scale-[2] origin-center" />
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
              {language === 'ar' ? 'ÙØ±Ø¹' : 'Branch'}
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
                          {item.path === '/app/dashboard/ecommerce/questions' && pendingQuestions > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{pendingQuestions}</span>
                          )}
                          {item.path === '/app/dashboard/ecommerce/reviews' && pendingReviews > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{pendingReviews}</span>
                          )}
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
              <span>{language === 'ar' ? 'Ø·ÙŠ Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©' : 'Collapse'}</span>
            </>
          )}
        </button>
        {!sidebarCollapsed && (
          <button
            onClick={() => dispatch(setHideSidebar(true))}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-1 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-xl transition-colors"
          >
            <PanelLeftClose className="w-4 h-4" />
            <span>{language === 'ar' ? 'Ø¥Ø®ÙØ§Ø¡ Ø§Ù„Ø´Ø±ÙŠØ·' : 'Hide sidebar'}</span>
          </button>
        )}
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

