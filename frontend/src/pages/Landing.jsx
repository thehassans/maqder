import { useState } from 'react'
import { Link } from 'react-router-dom'
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
    titleAr: 'الفوترة الإلكترونية',
    description: 'Fully compliant with Saudi ZATCA Phase 2 requirements. Automatic QR code generation, XML signing, and real-time submission.',
    descriptionAr: 'متوافق بالكامل مع متطلبات المرحلة الثانية من هيئة الزكاة والضريبة والجمارك',
  },
  {
    icon: Users,
    title: 'HR & Payroll',
    titleAr: 'الموارد البشرية والرواتب',
    description: 'Complete employee management with GOSI calculations, WPS file generation, leave tracking, and Iqama expiry alerts.',
    descriptionAr: 'إدارة كاملة للموظفين مع حسابات التأمينات وملفات حماية الأجور',
  },
  {
    icon: Package,
    title: 'Inventory Management',
    titleAr: 'إدارة المخزون',
    description: 'Multi-warehouse support, stock tracking, automatic reorder points, and barcode scanning integration.',
    descriptionAr: 'دعم متعدد المستودعات وتتبع المخزون ونقاط إعادة الطلب التلقائية',
  },
  {
    icon: Receipt,
    title: 'Expense Management',
    titleAr: 'إدارة المصروفات',
    description: 'Track company expenses with approval workflows, categorization, and integration with financial reports.',
    descriptionAr: 'تتبع مصروفات الشركة مع سير عمل الموافقات والتصنيف',
  },
  {
    icon: Truck,
    title: 'Purchase & Suppliers',
    titleAr: 'المشتريات والموردين',
    description: 'Manage suppliers, create purchase orders, track shipments, and automate procurement workflows.',
    descriptionAr: 'إدارة الموردين وأوامر الشراء وتتبع الشحنات',
  },
  {
    icon: BarChart3,
    title: 'Financial Reports',
    titleAr: 'التقارير المالية',
    description: 'Comprehensive VAT returns, profit/loss statements, and real-time financial dashboards.',
    descriptionAr: 'إقرارات ضريبة القيمة المضافة الشاملة ولوحات المعلومات المالية',
  },
  {
    icon: ClipboardList,
    title: 'Project Management',
    titleAr: 'إدارة المشاريع',
    description: 'Create projects, assign tasks, track progress, and manage job costing with detailed breakdowns.',
    descriptionAr: 'إنشاء المشاريع وتعيين المهام وتتبع التقدم وإدارة تكاليف العمل',
  },
  {
    icon: Factory,
    title: 'MRP & Manufacturing',
    titleAr: 'تخطيط موارد التصنيع',
    description: 'Material Requirements Planning with BOM management, production orders, and capacity planning.',
    descriptionAr: 'تخطيط متطلبات المواد مع إدارة قائمة المواد وأوامر الإنتاج',
  },
  {
    icon: Cpu,
    title: 'IoT Integration',
    titleAr: 'تكامل إنترنت الأشياء',
    description: 'Connect sensors and devices for real-time monitoring of temperature, humidity, and equipment status.',
    descriptionAr: 'ربط أجهزة الاستشعار للمراقبة في الوقت الفعلي',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Business',
    titleAr: 'واتساب للأعمال',
    description: 'Send invoices, payment reminders, and notifications directly to customers via WhatsApp.',
    descriptionAr: 'إرسال الفواتير والتذكيرات والإشعارات عبر واتساب',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    titleAr: 'متعدد اللغات',
    description: 'Full Arabic and English support with RTL layout. Switch languages instantly across the entire system.',
    descriptionAr: 'دعم كامل للعربية والإنجليزية مع تخطيط RTL',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    titleAr: 'أمان المؤسسات',
    description: 'Role-based access control, audit logs, two-factor authentication, and encrypted data storage.',
    descriptionAr: 'التحكم في الوصول والسجلات والمصادقة الثنائية',
  },
]

