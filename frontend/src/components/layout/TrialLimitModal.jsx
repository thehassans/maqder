import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Crown, Lock, X, Sparkles } from 'lucide-react'

const RESOURCE_LABELS = {
  invoices: { en: 'Invoices', ar: 'الفواتير' },
  quotations: { en: 'Quotations', ar: 'عروض الأسعار' },
  customers: { en: 'Customers', ar: 'العملاء' },
  suppliers: { en: 'Suppliers', ar: 'الموردون' },
  purchaseOrders: { en: 'Purchase Orders', ar: 'أوامر الشراء' },
  purchaseReturns: { en: 'Purchase Returns', ar: 'مرتجعات الشراء' },
  products: { en: 'Products', ar: 'المنتجات' },
  warehouses: { en: 'Warehouses', ar: 'المستودعات' },
  users: { en: 'Users', ar: 'المستخدمون' },
  projects: { en: 'Projects', ar: 'المشاريع' },
  tasks: { en: 'Tasks', ar: 'المهام' },
  employees: { en: 'Employees', ar: 'الموظفون' },
  expenses: { en: 'Expenses', ar: 'المصروفات' },
  vouchers: { en: 'Vouchers', ar: 'السندات' },
  shipments: { en: 'Shipments', ar: 'الشحنات' },
  restaurantOrders: { en: 'Restaurant Orders', ar: 'طلبات المطعم' },
  restaurantMenuItems: { en: 'Menu Items', ar: 'أصناف القائمة' },
  restaurantTables: { en: 'Tables', ar: 'الطاولات' },
  travelBookings: { en: 'Travel Bookings', ar: 'حجوزات السفر' },
  rentalCars: { en: 'Rental Cars', ar: 'سيارات الإيجار' },
  rentalCustomers: { en: 'Rental Customers', ar: 'عملاء الإيجار' },
  saloonServices: { en: 'Salon Services', ar: 'خدمات الصالون' },
  saloonStaff: { en: 'Salon Staff', ar: 'موظفو الصالون' },
  saloonAppointments: { en: 'Appointments', ar: 'المواعيد' },
  laundryServices: { en: 'Laundry Services', ar: 'خدمات المغسلة' },
  laundryCustomers: { en: 'Laundry Customers', ar: 'عملاء المغسلة' },
  laundryInventory: { en: 'Laundry Inventory', ar: 'مخزون المغسلة' },
  promotions: { en: 'Promotions', ar: 'العروض الترويجية' },
  manpowerTimesheets: { en: 'Timesheets', ar: 'سجلات الحضور' },
  khayyatStitchings: { en: 'Stitching Orders', ar: 'طلبات الخياطة' },
}

export default function TrialLimitModal() {
  const navigate = useNavigate()
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  const [isOpen, setIsOpen] = useState(false)
  const [detail, setDetail] = useState(null)

  useEffect(() => {
    const handler = (e) => {
      const { limitType, limit, current, message } = e.detail || {}
      setDetail({ limitType, limit, current, message })
      setIsOpen(true)
    }
    window.addEventListener('trial-limit-reached', handler)
    return () => window.removeEventListener('trial-limit-reached', handler)
  }, [])

  if (!isOpen) return null

  const resourceLabel = detail?.limitType
    ? (isArabic
        ? RESOURCE_LABELS[detail.limitType]?.ar || detail.limitType
        : RESOURCE_LABELS[detail.limitType]?.en || detail.limitType)
    : ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 px-6 pt-8 pb-6 text-center">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 rounded-lg p-1.5 text-white/80 transition hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isArabic ? 'الحد الأقصى للنسخة التجريبية' : 'Trial Limit Reached'}
          </h2>
          <p className="mt-1 text-sm text-white/90">
            {isArabic ? 'تم الوصول إلى الحد الأقصى في النسخة التجريبية' : 'You have reached the maximum allowed in the trial version'}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {/* Limit info */}
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {resourceLabel}
                </div>
                <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {isArabic ? 'الحد المسموح' : 'Allowed limit'}: <span className="font-bold">{detail?.limit}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {detail?.current}/{detail?.limit}
                </div>
              </div>
            </div>
          </div>

          {/* Message */}
          <p className="text-sm text-slate-600 dark:text-slate-300 text-center">
            {isArabic
              ? 'لقد استخدمت الحد الأقصى المسموح به في النسخة التجريبية. قم بالترقية إلى النسخة الكاملة لإنشاء المزيد.'
              : 'You have used all allowed entries in the trial version. Upgrade to the full version to create more.'}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setIsOpen(false)
                navigate('/demo-checkout')
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-3 font-bold text-white shadow-lg shadow-orange-200 transition hover:from-amber-600 hover:to-orange-600 active:scale-95"
            >
              <Crown className="h-5 w-5" />
              {isArabic ? 'احصل على النسخة الكاملة' : 'Get Full Version'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {isArabic ? 'إغلاق' : 'Close'}
            </button>
          </div>

          {/* Feature list */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              {isArabic ? 'مزايا النسخة الكاملة' : 'Full version features'}
            </div>
            <ul className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              {(isArabic
                ? ['فواتير غير محدودة', 'موردون وعملاء غير محدودين', 'جميع الميزات المتقدمة', 'دعم فني مخصص']
                : ['Unlimited invoices', 'Unlimited suppliers & customers', 'All advanced features', 'Dedicated support']
              ).map((feat, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="text-emerald-500">✓</span>
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
