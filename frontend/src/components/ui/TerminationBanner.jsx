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

  const date = new Date(tenant.terminationNotice.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')
  const reason = tenant.terminationNotice.reason

  return (
    <div className="bg-rose-600 text-white px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 z-50 relative">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span className="text-center">
        {language === 'ar' 
          ? `سيتم إنهاء اشتراكك في هذا النظام بتاريخ ${date}. السبب: ${reason}`
          : `Your tenant will be terminated on ${date}. Reason: ${reason}`}
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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-2xl shadow-xl overflow-hidden border border-rose-100 dark:border-rose-900/30">
        <div className="bg-rose-50 dark:bg-rose-900/20 p-6 flex flex-col items-center border-b border-rose-100 dark:border-rose-900/30">
          <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
            {language === 'ar' ? 'تم إنهاء اللوحة' : 'Your panel is terminated'}
          </h2>
        </div>
        <div className="p-6 text-center space-y-6">
          <p className="text-gray-600 dark:text-gray-300">
            {language === 'ar' 
              ? 'تم إنهاء اشتراك مؤسستك في هذا النظام. لم يعد بإمكانك الوصول إلى البيانات أو اللوحة.'
              : 'Your organization\'s subscription has been terminated. You can no longer access the data or the panel.'}
          </p>
          {reason && (
            <div className="bg-gray-50 dark:bg-dark-700 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-semibold block mb-1">{language === 'ar' ? 'سبب الإنهاء:' : 'Termination Reason:'}</span>
              {reason}
            </div>
          )}
          <button onClick={handleLogout} className="btn btn-secondary w-full justify-center">
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  )
}
