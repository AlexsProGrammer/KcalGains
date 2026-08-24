import { db } from '@/db'
import { MealSchema } from '@/schemas/meal.schema'
import { calculateMealMicrosFromItems } from '@/services/micronutrientTargetService'
import type { BalancerResult } from '@/types/balancer.types'
import type { Meal } from '@/types'

export type MealType = Meal['mealType']

export async function commitBalancedMealToLog(
  result: BalancerResult,
  mealType: MealType,
  date: string,
): Promise<Meal> {
  const itemEntries = result.solution.filter((item) => item.grams > 0)
  const items = await Promise.all(itemEntries.map(async (item) => {
    const food = await db.foods.get(item.foodId)
    return {
      foodId: item.foodId,
      amountInGrams: item.grams,
      calories: item.computedCalories,
      protein: item.computedProtein,
      carbs: item.computedCarbs,
      fat: item.computedFat,
      food,
    }
  }))

  const meal = MealSchema.parse({
    id: crypto.randomUUID(),
    date,
    mealType,
    items: items.map(({ foodId, amountInGrams, calories, protein, carbs, fat }) => ({
      foodId,
      amountInGrams,
      calories,
      protein,
      carbs,
      fat,
    })),
    totalCalories: result.totalMacros.calories,
    totalProtein: result.totalMacros.protein,
    totalCarbs: result.totalMacros.carbs,
    totalFat: result.totalMacros.fat,
    totalMicros: calculateMealMicrosFromItems(items),
  })

  await db.transaction('rw', db.meals, async () => {
    await db.meals.add(meal)
  })

  return meal
}

export function useMealLogger() {
  return { commitBalancedMealToLog }
}
