import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'

export function ReloadPrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  if (!needRefresh) return null
  return <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg border border-sky-400/30 bg-slate-900 px-4 py-3 text-sm text-slate-200 shadow-xl"><RefreshCw className="h-4 w-4 text-sky-300" />New version available<Button type="button" size="sm" onClick={() => void updateServiceWorker(true)}>Reload</Button></div>
}
