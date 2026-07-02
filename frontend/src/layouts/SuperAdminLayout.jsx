import { Outlet, NavLink } from 'react-router-dom'
import { Suspense } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  Mail,
  Inbox,
  ShieldCheck,
  LogOut,
  Moon,
  Sun,
  Globe,
  Smartphone,
  HelpCircle
} from 'lucide-react'
import { logout } from '../store/slices/authSlice'
import { setTheme, setLanguage } from '../store/slices/uiSlice'
import { useTranslation } from '../lib/translations'

export default function SuperAdminLayout() {
  const dispatch = useDispatch()
  const { theme, language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const navItems = [
    { path: '/super-admin', icon: LayoutDashboard, label: t('dashboard'), end: true },
    { path: '/super-admin/tenants', icon: Building2, label: t('tenants') },
    { path: '/super-admin/queries', icon: HelpCircle, label: t('queries') },
    { path: '/super-admin/website', icon: Globe, label: t('websiteSettings') },
    { path: '/super-admin/email', icon: Mail, label: t('email') },
    { path: '/super-admin/mailbox', icon: Inbox, label: t('mailbox') },
    { path: '/super-admin/whatsapp', icon: Smartphone, label: t('whatsapp') },
    { path: '/super-admin/identity', icon: ShieldCheck, label: t('identitySettings') },
    { path: '/super-admin/gemini', icon: Settings, label: t('geminiSettings') },
    { path: '/super-admin/system-settings', icon: Settings, label: t('systemSettings') },
    { path: '/super-admin/zatca', icon: ShieldCheck, label: 'ZATCA' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#1a3d28] text-white">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-6">
            <img src="/maqdernewlogo.webp" alt="Maqder" className="h-14 w-auto object-contain transform scale-150 origin-left" />
            <span className="text-sm font-medium bg-white/20 text-white px-3 py-1 rounded-full whitespace-nowrap ml-8">
              {t('superAdmin')}
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => dispatch(setLanguage(language === 'en' ? 'ar' : 'en'))}
              className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Globe className="w-5 h-5" />
            </button>
            <button
              onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
              className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="w-px h-6 bg-white/20" />

            <button
              onClick={() => dispatch(logout())}
              className="p-2 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}
