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
<<<<<<< HEAD
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f4f8f4_40%,#ffffff_100%)] text-slate-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
=======
    <div className="min-h-screen bg-[#07150f] text-white" dir={isArabic ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 bg-[#07150f]/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg">
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
                <img src="/maqder-logo.png" alt="Maqder" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-lg">{data?.brandName || 'Maqder ERP'}</div>
<<<<<<< HEAD
                <div className="text-xs text-slate-500">{isArabic ? 'نظام ERP للشركات السعودية' : 'Saudi-ready ERP platform'}</div>
=======
                <div className="text-xs text-white/60">{isArabic ? 'نظام ERP للشركات السعودية' : 'Saudi-ready ERP platform'}</div>
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
<<<<<<< HEAD
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'}`}
=======
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${active ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/5'}`}
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
                  >
                    {isArabic ? item.labelAr : item.labelEn}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
<<<<<<< HEAD
                className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-slate-950"
=======
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm text-white/80"
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
              >
                <Phone className="w-4 h-4" />
                {phone}
              </a>

              <button
                onClick={() => dispatch(setLanguage(isArabic ? 'en' : 'ar'))}
<<<<<<< HEAD
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
=======
                className="p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
              >
                <Globe className="w-5 h-5" />
              </button>

              <Link
                to="/login"
<<<<<<< HEAD
                className="hidden sm:inline-flex rounded-xl bg-gradient-to-r from-[#1f6b43] to-[#155234] px-4 py-2 text-sm font-semibold text-white transition hover:from-[#185636] hover:to-[#12472d]"
=======
                className="hidden sm:inline-flex px-4 py-2 rounded-xl bg-gradient-to-r from-[#244D33] to-[#1a3d28] hover:from-[#1a3d28] hover:to-[#163121] transition text-sm font-semibold shadow-lg shadow-[#244D33]/30"
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
              >
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Link>

              <button
                onClick={() => setOpen((v) => !v)}
<<<<<<< HEAD
                className="md:hidden rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
=======
                className="md:hidden p-2 rounded-xl hover:bg-white/10 text-white/80 hover:text-white transition"
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
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
<<<<<<< HEAD
              className="md:hidden border-t border-slate-200 bg-white"
=======
              className="md:hidden border-t border-white/10 bg-[#07150f]"
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
            >
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
<<<<<<< HEAD
                    className="block rounded-xl px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
=======
                    className="block px-3 py-2 rounded-xl text-white/80 hover:text-white hover:bg-white/5 transition"
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
                  >
                    {isArabic ? item.labelAr : item.labelEn}
                  </Link>
                ))}
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
<<<<<<< HEAD
                  className="block rounded-xl bg-gradient-to-r from-[#1f6b43] to-[#155234] px-4 py-2 text-center font-semibold text-white"
=======
                  className="block text-center px-4 py-2 rounded-xl bg-gradient-to-r from-[#244D33] to-[#1a3d28] text-white font-semibold"
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
                >
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <Outlet />

<<<<<<< HEAD
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
=======
      <footer className="border-t border-white/10 bg-[#07150f]">
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-lg">{data?.brandName || 'Maqder ERP'}</div>
<<<<<<< HEAD
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
=======
              <p className="text-sm text-white/60 mt-2 leading-relaxed">
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
                {isArabic
                  ? 'منصة ERP متكاملة للشركات السعودية مع امتثال كامل لهيئة الزكاة والضريبة والجمارك.'
                  : 'A complete ERP platform for Saudi businesses with full ZATCA compliance.'}
              </p>
            </div>

            <div>
<<<<<<< HEAD
              <div className="mb-3 font-semibold text-slate-900">{isArabic ? 'الروابط' : 'Links'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/pricing" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'الأسعار' : 'Pricing'}</Link>
                <Link to="/about" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'من نحن' : 'About'}</Link>
                <Link to="/contact" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'تواصل معنا' : 'Contact'}</Link>
=======
              <div className="font-semibold text-white mb-3">{isArabic ? 'الروابط' : 'Links'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/pricing" className="block text-white/70 hover:text-white transition">{isArabic ? 'الأسعار' : 'Pricing'}</Link>
                <Link to="/about" className="block text-white/70 hover:text-white transition">{isArabic ? 'من نحن' : 'About'}</Link>
                <Link to="/contact" className="block text-white/70 hover:text-white transition">{isArabic ? 'تواصل معنا' : 'Contact'}</Link>
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
              </div>
            </div>

            <div>
<<<<<<< HEAD
              <div className="mb-3 font-semibold text-slate-900">{isArabic ? 'قانوني' : 'Legal'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'سياسة الخصوصية' : 'Privacy'}</Link>
                <Link to="/terms" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'الشروط' : 'Terms'}</Link>
=======
              <div className="font-semibold text-white mb-3">{isArabic ? 'قانوني' : 'Legal'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-white/70 hover:text-white transition">{isArabic ? 'سياسة الخصوصية' : 'Privacy'}</Link>
                <Link to="/terms" className="block text-white/70 hover:text-white transition">{isArabic ? 'الشروط' : 'Terms'}</Link>
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
              </div>
            </div>

            <div>
<<<<<<< HEAD
              <div className="mb-3 font-semibold text-slate-900">{isArabic ? 'تواصل' : 'Contact'}</div>
              <div className="space-y-2 text-sm text-slate-500">
=======
              <div className="font-semibold text-white mb-3">{isArabic ? 'تواصل' : 'Contact'}</div>
              <div className="space-y-2 text-sm text-white/70">
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
                <div>{phone}</div>
                <div>{data?.contactEmail || 'info@maqder.com'}</div>
                <div>{isArabic ? data?.contactAddressAr : data?.contactAddressEn}</div>
              </div>
            </div>
          </div>

<<<<<<< HEAD
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
            <div> {new Date().getFullYear()} {data?.brandName || 'Maqder ERP'}</div>
=======
          <div className="mt-10 pt-6 border-t border-white/10 text-xs text-white/50 flex flex-col sm:flex-row justify-between gap-3">
            <div>© {new Date().getFullYear()} {data?.brandName || 'Maqder ERP'}</div>
>>>>>>> 3a0f875b2b8467a6857d178ec88a9830f0073750
            <div>{isArabic ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
