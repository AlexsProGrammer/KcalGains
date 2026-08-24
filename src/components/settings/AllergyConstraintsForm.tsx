import { ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { useProfile } from '@/hooks/useProfile'
import type { AllergenTag, DietaryPattern, SweatType } from '@/types'

const ALLERGEN_OPTIONS: { value: AllergenTag; label: string }[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'lactose', label: 'Lactose' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'soy', label: 'Soy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'fish', label: 'Fish' },
  { value: 'fructose', label: 'Fructose' },
]

const DIETARY_OPTIONS: { value: DietaryPattern; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'ketogenic', label: 'Ketogenic' },
  { value: 'diabetic_friendly', label: 'Diabetic-friendly' },
  { value: 'low_fodmap', label: 'Low-FODMAP' },
]

const SWEAT_OPTIONS: { value: SweatType; label: string }[] = [
  { value: 'low', label: 'Low sweat / low sodium loss' },
  { value: 'normal', label: 'Normal' },
  { value: 'heavy_salty', label: 'Heavy sweater / salty sweat' },
]

export function AllergyConstraintsForm() {
  const { profile, isLoading, saveProfile } = useProfile()
  const [allergens, setAllergens] = useState<AllergenTag[]>([])
  const [dietaryPattern, setDietaryPattern] = useState<DietaryPattern>('standard')
  const [sweatType, setSweatType] = useState<SweatType>('normal')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoading) return
    setAllergens(profile.allergens ?? [])
    setDietaryPattern(profile.dietaryPattern ?? 'standard')
    setSweatType(profile.sweatType ?? 'normal')
  }, [isLoading, profile])

  function toggleAllergen(allergen: AllergenTag) {
    setAllergens((current) => current.includes(allergen)
      ? current.filter((item) => item !== allergen)
      : [...current, allergen])
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)

    try {
      await saveProfile({ allergens, dietaryPattern, sweatType })
      setMessage('Health constraints saved. Search and planner results will respect them.')
    } catch {
      setError('The health constraints could not be saved.')
    }
  }

  return (
    <Card>
      <CardHeader icon={<ShieldAlert />} title="Health constraints" />
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Diet pattern">
              <SelectInput value={dietaryPattern} onChange={(event) => setDietaryPattern(event.target.value as DietaryPattern)}>
                {DIETARY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Sweat type">
              <SelectInput value={sweatType} onChange={(event) => setSweatType(event.target.value as SweatType)}>
                {SWEAT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="rounded-md border border-line bg-surface-0 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-low">Allergens</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ALLERGEN_OPTIONS.map((option) => (
                <label key={option.value} className="flex items-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-2 text-sm text-ink-hi">
                  <input type="checkbox" checked={allergens.includes(option.value)} onChange={() => toggleAllergen(option.value)} className="h-4 w-4 accent-emerald-500" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit">Save health rules</Button>
          {message ? <Alert variant="success">{message}</Alert> : null}
          {error ? <Alert variant="error">{error}</Alert> : null}
        </form>
      </CardContent>
    </Card>
  )
}
