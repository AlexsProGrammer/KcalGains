import { useState } from 'react'
import { db } from '@/db'
import { AiMealResponseSchema } from '@/schemas/aiResponse.schema'
import { parseAndValidateAiResponse, resolveAndLinkFoods, type LinkedAiFood } from '@/services/aiResponseParserService'
import type { AiMealResponse, Meal } from '@/types'

export function useAiIngestion() {
  const [rawText, setRawText] = useState('')
  const [parsedMeal, setParsedMeal] = useState<AiMealResponse | null>(null)
  const [linkedFoods, setLinkedFoods] = useState<LinkedAiFood[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isCommitted, setIsCommitted] = useState(false)

  async function validate(text = rawText) {
    setRawText(text)
    setIsCommitted(false)
    const result = parseAndValidateAiResponse(text)
    if (!result.success) {
      setParsedMeal(null)
      setLinkedFoods([])
      setErrors(result.errors)
      return result
    }

    const links = await resolveAndLinkFoods(result.data, db)
    setParsedMeal(result.data)
    setLinkedFoods(links)
    setErrors([])
    return { ...result, links }
  }

  async function commit(mealType: Meal['mealType'] = 'flexible' as Meal['mealType'], date = new Date().toISOString().slice(0, 10)): Promise<Meal | undefined> {
    if (!parsedMeal || linkedFoods.length === 0) return undefined
    setIsProcessing(true)
    try {
      const meal = AiMealResponseSchema.parse(parsedMeal)
      const mealRecord: Meal = {
        id: crypto.randomUUID(),
        date,
        mealType: mealType === 'flexible' ? 'snack' : mealType,
        items: linkedFoods.map(({ item, foodId }) => ({ foodId: foodId!, amountInGrams: item.grams, calories: item.calories, protein: item.protein, carbs: item.carbs, fat: item.fat })),
        totalCalories: meal.totalCalories,
        totalProtein: meal.totalProtein,
        totalCarbs: meal.totalCarbs,
        totalFat: meal.totalFat,
      }
      await db.transaction('rw', [db.foods, db.meals], async () => {
        const newFoods = linkedFoods.flatMap(({ newFood }) => newFood ? [newFood] : [])
        if (newFoods.length > 0) await db.foods.bulkAdd(newFoods)
        await db.meals.add(mealRecord)
      })
      setIsCommitted(true)
      return mealRecord
    } finally {
      setIsProcessing(false)
    }
  }

  function updateItem(index: number, grams: number) {
    if (!parsedMeal) return
    const nextItems = parsedMeal.items.map((item, itemIndex) => {
      if (itemIndex !== index) return item
      const factor = item.grams > 0 ? grams / item.grams : 0
      return {
        ...item,
        grams,
        calories: item.calories * factor,
        protein: item.protein * factor,
        carbs: item.carbs * factor,
        fat: item.fat * factor,
      }
    })
    const nextMeal = {
      ...parsedMeal,
      items: nextItems,
      totalCalories: nextItems.reduce((total, item) => total + item.calories, 0),
      totalProtein: nextItems.reduce((total, item) => total + item.protein, 0),
      totalCarbs: nextItems.reduce((total, item) => total + item.carbs, 0),
      totalFat: nextItems.reduce((total, item) => total + item.fat, 0),
    }
    setParsedMeal(AiMealResponseSchema.parse(nextMeal))
    setLinkedFoods((current) => current.map((link, linkIndex) => linkIndex === index ? { ...link, item: nextItems[index] } : link))
  }

  return { commit, errors, isCommitted, isProcessing, linkedFoods, parsedMeal, rawText, setRawText, updateItem, validate }
}
