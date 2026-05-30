import { useSelector, useDispatch } from 'react-redux'
import { Menu, Search, Bell, Moon, Sun, Globe, LogOut, X, Mail, Phone } from 'lucide-react'
import { Fragment, useState, useEffect, useRef, useMemo } from 'react'
import { Transition, Popover } from '@headlessui/react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../lib/api'
import { logout } from '../../store/slices/authSlice'
import { setTheme, setLanguage, setMobileMenuOpen } from '../../store/slices/uiSlice'
import { useTranslation } from '../../lib/translations'

export default function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { tenant } = useSelector((state) => state.auth)
  const { theme, language } = useSelector((state) => state.ui)
  const { t } = useTranslation(language)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)
  const hasEmailAddon = tenant?.subscription?.hasEmailAddon === true || (Array.isArray(tenant?.subscription?.features) && tenant.subscription.features.includes('email_automation'))

  const notificationsQuery = useQuery({
    queryKey: ['header-email-notifications'],
    queryFn: () => api.get('/email/messages', { params: { folder: 'all', limit: 8 } }).then((res) => res.data),
    enabled: hasEmailAddon,
    refetchInterval: hasEmailAddon ? 60000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    staleTime: 55000,
    retry: false,
  })

  const notifications = useMemo(() => {
    const messages = notificationsQuery.data?.messages || []
    return messages
      .filter((message) => message.type === 'inbox' && !message.isRead)
      .slice(0, 6)
      .map((message) => ({
        id: message._id,
        type: 'email',
        title: message.subject || (language === 'ar' ? 'رسالة جديدة' : 'New email'),
        subtitle: message.from || '',
        time: new Date(message.createdAt).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-GB', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        read: false,
      }))
  }, [language, notificationsQuery.data])

  const unreadCount = notifications.length

  const markAsRead = async (id) => {
    if (!id) return
    try {
      await api.patch(`/email/messages/${id}/read`, { isRead: true })
    } catch {
    }
    queryClient.invalidateQueries({ queryKey: ['header-email-notifications'] })
    queryClient.invalidateQueries({ queryKey: ['tenant-email-messages'] })
    navigate('/app/dashboard/email')
  }

  const markAllAsRead = async () => {
    await Promise.all(notifications.map((notification) => api.patch(`/email/messages/${notification.id}/read`, { isRead: true }).catch(() => null)))
    queryClient.invalidateQueries({ queryKey: ['header-email-notifications'] })
    queryClient.invalidateQueries({ queryKey: ['tenant-email-messages'] })
  }

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'email': return Mail
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
          {/* Contact Icons */}
          <div className="hidden sm:flex items-center gap-1 border-e border-gray-200 dark:border-dark-600 pe-2 me-1">
            <a
              href="tel:+966596775485"
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors group relative"
            >
              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="tooltip -bottom-10 start-1/2 -translate-x-1/2 whitespace-nowrap">
                {language === 'ar' ? 'اتصال بالمبيعات' : 'Call Sales'}
              </span>
            </a>
            <a
              href="https://wa.me/966596775485"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl hover:bg-[#25D366]/10 transition-colors group relative"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              <span className="tooltip -bottom-10 start-1/2 -translate-x-1/2 whitespace-nowrap">
                WhatsApp
              </span>
            </a>
            <a
              href="mailto:support@maqder.com"
              className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors group relative"
            >
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="tooltip -bottom-10 start-1/2 -translate-x-1/2 whitespace-nowrap">
                {language === 'ar' ? 'مراسلة الدعم' : 'Email Support'}
              </span>
            </a>
          </div>

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
                            'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                              {notification.title}
                            </p>
                            {notification.subtitle ? (
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notification.subtitle}</p>
                            ) : null}
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
                  <button onClick={() => navigate('/app/dashboard/email')} className="w-full p-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors">
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
