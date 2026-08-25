import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createFood, updateFood } from '@/db/foodRepository'
import { useT } from '@/i18n'
import { normalizeFoodMicros, type AllergenTag } from '@/schemas/food.schema'
import type { Food } from '@/types'

type CustomFoodFormProps = {
  initialFood?: Food
  onSaved: (food: Food) => void
  onCancel?: () => void
}

type FormValues = {
  name: string
  brand: string
  calories: string
  protein: string
  carbs: string
  fat: string
  fiber: string
  servingSize: string
  price: string
  costPer100g: string
  currency: string
  notes: string
  allergenTags: AllergenTag[]
  sodiumMg: string
  potassiumMg: string
  magnesiumMg: string
  calciumMg: string
  zincMg: string
  ironMg: string
  seleniumMcg: string
  vitaminDMcg: string
  vitaminB6Mg: string
  vitaminB12Mcg: string
  vitaminCMg: string
}

const allergenOptions: AllergenTag[] = ['gluten', 'lactose', 'nuts', 'soy', 'eggs', 'fish', 'fructose']

function valuesFromFood(food?: Food): FormValues {
  const micros = normalizeFoodMicros(food?.micros as Record<string, unknown> | undefined)

  return {
    name: food?.name ?? '',
    brand: food?.brand ?? '',
    calories: String(food?.calories ?? ''),
    protein: String(food?.protein ?? ''),
    carbs: String(food?.carbs ?? ''),
    fat: String(food?.fat ?? ''),
    fiber: String(food?.fiber ?? 0),
    servingSize: String(food?.servingSize ?? 100),
    price: String(food?.price ?? ''),
    costPer100g: String(food?.costPer100g ?? ''),
    currency: String(food?.currency ?? 'EUR'),
    notes: String(food?.notes ?? ''),
    allergenTags: (food?.allergenTags ?? []) as AllergenTag[],
    sodiumMg: String(micros.sodiumMg ?? ''),
    potassiumMg: String(micros.potassiumMg ?? ''),
    magnesiumMg: String(micros.magnesiumMg ?? ''),
    calciumMg: String(micros.calciumMg ?? ''),
    zincMg: String(micros.zincMg ?? ''),
    ironMg: String(micros.ironMg ?? ''),
    seleniumMcg: String(micros.seleniumMcg ?? ''),
    vitaminDMcg: String(micros.vitaminDMcg ?? ''),
    vitaminB6Mg: String(micros.vitaminB6Mg ?? ''),
    vitaminB12Mcg: String(micros.vitaminB12Mcg ?? ''),
    vitaminCMg: String(micros.vitaminCMg ?? ''),
  }
}

