import { Download, Smartphone, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { IosInstallInstructionsModal } from '@/components/pwa/IosInstallInstructionsModal'
import { usePWAInstall } from '@/hooks/usePWAInstall'

export function InstallBanner() {
  const { isInstallable, isInstalled, platform, promptInstall } = usePWAInstall()
  const [dismissed, setDismissed] = useState(false)
  const [iosOpen, setIosOpen] = useState(false)
  if (isInstalled || dismissed || platform === 'desktop' && !isInstallable) return null
  return <><div className="fixed bottom-4 right-4 z-40 flex max-w-sm items-center gap-3 rounded-lg border border-emerald-400/30 bg-slate-900 px-4 py-3 text-sm text-slate-200 shadow-xl"><Smartphone className="h-5 w-5 shrink-0 text-emerald-400" /><span className="flex-1">Install Quirin Fitti for quick offline access.</span><Button type="button" size="sm" onClick={() => platform === 'ios' ? setIosOpen(true) : void promptInstall()}><Download className="mr-2 h-4 w-4" />Install</Button><button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss install banner" className="text-slate-500 hover:text-slate-100"><X className="h-4 w-4" /></button></div><IosInstallInstructionsModal open={iosOpen} onClose={() => setIosOpen(false)} /></>
}
