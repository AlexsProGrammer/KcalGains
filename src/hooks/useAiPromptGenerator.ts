import { useEffect, useState } from 'react'
import { db } from '@/db'
import { copyToClipboard } from '@/services/clipboardService'
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
    const date = new Date().toISOString().slice(0, 10)
    void db.dailyLogs.where('date').equals(date).last().then((dailyLog) => {
      if (!active || !dailyLog) return
      const nextContext: PromptContext = {
        ...context,
        remainingMacros: {
          calories: dailyLog.targetCalories,
          protein: dailyLog.targetProtein,
          carbs: dailyLog.targetCarbs,
          fat: dailyLog.targetFat,
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
