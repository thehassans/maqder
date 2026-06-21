import { useEffect, useRef, useState } from 'react'
import { Camera, X, ScanLine, AlertCircle } from 'lucide-react'

/**
 * Camera-based barcode scanner using the browser's native BarcodeDetector API.
 * Works in Chromium browsers (Chrome/Edge) without any external dependency.
 * Falls back gracefully with a message when unsupported.
 *
 * Props:
 *  - onDetected(code: string): called once when a barcode is decoded
 *  - onClose(): close the scanner overlay
 */
export default function BarcodeScanner({ onDetected, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const detectorRef = useRef(null)
  const lockRef = useRef(false)
  const [error, setError] = useState(null)
  const [supported, setSupported] = useState(true)

  useEffect(() => {
    let cancelled = false

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    const start = async () => {
      if (!('BarcodeDetector' in window)) {
        setSupported(false)
        return
      }
      try {
        const formats = await window.BarcodeDetector.getSupportedFormats()
        detectorRef.current = new window.BarcodeDetector({
          formats: formats?.length
            ? formats
            : ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
        })

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        scan()
      } catch (err) {
        setError(err?.message || 'Unable to access camera')
      }
    }

    const scan = async () => {
      if (cancelled || lockRef.current || !videoRef.current || !detectorRef.current) {
        rafRef.current = requestAnimationFrame(scan)
        return
      }
      try {
        const codes = await detectorRef.current.detect(videoRef.current)
        if (codes && codes.length > 0) {
          const value = String(codes[0].rawValue || '').trim()
          if (value) {
            lockRef.current = true
            stop()
            onDetected?.(value)
            return
          }
        }
      } catch {
        // ignore frame errors
      }
      rafRef.current = requestAnimationFrame(scan)
    }

    start()
    return () => {
      cancelled = true
      stop()
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" /> Scan Barcode
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
          {!supported ? (
            <div className="text-center text-white/80 p-8">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-70" />
              <p className="font-semibold">Camera scanning not supported</p>
              <p className="text-sm text-white/60 mt-1">
                Use Google Chrome, or scan with a USB barcode scanner into the input field.
              </p>
            </div>
          ) : error ? (
            <div className="text-center text-white/80 p-8">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-70" />
              <p className="font-semibold">{error}</p>
              <p className="text-sm text-white/60 mt-1">Please allow camera access and try again.</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-1/3 border-2 border-emerald-400/80 rounded-2xl relative">
                  <ScanLine className="w-full h-full text-emerald-400/30" />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">Point the camera at the product barcode.</p>
        </div>
      </div>
    </div>
  )
}
