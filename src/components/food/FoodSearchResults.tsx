import type { Food } from '@/types'
import { FoodItemCard } from '@/components/food/FoodItemCard'

type FoodSearchResultsProps = {
  foods: Food[]
  emptyMessage?: string
  onSelect: (food: Food) => void
  onCache?: (food: Food) => void
}

export function FoodSearchResults({ foods, emptyMessage = 'No foods found.', onSelect, onCache }: FoodSearchResultsProps) {
  if (foods.length === 0) {
    return <p className="px-4 py-4 text-sm text-slate-600">{emptyMessage}</p>
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-800">
      {foods.map((food) => <FoodItemCard key={food.id} food={food} onSelect={onSelect} onCache={onCache} />)}
    </div>
  )
}
