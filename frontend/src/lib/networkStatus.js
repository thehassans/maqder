import { useState, useEffect } from 'react'

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [reconnectedAt, setReconnectedAt] = useState(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setReconnectedAt(new Date())
    }
    const handleOffline = () => {
      setIsOnline(false)
      setReconnectedAt(null)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, reconnectedAt }
}

export default useNetworkStatus
