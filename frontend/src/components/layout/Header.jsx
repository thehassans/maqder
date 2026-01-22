import { useSelector, useDispatch } from 'react-redux'
import { Menu, Search, Bell, Moon, Sun, Globe, LogOut, X, FileText, Users, Package } from 'lucide-react'
import { Fragment, useState, useEffect, useRef } from 'react'
import { Transition, Popover } from '@headlessui/react'
import { useNavigate, useLocation } from 'react-router-dom'
import { logout } from '../../store/slices/authSlice'
import { setTheme, setLanguage, setMobileMenuOpen } from '../../store/slices/uiSlice'
import { useTranslation } from '../../lib/translations'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { tenant } = useSelector((state) => state.auth)
  const { theme, language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'invoice', title: language === 'ar' ? 'فاتورة جديدة' : 'New Invoice Created', time: '5m ago', read: false },
    { id: 2, type: 'user', title: language === 'ar' ? 'مستخدم جديد' : 'New User Registered', time: '1h ago', read: false },
    { id: 3, type: 'inventory', title: language === 'ar' ? 'مخزون منخفض' : 'Low Stock Alert', time: '2h ago', read: true },
  ])
  const searchRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'invoice': return FileText
      case 'user': return Users
      case 'inventory': return Package
      default: return Bell
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      if (query.includes('invoice') || query.includes('فاتورة')) {
        navigate('/app/dashboard/invoices')
      } else if (query.includes('expense') || query.includes('expenses') || query.includes('مصروف') || query.includes('مصاريف')) {
        navigate('/app/dashboard/expenses')
      } else if (query.includes('employee') || query.includes('موظف')) {
        navigate('/app/dashboard/employees')
      } else if (query.includes('customer') || query.includes('عميل')) {
        navigate('/app/dashboard/customers')
      } else if (query.includes('contact') || query.includes('contacts') || query.includes('جهات') || query.includes('اتصال')) {
        navigate('/app/dashboard/contacts')
      } else if (query.includes('product') || query.includes('منتج')) {
        navigate('/app/dashboard/products')
      } else if (query.includes('report') || query.includes('تقرير')) {
        navigate('/app/dashboard/reports')
      }
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  const headerStyle = tenant?.branding?.headerStyle || 'glass'
  const headerClassName =
    headerStyle === 'solid'
      ? 'sticky top-0 z-30 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700'
      : 'sticky top-0 z-30 bg-white/80 dark:bg-dark-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-dark-700'

  return (
    <header className={headerClassName}>
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => dispatch(setMobileMenuOpen(true))}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden sm:flex items-center">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                className="w-48 lg:w-64 ps-10 pe-4 py-2 text-sm bg-gray-100 dark:bg-dark-700 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute end-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-dark-600 rounded"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => dispatch(setLanguage(language === 'en' ? 'ar' : 'en'))}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors group relative"
          >
            <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="tooltip -bottom-10 start-1/2 -translate-x-1/2 whitespace-nowrap">
              {language === 'en' ? 'العربية' : 'English'}
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => dispatch(setTheme(theme === 'dark' ? 'light' : 'dark'))}
            className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Notifications */}
          <Popover className="relative">
            <Popover.Button className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors focus:outline-none">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 end-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-medium flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Popover.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Popover.Panel className="absolute end-0 mt-2 w-80 origin-top-right bg-white dark:bg-dark-800 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 focus:outline-none overflow-hidden z-50">
                <div className="p-3 border-b border-gray-100 dark:border-dark-700 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                    >
                      {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all read'}
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type)
                      return (
                        <button
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors text-start ${
                            !notification.read ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            notification.type === 'invoice' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                            notification.type === 'user' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{notification.time}</p>
                          </div>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>

                <div className="p-2 border-t border-gray-100 dark:border-dark-700">
                  <button className="w-full p-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors">
                    {language === 'ar' ? 'عرض كل الإشعارات' : 'View all notifications'}
                  </button>
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          <div className="w-px h-6 bg-gray-200 dark:bg-dark-600 mx-1" />

          <button
            onClick={() => dispatch(logout())}
            className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group relative"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
            <span className="tooltip -bottom-10 start-1/2 -translate-x-1/2 whitespace-nowrap">
              {t('logout')}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
