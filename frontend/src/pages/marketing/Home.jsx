import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  Shield,
  Zap,
  BarChart3,
  Users,
  Package,
  Receipt,
  ArrowRight,
  PlayCircle,
  CheckCircle2,
  Phone,
  FileText,
  Calculator,
  Warehouse,
  Truck,
  ClipboardList,
  MessageCircle,
  Building2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { demoLogin } from '../../store/slices/authSlice'
import { usePublicWebsiteSettings } from '../../lib/website'

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
}

export default function MarketingHome() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const { data } = usePublicWebsiteSettings()

  const isArabic = language === 'ar'

  const phone = data?.contactPhone || '+966595930045'

  const startDemo = async () => {
    try {
      await dispatch(demoLogin()).unwrap()
      navigate('/app/dashboard')
    } catch (e) {
      toast.error(typeof e === 'string' ? e : 'Demo login failed')
    }
  }

  const heroTitle = isArabic ? data?.hero?.titleAr : data?.hero?.titleEn
  const heroSubtitle = isArabic ? data?.hero?.subtitleAr : data?.hero?.subtitleEn

  const modules = [
    {
      icon: FileText,
      titleEn: 'ZATCA E-Invoicing',
      titleAr: 'الفوترة الإلكترونية',
      descEn: 'B2B/B2C invoices, XML signing, QR, submission and status tracking.',
      descAr: 'فواتير B2B/B2C، توقيع XML، QR، الإرسال وتتبع الحالة.'
    },
    {
      icon: Users,
      titleEn: 'HR Management',
      titleAr: 'الموارد البشرية',
      descEn: 'Employees, leave, absences, documents, and automated reminders.',
      descAr: 'الموظفون، الإجازات، الغياب، المستندات والتنبيهات.'
    },
    {
      icon: Calculator,
      titleEn: 'Payroll & WPS',
      titleAr: 'الرواتب وملفات WPS',
      descEn: 'Payroll calculations, EOSB tools, and WPS generation workflows.',
      descAr: 'حساب الرواتب، نهاية الخدمة، وتوليد ملفات WPS.'
    },
    {
      icon: Package,
      titleEn: 'Products & Catalog',
      titleAr: 'المنتجات',
      descEn: 'SKU, barcode, pricing, categories and product performance.',
      descAr: 'SKU والباركود والتسعير والتصنيفات وأداء المنتجات.'
    },
    {
      icon: Warehouse,
      titleEn: 'Warehouses & Stock',
      titleAr: 'المستودعات والمخزون',
      descEn: 'Multi-warehouse quantities, reserved stock and low stock alerts.',
      descAr: 'مخزون متعدد المستودعات، كميات محجوزة وتنبيهات نفاد.'
    },
    {
      icon: Truck,
      titleEn: 'Purchases & Shipments',
      titleAr: 'المشتريات والشحنات',
      descEn: 'Purchase orders, suppliers, receiving and shipment management.',
      descAr: 'طلبات شراء، موردين، استلام وإدارة الشحنات.'
    },
    {
      icon: Receipt,
      titleEn: 'Expenses & Finance',
      titleAr: 'المصروفات والمالية',
      descEn: 'Expense tracking, approvals, categories and analytics.',
      descAr: 'تتبع المصروفات، موافقات، تصنيفات وتحليلات.'
    },
    {
      icon: ClipboardList,
      titleEn: 'Projects & Tasks',
      titleAr: 'المشاريع والمهام',
      descEn: 'Project planning, task workflow and operational visibility.',
      descAr: 'تخطيط المشاريع، سير عمل المهام ووضوح العمليات.'
    },
    {
      icon: MessageCircle,
      titleEn: 'WhatsApp & Automation',
      titleAr: 'واتساب والأتمتة',
      descEn: 'Customer communications, notifications and streamlined follow-ups.',
      descAr: 'تواصل مع العملاء، إشعارات ومتابعة سلسة.'
    },
    {
      icon: BarChart3,
      titleEn: 'Reports & Dashboards',
      titleAr: 'التقارير ولوحات التحكم',
      descEn: 'Real-time KPIs for revenue, expenses, HR and inventory.',
      descAr: 'مؤشرات مباشرة للإيرادات والمصروفات والموارد والمخزون.'
    }
  ]

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#244D33]/40 blur-3xl rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/20 blur-3xl rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a2518] to-[#07150f]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm">
                <Shield className="w-4 h-4 text-emerald-300" />
                {isArabic ? 'جاهز للمرحلة الثانية - ZATCA' : 'ZATCA Phase 2 Ready'}
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold leading-tight">
                <span className="text-white">{heroTitle || (isArabic ? 'نظام ERP متكامل' : 'Complete ERP System')}</span>
                <span className="block bg-gradient-to-r from-emerald-200 to-white bg-clip-text text-transparent">
                  {isArabic ? 'للشركات السعودية' : 'for Saudi Businesses'}
                </span>
              </h1>

              <p className="mt-5 text-lg text-white/70 leading-relaxed">
                {heroSubtitle || (isArabic ? 'منصة واحدة لإدارة الفوترة، الموارد البشرية، الرواتب، المخزون، المشتريات والتقارير.' : 'One platform for invoicing, HR, payroll, inventory, procurement, and analytics.')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#244D33] to-[#1a3d28] hover:from-[#1a3d28] hover:to-[#163121] font-semibold shadow-lg shadow-[#244D33]/35 transition"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <button
                  onClick={startDemo}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold transition"
                >
                  <PlayCircle className="w-5 h-5 text-emerald-200" />
                  {isArabic ? 'عرض مباشر (Live Demo)' : 'Live Demo'}
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/70">
                {[{ icon: Zap, en: 'Fast setup', ar: 'إعداد سريع' }, { icon: BarChart3, en: 'Real-time dashboards', ar: 'لوحات مباشرة' }, { icon: Shield, en: 'Enterprise security', ar: 'أمان مؤسسي' }].map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <b.icon className="w-4 h-4 text-emerald-200" />
                    <span>{isArabic ? b.ar : b.en}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-2 text-white/60 text-sm">
                <Phone className="w-4 h-4" />
                <a className="hover:text-white transition" href={`tel:${phone.replace(/\s+/g, '')}`}>{phone}</a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="lg:col-span-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-500/10 border border-white/10 p-5">
                    <div className="text-white/70 text-sm">{isArabic ? 'الإيرادات' : 'Revenue'}</div>
                    <div className="mt-2 text-2xl font-bold text-white">SAR 125K</div>
                    <div className="mt-3 text-emerald-200 text-xs">+12.5%</div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-sky-500/30 to-sky-500/10 border border-white/10 p-5">
                    <div className="text-white/70 text-sm">{isArabic ? 'الفواتير' : 'Invoices'}</div>
                    <div className="mt-2 text-2xl font-bold text-white">248</div>
                    <div className="mt-3 text-sky-200 text-xs">{isArabic ? 'هذا الشهر' : 'This month'}</div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-amber-500/30 to-amber-500/10 border border-white/10 p-5">
                    <div className="text-white/70 text-sm">{isArabic ? 'الموظفون' : 'Employees'}</div>
                    <div className="mt-2 text-2xl font-bold text-white">32</div>
                    <div className="mt-3 text-amber-200 text-xs">{isArabic ? 'نشط' : 'Active'}</div>
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-rose-500/30 to-rose-500/10 border border-white/10 p-5">
                    <div className="text-white/70 text-sm">{isArabic ? 'المصروفات' : 'Expenses'}</div>
                    <div className="mt-2 text-2xl font-bold text-white">SAR 42K</div>
                    <div className="mt-3 text-rose-200 text-xs">{isArabic ? 'متابعة دقيقة' : 'Tracked'}</div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-black/20 border border-white/10 p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">{isArabic ? 'كل شيء في مكان واحد' : 'Everything in one place'}</div>
                    <div className="text-xs text-emerald-200">{isArabic ? 'تجربة فورية' : 'Instant'}</div>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
                    {[{ icon: Users, en: 'HR & Payroll', ar: 'الموارد البشرية' }, { icon: Package, en: 'Inventory', ar: 'المخزون' }, { icon: Receipt, en: 'Expenses', ar: 'المصروفات' }].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-3 text-white/80">
                        <item.icon className="w-4 h-4 text-emerald-200" />
                        <span>{isArabic ? item.ar : item.en}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.5 }} className="mt-14 grid md:grid-cols-3 gap-4">
            {[
              {
                titleEn: 'ZATCA E-Invoicing',
                titleAr: 'الفوترة الإلكترونية',
                descEn: 'Signed XML, QR codes, B2B/B2C, compliance & reporting.',
                descAr: 'توقيع XML ورموز QR وفواتير B2B/B2C والامتثال والتقارير.'
              },
              {
                titleEn: 'HR & Payroll',
                titleAr: 'الموارد البشرية والرواتب',
                descEn: 'GOSI, WPS files, EOSB tools, employee profiles & alerts.',
                descAr: 'التأمينات وملفات WPS وأدوات نهاية الخدمة وملفات الموظفين.'
              },
              {
                titleEn: 'Inventory & Procurement',
                titleAr: 'المخزون والمشتريات',
                descEn: 'Warehouses, products, purchase orders, shipments & stock control.',
                descAr: 'المستودعات والمنتجات وطلبات الشراء والشحنات والتحكم في المخزون.'
              }
            ].map((card, idx) => (
              <div key={idx} className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7 transition">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-200" />
                  <div>
                    <div className="font-bold text-white">{isArabic ? card.titleAr : card.titleEn}</div>
                    <div className="mt-2 text-sm text-white/70 leading-relaxed">{isArabic ? card.descAr : card.descEn}</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-b from-[#07150f] to-[#06120d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <div className="text-2xl font-bold text-white">
                {isArabic ? 'هل تريد تجربة مباشرة للنظام؟' : 'Want a live hands-on demo?'}
              </div>
              <div className="mt-2 text-white/70">
                {isArabic ? 'اضغط على Live Demo وسيتم فتح لوحة التينانت فوراً.' : 'Click Live Demo and we will open the tenant panel instantly.'}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button onClick={startDemo} className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#244D33] to-[#1a3d28] font-semibold shadow-lg shadow-[#244D33]/30 transition">
                {isArabic ? 'Live Demo' : 'Live Demo'}
                <ArrowRight className="w-5 h-5" />
              </button>
              <Link to="/pricing" className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition">
                {isArabic ? 'الأسعار' : 'Pricing'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#07150f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm">
                <Building2 className="w-4 h-4 text-emerald-200" />
                {isArabic ? 'كل وحدات ERP في منصة واحدة' : 'All ERP modules in one platform'}
              </div>

              <h2 className="mt-5 text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                {isArabic ? 'مصمم لعمليات الشركات السعودية' : 'Built for Saudi business operations'}
              </h2>
              <p className="mt-4 text-white/70 leading-relaxed">
                {isArabic
                  ? 'من الفوترة الإلكترونية إلى الموارد البشرية والمخزون والمشتريات والتقارير — كل شيء متصل ومنظم في لوحة واحدة.'
                  : 'From e-invoicing to HR, inventory, procurement, and reports — everything is connected and organized in one dashboard.'}
              </p>

              <div className="mt-8 space-y-3">
                {[{ en: 'Arabic & English (RTL)', ar: 'عربي وإنجليزي (RTL)' }, { en: 'ZATCA compliance workflows', ar: 'امتثال ZATCA' }, { en: 'Modern premium UI/UX', ar: 'تصميم عصري فاخر' }].map((x, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-white/75">
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                    <span>{isArabic ? x.ar : x.en}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={startDemo}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#244D33] to-[#1a3d28] font-semibold shadow-lg shadow-[#244D33]/30 transition"
                >
                  {isArabic ? 'Live Demo' : 'Live Demo'}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link
                  to="/pricing"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition"
                >
                  {isArabic ? 'الأسعار' : 'Pricing'}
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="grid sm:grid-cols-2 gap-4">
                {modules.map((m, idx) => (
                  <div key={idx} className="rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/7 transition">
                    <div className="flex items-start gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <m.icon className="w-5 h-5 text-emerald-200" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{isArabic ? m.titleAr : m.titleEn}</div>
                        <div className="mt-2 text-sm text-white/70 leading-relaxed">{isArabic ? m.descAr : m.descEn}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
