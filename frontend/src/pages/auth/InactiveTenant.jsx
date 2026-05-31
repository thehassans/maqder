import { AlertCircle } from 'lucide-react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

export default function InactiveTenant() {
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 text-center space-y-6">
        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isArabic ? 'هذا الحساب غير متاح حالياً' : 'This tenant is no longer available'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isArabic 
              ? 'يبدو أن هذا المستأجر غير نشط أو تم إيقافه. يرجى التواصل مع الدعم الفني أو الانتظار حتى يقوم المشرف العام بتفعيله.' 
              : 'It looks like this tenant is inactive or suspended. Please contact support or wait for the super admin to start it.'}
          </p>
        </div>

        <div className="pt-4">
          <Link to="/login" className="btn btn-primary w-full justify-center">
            {isArabic ? 'العودة لتسجيل الدخول' : 'Return to Login'}
          </Link>
        </div>
      </div>
    </div>
  )
}
