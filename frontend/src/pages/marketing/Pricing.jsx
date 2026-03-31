import { useSelector } from 'react-redux'
import { CheckCircle2 } from 'lucide-react'
import { usePublicWebsiteSettings } from '../../lib/website'

export default function MarketingPricing() {
  const { language } = useSelector((state) => state.ui)
  const { data } = usePublicWebsiteSettings()
  const isArabic = language === 'ar'

  const currency = data?.pricing?.currency || 'SAR'
  const plans = data?.pricing?.plans || []

  return (
    <main className="py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{isArabic ? 'خطط الأسعار' : 'Pricing Plans'}</h1>
          <p className="mt-3 text-white/70 max-w-2xl mx-auto">
            {isArabic ? 'اختر الخطة المناسبة لحجم عملك ويمكنك الترقية في أي وقت.' : 'Choose the plan that fits your business. Upgrade anytime.'}
          </p>
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const name = isArabic ? plan.nameAr : plan.nameEn
            const features = isArabic ? plan.featuresAr : plan.featuresEn
            const monthly = Number(plan.priceMonthly || 0)
            const yearly = Number(plan.priceYearly || 0)

            return (
              <div
                key={plan.id}
                className={`rounded-3xl border p-7 bg-white/5 backdrop-blur-xl transition ${plan.popular ? 'border-emerald-300/40 shadow-2xl shadow-emerald-500/10' : 'border-white/10'}`}
              >
                {plan.popular && (
                  <div className="inline-flex px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold">
                    {isArabic ? 'الأكثر شيوعاً' : 'Most Popular'}
                  </div>
                )}

                <div className="mt-3 text-xl font-bold text-white">{name}</div>

                <div className="mt-4">
                  <div className="text-4xl font-extrabold text-white">
                    {monthly > 0 ? `${currency} ${monthly}` : isArabic ? 'مخصص' : 'Custom'}
                  </div>
                  <div className="text-sm text-white/60">{monthly > 0 ? (isArabic ? 'شهرياً' : 'per month') : (isArabic ? 'تواصل معنا' : 'Contact us')}</div>
                  {yearly > 0 && (
                    <div className="mt-2 text-xs text-white/60">{isArabic ? `سنويًا: ${currency} ${yearly}` : `Yearly: ${currency} ${yearly}`}</div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {(features || []).map((f, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm text-white/75">
                      <CheckCircle2 className="w-5 h-5 text-emerald-200 flex-shrink-0" />
                      <span className="leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>

                <a
                  href="/contact"
                  className={`mt-8 inline-flex w-full justify-center px-5 py-3 rounded-2xl font-semibold transition ${plan.popular ? 'bg-gradient-to-r from-[#244D33] to-[#1a3d28] shadow-lg shadow-[#244D33]/30' : 'bg-white/5 hover:bg-white/10 border border-white/10'}`}
                >
                  {isArabic ? 'تواصل معنا' : 'Get in touch'}
                </a>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
