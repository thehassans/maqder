import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '../components/ui/header-3'
import { HeroSection } from '../components/ui/hero-3'
import { motion } from 'framer-motion'
import {
  FileText,
  Users,
  Package,
  BarChart3,
  Shield,
  Zap,
  Globe,
  CheckCircle2,
  ArrowRight,
  Star,
  Building2,
  Receipt,
  Calculator,
  Truck,
  Warehouse,
  ClipboardList,
  MessageCircle,
  PieChart,
  Settings,
  Lock,
  Cloud,
  Smartphone,
  ChevronRight,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  Play,
  Sparkles,
  TrendingUp,
  CreditCard,
  UserCheck,
  CalendarDays,
  FileCheck,
  Boxes,
  Factory,
  Cpu,
  LineChart,
  BadgeCheck,
  Award,
  Headphones,
  Scissors,
  HardHat,
} from 'lucide-react'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const features = [
  {
    icon: FileText,
    title: 'ZATCA E-Invoicing',
    titleAr: 'Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©',
    description: 'Fully compliant with Saudi ZATCA Phase 2 requirements. Automatic QR code generation, XML signing, and real-time submission.',
    descriptionAr: 'Ù…ØªÙˆØ§ÙÙ‚ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ù…Ø¹ Ù…ØªØ·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ© Ù…Ù† Ù‡ÙŠØ¦Ø© Ø§Ù„Ø²ÙƒØ§Ø© ÙˆØ§Ù„Ø¶Ø±ÙŠØ¨Ø© ÙˆØ§Ù„Ø¬Ù…Ø§Ø±Ùƒ',
  },
  {
    icon: Users,
    title: 'HR & Payroll',
    titleAr: 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© ÙˆØ§Ù„Ø±ÙˆØ§ØªØ¨',
    description: 'Complete employee management with GOSI calculations, WPS file generation, leave tracking, and Iqama expiry alerts.',
    descriptionAr: 'Ø¥Ø¯Ø§Ø±Ø© ÙƒØ§Ù…Ù„Ø© Ù„Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ù…Ø¹ Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„ØªØ£Ù…ÙŠÙ†Ø§Øª ÙˆÙ…Ù„ÙØ§Øª Ø­Ù…Ø§ÙŠØ© Ø§Ù„Ø£Ø¬ÙˆØ±',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    titleAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø®Ø²ÙˆÙ†',
    description: 'Multi-warehouse support, stock tracking, automatic reorder points, and barcode scanning integration.',
    descriptionAr: 'Ø¯Ø¹Ù… Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ÙˆØªØªØ¨Ø¹ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙˆÙ†Ù‚Ø§Ø· Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ©',
  },
  {
    icon: Receipt,
    title: 'Expense Management',
    titleAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª',
    description: 'Track company expenses with approval workflows, categorization, and integration with financial reports.',
    descriptionAr: 'ØªØªØ¨Ø¹ Ù…ØµØ±ÙˆÙØ§Øª Ø§Ù„Ø´Ø±ÙƒØ© Ù…Ø¹ Ø³ÙŠØ± Ø¹Ù…Ù„ Ø§Ù„Ù…ÙˆØ§ÙÙ‚Ø§Øª ÙˆØ§Ù„ØªØµÙ†ÙŠÙ',
  },
  {
    icon: Truck,
    title: 'Purchase & Suppliers',
    titleAr: 'Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª ÙˆØ§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†',
    description: 'Manage suppliers, create purchase orders, track shipments, and automate procurement workflows.',
    descriptionAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ† ÙˆØ£ÙˆØ§Ù…Ø± Ø§Ù„Ø´Ø±Ø§Ø¡ ÙˆØªØªØ¨Ø¹ Ø§Ù„Ø´Ø­Ù†Ø§Øª',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    titleAr: 'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ù…Ø§Ù„ÙŠØ©',
    description: 'Comprehensive VAT returns, profit/loss statements, and real-time financial dashboards.',
    descriptionAr: 'Ø¥Ù‚Ø±Ø§Ø±Ø§Øª Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ© Ø§Ù„Ø´Ø§Ù…Ù„Ø© ÙˆÙ„ÙˆØ­Ø§Øª Ø§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…Ø§Ù„ÙŠØ©',
  },
  {
    icon: ClipboardList,
    title: 'Project Management',
    titleAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹',
    description: 'Create projects, assign tasks, track progress, and manage job costing with detailed breakdowns.',
    descriptionAr: 'Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØªØ¹ÙŠÙŠÙ† Ø§Ù„Ù…Ù‡Ø§Ù… ÙˆØªØªØ¨Ø¹ Ø§Ù„ØªÙ‚Ø¯Ù… ÙˆØ¥Ø¯Ø§Ø±Ø© ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¹Ù…Ù„',
  },
  {
    icon: Factory,
    title: 'MRP & Manufacturing',
    titleAr: 'ØªØ®Ø·ÙŠØ· Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„ØªØµÙ†ÙŠØ¹',
    description: 'Material Requirements Planning with BOM management, production orders, and capacity planning.',
    descriptionAr: 'ØªØ®Ø·ÙŠØ· Ù…ØªØ·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆØ§Ø¯ Ù…Ø¹ Ø¥Ø¯Ø§Ø±Ø© Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…ÙˆØ§Ø¯ ÙˆØ£ÙˆØ§Ù…Ø± Ø§Ù„Ø¥Ù†ØªØ§Ø¬',
  },
  {
    icon: Cpu,
    title: 'IoT Integration',
    titleAr: 'ØªÙƒØ§Ù…Ù„ Ø¥Ù†ØªØ±Ù†Øª Ø§Ù„Ø£Ø´ÙŠØ§Ø¡',
    description: 'Connect sensors and devices for real-time monitoring of temperature, humidity, and equipment status.',
    descriptionAr: 'Ø±Ø¨Ø· Ø£Ø¬Ù‡Ø²Ø© Ø§Ù„Ø§Ø³ØªØ´Ø¹Ø§Ø± Ù„Ù„Ù…Ø±Ø§Ù‚Ø¨Ø© ÙÙŠ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Business',
    titleAr: 'ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ù„Ø£Ø¹Ù…Ø§Ù„',
    description: 'Send invoices, payment reminders, and notifications directly to customers via WhatsApp.',
    descriptionAr: 'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„ÙÙˆØ§ØªÙŠØ± ÙˆØ§Ù„ØªØ°ÙƒÙŠØ±Ø§Øª ÙˆØ§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¹Ø¨Ø± ÙˆØ§ØªØ³Ø§Ø¨',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    titleAr: 'Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù„ØºØ§Øª',
    description: 'Full Arabic and English support with RTL layout. Switch languages instantly across the entire system.',
    descriptionAr: 'Ø¯Ø¹Ù… ÙƒØ§Ù…Ù„ Ù„Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ù…Ø¹ ØªØ®Ø·ÙŠØ· RTL',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    titleAr: 'Ø£Ù…Ø§Ù† Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª',
    description: 'Role-based access control, audit logs, two-factor authentication, and encrypted data storage.',
    descriptionAr: 'Ø§Ù„ØªØ­ÙƒÙ… ÙÙŠ Ø§Ù„ÙˆØµÙˆÙ„ ÙˆØ§Ù„Ø³Ø¬Ù„Ø§Øª ÙˆØ§Ù„Ù…ØµØ§Ø¯Ù‚Ø© Ø§Ù„Ø«Ù†Ø§Ø¦ÙŠØ©',
  },
]

