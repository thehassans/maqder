import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../lib/translations'
import api from '../../lib/api'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { motion } from 'framer-motion'
import { UtensilsCrossed } from 'lucide-react'

export default function PublicMenu() {
  const [searchParams] = useSearchParams()
  const tenantId = searchParams.get('tenant')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  
  // default to Arabic for Saudi menus, can add a language toggle
  const [language, setLanguage] = useState('ar')
  const { t } = useTranslation(language)
  const isRtl = language === 'ar'

  useEffect(() => {
    if (!tenantId) {
      setError('Invalid Menu Link')
      setLoading(false)
      return
    }

    api.get(`/public/tenant/${tenantId}/menu`)
      .then(res => {
        setData(res.data)
        setLoading(false)
        if (res.data?.tenant?.business?.language) {
          setLanguage(res.data.tenant.business.language)
        }
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to load menu')
        setLoading(false)
      })
  }, [tenantId])

  const categories = useMemo(() => {
    if (!data?.items) return []
    const cats = [...new Set(data.items.map(item => item.category))].filter(Boolean)
    return cats.sort()
  }, [data])

  if (loading) return <LoadingScreen />

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{isRtl ? 'خطأ' : 'Error'}</h1>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  const { tenant, items } = data
  const businessName = isRtl ? (tenant.business?.legalNameAr || tenant.name) : (tenant.business?.legalNameEn || tenant.name)

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.branding?.logoUrl ? (
              <img src={tenant.branding.logoUrl} alt={businessName} className="h-10 w-10 object-contain rounded-md" />
            ) : (
              <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-md flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6" />
              </div>
            )}
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{businessName}</h1>
          </div>
          <button 
            onClick={() => setLanguage(lang => lang === 'ar' ? 'en' : 'ar')}
            className="text-sm font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full"
          >
            {isRtl ? 'English' : 'عربي'}
          </button>
        </div>
        
        {/* Categories Nav */}
        <div className="max-w-3xl mx-auto px-4 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-700">
          <div className="flex gap-4 py-3">
            {categories.map(cat => (
              <a 
                key={cat}
                href={`#cat-${cat}`}
                className="whitespace-nowrap text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500"
              >
                {cat}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {isRtl ? 'لا يوجد أصناف في القائمة' : 'No items in the menu'}
          </div>
        ) : (
          categories.map(cat => {
            const catItems = items.filter(i => i.category === cat)
            return (
              <div key={cat} id={`cat-${cat}`} className="scroll-mt-32">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-1 bg-amber-500 rounded-full inline-block"></span>
                  {cat}
                </h2>
                
                <div className="grid gap-4 sm:grid-cols-2">
                  {catItems.map(item => (
                    <motion.div 
                      key={item._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white text-base">
                            {isRtl ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}
                          </h3>
                          <span className="font-black text-amber-600 whitespace-nowrap ml-2">
                            {item.sellingPrice} {isRtl ? 'ر.س' : 'SAR'}
                          </span>
                        </div>
                        
                        {(item.descriptionAr || item.descriptionEn) && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {isRtl ? (item.descriptionAr || item.descriptionEn) : (item.descriptionEn || item.descriptionAr)}
                          </p>
                        )}
                        
                        {item.calories && (
                          <div className="mt-2 text-xs font-medium text-orange-500 bg-orange-50 inline-block px-2 py-0.5 rounded-full">
                            {item.calories} {isRtl ? 'سعرة' : 'Cal'}
                          </div>
                        )}
                      </div>
                      
                      {item.imageUrl && (
                        <div className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                          <img 
                            src={item.imageUrl} 
                            alt={item.nameEn} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
      
      {/* Footer Powered By */}
      <div className="text-center py-6 mt-8">
        <p className="text-xs text-gray-400">
          {isRtl ? 'مشغل بواسطة' : 'Powered by'} <span className="font-bold text-gray-600 dark:text-gray-300">Maqder</span>
        </p>
      </div>
    </div>
  )
}
