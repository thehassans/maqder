import { useSelector } from 'react-redux'
import { Phone, Mail, MapPin } from 'lucide-react'
import { usePublicWebsiteSettings } from '../../lib/website'

export default function MarketingContact() {
  const { language } = useSelector((state) => state.ui)
  const { data } = usePublicWebsiteSettings()
  const isArabic = language === 'ar'

  const phone = data?.contactPhone || '+966595930045'
  const email = data?.contactEmail || 'info@maqder.com'
  const address = isArabic ? data?.contactAddressAr : data?.contactAddressEn

  return (
    <main className="py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white">{isArabic ? 'تواصل معنا' : 'Get in touch'}</h1>
            <p className="mt-4 text-white/70 leading-relaxed">
              {isArabic
                ? 'تواصل معنا للحصول على عرض سعر أو ترتيب اجتماع وعرض مباشر للنظام.'
                : 'Contact us for pricing, onboarding, and a live demo tailored to your business.'}
            </p>

            <div className="mt-8 space-y-3">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-300/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="text-sm text-white/60">{isArabic ? 'الهاتف' : 'Phone'}</div>
                  <div className="font-semibold text-white">{phone}</div>
                </div>
              </a>

              <a
                href={`mailto:${email}`}
                className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 hover:bg-white/10 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-300/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-sky-200" />
                </div>
                <div>
                  <div className="text-sm text-white/60">{isArabic ? 'البريد' : 'Email'}</div>
                  <div className="font-semibold text-white">{email}</div>
                </div>
              </a>

              <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-300/20 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <div className="text-sm text-white/60">{isArabic ? 'العنوان' : 'Address'}</div>
                  <div className="font-semibold text-white">{address || (isArabic ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 p-6 sm:p-8">
            <div className="text-xl font-bold text-white">{isArabic ? 'معلومات سريعة' : 'Quick info'}</div>
            <p className="mt-3 text-white/70 leading-relaxed">
              {isArabic
                ? 'نقدم إعداد سريع، تدريب للفريق، وتكاملات حسب الحاجة. النظام يدعم العربية والإنجليزية وامتثال ZATCA.'
                : 'We offer fast onboarding, team training, and custom integrations. The platform supports Arabic/English and full ZATCA compliance.'}
            </p>

            <div className="mt-6 rounded-2xl bg-black/20 border border-white/10 p-5">
              <div className="text-sm text-white/60">{isArabic ? 'وقت الاستجابة' : 'Response time'}</div>
              <div className="mt-1 text-white font-semibold">{isArabic ? 'خلال 24 ساعة' : 'Within 24 hours'}</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
