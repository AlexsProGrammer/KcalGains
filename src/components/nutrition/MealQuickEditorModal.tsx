import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/button'
import { db } from '@/db'
import { useT } from '@/i18n'
import { MealSchema } from '@/schemas/meal.schema'
import { MICRONUTRIENT_KEYS, createEmptyMicronutrientTotals, mergeMicronutrientTotals } from '@/services/micronutrientTargetService'
import { normalizeFoodMicros } from '@/schemas/food.schema'
import type { Food, Meal, MealItem } from '@/types'

type DraftItem = {
  foodId: string
  amountInGrams: number
  calories: number
  protein: number
  carbs: number
  fat: number
}

type MealQuickEditorModalProps = {
  open: boolean
  meal?: Meal | null
  date?: string
  onClose: () => void
  onSaved?: (message: string) => void
}

function createEmptyItem(): DraftItem {
  return {
    foodId: '',
    amountInGrams: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  }
}

function createDraftFromMeal(meal?: Meal | null, fallbackDate?: string) {
  const sourceDate = meal?.date ?? fallbackDate ?? new Date().toISOString().slice(0, 10)
  const sourceMicros = meal?.totalMicros ?? createEmptyMicronutrientTotals()

  return {
    id: meal?.id ?? crypto.randomUUID(),
    date: sourceDate,
    mealType: meal?.mealType ?? 'breakfast',
    items: meal?.items.length ? meal.items.map((item) => ({
      foodId: item.foodId,
      amountInGrams: item.amountInGrams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
    })) : [createEmptyItem()],
    totalCalories: meal?.totalCalories ?? 0,
    totalProtein: meal?.totalProtein ?? 0,
    totalCarbs: meal?.totalCarbs ?? 0,
    totalFat: meal?.totalFat ?? 0,
    totalMicros: { ...sourceMicros },
  }
}

function applyFoodToItem(food: Food | null | undefined, item: DraftItem): DraftItem {
  if (!food) return item

  const factor = item.amountInGrams > 0 ? item.amountInGrams / 100 : 1
  return {
    ...item,
    calories: Number((food.calories * factor).toFixed(1)),
    protein: Number((food.protein * factor).toFixed(1)),
    carbs: Number((food.carbs * factor).toFixed(1)),
    fat: Number((food.fat * factor).toFixed(1)),
  }
}

