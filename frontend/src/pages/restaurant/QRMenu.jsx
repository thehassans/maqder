import { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from '../../lib/translations'
import { Printer, Download, UtensilsCrossed, Settings as SettingsIcon, Image as ImageIcon, Save, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../../lib/api'
import { getMe } from '../../store/slices/authSlice'
import toast from 'react-hot-toast'

export default function QRMenu() {
  const dispatch = useDispatch()
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)
  const isRtl = language === 'ar'
  
  const qrRef = useRef(null)
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('qr_code')
  
  // Settings State
  const initialSettings = tenant?.settings?.restaurant?.qrMenu || { defaultLanguage: 'ar', heroImage: '' }
  const [qrSettings, setQrSettings] = useState(initialSettings)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const businessNameEn = tenant?.business?.legalNameEn || tenant?.name || 'Restaurant'
  const businessNameAr = tenant?.business?.legalNameAr || tenant?.name || 'مطعم'
  
  const menuUrl = `${window.location.origin}/public/menu?tenant=${tenant?._id || ''}`

  const handlePrint = () => window.print()

  const handleDownload = () => {
    if (!qrRef.current) return
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      canvas.width = img.width + 100
      canvas.height = img.height + 150
      
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = "black"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText(isRtl ? 'قائمة الطعام' : 'Menu', canvas.width / 2, 40)
      ctx.font = "20px Arial"
      ctx.fillText(isRtl ? businessNameAr : businessNameEn, canvas.width / 2, 70)
      
      ctx.drawImage(img, 50, 100)
      
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `QR_Menu_${businessNameEn.replace(/\s+/g, '_')}.png`
      downloadLink.href = `${pngFile}`
      downloadLink.click()
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('image', file)

    setIsUploading(true)
    try {
      const res = await api.post('/tenants/upload-qr-hero', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setQrSettings(prev => ({ ...prev, heroImage: res.data.imageUrl }))
      toast.success(isRtl ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully')
    } catch (error) {
      toast.error(isRtl ? 'فشل رفع الصورة' : 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await api.put('/tenants/current', {
        settings: {
          restaurant: {
            qrMenu: qrSettings
          }
        }
      })
      dispatch(getMe())
      toast.success(isRtl ? 'تم حفظ الإعدادات' : 'Settings saved')
    } catch (error) {
      toast.error(isRtl ? 'فشل الحفظ' : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'إدارة قائمة QR' : 'QR Menu Management'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isRtl ? 'تخصيص وتحميل رمز القائمة الخاصة بك' : 'Customize and download your QR menu'}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden print:border-none print:shadow-none">
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 print:hidden">
          <button
            onClick={() => setActiveTab('qr_code')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'qr_code'
                ? 'border-amber-500 text-amber-600 dark:text-amber-500 bg-white dark:bg-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            {isRtl ? 'رمز QR' : 'QR Code'}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-amber-500 text-amber-600 dark:text-amber-500 bg-white dark:bg-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            {isRtl ? 'إعدادات القائمة' : 'Menu Settings'}
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'qr_code' && (
              <motion.div
                key="qr_code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="bg-white rounded-3xl shadow-lg p-10 max-w-sm w-full border border-gray-100 flex flex-col items-center print:shadow-none print:border-none print:p-0">
                  <div className="text-center mb-8">
                    {tenant?.branding?.logo ? (
                       <img src={tenant.branding.logo} alt="Logo" className="h-16 mx-auto mb-4 object-contain" />
                    ) : (
                      <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UtensilsCrossed className="w-8 h-8" />
                      </div>
                    )}
                    <h2 className="text-2xl font-black text-gray-900 mb-2">
                      {isRtl ? businessNameAr : businessNameEn}
                    </h2>
                    <p className="text-gray-500 font-medium">
                      {isRtl ? 'امسح الرمز لعرض قائمة الطعام' : 'Scan to view our menu'}
                    </p>
                  </div>

                  <div ref={qrRef} className="bg-white p-4 border-4 border-gray-100 rounded-3xl shadow-sm mb-8">
                    <QRCodeSVG 
                      value={menuUrl} 
                      size={200} 
                      level="H"
                      includeMargin={false}
                      fgColor="#111827"
                      bgColor="#ffffff"
                    />
                  </div>

                  <div className="w-full border-t border-dashed border-gray-300 pt-6 text-center print:hidden">
                    <p className="text-sm text-gray-500 mb-2">{isRtl ? 'رابط القائمة المباشر:' : 'Direct Menu Link:'}</p>
                    <a 
                      href={menuUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-amber-600 hover:text-amber-700 font-medium text-sm break-all"
                    >
                      {menuUrl}
                    </a>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8 print:hidden">
                  <button type="button" onClick={handleDownload} className="btn btn-secondary">
                    <Download className="w-4 h-4" />
                    {isRtl ? 'تحميل الصورة' : 'Download Image'}
                  </button>
                  <button type="button" onClick={handlePrint} className="btn btn-primary bg-amber-600 hover:bg-amber-700">
                    <Printer className="w-4 h-4" />
                    {isRtl ? 'طباعة' : 'Print'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                {/* Hero Image */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {isRtl ? 'صورة الغلاف (Hero Image)' : 'Hero Image'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {isRtl ? 'هذه الصورة ستظهر في أعلى القائمة لتضيف طابعاً فخماً.' : 'This image will appear at the top of the menu to give it a premium look.'}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                    {qrSettings.heroImage ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                        <img src={qrSettings.heroImage} alt="Hero" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-secondary"
                            disabled={isUploading}
                          >
                            <ImageIcon className="w-4 h-4" />
                            {isRtl ? 'تغيير الصورة' : 'Change Image'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <button 
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="btn btn-secondary"
                          disabled={isUploading}
                        >
                          {isUploading ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'رفع صورة' : 'Upload Image')}
                        </button>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                    />
                  </div>
                </div>

                {/* Default Language */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {isRtl ? 'اللغة الافتراضية للقائمة' : 'Default Menu Language'}
                    </h3>
                  </div>
                  <div className="flex gap-4">
                    <label className={`flex-1 flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                      qrSettings.defaultLanguage === 'ar' 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>
                      <input 
                        type="radio" 
                        name="defaultLanguage" 
                        value="ar"
                        checked={qrSettings.defaultLanguage === 'ar'}
                        onChange={(e) => setQrSettings({ ...qrSettings, defaultLanguage: e.target.value })}
                        className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                      />
                      <div className="ml-3 rtl:mr-3">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">العربية</span>
                        <span className="block text-xs text-gray-500">Arabic</span>
                      </div>
                    </label>
                    <label className={`flex-1 flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                      qrSettings.defaultLanguage === 'en' 
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 dark:border-amber-500' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>
                      <input 
                        type="radio" 
                        name="defaultLanguage" 
                        value="en"
                        checked={qrSettings.defaultLanguage === 'en'}
                        onChange={(e) => setQrSettings({ ...qrSettings, defaultLanguage: e.target.value })}
                        className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                      />
                      <div className="ml-3 rtl:mr-3">
                        <span className="block text-sm font-bold text-gray-900 dark:text-white">English</span>
                        <span className="block text-xs text-gray-500">الإنجليزية</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                  <button 
                    onClick={handleSaveSettings} 
                    disabled={isSaving}
                    className="btn btn-primary bg-amber-600 hover:bg-amber-700"
                  >
                    {isSaving ? <span className="animate-pulse">...</span> : <Save className="w-4 h-4" />}
                    {isRtl ? 'حفظ الإعدادات' : 'Save Settings'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
