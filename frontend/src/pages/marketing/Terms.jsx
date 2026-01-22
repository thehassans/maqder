import { useSelector } from 'react-redux'

export default function MarketingTerms() {
  const { language } = useSelector((state) => state.ui)
  const isArabic = language === 'ar'

  return (
    <main className="py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{isArabic ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>

        <div className="mt-6 space-y-4 text-white/70 leading-relaxed">
          <p>
            {isArabic
              ? 'باستخدامك Maqder ERP فإنك توافق على الالتزام بالشروط والأحكام التالية.'
              : 'By using Maqder ERP, you agree to comply with the following terms and conditions.'}
          </p>
          <p>
            {isArabic
              ? 'يجب الحفاظ على سرية بيانات الدخول وعدم مشاركتها مع الآخرين.'
              : 'You must keep your login credentials confidential and not share them with others.'}
          </p>
          <p>
            {isArabic
              ? 'يتم تقديم الخدمة كما هي، وقد تتغير الميزات أو الخطط لتحسين المنتج.'
              : 'The service is provided as-is, and features/plans may change to improve the product.'}
          </p>
        </div>
      </div>
    </main>
  )
}
