import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardList,
  FileText,
  Globe,
  Landmark,
  MessageCircle,
  Package,
  Phone,
  PlayCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { demoLogin } from '../../store/slices/authSlice'
import { usePublicWebsiteSettings } from '../../lib/website'

const fade = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
}

const Vision2030Mark = ({ isArabic }) => (
  <div className="inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-white px-4 py-2 shadow-sm shadow-emerald-100/80">
    <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-emerald-200 bg-[radial-gradient(circle_at_top,_#dcfce7,_#ffffff_58%)] text-emerald-700">
      <div className="absolute inset-1 rounded-full border border-dashed border-emerald-300/80" />
      <span className="text-sm font-black tracking-[0.24em]">2030</span>
    </div>
    <div className="leading-tight">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-700">
        {isArabic ? 'رؤية السعودية' : 'Saudi Vision'}
      </p>
      <p className="text-sm font-semibold text-slate-900">
        {isArabic ? 'منصة أعمال متوافقة وطموحة' : 'Aligned for modern Saudi growth'}
      </p>
    </div>
  </div>
)

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

  const heroMetrics = [
    {
      value: isArabic ? 'فاتورة ثوانٍ' : 'Invoices in seconds',
      label: isArabic ? 'ZATCA + QR + XML' : 'ZATCA + QR + XML',
    },
    {
      value: isArabic ? 'فرق أكثر هدوءاً' : 'Calmer operations',
      label: isArabic ? 'الموارد والرواتب والموافقات' : 'HR, payroll, approvals',
    },
    {
      value: isArabic ? 'مخزون واضح' : 'Clear inventory',
      label: isArabic ? 'مستودعات ومشتريات وتتبع' : 'Warehouses, purchases, tracking',
    },
    {
      value: isArabic ? 'لوحة قرار واحدة' : 'One decision layer',
      label: isArabic ? 'تقارير مباشرة باللغة العربية والإنجليزية' : 'Live reporting in Arabic and English',
    },
  ]

  const valueCards = [
    {
      icon: FileText,
      title: isArabic ? 'فوترة السعودية' : 'Saudi invoicing',
      desc: isArabic ? 'امتثال هادئ. توقيع أسرع.' : 'Quiet compliance. Faster signing.',
    },
    {
      icon: Users,
      title: isArabic ? 'الأشخاص والرواتب' : 'People and payroll',
      desc: isArabic ? 'ملفات الموظفين والرواتب في نفس التدفق.' : 'Employee files and payroll in one flow.',
    },
    {
      icon: Warehouse,
      title: isArabic ? 'المخزون والحركة' : 'Inventory and movement',
      desc: isArabic ? 'مخزون ومشتريات واستلام بدون ضوضاء.' : 'Stock, purchasing and receiving without noise.',
    },
  ]

  const minimalHighlights = [
    { icon: Calculator, label: isArabic ? 'Payroll + WPS' : 'Payroll + WPS' },
    { icon: Package, label: isArabic ? 'Catalog + SKU' : 'Catalog + SKU' },
    { icon: Truck, label: isArabic ? 'Suppliers + PO' : 'Suppliers + PO' },
    { icon: Receipt, label: isArabic ? 'Expenses' : 'Expenses' },
    { icon: MessageCircle, label: isArabic ? 'WhatsApp' : 'WhatsApp' },
    { icon: BarChart3, label: isArabic ? 'Live analytics' : 'Live analytics' },
  ]

  return (
    <main className="bg-[linear-gradient(180deg,#f8faf7_0%,#f4f8f4_48%,#ffffff_100%)] text-slate-900">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-24 left-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-lime-100/60 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-6">
              <Vision2030Mark isArabic={isArabic} />

              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                {isArabic ? 'جاهز لـ ZATCA المرحلة الثانية' : 'ZATCA Phase 2 ready'}
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                {heroTitle || (isArabic ? 'منصة ERP سعودية أنيقة. سريعة. واضحة.' : 'A Saudi ERP platform that feels elegant, fast and clear.')}
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
                {heroSubtitle || (isArabic
                  ? 'الفوترة الإلكترونية، الموارد البشرية، الرواتب، المخزون، المشتريات والتقارير في طبقة تشغيل واحدة خفيفة وسريعة.'
                  : 'E-invoicing, HR, payroll, inventory, procurement and reporting inside one ultra-clean operating layer.')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f6b43] to-[#155234] px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:from-[#185636] hover:to-[#12472d]"
                >
                  {isArabic ? 'ابدأ الآن' : 'Get started'}
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <button
                  onClick={startDemo}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <PlayCircle className="h-5 w-5 text-emerald-700" />
                  {isArabic ? 'تجربة مباشرة' : 'Live demo'}
                </button>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-600">
                {[
                  { icon: Sparkles, label: isArabic ? 'واجهة أخف' : 'Lighter UI' },
                  { icon: Globe, label: isArabic ? 'عربي / English' : 'Arabic / English' },
                  { icon: Landmark, label: isArabic ? 'مصمم للسعودية' : 'Built for Saudi Arabia' },
                ].map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                    <item.icon className="h-4 w-4 text-emerald-700" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-2 text-sm text-slate-500">
                <Phone className="h-4 w-4" />
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="font-medium text-slate-700 transition hover:text-emerald-700">
                  {phone}
                </a>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-5 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.18)]">
                <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />

                <div className="rounded-[1.75rem] border border-slate-100 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbf9_100%)] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                        {isArabic ? 'نظام تشغيل الأعمال' : 'Business operating layer'}
                      </p>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">
                        {isArabic ? 'كل تدفقك في شاشة واحدة' : 'Everything in one intelligent screen'}
                      </h2>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                      {isArabic ? 'رؤية 2030' : 'Vision 2030'}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {heroMetrics.map((metric, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <p className="text-sm font-bold text-slate-900">{metric.value}</p>
                        <p className="mt-1 text-sm text-slate-500">{metric.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-950 p-5 text-white shadow-[0_20px_50px_-28px_rgba(15,23,42,0.55)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                          {isArabic ? 'صورة تشغيل سريعة' : 'Operational snapshot'}
                        </p>
                        <p className="mt-2 text-lg font-bold">
                          {isArabic ? 'الموافقة. التوقيع. التسليم.' : 'Approve. Sign. Deliver.'}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/10 px-3 py-2 text-xs text-white/80">
                        {isArabic ? 'لحظي' : 'Live'}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      {[
                        { title: isArabic ? 'ZATCA' : 'ZATCA', value: isArabic ? 'متصل' : 'Connected' },
                        { title: isArabic ? 'المخزون' : 'Stock', value: isArabic ? 'محدّث' : 'Synced' },
                        { title: isArabic ? 'الفريق' : 'Team', value: isArabic ? 'جاهز' : 'Ready' },
                      ].map((item, idx) => (
                        <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                          <p className="text-white/55">{item.title}</p>
                          <p className="mt-1 font-semibold text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.5 }} className="mt-12 grid gap-4 md:grid-cols-3">
            {valueCards.map((card, idx) => (
              <div key={idx} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100/80">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-950">{card.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-500">{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                <Building2 className="h-4 w-4" />
                {isArabic ? 'ERP مختصر. قوي. مرن.' : 'ERP that stays minimal and powerful'}
              </div>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                {isArabic ? 'كل ما تحتاجه للنمو السعودي الحديث' : 'Everything needed for modern Saudi growth'}
              </h2>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
                {isArabic
                  ? 'نص أقل. وضوح أعلى. وحدات ERP مترابطة تعمل كمنصة واحدة من أول فاتورة إلى آخر تقرير.'
                  : 'Less text. More clarity. ERP modules connected as one platform from first invoice to final report.'}
              </p>

              <div className="mt-8 space-y-3">
                {[
                  isArabic ? 'امتثال ZATCA في القلب' : 'ZATCA at the core',
                  isArabic ? 'تصميم ثنائي اللغة جاهز' : 'Bilingual by design',
                  isArabic ? 'قابل للتوسع من شركة ناشئة إلى مؤسسة' : 'Scales from startup to enterprise',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-700">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {modules.map((m, idx) => (
                  <div key={idx} className="group rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdfb_100%)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/60">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                        <m.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-950">{isArabic ? m.titleAr : m.titleEn}</div>
                        <div className="mt-2 text-sm leading-relaxed text-slate-500">{isArabic ? m.descAr : m.descEn}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f4faf5_50%,#eef8f1_100%)] p-8 shadow-[0_30px_80px_-40px_rgba(22,101,52,0.30)] sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                  {isArabic ? 'أبرز الوحدات' : 'ERP highlights'}
                </p>
                <h3 className="mt-3 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  {isArabic ? 'أقل كلمات. أكثر نتيجة.' : 'Ultra-minimal language. Maximum business clarity.'}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
                  {isArabic
                    ? 'الفوترة، الرواتب، المخزون، المشتريات، المشاريع، المصروفات، التقارير، واتساب — كلها ضمن بنية واحدة سلسة.'
                    : 'Invoicing, payroll, stock, procurement, projects, expenses, reporting and WhatsApp in one smooth structure.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {minimalHighlights.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                    <item.icon className="h-4 w-4 text-emerald-700" />
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 rounded-[2rem] border border-slate-200 bg-slate-950 px-8 py-10 text-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.9)] lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-300">
                {isArabic ? 'جاهز للانطلاق' : 'Ready to launch'}
              </p>
              <h4 className="mt-3 text-3xl font-black leading-tight">
                {isArabic ? 'ابدأ منصة أعمال تليق برؤية شركتك' : 'Launch an operating system worthy of your business vision'}
              </h4>
              <p className="mt-3 max-w-2xl text-white/70">
                {isArabic ? 'ادخل مباشرة أو افتح تجربة حية وشاهد كيف تبدو الإدارة الحديثة في السعودية.' : 'Log in or open a live demo and see what modern Saudi operations should feel like.'}
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button
                onClick={startDemo}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#1f6b43] to-[#155234] px-7 py-3.5 font-semibold text-white transition hover:from-[#185636] hover:to-[#12472d]"
              >
                {isArabic ? 'تجربة مباشرة' : 'Live demo'}
                <ArrowRight className="h-5 w-5" />
              </button>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                {isArabic ? 'الأسعار' : 'Pricing'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
