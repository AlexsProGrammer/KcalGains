import { HardDrive, ShieldCheck, ShieldOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useT } from '@/i18n'
import { useStoragePersistence } from '@/hooks/useStoragePersistence'

function formatMegabytes(bytes: number | null): string {
  if (bytes === null) {
    return 'Unavailable'
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function StorageStatus() {
  const { t } = useT()
  const { isPersisted, quotaUsageBytes, quotaTotalBytes, requestPermission } = useStoragePersistence()
  const StatusIcon = isPersisted ? ShieldCheck : ShieldOff
  const statusLabel = isPersisted === null ? t.more.storageChecking : isPersisted ? t.more.storageGranted : t.more.storageUnavailable

  return (
    <Card>
      <CardHeader icon={<HardDrive />} title={t.more.browserStorage} />
      <CardContent>
        <div className="flex items-center gap-2 font-medium text-slate-200">
          <StatusIcon className={isPersisted ? 'h-4 w-4 text-emerald-400' : 'h-4 w-4 text-amber-400'} aria-hidden="true" />
          <span className={`rounded-full border px-2 py-0.5 text-xs ${isPersisted ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-amber-400/30 bg-amber-400/10 text-amber-300'}`}>
            {statusLabel}
          </span>
        </div>
        <p className="mt-2">{t.more.storageUsage.replace('{used}', formatMegabytes(quotaUsageBytes)).replace('{total}', formatMegabytes(quotaTotalBytes))}</p>
        {isPersisted === false ? (
          <div className="mt-3">
            <Button type="button" size="sm" onClick={() => void requestPermission()}>{t.more.allowPersistent}</Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
