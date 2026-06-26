import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileCode2, Copy, Check } from 'lucide-react'
import api from '../../lib/api'

export default function ZatcaXmlViewer({ invoiceId, tenantName, invoiceNumber, onClose }) {
  const [copied, setCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['zatca-invoice-xml', invoiceId],
    queryFn: () => api.get(`/super-admin/zatca/invoice/${invoiceId}/xml`).then(res => res.data),
    enabled: Boolean(invoiceId),
  })

  const handleCopy = () => {
    if (data?.xml) {
      navigator.clipboard.writeText(data.xml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (data?.xml) {
      const blob = new Blob([data.xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${data.invoiceNumber || 'invoice'}.xml`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const formatXml = (xml) => {
    if (!xml) return ''
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(xml, 'application/xml')
      const serializer = new XMLSerializer()
      const formatted = serializer.serializeToString(doc)
      return formatted.replace(/></g, '>\n<')
    } catch {
      return xml
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-dark-700">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-primary-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">UBL XML Viewer</h3>
                <p className="text-xs text-gray-500">
                  {data?.invoiceNumber || invoiceNumber} · {data?.tenantName || tenantName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} disabled={!data?.xml} className="btn btn-secondary btn-sm flex items-center gap-1.5">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button onClick={handleDownload} disabled={!data?.xml} className="btn btn-secondary btn-sm flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.hasXml ? (
            <div className="p-12 text-center text-gray-400">
              <FileCode2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No XML data available for this invoice</p>
            </div>
          ) : (
            <>
              {data.metadata && (
                <div className="px-4 py-2 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50">
                  <div className="flex flex-wrap gap-3 text-xs">
                    {data.metadata.uuid && (
                      <span className="text-gray-500">UUID: <code className="font-mono text-gray-700 dark:text-gray-300">{data.metadata.uuid.slice(0, 8)}...</code></span>
                    )}
                    {data.metadata.invoiceHash && (
                      <span className="text-gray-500">Hash: <code className="font-mono text-gray-700 dark:text-gray-300">{data.metadata.invoiceHash?.slice(0, 16)}...</code></span>
                    )}
                    {data.metadata.invoiceCounter != null && (
                      <span className="text-gray-500">Counter: <span className="font-medium text-gray-700 dark:text-gray-300">{data.metadata.invoiceCounter}</span></span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-xs font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all leading-relaxed">
                  {formatXml(data.xml)}
                </pre>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
