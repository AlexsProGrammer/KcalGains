import { X } from 'lucide-react'
import { useAiPromptGenerator } from '@/hooks/useAiPromptGenerator'
import { Button } from '@/components/ui/button'
import { PromptCopyCard } from '@/components/ai-bridge/PromptCopyCard'

type Props = { open: boolean; onClose: () => void }
export function PromptGeneratorModal({ open, onClose }: Props) {
  const generator = useAiPromptGenerator()
  if (!open) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"><div className="w-full max-w-2xl rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-emerald-400">AI bridge</p><h2 className="text-lg font-semibold text-slate-100">Generate a meal prompt</h2></div><Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close prompt generator"><X className="h-4 w-4" /></Button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label><span className="mb-1 block text-xs text-slate-400">Meal type</span><select value={generator.context.mealType} onChange={(event) => generator.setContext({ mealType: event.target.value as typeof generator.context.mealType })} className="min-h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100"><option value="flexible">Flexible</option><option value="breakfast">Breakfast</option><option value="lunch">Lunch</option><option value="dinner">Dinner</option><option value="snack">Snack</option></select></label><label><span className="mb-1 block text-xs text-slate-400">Max ingredients</span><input type="number" min="1" value={generator.context.maxIngredients} onChange={(event) => generator.setContext({ maxIngredients: Number(event.target.value) })} className="min-h-9 w-full rounded border border-slate-700 bg-slate-950 px-2 text-sm text-slate-100" /></label></div><div className="mt-4"><PromptCopyCard prompt={generator.prompt} copied={generator.copied} isCopying={generator.isCopying} error={generator.copyError} onCopy={() => void generator.copyPrompt()} /></div></div></div>
}
