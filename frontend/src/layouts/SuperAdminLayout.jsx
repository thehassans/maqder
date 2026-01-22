import { Outlet, NavLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  LogOut,
  Moon,
  Sun,
  Globe
} from 'lucide-react'
import { logout } from '../store/slices/authSlice'
import { setTheme, setLanguage } from '../store/slices/uiSlice'
import { useTranslation } from '../lib/translations'

export default function SuperAdminLayout() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { theme, language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)

  const navItems = [
    { path: '/super-admin', icon: LayoutDashboard, label: t('dashboard'), end: true },
    { path: '/super-admin/tenants', icon: Building2, label: t('tenants') },
    { path: '/super-admin/gemini', icon: Settings, label: t('geminiSettings') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-[#1a3d28] text-white">
        <div className="flex items-center justify-between px-6 h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg">
                <img src="/maqder-logo.png" alt="Maqder" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-bold text-lg">Maqder ERP</span>
                <span className="ms-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                  Super Admin
                </span>
              </div>
            </div>
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
            
            <div className="flex items-center gap-3">
              <div className="text-end">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            </div>
            
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
        <Outlet />
      </main>
    </div>
  )
}
