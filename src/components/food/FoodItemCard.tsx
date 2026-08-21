import { Database, Globe2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Food } from '@/types'

type FoodItemCardProps = {
  food: Food
  onSelect: (food: Food) => void
  onCache?: (food: Food) => void
}

export function FoodItemCard({ food, onSelect, onCache }: FoodItemCardProps) {
  return (
    <article className="flex flex-col gap-3 border-b border-slate-800 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <button type="button" className="min-w-0 text-left" onClick={() => onSelect(food)}>
        <div className="flex items-center gap-2">
          {food.isCustom ? <Database className="h-3.5 w-3.5 text-emerald-400" aria-label="Local food" /> : <Globe2 className="h-3.5 w-3.5 text-sky-400" aria-label="External food" />}
          <h3 className="truncate font-medium text-slate-100">{food.name}</h3>
        </div>
        {food.brand ? <p className="mt-1 text-xs text-slate-500">{food.brand}</p> : null}
      </button>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>{food.calories} kcal</span>
        <span>P {food.protein}g</span>
        <span>C {food.carbs}g</span>
        <span>F {food.fat}g</span>
        {onCache ? <Button type="button" size="sm" variant="secondary" onClick={() => onCache(food)}>Save locally</Button> : null}
      </div>
    </article>
  )
}
