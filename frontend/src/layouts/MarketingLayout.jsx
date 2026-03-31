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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8faf7_0%,#f4f8f4_40%,#ffffff_100%)] text-slate-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <img src="/maqder-logo.png" alt="Maqder" className="w-full h-full object-contain" />
              </div>
              <div className="leading-tight">
                <div className="font-bold text-lg">{data?.brandName || 'Maqder ERP'}</div>
                <div className="text-xs text-slate-500">{isArabic ? 'نظام ERP للشركات السعودية' : 'Saudi-ready ERP platform'}</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition ${active ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'}`}
                  >
                    {isArabic ? item.labelAr : item.labelEn}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center gap-2">
              <a
                href={`tel:${phone.replace(/\s+/g, '')}`}
                className="hidden lg:flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-slate-950"
              >
                <Phone className="w-4 h-4" />
                {phone}
              </a>

              <button
                onClick={() => dispatch(setLanguage(isArabic ? 'en' : 'ar'))}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Globe className="w-5 h-5" />
              </button>

              <Link
                to="/login"
                className="hidden sm:inline-flex rounded-xl bg-gradient-to-r from-[#1f6b43] to-[#155234] px-4 py-2 text-sm font-semibold text-white transition hover:from-[#185636] hover:to-[#12472d]"
              >
                {isArabic ? 'تسجيل الدخول' : 'Login'}
              </Link>

              <button
                onClick={() => setOpen((v) => !v)}
                className="md:hidden rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
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
              className="md:hidden border-t border-slate-200 bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                  >
                    {isArabic ? item.labelAr : item.labelEn}
                  </Link>
                ))}
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="block rounded-xl bg-gradient-to-r from-[#1f6b43] to-[#155234] px-4 py-2 text-center font-semibold text-white"
                >
                  {isArabic ? 'تسجيل الدخول' : 'Login'}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <Outlet />

      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="font-bold text-lg">{data?.brandName || 'Maqder ERP'}</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {isArabic
                  ? 'منصة ERP متكاملة للشركات السعودية مع امتثال كامل لهيئة الزكاة والضريبة والجمارك.'
                  : 'A complete ERP platform for Saudi businesses with full ZATCA compliance.'}
              </p>
            </div>

            <div>
              <div className="mb-3 font-semibold text-slate-900">{isArabic ? 'الروابط' : 'Links'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/pricing" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'الأسعار' : 'Pricing'}</Link>
                <Link to="/about" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'من نحن' : 'About'}</Link>
                <Link to="/contact" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'تواصل معنا' : 'Contact'}</Link>
              </div>
            </div>

            <div>
              <div className="mb-3 font-semibold text-slate-900">{isArabic ? 'قانوني' : 'Legal'}</div>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'سياسة الخصوصية' : 'Privacy'}</Link>
                <Link to="/terms" className="block text-slate-500 transition hover:text-slate-950">{isArabic ? 'الشروط' : 'Terms'}</Link>
              </div>
            </div>

            <div>
              <div className="mb-3 font-semibold text-slate-900">{isArabic ? 'تواصل' : 'Contact'}</div>
              <div className="space-y-2 text-sm text-slate-500">
                <div>{phone}</div>
                <div>{data?.contactEmail || 'info@maqder.com'}</div>
                <div>{isArabic ? data?.contactAddressAr : data?.contactAddressEn}</div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row">
            <div> {new Date().getFullYear()} {data?.brandName || 'Maqder ERP'}</div>
            <div>{isArabic ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
