import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createFood, updateFood } from '@/db/foodRepository'
import { normalizeFoodMicros } from '@/schemas/food.schema'
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const numericValues = ['calories', 'protein', 'carbs', 'fat', 'fiber', 'servingSize'].map((field) => Number(values[field as keyof FormValues]))

    if (!values.name.trim() || numericValues.some((value) => !Number.isFinite(value) || value < 0) || Number(values.servingSize) <= 0) {
      setError('Enter a name and valid non-negative nutrition values. Serving size must be greater than zero.')
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

    const foodData = {
      name: values.name.trim(),
      brand: values.brand.trim() || undefined,
      servingSize: Number(values.servingSize),
      calories,
      protein,
      carbs,
      fat,
      fiber: Number(values.fiber),
      allergenTags: initialFood?.allergenTags ?? [],
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
        allergenTags: initialFood?.allergenTags ?? foodData.allergenTags,
        micros: foodData.micros ?? initialFood?.micros,
      })
    } catch {
      setError('The food could not be saved locally.')
    }
  }

  const fields: Array<[keyof FormValues, string, string]> = [
    ['name', 'Name', 'text'], ['brand', 'Brand (optional)', 'text'], ['servingSize', 'Serving size (g)', 'number'],
    ['calories', 'Calories / 100g', 'number'], ['protein', 'Protein (g)', 'number'], ['carbs', 'Carbs (g)', 'number'],
    ['fat', 'Fat (g)', 'number'], ['fiber', 'Fiber (g)', 'number'],
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
      <div className="rounded-md border border-slate-700 bg-slate-950/40 p-2">
        <button type="button" onClick={() => setIsAdvancedOpen((current) => !current)} className="flex w-full items-center justify-between text-left text-sm font-medium text-slate-200">
          <span>Advanced nutrients</span>
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
      <p className={`text-xs ${discrepancy > 20 ? 'text-amber-300' : 'text-slate-500'}`}>Macro calorie estimate: {macroCalories.toFixed(0)} kcal, discrepancy {discrepancy.toFixed(0)} kcal</p>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="flex gap-2">
        <Button type="submit">{initialFood ? 'Save changes' : 'Add to local library'}</Button>
        {onCancel ? <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </form>
  )
}
