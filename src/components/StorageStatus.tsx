import { HardDrive, ShieldCheck, ShieldOff } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useStoragePersistence } from '@/hooks/useStoragePersistence'

function formatMegabytes(bytes: number | null): string {
  if (bytes === null) {
    return 'Unavailable'
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function StorageStatus() {
  const { isPersisted, quotaUsageBytes, quotaTotalBytes } = useStoragePersistence()
  const StatusIcon = isPersisted ? ShieldCheck : ShieldOff
  const statusLabel = isPersisted === null ? 'Checking' : isPersisted ? 'Persistent storage granted' : 'Persistent storage unavailable'

  return (
    <Card>
      <CardHeader icon={<HardDrive />} title="Browser storage" />
      <CardContent>
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <StatusIcon className={isPersisted ? 'h-4 w-4 text-emerald-400' : 'h-4 w-4 text-amber-400'} aria-hidden="true" />
          <span className={`rounded-full border px-2 py-0.5 text-xs ${isPersisted ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>
            {statusLabel}
          </span>
        </div>
        <p className="mt-2">Usage: {formatMegabytes(quotaUsageBytes)} / {formatMegabytes(quotaTotalBytes)}</p>
      </CardContent>
    </Card>
  )
}
