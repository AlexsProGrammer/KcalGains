import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'

export function ReloadPrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()
  const { t } = useT()
  if (!needRefresh) return null
  return <div className="fixed right-4 top-4 z-50 flex items-center gap-3 rounded-lg border border-sky-400/30 bg-slate-900 px-4 py-3 text-sm text-slate-200 shadow-xl"><RefreshCw className="h-4 w-4 text-sky-300" />{t.common.newVersion}<Button type="button" size="sm" onClick={() => void updateServiceWorker(true)}>{t.common.refresh}</Button></div>
}
