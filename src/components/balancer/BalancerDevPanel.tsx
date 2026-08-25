import { useLiveQuery } from 'dexie-react-hooks'
import { Calculator, Check, Plus, Save, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { useT } from '@/i18n'
import { useMealBalancer } from '@/hooks/useMealBalancer'
import { useMealLogger } from '@/hooks/useMealLogger'
import type { Food } from '@/types'

const targetFields = [
  ['calories', 'Calories'],
  ['protein', 'Protein'],
  ['carbs', 'Carbs'],
  ['fat', 'Fat'],
] as const

export function BalancerDevPanel() {
  const { t } = useT()
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [], [])
  const balancer = useMealBalancer()
  const { commitBalancedMealToLog } = useMealLogger()
  const [catalogQuery, setCatalogQuery] = useState('')
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const visibleFoods = foods.filter((food) => food.name.toLowerCase().includes(catalogQuery.trim().toLowerCase())).slice(0, 30)

  function toggleFood(food: Food) {
    if (balancer.selectedFoods.some((selectedFood) => selectedFood.id === food.id)) {
      balancer.removeFood(food.id)
    } else if (balancer.selectedFoods.length < 8) {
      balancer.addFood(food)
    }
  }

  async function logMeal() {
    if (!balancer.result || balancer.result.solution.every((item) => item.grams <= 0)) return
    setError(null)
    try {
      await commitBalancedMealToLog(balancer.result, mealType, new Date().toISOString().slice(0, 10))
      setMessage(`Balanced ${mealType} meal logged for today.`)
    } catch {
      setError('The balanced meal could not be logged.')
    }
  }

  return (
    <Card>
      <CardHeader icon={<Calculator />} title="Meal balancer development panel" />
      <CardContent>
        <p className="text-sm text-slate-400">Choose local foods, adjust targets, and inspect the deterministic solver output.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {targetFields.map(([field, label]) => (
            <label key={field}>
              <span className="mb-1 block text-xs font-medium text-slate-400">{label}</span>
              <input
                type="number"
                min="0"
                step="any"
                value={balancer.targets[field]}
                onChange={(event) => balancer.setTargets({ [field]: Number(event.target.value) })}
                className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400"
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block max-w-xs">
            <span className="mb-1 block text-xs font-medium text-slate-400">Priority</span>
            <select value={balancer.targets.priority} onChange={(event) => balancer.setTargets({ priority: event.target.value as typeof balancer.targets.priority })} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400">
              <option value="balanced">Balanced</option>
              <option value="protein-first">Protein first</option>
              <option value="exact-calories">Exact calories</option>
            </select>
          </label>
          <label className="block max-w-xs">
            <span className="mb-1 block text-xs font-medium text-slate-400">Meal type</span>
            <select value={mealType} onChange={(event) => setMealType(event.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack')} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
                <option key={type} value={type}>{t.common.mealTypes[type]}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-5 border-t border-slate-800 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Food pool ({balancer.selectedFoods.length}/8)</h3>
            <input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Filter catalog" aria-label="Filter balancer food catalog" className="min-h-8 rounded-md border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100 outline-none focus:border-emerald-400" />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-slate-800">
            {visibleFoods.map((food) => {
              const selected = balancer.selectedFoods.some((selectedFood) => selectedFood.id === food.id)
              return <button key={food.id} type="button" disabled={!selected && balancer.selectedFoods.length >= 8} onClick={() => toggleFood(food)} className={`flex w-full items-center justify-between border-b border-slate-800 px-3 py-2 text-left text-sm last:border-0 disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'bg-emerald-400/10 text-emerald-200' : 'text-slate-300 hover:bg-slate-800/60'}`}><span>{selected ? <Check className="mr-2 inline h-3.5 w-3.5" aria-hidden="true" /> : <Plus className="mr-2 inline h-3.5 w-3.5" aria-hidden="true" />}{food.name}</span><span className="text-xs text-slate-500">{food.calories} kcal</span></button>
            })}
          </div>
        </div>

        {balancer.constraints.length > 0 ? <div className="mt-4 space-y-2"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Constraints</h3>{balancer.constraints.map((constraint) => { const food = balancer.selectedFoods.find((item) => item.id === constraint.foodId); if (!food) return null; return <div key={constraint.foodId} className="grid grid-cols-[1fr_5rem_5rem_auto] items-center gap-2 text-sm"><span className="truncate text-slate-300">{food.name}</span><input type="number" min="0" value={constraint.minGrams} aria-label={`${food.name} minimum grams`} onChange={(event) => balancer.updateConstraint(food.id, { minGrams: Number(event.target.value) })} className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100" /><input type="number" min={constraint.minGrams} value={constraint.maxGrams} aria-label={`${food.name} maximum grams`} onChange={(event) => balancer.updateConstraint(food.id, { maxGrams: Number(event.target.value) })} className="min-h-8 rounded border border-slate-700 bg-slate-950 px-2 text-xs text-slate-100" /><button type="button" onClick={() => balancer.removeFood(food.id)} aria-label={`Remove ${food.name}`} className="text-slate-500 hover:text-rose-300"><Trash2 className="h-4 w-4" aria-hidden="true" /></button></div> })}</div> : <p className="mt-4 text-sm text-slate-600">Select at least one food to calculate.</p>}

        {balancer.isCalculating ? <p className="mt-4 text-xs text-slate-500">Calculating...</p> : null}
        {balancer.result ? <div className="mt-5 border-t border-slate-800 pt-4"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solver result</h3><span className={`rounded-full px-2 py-1 text-xs ${balancer.result.status === 'feasible' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>{balancer.result.status}</span></div>{balancer.result.status === 'infeasible' ? <Alert className="mt-3" variant="warning" title="Meal cannot be logged">The selected foods and gram limits cannot satisfy the requested targets. Reduce the targets, increase the allowed ranges, or choose different foods.</Alert> : null}<div className="mt-3 grid gap-2 sm:grid-cols-2">{balancer.result.solution.map((item) => <div key={item.foodId} className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"><span className="text-slate-500">{balancer.selectedFoods.find((food) => food.id === item.foodId)?.name ?? item.foodId}</span><strong className="ml-2 text-slate-100">{item.grams}g</strong><span className="ml-2 text-xs text-slate-500">{item.computedCalories.toFixed(0)} kcal</span></div>)}</div><p className="mt-3 text-xs text-slate-500">Totals: {balancer.result.totalMacros.calories.toFixed(0)} kcal · P {balancer.result.totalMacros.protein.toFixed(1)}g · C {balancer.result.totalMacros.carbs.toFixed(1)}g · F {balancer.result.totalMacros.fat.toFixed(1)}g</p><p className="mt-1 text-xs text-slate-500">Delta: P {balancer.result.deviation.deltaProtein.toFixed(1)}g · C {balancer.result.deviation.deltaCarbs.toFixed(1)}g · F {balancer.result.deviation.deltaFat.toFixed(1)}g</p><Button className="mt-4" type="button" onClick={() => void logMeal()} disabled={balancer.result.status === 'infeasible'}><Save className="mr-2 h-4 w-4" aria-hidden="true" />Log this meal</Button></div> : null}
        {message ? <Alert className="mt-4" variant="success">{message}</Alert> : null}
        {error ? <Alert className="mt-4" variant="error">{error}</Alert> : null}
      </CardContent>
    </Card>
  )
}
