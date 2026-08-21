import { useEffect, useRef, useState } from 'react'
import { startBarcodeScanner, type BarcodeScannerControls } from '@/services/barcodeScannerService'

type UseBarcodeScannerOptions = {
  enabled: boolean
  onDetected: (barcode: string) => void
}

export function useBarcodeScanner({ enabled, onDetected }: UseBarcodeScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const onDetectedRef = useRef(onDetected)
  const controlsRef = useRef<BarcodeScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  onDetectedRef.current = onDetected

  useEffect(() => {
    if (!enabled || !videoRef.current) {
      return
    }

    let isActive = true
    setError(null)

    void startBarcodeScanner(
      videoRef.current,
      (barcode) => onDetectedRef.current(barcode),
      (scannerError) => {
        if (isActive) {
          setError(scannerError.message)
        }
      },
    ).then((controls) => {
      if (isActive) {
        controlsRef.current = controls
        setIsScanning(true)
      } else {
        controls.stop()
      }
    }).catch((scannerError: unknown) => {
      if (isActive) {
        setError(scannerError instanceof Error ? scannerError.message : 'Unable to access the camera.')
        setIsScanning(false)
      }
    })

    return () => {
      isActive = false
      controlsRef.current?.stop()
      controlsRef.current = null
      setIsScanning(false)
    }
  }, [enabled])

  function stop() {
    controlsRef.current?.stop()
    controlsRef.current = null
    setIsScanning(false)
  }

  async function toggleTorch(): Promise<boolean> {
    return controlsRef.current?.toggleTorch() ?? false
  }

  return { error, isScanning, stop, toggleTorch, videoRef }
}
