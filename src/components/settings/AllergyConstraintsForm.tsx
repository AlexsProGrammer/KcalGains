import { ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput } from '@/components/ui/field'
import { useProfile } from '@/hooks/useProfile'
import { useT } from '@/i18n'
import type { AllergenTag, DietaryPattern, SweatType } from '@/types'

function dietLabel(t: ReturnType<typeof useT>['t'], value: DietaryPattern): string {
  const map: Record<DietaryPattern, string> = {
    standard: t.more.dietStandard,
    ketogenic: t.more.dietKetogenic,
    diabetic_friendly: t.more.dietDiabetic,
    low_fodmap: t.more.dietLowFodmap,
  }
  return map[value]
}

function sweatLabel(t: ReturnType<typeof useT>['t'], value: SweatType): string {
  const map: Record<SweatType, string> = {
    low: t.more.sweatLow,
    normal: t.more.sweatNormal,
    heavy_salty: t.more.sweatHeavy,
  }
  return map[value]
}

function allergenTagLabel(t: ReturnType<typeof useT>['t'], value: AllergenTag): string {
  const map: Record<AllergenTag, string> = {
    gluten: t.more.allergenGluten,
    lactose: t.more.allergenLactose,
    nuts: t.more.allergenNuts,
    soy: t.more.allergenSoy,
    eggs: t.more.allergenEggs,
    fish: t.more.allergenFish,
    fructose: t.more.allergenFructose,
  }
  return map[value]
}

export function AllergyConstraintsForm() {
  const { t } = useT()
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
      setMessage(t.more.healthSaved)
    } catch {
      setError(t.more.healthError)
    }
  }

  return (
    <Card>
      <CardHeader icon={<ShieldAlert />} title={t.more.healthConstraints} />
      <CardContent>
        <form className="space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t.more.dietPattern}>
              <SelectInput value={dietaryPattern} onChange={(event) => setDietaryPattern(event.target.value as DietaryPattern)}>
                {(['standard', 'ketogenic', 'diabetic_friendly', 'low_fodmap'] as DietaryPattern[]).map((option) => (
                  <option key={option} value={option}>{dietLabel(t, option)}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label={t.more.sweatType}>
              <SelectInput value={sweatType} onChange={(event) => setSweatType(event.target.value as SweatType)}>
                {(['low', 'normal', 'heavy_salty'] as SweatType[]).map((option) => (
                  <option key={option} value={option}>{sweatLabel(t, option)}</option>
                ))}
              </SelectInput>
            </Field>
          </div>

          <div className="rounded-md border border-line bg-surface-0 p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-[0.08em] text-ink-low">{t.more.allergens}</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(['gluten', 'lactose', 'nuts', 'soy', 'eggs', 'fish', 'fructose'] as AllergenTag[]).map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-2 text-sm text-ink-hi">
                  <input type="checkbox" checked={allergens.includes(option)} onChange={() => toggleAllergen(option)} className="h-4 w-4 accent-emerald-500" />
                  <span>{allergenTagLabel(t, option)}</span>
                </label>
              ))}
            </div>
          </div>

          <Button type="submit">{t.more.saveHealthRules}</Button>
          {message ? <Alert variant="success">{message}</Alert> : null}
          {error ? <Alert variant="error">{error}</Alert> : null}
        </form>
      </CardContent>
    </Card>
  )
}
