import { useState } from 'react'
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
  PieChart,
  PlayCircle,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
  Warehouse,
  Zap,
} from 'lucide-react'
import { usePublicWebsiteSettings } from '../../lib/website'
import { SOLUTIONS } from '../../lib/solutionsContent'

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

  const phone = data?.contactPhone || '+966596775485'

  const heroSubtitle = isArabic ? data?.hero?.subtitleAr : data?.hero?.subtitleEn

  const modules = [
    { icon: FileText, titleEn: 'ZATCA E-Invoicing', titleAr: 'Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©', descEn: 'B2B/B2C invoices, XML signing, QR and real-time ZATCA submission.', descAr: 'ÙÙˆØ§ØªÙŠØ± B2B/B2CØŒ ØªÙˆÙ‚ÙŠØ¹ XMLØŒ QRØŒ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ ÙˆØªØªØ¨Ø¹ Ø§Ù„Ø­Ø§Ù„Ø©.' },
    { icon: Users, titleEn: 'HR Management', titleAr: 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©', descEn: 'Employees, leave, documents and automated Iqama reminders.', descAr: 'Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ†ØŒ Ø§Ù„Ø¥Ø¬Ø§Ø²Ø§ØªØŒ Ø§Ù„Ù…Ø³ØªÙ†Ø¯Ø§Øª ÙˆØ§Ù„ØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ©.' },
    { icon: Calculator, titleEn: 'Payroll & WPS', titleAr: 'Ø§Ù„Ø±ÙˆØ§ØªØ¨ ÙˆÙ…Ù„ÙØ§Øª WPS', descEn: 'Payroll calculations, EOSB tools and WPS generation workflows.', descAr: 'Ø­Ø³Ø§Ø¨ Ø§Ù„Ø±ÙˆØ§ØªØ¨ØŒ Ù†Ù‡Ø§ÙŠØ© Ø§Ù„Ø®Ø¯Ù…Ø©ØŒ ÙˆØªÙˆÙ„ÙŠØ¯ Ù…Ù„ÙØ§Øª WPS.' },
    { icon: Package, titleEn: 'Products & Catalog', titleAr: 'Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª', descEn: 'SKU, barcode, pricing, categories and product performance.', descAr: 'SKU ÙˆØ§Ù„Ø¨Ø§Ø±ÙƒÙˆØ¯ ÙˆØ§Ù„ØªØ³Ø¹ÙŠØ± ÙˆØ§Ù„ØªØµÙ†ÙŠÙØ§Øª ÙˆØ£Ø¯Ø§Ø¡ Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª.' },
    { icon: Warehouse, titleEn: 'Warehouses & Stock', titleAr: 'Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ÙˆØ§Ù„Ù…Ø®Ø²ÙˆÙ†', descEn: 'Multi-warehouse quantities, reserved stock and low stock alerts.', descAr: 'Ù…Ø®Ø²ÙˆÙ† Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§ØªØŒ ÙƒÙ…ÙŠØ§Øª Ù…Ø­Ø¬ÙˆØ²Ø© ÙˆØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù†ÙØ§Ø¯.' },
    { icon: Truck, titleEn: 'Purchases & Shipments', titleAr: 'Ø§Ù„Ù…Ø´ØªØ±ÙŠØ§Øª ÙˆØ§Ù„Ø´Ø­Ù†Ø§Øª', descEn: 'Purchase orders, suppliers, receiving and shipment management.', descAr: 'Ø·Ù„Ø¨Ø§Øª Ø´Ø±Ø§Ø¡ØŒ Ù…ÙˆØ±Ø¯ÙŠÙ†ØŒ Ø§Ø³ØªÙ„Ø§Ù… ÙˆØ¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø´Ø­Ù†Ø§Øª.' },
    { icon: Receipt, titleEn: 'Expenses & Finance', titleAr: 'Ø§Ù„Ù…ØµØ±ÙˆÙØ§Øª ÙˆØ§Ù„Ù…Ø§Ù„ÙŠØ©', descEn: 'Expense tracking, approvals, categories and analytics.', descAr: 'ØªØªØ¨Ø¹ Ø§Ù„Ù…ØµØ±ÙˆÙØ§ØªØŒ Ù…ÙˆØ§ÙÙ‚Ø§ØªØŒ ØªØµÙ†ÙŠÙØ§Øª ÙˆØªØ­Ù„ÙŠÙ„Ø§Øª.' },
    { icon: ClipboardList, titleEn: 'Projects & Tasks', titleAr: 'Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ ÙˆØ§Ù„Ù…Ù‡Ø§Ù…', descEn: 'Project planning, task workflow and operational visibility.', descAr: 'ØªØ®Ø·ÙŠØ· Ø§Ù„Ù…Ø´Ø§Ø±ÙŠØ¹ØŒ Ø³ÙŠØ± Ø¹Ù…Ù„ Ø§Ù„Ù…Ù‡Ø§Ù… ÙˆÙˆØ¶ÙˆØ­ Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª.' },
    { icon: MessageCircle, titleEn: 'WhatsApp & Automation', titleAr: 'ÙˆØ§ØªØ³Ø§Ø¨ ÙˆØ§Ù„Ø£ØªÙ…ØªØ©', descEn: 'Customer communications, notifications and follow-ups.', descAr: 'ØªÙˆØ§ØµÙ„ Ù…Ø¹ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ØŒ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ÙˆÙ…ØªØ§Ø¨Ø¹Ø© Ø³Ù„Ø³Ø©.' },
    { icon: BarChart3, titleEn: 'Reports & Dashboards', titleAr: 'Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± ÙˆÙ„ÙˆØ­Ø§Øª Ø§Ù„ØªØ­ÙƒÙ…', descEn: 'Real-time KPIs for revenue, expenses, HR and inventory.', descAr: 'Ù…Ø¤Ø´Ø±Ø§Øª Ù…Ø¨Ø§Ø´Ø±Ø© Ù„Ù„Ø¥ÙŠØ±Ø§Ø¯Ø§Øª ÙˆØ§Ù„Ù…ØµØ±ÙˆÙØ§Øª ÙˆØ§Ù„Ù…ÙˆØ§Ø±Ø¯ ÙˆØ§Ù„Ù…Ø®Ø²ÙˆÙ†.' },
  ]

  const testimonials = [
    { name: 'Ahmed Al-Rashid', nameAr: 'Ø£Ø­Ù…Ø¯ Ø§Ù„Ø±Ø§Ø´Ø¯', role: 'CFO, Tech Solutions', roleAr: 'Ø§Ù„Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø§Ù„ÙŠ', content: 'ZATCA compliance is now fully automatic. Our team spends zero time on submission â€” Maqder handles everything.', contentAr: 'Ø§Ù…ØªØ«Ø§Ù„ ZATCA Ø£ØµØ¨Ø­ ØªÙ„Ù‚Ø§Ø¦ÙŠØ§Ù‹ ØªÙ…Ø§Ù…Ø§Ù‹. ÙØ±ÙŠÙ‚Ù†Ø§ Ù„Ø§ ÙŠÙ‚Ø¶ÙŠ Ø£ÙŠ ÙˆÙ‚Øª ÙÙŠ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ â€” Maqder ÙŠØªØ¹Ø§Ù…Ù„ Ù…Ø¹ ÙƒÙ„ Ø´ÙŠØ¡.' },
    { name: 'Sara Mohammed', nameAr: 'Ø³Ø§Ø±Ø© Ù…Ø­Ù…Ø¯', role: 'HR Director, Retail Group', roleAr: 'Ù…Ø¯ÙŠØ±Ø© Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©', content: 'GOSI calculations that used to take hours now run in seconds. Payroll processing is completely seamless.', contentAr: 'Ø­Ø³Ø§Ø¨Ø§Øª Ø§Ù„ØªØ£Ù…ÙŠÙ†Ø§Øª Ø§Ù„ØªÙŠ ÙƒØ§Ù†Øª ØªØ³ØªØºØ±Ù‚ Ø³Ø§Ø¹Ø§Øª ØªØ¹Ù…Ù„ Ø§Ù„Ø¢Ù† ÙÙŠ Ø«ÙˆØ§Ù†Ù. Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø±ÙˆØ§ØªØ¨ Ø³Ù„Ø³Ø© ØªÙ…Ø§Ù…Ø§Ù‹.' },
    { name: 'Khalid Hassan', nameAr: 'Ø®Ø§Ù„Ø¯ Ø­Ø³Ù†', role: 'Operations Manager', roleAr: 'Ù…Ø¯ÙŠØ± Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª', content: 'Multi-warehouse inventory with real-time tracking changed how we operate. Finally a system that grows with us.', contentAr: 'ØªØªØ¨Ø¹ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª ØºÙŠÙ‘Ø± Ø·Ø±ÙŠÙ‚Ø© Ø¹Ù…Ù„Ù†Ø§. Ø£Ø®ÙŠØ±Ø§Ù‹ Ù†Ø¸Ø§Ù… ÙŠÙ†Ù…Ùˆ Ù…Ø¹Ù†Ø§.' },
  ]

  return (
    <main className="bg-white text-slate-900 overflow-hidden">

      {/* â”€â”€ HERO â”€â”€ */}
      <section className="relative bg-[#030c06] text-white overflow-hidden">
        {/* Grid texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(16,185,129,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(16,185,129,0.07) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
          }}
        />
        <div className="pointer-events-none absolute -top-32 -left-32 h-[700px] w-[700px] rounded-full bg-emerald-500/[0.09] blur-[130px]" />
        <div className="pointer-events-none absolute top-40 right-0 h-[500px] w-[500px] rounded-full bg-emerald-700/[0.08] blur-[110px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-32 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-12">

            {/* Copy */}
            <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75 }} className="lg:col-span-5">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                {isArabic ? 'Ø¬Ø§Ù‡Ø² Ù„Ù€ ZATCA Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ©' : 'ZATCA Phase 2 Certified'}
              </div>

              <h1 className="mt-7 text-5xl font-black leading-[1.0] tracking-tight sm:text-6xl lg:text-[3.75rem] xl:text-6xl">
                <span className="block bg-gradient-to-b from-white to-white/75 bg-clip-text text-transparent">
                  {isArabic ? 'Ù…Ù†ØµØ© ERP' : 'The Saudi ERP'}
                </span>
                <span className="block bg-gradient-to-r from-emerald-300 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                  {isArabic ? 'Ù„Ù„Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©' : 'businesses trust'}
                </span>
              </h1>

              <p className="mt-6 max-w-md text-lg leading-relaxed text-white/55">
                {heroSubtitle || (isArabic
                  ? 'Ø§Ù„ÙÙˆØªØ±Ø©ØŒ Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©ØŒ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† ÙˆØ§Ù„ØªÙ‚Ø§Ø±ÙŠØ± â€” ÙÙŠ Ù…Ù†ØµØ© ÙˆØ§Ø­Ø¯Ø© Ø³Ø±ÙŠØ¹Ø© ÙˆÙ…ØªÙˆØ§ÙÙ‚Ø©.'
                  : 'E-invoicing, HR, payroll, inventory and reporting in one fast, ZATCA-compliant platform.')}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-4 font-semibold text-white shadow-[0_0_0_1px_rgba(52,211,153,0.15),0_8px_32px_-8px_rgba(52,211,153,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(52,211,153,0.3),0_12px_40px_-8px_rgba(52,211,153,0.6)]"
                >
                  {isArabic ? 'Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù†' : 'Get started'}
                  <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-0.5 ${isArabic ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
                </Link>
                <a
                  href="#demos"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('demos').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.06] px-7 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                >
                  <PlayCircle className="h-5 w-5 text-emerald-300" />
                  {isArabic ? 'Ø§Ù„ØªØ¬Ø§Ø±Ø¨ Ø§Ù„Ø­ÙŠØ©' : 'Live demos'}
                </a>
              </div>

              {/* Rating / social proof */}
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2.5">
                    {['A', 'S', 'K', 'M'].map((c, i) => (
                      <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#030c06] bg-gradient-to-br from-emerald-400 to-emerald-600 text-[11px] font-bold text-white">
                        {c}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-white/45">{isArabic ? '500+ Ø´Ø±ÙƒØ© ØªØ«Ù‚ Ø¨Ù†Ø§' : 'Trusted by 500+ companies'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  { icon: Sparkles, label: isArabic ? 'ÙˆØ§Ø¬Ù‡Ø© Ø£Ù†ÙŠÙ‚Ø©' : 'Clean UI' },
                  { icon: Globe, label: isArabic ? 'Ø¹Ø±Ø¨ÙŠ / English' : 'Arabic / English' },
                  { icon: Landmark, label: isArabic ? 'Ù…ØµÙ…Ù… Ù„Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©' : 'Made for Saudi' },
                ].map((item, i) => (
                  <div key={i} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/60">
                    <item.icon className="h-3.5 w-3.5 text-emerald-400" />
                    {item.label}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, delay: 0.15 }} className="lg:col-span-7">
              <div className="relative">
                <div className="pointer-events-none absolute inset-0 scale-110 rounded-3xl bg-emerald-500/[0.08] blur-3xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_40px_100px_-20px_rgba(0,0,0,0.9)] backdrop-blur-sm">
                  <div className="rounded-[1.75rem] border border-white/[0.05] bg-[#071209] p-5">

                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">{isArabic ? 'Ù„ÙˆØ­Ø© Ø§Ù„ØªØ­ÙƒÙ…' : 'Dashboard'}</span>
                      </div>
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/12 px-3 py-1.5 text-xs font-bold text-emerald-300">{isArabic ? 'Ù…Ø¨Ø§Ø´Ø±' : 'Live'}</div>
                    </div>

                    <div className="mb-4 grid grid-cols-2 gap-3">
                      {[
                        { label: isArabic ? 'Ø§Ù„ÙÙˆØ§ØªÙŠØ± Ø§Ù„ÙŠÙˆÙ…' : 'Invoices today', value: '284', trend: '+18%', up: true },
                        { label: isArabic ? 'Ø§Ù„Ø¥ÙŠØ±Ø§Ø¯ Ø§Ù„Ø´Ù‡Ø±ÙŠ' : 'Monthly revenue', value: 'SAR 1.2M', trend: '+24%', up: true },
                        { label: isArabic ? 'Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ† Ø§Ù„Ù†Ø´Ø·ÙˆÙ†' : 'Active employees', value: '142', trend: '+3', up: true },
                        { label: isArabic ? 'Ø£ØµÙ†Ø§Ù Ø§Ù„Ù…Ø®Ø²ÙˆÙ†' : 'Stock items', value: '4,280', trend: 'Low: 12', up: false },
                      ].map((metric, i) => (
                        <div key={i} className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4">
                          <p className="text-xs text-white/40">{metric.label}</p>
                          <p className="mt-2 text-xl font-black text-white">{metric.value}</p>
                          <p className={`mt-1 text-xs font-semibold ${metric.up ? 'text-emerald-400' : 'text-amber-400'}`}>{metric.trend}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 text-emerald-400" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-300">{isArabic ? 'ZATCA Ù…ØªØµÙ„ ÙˆÙ…ÙØ¹Ù‘Ù„' : 'ZATCA Connected & Active'}</p>
                          <p className="text-[11px] text-white/35">{isArabic ? 'Ø¢Ø®Ø± Ù…Ø²Ø§Ù…Ù†Ø©: Ù„Ù„ØªÙˆ' : 'Last sync: just now'}</p>
                        </div>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15">
                        <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                      </div>
                    </div>
                  </div>
                </div>

                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-5 -right-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl">
                  <p className="text-[11px] text-white/50">{isArabic ? 'Ø§Ù„Ø§Ù…ØªØ«Ø§Ù„' : 'Compliance'}</p>
                  <p className="mt-0.5 text-sm font-bold text-white">âœ“ ZATCA Phase 2</p>
                </motion.div>

                <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
                  className="absolute -bottom-5 -left-5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl">
                  <p className="text-[11px] text-white/50">{isArabic ? 'Ø§Ù„Ø¯Ø¹Ù…' : 'Support'}</p>
                  <p className="mt-0.5 text-sm font-bold text-white">24 / 7 Available</p>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* â”€â”€ CERTIFICATIONS STRIP â”€â”€ */}
      <section className="border-b border-slate-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            {isArabic ? 'Ù…Ø¹ØªÙ…Ø¯ ÙˆÙ…ØªÙˆØ§ÙÙ‚ Ù…Ø¹' : 'Certified & compliant with'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[
              { src: '/ZATCA_Logo.svg', alt: 'ZATCA', cls: 'h-12' },
              { src: '/saudi-vision-2030-logo.webp', alt: 'Saudi Vision 2030', cls: 'h-12' },
              { src: '/saudi_tech_mob_en.svg', alt: 'Saudi Tech MOB', cls: 'h-10' },
            ].map((logo) => (
              <div
                key={logo.alt}
                className="flex h-20 min-w-[150px] items-center justify-center rounded-2xl border border-slate-200/70 bg-slate-50/50 px-6 grayscale transition-all duration-300 hover:grayscale-0 hover:border-emerald-200 hover:bg-white hover:shadow-md"
              >
                <img src={logo.src} alt={logo.alt} className={`${logo.cls} w-auto object-contain`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ STATS â”€â”€ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {[
              { value: '500+', label: isArabic ? 'Ø´Ø±ÙƒØ© ØªØ«Ù‚ Ø¨Ù†Ø§' : 'Companies trust us' },
              { value: '50K+', label: isArabic ? 'ÙØ§ØªÙˆØ±Ø© ÙŠÙˆÙ…ÙŠØ§Ù‹' : 'Invoices processed daily' },
              { value: '99.9%', label: isArabic ? 'ÙˆÙ‚Øª ØªØ´ØºÙŠÙ„ Ø§Ù„Ù…Ù†ØµØ©' : 'Platform uptime' },
              { value: '24/7', label: isArabic ? 'Ø¯Ø¹Ù… ÙÙ†ÙŠ Ù…ØªÙˆØ§ØµÙ„' : 'Customer support' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fade}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/60 p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/60 hover:shadow-xl hover:shadow-emerald-100/50 sm:p-8"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <p className="bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* â”€â”€ MODULES GRID â”€â”€ */}
      <section className="bg-slate-50/70 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              <Building2 className="h-4 w-4" />
              {isArabic ? 'ÙˆØ­Ø¯Ø§Øª ERP Ù…ØªÙƒØ§Ù…Ù„Ø©' : 'Integrated ERP modules'}
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {isArabic ? 'ÙƒÙ„ Ø£Ø¯ÙˆØ§Øª Ø¹Ù…Ù„Ùƒ ÙÙŠ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯' : 'Every tool your business needs'}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              {isArabic
                ? 'Ù…Ù† Ø§Ù„ÙÙˆØªØ±Ø© Ø¥Ù„Ù‰ Ø§Ù„Ø±ÙˆØ§ØªØ¨ ÙˆØ§Ù„Ù…Ø®Ø²ÙˆÙ† â€” Ø¨Ù†ÙŠØ© ÙˆØ§Ø­Ø¯Ø© Ù…ØµÙ…Ù…Ø© Ù„Ù„Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ© Ø§Ù„Ø­Ø¯ÙŠØ«Ø©.'
                : 'From invoicing to payroll and inventory â€” one seamless architecture built for modern Saudi businesses.'}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
            {modules.map((m, idx) => (
              <motion.div key={idx} variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.4, delay: (idx % 4) * 0.07 }}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-300/60 hover:shadow-xl hover:shadow-emerald-100/60">
                <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-400/0 blur-2xl transition-all duration-500 group-hover:bg-emerald-400/20" />
                <div className="relative mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/80 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-emerald-500 group-hover:to-emerald-600 group-hover:text-white group-hover:ring-emerald-500/20 group-hover:shadow-lg group-hover:shadow-emerald-500/25">
                  <m.icon className="h-5 w-5" />
                </div>
                <p className="relative font-bold text-slate-950">{isArabic ? m.titleAr : m.titleEn}</p>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-500">{isArabic ? m.descAr : m.descEn}</p>
                <div className={`relative mt-4 flex items-center gap-1 text-sm font-semibold text-emerald-600 opacity-0 transition-all duration-300 group-hover:opacity-100 ${isArabic ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}>
                  {isArabic ? 'Ø§Ø¹Ø±Ù Ø§Ù„Ù…Ø²ÙŠØ¯' : 'Learn more'}
                  <ArrowRight className={`h-3.5 w-3.5 ${isArabic ? 'rotate-180' : ''}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ DARK FEATURES â”€â”€ */}
      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                <Zap className="h-4 w-4" />
                {isArabic ? 'Ù…ØµÙ…Ù… Ù„Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©' : 'Built for Saudi Arabia'}
              </div>
              <h2 className="text-4xl font-black leading-tight sm:text-5xl">
                {isArabic
                  ? 'Ø§Ù…ØªØ«Ø§Ù„ ØªÙ„Ù‚Ø§Ø¦ÙŠ.\nÙ†Ù…Ùˆ ÙˆØ§Ø¶Ø­.'
                  : <>{isArabic ? 'Ø§Ù…ØªØ«Ø§Ù„ ØªÙ„Ù‚Ø§Ø¦ÙŠ.' : 'Automatic compliance.'}<br /><span className="text-emerald-400">{isArabic ? 'Ù†Ù…Ùˆ ÙˆØ§Ø¶Ø­.' : 'Clear growth.'}</span></>}
              </h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/55">
                {isArabic
                  ? 'Ù…Ù† ÙØ§ØªÙˆØ±Ø© ZATCA Ø§Ù„Ø£ÙˆÙ„Ù‰ Ø¥Ù„Ù‰ Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ± Ø§Ù„Ø¶Ø±ÙŠØ¨ÙŠØ© Ø§Ù„Ø±Ø¨Ø¹ Ø³Ù†ÙˆÙŠØ© â€” Ø§Ù„Ù†Ø¸Ø§Ù… ÙŠØ¹Ù…Ù„ Ø¨ÙŠÙ†Ù…Ø§ Ø£Ù†Øª ØªØªØ·ÙˆØ±.'
                  : 'From your first ZATCA invoice to quarterly VAT returns â€” the system works while your business grows.'}
              </p>
              <div className="mt-9 space-y-4">
                {[
                  isArabic ? 'Ø§Ù…ØªØ«Ø§Ù„ ZATCA Ø§Ù„Ù…Ø±Ø­Ù„Ø© Ø§Ù„Ø«Ø§Ù†ÙŠØ© ÙÙŠ Ø§Ù„Ù‚Ù„Ø¨' : 'ZATCA Phase 2 compliance at the core',
                  isArabic ? 'Ø­Ø³Ø§Ø¨Ø§Øª GOSI ÙˆEOSB Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠØ©' : 'Automatic GOSI & EOSB calculations',
                  isArabic ? 'Ø¯Ø¹Ù… ÙƒØ§Ù…Ù„ Ù„Ù„Ø¹Ø±Ø¨ÙŠØ© ÙˆØ§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©' : 'Full bilingual Arabic / English support',
                  isArabic ? 'Ù‚Ø§Ø¨Ù„ Ù„Ù„ØªÙˆØ³Ø¹ Ù…Ù† Ø´Ø±ÙƒØ© Ù†Ø§Ø´Ø¦Ø© Ø¥Ù„Ù‰ Ù…Ø¤Ø³Ø³Ø©' : 'Scales from startup to enterprise',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                    <span className="font-medium text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: FileText, title: isArabic ? 'Ø§Ù„ÙÙˆØªØ±Ø© Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠØ©' : 'E-Invoicing', desc: isArabic ? 'ØªÙˆÙ„ÙŠØ¯ QR ÙˆØªÙˆÙ‚ÙŠØ¹ XML ÙˆØ¥Ø±Ø³Ø§Ù„ ÙÙˆØ±ÙŠ Ù„Ù€ ZATCA' : 'QR generation, XML signing and instant ZATCA submission', borderColor: 'border-emerald-500/20', bgColor: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10' },
                { icon: Users, title: isArabic ? 'Ø§Ù„Ù…ÙˆØ§Ø±Ø¯ Ø§Ù„Ø¨Ø´Ø±ÙŠØ©' : 'HR & Payroll', desc: isArabic ? 'Ø§Ù„Ù…ÙˆØ¸ÙÙˆÙ† ÙˆØ§Ù„Ø±ÙˆØ§ØªØ¨ ÙˆÙ…Ù„ÙØ§Øª WPS ÙˆØ§Ù„ØªØ£Ù…ÙŠÙ†Ø§Øª' : 'Employees, payroll, WPS files and GOSI coverage', borderColor: 'border-blue-500/20', bgColor: 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10' },
                { icon: Package, title: isArabic ? 'Ø§Ù„Ù…Ø®Ø²ÙˆÙ†' : 'Inventory', desc: isArabic ? 'Ù…Ø³ØªÙˆØ¯Ø¹Ø§Øª Ù…ØªØ¹Ø¯Ø¯Ø© ÙˆØªÙ†Ø¨ÙŠÙ‡Ø§Øª Ù†ÙØ§Ø¯ Ø§Ù„Ù…Ø®Ø²ÙˆÙ†' : 'Multi-warehouse management with low stock alerts', borderColor: 'border-violet-500/20', bgColor: 'bg-gradient-to-br from-violet-500/10 to-purple-500/10' },
              ].map((item, i) => (
                <motion.div key={i} variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
                  className={`rounded-2xl border ${item.borderColor} ${item.bgColor} p-5`}>
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.05]">
                      <item.icon className="h-5 w-5 text-white/75" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{item.title}</p>
                      <p className="mt-1.5 text-sm text-white/45">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ LIVE DEMOS â”€â”€ */}
      <section id="demos" className="bg-slate-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              {isArabic ? 'ØªØ¬Ø±Ø¨Ø© Ø­ÙŠØ©' : 'Live Demos'}
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {isArabic ? 'Ø¬Ø±Ø¨ Ø§Ù„Ù†Ø¸Ø§Ù… Ø¨Ù†ÙØ³Ùƒ' : 'Experience It Yourself'}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
              {isArabic
                ? 'Ø§Ø®ØªØ± Ù†ÙˆØ¹ Ù†Ø´Ø§Ø·Ùƒ Ø§Ù„ØªØ¬Ø§Ø±ÙŠ ÙˆØ¬Ø±Ø¨ ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ù†Ø¸Ø§Ù… Ø§Ù„Ù…Ø®ØµØµØ© Ù…Ø¹ Ø¨ÙŠØ§Ù†Ø§Øª ØªØ¬Ø±ÙŠØ¨ÙŠØ©.'
                : 'Select your business type and explore the customized interface with demo data.'}
            </p>
            <div className="mt-6">
              <Link
                to="/solutions"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                {isArabic ? 'Ø§Ø³ØªÙƒØ´Ù ÙƒÙ„ Ø§Ù„Ø­Ù„ÙˆÙ„ Ø­Ø³Ø¨ Ù†Ø´Ø§Ø·Ùƒ' : 'Explore all industry solutions'}
                <ArrowRight className={`h-4 w-4 ${isArabic ? 'rotate-180' : ''}`} />
              </Link>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((demo, idx) => {
              const Icon = demo.icon === 'Building2' ? Building2 :
                           demo.icon === 'UtensilsCrossed' ? PieChart :
                           demo.icon === 'Sparkles' ? Sparkles :
                           demo.icon === 'Scissors' ? Sparkles :
                           demo.icon === 'Globe' ? Globe :
                           demo.icon === 'Truck' ? Truck :
                           demo.icon === 'Landmark' ? Landmark : Building2;

              return (
                <motion.div key={idx} variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                  <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-bl-full ${demo.glow} transition-transform group-hover:scale-110`} />
                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-6 relative h-40 w-full overflow-hidden rounded-2xl border border-slate-100">
                      <img src={demo.image} alt={isArabic ? demo.nameAr : demo.nameEn} loading="lazy" className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className={`absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${demo.accent} shadow-md`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <h3 className="mb-3 text-xl font-bold text-slate-900">
                      {isArabic ? demo.nameAr : demo.nameEn}
                    </h3>
                    <p className="mb-8 flex-grow text-slate-600">
                      {isArabic ? demo.taglineAr : demo.taglineEn}
                    </p>
                    
                    <Link
                      to="/login"
                      state={{ email: demo.demoEmail, password: 'password123' }}
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${demo.accent} py-3.5 font-semibold text-white shadow-md transition-all hover:shadow-lg`}
                    >
                      {isArabic ? 'Ø¯Ø®ÙˆÙ„ Ù„Ù„Ù†Ø³Ø®Ø© Ø§Ù„ØªØ¬Ø±ÙŠØ¨ÙŠØ©' : 'Launch Demo'}
                      <ArrowRight className={`h-5 w-5 ${isArabic ? 'rotate-180' : ''}`} />
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* â”€â”€ TESTIMONIALS â”€â”€ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {isArabic ? 'Ù…Ø§Ø°Ø§ ÙŠÙ‚ÙˆÙ„ Ø¹Ù…Ù„Ø§Ø¤Ù†Ø§' : 'Trusted by Saudi businesses'}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
              {isArabic ? 'Ø¢Ø±Ø§Ø¡ Ø­Ù‚ÙŠÙ‚ÙŠØ© Ù…Ù† Ø´Ø±ÙƒØ§Øª ØªØ¹Ù…Ù„ Ù…Ø¹ Maqder ÙŠÙˆÙ…ÙŠØ§Ù‹.' : 'Real feedback from companies using Maqder every day.'}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="flex-1 text-slate-700 leading-relaxed">{isArabic ? t.contentAr : t.content}</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-sm font-bold text-white">
                    {(isArabic ? t.nameAr : t.name).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{isArabic ? t.nameAr : t.name}</p>
                    <p className="text-xs text-slate-500">{isArabic ? t.roleAr : t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ CTA â”€â”€ */}
      <section className="pb-24 pt-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#030c06] p-10 text-white shadow-[0_40px_100px_-30px_rgba(0,0,0,0.7)] lg:p-16">
            <div className="pointer-events-none absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-400">
                  {isArabic ? 'Ø¬Ø§Ù‡Ø² Ù„Ù„Ø§Ù†Ø·Ù„Ø§Ù‚' : 'Ready to launch'}
                </p>
                <h2 className="mt-3 text-4xl font-black leading-tight lg:text-5xl">
                  {isArabic ? 'Ø§Ø¨Ø¯Ø£ Ø±Ø­Ù„ØªÙƒ Ù…Ø¹ Maqder Ø§Ù„ÙŠÙˆÙ…' : <>Start your Saudi ERP<br /><span className="text-emerald-400">journey today</span></>}
                </h2>
                <p className="mt-4 text-lg text-white/55">
                  {isArabic
                    ? 'Ø³Ø¬Ù‘Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø£Ùˆ Ø¬Ø±Ù‘Ø¨ Ø§Ù„Ù†Ø¸Ø§Ù… Ù…Ø¨Ø§Ø´Ø±Ø©Ù‹ ÙˆØ´Ø§Ù‡Ø¯ ÙƒÙŠÙ ØªØ¨Ø¯Ùˆ Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ø­Ø¯ÙŠØ«Ø© ÙÙŠ Ø§Ù„Ø³Ø¹ÙˆØ¯ÙŠØ©.'
                    : 'Log in or open the live demo and see what modern Saudi business management feels like.'}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 font-semibold text-white shadow-[0_0_40px_-8px_rgba(52,211,153,0.35)] transition-all hover:shadow-[0_0_50px_-8px_rgba(52,211,153,0.55)]"
                >
                  {isArabic ? 'Ø§Ø¨Ø¯Ø£ Ø§Ù„Ø¢Ù†' : 'Get started'}
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#demos"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('demos').scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
                >
                  <PlayCircle className="h-5 w-5 text-emerald-300" />
                  {isArabic ? 'Ø§Ù„ØªØ¬Ø§Ø±Ø¨ Ø§Ù„Ø­ÙŠØ©' : 'Live demos'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
