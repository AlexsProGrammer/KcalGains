import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { createFood, updateFood } from '@/db/foodRepository'
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
}

function valuesFromFood(food?: Food): FormValues {
  return {
    name: food?.name ?? '',
    brand: food?.brand ?? '',
    calories: String(food?.calories ?? ''),
    protein: String(food?.protein ?? ''),
    carbs: String(food?.carbs ?? ''),
    fat: String(food?.fat ?? ''),
    fiber: String(food?.fiber ?? 0),
    servingSize: String(food?.servingSize ?? 100),
  }
}

export function CustomFoodForm({ initialFood, onSaved, onCancel }: CustomFoodFormProps) {
  const [values, setValues] = useState(() => valuesFromFood(initialFood))
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

    const foodData = {
      name: values.name.trim(),
      brand: values.brand.trim() || undefined,
      servingSize: Number(values.servingSize),
      calories,
      protein,
      carbs,
      fat,
      fiber: Number(values.fiber),
      isCustom: true,
    }

    try {
      const id = initialFood ? initialFood.id : await createFood(foodData)
      if (initialFood) {
        await updateFood(id, foodData)
      }
      onSaved({ ...initialFood, ...foodData, id, createdAt: initialFood?.createdAt ?? new Date() })
    } catch {
      setError('The food could not be saved locally.')
    }
  }

  const fields: Array<[keyof FormValues, string, string]> = [
    ['name', 'Name', 'text'], ['brand', 'Brand (optional)', 'text'], ['servingSize', 'Serving size (g)', 'number'],
    ['calories', 'Calories / 100g', 'number'], ['protein', 'Protein (g)', 'number'], ['carbs', 'Carbs (g)', 'number'],
    ['fat', 'Fat (g)', 'number'], ['fiber', 'Fiber (g)', 'number'],
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
      <p className={`text-xs ${discrepancy > 20 ? 'text-amber-300' : 'text-slate-500'}`}>Macro calorie estimate: {macroCalories.toFixed(0)} kcal, discrepancy {discrepancy.toFixed(0)} kcal</p>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <div className="flex gap-2">
        <Button type="submit">{initialFood ? 'Save changes' : 'Add to local library'}</Button>
        {onCancel ? <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button> : null}
      </div>
    </form>
  )
}
