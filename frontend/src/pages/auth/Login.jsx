import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Loader2, Mail, Lock, Building2, ArrowRight, Shield, Zap, Globe } from 'lucide-react'
import { login, clearError } from '../../store/slices/authSlice'
import { setLanguage } from '../../store/slices/uiSlice'
import { useTranslation } from '../../lib/translations'

export default function Login() {
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state) => state.auth)
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = (data) => {
    dispatch(clearError())
    dispatch(login(data))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Solid Background */}
        <div className="absolute inset-0 bg-[#1a3d28]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-lg">
              <img src="/maqder-logo.png" alt="Maqder" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Maqder ERP</span>
          </div>

          {/* Hero */}
          <div className="space-y-8">
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-4">
                {language === 'ar' ? 'نظام ERP متكامل' : 'Complete ERP System'}
                <br />
                <span className="text-white/80">{language === 'ar' ? 'متوافق مع السعودية' : 'Saudi Compliant'}</span>
              </h1>
              <p className="text-xl text-white/70 max-w-md">
                {language === 'ar' 
                  ? 'الفوترة الإلكترونية، الموارد البشرية، المخزون - كل شيء في مكان واحد'
                  : 'E-Invoicing, HR & Payroll, Inventory - All in one platform'}
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 gap-4">
              {[
                { icon: Shield, text: language === 'ar' ? 'متوافق مع فاتورة المرحلة الثانية' : 'ZATCA Phase 2 Compliant' },
                { icon: Zap, text: language === 'ar' ? 'حسابات GOSI و EOSB التلقائية' : 'Auto GOSI & EOSB Calculations' },
                { icon: Globe, text: language === 'ar' ? 'دعم كامل للغة العربية' : 'Full Arabic RTL Support' },
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

          {/* Footer */}
          <div className="text-white/50 text-sm">
            © 2024 Maqder ERP. {language === 'ar' ? 'صُنع بـ ❤️ للشركات السعودية بواسطة' : 'Built with ❤️ for Saudi businesses by'}{' '}
            <a href="tel:+966595930045" className="text-white/70 hover:text-white underline transition-colors">+966595930045</a>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Language Toggle */}
          <div className="flex justify-end mb-8">
            <button
              onClick={() => dispatch(setLanguage(language === 'ar' ? 'en' : 'ar'))}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-all text-sm font-medium text-gray-600"
            >
              <Globe className="w-4 h-4" />
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src="/maqder-logo.png" alt="Maqder" className="w-14 h-14 object-contain" />
            <span className="text-2xl font-bold text-gray-900">Maqder ERP</span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-start mb-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('welcomeBack')} 👋
            </h1>
            <p className="text-gray-500 text-lg">
              {t('signInToContinue')}
            </p>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('email')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' }
                  })}
                  className={`w-full h-14 ps-12 pe-4 bg-white border-2 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#244D33]'} rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#244D33]/10 transition-all`}
                  placeholder="admin@zatca-erp.com"
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-4 pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password', { required: 'Password is required' })}
                  className={`w-full h-14 ps-12 pe-14 bg-white border-2 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-gray-200 focus:border-[#244D33]'} rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-[#244D33]/10 transition-all`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center pe-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-sm text-red-500 font-medium">{errors.password.message}</p>}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-[#244D33] peer-checked:border-[#244D33] transition-all" />
                  <svg className="absolute top-0.5 left-0.5 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{t('rememberMe')}</span>
              </label>
              <a href="#" className="text-sm text-[#244D33] hover:text-[#1e3f2a] font-semibold transition-colors">
                {t('forgotPassword')}
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-[#244D33] to-[#1e3f2a] hover:from-[#1e3f2a] hover:to-[#163121] text-white font-semibold rounded-2xl shadow-lg shadow-[#244D33]/30 hover:shadow-xl hover:shadow-[#244D33]/40 disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t('login')}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-10 text-center">
            <p className="text-gray-500">
              {language === 'ar' ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              <a href="#" className="text-[#244D33] hover:text-[#1e3f2a] font-semibold transition-colors">
                {language === 'ar' ? 'تواصل معنا' : 'Contact Sales'}
              </a>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 pt-8 border-t border-gray-200">
            <p className="text-center text-xs text-gray-400 mb-4">{language === 'ar' ? 'معتمد من' : 'Trusted & Certified'}</p>
            <div className="flex items-center justify-center gap-6 opacity-50">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">ZATCA</div>
                <div className="text-[10px] text-gray-400">Phase 2</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">GOSI</div>
                <div className="text-[10px] text-gray-400">Compliant</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-lg font-bold text-gray-700">WPS</div>
                <div className="text-[10px] text-gray-400">Ready</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
