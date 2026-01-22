import { useSelector } from 'react-redux'

export default function MarketingAbout() {
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  return (
    <main className="py-14">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{isArabic ? 'من نحن' : 'About Maqder ERP'}</h1>
        <p className="mt-5 text-white/70 leading-relaxed">
          {isArabic
            ? 'Maqder ERP منصة متكاملة لإدارة أعمال الشركات السعودية. صُممت لتوحيد العمليات الأساسية مثل الفوترة الإلكترونية والموارد البشرية والرواتب والمخزون والمشتريات والتقارير.'
            : 'Maqder ERP is an all-in-one platform built for Saudi businesses. It unifies core operations such as e-invoicing, HR, payroll, inventory, procurement, and reporting.'}
        </p>
        <p className="mt-4 text-white/70 leading-relaxed">
          {isArabic
            ? 'نركز على تجربة مستخدم فائقة الجودة، أداء عالي، وامتثال كامل لمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) مع تصميم عربي/إنجليزي ودعم RTL.'
            : 'We focus on premium user experience, high performance, and full ZATCA compliance, with bilingual Arabic/English support and RTL layout.'}
        </p>
      </div>
    </main>
  )
}
