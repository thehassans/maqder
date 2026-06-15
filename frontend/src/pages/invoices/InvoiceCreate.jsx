import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { ArrowLeft, ShoppingCart, Package, Plane, FileClock } from 'lucide-react'
import { useTranslation } from '../../lib/translations'
import { getTenantBusinessTypes } from '../../lib/businessTypes'

export default function InvoiceCreate() {
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)

  const businessTypes = getTenantBusinessTypes(tenant)
  const canCreatePurchase = businessTypes.some((type) => ['trading', 'construction', 'travel_agency'].includes(type))
  const canCreateProforma = businessTypes.some((type) => ['trading', 'construction', 'manpower'].includes(type))
  const hasTravel = businessTypes.includes('travel_agency')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/app/dashboard/invoices')} className="btn btn-ghost btn-icon">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('createInvoice')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ar' ? 'اختر نوع الفاتورة التي تريد إنشاءها' : 'Choose the type of invoice you want to create'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => navigate('/app/dashboard/invoices/new/sell')}
          className="card p-8 text-start hover:shadow-lg transition-all hover:border-primary-500 border-2 border-transparent group"
        >
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'ar' ? 'فاتورة بيع' : 'Sell Invoice'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {language === 'ar' 
              ? 'إنشاء فاتورة مبيعات لعميل. يتم تخفيض المخزون عند توقيع الفاتورة مع ZATCA.'
              : 'Create a sales invoice for a customer. Inventory decreases when the invoice is signed with ZATCA.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              {language === 'ar' ? 'B2B / B2C' : 'B2B / B2C'}
            </span>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
              {language === 'ar' ? 'توقيع ZATCA' : 'ZATCA Signing'}
            </span>
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
              {language === 'ar' ? 'معاينة مباشرة' : 'Live Preview'}
            </span>
            {hasTravel && (
              <span className="px-3 py-1 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 text-xs font-medium rounded-full inline-flex items-center gap-1">
                <Plane className="w-3 h-3" />
                {language === 'ar' ? 'فواتير سفر' : 'Travel Invoices'}
              </span>
            )}
          </div>
        </motion.button>

        {canCreatePurchase && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/app/dashboard/invoices/new/purchase')}
            className="card p-8 text-start hover:shadow-lg transition-all hover:border-primary-500 border-2 border-transparent group"
          >
            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Package className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'ar' ? 'فاتورة شراء' : 'Purchase Invoice'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {language === 'ar'
                ? 'إنشاء فاتورة مشتريات من مورد. يتم تحديث المخزون فوراً عند الإنشاء.'
                : 'Create a purchase invoice from a supplier. Inventory updates immediately upon creation.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
                {language === 'ar' ? 'مورد' : 'Supplier'}
              </span>
              <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-medium rounded-full">
                {language === 'ar' ? 'تجاري أو خدمي' : 'Trading or Service'}
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 text-xs font-medium rounded-full">
                {language === 'ar' ? 'قالب طباعة قابل للتخصيص' : 'Custom Print Template'}
              </span>
            </div>
          </motion.button>
        )}

        {canCreateProforma && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/app/dashboard/invoices/new/sell?proforma=1')}
            className="card p-8 text-start hover:shadow-lg transition-all hover:border-primary-500 border-2 border-transparent group"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileClock className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {language === 'ar' ? 'فاتورة مبدئية (Proforma)' : 'Proforma Invoice'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {language === 'ar'
                ? 'إنشاء فاتورة مبدئية لعرض أسعار أو طلب. لا تخفض المخزون ولا تتطلب توقيع هيئة الزكاة. يمكن تحويلها لفاتورة لاحقاً.'
                : 'Create a proforma invoice. Does not deduct inventory or require ZATCA signing. Can be converted to a real invoice later.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-medium rounded-full">
                {language === 'ar' ? 'غير ملزمة للزكاة' : 'Non-ZATCA'}
              </span>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 text-xs font-medium rounded-full">
                {language === 'ar' ? 'قابلة للتحويل' : 'Convertible'}
              </span>
            </div>
          </motion.button>
        )}
      </div>


    </div>
  )
}
