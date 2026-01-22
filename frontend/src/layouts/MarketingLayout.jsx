import { Outlet, Link, useLocation } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Menu, X, Phone } from 'lucide-react'
import { useSelector, useDispatch } from 'react-redux'
import { setLanguage } from '../store/slices/uiSlice'
import { usePublicWebsiteSettings } from '../lib/website'

export default function MarketingLayout() {
  const location = useLocation()
  const dispatch = useDispatch()
  const { language } = useSelector((state) => state.ui)
  const { data } = usePublicWebsiteSettings()
  const [open, setOpen] = useState(false)

  const isArabic = language === 'ar'

  const navItems = useMemo(
    () => [
      { to: '/', labelEn: 'Home', labelAr: 'الرئيسية' },
      { to: '/pricing', labelEn: 'Pricing', labelAr: 'الأسعار' },
      { to: '/about', labelEn: 'About', labelAr: 'من نحن' },
      { to: '/contact', labelEn: 'Contact', labelAr: 'تواصل معنا' },
    ],
    []
  )

  const phone = data?.contactPhone || '+966595930045'

  return (
    <div className="min-h-screen bg-[#07150f] text-white" dir={isArabic ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 bg-[#07150f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg">
                <img src="/maqder-logo.png" alt="Maqder" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-lg">{data?.brandName || 'Maqder ERP'}</div>
                <div className="text-xs text-white/60">{isArabic ? 'نظام ERP للشركات السعودية' : 'Saudi-ready ERP platform'}</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
                  >
                    {isArabic ? item.labelAr : item.labelEn}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white/80"
              >
                <Phone className="w-4 h-4" />
                {phone}
              </a>

              <button
                onClick={() => dispatch(setLanguage(isArabic ? 'en' : 'ar'))}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                <Globe className="w-5 h-5" />
              </button>

              <Link
                to="/login"
                className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-gradient-to-r from-[#244D33] to-[#1a3d28] hover:from-[#1a3d28] hover:to-[#163121] transition text-sm font-semibold shadow-lg shadow-[#244D33]/30"
              >
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Link>

              <button
                onClick={() => setOpen((v) => !v)}
                className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden border-t border-white/10 bg-[#07150f]"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition"
                  >
                    {isArabic ? item.labelAr : item.labelEn}
                  </Link>
                ))}
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block text-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#244D33] to-[#1a3d28] text-white font-semibold"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <Outlet />

      <footer className="border-t border-white/10 bg-[#07150f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-lg">{data?.brandName || 'Maqder ERP'}</div>
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
                {isArabic
                  ? 'منصة ERP متكاملة للشركات السعودية مع امتثال كامل لهيئة الزكاة والضريبة والجمارك.'
                  : 'A complete ERP platform for Saudi businesses with full ZATCA compliance.'}
              </p>
            </div>

            <div>
              <div className="font-semibold text-white mb-3">{isArabic ? 'الروابط' : 'Links'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/pricing" className="block text-white/70 hover:text-white transition">{isArabic ? 'الأسعار' : 'Pricing'}</Link>
                <Link to="/about" className="block text-white/70 hover:text-white transition">{isArabic ? 'من نحن' : 'About'}</Link>
                <Link to="/contact" className="block text-white/70 hover:text-white transition">{isArabic ? 'تواصل معنا' : 'Contact'}</Link>
              </div>
            </div>

            <div>
              <div className="font-semibold text-white mb-3">{isArabic ? 'قانوني' : 'Legal'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-white/70 hover:text-white transition">{isArabic ? 'سياسة الخصوصية' : 'Privacy'}</Link>
                <Link to="/terms" className="block text-white/70 hover:text-white transition">{isArabic ? 'الشروط' : 'Terms'}</Link>
              </div>
            </div>

            <div>
              <div className="font-semibold text-white mb-3">{isArabic ? 'تواصل' : 'Contact'}</div>
              <div className="space-y-2 text-sm text-white/70">
                <div>{phone}</div>
                <div>{data?.contactEmail || 'info@maqder.com'}</div>
                <div>{isArabic ? data?.contactAddressAr : data?.contactAddressEn}</div>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/10 text-xs text-white/50 flex flex-col sm:flex-row justify-between gap-3">
            <div>© {new Date().getFullYear()} {data?.brandName || 'Maqder ERP'}</div>
            <div>{isArabic ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
