import { useSelector } from 'react-redux'
import { Building2, Sparkles, PhoneCall } from 'lucide-react'

export default function RestaurantBranches() {
  const { language } = useSelector(state => state.ui)
  const isRtl = language === 'ar'

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] p-4 text-center">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-dark-800 dark:to-dark-900 border border-amber-100 dark:border-dark-700 rounded-3xl p-10 max-w-2xl shadow-xl relative overflow-hidden">
        
        {/* Decor */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-400 opacity-20 blur-3xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-orange-400 opacity-20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="w-24 h-24 bg-white dark:bg-dark-800 rounded-full shadow-lg flex items-center justify-center mx-auto mb-6 relative">
          <Building2 className="w-12 h-12 text-amber-600" />
          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full p-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
          {isRtl ? 'إدارة الفروع المتعددة' : 'Multi-Branch Management'}
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed">
          {isRtl 
            ? 'نظام إدارة الفروع هو خدمة إضافية متميزة. يتيح لك إدارة القوائم، المخزون، والتقارير لكل فرع على حدة من لوحة تحكم واحدة مركزية.' 
            : 'Multi-Branch Management is a premium add-on service. It allows you to manage menus, inventory, and reports for each branch independently from a single centralized dashboard.'}
        </p>

        <a 
          href="mailto:support@maqder.com"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95"
        >
          <PhoneCall className="w-5 h-5" />
          {isRtl ? 'تواصل مع فريق مقدر' : 'Contact Maqder Team'}
        </a>

        <div className="mt-8 pt-6 border-t border-amber-200/50 dark:border-dark-700/50 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
          <div className="flex flex-col items-center">
            <span className="text-amber-600 font-bold mb-1">01</span>
            {isRtl ? 'تقارير مجمعة' : 'Consolidated Reports'}
          </div>
          <div className="flex flex-col items-center border-t sm:border-t-0 sm:border-l sm:border-r border-amber-200/50 dark:border-dark-700/50 pt-4 sm:pt-0">
            <span className="text-amber-600 font-bold mb-1">02</span>
            {isRtl ? 'مخزون مركزي' : 'Centralized Inventory'}
          </div>
          <div className="flex flex-col items-center border-t sm:border-t-0 border-amber-200/50 dark:border-dark-700/50 pt-4 sm:pt-0">
            <span className="text-amber-600 font-bold mb-1">03</span>
            {isRtl ? 'قوائم مخصصة' : 'Branch-Specific Menus'}
          </div>
        </div>
      </div>
    </div>
  )
}
