import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNetworkStatus } from '../../lib/networkStatus'

export default function OfflineBanner() {
  const { isOnline, reconnectedAt } = useNetworkStatus()
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    if (reconnectedAt) {
      setShowReconnected(true)
      const timer = setTimeout(() => setShowReconnected(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [reconnectedAt])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium shadow-lg"
        >
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>لا يوجد اتصال بالإنترنت — You are offline. Changes will sync when reconnected.</span>
        </motion.div>
      )}
      {showReconnected && isOnline && (
        <motion.div
          key="reconnected"
          initial={{ y: -48, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -48, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-green-600 text-white px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium shadow-lg"
        >
          <Wifi className="w-4 h-4" />
          <span>تم استعادة الاتصال — Back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
