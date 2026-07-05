import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Mail, Sparkles, CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react'
import { demoSignup } from '../../store/slices/authSlice'
import { getBusinessTypeOptions } from '../../lib/businessTypes'

export default function TrialSignup() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const { isLoading, error } = useSelector((state) => state.auth)
  const isArabic = language === 'ar'

  const [email, setEmail] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [localError, setLocalError] = useState('')

  const businessOptions = getBusinessTypeOptions(language)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')

    if (!email.trim()) {
      setLocalError(isArabic ? 'البريد الإلكتروني مطلوب' : 'Email is required')
      return
    }

    if (!email.trim().toLowerCase().endsWith('@gmail.com')) {
      setLocalError(isArabic ? 'يجب استخدام بريد Gmail' : 'Please use a Gmail address')
      return
    }

    if (!selectedType) {
      setLocalError(isArabic ? 'اختر نوع نشاطك' : 'Please select your business type')
      return
    }

    const result = await dispatch(demoSignup({ email: email.trim().toLowerCase(), businessType: selectedType }))
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/app/dashboard')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl border border-[#0f3d2e]/20 bg-white shadow-xl shadow-[#0f3d2e]/10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f3d2e] to-[#1a5d44] px-6 py-5 text-white sm:px-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <div>
              <h3 className="text-xl font-bold">
                {isArabic ? 'ابدأ تجربتك المجانية لمدة 7 أيام' : 'Start Your 7-Day Free Trial'}
              </h3>
              <p className="mt-0.5 text-sm text-white/80">
                {isArabic ? 'بريد Gmail واحد فقط — تجربة كاملة بكل الميزات' : 'One Gmail only — full access to all features'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8">
          {/* Business Type Selection */}
          <div className="mb-6">
            <label className="mb-3 block text-sm font-semibold text-slate-700">
              {isArabic ? 'اختر نوع نشاطك التجاري' : 'Select Your Business Type'}
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {businessOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedType(option.id)}
                  className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                    selectedType === option.id
                      ? 'border-[#0f3d2e] bg-[#0f3d2e]/[0.04] shadow-md shadow-[#0f3d2e]/10'
                      : 'border-slate-200 bg-white hover:border-[#0f3d2e]/40 hover:bg-[#0f3d2e]/[0.02]'
                  }`}
                >
                  {selectedType === option.id && (
                    <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-[#0f3d2e]" />
                  )}
                  <span className="text-sm font-bold text-slate-800">{option.label}</span>
                  <span className="text-xs text-slate-500 line-clamp-2">{option.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Email Input */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              {isArabic ? 'بريد Gmail' : 'Gmail Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@gmail.com"
                className="w-full rounded-xl border border-slate-300 py-3.5 pl-11 pr-4 text-sm outline-none transition-all focus:border-[#0f3d2e] focus:ring-2 focus:ring-[#0f3d2e]/20"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Error Display */}
          <AnimatePresence>
            {(localError || error) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {localError || (typeof error === 'string' ? error : error?.message || 'An error occurred')}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="group inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-[#0f3d2e] to-[#1a5d44] px-6 py-4 font-semibold text-white shadow-lg shadow-[#0f3d2e]/20 transition-all hover:shadow-xl hover:shadow-[#0f3d2e]/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isArabic ? 'جاري إنشاء حسابك...' : 'Creating your account...'}
              </>
            ) : (
              <>
                {isArabic ? 'ابدأ التجربة المجانية' : 'Start Free Trial'}
                <ArrowRight className={`h-5 w-5 transition-transform group-hover:translate-x-0.5 ${isArabic ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>

          {/* Features list */}
          <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-slate-500 sm:grid-cols-3">
            {[
              isArabic ? 'وصول كامل' : 'Full access',
              isArabic ? '7 أيام مجاناً' : '7 days free',
              isArabic ? 'بدون بطاقة ائتمان' : 'No credit card',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#0f3d2e]" />
                {feature}
              </div>
            ))}
          </div>
        </form>
      </motion.div>
    </div>
  )
}
