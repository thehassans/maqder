import { useState, useEffect, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Clock, Crown, X, AlertTriangle, Check, Shield, Zap, Star } from 'lucide-react'
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
      <div className={`relative px-4 py-2 text-sm ${expired ? 'bg-red-600' : urgent ? 'bg-amber-500' : 'bg-gradient-to-r from-[#0f3d2e] to-[#1a5d44]'} text-white`}>
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition hover:bg-white/25"
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => !paymentLoading && setShowUpgradeModal(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-dark-800">
            {/* Premium Header */}
            <div className="relative bg-gradient-to-br from-[#0f3d2e] via-[#1a5d44] to-[#0f3d2e] px-8 pt-8 pb-10 text-center text-white">
              <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15), transparent 60%)' }} />
              <button
                onClick={() => !paymentLoading && setShowUpgradeModal(false)}
                className="absolute top-4 right-4 rounded-full p-1.5 transition hover:bg-white/15"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Crown className="h-8 w-8 text-amber-300" />
              </div>
              <h3 className="text-2xl font-black tracking-tight">
                {isArabic ? 'الترقية إلى النسخة الكاملة' : 'Upgrade to Full Version'}
              </h3>
              <p className="mt-2 text-sm text-white/70">
                {isArabic ? 'اختر الخطة المناسبة لعملك' : 'Choose the plan that fits your business'}
              </p>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-7">
              {/* Plan Selection */}
              <div className="mb-5 space-y-2.5">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id
                  const price = selectedBilling === 'yearly' ? plan.priceYearly : plan.priceMonthly
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-[#0f3d2e] bg-[#0f3d2e]/[0.03] dark:bg-[#0f3d2e]/10'
                          : 'border-slate-200 dark:border-dark-600 hover:border-slate-300 dark:hover:border-dark-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                          isSelected ? 'border-[#0f3d2e] bg-[#0f3d2e]' : 'border-slate-300 dark:border-dark-500'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white">
                            {isArabic ? plan.nameAr : plan.nameEn}
                          </p>
                          {plan.priceMonthly > 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {price} SAR {selectedBilling === 'yearly' ? (isArabic ? '/سنة' : '/yr') : (isArabic ? '/شهر' : '/mo')}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {isArabic ? 'تواصل معنا' : 'Contact us'}
                            </p>
                          )}
                        </div>
                      </div>
                      {plan.id === 'professional' && (
                        <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                          {isArabic ? 'الأكثر شيوعاً' : 'POPULAR'}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Billing Cycle Toggle */}
              {selectedPlan !== 'enterprise' && (
                <div className="mb-5 flex items-center gap-2 rounded-2xl bg-slate-50 dark:bg-dark-700 p-1">
                  <button
                    onClick={() => setSelectedBilling('monthly')}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                      selectedBilling === 'monthly'
                        ? 'bg-white dark:bg-dark-800 text-[#0f3d2e] dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isArabic ? 'شهري' : 'Monthly'}
                  </button>
                  <button
                    onClick={() => setSelectedBilling('yearly')}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                      selectedBilling === 'yearly'
                        ? 'bg-white dark:bg-dark-800 text-[#0f3d2e] dark:text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {isArabic ? 'سنوي' : 'Yearly'}
                    <span className="ml-1.5 text-xs text-emerald-500">−17%</span>
                  </button>
                </div>
              )}

              {/* Amount Display */}
              {selectedPlan !== 'enterprise' && (
                <div className="mb-5 text-center">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">
                    {amount}
                  </span>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400"> SAR</span>
                  <span className="text-sm text-slate-400 dark:text-slate-500">
                    {selectedBilling === 'yearly' ? (isArabic ? '/سنة' : '/year') : (isArabic ? '/شهر' : '/month')}
                  </span>
                </div>
              )}

              {/* Error */}
              {paymentError && (
                <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {paymentError}
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleUpgrade}
                disabled={paymentLoading}
                className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#0f3d2e] to-[#1a5d44] px-6 py-4 font-bold text-white shadow-lg shadow-[#0f3d2e]/20 transition hover:shadow-xl hover:shadow-[#0f3d2e]/30 disabled:opacity-60"
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

              {/* Trust badges */}
              <div className="mt-5 flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  {isArabic ? 'دفع آمن' : 'Secure'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  {isArabic ? 'تفعيل فوري' : 'Instant access'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5" />
                  {isArabic ? 'Visa, Mada, Apple Pay' : 'Visa, Mada, Apple Pay'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