export function MealQuickEditorModal({ open, meal, date, onClose, onSaved }: MealQuickEditorModalProps) {
  const { t } = useT()
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [], []) as Food[] | undefined
  const [draft, setDraft] = useState(() => createDraftFromMeal(meal, date))

  useEffect(() => {
    setDraft(createDraftFromMeal(meal, date))
  }, [meal, date, open])

  const foodOptions = useMemo(() => foods ?? [], [foods])

  function updateField<K extends keyof typeof draft>(field: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  function recalculateTotals(nextItems: DraftItem[]) {
    const totals = nextItems.reduce(
      (acc, item) => {
        const food = foodOptions.find((entry) => entry.id === item.foodId)
        const factor = Math.max(item.amountInGrams, 0) / 100
        const itemCalories = Number.isFinite(item.calories) ? item.calories : food ? food.calories * factor : 0
        const itemProtein = Number.isFinite(item.protein) ? item.protein : food ? food.protein * factor : 0
        const itemCarbs = Number.isFinite(item.carbs) ? item.carbs : food ? food.carbs * factor : 0
        const itemFat = Number.isFinite(item.fat) ? item.fat : food ? food.fat * factor : 0

        const micros = normalizeFoodMicros(food?.micros as Record<string, unknown> | undefined)
        const microTotals = createEmptyMicronutrientTotals()
        for (const key of MICRONUTRIENT_KEYS) {
          const microValue = micros[key] ?? 0
          microTotals[key] = (microTotals[key] ?? 0) + ((microValue * factor) || 0)
        }

        return {
          calories: acc.calories + itemCalories,
          protein: acc.protein + itemProtein,
          carbs: acc.carbs + itemCarbs,
          fat: acc.fat + itemFat,
          micros: mergeMicronutrientTotals(acc.micros, microTotals),
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, micros: createEmptyMicronutrientTotals() },
    )

    setDraft((current) => ({
      ...current,
      items: nextItems,
      totalCalories: Number(totals.calories.toFixed(1)),
      totalProtein: Number(totals.protein.toFixed(1)),
      totalCarbs: Number(totals.carbs.toFixed(1)),
      totalFat: Number(totals.fat.toFixed(1)),
      totalMicros: totals.micros,
    }))
  }

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setDraft((current) => {
      const nextItems = current.items.map((item, itemIndex) => {
        if (itemIndex !== index) return item

        const nextItem = { ...item, ...patch }
        if (patch.foodId !== undefined) {
          const selectedFood = foodOptions.find((food) => food.id === patch.foodId)
          const grams = Number(nextItem.amountInGrams) > 0 ? Number(nextItem.amountInGrams) : 100
          return applyFoodToItem(selectedFood, { ...nextItem, amountInGrams: grams })
        }

        if (patch.amountInGrams !== undefined && patch.foodId === undefined) {
          const selectedFood = foodOptions.find((food) => food.id === item.foodId)
          return applyFoodToItem(selectedFood, { ...nextItem, amountInGrams: Number(nextItem.amountInGrams) || 0 })
        }

        return nextItem
      })

      recalculateTotals(nextItems)
      return current
    })
  }

  function addItem() {
    setDraft((current) => {
      const nextItems = [...current.items, createEmptyItem()]
      recalculateTotals(nextItems)
      return current
    })
  }

  function removeItem(index: number) {
    setDraft((current) => {
      const nextItems = current.items.filter((_, itemIndex) => itemIndex !== index)
      recalculateTotals(nextItems)
      return current
    })
  }

  function updateMicronutrient(key: string, rawValue: string) {
    const value = Number(rawValue)
    setDraft((current) => ({
      ...current,
      totalMicros: {
        ...current.totalMicros,
        [key]: Number.isFinite(value) ? value : 0,
      },
    }))
  }

  async function saveMeal() {
    const sanitizedItems = draft.items
      .filter((item) => item.foodId.trim() || item.amountInGrams > 0)
      .map((item) => ({
        foodId: item.foodId.trim() || `manual-${crypto.randomUUID()}`,
        amountInGrams: Number(item.amountInGrams) || 0,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
      })) satisfies MealItem[]

    const nextMeal = MealSchema.parse({
      id: draft.id,
      date: draft.date,
      mealType: draft.mealType,
      items: sanitizedItems,
      totalCalories: Number(draft.totalCalories) || 0,
      totalProtein: Number(draft.totalProtein) || 0,
      totalCarbs: Number(draft.totalCarbs) || 0,
      totalFat: Number(draft.totalFat) || 0,
      totalMicros: draft.totalMicros,
    })

    if (meal) {
      await db.meals.put(nextMeal)
      onSaved?.('Meal updated.')
    } else {
      await db.meals.add(nextMeal)
      onSaved?.('Meal added to today\'s log.')
    }

    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-surface-0/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Meal editor">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-line bg-surface-1 p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-text">Meal</p>
            <h3 className="text-lg font-semibold text-ink-hi">{meal ? 'Meal details' : 'Add meal'}</h3>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close meal editor">×</Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
            Date
            <input type="date" value={draft.date} onChange={(event) => updateField('date', event.target.value)} className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi" />
          </label>
          <label className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
            Meal type
            <select value={draft.mealType} onChange={(event) => updateField('mealType', event.target.value as Meal['mealType'])} className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => <option key={type} value={type}>{t.common.mealTypes[type]}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            ['totalCalories', 'Calories'],
            ['totalProtein', 'Protein'],
            ['totalCarbs', 'Carbs'],
            ['totalFat', 'Fat'],
          ].map(([field, label]) => (
            <label key={field} className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
              {label}
              <input
                type="number"
                min="0"
                step="1"
                value={draft[field as keyof typeof draft] as number}
                onChange={(event) => updateField(field as 'totalCalories' | 'totalProtein' | 'totalCarbs' | 'totalFat', Number(event.target.value))}
                className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface-0 p-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-low">Items</h4>
            <Button type="button" size="sm" variant="secondary" onClick={addItem}>Add item</Button>
          </div>

          <div className="space-y-3">
            {draft.items.map((item, index) => (
              <div key={`${item.foodId}-${index}`} className="rounded-lg border border-line bg-surface-1 p-3">
                <div className="grid gap-2 sm:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                  <label className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
                    Food
                    <select value={item.foodId} onChange={(event) => updateItem(index, { foodId: event.target.value })} className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi">
                      <option value="">Custom</option>
                      {foodOptions.map((food) => <option key={food.id} value={food.id}>{food.name}</option>)}
                    </select>
                  </label>

                  <label className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
                    Grams
                    <input type="number" min="0" step="1" value={item.amountInGrams} onChange={(event) => updateItem(index, { amountInGrams: Number(event.target.value) || 0 })} className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi" />
                  </label>

                  <div className="self-end">
                    <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => removeItem(index)}>Remove</Button>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {['calories', 'protein', 'carbs', 'fat'].map((field) => (
                    <label key={field} className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
                      {field}
                      <input type="number" min="0" step="1" value={item[field as keyof DraftItem] as number} onChange={(event) => updateItem(index, { [field]: Number(event.target.value) || 0 } as Partial<DraftItem>)} className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi" />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-line bg-surface-0 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-low">Micronutrients</h4>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MICRONUTRIENT_KEYS.map((key) => (
              <label key={key} className="text-[10px] uppercase tracking-[0.12em] text-ink-low">
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())}
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={draft.totalMicros[key] ?? 0}
                  onChange={(event) => updateMicronutrient(key, event.target.value)}
                  className="mt-1 min-h-9 w-full rounded-md border border-line bg-surface-0 px-2 text-sm text-ink-hi"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
          <Button type="button" onClick={() => void saveMeal()}>Save meal</Button>
        </div>
      </div>
    </div>
  )
}
