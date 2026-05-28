import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { ShoppingCart, Package, ListOrdered } from 'lucide-react'

export default function SaloonSidebar() {
  const { language } = useSelector((state) => state.ui)
  const isRtl = language === 'ar'

  const navItems = [
    { id: 'pos', path: '/app/saloon/pos', icon: ShoppingCart, labelEn: 'Saloon POS', labelAr: 'نقطة البيع (صالون)' },
    { id: 'orders', path: '/app/saloon/orders', icon: ListOrdered, labelEn: 'Active Orders', labelAr: 'الطلبات النشطة' },
    { id: 'services', path: '/app/saloon/services', icon: Package, labelEn: 'Services Catalog', labelAr: 'قائمة الخدمات' },
  ]

  return (
    <div className="py-6 px-4">
      <div className="mb-6 px-2">
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {isRtl ? 'إدارة الصالون' : 'Saloon Management'}
        </h2>
      </div>
      
      <nav className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 font-medium shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-dark-700 dark:hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 w-1 h-6 bg-amber-500 rounded-full`} />
                )}
                <item.icon className={`w-5 h-5 ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'}`} />
                <span>{isRtl ? item.labelAr : item.labelEn}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
