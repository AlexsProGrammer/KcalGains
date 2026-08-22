import { WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useT } from '@/i18n'

export function OfflineIndicator() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && !navigator.onLine)
  const { t } = useT()
  useEffect(() => {
    const online = () => setOffline(false)
    const offline = () => setOffline(true)
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => { window.removeEventListener('online', online); window.removeEventListener('offline', offline) }
  }, [])
  if (!offline) return null
  return <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-full border border-amber-400/40 bg-slate-900 px-3 py-2 text-xs text-amber-200 shadow-lg"><WifiOff className="h-4 w-4" /> {t.common.offline}</div>
}
