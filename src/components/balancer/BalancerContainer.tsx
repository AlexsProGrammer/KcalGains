import { useLiveQuery } from 'dexie-react-hooks'
import { Calculator, Check, Plus, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { db } from '@/db'
import { useMealBalancer } from '@/hooks/useMealBalancer'
import { useMealLogger } from '@/hooks/useMealLogger'
import { useProfile } from '@/hooks/useProfile'
import { filterFoodsByProfile } from '@/services/foodFilterService'
import { MacroTargetControls } from '@/components/balancer/MacroTargetControls'
import { OptimizationErrorAlert } from '@/components/balancer/OptimizationErrorAlert'
import { BalancerResultsCard } from '@/components/balancer/BalancerResultsCard'
import { SelectedFoodList } from '@/components/balancer/SelectedFoodList'
import { resolveDailyTargets } from '@/services/targetResolverService'
import type { Food } from '@/types'

export function BalancerContainer() {
  const { profile: currentProfile } = useProfile()
  const foods = useLiveQuery(() => db.foods.orderBy('name').toArray(), [], [])
  const profile = useLiveQuery(() => db.profile.toCollection().first(), [])
  const settings = useLiveQuery(() => db.settings.get('app-settings'), [])
  const balancer = useMealBalancer()
  const { commitBalancedMealToLog } = useMealLogger()
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [proteinFocus, setProteinFocus] = useState(50)
  const filteredFoodPool = filterFoodsByProfile(foods, currentProfile)
  const visibleFoods = filteredFoodPool.filtered.filter((food) => food.name.toLowerCase().includes(query.toLowerCase())).slice(0, 24)
  const names = new Map(balancer.selectedFoods.map((food) => [food.id, food.name]))
  const targetSource = resolveDailyTargets({ profile, settings, recentWeightKg: profile?.weightKg }).source

  useEffect(() => {
    if (settings?.moduleChaining === false || settings?.autoTargetsFromGoal === false) return

    const resolved = resolveDailyTargets({ profile, settings, recentWeightKg: profile?.weightKg })
    balancer.setTargets({
      calories: resolved.calories,
      protein: resolved.protein,
      carbs: resolved.carbs,
      fat: resolved.fat,
    })
  }, [profile, settings])

  function toggleFood(food: Food) {
    if (balancer.selectedFoods.some((selected) => selected.id === food.id)) balancer.removeFood(food.id)
    else if (balancer.selectedFoods.length < 8) balancer.addFood(food)
  }

  async function logMeal() {
    if (!balancer.result || balancer.result.status === 'infeasible') return
    await commitBalancedMealToLog(balancer.result, 'lunch', new Date().toISOString().slice(0, 10))
    setMessage('Balanced meal logged.')
  }

  return <Card><CardHeader icon={<Calculator />} title="Meal balancer development panel" /><CardContent><MacroTargetControls targets={balancer.targets} onChange={balancer.setTargets} /><div className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-emerald-400/20 bg-emerald-400/5 p-3"><div className="min-w-56 flex-1"><div className="flex justify-between text-xs text-slate-400"><span>Auto-balance focus</span><span>{proteinFocus < 40 ? 'Protein accuracy' : proteinFocus > 60 ? 'Calorie accuracy' : 'Balanced'}</span></div><input type="range" min="0" max="100" value={proteinFocus} onChange={(event) => setProteinFocus(Number(event.target.value))} className="mt-2 w-full accent-emerald-400" /><div className="flex justify-between text-[11px] text-slate-500"><span>Protein</span><span>Calories</span></div></div><Button type="button" onClick={() => balancer.autoBalance(proteinFocus)} disabled={balancer.selectedFoods.length === 0}><WandSparkles className="mr-2 h-4 w-4" />Auto-balance</Button></div><div className="mt-5 border-t border-slate-800 pt-4"><div className="flex items-center justify-between gap-3"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Food pool ({balancer.selectedFoods.length}/8)</h3><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter local foods" aria-label="Filter local balancer foods" className="min-h-8 rounded-md border border-slate-700 bg-slate-950 px-3 text-xs text-slate-100" /></div><div className="mt-2 max-h-40 overflow-y-auto rounded-md border border-slate-800">{visibleFoods.map((food) => { const selected = balancer.selectedFoods.some((item) => item.id === food.id); return <button key={food.id} type="button" disabled={!selected && balancer.selectedFoods.length >= 8} onClick={() => toggleFood(food)} className="flex w-full items-center justify-between border-b border-slate-800 px-3 py-2 text-left text-sm text-slate-300 last:border-0 disabled:opacity-40"> <span>{selected ? <Check className="mr-2 inline h-3.5 w-3.5 text-emerald-400" /> : <Plus className="mr-2 inline h-3.5 w-3.5" />}{food.name}</span><span className="text-xs text-slate-500">{food.calories} kcal</span></button> })}</div></div><SelectedFoodList foods={balancer.selectedFoods} constraints={balancer.constraints} onUpdate={balancer.updateConstraint} onRemove={balancer.removeFood} />{balancer.isCalculating ? <p className="mt-4 text-xs text-slate-500">Calculating...</p> : null}{balancer.result ? <><OptimizationErrorAlert result={balancer.result} /><BalancerResultsCard result={balancer.result} names={names} targets={balancer.targets} onLog={() => void logMeal()} /></> : null}{message ? <Alert className="mt-4" variant="success">{message}</Alert> : null}</CardContent></Card>
}
