import { useEffect, useState } from 'react'
import './OfflineBanner.css'

export function OfflineBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="offline-banner" role="status">
      별빛이 잠시 흐려졌어요. 연결되면 다시 이어갈게요.
    </div>
  )
}