export function CustomFoodForm({ initialFood, onSaved, onCancel }: CustomFoodFormProps) {
  const { t } = useT()
  const [values, setValues] = useState(() => valuesFromFood(initialFood))
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(Boolean(initialFood?.micros && Object.keys(initialFood.micros).length > 0))
  const [error, setError] = useState<string | null>(null)
  const protein = Number(values.protein) || 0
  const carbs = Number(values.carbs) || 0
  const fat = Number(values.fat) || 0
  const calories = Number(values.calories) || 0
  const macroCalories = protein * 4 + carbs * 4 + fat * 9
  const discrepancy = Math.abs(macroCalories - calories)

  function updateField(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function toggleAllergen(tag: AllergenTag) {
    setValues((current) => ({
      ...current,
      allergenTags: current.allergenTags.includes(tag)
        ? current.allergenTags.filter((currentTag) => currentTag !== tag)
        : [...current.allergenTags, tag],
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const numericValues = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'servingSize'].map((field) => Number(values[field as keyof FormValues]))

    if (!values.name.trim() || numericValues.some((value) => !Number.isFinite(value) || value < 0) || Number(values.servingSize) <= 0) {
      setError(t.food.invalidValues)
      return
    }

    const micros = {
      sodiumMg: Number(values.sodiumMg) || undefined,
      potassiumMg: Number(values.potassiumMg) || undefined,
      magnesiumMg: Number(values.magnesiumMg) || undefined,
      calciumMg: Number(values.calciumMg) || undefined,
      zincMg: Number(values.zincMg) || undefined,
      ironMg: Number(values.ironMg) || undefined,
      seleniumMcg: Number(values.seleniumMcg) || undefined,
      vitaminDMcg: Number(values.vitaminDMcg) || undefined,
      vitaminB6Mg: Number(values.vitaminB6Mg) || undefined,
      vitaminB12Mcg: Number(values.vitaminB12Mcg) || undefined,
      vitaminCMg: Number(values.vitaminCMg) || undefined,
    }

    const selectedAllergens = values.allergenTags
    const costPer100g = Number(values.costPer100g) || undefined
    const price = Number(values.price) || undefined

    const foodData = {
      name: values.name.trim(),
      brand: values.brand.trim() || undefined,
      servingSize: Number(values.servingSize),
      calories,
      protein,
      carbs,
      fat,
      fiber: Number(values.fiber),
      allergenTags: selectedAllergens,
      price,
      costPer100g,
      currency: values.currency.trim() || 'EUR',
      notes: values.notes.trim() || undefined,
      source: initialFood?.source ?? (initialFood?.isCustom ? 'manual' : 'openfoodfacts'),
      micros: Object.values(micros).some((value) => value !== undefined) ? micros : undefined,
      isCustom: true,
    }

    try {
      const id = initialFood ? initialFood.id : await createFood(foodData)
      if (initialFood) {
        await updateFood(id, foodData)
      }
      onSaved({
        ...initialFood,
        ...foodData,
        id,
        createdAt: initialFood?.createdAt ?? new Date().toISOString(),
        allergenTags: foodData.allergenTags,
        price: foodData.price,
        costPer100g: foodData.costPer100g,
        currency: foodData.currency,
        source: foodData.source,
        notes: foodData.notes,
        micros: foodData.micros ?? initialFood?.micros,
      })
    } catch {
      setError(t.food.saveError)
    }
  }

  const fields: Array<[keyof FormValues, string, string]> = [
    ['name', t.food.name, 'text'], ['brand', t.food.brand, 'text'], ['servingSize', t.food.servingSize, 'number'],
    ['calories', t.food.calories100g, 'number'], ['protein', t.food.protein100g, 'number'], ['carbs', t.food.carbs100g, 'number'],
    ['fat', t.food.fat100g, 'number'], ['fiber', t.food.fiber, 'number'],
  ]

  const metadataFields: Array<[keyof Pick<FormValues, 'price' | 'costPer100g' | 'currency' | 'notes'>, string, string]> = [
    ['price', t.common.price, 'number'],
    ['costPer100g', t.common.costPer100g, 'number'],
    ['currency', t.food.currency, 'text'],
    ['notes', t.food.notes, 'text'],
  ]

  const micronutrientFields: Array<[keyof Pick<FormValues, 'sodiumMg' | 'potassiumMg' | 'magnesiumMg' | 'calciumMg' | 'zincMg' | 'ironMg' | 'seleniumMcg' | 'vitaminDMcg' | 'vitaminB6Mg' | 'vitaminB12Mcg' | 'vitaminCMg'>, string]> = [
    ['sodiumMg', 'Sodium (mg)'],
    ['potassiumMg', 'Potassium (mg)'],
    ['magnesiumMg', 'Magnesium (mg)'],
    ['calciumMg', 'Calcium (mg)'],
    ['zincMg', 'Zinc (mg)'],
    ['ironMg', 'Iron (mg)'],
    ['seleniumMcg', 'Selenium (µg)'],
    ['vitaminDMcg', 'Vitamin D (µg)'],
    ['vitaminB6Mg', 'Vitamin B6 (mg)'],
    ['vitaminB12Mcg', 'Vitamin B12 (µg)'],
    ['vitaminCMg', 'Vitamin C (mg)'],
  ]

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([field, label, type]) => (
          <label key={field} className={field === 'name' || field === 'brand' ? 'sm:col-span-2' : ''}>
            <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
            <input required={field === 'name'} type={type} min={type === 'number' ? '0' : undefined} step="any" value={values[field]} onChange={(event) => updateField(field, event.target.value)} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" />
          </label>
        ))}
      </div>
      <div className="space-y-3 rounded-md border border-slate-700 bg-slate-950/40 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          {metadataFields.map(([field, label, type]) => (
            <label key={field} className={field === 'notes' ? 'sm:col-span-2' : ''}>
              <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
              <input type={type} min={type === 'number' ? '0' : undefined} step="any" value={values[field]} onChange={(event) => updateField(field, event.target.value)} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" />
            </label>
          ))}
        </div>
        <div>
          <span className="mb-2 block text-xs font-medium text-slate-400">{t.food.allergens}</span>
          <div className="flex flex-wrap gap-2">
            {allergenOptions.map((tag) => (
              <button key={tag} type="button" onClick={() => toggleAllergen(tag)} className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${values.allergenTags.includes(tag) ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-300'}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-md border border-slate-700 bg-slate-950/40 p-2">
        <button type="button" onClick={() => setIsAdvancedOpen((current) => !current)} className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-200">
          <span>{t.food.advancedNutrients}</span>
          <span>{isAdvancedOpen ? '−' : '+'}</span>
        </button>
        {isAdvancedOpen ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {micronutrientFields.map(([field, label]) => (
              <label key={field}>
                <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
                <input type="number" min="0" step="any" value={values[field]} onChange={(event) => updateField(field, event.target.value)} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" />
              </label>
            ))}
          </div>
        ) : null}
      </div>
      <p className={`text-xs ${discrepancy > 20 ? 'text-amber-300' : 'text-slate-500'}`}>{t.food.macroEstimate.replace('{calories}', macroCalories.toFixed(0)).replace('{discrepancy}', discrepancy.toFixed(0))}</p>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="flex gap-2">
        <Button type="submit">{initialFood ? t.food.saveChanges : t.food.addToLocalLibrary}</Button>
        {onCancel ? <Button type="button" variant="ghost" onClick={onCancel}>{t.common.cancel}</Button> : null}
      </div>
    </form>
  )
}
