import { useSelector } from 'react-redux'
import { AlertTriangle, LogOut } from 'lucide-react'
import { useTranslation } from '../../lib/translations'

export function isTenantTerminated(tenant) {
  if (!tenant) return false
  if (tenant.subscription?.status === 'terminated') return true
  if (tenant.terminationNotice?.date) {
    if (new Date(tenant.terminationNotice.date) <= new Date()) {
      return true
    }
  }
  return false
}

export function hasTerminationNotice(tenant) {
  if (!tenant) return false
  if (isTenantTerminated(tenant)) return false // If terminated, it's fully blocked, no banner needed
  if (tenant.terminationNotice?.date) {
    return new Date(tenant.terminationNotice.date) > new Date()
  }
  return false
}

export default function TerminationBanner() {
  const { tenant } = useSelector((state) => state.auth)
  const { language } = useSelector((state) => state.ui)
  
  if (!hasTerminationNotice(tenant)) return null

  const date = new Date(tenant.terminationNotice.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 z-50 relative shadow-sm">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="text-center">
        {language === 'ar' 
          ? `إنذار: سيتم إنهاء اشتراكك في هذا النظام بتاريخ ${date}. يرجى اتخاذ الإجراء اللازم.`
          : `Warning: Your panel will be terminated on ${date}. Please take necessary action.`}
      </span>
    </div>
  )
}

export function TerminationBlocker() {
  const { tenant } = useSelector((state) => state.auth)
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const handleLogout = () => {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  const reason = tenant?.terminationNotice?.reason

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-dark-900 flex flex-col items-center justify-center p-6 text-center antialiased">
      <div className="max-w-lg w-full flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center mb-8">
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-4">
          {language === 'ar' ? 'تم إيقاف اللوحة' : 'Panel Terminated'}
        </h1>
        
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
          {language === 'ar' 
            ? 'لقد تم إنهاء الوصول إلى هذا النظام نهائياً. لا يمكنك الوصول إلى بياناتك بعد الآن.'
            : 'Access to this system has been permanently terminated. You can no longer access your data.'}
        </p>
        
        {reason && (
          <div className="w-full max-w-sm mb-10">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
              {language === 'ar' ? 'سبب الإيقاف' : 'Reason for termination'}
            </p>
            <p className="text-gray-900 dark:text-gray-100 text-lg font-medium bg-gray-50 dark:bg-dark-800 py-4 px-6 rounded-2xl border border-gray-100 dark:border-dark-700">
              {reason}
            </p>
          </div>
        )}

        <button 
          onClick={handleLogout} 
          className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold hover:opacity-90 transition-opacity"
        >
          <LogOut className="w-4 h-4" />
          {t('logout')}
        </button>
      </div>
    </div>
  )
}
