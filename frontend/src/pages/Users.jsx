import { useSelector } from 'react-redux'
import { useTranslation } from '../lib/translations'

export default function Users() {
  const { language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ar' ? 'إدارة مستخدمي النظام' : 'Manage system users'}
        </p>
      </div>
      <div className="card p-6 text-gray-500 dark:text-gray-400">
        {language === 'ar' ? 'هذه الصفحة قيد التطوير.' : 'This page is under development.'}
      </div>
    </div>
  )
}
