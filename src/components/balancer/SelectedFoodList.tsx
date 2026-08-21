import type { Food } from '@/types'
import type { IngredientConstraint } from '@/types/balancer.types'
import { FoodConstraintRow } from '@/components/balancer/FoodConstraintRow'

type Props = { foods: Food[]; constraints: IngredientConstraint[]; onUpdate: (foodId: string, updates: Partial<Omit<IngredientConstraint, 'foodId'>>) => void; onRemove: (foodId: string) => void }

export function SelectedFoodList({ foods, constraints, onUpdate, onRemove }: Props) {
  if (foods.length === 0) return <p className="mt-4 text-sm text-slate-600">Select at least one food to calculate.</p>
  return <div className="mt-4 space-y-2"><div className="grid grid-cols-[1fr_4.5rem_4.5rem_auto_auto] gap-2 text-xs uppercase tracking-wide text-slate-500"><span>Ingredient</span><span>Min g</span><span>Max g</span><span>Lock</span><span /></div>{foods.map((food) => { const constraint = constraints.find((item) => item.foodId === food.id); return constraint ? <FoodConstraintRow key={food.id} food={food} constraint={constraint} onUpdate={(updates) => onUpdate(food.id, updates)} onRemove={() => onRemove(food.id)} /> : null })}</div>
}
