import type { MacroTarget } from '@/types/balancer.types'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n'

type Props = { targets: MacroTarget; onChange: (updates: Partial<MacroTarget>) => void }
const fields = [['calories', 'Calories'], ['protein', 'Protein'], ['carbs', 'Carbs'], ['fat', 'Fat']] as const

export function MacroTargetControls({ targets, onChange }: Props) {
  const { t } = useT()
  const budgetEnabled = typeof targets.maxBudget === 'number' && Number.isFinite(targets.maxBudget)

  return <div><div className="grid gap-3 sm:grid-cols-4">{fields.map(([field, label]) => <label key={field}><span className="mb-1 block text-xs font-medium text-slate-400">{label}</span><input type="number" min="0" step="any" value={targets[field]} onChange={(event) => onChange({ [field]: Number(event.target.value) })} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400" /></label>)}</div><div className="mt-3 flex flex-wrap items-end gap-3"><label className="max-w-xs flex-1"><span className="mb-1 block text-xs font-medium text-slate-400">{t.common.priority}</span><select value={targets.priority} onChange={(event) => onChange({ priority: event.target.value as MacroTarget['priority'] })} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100"><option value="balanced">{t.common.balanced}</option><option value="protein-first">{t.common.proteinFirst}</option><option value="exact-calories">{t.common.exactCalories}</option></select></label><label className="max-w-[180px] flex-1"><div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-400"><span>{t.common.budgetCap}</span><button type="button" onClick={() => onChange({ maxBudget: budgetEnabled ? undefined : (targets.maxBudget ?? 15) })} className="text-[10px] uppercase tracking-wide text-emerald-300">{budgetEnabled ? 'on' : 'off'}</button></div><input type="number" min="0" step="0.5" value={budgetEnabled ? targets.maxBudget ?? 15 : 0} disabled={!budgetEnabled} onChange={(event) => onChange({ maxBudget: Number(event.target.value) || undefined })} className="min-h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50" /></label><Button type="button" size="sm" variant="secondary" onClick={() => onChange({ calories: 300, protein: 30, carbs: 25, fat: 10 })}>{t.common.highProteinSnack}</Button></div></div>
}
