import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, TextInput } from '@/components/ui/field'
import { Alert } from '@/components/ui/alert'
import { db } from '@/db'
import { FoodSchema } from '@/schemas/food.schema'
import type { Food } from '@/types'

type FoodHistoryListProps = {
  viewMode: 'graph' | 'list'
}

const EMPTY_FORM = { name: '', calories: '', protein: '', carbs: '', fat: '' }

export function FoodHistoryList({ viewMode }: FoodHistoryListProps) {
  const [draft, setDraft] = useState(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  // isCustom is a boolean, which IndexedDB cannot use as a key, so filter in memory.
  const foods = useLiveQuery(() => db.foods.toArray(), [], [])

  const sortedFoods = useMemo(
    () =>
      foods
        .filter((food) => food.isCustom)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [foods],
  )

  async function addFood(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      const parsed = FoodSchema.parse({
        id: crypto.randomUUID(),
        name: draft.name,
        servingSize: 100,
        calories: Number(draft.calories),
        protein: Number(draft.protein),
        carbs: Number(draft.carbs),
        fat: Number(draft.fat),
        fiber: 0,
        isCustom: true,
        createdAt: new Date().toISOString(),
      })

      await db.foods.add(parsed)
      setDraft(EMPTY_FORM)
    } catch {
      setError('Enter a valid food name and nutritional values.')
    }
  }

  async function updateFood(food: Food, patch: Partial<Food>) {
    await db.foods.put(FoodSchema.parse({ ...food, ...patch }))
  }

  async function deleteFood(id: string) {
    await db.foods.delete(id)
  }

  if (viewMode === 'graph') {
    return null
  }

  return (
    <Card>
      <CardHeader title="Custom foods" />
      <CardContent className="space-y-4">
        <form className="grid gap-3 md:grid-cols-6" onSubmit={(event) => void addFood(event)}>
          <Field label="Name" className="md:col-span-2">
            <TextInput value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Banana" />
          </Field>
          <Field label="Kcal">
            <TextInput type="number" min="0" step="1" value={draft.calories} onChange={(event) => setDraft((current) => ({ ...current, calories: event.target.value }))} />
          </Field>
          <Field label="Protein (g)">
            <TextInput type="number" min="0" step="1" value={draft.protein} onChange={(event) => setDraft((current) => ({ ...current, protein: event.target.value }))} />
          </Field>
          <Field label="Carbs (g)">
            <TextInput type="number" min="0" step="1" value={draft.carbs} onChange={(event) => setDraft((current) => ({ ...current, carbs: event.target.value }))} />
          </Field>
          <div className="flex items-end gap-2">
            <Field label="Fat (g)" className="flex-1">
              <TextInput type="number" min="0" step="1" value={draft.fat} onChange={(event) => setDraft((current) => ({ ...current, fat: event.target.value }))} />
            </Field>
            <Button type="submit">Add</Button>
          </div>
        </form>

        {error ? <Alert variant="error">{error}</Alert> : null}

        <div className="space-y-3">
          {sortedFoods.length === 0 ? <p className="text-sm text-slate-500">No custom foods yet.</p> : null}
          {sortedFoods.map((food) => (
            <div key={food.id} className="rounded-md border border-slate-800 bg-slate-950 p-3">
              <div className="grid gap-3 md:grid-cols-6">
                <Field label="Name" className="md:col-span-2">
                  <TextInput
                    defaultValue={food.name}
                    onBlur={(event) => {
                      const nextName = event.target.value.trim()
                      if (!nextName || nextName === food.name) return
                      void updateFood(food, { name: nextName })
                    }}
                  />
                </Field>

                <Field label="Kcal">
                  <TextInput type="number" min="0" step="1" defaultValue={String(food.calories)} onBlur={(event) => void updateFood(food, { calories: Number(event.target.value) })} />
                </Field>

                <Field label="Protein (g)">
                  <TextInput type="number" min="0" step="1" defaultValue={String(food.protein)} onBlur={(event) => void updateFood(food, { protein: Number(event.target.value) })} />
                </Field>

                <Field label="Carbs (g)">
                  <TextInput type="number" min="0" step="1" defaultValue={String(food.carbs)} onBlur={(event) => void updateFood(food, { carbs: Number(event.target.value) })} />
                </Field>

                <div className="flex items-end gap-2">
                  <Field label="Fat (g)" className="flex-1">
                    <TextInput type="number" min="0" step="1" defaultValue={String(food.fat)} onBlur={(event) => void updateFood(food, { fat: Number(event.target.value) })} />
                  </Field>
                  <Button type="button" variant="secondary" size="sm" onClick={() => void deleteFood(food.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
