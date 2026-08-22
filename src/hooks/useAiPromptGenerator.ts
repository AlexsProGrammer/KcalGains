import { useEffect, useState } from 'react'
import { db } from '@/db'
import { copyToClipboard } from '@/services/clipboardService'
import { resolveDailyTargets } from '@/services/targetResolverService'
import { generatePrompt } from '@/services/promptSynthesizerService'
import type { PromptContext } from '@/types'

const defaultContext: PromptContext = {
  remainingMacros: { calories: 500, protein: 40, carbs: 50, fat: 15 },
  mealType: 'flexible',
  pantryFoods: [],
  dietaryPreferences: [],
  maxIngredients: 4,
}

export function useAiPromptGenerator(initialContext: Partial<PromptContext> = {}) {
  const [context, setContext] = useState<PromptContext>({ ...defaultContext, ...initialContext, remainingMacros: { ...defaultContext.remainingMacros, ...initialContext.remainingMacros } })
  const [prompt, setPrompt] = useState(() => generatePrompt(context))
  const [isCopying, setIsCopying] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true

    Promise.all([
      db.profile.toCollection().first(),
      db.settings.get('app-settings'),
    ]).then(([profile, settings]) => {
      if (!active) return
      if (settings?.moduleChaining === false || settings?.autoTargetsFromGoal === false) return

      const resolved = resolveDailyTargets({
        profile,
        settings,
        recentWeightKg: profile?.weightKg,
      })

      const nextContext: PromptContext = {
        ...context,
        remainingMacros: {
          calories: resolved.calories,
          protein: resolved.protein,
          carbs: resolved.carbs,
          fat: resolved.fat,
        },
      }

      setContext(nextContext)
      setPrompt(generatePrompt(nextContext))
    })

    return () => { active = false }
  }, [])

  function updateContext(updates: Partial<PromptContext>) {
    setContext((current) => {
      const next = { ...current, ...updates, remainingMacros: { ...current.remainingMacros, ...updates.remainingMacros } }
      setPrompt(generatePrompt(next))
      setCopied(false)
      return next
    })
  }

  async function copyPrompt(): Promise<boolean> {
    setIsCopying(true)
    setCopyError(null)
    setCopied(false)
    const success = await copyToClipboard(prompt)
    if (success) setCopied(true)
    else setCopyError('The prompt could not be copied. Select and copy it manually.')
    setIsCopying(false)
    return success
  }

  return { context, copyError, copyPrompt, copied, isCopying, prompt, setContext: updateContext }
}
