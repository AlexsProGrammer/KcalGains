import { X } from 'lucide-react'
import { useAiPromptGenerator } from '@/hooks/useAiPromptGenerator'
import { Button } from '@/components/ui/button'
import { Field, SelectInput, TextInput } from '@/components/ui/field'
import { useT } from '@/i18n'
import { PromptCopyCard } from '@/components/ai-bridge/PromptCopyCard'
import type { PromptMode } from '@/services/promptSynthesizerService'

type Props = { open: boolean; onClose: () => void }

export function PromptGeneratorModal({ open, onClose }: Props) {
  const generator = useAiPromptGenerator()
  const { t } = useT()
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-emerald-400">{t.more.aiBridgeTag}</p>
            <h2 className="text-lg font-semibold text-slate-100">
              {generator.mode === 'meal' ? t.more.mealPromptTitle : t.more.logConvertTitle}
            </h2>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={onClose} aria-label={t.more.closePrompt}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4">
          <Field label={t.more.promptMode}>
            <SelectInput value={generator.mode} onChange={(event) => generator.setMode(event.target.value as PromptMode)}>
              <option value="meal">{t.more.suggestMeal}</option>
              <option value="import">{t.more.convertImport}</option>
            </SelectInput>
          </Field>
        </div>

        {generator.mode === 'meal' ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label={t.common.mealType}>
              <SelectInput
                value={generator.context.mealType}
                onChange={(event) => generator.setContext({ mealType: event.target.value as typeof generator.context.mealType })}
              >
                <option value="flexible">{t.common.mealTypes.flexible}</option>
                <option value="breakfast">{t.common.mealTypes.breakfast}</option>
                <option value="lunch">{t.common.mealTypes.lunch}</option>
                <option value="dinner">{t.common.mealTypes.dinner}</option>
                <option value="snack">{t.common.mealTypes.snack}</option>
              </SelectInput>
            </Field>
            <Field label={t.more.maxIngredients}>
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
            <Field label={t.more.trackedText} hint={t.more.trackedTextHint}>
              <textarea
                value={generator.sourceText}
                onChange={(event) => generator.setSourceText(event.target.value)}
                placeholder={'Monday breakfast: 80g oats, 250ml milk, 1 banana\nLunch: 150g chicken, 200g rice...'}
                className="min-h-32 w-full rounded-md border border-slate-700 bg-slate-950 p-3 text-xs text-slate-100 outline-none focus:border-emerald-400"
              />
            </Field>
            <p className="mt-2 text-xs text-slate-500">
              {t.more.jsonToFileHint}
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
