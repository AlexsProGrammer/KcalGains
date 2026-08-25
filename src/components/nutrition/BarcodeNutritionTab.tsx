import { useMemo, useState } from 'react'
import { Camera, PencilLine, PlusCircle, ScanLine, Sparkles, X } from 'lucide-react'
import { BarcodeScannerModal } from '@/components/food/BarcodeScannerModal'
import { CustomFoodForm } from '@/components/food/CustomFoodForm'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { createFood } from '@/db/foodRepository'
import { resolveBarcode } from '@/services/barcodeScannerService'
import { MICRONUTRIENT_KEYS, resolveMicronutrientTargets } from '@/services/micronutrientTargetService'
import type { Food } from '@/types'

export function BarcodeNutritionTab() {
  const [barcodeInput, setBarcodeInput] = useState('')
  const [resolvedFood, setResolvedFood] = useState<Food | null>(null)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)

  const targets = useMemo(() => resolveMicronutrientTargets(), [])

  async function handleLookup(value: string) {
    const barcode = value.trim()
    if (!barcode) return

    setStatus(null)
    setError(null)
    setIsLookingUp(true)

    try {
      const food = await resolveBarcode(barcode)
      if (!food) {
        setError('No match was found for this barcode.')
        return
      }
      setResolvedFood(food)
      setIsEditing(false)
    } catch {
      setError('This barcode could not be looked up.')
    } finally {
      setIsLookingUp(false)
    }
  }

  async function handleAddToLibrary() {
    if (!resolvedFood) return
    const existing = resolvedFood.barcode ? await db.foods.where('barcode').equals(resolvedFood.barcode).first() : null
    if (existing) {
      setStatus(`${resolvedFood.name} is already in the library.`)
      return
    }

    try {
      await createFood({
        ...resolvedFood,
        isCustom: false,
        source: resolvedFood.source ?? 'barcode',
        barcode: resolvedFood.barcode ?? 'manual',
      })
      setStatus(`${resolvedFood.name} was added to the local library.`)
    } catch {
      setError('The product could not be saved to the local library.')
    }
  }

  const macroCards = resolvedFood ? [
    ['Calories', `${resolvedFood.calories} kcal`],
    ['Protein', `${resolvedFood.protein} g`],
    ['Carbs', `${resolvedFood.carbs} g`],
    ['Fat', `${resolvedFood.fat} g`],
  ] : []

  return (
    <Card>
      <CardHeader icon={<ScanLine />} title="Barcode nutrition" />
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={barcodeInput}
            onChange={(event) => setBarcodeInput(event.target.value)}
            placeholder="Enter barcode"
            className="min-h-10 flex-1 rounded-md border border-line bg-surface-0 px-3 text-sm text-ink-hi"
          />
          <Button type="button" onClick={() => void handleLookup(barcodeInput)} disabled={!barcodeInput.trim() || isLookingUp}>
            <Camera className="mr-2 h-4 w-4" />
            {isLookingUp ? 'Looking up...' : 'Lookup'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setScannerOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Scan
          </Button>
        </div>

        {error ? <Alert variant="error">{error}</Alert> : null}
        {status ? <Alert variant="success">{status}</Alert> : null}

        {resolvedFood && !isEditing ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-line bg-surface-0 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-ink-low">Product</p>
                  <h3 className="mt-1 text-lg font-semibold text-ink-hi">{resolvedFood.name}</h3>
                  {resolvedFood.brand ? <p className="text-sm text-ink-mid">{resolvedFood.brand}</p> : null}
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                {macroCards.map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-line bg-surface-1 p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-ink-low">{label}</p>
                    <p className="mt-1 text-sm font-semibold text-ink-hi">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-lg border border-line bg-surface-1 p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-ink-low">Micronutrients</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {MICRONUTRIENT_KEYS.map((key) => (
                    <div key={key} className="rounded-md border border-line bg-surface-0 p-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-low">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}</p>
                      <p className="mt-1 text-sm font-medium text-ink-hi">{(resolvedFood.micros?.[key] ?? 0).toFixed(0)}{key.includes('Mcg') || key.includes('D') || key.includes('B12') || key.includes('C') ? 'µg' : 'mg'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={() => void handleAddToLibrary()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add to library
              </Button>
            </div>
          </div>
        ) : null}

        {resolvedFood && isEditing ? (
          <CustomFoodForm
            initialFood={resolvedFood}
            onSaved={(food) => {
              setResolvedFood(food)
              setIsEditing(false)
              setStatus(`${food.name} was updated.`)
            }}
            onCancel={() => setIsEditing(false)}
          />
        ) : null}

        {!resolvedFood ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-0 p-5 text-sm text-ink-mid">
            Scan a product to inspect the nutrition values, micros, and ingredients metadata.
          </div>
        ) : null}
      </CardContent>

      <BarcodeScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onFoodResolved={(food) => {
          setResolvedFood(food)
          setScannerOpen(false)
          setStatus(`${food.name} was resolved.`)
        }}
      />
    </Card>
  )
}