const stats = [
  { value: '99.9%', label: 'Uptime', labelAr: 'وقت التشغيل' },
  { value: '50K+', label: 'Invoices/Day', labelAr: 'فاتورة يومياً' },
  { value: '500+', label: 'Companies', labelAr: 'شركة' },
  { value: '24/7', label: 'Support', labelAr: 'دعم فني' },
]

const modules = [
  { icon: FileText, name: 'E-Invoicing', nameAr: 'الفوترة الإلكترونية', color: 'from-emerald-500 to-teal-600' },
  { icon: Users, name: 'HR Management', nameAr: 'إدارة الموارد البشرية', color: 'from-blue-500 to-indigo-600' },
  { icon: Calculator, name: 'Payroll & GOSI', nameAr: 'الرواتب والتأمينات', color: 'from-purple-500 to-violet-600' },
  { icon: Package, name: 'Inventory', nameAr: 'المخزون', color: 'from-orange-500 to-amber-600' },
  { icon: Warehouse, name: 'Warehouses', nameAr: 'المستودعات', color: 'from-cyan-500 to-sky-600' },
  { icon: Truck, name: 'Procurement', nameAr: 'المشتريات', color: 'from-rose-500 to-pink-600' },
  { icon: Receipt, name: 'Expenses', nameAr: 'المصروفات', color: 'from-red-500 to-rose-600' },
  { icon: ClipboardList, name: 'Projects', nameAr: 'المشاريع', color: 'from-lime-500 to-green-600' },
  { icon: Factory, name: 'Manufacturing', nameAr: 'التصنيع', color: 'from-slate-500 to-gray-600' },
  { icon: LineChart, name: 'Reports', nameAr: 'التقارير', color: 'from-fuchsia-500 to-purple-600' },
  { icon: UserCheck, name: 'Contacts', nameAr: 'جهات الاتصال', color: 'from-teal-500 to-emerald-600' },
  { icon: Settings, name: 'Settings', nameAr: 'الإعدادات', color: 'from-gray-500 to-slate-600' },
]

const testimonials = [
  {
    name: 'Ahmed Al-Rashid',
    nameAr: 'أحمد الراشد',
    role: 'CFO, Tech Solutions',
    roleAr: 'المدير المالي، حلول التقنية',
    content: 'Maqder ERP transformed our invoicing process. ZATCA compliance is now automatic and hassle-free.',
    contentAr: 'حوّل Maqder ERP عملية الفوترة لدينا. الامتثال لهيئة الزكاة أصبح تلقائياً وسهلاً.',
    rating: 5,
  },
  {
    name: 'Sara Mohammed',
    nameAr: 'سارة محمد',
    role: 'HR Director, Retail Group',
    roleAr: 'مديرة الموارد البشرية، مجموعة التجزئة',
    content: 'The HR module with GOSI calculations saved us countless hours. Payroll is now processed in minutes.',
    contentAr: 'وحدة الموارد البشرية مع حسابات التأمينات وفرت علينا ساعات لا تحصى.',
    rating: 5,
  },
  {
    name: 'Khalid Hassan',
    nameAr: 'خالد حسن',
    role: 'Operations Manager',
    roleAr: 'مدير العمليات',
    content: 'Multi-warehouse inventory tracking with real-time updates. Exactly what we needed for our growth.',
    contentAr: 'تتبع المخزون متعدد المستودعات مع التحديثات الفورية. بالضبط ما نحتاجه لنمونا.',
    rating: 5,
  },
]