const stats = [
  { value: '99.9%', label: 'Uptime', labelAr: 'ÙˆÙ‚Øª Ø§Ù„ØªØ´ØºÙŠÙ„' },
  { value: '50K+', label: 'Invoices/Day', labelAr: 'ÙØ§ØªÙˆØ±Ø© ÙŠÙˆÙ…ÙŠØ§Ù‹' },
  { value: '500+', label: 'Companies', labelAr: 'Ø´Ø±ÙƒØ©' },
  { value: '24/7', label: 'Support', labelAr: 'Ø¯Ø¹Ù… ÙÙ†ÙŠ' },
]

const modules = [
  { icon: FileText, name: 'E-Invoicing', nameAr: 'Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©', color: 'from-emerald-500 to-teal-600' },
  { icon: Users, name: 'HR Management', nameAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©', color: 'from-blue-500 to-indigo-600' },
  { icon: Calculator, name: 'Payroll & GOSI', nameAr: 'Ø§Ù„Ø±ÙˆØ§ØªØ¨ ÙˆØ§Ù„ØªØ£Ù…ÙŠÙ†Ø§Øª', color: 'from-purple-500 to-violet-600' },
  { icon: Package, name: 'Inventory', nameAr: 'Ø§Ù„Ù…Ø®Ø²ÙˆÙ†', color: 'from-orange-500 to-amber-600' },
  { icon: Warehouse, name: 'Warehouses', nameAr: 'Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª', color: 'from-cyan-500 to-sky-600' },
  { icon: Truck, name: 'Procurement', nameAr: 'Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª', color: 'from-rose-500 to-pink-600' },
  { icon: Receipt, name: 'Expenses', nameAr: 'Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª', color: 'from-red-500 to-rose-600' },
  { icon: ClipboardList, name: 'Projects', nameAr: 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹', color: 'from-lime-500 to-green-600' },
  { icon: Factory, name: 'Manufacturing', nameAr: 'Ø§Ù„ØªØµÙ†ÙŠØ¹', color: 'from-slate-500 to-gray-600' },
  { icon: LineChart, name: 'Reports', nameAr: 'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±', color: 'from-fuchsia-500 to-purple-600' },
  { icon: UserCheck, name: 'Contacts', nameAr: 'Ø¬Ù‡Ø§Øª Ø§Ù„Ø§ØªØµØ§Ù„', color: 'from-teal-500 to-emerald-600' },
  { icon: Settings, name: 'Settings', nameAr: 'Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª', color: 'from-gray-500 to-slate-600' },
]

const testimonials = [
  {
    name: 'Ahmed Al-Rashid',
    nameAr: 'Ø£Ø­Ù…Ø¯ Ø§Ù„Ø±Ø§Ø´Ø¯',
    role: 'CFO, Tech Solutions',
    roleAr: 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø§Ù„ÙŠØŒ Ø­Ù„ÙˆÙ„ Ø§Ù„ØªÙ‚Ù†ÙŠØ©',
    content: 'Maqder ERP transformed our invoicing process. ZATCA compliance is now automatic and hassle-free.',
    contentAr: 'Ø­ÙˆÙ‘Ù„ Maqder ERP Ø¹Ù…Ù„ÙŠØ© Ø§Ù„ÙÙˆØªØ±Ø© Ù„Ø¯ÙŠÙ†Ø§. Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„ Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø²ÙƒØ§Ø© Ø£ØµØ¨Ø­ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ ÙˆØ³Ù‡Ù„Ø§Ù‹.',
    rating: 5,
  },
  {
    name: 'Sara Mohammed',
    nameAr: 'Ø³Ø§Ø±Ø© Ù…Ø­Ù…Ø¯',
    role: 'HR Director, Retail Group',
    roleAr: 'Ù…Ø¯ÙŠØ±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©ØŒ Ù…Ø¬Ù…ÙˆØ¹Ø© Ø§Ù„ØªØ¬Ø²Ø¦Ø©',
    content: 'The HR module with GOSI calculations saved us countless hours. Payroll is now processed in minutes.',
    contentAr: 'ÙˆØ­Ø¯Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ© Ù…Ø¹ Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„ØªØ£Ù…ÙŠÙ†Ø§Øª ÙˆÙØ±Øª Ø¹Ù„ÙŠÙ†Ø§ Ø³Ø§Ø¹Ø§Øª Ù„Ø§ ØªØ­ØµÙ‰.',
    rating: 5,
  },
  {
    name: 'Khalid Hassan',
    nameAr: 'Ø®Ø§Ù„Ø¯ Ø­Ø³Ù†',
    role: 'Operations Manager',
    roleAr: 'Ù…Ø¯ÙŠØ± Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª',
    content: 'Multi-warehouse inventory tracking with real-time updates. Exactly what we needed for our growth.',
    contentAr: 'ØªØªØ¨Ø¹ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª Ù…Ø¹ Ø§Ù„ØªØ­Ø¯ÙŠØ«Ø§Øª Ø§Ù„ÙÙˆØ±ÙŠØ©. Ø¨Ø§Ù„Ø¶Ø¨Ø· Ù…Ø§ Ù†Ø­ØªØ§Ø¬Ù‡ Ù„Ù†Ù…ÙˆÙ†Ø§.',
    rating: 5,
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    nameAr: 'Ø§Ù„Ø¨Ø¯Ø§ÙŠØ©',
    price: '299',
    period: '/month',
    periodAr: '/Ø´Ù‡Ø±',
    features: [
      'Up to 500 invoices/month',
      'ZATCA Phase 2 Compliance',
      '5 Users',
      'Basic Reports',
      'Email Support',
    ],
    featuresAr: [
      'Ø­ØªÙ‰ 500 ÙØ§ØªÙˆØ±Ø©/Ø´Ù‡Ø±',
      'Ø§Ù…ØªØ«Ø§Ù„ Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ©',
      '5 Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†',
      'ØªÙ‚Ø§Ø±ÙŠØ± Ø£Ø³Ø§Ø³ÙŠØ©',
      'Ø¯Ø¹Ù… Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    nameAr: 'Ø§Ù„Ø§Ø­ØªØ±Ø§ÙÙŠØ©',
    price: '699',
    period: '/month',
    periodAr: '/Ø´Ù‡Ø±',
    features: [
      'Unlimited Invoices',
      'Full ERP Modules',
      '25 Users',
      'Advanced Analytics',
      'Priority Support',
      'API Access',
    ],
    featuresAr: [
      'ÙÙˆØ§ØªÙŠØ± ØºÙŠØ± Ù…Ø­Ø¯ÙˆØ¯Ø©',
      'Ø¬Ù…ÙŠØ¹ ÙˆØ­Ø¯Ø§Øª ERP',
      '25 Ù…Ø³ØªØ®Ø¯Ù…',
      'ØªØ­Ù„ÙŠÙ„Ø§Øª Ù…ØªÙ‚Ø¯Ù…Ø©',
      'Ø¯Ø¹Ù… Ø°Ùˆ Ø£ÙˆÙ„ÙˆÙŠØ©',
      'ÙˆØµÙˆÙ„ API',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    nameAr: 'Ø§Ù„Ù…Ø¤Ø³Ø³Ø§Øª',
    price: 'Custom',
    priceAr: 'Ù…Ø®ØµØµ',
    period: '',
    periodAr: '',
    features: [
      'Everything in Professional',
      'Unlimited Users',
      'Dedicated Server',
      'Custom Integrations',
      '24/7 Phone Support',
      'On-site Training',
    ],
    featuresAr: [
      'ÙƒÙ„ Ù…Ø§ ÙÙŠ Ø§Ù„Ø§Ø­ØªØ±Ø§ÙÙŠØ©',
      'Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ† ØºÙŠØ± Ù…Ø­Ø¯ÙˆØ¯ÙˆÙ†',
      'Ø®Ø§Ø¯Ù… Ù…Ø®ØµØµ',
      'ØªÙƒØ§Ù…Ù„Ø§Øª Ù…Ø®ØµØµØ©',
      'Ø¯Ø¹Ù… Ù‡Ø§ØªÙÙŠ 24/7',
      'ØªØ¯Ø±ÙŠØ¨ ÙÙŠ Ø§Ù„Ù…ÙˆÙ‚Ø¹',
    ],
    popular: false,
  },
]

const complianceLogos = [
  { src: '/ZATCA_Logo.svg', alt: 'ZATCA', imageClassName: 'scale-[1.35]' },
  { src: '/saudi-vision-2030-logo.webp', alt: 'Saudi Vision 2030', imageClassName: 'scale-100' },
]

const solutionsData = [
  {
    title: 'Trading & Supply Chain',
    titleAr: 'Ø§Ù„ØªØ¬Ø§Ø±Ø© ÙˆØ³Ù„Ø§Ø³Ù„ Ø§Ù„Ø¥Ù…Ø¯Ø§Ø¯',
    icon: Building2,
    image: '/images/solutions/trading.webp',
    color: 'from-blue-500 to-indigo-600',
    description: 'Complete wholesale, retail, and advanced inventory tracking.',
    descriptionAr: 'ØªØªØ¨Ø¹ Ø´Ø§Ù…Ù„ Ù„ØªØ¬Ø§Ø±Ø© Ø§Ù„Ø¬Ù…Ù„Ø© ÙˆØ§Ù„ØªØ¬Ø²Ø¦Ø© ÙˆØ§Ù„Ù…Ø®Ø²ÙˆÙ† Ø§Ù„Ù…ØªÙ‚Ø¯Ù….',
    longDescription: 'Optimize your entire supply chain with multi-warehouse tracking, automated reorder points, comprehensive supplier management, and seamless ZATCA e-invoicing for B2B and B2C transactions.',
    longDescriptionAr: 'Ù‚Ù… Ø¨ØªØ­Ø³ÙŠÙ† Ø³Ù„Ø³Ù„Ø© Ø§Ù„ØªÙˆØ±ÙŠØ¯ Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ Ø¨Ø§Ù„ÙƒØ§Ù…Ù„ Ù…Ø¹ ØªØªØ¨Ø¹ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª Ø§Ù„Ù…ØªØ¹Ø¯Ø¯Ø© ÙˆÙ†Ù‚Ø§Ø· Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø·Ù„Ø¨ Ø§Ù„Ø¢Ù„ÙŠØ© ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ† Ø§Ù„Ø´Ø§Ù…Ù„Ø© ÙˆØ§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© Ø§Ù„Ø³Ù„Ø³Ø© Ù„Ù…Ø¹Ø§Ù…Ù„Ø§Øª B2B Ùˆ B2C.',
    features: ['Multi-warehouse inventory', 'Automated purchase orders', 'Real-time stock valuation', 'ZATCA B2B & B2C invoicing'],
    featuresAr: ['Ù…Ø®Ø²ÙˆÙ† Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª', 'Ø£ÙˆØ§Ù…Ø± Ø´Ø±Ø§Ø¡ Ù…Ø¤ØªÙ…ØªØ©', 'ØªÙ‚ÙŠÙŠÙ… Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙÙŠ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ', 'ÙÙˆØ§ØªÙŠØ± ZATCA B2B Ùˆ B2C'],
    email: 'trading@test.com'
  },
  {
    title: 'Construction & Contracting',
    titleAr: 'Ø§Ù„Ù…Ù‚Ø§ÙˆÙ„Ø§Øª ÙˆØ§Ù„Ø¨Ù†Ø§Ø¡',
    icon: HardHat,
    image: '/images/solutions/construction.webp',
    color: 'from-orange-500 to-red-600',
    description: 'Project management, job costing, and fleet tracking.',
    descriptionAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ­Ø³Ø§Ø¨ ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª ÙˆØªØªØ¨Ø¹ Ø§Ù„Ø£Ø³Ø·ÙˆÙ„.',
    longDescription: 'Take control of your construction projects with precise job costing, material requisitions, fleet and machinery maintenance tracking, and detailed project profitability reports.',
    longDescriptionAr: 'ØªØ­ÙƒÙ… ÙÙŠ Ù…Ø´Ø§Ø±ÙŠØ¹ Ø§Ù„Ø¨Ù†Ø§Ø¡ Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ Ù…Ù† Ø®Ù„Ø§Ù„ Ø­Ø³Ø§Ø¨ Ø¯Ù‚ÙŠÙ‚ Ù„ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¹Ù…Ù„ØŒ ÙˆØ·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆØ§Ø¯ØŒ ÙˆØªØªØ¨Ø¹ ØµÙŠØ§Ù†Ø© Ø§Ù„Ø£Ø³Ø·ÙˆÙ„ ÙˆØ§Ù„Ø¢Ù„Ø§ØªØŒ ÙˆØªÙ‚Ø§Ø±ÙŠØ± Ø±Ø¨Ø­ÙŠØ© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹ Ø§Ù„Ù…ÙØµÙ„Ø©.',
    features: ['Detailed Job Costing', 'Project Management & Tasks', 'Heavy Machinery Fleet Tracking', 'Subcontractor Invoicing'],
    featuresAr: ['Ø­Ø³Ø§Ø¨ Ù…ÙØµÙ„ Ù„ØªÙƒØ§Ù„ÙŠÙ Ø§Ù„Ø¹Ù…Ù„', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ§Ù„Ù…Ù‡Ø§Ù…', 'ØªØªØ¨Ø¹ Ø£Ø³Ø·ÙˆÙ„ Ø§Ù„Ø¢Ù„ÙŠØ§Øª Ø§Ù„Ø«Ù‚ÙŠÙ„Ø©', 'ÙÙˆØ§ØªÙŠØ± Ø§Ù„Ù…Ù‚Ø§ÙˆÙ„ÙŠÙ† Ù…Ù† Ø§Ù„Ø¨Ø§Ø·Ù†'],
    email: 'construction@test.com'
  },
  {
    title: 'Travel & Tourism',
    titleAr: 'Ø§Ù„Ø³ÙŠØ§Ø­Ø© ÙˆØ§Ù„Ø³ÙØ±',
    icon: Globe,
    image: '/images/solutions/travel.webp',
    color: 'from-sky-500 to-cyan-600',
    description: 'Flight bookings, margin scheme taxation, and itineraries.',
    descriptionAr: 'Ø­Ø¬ÙˆØ²Ø§Øª Ø§Ù„Ø·ÙŠØ±Ø§Ù† ÙˆÙ†Ø¸Ø§Ù… Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‡Ø§Ù…Ø´ ÙˆØ§Ù„Ù…Ø³Ø§Ø±Ø§Øª.',
    longDescription: 'Tailored for travel agencies, our system supports complex Margin Scheme VAT calculations, passenger tracking, flight ticket logs, and comprehensive booking profitability analysis.',
    longDescriptionAr: 'Ù…ØµÙ…Ù… Ø®ØµÙŠØµØ§Ù‹ Ù„ÙˆÙƒØ§Ù„Ø§Øª Ø§Ù„Ø³ÙØ±ØŒ ÙŠØ¯Ø¹Ù… Ù†Ø¸Ø§Ù…Ù†Ø§ Ø­Ø³Ø§Ø¨Ø§Øª Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ© Ø§Ù„Ù…Ø¹Ù‚Ø¯Ø© (Ù†Ø¸Ø§Ù… Ø§Ù„Ù‡Ø§Ù…Ø´)ØŒ ÙˆØªØªØ¨Ø¹ Ø§Ù„Ø±ÙƒØ§Ø¨ØŒ ÙˆØ³Ø¬Ù„Ø§Øª ØªØ°Ø§ÙƒØ± Ø§Ù„Ø·ÙŠØ±Ø§Ù†ØŒ ÙˆØ§Ù„ØªØ­Ù„ÙŠÙ„ Ø§Ù„Ø´Ø§Ù…Ù„ Ù„Ø±Ø¨Ø­ÙŠØ© Ø§Ù„Ø­Ø¬ÙˆØ²Ø§Øª.',
    features: ['Margin Scheme VAT (ZATCA)', 'Flight & Hotel Booking Logs', 'Passenger Manifests', 'Supplier Payment Tracking'],
    featuresAr: ['Ø¶Ø±ÙŠØ¨Ø© Ø§Ù„Ù‚ÙŠÙ…Ø© Ø§Ù„Ù…Ø¶Ø§ÙØ© Ø¨Ù†Ø¸Ø§Ù… Ø§Ù„Ù‡Ø§Ù…Ø´', 'Ø³Ø¬Ù„Ø§Øª Ø­Ø¬ÙˆØ²Ø§Øª Ø§Ù„Ø·ÙŠØ±Ø§Ù† ÙˆØ§Ù„ÙÙ†Ø§Ø¯Ù‚', 'Ù‚ÙˆØ§Ø¦Ù… Ø§Ù„Ø±ÙƒØ§Ø¨', 'ØªØªØ¨Ø¹ Ù…Ø¯ÙÙˆØ¹Ø§Øª Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ†'],
    email: 'travel@test.com'
  },
  {
    title: 'Restaurant & Cafe',
    titleAr: 'Ø§Ù„Ù…Ø·Ø§Ø¹Ù… ÙˆØ§Ù„Ù…Ù‚Ø§Ù‡ÙŠ',
    icon: PieChart,
    image: '/images/solutions/restaurant.webp',
    color: 'from-amber-500 to-orange-500',
    description: 'Table management, kitchen displays, and smart POS.',
    descriptionAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø·Ø§ÙˆÙ„Ø§Øª ÙˆØ´Ø§Ø´Ø§Øª Ø§Ù„Ù…Ø·Ø¨Ø® ÙˆÙ†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹ Ø§Ù„Ø°ÙƒÙŠØ©.',
    longDescription: 'A lightning-fast, touch-friendly POS integrated with a Kitchen Display System (KDS). Manage table reservations, recipe ingredients, shift cash registers, and deliver exceptional dining experiences.',
    longDescriptionAr: 'Ù†Ø¸Ø§Ù… Ù†Ù‚Ø§Ø· Ø¨ÙŠØ¹ ÙØ§Ø¦Ù‚ Ø§Ù„Ø³Ø±Ø¹Ø© ÙˆØ³Ù‡Ù„ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø¨Ø§Ù„Ù„Ù…Ø³ ÙˆÙ…ØªÙƒØ§Ù…Ù„ Ù…Ø¹ Ø´Ø§Ø´Ø© Ø§Ù„Ù…Ø·Ø¨Ø® (KDS). Ù‚Ù… Ø¨Ø¥Ø¯Ø§Ø±Ø© Ø­Ø¬ÙˆØ²Ø§Øª Ø§Ù„Ø·Ø§ÙˆÙ„Ø§Øª ÙˆÙ…ÙƒÙˆÙ†Ø§Øª Ø§Ù„ÙˆØµÙØ§Øª ÙˆØ³Ø¬Ù„Ø§Øª Ø§Ù„Ù†Ù‚Ø¯ Ù„Ù„ÙˆØ±Ø¯ÙŠØ§Øª.',
    features: ['Touch-friendly Smart POS', 'Kitchen Display System (KDS)', 'Table & Area Management', 'Recipe & Ingredient Tracking'],
    featuresAr: ['Ù†Ø¸Ø§Ù… Ù†Ù‚Ø§Ø· Ø¨ÙŠØ¹ Ø°ÙƒÙŠ Ø¨Ø§Ù„Ù„Ù…Ø³', 'Ù†Ø¸Ø§Ù… Ø¹Ø±Ø¶ Ø§Ù„Ù…Ø·Ø¨Ø® (KDS)', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø·Ø§ÙˆÙ„Ø§Øª ÙˆØ§Ù„Ù…Ù†Ø§Ø·Ù‚', 'ØªØªØ¨Ø¹ Ø§Ù„ÙˆØµÙØ§Øª ÙˆØ§Ù„Ù…ÙƒÙˆÙ†Ø§Øª'],
    email: 'restaurant@test.com'
  },
  {
    title: 'Car Rental',
    titleAr: 'ØªØ£Ø¬ÙŠØ± Ø§Ù„Ø³ÙŠØ§Ø±Ø§Øª',
    icon: Truck,
    image: '/images/solutions/car-rental.webp',
    color: 'from-rose-500 to-red-600',
    description: 'Vehicle tracking, rental contracts, and maintenance logs.',
    descriptionAr: 'ØªØªØ¨Ø¹ Ø§Ù„Ù…Ø±ÙƒØ¨Ø§Øª ÙˆØ¹Ù‚ÙˆØ¯ Ø§Ù„ØªØ£Ø¬ÙŠØ± ÙˆØ³Ø¬Ù„Ø§Øª Ø§Ù„ØµÙŠØ§Ù†Ø©.',
    longDescription: 'Manage your rental fleet with ease. Create dynamic rental agreements, track vehicle availability, monitor maintenance schedules, and automatically calculate late return fees.',
    longDescriptionAr: 'Ø¥Ø¯Ø§Ø±Ø© Ø£Ø³Ø·ÙˆÙ„ Ø§Ù„ØªØ£Ø¬ÙŠØ± Ø§Ù„Ø®Ø§Øµ Ø¨Ùƒ Ø¨Ø³Ù‡ÙˆÙ„Ø©. Ø¥Ù†Ø´Ø§Ø¡ Ø§ØªÙØ§Ù‚ÙŠØ§Øª ØªØ£Ø¬ÙŠØ± Ø¯ÙŠÙ†Ø§Ù…ÙŠÙƒÙŠØ©ØŒ ÙˆØªØªØ¨Ø¹ ØªÙˆÙØ± Ø§Ù„Ù…Ø±ÙƒØ¨Ø§ØªØŒ ÙˆÙ…Ø±Ø§Ù‚Ø¨Ø© Ø¬Ø¯Ø§ÙˆÙ„ Ø§Ù„ØµÙŠØ§Ù†Ø©ØŒ ÙˆØ­Ø³Ø§Ø¨ Ø±Ø³ÙˆÙ… Ø§Ù„ØªØ£Ø®ÙŠØ± ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹.',
    features: ['Dynamic Rental Contracts', 'Fleet Availability Calendar', 'Damage Check-in/Check-out', 'Automated Late Fees'],
    featuresAr: ['Ø¹Ù‚ÙˆØ¯ ØªØ£Ø¬ÙŠØ± Ø¯ÙŠÙ†Ø§Ù…ÙŠÙƒÙŠØ©', 'ØªÙ‚ÙˆÙŠÙ… ØªÙˆÙØ± Ø§Ù„Ø£Ø³Ø·ÙˆÙ„', 'ÙØ­Øµ Ø§Ù„Ø£Ø¶Ø±Ø§Ø± Ø¹Ù†Ø¯ Ø§Ù„ØªØ³Ù„ÙŠÙ… ÙˆØ§Ù„Ø§Ø³ØªÙ„Ø§Ù…', 'Ø±Ø³ÙˆÙ… Ø§Ù„ØªØ£Ø®ÙŠØ± Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ©'],
    email: 'rental@test.com'
  },
  {
    title: 'Laundry Services',
    titleAr: 'Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…ØºØ§Ø³Ù„',
    icon: Sparkles,
    image: '/images/solutions/laundry.webp',
    color: 'from-emerald-500 to-teal-600',
    description: 'Garment tracking, weight billing, and touch POS.',
    descriptionAr: 'ØªØªØ¨Ø¹ Ø§Ù„Ù…Ù„Ø§Ø¨Ø³ ÙˆØ§Ù„ÙÙˆØ§ØªÙŠØ± Ø¨Ø§Ù„ÙˆØ²Ù† ÙˆÙ†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹ Ø¨Ø§Ù„Ù„Ù…Ø³.',
    longDescription: 'Streamline your laundry operations with precise garment tracking, automated weight-based billing, express service surcharges, and integrated WhatsApp notifications when clothes are ready.',
    longDescriptionAr: 'ØªØ¨Ø³ÙŠØ· Ø¹Ù…Ù„ÙŠØ§Øª Ø§Ù„Ù…ØºØ³Ù„Ø© Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ Ù…Ø¹ Ø§Ù„ØªØªØ¨Ø¹ Ø§Ù„Ø¯Ù‚ÙŠÙ‚ Ù„Ù„Ù…Ù„Ø§Ø¨Ø³ØŒ ÙˆØ§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¢Ù„ÙŠØ© Ø¹Ù„Ù‰ Ø£Ø³Ø§Ø³ Ø§Ù„ÙˆØ²Ù†ØŒ ÙˆØ±Ø³ÙˆÙ… Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø³Ø±ÙŠØ¹Ø©ØŒ ÙˆØ¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ø§Ù„Ù…ØªÙƒØ§Ù…Ù„Ø© Ø¹Ù†Ø¯Ù…Ø§ ØªÙƒÙˆÙ† Ø§Ù„Ù…Ù„Ø§Ø¨Ø³ Ø¬Ø§Ù‡Ø²Ø©.',
    features: ['Garment Tracking Tags', 'Weight-based Billing', 'Express Service Management', 'WhatsApp Ready Alerts'],
    featuresAr: ['Ø¹Ù„Ø§Ù…Ø§Øª ØªØªØ¨Ø¹ Ø§Ù„Ù…Ù„Ø§Ø¨Ø³', 'Ø§Ù„ÙÙˆØªØ±Ø© Ø¨Ù†Ø§Ø¡Ù‹ Ø¹Ù„Ù‰ Ø§Ù„ÙˆØ²Ù†', 'Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø®Ø¯Ù…Ø© Ø§Ù„Ø³Ø±ÙŠØ¹Ø©', 'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„ÙˆØ§ØªØ³Ø§Ø¨ Ù„Ù„Ø¬Ø§Ù‡Ø²ÙŠØ©'],
    email: 'laundry@test.com'
  },
  {
    title: 'Saloon & Barber Shop',
    titleAr: 'ØµØ§Ù„ÙˆÙ†Ø§Øª Ø§Ù„Ø­Ù„Ø§Ù‚Ø© ÙˆØ§Ù„ØªØ¬Ù…ÙŠÙ„',
    icon: Scissors,
    image: '/images/solutions/saloon.webp',
    color: 'from-purple-500 to-fuchsia-600',
    description: 'Appointments scheduling, staff commissions, and service POS.',
    descriptionAr: 'Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ ÙˆØ¹Ù…ÙˆÙ„Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† ÙˆÙ†Ù‚Ø§Ø· Ø¨ÙŠØ¹ Ø§Ù„Ø®Ø¯Ù…Ø§Øª.',
    longDescription: 'Elevate your grooming business with sleek appointment scheduling, automated staff commission calculations, premium service catalogs, and customer loyalty tracking.',
    longDescriptionAr: 'Ø§Ø±ØªÙ‚ Ø¨Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„ØµØ§Ù„ÙˆÙ† Ø§Ù„Ø®Ø§ØµØ© Ø¨Ùƒ Ù…Ø¹ Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯ Ø§Ù„Ø£Ù†ÙŠÙ‚Ø©ØŒ ÙˆØ­Ø³Ø§Ø¨Ø§Øª Ø¹Ù…ÙˆÙ„Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ† Ø§Ù„Ø¢Ù„ÙŠØ©ØŒ ÙˆÙ‚ÙˆØ§Ø¦Ù… Ø§Ù„Ø®Ø¯Ù…Ø§Øª Ø§Ù„Ù…ØªÙ…ÙŠØ²Ø©ØŒ ÙˆØªØªØ¨Ø¹ ÙˆÙ„Ø§Ø¡ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡.',
    features: ['Staff Commission Tracking', 'Appointment Scheduling', 'Service Variations POS', 'Customer Loyalty'],
    featuresAr: ['ØªØªØ¨Ø¹ Ø¹Ù…ÙˆÙ„Ø§Øª Ø§Ù„Ù…ÙˆØ¸ÙÙŠÙ†', 'Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„Ù…ÙˆØ§Ø¹ÙŠØ¯', 'Ù†Ø¸Ø§Ù… Ù†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹ Ù„Ù„Ø®Ø¯Ù…Ø§Øª', 'ÙˆÙ„Ø§Ø¡ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡'],
    email: 'saloon@test.com'
  },
  {
    title: 'Supermarket & Bakala',
    titleAr: 'Ø§Ù„Ø³ÙˆØ¨Ø±Ù…Ø§Ø±ÙƒØª ÙˆØ§Ù„Ø¨Ù‚Ø§Ù„Ø©',
    icon: Package,
    image: '/images/solutions/trading.webp',
    color: 'from-green-500 to-emerald-600',
    description: 'Fast barcode scanning, scale integration, and inventory.',
    descriptionAr: 'Ù…Ø³Ø­ Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ Ø§Ù„Ø³Ø±ÙŠØ¹ØŒ ØªÙƒØ§Ù…Ù„ Ø§Ù„Ù…ÙŠØ²Ø§Ù†ØŒ ÙˆØ§Ù„Ù…Ø®Ø²ÙˆÙ†.',
    longDescription: 'A highly efficient POS system tailored for supermarkets and local Bakalas. Seamlessly integrated with barcode scanners, weighing scales, and real-time inventory tracking to keep your shelves stocked.',
    longDescriptionAr: 'Ù†Ø¸Ø§Ù… Ù†Ù‚Ø§Ø· Ø¨ÙŠØ¹ Ø¹Ø§Ù„ÙŠ Ø§Ù„ÙƒÙØ§Ø¡Ø© Ù…ØµÙ…Ù… Ø®ØµÙŠØµØ§Ù‹ Ù„Ù„Ø³ÙˆØ¨Ø±Ù…Ø§Ø±ÙƒØª ÙˆØ§Ù„Ø¨Ù‚Ø§Ù„Ø§Øª Ø§Ù„Ù…Ø­Ù„ÙŠØ©. Ù…ØªÙƒØ§Ù…Ù„ Ø¨Ø³Ù„Ø§Ø³Ø© Ù…Ø¹ Ù…Ø§Ø³Ø­Ø§Øª Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ ÙˆÙ…ÙˆØ§Ø²ÙŠÙ† Ø§Ù„ÙˆØ²Ù† ÙˆØªØªØ¨Ø¹ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙÙŠ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„ÙØ¹Ù„ÙŠ.',
    features: ['Barcode Scanner & Scale Ready', 'Fast Checkout POS', 'Expiry Date Tracking', 'Supplier Direct Orders'],
    featuresAr: ['Ù…ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ù…Ø§Ø³Ø­ Ø§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ ÙˆØ§Ù„Ù…ÙŠØ²Ø§Ù†', 'Ù†Ù‚Ø§Ø· Ø¨ÙŠØ¹ Ø³Ø±ÙŠØ¹Ø© Ø§Ù„Ø¯ÙØ¹', 'ØªØªØ¨Ø¹ ØªØ§Ø±ÙŠØ® Ø§Ù„ØµÙ„Ø§Ø­ÙŠØ©', 'Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…ÙˆØ±Ø¯ÙŠÙ† Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©'],
    email: 'bakala@test.com'
  }
]

export default function Landing() {
  const [language, setLanguage] = useState('en')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedSolution, setSelectedSolution] = useState(null)
  const isArabic = language === 'ar'

  return (
    <div className={`flex w-full flex-col min-h-screen bg-white ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Header isArabic={isArabic} setIsArabic={setIsArabic} />
      <main className="grow">
        <HeroSection isArabic={isArabic} />
      </main>
      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-primary-100 font-medium">{isArabic ? stat.labelAr : stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {isArabic ? 'ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ Ù„Ø¥Ø¯Ø§Ø±Ø© Ø£Ø¹Ù…Ø§Ù„Ùƒ' : 'Everything You Need to Run Your Business'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isArabic
                ? 'Ù…Ù†ØµØ© Ù…ØªÙƒØ§Ù…Ù„Ø© ØªØ¬Ù…Ø¹ Ø¬Ù…ÙŠØ¹ Ø£Ø¯ÙˆØ§Øª Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯'
                : 'A unified platform that brings all your business management tools together'}
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {isArabic ? feature.titleAr : feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {isArabic ? feature.descriptionAr : feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modules" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {isArabic ? 'ÙˆØ­Ø¯Ø§Øª Ø§Ù„Ù†Ø¸Ø§Ù…' : 'System Modules'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isArabic
                ? 'Ø§Ø®ØªØ± Ø§Ù„ÙˆØ­Ø¯Ø§Øª Ø§Ù„ØªÙŠ ØªÙ†Ø§Ø³Ø¨ Ø§Ø­ØªÙŠØ§Ø¬Ø§Øª Ø¹Ù…Ù„Ùƒ'
                : 'Choose the modules that fit your business needs'}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {modules.map((module, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer"
              >
                <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 text-center">
                  <div
                    className={`w-14 h-14 mx-auto bg-gradient-to-br ${module.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <module.icon className="w-7 h-7 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {isArabic ? module.nameAr : module.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ZATCA Compliance Section */}
      <section className="py-24 bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-96 h-96 bg-primary-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full text-emerald-400 font-medium text-sm mb-6">
                <Shield className="w-4 h-4" />
                {isArabic ? 'Ø§Ù…ØªØ«Ø§Ù„ ÙƒØ§Ù…Ù„' : 'Full Compliance'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                {isArabic
                  ? 'Ù…Ø²ÙˆØ¯ Ø®Ø¯Ù…Ø§Øª Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© - Ù…ØªÙˆØ§ÙÙ‚ 100% Ù…Ø¹ Ù…ØªØ·Ù„Ø¨Ø§Øª ZATCA'
                  : 'Provision of E-Invoicing Services - 100% ZATCA Phase 2 Compliant'}
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {isArabic
                  ? 'ØªÙ‚Ø¯ÙŠÙ… Ø®Ø¯Ù…Ø§Øª Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© Ù…Ø¹ ÙÙˆØ§ØªÙŠØ± Ù…ÙˆÙ‚Ø¹Ø© Ø±Ù‚Ù…ÙŠØ§Ù‹ ÙˆØ±Ù…ÙˆØ² QR ÙˆØªÙƒØ§Ù…Ù„ Ù…Ø¨Ø§Ø´Ø± Ù…Ø¹ Ø¨ÙˆØ§Ø¨Ø© ZATCA'
                  : 'Providing E-Invoicing Services with digitally signed e-invoices, QR codes, and direct ZATCA gateway integration'}
              </p>
              <ul className="space-y-4">
                {[
                  { en: 'Automatic XML generation & signing', ar: 'Ø¥Ù†Ø´Ø§Ø¡ ÙˆØªÙˆÙ‚ÙŠØ¹ XML ØªÙ„Ù‚Ø§Ø¦ÙŠ' },
                  { en: 'Real-time ZATCA submission', ar: 'Ø¥Ø±Ø³Ø§Ù„ ÙÙˆØ±ÙŠ Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø²ÙƒØ§Ø©' },
                  { en: 'QR code with all required fields', ar: 'Ø±Ù…Ø² QR Ù…Ø¹ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ„ Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©' },
                  { en: 'Credit notes & debit notes', ar: 'Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¯Ø§Ø¦Ù†Ø© ÙˆÙ…Ø¯ÙŠÙ†Ø©' },
                  { en: 'B2B and B2C invoices', ar: 'ÙÙˆØ§ØªÙŠØ± Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ ÙˆØ§Ù„Ù…Ø³ØªÙ‡Ù„ÙƒÙŠÙ†' },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-200">{isArabic ? item.ar : item.en}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center">
                    <FileCheck className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{isArabic ? 'Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©' : 'Invoice Number'}</p>
                    <p className="text-white font-bold text-xl">INV-2024-000123</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400">{isArabic ? 'Ø§Ù„Ù…Ø¨Ù„Øº' : 'Amount'}</span>
                    <span className="text-white font-semibold">SAR 5,750.00</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400">{isArabic ? 'Ø§Ù„Ø¶Ø±ÙŠØ¨Ø©' : 'VAT (15%)'}</span>
                    <span className="text-white font-semibold">SAR 862.50</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-400">{isArabic ? 'Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ' : 'Total'}</span>
                    <span className="text-emerald-400 font-bold text-xl">SAR 6,612.50</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3 p-3 bg-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 text-sm font-medium">
                    {isArabic ? 'ØªÙ… Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ ÙˆØ§Ù„Ø§Ø¹ØªÙ…Ø§Ø¯ Ù…Ù† ZATCA' : 'Submitted & Approved by ZATCA'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solutions Showcase Section */}
      <section id="solutions" className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary-900/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-t from-emerald-900/30 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full font-medium text-sm mb-6 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
              <Sparkles className="w-4 h-4 text-primary-400" />
              {isArabic ? 'Ø­Ù„ÙˆÙ„ Ù…ØµÙ…Ù…Ø© Ù„Ù†Ø´Ø§Ø·Ùƒ' : 'Tailored Solutions'}
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 tracking-tight">
              {isArabic ? 'ØµÙ†Ø§Ø¹ØªÙƒØŒ Ø¨Ø·Ø±ÙŠÙ‚ØªÙ†Ø§' : 'Your Industry, Our Expertise'}
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              {isArabic
                ? 'Ø§Ø®ØªØ± Ù†ÙˆØ¹ Ù†Ø´Ø§Ø·Ùƒ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ ÙˆØ§Ø³ØªÙƒØ´Ù ÙƒÙŠÙ ÙŠØ³Ù‡Ù„ Ù†Ø¸Ø§Ù… Ù…Ù‚Ø¯Ø± Ø¥Ø¯Ø§Ø±Ø© Ø¹Ù…Ù„ÙŠØ§ØªÙƒ Ø§Ù„ÙŠÙˆÙ…ÙŠØ© Ø¨Ø£Ù†Ø§Ù‚Ø© ÙˆÙØ¹Ø§Ù„ÙŠØ©.'
                : 'Select your business type and explore how Maqder streamlines your daily operations with elegance and efficiency.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutionsData.map((solution, index) => (
              <motion.div
                key={index}
                onClick={() => setSelectedSolution(solution)}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative h-[420px] rounded-3xl overflow-hidden shadow-2xl bg-gray-800 cursor-pointer"
              >
                {/* Background Image inside a Mac Window to look like live tenant panel */}
                <div className="absolute inset-0 p-4 transition-transform duration-700 group-hover:scale-[1.02]">
                  <div className="w-full h-full bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700 relative">
                    {/* Mac Window Header */}
                    <div className="h-6 bg-gray-800 border-b border-gray-700 flex items-center px-3 gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                      <div className="mx-auto text-[10px] text-gray-500 font-mono tracking-wider">maqder.com/app</div>
                    </div>
                    {/* Panel Screen */}
                    <img 
                      src={solution.image} 
                      alt={solution.title} 
                      loading="lazy"
                      className="w-full h-[calc(100%-1.5rem)] object-cover object-top opacity-50 group-hover:opacity-90 transition-opacity duration-500 filter blur-[1px] group-hover:blur-none"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent transition-opacity duration-500 group-hover:opacity-95" />
                </div>
                
                {/* Content Container */}
                <div className="relative h-full flex flex-col justify-end p-8 z-10">
                  <div className={`w-14 h-14 bg-gradient-to-br ${solution.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-black/30 backdrop-blur-md border border-white/20 transform transition-transform duration-500 group-hover:-translate-y-2`}>
                    <solution.icon className="w-7 h-7 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 transform transition-all duration-500 group-hover:-translate-y-2">
                    {isArabic ? solution.titleAr : solution.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-6 font-light leading-relaxed opacity-0 translate-y-4 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0 h-0 group-hover:h-auto overflow-hidden">
                    {isArabic ? solution.descriptionAr : solution.description}
                  </p>
                  
                  <div className="inline-flex items-center justify-between w-full p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-lg text-white font-medium transition-all duration-300 transform group-hover:-translate-y-1">
                    <span>{isArabic ? 'Ø¹Ø±Ø¶ Ø§Ù„ØªÙØ§ØµÙŠÙ„' : 'View Details'}</span>
                    <ArrowRight className={`w-5 h-5 ${isArabic ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Detail Modal */}
      <AnimatePresence>
        {selectedSolution && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir={isArabic ? 'rtl' : 'ltr'}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSolution(null)}
              className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl overflow-hidden custom-scrollbar"
            >
              <button 
                onClick={() => setSelectedSolution(null)}
                className={`absolute top-4 ${isArabic ? 'left-4' : 'right-4'} z-10 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors`}
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="relative h-72 sm:h-96 w-full bg-gray-900 p-4 sm:p-8 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                  <img src={selectedSolution.image} loading="lazy" className="w-full h-full object-cover opacity-20 blur-sm" alt={selectedSolution.title} />
                  <div className={`absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent`} />
                </div>

                {/* Live Display Mac Window */}
                <div className="relative z-10 w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden transform transition-transform hover:scale-105 duration-700">
                  <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="mx-auto flex items-center gap-2 px-4 py-1 bg-gray-900 rounded-md text-xs text-gray-400 font-mono">
                      <Lock className="w-3 h-3 text-emerald-500" />
                      maqder.com/app/tenant
                    </div>
                  </div>
                  <div className="relative w-full h-48 sm:h-64 overflow-hidden group">
                    <img 
                      src={selectedSolution.image} 
                      loading="lazy"
                      className="w-full h-auto object-cover object-top transition-transform duration-[3000ms] ease-linear group-hover:-translate-y-[20%]" 
                      alt={selectedSolution.title} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-8 relative">
                <div className="absolute -top-12 left-8 right-8 flex justify-between items-end">
                  <div className={`w-20 h-20 bg-gradient-to-br ${selectedSolution.color} rounded-2xl flex items-center justify-center shadow-2xl shadow-black/50 border-4 border-white`}>
                    <selectedSolution.icon className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                    {isArabic ? selectedSolution.titleAr : selectedSolution.title}
                  </h2>
                </div>
                <p className="text-xl text-gray-700 leading-relaxed mb-10 font-light">
                  {isArabic ? selectedSolution.longDescriptionAr : selectedSolution.longDescription}
                </p>

                <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-sm">
                  {isArabic ? 'Ø§Ù„Ù…Ù…ÙŠØ²Ø§Øª Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠØ©' : 'Key Features'}
                </h3>
                
                <div className="grid sm:grid-cols-2 gap-4 mb-10">
                  {(isArabic ? selectedSolution.featuresAr : selectedSolution.features).map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-gray-700 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                  <Link
                    to={`/login?demoEmail=${encodeURIComponent(selectedSolution.email)}&demoPassword=password123&autoLogin=true`}
                    state={{ email: selectedSolution.email, password: 'password123' }}
                    className={`flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-xl text-white font-semibold shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-0.5 bg-gradient-to-r ${selectedSolution.color}`}
                  >
                    <Play className="w-5 h-5 fill-current" />
                    <span>{isArabic ? 'Ø¥Ø·Ù„Ø§Ù‚ Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©' : 'Launch Live Demo'}</span>
                  </Link>
                  <a
                    href="#contact"
                    onClick={() => setSelectedSolution(null)}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-4 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition-colors"
                  >
                    <Headphones className="w-5 h-5" />
                    <span>{isArabic ? 'ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª' : 'Contact Sales'}</span>
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Testimonials */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {isArabic ? 'Ù…Ø§Ø°Ø§ ÙŠÙ‚ÙˆÙ„ Ø¹Ù…Ù„Ø§Ø¤Ù†Ø§' : 'What Our Customers Say'}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  "{isArabic ? testimonial.contentAr : testimonial.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                    {(isArabic ? testimonial.nameAr : testimonial.name).charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isArabic ? testimonial.nameAr : testimonial.name}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {isArabic ? testimonial.roleAr : testimonial.role}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {isArabic ? 'Ø®Ø·Ø· Ø§Ù„Ø£Ø³Ø¹Ø§Ø±' : 'Pricing Plans'}
            </h2>
            <p className="text-xl text-gray-600">
              {isArabic ? 'Ø§Ø®ØªØ± Ø§Ù„Ø®Ø·Ø© Ø§Ù„Ù…Ù†Ø§Ø³Ø¨Ø© Ù„Ø­Ø¬Ù… Ø£Ø¹Ù…Ø§Ù„Ùƒ' : 'Choose the plan that fits your business size'}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-3xl p-8 ${
                  plan.popular
                    ? 'border-2 border-primary-500 shadow-xl shadow-primary-500/20'
                    : 'border border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-semibold rounded-full">
                    {isArabic ? 'Ø§Ù„Ø£ÙƒØ«Ø± Ø´ÙŠÙˆØ¹Ø§Ù‹' : 'Most Popular'}
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isArabic ? plan.nameAr : plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 'Custom' ? (isArabic ? plan.priceAr : plan.price) : `SAR ${plan.price}`}
                  </span>
                  <span className="text-gray-500">{isArabic ? plan.periodAr : plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8">
                  {(isArabic ? plan.featuresAr : plan.features).map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-600 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-xl font-semibold transition ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isArabic ? 'Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù†' : 'Get Started'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                {isArabic ? 'ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§' : 'Get in Touch'}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {isArabic
                  ? 'ÙØ±ÙŠÙ‚Ù†Ø§ Ø¬Ø§Ù‡Ø² Ù„Ù…Ø³Ø§Ø¹Ø¯ØªÙƒ ÙÙŠ Ø§Ù„Ø¨Ø¯Ø¡ Ù…Ø¹ Maqder ERP'
                  : 'Our team is ready to help you get started with Maqder ERP'}
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{isArabic ? 'Ø§Ù„Ù‡Ø§ØªÙ / ÙˆØ§ØªØ³Ø§Ø¨' : 'Phone / WhatsApp'}</p>
                    <a href="https://wa.me/966596775485" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-gray-900 font-semibold hover:text-emerald-600 transition">
                      <span dir="ltr">+966 59 677 5485</span>
                      <MessageCircle className="w-4 h-4 text-emerald-500" />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{isArabic ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email'}</p>
                    <a href="mailto:support@maqder.com" className="text-gray-900 font-semibold hover:text-primary-600 transition">support@maqder.com</a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{isArabic ? 'Ø§Ù„Ù…ÙˆÙ‚Ø¹' : 'Location'}</p>
                    <p className="text-gray-900 font-semibold">{isArabic ? 'Ø§Ù„Ø±ÙŠØ§Ø¶ØŒ Ø§Ù„Ù…Ù…Ù„ÙƒØ© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©' : 'Riyadh, Saudi Arabia'}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isArabic ? 'Ø§Ù„Ø§Ø³Ù…' : 'Name'}
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                        placeholder={isArabic ? 'Ø£Ø¯Ø®Ù„ Ø§Ø³Ù…Ùƒ' : 'Enter your name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isArabic ? 'Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Email'}
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                        placeholder={isArabic ? 'Ø£Ø¯Ø®Ù„ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ' : 'Enter your email'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isArabic ? 'Ø§Ù„Ø´Ø±ÙƒØ©' : 'Company'}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                      placeholder={isArabic ? 'Ø§Ø³Ù… Ø§Ù„Ø´Ø±ÙƒØ©' : 'Company name'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isArabic ? 'Ø§Ù„Ø±Ø³Ø§Ù„Ø©' : 'Message'}
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition resize-none"
                      placeholder={isArabic ? 'Ø§ÙƒØªØ¨ Ø±Ø³Ø§Ù„ØªÙƒ Ù‡Ù†Ø§...' : 'Write your message here...'}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition"
                  >
                    {isArabic ? 'Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø±Ø³Ø§Ù„Ø©' : 'Send Message'}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              {isArabic ? 'Ø§Ø¨Ø¯Ø£ Ø±Ø­Ù„ØªÙƒ Ù…Ø¹ Maqder ERP Ø§Ù„ÙŠÙˆÙ…' : 'Start Your Journey with Maqder ERP Today'}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {isArabic
                ? 'Ø§Ù†Ø¶Ù… Ø¥Ù„Ù‰ Ø£ÙƒØ«Ø± Ù…Ù† 500 Ø´Ø±ÙƒØ© Ø³Ø¹ÙˆØ¯ÙŠØ© ØªØ«Ù‚ ÙÙŠ Maqder ERP'
                : 'Join 500+ Saudi companies that trust Maqder ERP'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
              >
                {isArabic ? 'Ø§Ø¨Ø¯Ø£ Ù…Ø¬Ø§Ù†Ø§Ù‹' : 'Start Free Trial'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition border border-white/20"
              >
                <Headphones className="w-5 h-5" />
                {isArabic ? 'ØªØ­Ø¯Ø« Ù…Ø¹ Ø§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª' : 'Talk to Sales'}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-auto h-10 flex items-center justify-center">
                  <img src="/maqdernewlogo.webp" alt="Maqder" className="h-full w-auto object-contain" />
                </div>
              </div>
              <p className="text-gray-500 leading-relaxed">
                {isArabic
                  ? 'Ù…Ø²ÙˆØ¯ Ø®Ø¯Ù…Ø§Øª Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ© ÙˆÙ†Ø¸Ø§Ù… ERP Ù…ØªÙƒØ§Ù…Ù„ Ù„Ù„Ø´Ø±ÙƒØ§Øª Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© Ù…Ø¹ Ø§Ù…ØªØ«Ø§Ù„ ÙƒØ§Ù…Ù„ Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø²ÙƒØ§Ø© ÙˆØ§Ù„Ø¶Ø±ÙŠØ¨Ø© ÙˆØ§Ù„Ø¬Ù…Ø§Ø±Ùƒ'
                  : 'E-Invoicing Services Provider and complete ERP system for Saudi businesses with full ZATCA compliance'}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{isArabic ? 'Ø§Ù„Ù…Ù†ØªØ¬' : 'Product'}</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition">{isArabic ? 'Ø§Ù„Ù…Ù…ÙŠØ²Ø§Øª' : 'Features'}</a></li>
                <li><a href="#modules" className="hover:text-white transition">{isArabic ? 'Ø§Ù„ÙˆØ­Ø¯Ø§Øª' : 'Modules'}</a></li>
                <li><a href="#pricing" className="hover:text-white transition">{isArabic ? 'Ø§Ù„Ø£Ø³Ø¹Ø§Ø±' : 'Pricing'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{isArabic ? 'Ø§Ù„Ø´Ø±ÙƒØ©' : 'Company'}</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition">{isArabic ? 'Ù…Ù† Ù†Ø­Ù†' : 'About Us'}</a></li>
                <li><a href="#contact" className="hover:text-white transition">{isArabic ? 'ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§' : 'Contact'}</a></li>
                <li><a href="#" className="hover:text-white transition">{isArabic ? 'Ø§Ù„ÙˆØ¸Ø§Ø¦Ù' : 'Careers'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{isArabic ? 'Ù‚Ø§Ù†ÙˆÙ†ÙŠ' : 'Legal'}</h4>
              <ul className="space-y-3">
                <li><a href="/privacy" className="hover:text-white transition">{isArabic ? 'Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©' : 'Privacy Policy'}</a></li>
                <li><a href="/terms" className="hover:text-white transition">{isArabic ? 'Ø´Ø±ÙˆØ· Ø§Ù„Ø®Ø¯Ù…Ø©' : 'Terms of Service'}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              Â© 2024 Maqder ERP. {isArabic ? 'Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ù‚ÙˆÙ‚ Ù…Ø­ÙÙˆØ¸Ø©.' : 'All rights reserved.'}
            </p>
            <div className="flex flex-col gap-1">
              <p className="text-gray-500 text-sm">
                {isArabic ? 'ØµÙ†Ø¹ Ø¨ÙˆØ§Ø³Ø·Ø© Ù…Ø¤Ø³Ø³Ø© Ø­Ù„ÙˆÙ„ Ø§Ù„Ù‚ÙˆÙ‰ Ø§Ù„Ø¹Ø§Ù…Ù„Ø© Ø§Ù„Ø´Ø±Ù‚ÙŠØ©' : 'Built by Eastern Workforce Solutions Establishment'}
              </p>
              <p className="text-gray-500 text-sm opacity-70">
                {isArabic ? 'Eastern Workforce Solutions Establishment' : 'Ù…Ø¤Ø³Ø³Ø© Ø­Ù„ÙˆÙ„ Ø§Ù„Ù‚ÙˆÙ‰ Ø§Ù„Ø¹Ø§Ù…Ù„Ø© Ø§Ù„Ø´Ø±Ù‚ÙŠØ©'}
              </p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/966596775485" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-500/30 hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center"
        aria-label="Contact on WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  )
}
