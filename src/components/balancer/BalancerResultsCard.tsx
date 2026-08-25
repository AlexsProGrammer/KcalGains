import { Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'
import { createEmptyMicronutrientTotals, getMicronutrientProgress, MICRONUTRIENT_KEYS, resolveMicronutrientTargets, type MicronutrientKey } from '@/services/micronutrientTargetService'
import type { Food } from '@/types'
import type { BalancerResult } from '@/types/balancer.types'

type Props = { result: BalancerResult; names: Map<string, string>; foods: Map<string, Food>; targets: { calories: number; protein: number; carbs: number; fat: number; maxBudget?: number }; onLog: (force?: boolean) => void; onFavorite?: () => void }
const macros = [['calories', 'Calories'], ['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat']] as const
const micronutrientLabels: Record<MicronutrientKey, string> = {
  sodiumMg: 'Sodium',
  potassiumMg: 'Potassium',
  magnesiumMg: 'Magnesium',
  calciumMg: 'Calcium',
  zincMg: 'Zinc',
  ironMg: 'Iron',
  seleniumMcg: 'Selenium',
  vitaminDMcg: 'Vitamin D',
  vitaminB6Mg: 'Vitamin B6',
  vitaminB12Mcg: 'Vitamin B12',
  vitaminCMg: 'Vitamin C',
}

export function BalancerResultsCard({ result, names, foods, targets, onLog, onFavorite }: Props) {
  const { t } = useT()
  const [showMicros, setShowMicros] = useState(false)
  const [logAnyway, setLogAnyway] = useState(false)

  const allergenSummary = useMemo(() => {
    const set = new Set<string>()
    for (const item of result.solution) {
      const food = foods.get(item.foodId)
      for (const tag of food?.allergenTags ?? []) set.add(tag)
    }
    return [...set]
  }, [foods, result.solution])

  const micros = useMemo(() => {
    const totals = createEmptyMicronutrientTotals()
    for (const item of result.solution) {
      const food = foods.get(item.foodId)
      if (!food?.micros) continue
      const scale = item.grams / 100
      for (const key of MICRONUTRIENT_KEYS) {
        totals[key] += (food.micros[key] ?? 0) * scale
      }
    }
    return totals
  }, [foods, result.solution])

  const budgetStatus = typeof targets.maxBudget === 'number' ? `€${result.totalCost.toFixed(2)} / €${targets.maxBudget.toFixed(2)}` : `€${result.totalCost.toFixed(2)} · budget off`

  return <div className="mt-5 border-t border-slate-800 pt-4"><div className="flex items-center justify-between"><h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Solver result</h3><span className={`rounded-full px-2 py-1 text-xs ${result.status === 'feasible' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>{result.status}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{result.solution.map((item) => <div key={item.foodId} className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2"><span className="text-sm text-slate-500">{names.get(item.foodId) ?? item.foodId}</span><strong className="ml-2 text-lg text-slate-100">{item.grams}g</strong></div>)}</div><div className="mt-3 space-y-2 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300"><div className="flex items-center justify-between"><span>Meal price</span><strong className="text-emerald-300">€{result.totalCost.toFixed(2)}</strong></div><div className="flex items-center justify-between"><span>Budget</span><strong>{budgetStatus}</strong></div>{allergenSummary.length > 0 ? <div className="flex items-center justify-between gap-3"><span>Allergens</span><span className="text-right text-amber-300">{allergenSummary.join(', ')}</span></div> : <div className="flex items-center justify-between"><span>Allergens</span><span className="text-slate-500">none</span></div>}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{macros.map(([key, label]) => { const actual = result.totalMacros[key]; const target = targets[key]; const delta = actual - target; const tolerance = key === 'calories' ? 10 : 2; const percent = target > 0 ? Math.min(100, actual / target * 100) : 0; const healthy = Math.abs(delta) <= tolerance; return <div key={key}><div className={`flex justify-between text-xs ${healthy ? 'text-slate-500' : 'text-rose-300'}`}><span>{label}</span><span>{actual.toFixed(1)} / {target} ({delta >= 0 ? '+' : ''}{delta.toFixed(1)})</span></div><div className="mt-1 h-2 rounded-full bg-slate-800"><div className={`h-2 rounded-full ${healthy ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${percent}%` }} /></div></div> })}</div><div className="mt-3 rounded-md border border-slate-800 bg-slate-950/40 p-3"><button type="button" onClick={() => setShowMicros((value) => !value)} className="flex w-full items-center justify-between text-left text-[10px] font-medium uppercase tracking-[0.12em] text-slate-300"><span>Meal micros</span><span>{showMicros ? '−' : '+'}</span></button>{showMicros ? <div className="mt-3 space-y-2">{MICRONUTRIENT_KEYS.filter((key) => (resolveMicronutrientTargets()[key] ?? 0) > 0).map((key) => { const target = resolveMicronutrientTargets()[key]; const value = micros[key] ?? 0; const percent = getMicronutrientProgress(value, target); return <div key={key} className="space-y-1"><div className="flex items-center justify-between gap-2 text-[10px] text-slate-400"><span>{micronutrientLabels[key]}</span><span>{value.toFixed(0)}/{target.toFixed(0)}</span></div><div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.min(100, percent)}%` }} /></div></div> })}</div> : null}</div><p className="mt-3 text-xs text-slate-500">Delta: P {result.deviation.deltaProtein.toFixed(1)}g · C {result.deviation.deltaCarbs.toFixed(1)}g · F {result.deviation.deltaFat.toFixed(1)}g</p><div className="mt-4 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={logAnyway} onChange={(event) => setLogAnyway(event.target.checked)} className="h-4 w-4 rounded border-slate-600 bg-slate-950 accent-emerald-400" />Log anyway</label><Button type="button" disabled={!logAnyway && result.status === 'infeasible'} onClick={() => onLog(logAnyway)}><Save className="mr-2 h-4 w-4" />Log this meal</Button></div></div>
}
