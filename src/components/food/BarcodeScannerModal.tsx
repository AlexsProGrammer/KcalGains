import { Camera, Flashlight, ScanLine, X } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { resolveBarcode } from '@/services/barcodeScannerService'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import type { Food } from '@/types'

type BarcodeScannerModalProps = {
  open: boolean
  onClose: () => void
  onFoodResolved?: (food: Food) => void
}

export function BarcodeScannerModal({ open, onClose, onFoodResolved }: BarcodeScannerModalProps) {
  const [manualBarcode, setManualBarcode] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [torchEnabled, setTorchEnabled] = useState(false)

  async function handleBarcode(barcode: string) {
    setIsResolving(true)
    setResolveError(null)

    try {
      const food = await resolveBarcode(barcode)

      if (!food) {
        setResolveError('No food was found or it could not be saved locally. You can try another code.')
        return
      }

      onFoodResolved?.(food)
      onClose()
    } catch {
      setResolveError('The barcode result could not be processed. You can try the manual field again.')
    } finally {
      setIsResolving(false)
    }
  }

  const { error: scannerError, isScanning, toggleTorch, videoRef } = useBarcodeScanner({
    enabled: open,
    onDetected: (barcode) => void handleBarcode(barcode),
  })

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4" role="dialog" aria-modal="true" aria-labelledby="barcode-scanner-title">
      <div className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400">Food lookup</p>
            <h2 id="barcode-scanner-title" className="mt-1 text-lg font-semibold text-slate-100">Scan a barcode</h2>
          </div>
          <Button type="button" variant="ghost" size="sm" aria-label="Close scanner" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="relative aspect-video overflow-hidden bg-black">
          <video ref={videoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-28 w-56 border-2 border-emerald-400 shadow-[0_0_0_999px_rgba(2,6,23,0.45)]" />
          </div>
          <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-slate-950/75 px-3 py-1 text-xs text-slate-200">
            <ScanLine className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            {isScanning ? 'Scanning...' : 'Starting camera...'}
          </div>
          <Button type="button" variant="secondary" size="sm" className="absolute bottom-3 right-3" aria-label="Toggle flashlight" onClick={() => void toggleTorch().then(setTorchEnabled)}>
            <Flashlight className={`h-4 w-4 ${torchEnabled ? 'text-amber-300' : ''}`} aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {scannerError ? <Alert variant="warning" title="Camera unavailable">{scannerError} Use the manual barcode field below.</Alert> : null}
          {resolveError ? <Alert variant="error">{resolveError}</Alert> : null}
          <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); void handleBarcode(manualBarcode) }}>
            <input
              value={manualBarcode}
              onChange={(event) => setManualBarcode(event.target.value)}
              inputMode="numeric"
              pattern="[0-9]+"
              placeholder="Enter barcode manually"
              aria-label="Manual barcode"
              className="min-h-10 min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-emerald-400"
            />
            <Button type="submit" disabled={!manualBarcode.trim() || isResolving}>
              <Camera className="mr-2 h-4 w-4" aria-hidden="true" />
              {isResolving ? 'Looking up...' : 'Look up'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
