import { useSelector } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useTranslation } from '../../lib/translations'
import { Printer, Download, UtensilsCrossed } from 'lucide-react'
import { useRef } from 'react'

export default function QRMenu() {
  const { language } = useSelector((state) => state.ui)
  const { tenant } = useSelector((state) => state.auth)
  const { t } = useTranslation(language)
  const isRtl = language === 'ar'
  
  const qrRef = useRef(null)

  const businessNameEn = tenant?.business?.legalNameEn || tenant?.name || 'Restaurant'
  const businessNameAr = tenant?.business?.legalNameAr || tenant?.name || 'مطعم'
  
  // The public URL for the menu based on the tenant ID
  const menuUrl = `${window.location.origin}/public/menu?tenant=${tenant?._id || ''}`

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!qrRef.current) return
    
    const svg = qrRef.current.querySelector('svg')
    if (!svg) return
    
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()
    
    img.onload = () => {
      // Create a canvas with padding and title
      canvas.width = img.width + 100
      canvas.height = img.height + 150
      
      // Fill white background
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw text
      ctx.fillStyle = "black"
      ctx.font = "bold 24px Arial"
      ctx.textAlign = "center"
      ctx.fillText(isRtl ? 'قائمة الطعام' : 'Menu', canvas.width / 2, 40)
      ctx.font = "20px Arial"
      ctx.fillText(isRtl ? businessNameAr : businessNameEn, canvas.width / 2, 70)
      
      // Draw QR Code
      ctx.drawImage(img, 50, 100)
      
      // Trigger download
      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = `QR_Menu_${businessNameEn.replace(/\s+/g, '_')}.png`
      downloadLink.href = `${pngFile}`
      downloadLink.click()
    }
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'رمز القائمة (QR)' : 'QR Menu'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isRtl ? 'عرض وتحميل رمز القائمة الخاصة بمطعمك' : 'View and download the QR code for your menu'}
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={handleDownload} className="btn btn-secondary">
            <Download className="w-4 h-4" />
            {isRtl ? 'تحميل' : 'Download'}
          </button>
          <button type="button" onClick={handlePrint} className="btn btn-primary">
            <Printer className="w-4 h-4" />
            {isRtl ? 'طباعة' : 'Print'}
          </button>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="bg-white rounded-3xl shadow-lg p-10 max-w-md w-full border border-gray-100 flex flex-col items-center print:shadow-none print:border-none print:p-0">
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              {isRtl ? businessNameAr : businessNameEn}
            </h2>
            <p className="text-gray-500 font-medium">
              {isRtl ? 'امسح الرمز لعرض قائمة الطعام' : 'Scan to view our menu'}
            </p>
          </div>

          <div ref={qrRef} className="bg-white p-6 border-4 border-gray-100 rounded-3xl shadow-sm mb-8">
            <QRCodeSVG 
              value={menuUrl} 
              size={250} 
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
      </div>
    </div>
  )
}
