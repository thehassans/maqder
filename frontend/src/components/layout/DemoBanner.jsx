import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Clock, Crown, X, AlertTriangle } from 'lucide-react'
import api from '../../lib/api'

function formatTimeRemaining(ms) {
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true }
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds, expired: false }
}

export default function DemoBanner() {
  const dispatch = useDispatch()
  const { tenant, token } = useSelector((state) => state.auth)
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  const [timeLeft, setTimeLeft] = useState(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [selectedBilling, setSelectedBilling] = useState('monthly')
  const [moyasarKey, setMoyasarKey] = useState('')
  const [showBanner, setShowBanner] = useState(true)

  const isDemo = tenant?.isDemo === true
  const trialEndsAt = tenant?.demoTrialEndsAt || tenant?.subscription?.endDate
  const isUpgraded = tenant?.demoUpgraded === true

  useEffect(() => {
    if (!isDemo || !trialEndsAt) return

    const updateTimer = () => {
      const remaining = new Date(trialEndsAt).getTime() - Date.now()
      setTimeLeft(formatTimeRemaining(remaining))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [isDemo, trialEndsAt])

  useEffect(() => {
    if (!isDemo) return
    api.get('/public/website').then((res) => {
      const moyasarEnabled = res.data?.demo?.moyasarEnabled
      if (moyasarEnabled) {
        setMoyasarKey(res.data.demo.moyasarPublishableKey || '')
      }
    }).catch(() => {})
  }, [isDemo])

  const plans = useMemo(() => [
    {
      id: 'starter',
      nameEn: 'Starter',
      nameAr: 'البداية',
      priceMonthly: 299,
      priceYearly: 2990,
    },
    {
      id: 'professional',
      nameEn: 'Professional',
      nameAr: 'الاحترافية',
      priceMonthly: 699,
      priceYearly: 6990,
    },
    {
      id: 'enterprise',
      nameEn: 'Enterprise',
      nameAr: 'المؤسسات',
      priceMonthly: 0,
      priceYearly: 0,
    },
  ], [])

  const selectedPlanObj = plans.find((p) => p.id === selectedPlan) || plans[1]
  const amount = selectedBilling === 'yearly' ? selectedPlanObj.priceYearly : selectedPlanObj.priceMonthly

  const handleUpgrade = async () => {
    if (selectedPlan === 'enterprise') {
      window.open('mailto:sales@maqder.com?subject=Enterprise%20Plan%20Inquiry', '_blank')
      return
    }

    setPaymentLoading(true)
    setPaymentError('')

    try {
      const { data } = await api.post('/payments/create-payment', {
        amount,
        currency: 'SAR',
        plan: selectedPlan,
        billingCycle: selectedBilling,
      })

      if (data?.id && moyasarKey) {
        const moyasarUrl = `https://checkout.moyasar.com/payment/${data.id}?key=${moyasarKey}`
        window.location.href = moyasarUrl
      } else if (data?.callbackUrl) {
        window.location.href = data.callbackUrl
      } else {
        setPaymentError(isArabic ? 'تعذر إنشاء عملية الدفع' : 'Could not initiate payment')
      }
    } catch (error) {
      setPaymentError(error.response?.data?.error || (isArabic ? 'حدث خطأ' : 'An error occurred'))
    } finally {
      setPaymentLoading(false)
    }
  }

  if (!isDemo || isUpgraded || !showBanner) return null

  const expired = timeLeft?.expired
  const urgent = timeLeft && !expired && timeLeft.days === 0

  return (
    <>
      {/* Demo Banner */}
      <div className={`relative px-4 py-2 text-sm ${expired ? 'bg-red-600' : urgent ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600'} text-white`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {expired ? (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            ) : (
              <Clock className="h-4 w-4 shrink-0" />
            )}
            <span className="truncate font-medium">
              {expired
                ? (isArabic ? 'انتهت فترة التجربة — اشترك الآن للمتابعة' : 'Trial expired — Subscribe now to continue')
                : (
                  <>
                    {isArabic ? 'وضع تجريبي — متبقي: ' : 'Demo mode — Time left: '}
                    {timeLeft && (
                      <span className="font-bold tabular-nums">
                        {timeLeft.days > 0 && `${timeLeft.days}d `}
                        {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                      </span>
                    )}
                  </>
                )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition hover:bg-white/30"
            >
              <Crown className="h-3.5 w-3.5" />
              {isArabic ? 'احصل على النسخة الكاملة' : 'Get Full Version'}
            </button>
            <button
              onClick={() => setShowBanner(false)}
              className="rounded-lg p-1 transition hover:bg-white/20"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !paymentLoading && setShowUpgradeModal(false)} />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-800">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6" />
                  <div>
                    <h3 className="text-lg font-bold">
                      {isArabic ? 'الترقية إلى النسخة الكاملة' : 'Upgrade to Full Version'}
                    </h3>
                    <p className="text-sm text-white/80">
                      {isArabic ? 'اختر الخطة المناسبة لعملك' : 'Choose the plan that fits your business'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => !paymentLoading && setShowUpgradeModal(false)}
                  className="rounded-lg p-1.5 transition hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Plan Selection */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`rounded-xl border-2 p-3 text-center transition-all ${
                      selectedPlan === plan.id
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-slate-200 dark:border-dark-600 hover:border-emerald-300'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {isArabic ? plan.nameAr : plan.nameEn}
                    </p>
                    {plan.priceMonthly > 0 ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {selectedBilling === 'yearly' ? `${plan.priceYearly} SAR/yr` : `${plan.priceMonthly} SAR/mo`}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {isArabic ? 'تواصل معنا' : 'Contact us'}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {/* Billing Cycle Toggle */}
              {selectedPlan !== 'enterprise' && (
                <div className="mb-4 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedBilling('monthly')}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                      selectedBilling === 'monthly'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-slate-400'
                    }`}
                  >
                    {isArabic ? 'شهري' : 'Monthly'}
                  </button>
                  <button
                    onClick={() => setSelectedBilling('yearly')}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                      selectedBilling === 'yearly'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-dark-700 dark:text-slate-400'
                    }`}
                  >
                    {isArabic ? 'سنوي' : 'Yearly'}
                    <span className="ml-1 text-xs text-emerald-500">−17%</span>
                  </button>
                </div>
              )}

              {/* Amount Display */}
              {selectedPlan !== 'enterprise' && (
                <div className="mb-4 rounded-xl bg-slate-50 dark:bg-dark-700 px-4 py-3 text-center">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {amount} <span className="text-sm font-normal">SAR</span>
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    {selectedBilling === 'yearly' ? (isArabic ? '/سنة' : '/year') : (isArabic ? '/شهر' : '/month')}
                  </span>
                </div>
              )}

              {/* Error */}
              {paymentError && (
                <div className="mb-3 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
                  {paymentError}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={paymentLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
              >
                {paymentLoading ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {isArabic ? 'جاري المعالجة...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    <Crown className="h-5 w-5" />
                    {selectedPlan === 'enterprise'
                      ? (isArabic ? 'تواصل مع المبيعات' : 'Contact Sales')
                      : (isArabic ? 'ادفع الآن' : 'Pay Now')}
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                {isArabic ? 'دفع آمن عبر Moyasar — Visa, Mastercard, Mada, Apple Pay' : 'Secure payment via Moyasar — Visa, Mastercard, Mada, Apple Pay'}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
