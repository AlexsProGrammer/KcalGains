import type { MacroTarget } from '@/types/balancer.types'
import { Button } from '@/components/ui/button'

type Props = { targets: MacroTarget; onChange: (updates: Partial<MacroTarget>) => void }
const fields = [['calories', 'Calories'], ['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat']] as const

export function MacroTargetControls({ targets, onChange }: Props) {
  return <div><div className="grid gap-3 sm:grid-cols-4">{fields.map(([field, label]) => <label key={field}><span className="mb-1 block text-xs font-medium text-slate-400">{label}</span><input type="number" min="0" step="any" value={targets[field]} onChange={(event) => onChange({ [field]: Number(event.target.value) })} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" /></label>)}</div><div className="mt-3 flex flex-wrap items-end gap-3"><label className="max-w-xs flex-1"><span className="mb-1 block text-xs font-medium text-slate-400">Priority</span><select value={targets.priority} onChange={(event) => onChange({ priority: event.target.value as MacroTarget['priority'] })} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"><option value="balanced">Balanced</option><option value="protein-first">Protein first</option><option value="exact-calories">Exact calories</option></select></label><Button type="button" size="sm" variant="secondary" onClick={() => onChange({ calories: 300, protein: 30, carbs: 25, fat: 10 })}>High-protein snack</Button></div></div>
}