const pricingPlans = [
  {
    name: 'Starter',
    nameAr: 'البداية',
    price: '299',
    period: '/month',
    periodAr: '/شهر',
    features: [
      'Up to 500 invoices/month',
      'ZATCA Phase 2 Compliance',
      '5 Users',
      'Basic Reports',
      'Email Support',
    ],
    featuresAr: [
      'حتى 500 فاتورة/شهر',
      'امتثال المرحلة الثانية',
      '5 مستخدمين',
      'تقارير أساسية',
      'دعم البريد الإلكتروني',
    ],
    popular: false,
  },
  {
    name: 'Professional',
    nameAr: 'الاحترافية',
    price: '699',
    period: '/month',
    periodAr: '/شهر',
    features: [
      'Unlimited Invoices',
      'Full ERP Modules',
      '25 Users',
      'Advanced Analytics',
      'Priority Support',
      'API Access',
    ],
    featuresAr: [
      'فواتير غير محدودة',
      'جميع وحدات ERP',
      '25 مستخدم',
      'تحليلات متقدمة',
      'دعم ذو أولوية',
      'وصول API',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    nameAr: 'المؤسسات',
    price: 'Custom',
    priceAr: 'مخصص',
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
      'كل ما في الاحترافية',
      'مستخدمون غير محدودون',
      'خادم مخصص',
      'تكاملات مخصصة',
      'دعم هاتفي 24/7',
      'تدريب في الموقع',
    ],
    popular: false,
  },
]

