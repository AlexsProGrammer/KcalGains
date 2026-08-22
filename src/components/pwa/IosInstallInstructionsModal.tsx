import { Share, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Props = { open: boolean; onClose: () => void }
export function IosInstallInstructionsModal({ open, onClose }: Props) {
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"><div className="w-full max-w-md rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-wide text-emerald-400">iPhone installation</p><h2 className="mt-1 text-lg font-semibold text-slate-100">Add KcalGains to your Home Screen</h2></div><Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close installation instructions"><X className="h-4 w-4" /></Button></div><ol className="mt-5 space-y-4 text-sm text-slate-300"><li><strong className="text-slate-100">1.</strong> In Safari, tap the <Share className="mx-1 inline h-4 w-4 text-sky-300" /> share icon.</li><li><strong className="text-slate-100">2.</strong> Scroll down and choose “Add to Home Screen”.</li><li><strong className="text-slate-100">3.</strong> Confirm with “Add” in the top-right corner.</li></ol><p className="mt-5 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs leading-5 text-slate-400">Opening the app from the Home Screen gives it a standalone storage container and helps protect local data from iOS cache cleanup.</p></div></div>
}
