import { X } from 'lucide-react'
import { useAiPromptGenerator } from '@/hooks/useAiPromptGenerator'
import { Button } from '@/components/ui/button'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { PromptCopyCard } from '@/components/ai-bridge/PromptCopyCard'
import type { PromptMode } from '@/services/promptSynthesizerService'

type Props = { open: boolean; onClose: () => void }

export function PromptGeneratorModal({ open, onClose }: Props) {
  const generator = useAiPromptGenerator()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-400">AI bridge</p>
            <h2 className="text-lg font-semibold text-slate-100">
              {generator.mode === 'meal' ? 'Generate a meal prompt' : 'Convert a log into backup JSON'}
            </h2>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label="Close prompt generator">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4">
          <Field label="Prompt mode">
            <SelectInput value={generator.mode} onChange={(event) => generator.setMode(event.target.value as PromptMode)}>
              <option value="meal">Suggest a meal</option>
              <option value="import">Convert tracked text to importable JSON</option>
            </SelectInput>
          </Field>
        </div>

        {generator.mode === 'meal' ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Meal type">
              <SelectInput
                value={generator.context.mealType}
                onChange={(event) => generator.setContext({ mealType: event.target.value as typeof generator.context.mealType })}
              >
                <option value="flexible">Flexible</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack</option>
              </SelectInput>
            </Field>
            <Field label="Max ingredients">
              <TextInput
                type="number"
                min="1"
                value={generator.context.maxIngredients}
                onChange={(event) => generator.setContext({ maxIngredients: Number(event.target.value) })}
              />
            </Field>
          </div>
        ) : (
          <div className="mt-3">
            <Field label="Your tracked meals or chat transcript" hint="Pasted here so the model can convert it; nothing leaves this device until you copy the prompt.">
              <textarea
                value={generator.sourceText}
                onChange={(event) => generator.setSourceText(event.target.value)}
                placeholder={'Monday breakfast: 80g oats, 250ml milk, 1 banana\nLunch: 150g chicken, 200g rice...'}
                className="min-h-32 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 outline-none focus:border-emerald-400"
              />
            </Field>
            <p className="mt-2 text-xs text-slate-500">
              Copy the JSON reply into a `.json` file, then import it from Backup and restore using merge mode.
            </p>
          </div>
        )}

        <div className="mt-4">
          <PromptCopyCard
            prompt={generator.prompt}
            copied={generator.copied}
            isCopying={generator.isCopying}
            error={generator.copyError}
            onCopy={() => void generator.copyPrompt()}
          />
        </div>
      </div>
    </div>
  )
}
