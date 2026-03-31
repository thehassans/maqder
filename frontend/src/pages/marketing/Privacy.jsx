import { useSelector } from 'react-redux'

export default function MarketingPrivacy() {
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  return (
    <main className="py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{isArabic ? 'سياسة الخصوصية' : 'Privacy Policy'}</h1>

        <div className="mt-6 space-y-4 text-white/70 leading-relaxed">
          <p>
            {isArabic
              ? 'نحترم خصوصيتك ونلتزم بحماية بياناتك. يتم استخدام المعلومات فقط لتقديم الخدمة وتحسينها.'
              : 'We respect your privacy and are committed to protecting your data. We use information only to provide and improve the service.'}
          </p>
          <p>
            {isArabic
              ? 'قد نقوم بجمع معلومات مثل البريد الإلكتروني وبيانات الاستخدام لأغراض الدعم الفني والتحسينات.'
              : 'We may collect information such as email and usage data for support and product improvements.'}
          </p>
          <p>
            {isArabic
              ? 'لا نقوم ببيع بياناتك لأي طرف ثالث. يتم مشاركة البيانات فقط عند الضرورة لتقديم الخدمة أو عند وجود التزام قانوني.'
              : 'We do not sell your data to third parties. Data is shared only when necessary to provide the service or when legally required.'}
          </p>
        </div>
      </div>
    </main>
  )
}
