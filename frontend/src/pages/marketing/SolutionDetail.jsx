import { motion } from 'framer-motion'
import { Link, useParams, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowRight, ShieldCheck, CheckCircle2, PlayCircle,
  Building2, UtensilsCrossed, Sparkles, Scissors, Globe, Truck, Landmark,
  Package, FileText, BarChart3, Coffee, CreditCard, Receipt, Zap, ClipboardList,
  Calculator, Users,
} from 'lucide-react'
import { getSolution, SOLUTIONS } from '../../lib/solutionsContent'

const ICONS = {
  Building2, UtensilsCrossed, Sparkles, Scissors, Globe, Truck, Landmark,
  Package, FileText, BarChart3, Coffee, CreditCard, Receipt, Zap, ClipboardList,
  Calculator, Users, CheckCircle2,
}

const fade = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } }

export default function SolutionDetail() {
  const { slug } = useParams()
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'
  const solution = getSolution(slug)

  if (!solution) return <Navigate to="/solutions" replace />

  const Icon = ICONS[solution.icon] || Building2
  const others = SOLUTIONS.filter((s) => s.slug !== solution.slug).slice(0, 3)

  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#030c06] text-white">
        <div className={`pointer-events-none absolute -top-32 -left-20 h-[600px] w-[600px] rounded-full ${solution.glow} blur-[130px]`} />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <Link to="/solutions" className="inline-flex items-center gap-2 text-sm text-emerald-300/80 transition hover:text-emerald-200">
                <ArrowRight className={`h-4 w-4 ${isArabic ? '' : 'rotate-180'}`} />
                {isArabic ? 'كل الحلول' : 'All solutions'}
              </Link>
              <div className={`mt-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${solution.accent} shadow-lg`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                {isArabic ? solution.nameAr : solution.nameEn}
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/60">
                {isArabic ? solution.heroAr : solution.heroEn}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/login"
                  state={{ email: solution.demoEmail, password: 'password123' }}
                  className="group inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-7 py-4 font-semibold text-white shadow-[0_8px_32px_-8px_rgba(52,211,153,0.45)] transition-all hover:shadow-[0_12px_40px_-8px_rgba(52,211,153,0.6)]"
                >
                  <PlayCircle className="h-5 w-5" />
                  {isArabic ? 'جرب النسخة الحية' : 'Launch live demo'}
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-white/12 bg-white/[0.06] px-7 py-4 font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
                >
                  {isArabic ? 'تواصل معنا' : 'Talk to sales'}
                  <ArrowRight className={`h-5 w-5 ${isArabic ? 'rotate-180' : ''}`} />
                </Link>
              </div>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                {isArabic ? 'متوافق مع ZATCA المرحلة الثانية' : 'ZATCA Phase 2 compliant'}
              </div>
            </motion.div>

            {/* Feature preview card */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15 }} className="relative">
              <div className={`pointer-events-none absolute inset-0 scale-110 rounded-3xl ${solution.glow} blur-3xl`} />
              <div className="relative grid gap-3 rounded-[2rem] border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-sm sm:grid-cols-2">
                {solution.features.map((f, i) => {
                  const FIcon = ICONS[f.icon] || CheckCircle2
                  return (
                    <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                        <FIcon className="h-5 w-5 text-emerald-300" />
                      </div>
                      <p className="font-bold text-white">{isArabic ? f.titleAr : f.titleEn}</p>
                      <p className="mt-1.5 text-sm text-white/45">{isArabic ? f.descAr : f.descEn}</p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Features detail */}
      <section className="bg-slate-50/70 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {isArabic ? 'كل ما تحتاجه لإدارة نشاطك' : 'Everything you need to run it'}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">{isArabic ? solution.taglineAr : solution.taglineEn}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {solution.features.map((f, i) => {
              const FIcon = ICONS[f.icon] || CheckCircle2
              return (
                <motion.div key={i} variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-emerald-300/60 hover:shadow-xl">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${solution.accent} text-white shadow-md`}>
                    <FIcon className="h-5 w-5" />
                  </div>
                  <p className="font-bold text-slate-950">{isArabic ? f.titleAr : f.titleEn}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{isArabic ? f.descAr : f.descEn}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <h2 className="text-4xl font-black tracking-tight sm:text-5xl">{isArabic ? 'كيف يعمل' : 'How it works'}</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {solution.workflow.map((step, i) => (
              <motion.div key={i} variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 }}
                className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7">
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${solution.accent} text-lg font-black text-white`}>
                  {i + 1}
                </div>
                <p className="text-lg font-bold text-white">{isArabic ? step.titleAr : step.titleEn}</p>
                <p className="mt-2 text-sm text-white/45">{isArabic ? step.descAr : step.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Other solutions */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{isArabic ? 'حلول أخرى' : 'Other solutions'}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {others.map((s) => {
              const OIcon = ICONS[s.icon] || Building2
              return (
                <Link key={s.slug} to={`/solutions/${s.slug}`}
                  className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.accent} text-white shadow-md`}>
                    <OIcon className="h-6 w-6" />
                  </div>
                  <p className="font-bold text-slate-900">{isArabic ? s.nameAr : s.nameEn}</p>
                  <p className="mt-2 flex-grow text-sm text-slate-500">{isArabic ? s.taglineAr : s.taglineEn}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    {isArabic ? 'اكتشف' : 'Explore'}
                    <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isArabic ? 'rotate-180' : ''}`} />
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-[#030c06] p-10 text-white shadow-2xl lg:p-16">
            <div className={`pointer-events-none absolute -top-24 left-1/3 h-96 w-96 rounded-full ${solution.glow} blur-[100px]`} />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black leading-tight lg:text-4xl">
                  {isArabic ? `جاهز لتجربة ${solution.nameAr}؟` : `Ready to try ${solution.nameEn}?`}
                </h2>
                <p className="mt-4 text-lg text-white/55">
                  {isArabic ? 'افتح النسخة التجريبية الآن وشاهدها تعمل ببياناتك.' : 'Open the live demo and see it in action with sample data.'}
                </p>
              </div>
              <Link
                to="/login"
                state={{ email: solution.demoEmail, password: 'password123' }}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 font-semibold text-white shadow-[0_0_40px_-8px_rgba(52,211,153,0.4)] transition-all hover:shadow-[0_0_50px_-8px_rgba(52,211,153,0.6)]"
              >
                <PlayCircle className="h-5 w-5" />
                {isArabic ? 'ابدأ التجربة' : 'Launch demo'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
