import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Play, CheckCircle2, ShieldCheck, Phone } from "lucide-react"

export function HeroSection({ isArabic }) {
  return (
    <section className="relative pt-32 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-[90vh] flex flex-col justify-center bg-[#07130b]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#07130b] to-[#07130b] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-20 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* ZATCA Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-900/30 border border-emerald-800/50 rounded-full text-emerald-400 font-medium text-sm mb-6">
              <ShieldCheck className="w-4 h-4" />
              ZATCA Phase 2 Certified
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
              The Saudi ERP
              <br />
              <span className="text-emerald-300">businesses trust</span>
            </h1>
            
            <p className="text-lg text-gray-400 mb-10 max-w-lg font-light leading-relaxed">
              Saudi compliant, ZATCA Phase 2 ready. Invoicing, HR, Payroll, Inventory & more.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Link to="/login">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold h-12 px-8 rounded-full transition-colors">
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <a href="#features">
                <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent border border-gray-600 hover:border-gray-400 text-white text-base font-medium h-12 px-8 rounded-full transition-colors">
                  <Play className="w-4 h-4" />
                  Live demos
                </button>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-6 mb-8">
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                <span>✦</span> Clean UI
              </div>
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                <span>✦</span> Arabic / English
              </div>
              <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                <span>✦</span> Made for Saudi
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Phone className="w-4 h-4" />
              <span dir="ltr">+966595930045</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative lg:ml-auto w-full max-w-lg"
          >
            {/* Main Dashboard Widget */}
            <div className="bg-[#0c1811] border border-gray-800 rounded-3xl p-6 shadow-2xl relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-500 text-xs font-bold tracking-widest uppercase">DASHBOARD</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#132218] border border-gray-800/50 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs mb-2">Invoices today</p>
                  <p className="text-white font-bold text-2xl mb-1">284</p>
                  <p className="text-emerald-500 text-xs">+18%</p>
                </div>
                <div className="bg-[#132218] border border-gray-800/50 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs mb-2">Monthly revenue</p>
                  <p className="text-white font-bold text-2xl mb-1">SAR 1.2M</p>
                  <p className="text-emerald-500 text-xs">+24%</p>
                </div>
                <div className="bg-[#132218] border border-gray-800/50 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs mb-2">Active employees</p>
                  <p className="text-white font-bold text-2xl mb-1">142</p>
                  <p className="text-emerald-500 text-xs">+3</p>
                </div>
                <div className="bg-[#132218] border border-gray-800/50 rounded-2xl p-4">
                  <p className="text-gray-400 text-xs mb-2">Stock items</p>
                  <p className="text-white font-bold text-2xl mb-1">4,280</p>
                  <p className="text-yellow-500 text-xs">Low: 12</p>
                </div>
              </div>

              <div className="bg-[#132218] border border-emerald-900/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-emerald-500 text-sm font-semibold">ZATCA Connected & Active</p>
                    <p className="text-gray-500 text-xs">Last sync: just now</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>
            
            {/* Floating Popups */}
            <div className="absolute -top-4 -right-4 bg-[#1a2b21] border border-gray-700/50 p-3 rounded-xl shadow-2xl z-20">
              <p className="text-gray-400 text-[10px] mb-0.5">Compliance</p>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-semibold">ZATCA Phase 2</span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-[#1a2b21] border border-gray-700/50 p-3 rounded-xl shadow-2xl z-20">
              <p className="text-gray-400 text-[10px] mb-0.5">Support</p>
              <p className="text-white text-xs font-semibold">24 / 7 Available</p>
            </div>
            
            {/* Outer Green Glow Frame */}
            <div className="absolute inset-0 bg-emerald-500/5 rounded-3xl blur-md scale-105 -z-10" />
            <div className="absolute inset-0 border border-emerald-500/20 rounded-3xl scale-[1.02] -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
