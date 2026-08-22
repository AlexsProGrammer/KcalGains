import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { db } from '@/db'
import { MealSchema } from '@/schemas/meal.schema'
import type { Meal } from '@/types'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const

type MealHistoryListProps = {
  viewMode: 'graph' | 'list'
}

const EMPTY_FORM = { date: new Date().toISOString().slice(0, 10), mealType: 'breakfast' as Meal['mealType'], calories: '', protein: '', carbs: '', fat: '' }

export function MealHistoryList({ viewMode }: MealHistoryListProps) {
  const [draft, setDraft] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const meals = useLiveQuery(() => db.meals.orderBy('date').reverse().toArray(), [])

  const sortedMeals = useMemo(
    () => [...(meals ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [meals],
  )

  async function addMeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const parsed = MealSchema.parse({
        id: crypto.randomUUID(),
        date: draft.date,
        mealType: draft.mealType,
        items: [],
        totalCalories: Number(draft.calories),
        totalProtein: Number(draft.protein),
        totalCarbs: Number(draft.carbs),
        totalFat: Number(draft.fat),
      })

      await db.meals.put(parsed)
      setDraft(EMPTY_FORM)
    } catch {
      setError('Enter valid meal totals in grams and macro values.')
    }
  }

  async function updateMeal(meal: Meal, patch: Partial<Meal>) {
    const next = MealSchema.parse({ ...meal, ...patch })
    await db.meals.put(next)
  }

  async function deleteMeal(id: string) {
    await db.meals.delete(id)
  }

  if (viewMode === 'graph') {
    return null
  }

  return (
    <Card>
      <CardHeader title="Meal history" />
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-6" onSubmit={(event) => void addMeal(event)}>
          <Field label="Date" className="md:col-span-2">
            <TextInput type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} />
          </Field>
          <Field label="Type" className="md:col-span-2">
            <SelectInput value={draft.mealType} onChange={(event) => setDraft((current) => ({ ...current, mealType: event.target.value as Meal['mealType'] }))}>
              {MEAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectInput>
          </Field>
          <Field label="Calories">
            <TextInput type="number" min="0" step="1" value={draft.calories} onChange={(event) => setDraft((current) => ({ ...current, calories: event.target.value }))} />
          </Field>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Add meal</Button>
          </div>
        </form>

        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Protein (g)">
            <TextInput type="number" min="0" step="1" value={draft.protein} onChange={(event) => setDraft((current) => ({ ...current, protein: event.target.value }))} />
          </Field>
          <Field label="Carbs (g)">
            <TextInput type="number" min="0" step="1" value={draft.carbs} onChange={(event) => setDraft((current) => ({ ...current, carbs: event.target.value }))} />
          </Field>
          <Field label="Fat (g)">
            <TextInput type="number" min="0" step="1" value={draft.fat} onChange={(event) => setDraft((current) => ({ ...current, fat: event.target.value }))} />
          </Field>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="space-y-3">
          {sortedMeals.length === 0 ? <p className="text-sm text-slate-500">No meals logged yet.</p> : null}
          {sortedMeals.map((meal) => (
            <div key={meal.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <Field label="Date">
                  <TextInput type="date" defaultValue={meal.date} onBlur={(event) => {
                    const nextDate = event.target.value
                    if (!nextDate || nextDate === meal.date) return
                    void updateMeal(meal, { date: nextDate })
                  }} />
                </Field>
                <Field label="Type">
                  <SelectInput defaultValue={meal.mealType} onBlur={(event) => {
                    const nextMealType = event.target.value as Meal['mealType']
                    void updateMeal(meal, { mealType: nextMealType })
                  }}>
                    {MEAL_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </SelectInput>
                </Field>
                <div className="flex items-end">
                  <Button type="button" variant="secondary" className="w-full" onClick={() => void deleteMeal(meal.id)}>
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-4">
                <Field label="Calories">
                  <TextInput type="number" min="0" step="1" defaultValue={String(meal.totalCalories)} onBlur={(event) => {
                    void updateMeal(meal, { totalCalories: Number(event.target.value) })
                  }} />
                </Field>
                <Field label="Protein (g)">
                  <TextInput type="number" min="0" step="1" defaultValue={String(meal.totalProtein)} onBlur={(event) => {
                    void updateMeal(meal, { totalProtein: Number(event.target.value) })
                  }} />
                </Field>
                <Field label="Carbs (g)">
                  <TextInput type="number" min="0" step="1" defaultValue={String(meal.totalCarbs)} onBlur={(event) => {
                    void updateMeal(meal, { totalCarbs: Number(event.target.value) })
                  }} />
                </Field>
                <Field label="Fat (g)">
                  <TextInput type="number" min="0" step="1" defaultValue={String(meal.totalFat)} onBlur={(event) => {
                    void updateMeal(meal, { totalFat: Number(event.target.value) })
                  }} />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
