import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser'
import { getFoodByBarcode } from '@/db/foodRepository'
import { cacheFoodFromOpenFoodFacts, fetchProductByBarcode } from '@/services/openFoodFactsService'
import type { Food } from '@/types'

export type BarcodeScannerControls = {
  stop: () => void
  toggleTorch: () => Promise<boolean>
}

async function requestCameraPermission(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Camera access requires HTTPS on your phone. Open the app over an HTTPS URL, then allow camera access.')
  }

  if (typeof window !== 'undefined' && !window.isSecureContext) {
    throw new Error('Camera access is blocked on this phone URL because it is not HTTPS. Use an HTTPS dev URL, then allow camera access.')
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: 'environment' },
    })
    stream.getTracks().forEach((track) => track.stop())
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      throw new Error('Camera permission was denied. Allow camera access in your browser settings and try again.')
    }

    if (error instanceof DOMException && error.name === 'NotFoundError') {
      throw new Error('No camera was found on this device.')
    }

    throw new Error('The camera could not be opened. Check browser permissions and try again.')
  }
}

export async function startBarcodeScanner(
  videoElement: HTMLVideoElement,
  onDetected: (barcode: string) => void,
  onError: (error: Error) => void,
): Promise<BarcodeScannerControls> {
  await requestCameraPermission()

  const reader = new BrowserMultiFormatReader()
  let scannerControls: IScannerControls | undefined
  let hasReportedResult = false

  try {
    scannerControls = await reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoElement,
      (result, error) => {
        if (result && !hasReportedResult) {
          hasReportedResult = true
          onDetected(result.getText())
        } else if (error && error.name !== 'NotFoundException') {
          onError(error)
        }
      },
    )
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to start the camera.')
  }

  return {
    stop: () => {
      scannerControls?.stop()
      const stream = videoElement.srcObject
      if (stream instanceof MediaStream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      videoElement.srcObject = null
    },
    toggleTorch: async () => {
      const stream = videoElement.srcObject
      const track = stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined
      const capabilities = track?.getCapabilities() as (MediaTrackCapabilities & { torch?: boolean }) | undefined

      if (!track || !capabilities?.torch) {
        return false
      }

      const settings = track.getSettings() as MediaTrackSettings & { torch?: boolean }
      const constraints = { advanced: [{ torch: !settings.torch }] } as unknown as MediaTrackConstraints
      await track.applyConstraints(constraints)
      return true
    },
  }
}

export async function resolveBarcode(barcode: string): Promise<Food | undefined> {
  const normalizedBarcode = barcode.trim()

  if (!normalizedBarcode) {
    return undefined
  }

  try {
    const localFood = await getFoodByBarcode(normalizedBarcode)
    if (localFood) {
      return localFood
    }

    const remoteFood = await fetchProductByBarcode(normalizedBarcode)
    return remoteFood ? await cacheFoodFromOpenFoodFacts(remoteFood) : undefined
  } catch {
    return undefined
  }
}
