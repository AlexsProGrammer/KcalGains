import { Lock, LockOpen, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Food } from '@/types'
import type { IngredientConstraint } from '@/types/balancer.types'

type Props = { food: Food; constraint: IngredientConstraint; onUpdate: (updates: Partial<Omit<IngredientConstraint, 'foodId'>>) => void; onRemove: () => void }

export function FoodConstraintRow({ food, constraint, onUpdate, onRemove }: Props) {
  const [locked, setLocked] = useState(constraint.minGrams === constraint.maxGrams)
  function toggleLock() { const next = !locked; setLocked(next); onUpdate(next ? { minGrams: 100, maxGrams: 100 } : { minGrams: 0, maxGrams: 1000 }) }
  return <div className="grid grid-cols-[1fr_4.5rem_4.5rem_auto_auto] items-center gap-2 text-sm"><span className="truncate text-slate-300">{food.name}</span><input type="number" min="0" value={constraint.minGrams} aria-label={`${food.name} minimum grams`} onChange={(event) => onUpdate({ minGrams: Number(event.target.value) })} className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100" /><input type="number" min={constraint.minGrams} value={constraint.maxGrams} aria-label={`${food.name} maximum grams`} onChange={(event) => onUpdate({ maxGrams: Number(event.target.value) })} className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100" /><button type="button" onClick={toggleLock} aria-label={locked ? `Unlock ${food.name}` : `Lock ${food.name} at 100 grams`} className="text-slate-400 hover:text-emerald-300">{locked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}</button><button type="button" onClick={onRemove} aria-label={`Remove ${food.name}`} className="text-slate-500 hover:text-rose-300"><Trash2 className="h-4 w-4" /></button></div>
}
