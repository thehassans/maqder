import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles, Play, Shield, Lock, Cloud, BadgeCheck, TrendingUp, FileText, Users } from "lucide-react"
import { Button } from "@/components/ui/Button"

export function HeroSection({ isArabic }) {
  const complianceLogos = [
    { src: "/ZATCA_Logo.svg", alt: "ZATCA", imageClassName: "scale-[1.35]" },
    { src: "/saudi-vision-2030-logo.png", alt: "Saudi Vision 2030", imageClassName: "scale-100" },
  ]

  return (
    <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center bg-gray-50/50">
      {/* Background Shades */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl opacity-70" />
        <div className="absolute top-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl opacity-70" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-emerald-100 rounded-full text-emerald-700 font-medium text-sm mb-8 shadow-sm">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              {isArabic
                ? "مزود خدمات الفوترة الإلكترونية المعتمد - متوافق مع ZATCA"
                : "Certified E-Invoicing Services Provider - ZATCA Phase 2"}
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.15] mb-8 tracking-tight">
              {isArabic ? (
                <>
                  نظام ERP متكامل
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-primary-600 bg-clip-text text-transparent">
                    للسوق السعودي
                  </span>
                </>
              ) : (
                <>
                  Complete ERP System
                  <br />
                  <span className="bg-gradient-to-r from-emerald-600 to-primary-600 bg-clip-text text-transparent">
                    for Saudi Market
                  </span>
                </>
              )}
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-xl font-light">
              {isArabic
                ? "تقديم خدمات الفوترة الإلكترونية، الموارد البشرية، الرواتب، المخزون، المشتريات والمزيد - كل ما تحتاجه لإدارة أعمالك بكفاءة في منصة واحدة."
                : "Providing E-Invoicing Services, HR, Payroll, Inventory, Procurement, and more — everything you need to run your business efficiently in one unified platform."}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link to="/login">
                <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-2xl shadow-xl shadow-emerald-500/20 hover:shadow-2xl hover:-translate-y-1 transition-all">
                  {isArabic ? "ابدأ رحلتك الآن" : "Start Your Journey"}
                  <ArrowRight className={`w-5 h-5 ml-2 ${isArabic ? "rotate-180 mr-2 ml-0" : ""}`} />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-2xl border-2 hover:bg-gray-50 transition-colors">
                  <Play className="w-5 h-5 mr-2" />
                  {isArabic ? "استكشف النظام" : "Explore System"}
                </Button>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex items-center gap-4">
                {complianceLogos.map((logo) => (
                  <div key={logo.alt} className="flex h-16 w-32 items-center justify-center rounded-2xl bg-white border border-gray-100 px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
                    <img src={logo.src} alt={logo.alt} className={`max-h-full max-w-full object-contain ${logo.imageClassName || ""}`} />
                  </div>
                ))}
              </div>
              <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                  <BadgeCheck className="w-5 h-5 text-emerald-500" />
                  {isArabic ? "معتمد 100%" : "100% Certified"}
                </div>
                <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                  <Lock className="w-5 h-5 text-emerald-500" />
                  {isArabic ? "آمن ومشفر" : "Secure"}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            {/* Premium Dashboard Mockup */}
            <div className="relative z-10 bg-white rounded-[2.5rem] p-4 shadow-2xl border border-gray-100 transform rotate-1 hover:rotate-0 transition-transform duration-500">
              <div className="bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-100">
                <div className="flex items-center gap-2 px-6 py-4 bg-white border-b border-gray-100">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="mx-auto flex items-center gap-2 bg-gray-50 px-4 py-1.5 rounded-full text-xs text-gray-500 font-medium">
                    <Lock className="w-3 h-3" /> maqder.com/dashboard
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                      </div>
                      <p className="text-gray-500 text-sm mb-1">{isArabic ? "الإيرادات" : "Revenue"}</p>
                      <p className="text-gray-900 font-bold text-xl">SAR 125K</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-gray-500 text-sm mb-1">{isArabic ? "الفواتير" : "Invoices"}</p>
                      <p className="text-gray-900 font-bold text-xl">248</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center mb-3">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-gray-500 text-sm mb-1">{isArabic ? "الموظفين" : "Employees"}</p>
                      <p className="text-gray-900 font-bold text-xl">32</p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-semibold text-gray-900">{isArabic ? "نظرة عامة" : "Overview"}</h3>
                      <span className="text-emerald-500 text-sm font-medium bg-emerald-50 px-2.5 py-1 rounded-full">+12.5%</span>
                    </div>
                    <div className="flex items-end gap-2 h-32">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col gap-1.5 group">
                          <div className="w-full bg-emerald-500/20 group-hover:bg-emerald-500/30 rounded-t-lg transition-colors" style={{ height: `${h}%` }}>
                            <div className="w-full bg-emerald-500 rounded-t-lg" style={{ height: '40%' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">ZATCA</p>
                  <p className="text-xs text-gray-500">Approved</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function CheckCircle2(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
