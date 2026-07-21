import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../lib/translations'
import api, { getImageUrl } from '../../lib/api'
import LoadingScreen from '../../components/ui/LoadingScreen'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, Globe, Search, ChevronRight, Info } from 'lucide-react'

export default function PublicMenu() {
  const [searchParams] = useSearchParams()
  const tenantId = searchParams.get('tenant')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState(null)
  const [activeCategory, setActiveCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
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
        const defaultLang = res.data?.tenant?.settings?.restaurant?.qrMenu?.defaultLanguage || 'ar'
        setLanguage(defaultLang)
        setLoading(false)
        
        // set active category initially
        if (res.data?.items?.length) {
          const cats = [...new Set(res.data.items.map(item => item.category))].filter(Boolean).sort()
          if (cats.length) setActiveCategory(cats[0])
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

  const filteredItems = useMemo(() => {
    if (!data?.items) return []
    return data.items.filter(item => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (item.nameEn?.toLowerCase().includes(q) || item.nameAr?.toLowerCase().includes(q) || item.category?.toLowerCase().includes(q))
      }
      return item.category === activeCategory
    })
  }, [data, activeCategory, searchQuery])

  if (loading) return <LoadingScreen />

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <UtensilsCrossed className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{isRtl ? 'عذراً' : 'Oops'}</h1>
          <p className="text-gray-500 font-medium">{error}</p>
        </div>
      </div>
    )
  }

  const { tenant } = data
  const businessName = isRtl ? (tenant.business?.legalNameAr || tenant.name) : (tenant.business?.legalNameEn || tenant.name)
  const heroImage = tenant.settings?.restaurant?.qrMenu?.heroImage
  const primaryColor = tenant.branding?.primaryColor || '#D97706' // amber-600 default
  const qrMenuSettings = tenant.settings?.restaurant?.qrMenu || {}
  const menuMode = qrMenuSettings.mode || 'digital'
  const menuImages = qrMenuSettings.menuImages || []

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-[#FDFDFD] font-sans selection:bg-amber-100 selection:text-amber-900 pb-24">
      
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] max-h-[500px] w-full bg-gray-900 overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-orange-900" />
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
        
        {/* Top Actions */}
        <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-10">
          <div className="bg-black/20 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/10">
            {tenant.branding?.logoUrl ? (
              <img src={tenant.branding.logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
            ) : (
              <UtensilsCrossed className="w-5 h-5 text-white" />
            )}
            <span className="text-white font-bold text-sm truncate max-w-[120px]">{businessName}</span>
          </div>
          
          <button 
            onClick={() => setLanguage(lang => lang === 'ar' ? 'en' : 'ar')}
            className="bg-black/20 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-full hover:bg-white/20 transition-all"
          >
            <Globe className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 inset-x-0 p-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
              {businessName}
            </h1>
            <p className="text-white/80 font-medium text-lg max-w-lg">
              {isRtl ? 'اكتشف قائمتنا المميزة واستمتع بأشهى المأكولات.' : 'Discover our exquisite menu and enjoy the finest culinary experience.'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto">
        {menuMode === 'image_only' ? (
          <div className="flex flex-col shadow-xl overflow-hidden md:rounded-3xl mx-0 md:mx-4 -mt-10 relative z-20 border border-gray-100 bg-white">
            {menuImages.length > 0 ? (
              menuImages.map((imgUrl, idx) => (
                <img key={idx} src={getImageUrl(imgUrl)} alt={`Menu page ${idx + 1}`} className="w-full h-auto object-contain block" />
              ))
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{isRtl ? 'لا توجد صور' : 'No Images'}</h3>
                <p className="text-gray-500">{isRtl ? 'لم يتم رفع صور القائمة بعد' : 'No menu images have been uploaded yet'}</p>
              </div>
            )}
          </div>
        ) : (
          <>
        {/* Search & Categories Bar (Sticky) */}
        <div className="sticky top-0 z-20 bg-[#FDFDFD]/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
          <div className="px-4 pt-4 pb-2">
            <div className="relative">
              <Search className={`absolute ${isRtl ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input 
                type="text" 
                placeholder={isRtl ? 'ابحث في القائمة...' : 'Search the menu...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-gray-100/80 border-none rounded-2xl py-3.5 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} focus:ring-2 focus:ring-amber-500 font-medium text-gray-900 placeholder-gray-500 transition-all`}
              />
            </div>
          </div>
          
          {!searchQuery && (
            <div className="px-4 py-3 overflow-x-auto no-scrollbar flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                    activeCategory === cat 
                      ? 'bg-gray-900 text-white shadow-md scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Menu Items Grid */}
        <div className="p-4 sm:p-6 mt-2">
          {searchQuery && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {isRtl ? 'نتائج البحث' : 'Search Results'} ({filteredItems.length})
              </h2>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredItems.map(item => (
                <motion.div 
                  key={item._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-white rounded-3xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 transition-all flex gap-4 overflow-hidden relative cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-amber-600 transition-colors">
                      {isRtl ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr)}
                    </h3>
                    
                    {(item.descriptionAr || item.descriptionEn) && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1 mb-3">
                        {isRtl ? (item.descriptionAr || item.descriptionEn) : (item.descriptionEn || item.descriptionAr)}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-3 mt-auto pt-2">
                      <span className="font-black text-lg text-gray-900">
                        {item.sellingPrice} <span className="text-sm font-bold text-amber-600">{isRtl ? 'ر.س' : 'SAR'}</span>
                      </span>
                      
                      {item.calories && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                          {item.calories} {isRtl ? 'سعرة' : 'Cal'}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {item.imageUrl && (
                    <div className="w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-50 relative shadow-inner">
                      <img 
                        src={item.imageUrl} 
                        alt={item.nameEn} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Info className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{isRtl ? 'لا توجد نتائج' : 'No Results Found'}</h3>
                <p className="text-gray-500">{isRtl ? 'حاول البحث بكلمات أخرى' : 'Try searching with different keywords'}</p>
              </div>
            )}
          </div>
        </div>
        </>
        )}
      </div>
      
      {/* Footer Powered By */}
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full border border-gray-200">
          <span className="text-xs font-medium text-gray-500">{isRtl ? 'مشغل بواسطة' : 'Powered by'}</span>
          <span className="font-black text-gray-900 tracking-tight text-sm">Maqder</span>
        </div>
      </div>
    </div>
  )
}
