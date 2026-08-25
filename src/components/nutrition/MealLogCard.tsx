import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, Pencil, Star, Trash2 } from 'lucide-react'
import { db } from '@/db'
import { MealMicronutrientSummary } from '@/components/nutrition/MealMicronutrientSummary'
import type { Food, Meal, Profile } from '@/types'

type MealLogCardProps = {
  meal: Meal
  profile?: Profile | null
  onEdit?: (meal: Meal) => void
  onDelete?: (mealId: string) => void
  onFavorite?: (meal: Meal) => void
  onUseInBalancer?: (meal: Meal) => void
}

export function MealLogCard({ meal, profile, onEdit, onDelete, onFavorite, onUseInBalancer }: MealLogCardProps) {
  const [itemsOpen, setItemsOpen] = useState(false)

  const foodIds = useMemo(() => [...new Set(meal.items.map((item) => item.foodId))], [meal.items])
  const foods = useLiveQuery(() => {
    if (foodIds.length === 0) return [] as Food[]
    return db.foods.where('id').anyOf(foodIds).toArray() as Promise<Food[]>
  }, [foodIds.join(',')], []) as Food[]

  const foodMap = useMemo(() => new Map((foods ?? []).map((food) => [food.id, food])), [foods])

  return (
    <div className="rounded-xl border border-line bg-surface-0 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium capitalize text-ink-hi">{meal.mealType}</p>
          <p className="mt-1 text-[11px] text-ink-mid">{meal.items.length} item{meal.items.length === 1 ? '' : 's'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="num text-xs text-ink-mid">{Number(meal.totalCalories).toFixed(2)} kcal</span>
          {onFavorite ? (
            <button type="button" aria-label={`Save ${meal.mealType} meal to favorites`} onClick={() => onFavorite(meal)} className="rounded-md border border-line p-1.5 text-ink-mid transition hover:border-accent/40 hover:text-accent-text" title="Save to favorites">
              <Star className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onUseInBalancer ? (
            <button type="button" aria-label={`Use ${meal.mealType} meal in balancer`} onClick={() => onUseInBalancer(meal)} className="rounded-md border border-line p-1.5 text-ink-mid transition hover:border-accent/40 hover:text-accent-text" title="Use in balancer">
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onEdit ? (
            <button type="button" aria-label={`Edit ${meal.mealType} meal`} onClick={() => onEdit(meal)} className="rounded-md border border-line p-1.5 text-ink-mid transition hover:border-accent/40 hover:text-accent-text" title="Edit meal">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onDelete ? (
            <button type="button" aria-label={`Delete ${meal.mealType} meal`} onClick={() => onDelete(meal.id)} className="rounded-md border border-line p-1.5 text-ink-mid transition hover:border-danger/40 hover:text-danger" title="Delete meal">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid gap-2 text-[11px] text-ink-mid sm:grid-cols-4">
        <div>
          <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-low">Protein</span>
          <span className="num">{Number(meal.totalProtein).toFixed(2)} g</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-low">Carbs</span>
          <span className="num">{Number(meal.totalCarbs).toFixed(2)} g</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-low">Fat</span>
          <span className="num">{Number(meal.totalFat).toFixed(2)} g</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase tracking-[0.12em] text-ink-low">Items</span>
          <span className="num">{meal.items.length}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setItemsOpen((value) => !value)}
        aria-expanded={itemsOpen}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-line bg-surface-1 px-3 py-2 text-left text-[10px] font-medium uppercase tracking-[0.12em] text-ink-low"
      >
        <span>Items</span>
        <span className="text-base leading-none text-ink-mid">{itemsOpen ? '−' : '+'}</span>
      </button>

      {itemsOpen ? (
        <div className="mt-3 space-y-2 rounded-lg border border-line bg-surface-1 p-3">
          {meal.items.map((item, index) => {
            const food = foodMap.get(item.foodId)
            return (
              <div key={`${item.foodId}-${index}`} className="rounded-md border border-line bg-surface-0 p-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-ink-hi">{food?.name ?? item.foodId}</span>
                  <span className="num text-[11px] text-ink-mid">{Number(item.amountInGrams).toFixed(2)}g</span>
                </div>
                <div className="mt-2 grid gap-1 text-[11px] text-ink-mid sm:grid-cols-4">
                  <span>kcal {Number(item.calories).toFixed(2)}</span>
                  <span>P {Number(item.protein).toFixed(2)}</span>
                  <span>C {Number(item.carbs).toFixed(2)}</span>
                  <span>F {Number(item.fat).toFixed(2)}</span>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <MealMicronutrientSummary meal={meal} profile={profile} compact />
    </div>
  )
}
