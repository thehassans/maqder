import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  ArrowRight, Building2, UtensilsCrossed, Sparkles, Scissors, Globe, Truck, Landmark,
} from 'lucide-react'
import { SOLUTIONS } from '../../lib/solutionsContent'

const ICONS = { Building2, UtensilsCrossed, Sparkles, Scissors, Globe, Truck, Landmark }

const fade = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } }

export default function MarketingSolutions() {
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  return (
    <main className="bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#030c06] text-white">
        <div className="pointer-events-none absolute -top-32 left-1/4 h-[600px] w-[600px] rounded-full bg-emerald-500/[0.08] blur-[130px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              <Sparkles className="h-4 w-4" />
              {isArabic ? 'حلول مصممة لنشاطك' : 'Solutions built for your industry'}
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
              {isArabic ? 'منصة واحدة. كل أنواع الأعمال.' : 'One platform. Every kind of business.'}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-white/55">
              {isArabic
                ? 'اختر نشاطك التجاري واكتشف تجربة مصممة خصيصاً له — مع امتثال ZATCA كامل.'
                : 'Pick your industry and explore a tailor-made experience — with full ZATCA compliance baked in.'}
            </p>
          </motion.div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s, idx) => {
              const Icon = ICONS[s.icon] || Building2
              return (
                <motion.div key={s.slug} variants={fade} initial="initial" whileInView="animate" viewport={{ once: true }} transition={{ duration: 0.45, delay: (idx % 3) * 0.08 }}>
                  <Link
                    to={`/solutions/${s.slug}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className={`absolute -right-10 -top-10 h-32 w-32 rounded-full ${s.glow} blur-2xl transition-transform group-hover:scale-125`} />
                    <div className={`relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.accent} shadow-md`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="relative text-xl font-bold text-slate-900">{isArabic ? s.nameAr : s.nameEn}</h3>
                    <p className="relative mt-3 flex-grow text-slate-600">{isArabic ? s.taglineAr : s.taglineEn}</p>
                    <span className="relative mt-6 inline-flex items-center gap-2 font-semibold text-emerald-700">
                      {isArabic ? 'اكتشف المزيد' : 'Explore'}
                      <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isArabic ? 'rotate-180' : ''}`} />
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </main>
  )
}
