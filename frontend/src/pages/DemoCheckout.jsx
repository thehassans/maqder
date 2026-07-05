import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown,
  Check,
  Shield,
  Zap,
  Star,
  Sparkles,
  ArrowRight,
  CreditCard,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  Globe,
  X,
} from 'lucide-react'
import api from '../lib/api'

const complianceLogos = [
  { src: '/ZATCA_Logo.svg', alt: 'ZATCA', cardClassName: 'w-48', imageClassName: 'scale-[1.35]' },
  { src: '/saudi-vision-2030-logo.webp', alt: 'Saudi Vision 2030', cardClassName: 'w-36', imageClassName: 'scale-100' },
  { src: '/saudi_tech_mob_en.svg', alt: 'Saudi Tech MOB', cardClassName: 'w-36', imageClassName: 'scale-100' },
]

export default function DemoCheckout() {
  const navigate = useNavigate()
  const { tenant } = useSelector((state) => state.auth)
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [selectedBilling, setSelectedBilling] = useState('monthly')
  const [paymentMethod, setPaymentMethod] = useState('creditcard')
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [moyasarKey, setMoyasarKey] = useState('')
  const [keyLoading, setKeyLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const moyasarFormRef = useRef(null)

  const isDemo = tenant?.isDemo === true
  const isUpgraded = tenant?.demoUpgraded === true

  useEffect(() => {
    setMounted(true)

    api.get('/public/website').then((res) => {
      const demo = res.data?.demo || {}
      console.log('[DemoCheckout] Website response demo:', { enabled: demo.moyasarEnabled, hasKey: !!demo.moyasarPublishableKey })
      if (demo.moyasarEnabled && demo.moyasarPublishableKey) {
        setMoyasarKey(demo.moyasarPublishableKey)
      }
      setKeyLoading(false)
    }).catch((err) => {
      console.error('[DemoCheckout] Failed to fetch website settings:', err)
      setKeyLoading(false)
    })

    if (!isDemo || isUpgraded) {
      navigate('/app/dashboard', { replace: true })
      return
    }
  }, [isDemo, isUpgraded, navigate])

  const plans = useMemo(
    () => [
      { id: 'starter', nameEn: 'Starter', nameAr: 'البداية', priceMonthly: 299, priceYearly: 2990 },
      { id: 'professional', nameEn: 'Professional', nameAr: 'الاحترافية', priceMonthly: 699, priceYearly: 6990 },
      { id: 'enterprise', nameEn: 'Enterprise', nameAr: 'المؤسسات', priceMonthly: 0, priceYearly: 0 },
    ],
    []
  )

  const selectedPlanObj = plans.find((p) => p.id === selectedPlan) || plans[1]
  const amount = selectedBilling === 'yearly' ? selectedPlanObj.priceYearly : selectedPlanObj.priceMonthly

  const initMoyasarForm = useCallback(() => {
    if (!window.Moyasar || !moyasarKey) {
      setPaymentError(isArabic ? 'بوابة الدفع غير متهيئة' : 'Payment gateway not configured')
      return
    }

    const amountInHalalas = Math.round(amount * 100)
    const callbackUrl = `${window.location.origin}/api/payments/callback`

    const methods = paymentMethod === 'applepay' ? ['applepay'] : ['creditcard']

    try {
      window.Moyasar.init({
        element: '#mysr-form',
        amount: amountInHalalas,
        currency: 'SAR',
        description: `Maqder ERP - ${selectedPlan} plan (${selectedBilling}) upgrade for ${tenant?.demoEmail || tenant?.name || ''}`,
        publishable_api_key: moyasarKey,
        callback_url: callbackUrl,
        methods,
        metadata: {
          tenantId: String(tenant?._id || ''),
          demoEmail: tenant?.demoEmail || '',
          plan: selectedPlan,
          billingCycle: selectedBilling,
        },
        language: isArabic ? 'ar' : 'en',
        on_failure: async function (error) {
          console.error('[Moyasar] Payment failed:', error)
          setPaymentError(String(error))
          setShowPaymentForm(false)
        },
      })
    } catch (err) {
      console.error('[Moyasar] Init error:', err)
      setPaymentError(err.message || 'Failed to initialize payment form')
      setShowPaymentForm(false)
    }
  }, [moyasarKey, amount, paymentMethod, selectedPlan, selectedBilling, tenant, isArabic])

  const handleUpgrade = async () => {
    if (selectedPlan === 'enterprise') {
      window.open('mailto:sales@maqder.com?subject=Enterprise%20Plan%20Inquiry', '_blank')
      return
    }

    if (keyLoading) {
      return
    }

    if (!moyasarKey) {
      setPaymentError(isArabic ? 'بوابة الدفع غير متهيئة. يرجى المحاولة لاحقاً.' : 'Payment gateway not configured. Please try again later.')
      return
    }

    setPaymentError('')
    setShowPaymentForm(true)
  }

  useEffect(() => {
    if (showPaymentForm && moyasarKey) {
      const timer = setTimeout(() => {
        initMoyasarForm()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [showPaymentForm, moyasarKey, initMoyasarForm])

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white dark:bg-dark-800">
      {/* Left Panel — Branding & Features */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f3d2e] via-[#1a5d44] to-[#0a2a1f]" />
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15), transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08), transparent 50%)',
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3 -ml-4 -mt-4 mb-4">
            <div className="w-full h-40 flex items-center justify-start">
              <img
                src="/maqdernewlogo.webp"
                alt="Maqder"
                className="h-full w-auto object-contain object-left scale-110 origin-left"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-4">
                {isArabic ? 'الترقية إلى النسخة الكاملة' : 'Upgrade to Full Version'}
              </h1>
              <p className="text-lg lg:text-xl text-white/70 max-w-md">
                {isArabic
                  ? 'افتح كل الميزات — الفوترة، الموارد البشرية، المخزون، التقارير والمزيد.'
                  : 'Unlock all features — invoicing, HR, inventory, reports, and more.'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: Shield, text: isArabic ? 'متوافق مع فاتورة المرحلة الثانية' : 'ZATCA Phase 2 Compliant' },
                { icon: Zap, text: isArabic ? 'تفعيل فوري بعد الدفع' : 'Instant activation after payment' },
                { icon: Star, text: isArabic ? 'دعم كامل للغة العربية' : 'Full Arabic RTL support' },
                { icon: Sparkles, text: isArabic ? 'جميع الميزات بدون قيود' : 'All features, no limits' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20"
                >
                  <feature.icon className="w-5 h-5 text-green-300" />
                  <span className="font-medium">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-center text-xs text-white/50 mb-4">
              {isArabic ? 'معتمد من' : 'Trusted & Certified'}
            </p>
            <div className="flex flex-wrap items-center justify-start gap-4">
              {complianceLogos.map((logo) => (
                <div
                  key={logo.alt}
                  className={`flex h-20 ${logo.cardClassName} items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3`}
                >
                  <img src={logo.src} alt={logo.alt} className={`max-h-full max-w-full object-contain ${logo.imageClassName}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="text-white/50 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
            <div>
              2024 Maqder ERP. {isArabic ? 'صنع بواسطة Eastern Workforce Solutions Establishment' : 'Built by Eastern Workforce Solutions Establishment'}
            </div>
            <div className="flex items-center gap-4 text-white/70">
              <a href="tel:+966596775485" title="Call Us" className="hover:text-white transition-colors">
                <Phone className="w-4 h-4" />
              </a>
              <a href="https://wa.me/966596775485" target="_blank" rel="noreferrer" title="WhatsApp" className="hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="mailto:sales@maqder.com" title="Email Us" className="hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Checkout */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-gradient-to-br from-gray-50 to-white dark:from-dark-900 dark:to-dark-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Mobile logo */}
          <div className="md:hidden flex items-center justify-center mb-6">
            <img src="/maqderlogolandingpage.webp" alt="Maqder" className="h-24 w-auto object-contain" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f3d2e] to-[#1a5d44] shadow-lg shadow-[#0f3d2e]/20">
              <Crown className="h-8 w-8 text-amber-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {isArabic ? 'اختر خطتك' : 'Choose Your Plan'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {isArabic ? 'خطوة واحدة تفصلك عن النسخة الكاملة' : 'One step away from the full version'}
            </p>
          </div>

          {/* Plan cards */}
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id
              const price = selectedBilling === 'yearly' ? plan.priceYearly : plan.priceMonthly
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative flex flex-col rounded-2xl border-2 p-4 text-left transition-all ${
                    isSelected
                      ? 'border-[#0f3d2e] bg-[#0f3d2e]/[0.03] dark:bg-[#0f3d2e]/10 shadow-md'
                      : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                  }`}
                >
                  {plan.id === 'professional' && (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-3 py-0.5 text-[10px] font-bold text-white shadow-sm">
                      {isArabic ? 'الأكثر شيوعاً' : 'POPULAR'}
                    </span>
                  )}
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${
                        isSelected ? 'border-[#0f3d2e] bg-[#0f3d2e]' : 'border-gray-300 dark:border-dark-500'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{isArabic ? plan.nameAr : plan.nameEn}</p>
                  </div>
                  {plan.priceMonthly > 0 ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="text-lg font-black text-gray-900 dark:text-white">{price}</span> SAR
                      <span className="ml-0.5">
                        {selectedBilling === 'yearly' ? (isArabic ? '/سنة' : '/yr') : (isArabic ? '/شهر' : '/mo')}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{isArabic ? 'تواصل معنا' : 'Contact us'}</p>
                  )}
                </button>
              )
            })}
          </div>

          {/* Billing cycle toggle */}
          {selectedPlan !== 'enterprise' && (
            <div className="mb-6 flex items-center gap-2 rounded-2xl bg-gray-50 dark:bg-dark-700 p-1">
              <button
                onClick={() => setSelectedBilling('monthly')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  selectedBilling === 'monthly'
                    ? 'bg-white dark:bg-dark-800 text-[#0f3d2e] dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {isArabic ? 'شهري' : 'Monthly'}
              </button>
              <button
                onClick={() => setSelectedBilling('yearly')}
                className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                  selectedBilling === 'yearly'
                    ? 'bg-white dark:bg-dark-800 text-[#0f3d2e] dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {isArabic ? 'سنوي' : 'Yearly'}
                <span className="ml-1.5 text-xs text-emerald-500">−17%</span>
              </button>
            </div>
          )}

          {/* Amount display */}
          {selectedPlan !== 'enterprise' && (
            <div className="mb-6 flex items-end justify-center gap-1 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-700 dark:to-dark-600 py-6">
              <span className="text-5xl font-black tracking-tight text-gray-900 dark:text-white">{amount}</span>
              <span className="pb-1.5 text-lg font-bold text-gray-500 dark:text-gray-400">SAR</span>
              <span className="pb-1.5 text-sm text-gray-400 dark:text-gray-500">
                {selectedBilling === 'yearly' ? (isArabic ? '/سنة' : '/year') : (isArabic ? '/شهر' : '/month')}
              </span>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="mb-5">
            <label className="mb-3 block text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isArabic ? 'اختر طريقة الدفع' : 'Select Payment Method'}
            </label>
            <div className="grid grid-cols-3 gap-3">
              {/* Credit Card */}
              <button
                onClick={() => setPaymentMethod('creditcard')}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-all ${
                  paymentMethod === 'creditcard'
                    ? 'border-[#0f3d2e] bg-[#0f3d2e]/[0.03] dark:bg-[#0f3d2e]/10 shadow-md'
                    : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3d2e] to-[#1a5d44] text-white">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="text-xs font-bold text-gray-800 dark:text-white">
                  {isArabic ? 'بطاقة' : 'Card'}
                </span>
              </button>

              {/* Apple Pay */}
              <button
                onClick={() => setPaymentMethod('applepay')}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-all ${
                  paymentMethod === 'applepay'
                    ? 'border-[#0f3d2e] bg-[#0f3d2e]/[0.03] dark:bg-[#0f3d2e]/10 shadow-md'
                    : 'border-gray-200 dark:border-dark-600 hover:border-gray-300 dark:hover:border-dark-500'
                }`}
              >
                <img src="/applepay.webp" alt="Apple Pay" className="h-10 w-auto object-contain" />
                <span className="text-xs font-bold text-gray-800 dark:text-white">Apple Pay</span>
              </button>

              {/* STC Pay */}
              <div className="relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 dark:border-dark-600 p-3 opacity-60 cursor-not-allowed">
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-gray-500 px-2 py-0.5 text-[9px] font-bold text-white">
                  {isArabic ? 'قريباً' : 'Soon'}
                </span>
                <img src="/stcpay.webp" alt="STC Pay" className="h-10 w-auto object-contain" />
                <span className="text-xs font-bold text-gray-800 dark:text-white">STC Pay</span>
              </div>
            </div>
          </div>

          {/* Error */}
          {paymentError && (
            <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
              {paymentError}
            </div>
          )}

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={paymentLoading || keyLoading || (!moyasarKey && selectedPlan !== 'enterprise')}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#0f3d2e] to-[#1a5d44] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#0f3d2e]/20 transition hover:shadow-xl hover:shadow-[#0f3d2e]/30 disabled:opacity-60"
          >
            {paymentLoading || keyLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isArabic ? 'جاري المعالجة...' : 'Processing...'}
              </>
            ) : selectedPlan === 'enterprise' ? (
              <>
                <Crown className="h-5 w-5" />
                {isArabic ? 'تواصل مع المبيعات' : 'Contact Sales'}
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                {isArabic ? 'ادفع الآن' : 'Pay Now'}
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              {isArabic ? 'دفع آمن' : 'Secure'}
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              {isArabic ? 'تفعيل فوري' : 'Instant access'}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Visa, Mada, Apple Pay
            </span>
          </div>
        </motion.div>
      </div>

      {/* Moyasar Payment Form Modal */}
      <AnimatePresence>
        {showPaymentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPaymentForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-3xl bg-white dark:bg-dark-800 p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isArabic ? 'إتمام الدفع' : 'Complete Payment'}
                </h3>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mb-4 rounded-xl bg-gray-50 dark:bg-dark-700 px-4 py-3 text-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{amount}</span>
                <span className="text-sm font-bold text-gray-500 dark:text-gray-400 ml-1">SAR</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                  {selectedBilling === 'yearly' ? (isArabic ? '/سنة' : '/year') : (isArabic ? '/شهر' : '/month')}
                </span>
              </div>
              <div id="mysr-form" ref={moyasarFormRef}></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