export default function Landing() {
  const [language, setLanguage] = useState('en')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const isArabic = language === 'ar'

  return (
    <div className={`min-h-screen bg-white ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Maqder ERP
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition font-medium">
                {isArabic ? 'المميزات' : 'Features'}
              </a>
              <a href="#modules" className="text-gray-600 hover:text-primary-600 transition font-medium">
                {isArabic ? 'الوحدات' : 'Modules'}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-primary-600 transition font-medium">
                {isArabic ? 'الأسعار' : 'Pricing'}
              </a>
              <a href="#contact" className="text-gray-600 hover:text-primary-600 transition font-medium">
                {isArabic ? 'تواصل معنا' : 'Contact'}
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLanguage(isArabic ? 'en' : 'ar')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition flex items-center gap-1.5"
              >
                <Globe className="w-4 h-4" />
                {isArabic ? 'English' : 'العربية'}
              </button>
              <Link
                to="/login"
                className="hidden sm:inline-flex px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5"
              >
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3"
          >
            <a href="#features" className="block py-2 text-gray-600 font-medium">
              {isArabic ? 'المميزات' : 'Features'}
            </a>
            <a href="#modules" className="block py-2 text-gray-600 font-medium">
              {isArabic ? 'الوحدات' : 'Modules'}
            </a>
            <a href="#pricing" className="block py-2 text-gray-600 font-medium">
              {isArabic ? 'الأسعار' : 'Pricing'}
            </a>
            <Link to="/login" className="block w-full text-center py-2.5 bg-primary-600 text-white rounded-xl font-semibold">
              {isArabic ? 'تسجيل الدخول' : 'Login'}
            </Link>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 font-medium text-sm mb-6">
                <Sparkles className="w-4 h-4" />
                {isArabic ? 'متوافق مع هيئة الزكاة والضريبة والجمارك' : 'ZATCA Phase 2 Compliant'}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {isArabic ? (
                  <>
                    نظام ERP متكامل
                    <span className="bg-gradient-to-r from-primary-600 to-emerald-600 bg-clip-text text-transparent"> للسعودية</span>
                  </>
                ) : (
                  <>
                    Complete ERP System
                    <span className="bg-gradient-to-r from-primary-600 to-emerald-600 bg-clip-text text-transparent"> for Saudi</span>
                  </>
                )}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {isArabic
                  ? 'الفوترة الإلكترونية، الموارد البشرية، الرواتب، المخزون، المشتريات، وأكثر - كل ما تحتاجه لإدارة أعمالك في منصة واحدة متكاملة.'
                  : 'E-Invoicing, HR, Payroll, Inventory, Procurement, and more — everything you need to run your business in one integrated platform.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5"
                >
                  {isArabic ? 'ابدأ الآن' : 'Get Started'}
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold text-lg hover:bg-gray-200 transition"
                >
                  <Play className="w-5 h-5" />
                  {isArabic ? 'شاهد العرض' : 'Watch Demo'}
                </a>
              </div>

              {/* Trust Badges */}
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-gray-500">
                  <BadgeCheck className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium">{isArabic ? 'معتمد من ZATCA' : 'ZATCA Certified'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Lock className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium">{isArabic ? 'بيانات مشفرة' : 'Encrypted Data'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <Cloud className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium">{isArabic ? 'سحابي 100%' : '100% Cloud'}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-2 shadow-2xl">
                  <div className="bg-gray-800 rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/50">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="ml-2 text-gray-400 text-sm">maqder.com/dashboard</span>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Mock Dashboard */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-4">
                          <TrendingUp className="w-6 h-6 text-white/80 mb-2" />
                          <p className="text-white/70 text-xs">Revenue</p>
                          <p className="text-white font-bold text-lg">SAR 125K</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-4">
                          <FileText className="w-6 h-6 text-white/80 mb-2" />
                          <p className="text-white/70 text-xs">Invoices</p>
                          <p className="text-white font-bold text-lg">248</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl p-4">
                          <Users className="w-6 h-6 text-white/80 mb-2" />
                          <p className="text-white/70 text-xs">Employees</p>
                          <p className="text-white font-bold text-lg">32</p>
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-300 text-sm font-medium">Revenue vs Expenses</span>
                          <span className="text-emerald-400 text-xs">+12.5%</span>
                        </div>
                        <div className="flex items-end gap-1 h-20">
                          {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col gap-1">
                              <div className="bg-emerald-500/80 rounded-t" style={{ height: `${h}%` }} />
                              <div className="bg-rose-500/60 rounded-b" style={{ height: `${h * 0.4}%` }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Background Decorations */}
              <div className="absolute -top-10 -right-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

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
              {isArabic ? 'كل ما تحتاجه لإدارة أعمالك' : 'Everything You Need to Run Your Business'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isArabic
                ? 'منصة متكاملة تجمع جميع أدوات إدارة الأعمال في مكان واحد'
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
              {isArabic ? 'وحدات النظام' : 'System Modules'}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isArabic
                ? 'اختر الوحدات التي تناسب احتياجات عملك'
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
                {isArabic ? 'امتثال كامل' : 'Full Compliance'}
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                {isArabic
                  ? 'متوافق 100% مع متطلبات هيئة الزكاة والضريبة والجمارك'
                  : '100% ZATCA Phase 2 Compliant'}
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {isArabic
                  ? 'فواتير إلكترونية موقعة رقمياً مع رموز QR وتكامل مباشر مع بوابة ZATCA'
                  : 'Digitally signed e-invoices with QR codes and direct integration with ZATCA gateway'}
              </p>
              <ul className="space-y-4">
                {[
                  { en: 'Automatic XML generation & signing', ar: 'إنشاء وتوقيع XML تلقائي' },
                  { en: 'Real-time ZATCA submission', ar: 'إرسال فوري لهيئة الزكاة' },
                  { en: 'QR code with all required fields', ar: 'رمز QR مع جميع الحقول المطلوبة' },
                  { en: 'Credit notes & debit notes', ar: 'إشعارات دائنة ومدينة' },
                  { en: 'B2B and B2C invoices', ar: 'فواتير الأعمال والمستهلكين' },
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
                    <p className="text-gray-400 text-sm">{isArabic ? 'رقم الفاتورة' : 'Invoice Number'}</p>
                    <p className="text-white font-bold text-xl">INV-2024-000123</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400">{isArabic ? 'المبلغ' : 'Amount'}</span>
                    <span className="text-white font-semibold">SAR 5,750.00</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-white/10">
                    <span className="text-gray-400">{isArabic ? 'الضريبة' : 'VAT (15%)'}</span>
                    <span className="text-white font-semibold">SAR 862.50</span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-gray-400">{isArabic ? 'الإجمالي' : 'Total'}</span>
                    <span className="text-emerald-400 font-bold text-xl">SAR 6,612.50</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3 p-3 bg-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-emerald-300 text-sm font-medium">
                    {isArabic ? 'تم الإرسال والاعتماد من ZATCA' : 'Submitted & Approved by ZATCA'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

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
              {isArabic ? 'ماذا يقول عملاؤنا' : 'What Our Customers Say'}
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
              {isArabic ? 'خطط الأسعار' : 'Pricing Plans'}
            </h2>
            <p className="text-xl text-gray-600">
              {isArabic ? 'اختر الخطة المناسبة لحجم أعمالك' : 'Choose the plan that fits your business size'}
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
                    {isArabic ? 'الأكثر شيوعاً' : 'Most Popular'}
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
                  {isArabic ? 'ابدأ الآن' : 'Get Started'}
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
                {isArabic ? 'تواصل معنا' : 'Get in Touch'}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {isArabic
                  ? 'فريقنا جاهز لمساعدتك في البدء مع Maqder ERP'
                  : 'Our team is ready to help you get started with Maqder ERP'}
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{isArabic ? 'الهاتف' : 'Phone'}</p>
                    <p className="text-gray-900 font-semibold">+966 50 000 0000</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{isArabic ? 'البريد الإلكتروني' : 'Email'}</p>
                    <p className="text-gray-900 font-semibold">info@maqder.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">{isArabic ? 'الموقع' : 'Location'}</p>
                    <p className="text-gray-900 font-semibold">{isArabic ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</p>
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
                        {isArabic ? 'الاسم' : 'Name'}
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                        placeholder={isArabic ? 'أدخل اسمك' : 'Enter your name'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {isArabic ? 'البريد الإلكتروني' : 'Email'}
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                        placeholder={isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isArabic ? 'الشركة' : 'Company'}
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition"
                      placeholder={isArabic ? 'اسم الشركة' : 'Company name'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {isArabic ? 'الرسالة' : 'Message'}
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition resize-none"
                      placeholder={isArabic ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition"
                  >
                    {isArabic ? 'إرسال الرسالة' : 'Send Message'}
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
              {isArabic ? 'ابدأ رحلتك مع Maqder ERP اليوم' : 'Start Your Journey with Maqder ERP Today'}
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              {isArabic
                ? 'انضم إلى أكثر من 500 شركة سعودية تثق في Maqder ERP'
                : 'Join 500+ Saudi companies that trust Maqder ERP'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all hover:-translate-y-0.5"
              >
                {isArabic ? 'ابدأ مجاناً' : 'Start Free Trial'}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-2xl font-semibold text-lg hover:bg-white/20 transition border border-white/20"
              >
                <Headphones className="w-5 h-5" />
                {isArabic ? 'تحدث مع المبيعات' : 'Talk to Sales'}
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
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-xl font-bold text-white">Maqder ERP</span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                {isArabic
                  ? 'نظام ERP متكامل للشركات السعودية مع امتثال كامل لهيئة الزكاة والضريبة والجمارك'
                  : 'Complete ERP system for Saudi businesses with full ZATCA compliance'}
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{isArabic ? 'المنتج' : 'Product'}</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-white transition">{isArabic ? 'المميزات' : 'Features'}</a></li>
                <li><a href="#modules" className="hover:text-white transition">{isArabic ? 'الوحدات' : 'Modules'}</a></li>
                <li><a href="#pricing" className="hover:text-white transition">{isArabic ? 'الأسعار' : 'Pricing'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{isArabic ? 'الشركة' : 'Company'}</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition">{isArabic ? 'من نحن' : 'About Us'}</a></li>
                <li><a href="#contact" className="hover:text-white transition">{isArabic ? 'تواصل معنا' : 'Contact'}</a></li>
                <li><a href="#" className="hover:text-white transition">{isArabic ? 'الوظائف' : 'Careers'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{isArabic ? 'قانوني' : 'Legal'}</h4>
              <ul className="space-y-3">
                <li><a href="#" className="hover:text-white transition">{isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}</a></li>
                <li><a href="#" className="hover:text-white transition">{isArabic ? 'شروط الخدمة' : 'Terms of Service'}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              © 2024 Maqder ERP. {isArabic ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
            <p className="text-gray-500 text-sm">
              {isArabic ? 'صنع بـ ❤️ بواسطة' : 'Built with ❤️ by'}{' '}
              <a href="#" className="text-primary-400 hover:text-primary-300">Hassan Sarwar</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
