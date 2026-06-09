import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Globe, Phone, Mail, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { MenuToggleIcon } from "@/components/ui/MenuToggleIcon"

export function Header({ isArabic, setLanguage }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "#features", label: isArabic ? "المميزات" : "Features" },
    { href: "#modules", label: isArabic ? "الوحدات" : "Modules" },
    { href: "#pricing", label: isArabic ? "الأسعار" : "Pricing" },
    { href: "#contact", label: isArabic ? "تواصل معنا" : "Contact" },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center">
              <div className="w-auto h-12 flex items-center justify-center">
                <img src="/maqdernewlogo.png" alt="Maqder" className="h-full w-auto object-contain" />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`font-medium transition-colors hover:text-emerald-600 ${
                    isScrolled ? "text-gray-600" : "text-gray-800"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-4 border-r border-gray-200 pr-4 mr-2">
              <a href="tel:+966596775485" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-600 transition">
                <Phone className="w-4 h-4 text-emerald-500" />
                <span dir="ltr">+966 59 677 5485</span>
              </a>
              <a href="mailto:support@maqder.com" className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-600 transition">
                <Mail className="w-4 h-4 text-emerald-500" />
                <span>support@maqder.com</span>
              </a>
              <a href="https://wa.me/966596775485" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition bg-emerald-50 px-2 py-1 rounded-lg">
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              onClick={() => setLanguage(isArabic ? "en" : "ar")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition flex items-center gap-1.5"
            >
              <Globe className="w-4 h-4" />
              {isArabic ? "English" : "العربية"}
            </button>

            <Link to="/login" className="hidden sm:block">
              <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all">
                {isArabic ? "تسجيل الدخول" : "Login"}
              </Button>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MenuToggleIcon isOpen={mobileMenuOpen} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 py-6 flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full rounded-xl" size="lg">
                    {isArabic ? "تسجيل الدخول" : "Login"}
                  </Button>
                </Link>
                <div className="flex items-center justify-center gap-4 mt-4">
                  <a href="tel:+966596775485" className="p-3 bg-gray-50 rounded-full text-gray-600">
                    <Phone className="w-5 h-5" />
                  </a>
                  <a href="https://wa.me/966596775485" target="_blank" rel="noreferrer" className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
